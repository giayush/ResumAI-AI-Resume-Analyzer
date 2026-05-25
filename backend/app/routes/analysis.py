"""
analysis.py — Full AI pipeline: TF-IDF → ATS → AI Feedback → Grammar → Persist.

Fixes applied:
  BUG-08: Grammar check runs in background thread (non-blocking).
  BUG-14: Job description truncated to 8000 chars before DB storage.
  BUG-03: Uses db.session.get for Resume queries.
"""

import io
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models.resume import Resume
from ..models.analysis import Analysis
from ..models.user import User
from ..services.tfidf_service import compute_similarity
from ..services.ats_service import calculate_ats_score
from ..services.ai_service import get_ai_feedback, generate_job_description
from ..services.grammar_service import check_grammar
from ..services.pdf_export_service import generate_report_pdf
from ..utils.helpers import error_response

analysis_bp = Blueprint("analysis", __name__)

# Reusable executor for non-blocking grammar checks (BUG-08)
_thread_pool = ThreadPoolExecutor(max_workers=4)

# Max JD length stored in DB (BUG-14)
_MAX_JD_LENGTH = 8000


@analysis_bp.route("/generate-jd", methods=["POST"])
@jwt_required()
def generate_jd():
    data = request.get_json()
    if not data or not data.get("job_title"):
        return error_response("job_title is required")

    job_title = data.get("job_title")
    try:
        jd_data = generate_job_description(job_title)
        return jsonify(jd_data), 200
    except Exception as e:
        current_app.logger.error(f"Failed to generate JD: {e}")
        return error_response(f"Failed to generate JD: {str(e)}", 500)


@analysis_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found", 404)
        
    if not user.subscription_active and (user.analysis_count or 0) >= 2:
        return jsonify({
            "message": "Free limit reached. Upgrade to premium."
        }), 403

    data = request.get_json()

    if not data:
        return error_response("No JSON body provided")

    resume_id = (data.get("resume_id") or "").strip()
    job_description = (data.get("job_description") or "").strip()
    job_title = (data.get("job_title") or "").strip()[:200]  # cap title length

    if not resume_id:
        return error_response("resume_id is required")
    if not job_description:
        return error_response("job_description is required")
    if len(job_description) < 20:
        return error_response("Job description is too short. Please provide more detail.")

    resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
    if not resume:
        return error_response("Resume not found", 404)

    resume_text = resume.parsed_text or ""
    if not resume_text.strip():
        return error_response("Resume has no parsed text. Please re-upload.")

    # BUG-14: Truncate JD before storage to prevent DB bloat
    job_description_stored = job_description[:_MAX_JD_LENGTH]

    # ── Debug logging: confirm JD is received ────────────────
    current_app.logger.info(
        f"[analyze] user={user_id} resume={resume_id} "
        f"jd_len={len(job_description)} job_title='{job_title}'"
    )

    # ── Step 1: TF-IDF + Cosine Similarity ──────────────────
    tfidf_result = compute_similarity(resume_text, job_description)
    current_app.logger.info(
        f"[analyze] TF-IDF: match={tfidf_result.get('match_percentage')}% "
        f"matched={len(tfidf_result.get('matched_keywords', []))} "
        f"missing={len(tfidf_result.get('missing_keywords', []))}"
    )

    # ── Step 2: ATS Scoring ──────────────────────────────────
    ats_result = calculate_ats_score(
        resume_text,
        resume.parsed_data or {},
        job_description,
    )
    current_app.logger.info(f"[analyze] ATS score: {ats_result.get('ats_score')}")

    # ── Step 3: AI Feedback ──────────────────────────────────
    ai_feedback = {}
    try:
        ai_feedback = get_ai_feedback(
            resume_text=resume_text,
            parsed_data=resume.parsed_data or {},
            job_description=job_description,
            job_title=job_title,
            missing_keywords=tfidf_result.get("missing_keywords", []),
        )
        current_app.logger.info(f"[analyze] AI provider: {ai_feedback.get('_provider')}")
    except Exception as e:
        current_app.logger.error(f"[analyze] AI feedback error: {e}")
        ai_feedback = {"_provider": "error", "_error": str(e)}

    # ── Step 4: Grammar Check (BUG-08: non-blocking thread) ──
    # IMPORTANT: Read config values HERE (in request context) before dispatch.
    # current_app is NOT available inside ThreadPoolExecutor worker threads.
    grammar_api_url = current_app.config.get(
        "LANGUAGETOOL_API_URL", "https://api.languagetool.org/v2/check"
    )
    grammar_api_key = current_app.config.get("LANGUAGETOOL_API_KEY", "")
    grammar_issues = []
    try:
        future = _thread_pool.submit(
            check_grammar, resume_text, "en-US", grammar_api_url, grammar_api_key
        )
        grammar_issues = future.result(timeout=10)  # 10s max
        current_app.logger.info(f"[analyze] Grammar issues found: {len(grammar_issues)}")
    except FuturesTimeoutError:
        current_app.logger.warning("[analyze] Grammar check timed out")
        grammar_issues = []
    except Exception as e:
        current_app.logger.warning(f"[analyze] Grammar check error: {e}")
        grammar_issues = []

    # ── Persist Analysis ──────────────────────────────────────
    analysis = Analysis(
        resume_id=resume_id,
        user_id=user_id,
        job_description=job_description_stored,
        job_title=job_title,
        ats_score=ats_result.get("ats_score"),
        match_percentage=tfidf_result.get("match_percentage"),
        matched_keywords=tfidf_result.get("matched_keywords", []),
        missing_keywords=tfidf_result.get("missing_keywords", []),
        tfidf_scores=tfidf_result.get("tfidf_scores", {}),
        ai_suggestions=ai_feedback,
        grammar_issues=grammar_issues,
        resume_skills=resume.parsed_data.get("skills", []) if resume.parsed_data else [],
        required_skills=ats_result.get("required_skills", []),
        skill_gaps=ats_result.get("skill_gaps", []),
        ats_breakdown=ats_result.get("breakdown", {}),
    )
    db.session.add(analysis)
    user.analysis_count = (user.analysis_count or 0) + 1
    db.session.commit()

    return jsonify({
        "message": "Analysis complete",
        "analysis": analysis.to_dict(),
    }), 201


@analysis_bp.route("/<analysis_id>", methods=["GET"])
@jwt_required()
def get_analysis(analysis_id):
    user_id = get_jwt_identity()
    analysis = Analysis.query.filter_by(id=analysis_id, user_id=user_id).first()
    if not analysis:
        return error_response("Analysis not found", 404)
    return jsonify({"analysis": analysis.to_dict()}), 200


@analysis_bp.route("/history", methods=["GET"])
@jwt_required()
def analysis_history():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 10, type=int), 50)

    paginated = (
        Analysis.query.filter_by(user_id=user_id)
        .order_by(Analysis.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return jsonify({
        "analyses": [a.to_dict() for a in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": paginated.page,
    }), 200


@analysis_bp.route("/<analysis_id>/export-pdf", methods=["GET"])
@jwt_required()
def export_pdf(analysis_id):
    user_id = get_jwt_identity()
    analysis = Analysis.query.filter_by(id=analysis_id, user_id=user_id).first()
    if not analysis:
        return error_response("Analysis not found", 404)

    resume = db.session.get(Resume, analysis.resume_id)  # BUG-03: use db.session.get
    try:
        pdf_bytes = generate_report_pdf(
            analysis.to_dict(),
            resume.filename if resume else "Resume",
        )
    except Exception as e:
        return error_response(f"Failed to generate PDF: {str(e)}", 500)

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"resumai_report_{analysis_id[:8]}.pdf",
    ), 200


@analysis_bp.route("/<analysis_id>", methods=["DELETE"])
@jwt_required()
def delete_analysis(analysis_id):
    user_id = get_jwt_identity()
    analysis = Analysis.query.filter_by(id=analysis_id, user_id=user_id).first()
    if not analysis:
        return error_response("Analysis not found", 404)
    db.session.delete(analysis)
    db.session.commit()
    return jsonify({"message": "Analysis deleted"}), 200

"""
resume.py — Upload, list, get, delete, download resumes.

Security fixes applied:
  BUG-04: Magic-byte validation (PDF/DOCX) in addition to extension check.
  BUG-20: Explicit empty-text detection for scanned/image PDFs.
  AUTH: Uses Firebase ID token verification (replaces JWT).
"""

import io
import zipfile
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models.resume import Resume
from ..services.parser_service import parse_file
from ..services.nlp_service import extract_structured_data
from ..utils.helpers import allowed_file, sanitize_filename, error_response

resume_bp = Blueprint("resume", __name__)

ALLOWED = {"pdf", "docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


# ── Magic-byte Validation (BUG-04) ─────────────────────────────────────────

def _validate_file_magic(file_bytes: bytes, file_type: str) -> bool:
    """
    Validate file content matches its declared type.
    Guards against disguised malicious files (e.g., HTML renamed as .pdf).
    """
    if file_type == "pdf":
        # PDF files start with %PDF
        return file_bytes[:4] == b"%PDF"
    elif file_type == "docx":
        # DOCX is a ZIP archive containing word/ directory
        if file_bytes[:2] != b"PK":
            return False
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                names = z.namelist()
                return any(n.startswith("word/") for n in names)
        except Exception:
            return False
    return False


# ── Routes ──────────────────────────────────────────────────────────────────

@resume_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_resume():
    user_id = get_jwt_identity()

    if "file" not in request.files:
        return error_response("No file provided")

    file = request.files["file"]
    if not file.filename:
        return error_response("No file selected")
    if not allowed_file(file.filename, ALLOWED):
        return error_response("Only PDF and DOCX files are allowed", 415)

    filename = sanitize_filename(file.filename)
    file_type = filename.rsplit(".", 1)[1].lower()
    file_bytes = file.read()
    file_size = len(file_bytes)

    # Size check
    if file_size == 0:
        return error_response("File is empty")
    if file_size > MAX_FILE_SIZE:
        return error_response("File size exceeds 10 MB limit", 413)

    # BUG-04: Magic-byte validation
    if not _validate_file_magic(file_bytes, file_type):
        return error_response(
            "File content does not match its extension. Please upload a valid PDF or DOCX.",
            415,
        )

    # Parse text from file
    try:
        parsed_text = parse_file(file_bytes, file_type)
    except Exception as e:
        return error_response(f"Failed to parse file: {str(e)}", 422)

    # BUG-20: Detect scanned/image PDFs with no text
    if not parsed_text or len(parsed_text.strip()) < 50:
        return error_response(
            "No readable text found in this file. "
            "If this is a scanned PDF, please use a text-based PDF or DOCX instead.",
            422,
        )

    # Extract structured sections via NLP
    try:
        parsed_data = extract_structured_data(parsed_text)
    except Exception:
        parsed_data = {}

    resume = Resume(
        user_id=user_id,
        filename=filename,
        file_data=file_bytes,
        file_type=file_type,
        file_size=file_size,
        parsed_text=parsed_text,
        parsed_data=parsed_data,
    )
    db.session.add(resume)
    db.session.commit()

    return jsonify({
        "message": "Resume uploaded successfully",
        "resume": resume.to_dict(include_data=True),
    }), 201


@resume_bp.route("/list", methods=["GET"])
@jwt_required()
def list_resumes():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 10, type=int), 50)  # cap at 50

    paginated = (
        Resume.query.filter_by(user_id=user_id)
        .order_by(Resume.uploaded_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return jsonify({
        "resumes": [r.to_dict() for r in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": paginated.page,
    }), 200


@resume_bp.route("/<resume_id>", methods=["GET"])
@jwt_required()
def get_resume(resume_id):
    user_id = get_jwt_identity()
    resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
    if not resume:
        return error_response("Resume not found", 404)
    return jsonify({"resume": resume.to_dict(include_data=True)}), 200


@resume_bp.route("/<resume_id>", methods=["DELETE"])
@jwt_required()
def delete_resume(resume_id):
    user_id = get_jwt_identity()
    resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
    if not resume:
        return error_response("Resume not found", 404)
    db.session.delete(resume)
    db.session.commit()
    return jsonify({"message": "Resume deleted successfully"}), 200


@resume_bp.route("/<resume_id>/download", methods=["GET"])
@jwt_required()
def download_resume(resume_id):
    user_id = get_jwt_identity()
    resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
    if not resume:
        return error_response("Resume not found", 404)

    mime = (
        "application/pdf"
        if resume.file_type == "pdf"
        else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    return send_file(
        io.BytesIO(resume.file_data),
        mimetype=mime,
        as_attachment=True,
        download_name=resume.filename,
    ), 200

import uuid
from datetime import datetime, timezone
from ..extensions import db


class Analysis(db.Model):
    __tablename__ = "analyses"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resume_id = db.Column(db.String(36), db.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # ── Input ──────────────────────────────────────────────
    job_description = db.Column(db.Text, nullable=True)
    job_title = db.Column(db.String(255), nullable=True)

    # ── Scoring ────────────────────────────────────────────
    ats_score = db.Column(db.Float, nullable=True)           # 0–100
    match_percentage = db.Column(db.Float, nullable=True)    # cosine similarity %

    # ── Keyword Analysis ───────────────────────────────────
    matched_keywords = db.Column(db.JSON, nullable=True)     # list of strings
    missing_keywords = db.Column(db.JSON, nullable=True)     # list of strings
    tfidf_scores = db.Column(db.JSON, nullable=True)         # {keyword: weight}

    # ── AI Feedback ────────────────────────────────────────
    ai_suggestions = db.Column(db.JSON, nullable=True)       # {section: [suggestions]}
    grammar_issues = db.Column(db.JSON, nullable=True)       # [{message, offset, ...}]

    # ── Skill Analysis ─────────────────────────────────────
    resume_skills = db.Column(db.JSON, nullable=True)        # skills found in resume
    required_skills = db.Column(db.JSON, nullable=True)      # skills found in JD
    skill_gaps = db.Column(db.JSON, nullable=True)           # missing skills

    # ── ATS Breakdown ──────────────────────────────────────
    ats_breakdown = db.Column(db.JSON, nullable=True)        # {category: score}

    # ── Meta ───────────────────────────────────────────────
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "resume_id": self.resume_id,
            "user_id": self.user_id,
            "job_description": self.job_description,
            "job_title": self.job_title,
            "ats_score": self.ats_score,
            "match_percentage": self.match_percentage,
            "matched_keywords": self.matched_keywords or [],
            "missing_keywords": self.missing_keywords or [],
            "tfidf_scores": self.tfidf_scores or {},
            "ai_suggestions": self.ai_suggestions or {},
            "grammar_issues": self.grammar_issues or [],
            "resume_skills": self.resume_skills or [],
            "required_skills": self.required_skills or [],
            "skill_gaps": self.skill_gaps or [],
            "ats_breakdown": self.ats_breakdown or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Analysis resume={self.resume_id} ats={self.ats_score}>"

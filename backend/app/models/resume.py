import uuid
from datetime import datetime, timezone
from ..extensions import db


class Resume(db.Model):
    __tablename__ = "resumes"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)
    file_data = db.Column(db.LargeBinary, nullable=False)  # Raw bytes stored in DB
    file_type = db.Column(db.String(10), nullable=False)   # 'pdf' | 'docx'
    file_size = db.Column(db.Integer, nullable=True)        # bytes
    parsed_text = db.Column(db.Text, nullable=True)         # Full extracted raw text
    parsed_data = db.Column(db.JSON, nullable=True)         # Structured sections JSON
    uploaded_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # ── Relationships ──────────────────────────────────────
    analyses = db.relationship("Analysis", backref="resume", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_data=False):
        result = {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "parsed_data": self.parsed_data,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
            "analysis_count": self.analyses.count(),
        }
        if include_data:
            result["parsed_text"] = self.parsed_text
        return result

    def __repr__(self):
        return f"<Resume {self.filename} user={self.user_id}>"

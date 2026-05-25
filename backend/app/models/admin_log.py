import uuid
from datetime import datetime, timezone
from ..extensions import db


class AdminLog(db.Model):
    __tablename__ = "admin_logs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    target_user_id = db.Column(db.String(36), nullable=True)
    details = db.Column(db.JSON, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "admin_id": self.admin_id,
            "action": self.action,
            "target_user_id": self.target_user_id,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

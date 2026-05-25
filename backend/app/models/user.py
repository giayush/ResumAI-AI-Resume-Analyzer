import uuid
from datetime import datetime, timezone
from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    firebase_uid = db.Column(db.String(128), unique=True, nullable=True, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=True)
    full_name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")  # 'user' | 'admin'
    avatar_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    subscription_active = db.Column(db.Boolean, default=False, nullable=True)
    subscription_expiry = db.Column(db.DateTime(timezone=True), nullable=True)
    analysis_count = db.Column(db.Integer, default=0)

    # ── Relationships ──────────────────────────────────────
    resumes = db.relationship("Resume", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    analyses = db.relationship("Analysis", backref="user", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "avatar_url": self.avatar_url,
            "is_active": self.is_active,
            "subscription_active": self.subscription_active,
            "subscription_expiry": self.subscription_expiry.isoformat() if self.subscription_expiry else None,
            "analysis_count": self.analysis_count or 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }

    def __init__(self, **kwargs):
        """Explicit constructor so type-checkers recognise SQLAlchemy columns as valid kwargs."""
        super().__init__(**kwargs)

    def __repr__(self):
        return f"<User {self.email}>"

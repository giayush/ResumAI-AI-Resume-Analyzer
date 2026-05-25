import uuid
from datetime import datetime, timezone
from ..extensions import db


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    order_id = db.Column(db.String(128), unique=True, nullable=False)
    payment_id = db.Column(db.String(128), unique=True, nullable=True)
    signature = db.Column(db.String(255), nullable=True)
    amount = db.Column(db.Integer, nullable=False)  # in paise
    currency = db.Column(db.String(10), default="INR")
    status = db.Column(db.String(20), default="pending")  # pending, success, failed
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # ── Relationships ──────────────────────────────────────
    user = db.relationship("User", backref=db.backref("payments", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "payment_id": self.payment_id,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

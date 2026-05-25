"""
user.py — User profile route (subscription status).

Auth: Firebase ID token (same as all other protected routes).
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.user import User

user_bp = Blueprint("user", __name__)


@user_bp.route("/me", methods=["GET"])
@jwt_required()
def get_user_me():
    """Return the current user's subscription status and analysis count."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "subscription_active": bool(user.subscription_active),
        "analysis_count": user.analysis_count or 0,
    }), 200

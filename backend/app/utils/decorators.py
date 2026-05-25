"""
decorators.py — Route-level access decorators using Firebase Auth.

admin_required: verifies Firebase token AND checks DB for admin role.
active_user_required: verifies Firebase token AND checks account is active.
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.user import User


def admin_required(fn):
    """
    Requires a valid JWT token from a user with role='admin'.
    """
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


def active_user_required(fn):
    """Requires valid JWT token AND an active account."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        if not user or not user.is_active:
            return jsonify({"error": "Account is inactive or not found"}), 403
        return fn(*args, **kwargs)
    return wrapper

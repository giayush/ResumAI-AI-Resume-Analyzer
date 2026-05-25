"""
auth.py — Firebase Email/Password authentication.

Flow:
  - Registration/Login is handled entirely by Firebase on the frontend.
  - /register: frontend calls Firebase, then hits this endpoint to upsert
    the user record in PostgreSQL using the verified Firebase UID.
  - /me: returns the current user's profile.
  - All routes (except /register) require a valid Firebase ID token.
"""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify

from ..extensions import db, bcrypt
from ..models.user import User
from ..utils.helpers import error_response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint("auth", __name__)


# ── Register / Sign Up ────────────────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Creates a new user record in the database with a hashed password.
    Returns a fresh JWT token for instant login.
    """
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()[:200]

    if not email or not password or not full_name:
        return error_response("All fields are required", 400)

    # Check duplicate email
    user = User.query.filter_by(email=email).first()
    if user:
        return error_response("An account with this email already exists", 400)

    # Hash the password and save the new user
    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(
        email=email,
        password_hash=pw_hash,
        full_name=full_name,
        subscription_active=False,
        analysis_count=0
    )
    db.session.add(user)
    print("REGISTER DEBUG:", {
        "email": email,
        "full_name": full_name,
        "user_exists": bool(user)
    })

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": str(e)
        }), 500

    # Generate JWT token
    access_token = create_access_token(identity=user.id)

    return jsonify({
        "message": "Account created successfully",
        "token": access_token,
        "user": user.to_dict(),
    }), 201


# ── JWT Login ─────────────────────────────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Validates user credentials against hashed password.
    Returns fresh JWT token and user profile on success.
    """
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    # Verify hashed password
    password_hash = getattr(user, 'password_hash', None)
    if password_hash is None or not bcrypt.check_password_hash(password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Update last login time
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    # Generate JWT token on success
    access_token = create_access_token(identity=user.id)

    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "user": user.to_dict()
    }), 200

# ── Get Current User ──────────────────────────────────────────────────────────

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found. Please complete registration.", 404)
    if not user.is_active:
        return error_response("Account is deactivated. Please contact support.", 403)
    return jsonify({"user": user.to_dict()}), 200

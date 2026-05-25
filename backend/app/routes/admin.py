from flask import Blueprint, request, jsonify
from sqlalchemy import func
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..models.user import User
from ..models.resume import Resume
from ..models.analysis import Analysis
from ..models.admin_log import AdminLog
from ..utils.decorators import admin_required
from ..utils.helpers import error_response, get_client_ip

admin_bp = Blueprint("admin", __name__)


def log_action(admin_id, action, target_user_id=None, details=None):
    log = AdminLog(
        admin_id=admin_id,
        action=action,
        target_user_id=target_user_id,
        details=details,
        ip_address=get_client_ip(),
    )
    db.session.add(log)
    db.session.commit()


@admin_bp.route("/stats", methods=["GET"])
@admin_required
def get_stats():
    total_users = User.query.count()
    total_resumes = Resume.query.count()
    total_analyses = Analysis.query.count()
    active_users = User.query.filter_by(is_active=True).count()

    avg_ats = db.session.query(func.avg(Analysis.ats_score)).scalar() or 0
    avg_match = db.session.query(func.avg(Analysis.match_percentage)).scalar() or 0

    return jsonify({
        "total_users": total_users,
        "active_users": active_users,
        "total_resumes": total_resumes,
        "total_analyses": total_analyses,
        "avg_ats_score": round(float(avg_ats), 1),
        "avg_match_percentage": round(float(avg_match), 1),
    }), 200


@admin_bp.route("/users", methods=["GET"])
@admin_required
def get_users():
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)  # BUG-25: cap to 100
    search = request.args.get("search", "").strip()[:200]  # BUG-01: limit search length

    query = User.query
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%"))
        )

    paginated = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    users_data = []
    for u in paginated.items:
        d = u.to_dict()
        d["resume_count"] = Resume.query.filter_by(user_id=u.id).count()
        d["analysis_count"] = Analysis.query.filter_by(user_id=u.id).count()
        d["is_active"] = u.is_active  # Ensure is_active always present
        users_data.append(d)

    return jsonify({
        "users": users_data,
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": paginated.page,
    }), 200


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    admin_id = get_jwt_identity()
    user = db.session.get(User, user_id)  # BUG-03
    if not user:
        return error_response("User not found", 404)
    if user.role == "admin":
        return error_response("Cannot delete an admin account", 403)

    log_action(admin_id, "DELETE_USER", user_id, {"email": user.email})
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"User {user.email} deleted"}), 200


@admin_bp.route("/users/<user_id>/toggle-active", methods=["PATCH"])
@admin_required
def toggle_active(user_id):
    admin_id = get_jwt_identity()
    user = db.session.get(User, user_id)  # BUG-03
    if not user:
        return error_response("User not found", 404)

    user.is_active = not user.is_active
    log_action(
        admin_id,
        "TOGGLE_USER_ACTIVE",
        user_id,
        {"email": user.email, "is_active": user.is_active},
    )
    db.session.commit()
    return jsonify({"message": "User status updated", "is_active": user.is_active}), 200


@admin_bp.route("/logs", methods=["GET"])
@admin_required
def get_logs():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    paginated = AdminLog.query.order_by(AdminLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "logs": [log.to_dict() for log in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": paginated.page,
    }), 200


@admin_bp.route("/users/<user_id>/make-admin", methods=["PATCH"])
@admin_required
def make_admin(user_id):
    admin_id = get_jwt_identity()
    user = db.session.get(User, user_id)  # BUG-03
    if not user:
        return error_response("User not found", 404)
    if user.role == "admin":
        return error_response("User is already an admin", 409)
    user.role = "admin"
    log_action(admin_id, "PROMOTE_TO_ADMIN", user_id, {"email": user.email})
    db.session.commit()
    return jsonify({"message": f"{user.email} promoted to admin"}), 200

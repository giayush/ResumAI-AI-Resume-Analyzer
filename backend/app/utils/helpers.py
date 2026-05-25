import re
from flask import request


def allowed_file(filename: str, allowed: set) -> bool:
    """Check if a filename has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed


def get_client_ip() -> str:
    """Extract real client IP, respecting X-Forwarded-For."""
    if request.headers.get("X-Forwarded-For"):
        return request.headers["X-Forwarded-For"].split(",")[0].strip()
    return request.remote_addr or "unknown"


def sanitize_filename(filename: str) -> str:
    """Remove path traversal characters from filenames."""
    filename = re.sub(r"[^a-zA-Z0-9._\- ]", "", filename)
    return filename[:200]


def paginate_query(query, page: int = 1, per_page: int = 20):
    """Return paginated SQLAlchemy query results."""
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": paginated.items,
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": paginated.page,
        "per_page": per_page,
        "has_next": paginated.has_next,
        "has_prev": paginated.has_prev,
    }


def error_response(message: str, status: int = 400) -> tuple:
    """Standard JSON error response."""
    from flask import jsonify
    return jsonify({"error": message}), status


def success_response(data: dict, status: int = 200) -> tuple:
    """Standard JSON success response."""
    from flask import jsonify
    return jsonify({"success": True, **data}), status

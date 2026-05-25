"""
app/__init__.py — Flask application factory.

Changes:
  - Removed: Google OAuth (authlib) setup.
  - Added: Firebase Admin SDK initialization.
  - Removed: flask-jwt-extended error handlers (no longer used).
  - BUG-11: spaCy model pre-warmed on first request.
  - BUG-23: Security headers added via after_request hook.
"""

import os
import socket
from flask import Flask, request, jsonify, g

# ── BUGFIX: Force IPv4 for requests (solves Firebase timeout) ──
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [r for r in responses if r[0] == socket.AF_INET]
socket.getaddrinfo = new_getaddrinfo

from .config import get_config
from .extensions import db, migrate, cors, bcrypt, limiter
from .firebase_auth import init_firebase
from flask_jwt_extended import JWTManager


def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config())

    # ── Initialize Extensions ────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    limiter.init_app(app)

    cors.init_app(
        app,
        resources={
            r"/api/*": {
                # Accept both 3000 and 3001 so Vite port-collision doesn't break CORS
                "origins": [
                    app.config["FRONTEND_URL"],
                    "http://localhost:3000",
                    "http://localhost:3001",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:3001",
                ]
            }
        },
        supports_credentials=True,
    )

    # ── Firebase Admin SDK ────────────────────────────────────
    with app.app_context():
        init_firebase(app)

    # ── JWT Setup ────────────────────────────────────────────
    # Explicitly load from env so .env value is always used over config defaults.
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", app.config.get("JWT_SECRET_KEY"))
    jwt = JWTManager(app)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Signature has expired", "code": "token_expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"error": "Invalid or expired token", "code": "token_invalid"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"error": "Authorization required", "code": "token_missing"}), 401





    # ── Import models so Flask-Migrate can detect them ────────
    from .models import user, resume, analysis, admin_log, payment  # noqa: F401


    # ── Register Blueprints ───────────────────────────────────
    from .routes.auth import auth_bp
    from .routes.resume import resume_bp
    from .routes.analysis import analysis_bp
    from .routes.admin import admin_bp
    from .routes.payment import payment_bp
    from .routes.user import user_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(resume_bp, url_prefix="/api/resume")
    app.register_blueprint(analysis_bp, url_prefix="/api/analysis")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(payment_bp, url_prefix="/api/payment")
    app.register_blueprint(user_bp, url_prefix="/api/user")

    # ── Health Check ──────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return {"status": "ok", "version": "2.0.0"}, 200

    # ── Request Logging ──────────────────────────────────────
    @app.before_request
    def log_request_info():
        app.logger.info(f"Request: {request.method} {request.path}")
        if request.headers.get("Authorization"):
            app.logger.info("Auth header present")
        else:
            app.logger.info("Auth header MISSING")

    @app.after_request
    def log_response_info(response):
        app.logger.info(f"Response: {response.status}")
        return response

    # ── BUG-23: Security Headers ──────────────────────────────
    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if response.content_type and "json" in response.content_type:
            response.headers["Content-Security-Policy"] = "default-src 'none'"
        return response

    # ── BUG-11: Pre-warm spaCy model on first request ─────────
    @app.before_request
    def _prewarm():
        app.before_request_funcs[None].remove(_prewarm)
        try:
            from .services.nlp_service import _get_nlp
            _get_nlp()
            app.logger.info("spaCy model pre-warmed.")
        except Exception as e:
            app.logger.warning(f"spaCy pre-warm failed: {e}")

    return app

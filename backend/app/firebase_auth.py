"""
firebase_auth.py — Firebase Admin SDK initialization and request middleware.

Usage:
  - Call init_firebase(app) in the app factory.
  - Decorate routes with @firebase_required to enforce Firebase auth.
  - Access current user via flask.g.firebase_user (dict with uid, email, etc.)
"""

import os
from functools import wraps

import firebase_admin
from firebase_admin import credentials, auth
from flask import request, jsonify, g, current_app


_firebase_app = None


def init_firebase(app):
    """
    Initialize Firebase Admin SDK using path from .env or default.
    """
    global _firebase_app
    if _firebase_app:
        return  # Already initialized

    # Point 3: Read path from environment (via app.config loaded from .env)
    # Point 1: Default to serviceAccountKey.json
    sa_path = app.config.get("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
    
    try:
        if os.path.exists(sa_path):
            # Point 2: Initialize Firebase Admin SDK
            cred = credentials.Certificate(sa_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            app.logger.info(f"Firebase Admin SDK initialized using {sa_path}")
        else:
            # Point 6: Clear error message if missing
            app.logger.error(f"Firebase initialization failed: '{sa_path}' not found in backend directory.")
    except Exception as e:
        app.logger.error(f"Firebase Admin SDK error: {e}")


def _extract_bearer_token():
    """Extract token from 'Authorization: Bearer <token>' header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header[7:]


def firebase_required(f):
    """
    Decorator: verify Firebase ID token before the route runs.
    Sets g.firebase_user = { uid, email, name, email_verified }
    Returns 401 if token is missing/invalid/expired.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Point 6: If Firebase was not initialized, we cannot verify tokens
        if not _firebase_app:
            current_app.logger.error("Firebase Admin SDK not initialized. Check serviceAccountKey.json.")
            return jsonify({"error": "Authentication system offline"}), 503

        token = _extract_bearer_token()
        if not token:
            return jsonify({"error": "Authorization required"}), 401

        try:
            # Point 4: Use firebase_admin.auth.verify_id_token()
            try:
                decoded = auth.verify_id_token(token)
            except Exception as e:
                # Handle clock skew: "Token used too early"
                if "Token used too early" in str(e):
                    import time
                    current_app.logger.info("Clock skew detected (Token used too early). Retrying after 2s...")
                    time.sleep(2)
                    decoded = auth.verify_id_token(token)
                else:
                    raise e
            
            g.firebase_user = {
                "uid": decoded.get("uid"),
                "email": decoded.get("email", ""),
                "name": decoded.get("name", ""),
                "email_verified": decoded.get("email_verified", False),
            }
        except Exception as e:
            # Point 5: Return 401 if token invalid
            current_app.logger.warning(f"Firebase token verification error: {e}")
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(*args, **kwargs)
    return decorated


def get_firebase_uid() -> str:
    """Convenience: return current user's Firebase UID from g."""
    return g.firebase_user["uid"]


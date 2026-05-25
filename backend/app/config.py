import os
from datetime import timedelta


class BaseConfig:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    DEBUG = False
    TESTING = False

    # ── Database ──────────────────────────────────────────
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///resumai.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # ── JWT ───────────────────────────────────────────────
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", 15))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get("JWT_REFRESH_TOKEN_EXPIRES_DAYS", 7))
    )
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    # Allow up to 60 seconds of clock skew between client and server.
    # Fixes "Token used too early" for newly registered users whose Firebase-issued
    # tokens may have an iat slightly ahead of the local backend clock.
    # Token expiration (15 min) is NOT affected — only timestamp tolerance is widened.
    JWT_LEEWAY = timedelta(seconds=60)

    # ── CORS ──────────────────────────────────────────────
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

    # ── Firebase Admin SDK ────────────────────────────────
    # Set ONE of these environment variables:
    #   FIREBASE_SERVICE_ACCOUNT_JSON — full JSON string (good for env vars)
    #   FIREBASE_SERVICE_ACCOUNT_PATH — path to serviceAccountKey.json file
    FIREBASE_SERVICE_ACCOUNT_JSON = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    FIREBASE_SERVICE_ACCOUNT_PATH = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")

    # ── AI APIs ───────────────────────────────────────────
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

    # ── LanguageTool ──────────────────────────────────────
    LANGUAGETOOL_API_URL = os.environ.get(
        "LANGUAGETOOL_API_URL", "https://api.languagetool.org/v2/check"
    )
    LANGUAGETOOL_API_KEY = os.environ.get("LANGUAGETOOL_API_KEY", "")

    # ── File Upload ───────────────────────────────────────
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS = {"pdf", "docx"}

    # ── Razorpay ──────────────────────────────────────────
    RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False


class TestingConfig(BaseConfig):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


def get_config():
    env = os.environ.get("FLASK_ENV", "development")
    return config_map.get(env, DevelopmentConfig)

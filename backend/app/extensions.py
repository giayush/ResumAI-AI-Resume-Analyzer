"""
extensions.py — Flask extension singletons.

  - Removed: OAuth (authlib) — replaced by Firebase Admin SDK
  - limiter: flask-limiter for rate limiting auth endpoints
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
bcrypt = Bcrypt()

# Rate limiter — uses client IP as key.
# For production deployment, set RATELIMIT_STORAGE_URL to a Redis URI 
# (e.g., redis://localhost:6379) to ensure limits work across multiple workers.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],          # No global default — only explicit per-route limits
    storage_uri=os.environ.get("RATELIMIT_STORAGE_URL", "memory://"),
)

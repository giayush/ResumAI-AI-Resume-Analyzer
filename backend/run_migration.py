import os
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app import create_app
from app.extensions import db
from flask_migrate import migrate, upgrade

app = create_app()
with app.app_context():
    print("Running migration...")
    try:
        migrate(message="add analysis limit tracking")
        print("Migration generated.")
        upgrade()
        print("Database upgraded.")
    except Exception as e:
        print(f"Error: {e}")

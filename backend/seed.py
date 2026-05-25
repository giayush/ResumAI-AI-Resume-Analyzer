"""
Seed script — creates an admin user in the database.
Run once after setting up the DB:
    python seed.py
"""

import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User

app = create_app()

with app.app_context():
    db.create_all()

    # Check if admin already exists
    existing = User.query.filter_by(email="admin@resumai.local").first()
    if existing:
        print("Admin user already exists:", existing.email)
    else:
        pw_hash = bcrypt.generate_password_hash("Admin@12345").decode("utf-8")
        admin = User(
            email="admin@resumai.local",
            password_hash=pw_hash,
            full_name="ResumAI Admin",
            role="admin",
        )
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin created!")
        print("   Email:    admin@resumai.local")
        print("   Password: Admin@12345")
        print("   ⚠  Change the password after first login!")

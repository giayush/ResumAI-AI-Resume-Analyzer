"""
migrate_to_jwt.py
──────────────────
One-time database migration script.
1. Aligns the `user_id` foreign keys in `resumes` and `analyses` tables from
   the legacy Firebase UID strings to correct database `User.id` primary keys.
2. Generates a default hashed password ("password123") for any migrated users
   so their accounts are immediately accessible.
"""

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.resume import Resume
from app.models.analysis import Analysis

app = create_app()

with app.app_context():
    print("Starting database migration to JWT...")

    # Ensure tables are created and columns are aligned
    db.create_all()

    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
        db.session.commit()
        print("✅ Added 'password_hash' column to 'users' table.")
    except Exception as e:
        # SQLite returns error if column already exists
        print("Note: Column 'password_hash' already exists or other database: ", e)

    users = User.query.all()
    print(f"Loaded {len(users)} users.")

    migrated_resumes_count = 0
    migrated_analyses_count = 0
    migrated_users_password_count = 0

    default_pw_hash = bcrypt.generate_password_hash("password123").decode("utf-8")

    for user in users:
        print(f"\nProcessing user: {user.email} (DB ID: {user.id}, Firebase UID: {user.firebase_uid})")

        # Set a default password if not already set
        if not user.password_hash:
            user.password_hash = default_pw_hash
            migrated_users_password_count += 1
            print(f" -> Set default password 'password123' for {user.email}")

        if user.firebase_uid:
            # Update legacy resumes
            resumes = Resume.query.filter_by(user_id=user.firebase_uid).all()
            for r in resumes:
                r.user_id = user.id
                migrated_resumes_count += 1
            if resumes:
                print(f" -> Migrated {len(resumes)} resumes to use database UUID.")

            # Update legacy analyses
            analyses = Analysis.query.filter_by(user_id=user.firebase_uid).all()
            for a in analyses:
                a.user_id = user.id
                migrated_analyses_count += 1
            if analyses:
                print(f" -> Migrated {len(analyses)} analyses to use database UUID.")

    db.session.commit()
    print("\n=======================================================")
    print("Database migration completed successfully!")
    print(f"  - Default password 'password123' set for: {migrated_users_password_count} users")
    print(f"  - Resumes migrated to database UUID:      {migrated_resumes_count}")
    print(f"  - Analyses migrated to database UUID:     {migrated_analyses_count}")
    print("=======================================================\n")

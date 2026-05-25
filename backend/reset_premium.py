from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.payment import Payment

def reset_invalid_premium():
    app = create_app()
    with app.app_context():
        users = User.query.filter_by(subscription_active=True).all()
        reset_count = 0
        for u in users:
            has_payment = Payment.query.filter_by(user_id=u.id, status='success').first()
            if not has_payment:
                u.subscription_active = False
                reset_count += 1
                print(f"Resetting premium status for {u.email} (No successful payment found)")
        
        if reset_count > 0:
            db.session.commit()
            print(f"Successfully reset {reset_count} users.")
        else:
            print("No invalid premium users found.")

if __name__ == '__main__':
    reset_invalid_premium()

import razorpay
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..utils.helpers import error_response
from ..extensions import db
from ..models.payment import Payment
from ..models.user import User
import os
from dotenv import load_dotenv

load_dotenv()

payment_bp = Blueprint("payment", __name__)

@payment_bp.route("/create-order", methods=["POST"])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    
    if not user:
        return error_response("User not found", 404)
        
    data = request.get_json()
    
    if not data or not data.get("amount"):
        return error_response("Amount is required")
        
    amount = data.get("amount") # Amount in INR
    currency = data.get("currency", "INR")
    
    razorpay_key_id = os.getenv("RAZORPAY_KEY_ID")
    razorpay_key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    print("RAZORPAY_KEY_ID:", razorpay_key_id)
    print("RAZORPAY_KEY_SECRET:", razorpay_key_secret)
    
    if not razorpay_key_id or not razorpay_key_secret:
        return error_response("Razorpay credentials not configured", 500)
        
    try:
        client = razorpay.Client(auth=(
            razorpay_key_id,
            razorpay_key_secret
        ))
        
        # Razorpay expects amount in subunits (paise for INR)
        order_amount = int(float(amount) * 100)
        
        order_data = {
            "amount": order_amount,
            "currency": currency,
            "receipt": f"receipt_{user.id[:10]}",
            "payment_capture": 1
        }
        
        order = client.order.create(data=order_data)
        
        # Save pending payment to DB
        payment_record = Payment(
            user_id=user.id,
            order_id=order["id"],
            amount=order_amount,
            currency=order["currency"],
            status="pending"
        )
        db.session.add(payment_record)
        db.session.commit()
        
        return jsonify({
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key": razorpay_key_id
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"[Payment] Failed to create Razorpay order: {type(e).__name__}: {e}")
        return error_response(f"Payment gateway error: {str(e)}", 500)


@payment_bp.route("/verify", methods=["POST"])
@jwt_required()
def verify_payment():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    
    if not user:
        return error_response("User not found", 404)
        
    data = request.get_json()
    
    if not data:
        return error_response("Missing payment data")
        
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_signature = data.get("razorpay_signature")
    
    if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
        return error_response("Incomplete payment data", 400)
        
    razorpay_key_id = os.getenv("RAZORPAY_KEY_ID")
    razorpay_key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    payment_record = Payment.query.filter_by(order_id=razorpay_order_id).first()
    if not payment_record:
        return error_response("Order not found", 404)
        
    try:
        client = razorpay.Client(auth=(
            razorpay_key_id,
            razorpay_key_secret
        ))
        
        # Verify signature
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        
        # Raises SignatureVerificationError if fails
        client.utility.verify_payment_signature(params_dict)
        
        # Update Payment Record
        payment_record.status = "success"
        payment_record.payment_id = razorpay_payment_id
        payment_record.signature = razorpay_signature
        
        # Activate Premium Subscription for User (e.g. 1 year)
        user.subscription_active = True
        user.subscription_expiry = datetime.now(timezone.utc) + timedelta(days=365)
        
        db.session.commit()
        
        return jsonify({
            "message": "Payment successful",
            "status": "success",
            "payment_id": razorpay_payment_id,
            "subscription_active": True
        }), 200
        
    except razorpay.errors.SignatureVerificationError:
        payment_record.status = "failed"
        db.session.commit()
        return error_response("Payment signature verification failed", 400)
    except Exception as e:
        current_app.logger.error(f"Payment verification error: {e}")
        return error_response(f"Payment verification failed: {str(e)}", 500)

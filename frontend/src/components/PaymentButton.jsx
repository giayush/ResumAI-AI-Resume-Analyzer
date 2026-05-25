import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { paymentAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    // Avoid adding the script twice
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PaymentButton = ({ amount = 499, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const handlePayment = async () => {
    setLoading(true);

    // 1. Load Razorpay Script
    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      toast.error('Razorpay SDK failed to load. Check your internet connection.');
      setLoading(false);
      return;
    }

    try {
      // 2. Create order on backend
      const orderResponse = await paymentAPI.createOrder(amount);
      const { order_id, amount: orderAmount, currency } = orderResponse.data;

      // 3. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency: currency || 'INR',
        name: 'ResumAI Premium',
        description: 'Upgrade to Premium Plan',
        order_id: order_id,

        handler: async (response) => {
          // 4. Verify payment signature on backend
          try {
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.status === 'success') {
              toast.success('🎉 Payment successful! Premium activated.');

              // Refresh user data from backend as well
              api.get('/user/me').then(({ data }) => {
                const { updateUser } = useAuthStore.getState();
                updateUser({
                  subscription_active: true,
                  subscription_expiry: data.subscription_expiry,
                  analysis_count: data.analysis_count,
                });
              });

              // Notify parent component (e.g. Subscription page re-renders premium UI)
              if (onSuccess) onSuccess();
            } else {
              toast.error('Payment verification failed. Please try again.');
            }
          } catch (err) {
            console.error('Verification Error:', err);
            toast.error(
              err?.response?.data?.error || 'Verification failed. Contact support if amount was deducted.'
            );
          }
        },

        prefill: {
          name: user?.full_name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#6C63FF',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error?.response?.data?.error || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button
      id="pay-now-btn"
      onClick={handlePayment}
      disabled={loading}
      className="btn btn-primary"
      style={{
        width: '100%',
        background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
        border: 'none',
        fontSize: 16,
        fontWeight: 700,
        padding: '14px 24px',
      }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span className="spinner" style={{ width: 16, height: 16 }} />
          Processing...
        </span>
      ) : (
        '🚀 Pay Now — ₹499'
      )}
    </button>
  );
};

export default PaymentButton;

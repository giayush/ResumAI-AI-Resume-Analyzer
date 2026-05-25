import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import PaymentButton from '../components/PaymentButton';
import { CheckCircle, Crown, Star } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function Subscription() {
  const { user, updateUser } = useAuthStore();

  // Use local state so we can refresh from backend after payment
  const [isPremium, setIsPremium] = useState(false);
  const [expiry, setExpiry] = useState(user?.subscription_expiry || null);
  const [loading, setLoading] = useState(true);

  // Always re-fetch fresh subscription status on mount (don't rely on cached state)
  useEffect(() => {
    api
      .get('/user/me')
      .then(({ data }) => {
        const active = data.subscription_active === true;
        setIsPremium(active);
        setExpiry(data.subscription_expiry || null);
        updateUser({
          subscription_active: active,
          analysis_count: data.analysis_count,
        });
      })
      .catch((err) =>
        console.warn('Could not refresh subscription status:', err?.response?.data || err.message)
      )
      .finally(() => setLoading(false));
  }, []);

  const features = [
    'Unlimited resume analyses',
    'Full AI-powered feedback',
    'Keyword matching & gap analysis',
    'Grammar & phrasing suggestions',
    'Custom Job Description generation',
    'PDF export of analysis results',
  ];

  // Called by PaymentButton on successful payment
  const handlePaymentSuccess = () => {
    setIsPremium(true);
    updateUser({ subscription_active: true });
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <span className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </Layout>
    );
  }

  // ── Already Premium ───────────────────────────────────────────────────────────
  if (isPremium) {
    return (
      <Layout>
        <div className="fade-in" style={{ maxWidth: 640, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.12)',
              marginBottom: 28,
            }}
          >
            <Crown size={40} style={{ color: '#10B981' }} />
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 800,
              marginBottom: 16,
              color: 'var(--text-primary)',
            }}
          >
            🎉 You're a Premium Member!
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 40, lineHeight: 1.6 }}>
            You already have access to all premium features. Enjoy unlimited AI-powered resume analysis.
          </p>

          {expiry && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: 20,
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                marginBottom: 40,
              }}
            >
              <Star size={14} style={{ color: '#10B981' }} />
              <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>
                Premium active until{' '}
                {new Date(expiry).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <CheckCircle size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>{f}</span>
              </div>
            ))}
          </div>

          <a href="/upload" className="btn btn-primary" style={{ display: 'inline-flex', gap: 8 }}>
            Start Analysing Resume
          </a>
        </div>
      </Layout>
    );
  }

  // ── Not Premium — Show Upgrade UI ─────────────────────────────────────────────
  return (
    <Layout>
      <div className="fade-in" style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(255,215,0,0.12)',
              marginBottom: 24,
            }}
          >
            <Crown size={32} style={{ color: '#FFD700' }} />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            Upgrade to Premium
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto' }}>
            Unlock your full potential with unlimited AI analysis and powerful tools to land your dream job.
          </p>
        </div>

        {/* Pricing Card */}
        <div
          className="card-glass"
          style={{ display: 'flex', overflow: 'hidden', borderRadius: 16 }}
        >
          {/* Features List */}
          <div style={{ flex: 1, padding: 40, borderRight: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>What you get</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {features.map((feature, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: 'var(--text-primary)' }}>
                  <CheckCircle size={20} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Panel */}
          <div
            style={{
              flex: '0 0 300px',
              background: 'var(--bg-glass-darker)',
              padding: 40,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'line-through', marginRight: 8 }}>₹999</span>
              <span style={{ fontSize: 48, fontWeight: 800, color: 'var(--primary)' }}>₹499</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>
              One-time payment · 1 year access
            </p>
            <div style={{ width: '100%', marginBottom: 16 }}>
              <PaymentButton amount={499} onSuccess={handlePaymentSuccess} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>🔒 Secure payment via Razorpay</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

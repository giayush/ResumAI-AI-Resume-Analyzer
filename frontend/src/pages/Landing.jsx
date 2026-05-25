import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Moon, Sun, Sparkles, Brain, Target,
  Upload, BarChart3, CheckCircle, TrendingUp,
  Zap, Users, LayoutDashboard, History, LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { toast } from "react-hot-toast";

/* ── Feature cards data ─────────────────────────────────── */
const mainFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    desc: "Leverage GPT-4o and Gemini AI to get deep, section-by-section feedback on your resume with actionable improvement tips.",
    color: "#7B61FF",
    bg: "rgba(123,97,255,0.1)",
  },
  {
    icon: Target,
    title: "ATS Optimization",
    desc: "See your exact ATS compatibility score with a keyword gap analysis powered by TF-IDF so you never get filtered out again.",
    color: "#FF4D8D",
    bg: "rgba(255,77,141,0.1)",
  },
  {
    icon: Users,
    title: "Built for Job Seekers",
    desc: "From fresh graduates to senior professionals — ResumAI adapts its feedback to your target role and experience level.",
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
  },
];

const whyFeatures = [
  {
    icon: Upload,
    title: "Easy Upload",
    desc: "Drag & drop your PDF or DOCX resume and paste any job description. Results in seconds.",
    color: "#7B61FF",
  },
  {
    icon: Zap,
    title: "ATS Score",
    desc: "Instant 0–100 ATS compatibility score with detailed breakdown per resume section.",
    color: "#FF4D8D",
  },
  {
    icon: Brain,
    title: "AI Feedback",
    desc: "Personalised AI suggestions to strengthen your experience bullets, skills, and summary.",
    color: "#F59E0B",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    desc: "Keep a full history of all analyses to track how your resume improves over time.",
    color: "#10B981",
  },
];

/* ── Landing Page ───────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", color: "var(--text-primary)", overflowX: "hidden" }}>

      {/* ════════════════════════════════════════
          FLOATING NAVBAR
      ════════════════════════════════════════ */}
      <nav className="landing-nav">
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "var(--grad-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(123,97,255,0.4)",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 18 }}>📄</span>
          </div>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700,
            color: "var(--text-primary)", letterSpacing: "-0.01em",
          }}>
            Resum<span style={{ background: "var(--grad-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>AI</span>
          </span>
        </Link>

        {/* Nav links — change based on auth state */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {!isAuthenticated ? (
            <>
              <a href="#home" className="nav-link" id="nav-home">Home</a>
              <Link to="/login" className="nav-link" id="nav-login">Login</Link>
              <Link to="/register" className="nav-link" id="nav-signup" style={{ marginRight: 4 }}>Sign Up</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="nav-link" id="nav-dashboard">Dashboard</Link>
              <Link to="/upload" className="nav-link" id="nav-upload">Upload</Link>
              <Link to="/history" className="nav-link" id="nav-history">History</Link>
              <button
                id="nav-logout"
                onClick={handleLogout}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500,
                  color: "var(--accent-red)", background: "none", border: "none",
                  cursor: "pointer", padding: "7px 14px", borderRadius: "var(--radius-md)",
                  transition: "background 0.2s",
                  marginRight: 4,
                }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                onMouseOut={e => e.currentTarget.style.background = "none"}
              >
                <LogOut size={14} /> Logout
              </button>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark"
            ? <Sun size={17} />
            : <Moon size={17} />}
        </button>
      </nav>

      {/* ════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════ */}
      <section id="home" style={{
        textAlign: "center",
        padding: "160px 24px 100px",
        maxWidth: 860,
        margin: "0 auto",
        position: "relative",
      }}>
        {/* Glow orb behind hero */}
        <div style={{
          position: "absolute",
          top: "10%", left: "50%",
          transform: "translateX(-50%)",
          width: 600, height: 400,
          background: "radial-gradient(ellipse at center, rgba(123,97,255,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Badge */}
        <div className="float-anim" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(123,97,255,0.12)",
          border: "1px solid rgba(123,97,255,0.3)",
          borderRadius: "var(--radius-pill)",
          padding: "8px 20px",
          fontSize: 13, fontWeight: 600,
          color: "var(--primary-light)",
          marginBottom: 32,
          letterSpacing: "0.04em",
          position: "relative", zIndex: 1,
        }}>
          <Sparkles size={14} />
          AI-POWERED RESUME INTELLIGENCE
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(38px, 6vw, 72px)",
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 24,
          letterSpacing: "-0.02em",
          position: "relative", zIndex: 1,
        }}>
          Smart Feedback for Your{" "}
          <span className="gradient-text">Dream Job</span>
        </h1>

        {/* Subheading */}
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "clamp(16px, 2vw, 19px)",
          color: "var(--text-secondary)",
          maxWidth: 580,
          margin: "0 auto 44px",
          lineHeight: 1.75,
          position: "relative", zIndex: 1,
        }}>
          Upload your resume and get an instant ATS score with AI-powered
          suggestions to land your dream job faster.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap",
          position: "relative", zIndex: 1,
        }}>
          <Link id="hero-get-started" to="/register" className="btn btn-primary btn-lg" style={{ borderRadius: 14 }}>
            Get Started <ArrowRight size={18} />
          </Link>
          <Link id="hero-login" to="/login" className="btn btn-secondary btn-lg" style={{ borderRadius: 14 }}>
            Login
          </Link>
        </div>

        {/* Trust badges */}
        <div style={{
          display: "flex", gap: 28, justifyContent: "center",
          marginTop: 40, flexWrap: "wrap",
          position: "relative", zIndex: 1,
        }}>
          {["No credit card required", "PDF & DOCX supported", "Instant results"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-muted)" }}>
              <CheckCircle size={14} style={{ color: "var(--accent-green)", flexShrink: 0 }} />
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURE CARDS (3)
      ════════════════════════════════════════ */}
      <section style={{ padding: "20px 32px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{
            display: "inline-block",
            fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--primary-light)",
            marginBottom: 12,
          }}>What We Offer</span>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 700, marginBottom: 14,
          }}>
            Everything You Need to Get Hired
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto" }}>
            Comprehensive AI tools designed specifically for today's competitive job market.
          </p>
        </div>

        <div className="grid-3">
          {mainFeatures.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="feature-card">
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: bg, border: `1px solid ${color}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
                boxShadow: `0 4px 16px ${color}20`,
              }}>
                <Icon size={26} style={{ color }} />
              </div>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: 19, fontWeight: 700, marginBottom: 10,
                color: "var(--text-primary)",
              }}>{title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          WHY CHOOSE RESUMEAI (4 cards)
      ════════════════════════════════════════ */}
      <section style={{
        padding: "80px 32px 100px",
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{
              display: "inline-block",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--secondary)",
              marginBottom: 12,
            }}>Our Advantages</span>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 700, marginBottom: 14,
            }}>
              Why Choose <span className="gradient-text">ResumAI?</span>
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
              Built for job seekers who want real results — not generic advice.
            </p>
          </div>

          <div className="grid-4">
            {whyFeatures.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
                padding: "28px 24px",
                textAlign: "center",
                transition: "transform 0.3s var(--ease), box-shadow 0.3s var(--ease), border-color 0.3s var(--ease)",
                cursor: "default",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = `0 12px 36px ${color}20`;
                  e.currentTarget.style.borderColor = `${color}50`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 16, fontWeight: 700, marginBottom: 8,
                  color: "var(--text-primary)",
                }}>{title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA SECTION
      ════════════════════════════════════════ */}
      <section style={{ padding: "100px 32px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="cta-card" style={{ padding: "72px 48px", textAlign: "center" }}>
            {/* Decorative gradient orbs */}
            <div style={{
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -80, right: -80, width: 240, height: 240,
                background: "radial-gradient(circle, rgba(123,97,255,0.2) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", bottom: -80, left: -80, width: 240, height: 240,
                background: "radial-gradient(circle, rgba(255,77,141,0.15) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              <span style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(123,97,255,0.12)", border: "1px solid rgba(123,97,255,0.3)",
                borderRadius: "var(--radius-pill)", padding: "6px 16px",
                fontSize: 12, fontWeight: 600, color: "var(--primary-light)",
                marginBottom: 24, letterSpacing: "0.06em",
              }}>
                🚀 GET STARTED TODAY
              </span>

              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800, marginBottom: 16,
                lineHeight: 1.2,
              }}>
                Ready to Get Started?
              </h2>
              <p style={{
                fontSize: 16, color: "var(--text-secondary)",
                marginBottom: 40, maxWidth: 440, margin: "0 auto 40px",
                lineHeight: 1.7,
              }}>
                Join thousands of job seekers who leveled up their resume with
                AI feedback and landed their dream roles.
              </p>
              <Link
                id="cta-create-account"
                to="/register"
                className="btn btn-primary btn-lg"
                style={{ borderRadius: 14, paddingLeft: 36, paddingRight: 36 }}
              >
                Create Account <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "36px 32px",
        background: "var(--bg-surface)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "var(--grad-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>📄</div>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700,
              color: "var(--text-primary)",
            }}>ResumAI</span>
          </div>

          {/* Footer links */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "Privacy Policy", id: "footer-privacy" },
              { label: "Terms of Service", id: "footer-terms" },
              { label: "Contact Us", id: "footer-contact" },
            ].map(({ label, id }) => (
              <a
                key={label}
                href="#"
                id={id}
                style={{
                  fontSize: 13, color: "var(--text-muted)",
                  textDecoration: "none", transition: "color 0.2s",
                }}
                onMouseOver={e => e.currentTarget.style.color = "var(--primary-light)"}
                onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            © 2026 ResumAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

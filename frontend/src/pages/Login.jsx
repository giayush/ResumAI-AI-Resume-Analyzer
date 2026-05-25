import LoginForm from "../components/auth/LoginForm";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#6C63FF,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📄</div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>ResumAI</span>
            </div>
          </Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Sign in to your account to continue</p>
        </div>
        <div className="card-glass" style={{ padding: 32 }}>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

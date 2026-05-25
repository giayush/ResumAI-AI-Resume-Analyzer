import RegisterForm from "../components/auth/RegisterForm";
import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#6C63FF,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📄</div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>ResumAI</span>
            </div>
          </Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Create your account</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Start analyzing your resume for free</p>
        </div>
        <div className="card-glass" style={{ padding: 32 }}>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

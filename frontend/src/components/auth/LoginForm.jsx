import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { authAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    // Requirement 8: Clear stale/expired tokens automatically before new login
    logout();

    try {
      console.log("Login attempt:", form.email);

      // Directly authenticate with our JWT login endpoint
      const res = await authAPI.login({
        email: form.email,
        password: form.password,
      });

      const { token, user } = res.data;
      console.log("Login success, user:", user.full_name);

      setAuth(token, user);

      toast.success(`Welcome back, ${user.full_name}!`);
      navigate("/dashboard");
    } catch (err) {
      const msg = err?.response?.data?.error || "Invalid email or password.";
      console.error("Login error:", err.message);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="form-group">
        <label className="form-label">Email</label>
        <div style={{ position: "relative" }}>
          <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="login-email"
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ paddingLeft: 36 }}
            autoComplete="email"
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <div style={{ position: "relative" }}>
          <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="login-password"
            className="form-input"
            type={showPw ? "text" : "password"}
            placeholder="Your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ paddingLeft: 36, paddingRight: 40 }}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button id="login-submit" type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 4 }}>
        {loading ? <span className="spinner" /> : <>Sign In <ArrowRight size={16} /></>}
      </button>
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
        Don't have an account? <Link to="/register" style={{ color: "var(--primary-light)", fontWeight: 600 }}>Sign up free</Link>
      </p>
    </form>
  );
}

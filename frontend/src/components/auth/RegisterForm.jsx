import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { authAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const pwStrength = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const strengthColors = ["", "var(--accent-red)", "var(--accent)", "#60A5FA", "var(--accent-green)"];
const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

export default function RegisterForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = pwStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.full_name.trim() || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    // Requirement 8: Clear stale/expired tokens automatically before registration
    logout();

    try {
      // Directly register with our JWT register endpoint
      const res = await authAPI.register({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { token, user } = res.data;
      console.log("Registration success, user:", user.full_name);

      setAuth(token, user);

      toast.success("Account created! Welcome to ResumAI 🎉");
      navigate("/dashboard");
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Registration failed. Please try again.";
      console.error("Registration failed. Details:", err?.response?.data || err.message);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="form-group">
        <label className="form-label">Full Name</label>
        <div style={{ position: "relative" }}>
          <User size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="reg-name"
            className="form-input"
            type="text"
            placeholder="Jane Smith"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            style={{ paddingLeft: 36 }}
            autoComplete="name"
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <div style={{ position: "relative" }}>
          <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="reg-email"
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
            id="reg-password"
            className="form-input"
            type={showPw ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ paddingLeft: 36, paddingRight: 40 }}
            autoComplete="new-password"
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
        {form.password && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div style={{ display: "flex", gap: 4, flex: 1 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : "var(--border)", transition: "background 0.3s" }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: strengthColors[strength], fontWeight: 600, minWidth: 36 }}>{strengthLabels[strength]}</span>
          </div>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
      <button id="reg-submit" type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 4 }}>
        {loading ? <span className="spinner" /> : <>Create Account <ArrowRight size={16} /></>}
      </button>
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
        Already have an account? <Link to="/login" style={{ color: "var(--primary-light)", fontWeight: 600 }}>Sign in</Link>
      </p>
    </form>
  );
}

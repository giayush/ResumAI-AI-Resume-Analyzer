import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Upload, History, Shield,
  FileText, LogOut, ChevronRight, Moon, Sun,
  Crown
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/upload", icon: Upload, label: "Analyze Resume" },
  { to: "/history", icon: History, label: "History" },
  { to: "/subscription", icon: Crown, label: "Premium" },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isAdmin = user?.role === "admin";

  return (
    <aside style={{
      width: 240,
      minHeight: "100vh",
      background: "rgba(10,10,26,0.95)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      padding: "24px 16px",
      position: "fixed",
      top: 0, left: 0, bottom: 0,
      backdropFilter: "blur(20px)",
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ textDecoration: "none", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg,#6C63FF,#06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>📄</div>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 18,
            fontWeight: 700, color: "var(--text-primary)",
          }}>ResumAI</span>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", padding: "0 12px", marginBottom: 8, textTransform: "uppercase" }}>Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                background: active ? "rgba(108,99,255,0.15)" : "transparent",
                border: active ? "1px solid rgba(108,99,255,0.3)" : "1px solid transparent",
                color: active ? "var(--primary-light)" : "var(--text-secondary)",
                fontWeight: active ? 600 : 400, fontSize: 14,
                transition: "all 0.2s",
                cursor: "pointer",
              }}>
                <Icon size={16} />
                <span>{label}</span>
                {active && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
              </div>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", padding: "16px 12px 8px", textTransform: "uppercase" }}>Admin</p>
            <Link to="/admin" style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                background: location.pathname === "/admin" ? "rgba(108,99,255,0.15)" : "transparent",
                border: location.pathname === "/admin" ? "1px solid rgba(108,99,255,0.3)" : "1px solid transparent",
                color: location.pathname === "/admin" ? "var(--primary-light)" : "var(--text-secondary)",
                fontWeight: 500, fontSize: 14, transition: "all 0.2s",
              }}>
                <Shield size={16} />
                <span>Admin Panel</span>
              </div>
            </Link>
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#6C63FF,#06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : (user?.full_name?.[0] || "U")}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.full_name}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {/* Theme Toggle */}
          <button
            id="sidebar-theme-toggle"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            aria-label="Toggle theme"
            style={{ flex: 1, borderRadius: "var(--radius-md)", width: "auto" }}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            <span style={{ fontSize: 12, marginLeft: 6, color: "var(--text-secondary)" }}>
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>
        </div>
        <button onClick={logout} className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start", gap: 10, color: "var(--accent-red)", padding: "8px 12px" }}>
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

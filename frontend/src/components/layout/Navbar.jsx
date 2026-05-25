import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Moon, Sun, ChevronDown, LogOut, Settings, Crown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { toast } from "react-hot-toast";

/**
 * Navbar — top bar shown on all authenticated pages.
 * Includes page title, search stub, and user dropdown.
 */
export default function Navbar({ title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/login");
  };

  // Derive page title from pathname if not passed as prop
  const pageTitle = title || (() => {
    const p = location.pathname;
    if (p === "/dashboard") return "Dashboard";
    if (p === "/upload") return "Analyze Resume";
    if (p === "/history") return "History";
    if (p === "/admin") return "Admin Panel";
    if (p.startsWith("/analysis/")) return "Analysis Results";
    return "ResumAI";
  })();

  return (
    <header style={{
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      borderBottom: "1px solid var(--border)",
      background: "rgba(10,10,26,0.8)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      marginBottom: 0,
    }}>
      {/* Left: Page title */}
      <h2 style={{
        fontFamily: "var(--font-display)",
        fontSize: 18,
        fontWeight: 700,
        color: "var(--text-primary)",
      }}>
        {pageTitle}
      </h2>

      {/* Right: Actions + User */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Notification stub */}
        <button className="btn-icon" title="Notifications">
          <Bell size={16} />
        </button>

        {/* Upgrade Button */}
        {!user?.subscription_active && user?.role !== 'admin' && (
          <Link 
            to="/subscription" 
            className="btn btn-sm" 
            style={{ 
              background: "rgba(255,215,0,0.1)", 
              color: "#FFD700", 
              border: "1px solid rgba(255,215,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <Crown size={14} />
            Upgrade
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          id="app-theme-toggle"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            id="user-menu-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 10,
              background: dropdownOpen ? "var(--bg-glass-strong)" : "var(--bg-glass)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              color: "var(--text-primary)",
              transition: "all 0.2s",
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6C63FF,#06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              overflow: "hidden",
              flexShrink: 0,
            }}>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (user?.full_name?.[0]?.toUpperCase() || "U")}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.full_name?.split(" ")[0] || "User"}
            </span>
            <ChevronDown size={13} style={{ color: "var(--text-muted)", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: 200,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-strong)",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "var(--shadow-lg)",
              zIndex: 100,
            }}>
              {/* User info */}
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{user?.full_name}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
              </div>

              {/* Actions */}
              <div style={{ padding: "6px" }}>
                <Link
                  to="/dashboard"
                  onClick={() => setDropdownOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, textDecoration: "none", transition: "background 0.15s" }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-glass)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <Settings size={14} />
                  Settings
                </Link>
                <button
                  id="navbar-logout-btn"
                  onClick={handleLogout}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, color: "var(--accent-red)", fontSize: 13, background: "none", border: "none", width: "100%", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

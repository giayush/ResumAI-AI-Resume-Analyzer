import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Shield, Search } from "lucide-react";
import Layout from "../components/layout/Layout";
import StatsGrid from "../components/admin/StatsGrid";
import UserTable from "../components/admin/UserTable";
import { adminAPI } from "../services/api";
import { formatDateTime } from "../utils/formatters";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sRes, uRes, lRes] = await Promise.all([
          adminAPI.stats(),
          adminAPI.users(),
          adminAPI.logs(),
        ]);
        setStats(sRes.data);
        setUsers(uRes.data.users || []);
        setLogs(lRes.data.logs || []);
      } catch {
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Handlers ────────────────────────────────────────────
  const handleDelete = async (id, email) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await adminAPI.toggleActive(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: res.data.is_active } : u))
      );
      toast.success("User status updated");
    } catch {
      toast.error("Failed to update user");
    }
  };

  const handleMakeAdmin = async (id) => {
    if (!confirm("Promote this user to admin? They will have full access.")) return;
    try {
      await adminAPI.makeAdmin(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: "admin" } : u))
      );
      toast.success("User promoted to admin");
    } catch (err) {
      toast.error(err.response?.data?.error || "Promotion failed");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="fade-in">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={18} style={{ color: "var(--primary-light)" }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800 }}>
              Admin Panel
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Manage users, view platform stats, and audit logs
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <StatsGrid stats={stats} loading={loading} />

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20,
          background: "var(--bg-glass)", borderRadius: 12, padding: 4,
          border: "1px solid var(--border)", width: "fit-content",
        }}>
          {["users", "logs"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="btn btn-ghost"
              style={{
                padding: "8px 20px", borderRadius: 9, textTransform: "capitalize",
                background: tab === t ? "rgba(108,99,255,0.2)" : "transparent",
                color: tab === t ? "var(--primary-light)" : "var(--text-secondary)",
                border: tab === t ? "1px solid rgba(108,99,255,0.3)" : "1px solid transparent",
              }}
            >
              {t === "users" ? `Users (${users.length})` : "Audit Logs"}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="card-glass" style={{ padding: 24 }}>
            {/* Search */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              <Search size={14} style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)",
              }} />
              <input
                id="admin-user-search"
                className="form-input"
                placeholder="Search users by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
            </div>

            <UserTable
              users={filteredUsers}
              loading={loading}
              onDelete={handleDelete}
              onToggleActive={handleToggle}
              onMakeAdmin={handleMakeAdmin}
            />
          </div>
        )}

        {/* Logs Tab */}
        {tab === "logs" && (
          <div className="card-glass" style={{ padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 32, fontSize: 14 }}>
                  No admin actions logged yet
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", background: "var(--bg-glass)",
                      borderRadius: 8, border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                    <span className="badge badge-primary" style={{ flexShrink: 0 }}>{log.action}</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1 }}>
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </span>
                    {log.ip_address && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, fontFamily: "monospace" }}>
                        {log.ip_address}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

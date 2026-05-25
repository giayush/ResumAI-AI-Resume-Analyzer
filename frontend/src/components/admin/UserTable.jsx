import { Trash2, UserCheck, UserX, Shield } from "lucide-react";
import { formatDate } from "../../utils/formatters";

/**
 * UserTable — admin table listing all users with management actions.
 */
export default function UserTable({ users = [], onDelete, onToggleActive, onMakeAdmin, loading }) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)", fontSize: 14 }}>
        No users found
      </div>
    );
  }

  const columns = ["User", "Email", "Role", "Resumes", "Analyses", "Status", "Joined", "Actions"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  padding: "10px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  textAlign: col === "Actions" ? "center" : "left",
                  borderBottom: "1px solid var(--border)",
                  whiteSpace: "nowrap",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u.id}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                transition: "background 0.15s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Name */}
              <td style={{ padding: "12px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#6C63FF,#06B6D4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="av" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (u.full_name?.[0] || "?")}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {u.full_name}
                  </span>
                </div>
              </td>

              {/* Email */}
              <td style={{ padding: "12px 12px", fontSize: 13, color: "var(--text-secondary)", maxWidth: 200 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{u.email}</span>
              </td>

              {/* Role */}
              <td style={{ padding: "12px 12px" }}>
                <span className={`badge ${u.role === "admin" ? "badge-primary" : "badge-success"}`}>
                  {u.role}
                </span>
              </td>

              {/* Resumes */}
              <td style={{ padding: "12px 12px", fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>
                {u.resume_count ?? 0}
              </td>

              {/* Analyses */}
              <td style={{ padding: "12px 12px", fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>
                {u.analysis_count ?? 0}
              </td>

              {/* Status */}
              <td style={{ padding: "12px 12px" }}>
                <span className={`badge ${u.is_active !== false ? "badge-success" : "badge-danger"}`}>
                  {u.is_active !== false ? "Active" : "Inactive"}
                </span>
              </td>

              {/* Joined */}
              <td style={{ padding: "12px 12px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                {formatDate(u.created_at)}
              </td>

              {/* Actions */}
              <td style={{ padding: "12px 12px" }}>
                <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                  {/* Toggle active */}
                  <button
                    onClick={() => onToggleActive?.(u.id)}
                    className="btn-icon"
                    title={u.is_active !== false ? "Deactivate" : "Activate"}
                  >
                    {u.is_active !== false ? <UserX size={13} /> : <UserCheck size={13} />}
                  </button>

                  {/* Promote to admin */}
                  {u.role !== "admin" && (
                    <button
                      onClick={() => onMakeAdmin?.(u.id)}
                      className="btn-icon"
                      title="Promote to admin"
                    >
                      <Shield size={13} />
                    </button>
                  )}

                  {/* Delete */}
                  {u.role !== "admin" && (
                    <button
                      onClick={() => onDelete?.(u.id, u.email)}
                      className="btn-icon"
                      title="Delete user"
                      style={{ color: "var(--accent-red)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { Users, FileText, BarChart3, Zap, Activity, TrendingUp } from "lucide-react";

/**
 * StatsGrid — admin overview cards showing platform-wide statistics.
 */
export default function StatsGrid({ stats, loading }) {
  const cards = stats
    ? [
        {
          label: "Total Users",
          value: stats.total_users,
          sub: `${stats.active_users} active`,
          icon: Users,
          color: "#6C63FF",
        },
        {
          label: "Total Resumes",
          value: stats.total_resumes,
          sub: "uploaded",
          icon: FileText,
          color: "#06B6D4",
        },
        {
          label: "Total Analyses",
          value: stats.total_analyses,
          sub: "run",
          icon: BarChart3,
          color: "#10B981",
        },
        {
          label: "Avg ATS Score",
          value: `${stats.avg_ats_score}`,
          sub: "platform avg",
          icon: Zap,
          color: "#F59E0B",
        },
        {
          label: "Avg JD Match",
          value: `${stats.avg_match_percentage}%`,
          sub: "cosine similarity",
          icon: Activity,
          color: "#EC4899",
        },
        {
          label: "Active Rate",
          value: stats.total_users
            ? `${Math.round((stats.active_users / stats.total_users) * 100)}%`
            : "—",
          sub: "users active",
          icon: TrendingUp,
          color: "#8B5CF6",
        },
      ]
    : [];

  if (loading || !stats) {
    return (
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card" style={{ padding: 24, minHeight: 110 }}>
            <div style={{ height: 12, width: "60%", background: "var(--bg-glass-strong)", borderRadius: 6, marginBottom: 16 }} />
            <div style={{ height: 32, width: "40%", background: "var(--bg-glass-strong)", borderRadius: 6 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid-3" style={{ marginBottom: 32 }}>
      {cards.map(({ label, value, sub, icon: Icon, color }) => (
        <div key={label} className="card" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
          {/* Ambient glow */}
          <div style={{
            position: "absolute",
            top: -16,
            right: -16,
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: color,
            opacity: 0.07,
            filter: "blur(16px)",
          }} />

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              {label}
            </p>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${color}18`,
              border: `1px solid ${color}28`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Icon size={15} style={{ color }} />
            </div>
          </div>

          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: 34,
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1,
            marginBottom: 6,
          }}>
            {value ?? "—"}
          </p>

          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</p>
        </div>
      ))}
    </div>
  );
}

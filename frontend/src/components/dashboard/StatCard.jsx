import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = "var(--primary)" }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "var(--accent-green)" : trend < 0 ? "var(--accent-red)" : "var(--text-muted)";

  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: color, opacity: 0.08, filter: "blur(20px)",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</p>
        {Icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${color}18`, border: `1px solid ${color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={16} style={{ color }} />
          </div>
        )}
      </div>

      <p style={{
        fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800,
        color: "var(--text-primary)", lineHeight: 1, marginBottom: 8,
      }}>{value ?? "—"}</p>

      {(subtitle || trend !== undefined) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {trend !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, color: trendColor, fontSize: 12, fontWeight: 600 }}>
              <TrendIcon size={12} />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
          {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{subtitle}</p>}
        </div>
      )}
    </div>
  );
}

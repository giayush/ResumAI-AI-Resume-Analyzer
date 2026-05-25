import { FileText, Zap, Clock } from "lucide-react";
import { formatDateTime, scoreClass } from "../../utils/formatters";

export default function ActivityFeed({ analyses = [] }) {
  if (analyses.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No analyses yet. Upload your first resume!</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {analyses.map((a) => (
        <div key={a.id} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={18} style={{ color: "var(--primary-light)" }} />
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {a.job_title || "Resume Analysis"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Clock size={11} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDateTime(a.created_at)}</span>
            </div>
          </div>
          <div style={{ display: "flex", flex: "column", gap: 4, alignItems: "flex-end" }}>
            {a.ats_score != null && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>ATS</p>
                <p className={scoreClass(a.ats_score)} style={{ fontSize: 16, fontWeight: 700 }}>{a.ats_score.toFixed(0)}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

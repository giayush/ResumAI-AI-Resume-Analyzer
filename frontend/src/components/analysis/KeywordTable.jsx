import { CheckCircle, XCircle, Search } from "lucide-react";
import { useState } from "react";

export default function KeywordTable({ matched = [], missing = [], tfidfScores = {} }) {
  const [filter, setFilter] = useState("");

  const filterFn = (kw) => kw.toLowerCase().includes(filter.toLowerCase());
  const filteredMatched = matched.filter(filterFn);
  const filteredMissing = missing.filter(filterFn);

  const maxScore = Math.max(...Object.values(tfidfScores), 1);

  const KeywordRow = ({ keyword, isMatched }) => {
    const score = tfidfScores[keyword] || 0;
    const pct = ((score / maxScore) * 100).toFixed(0);
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", borderRadius: 8,
        background: isMatched ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
        border: `1px solid ${isMatched ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
        marginBottom: 6,
      }}>
        {isMatched
          ? <CheckCircle size={13} style={{ color: "#34D399", flexShrink: 0 }} />
          : <XCircle size={13} style={{ color: "#F87171", flexShrink: 0 }} />}
        <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{keyword}</span>
        {score > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 50, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: isMatched ? "#34D399" : "#F87171", borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", width: 28, textAlign: "right" }}>{pct}%</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          className="form-input"
          placeholder="Filter keywords…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ paddingLeft: 34 }}
        />
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle size={14} style={{ color: "#34D399" }} />
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{matched.length} matched</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <XCircle size={14} style={{ color: "#F87171" }} />
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{missing.length} missing</span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ height: 6, borderRadius: 3, overflow: "hidden", width: 100, background: "var(--border)" }}>
              <div style={{ height: "100%", background: "var(--accent-green)", width: `${matched.length / Math.max(matched.length + missing.length, 1) * 100}%`, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {((matched.length / Math.max(matched.length + missing.length, 1)) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>✓ Matched</p>
          {filteredMatched.length === 0
            ? <p style={{ fontSize: 12, color: "var(--text-muted)" }}>None found</p>
            : filteredMatched.map((kw) => <KeywordRow key={kw} keyword={kw} isMatched />)}
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#F87171", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>✗ Missing</p>
          {filteredMissing.length === 0
            ? <p style={{ fontSize: 12, color: "var(--text-muted)" }}>None — great!</p>
            : filteredMissing.map((kw) => <KeywordRow key={kw} keyword={kw} isMatched={false} />)}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { ChevronDown, Lightbulb, BookOpen, Briefcase, Star, Zap } from "lucide-react";

const SECTION_META = {
  summary: { icon: BookOpen, label: "Professional Summary", color: "#6C63FF" },
  experience: { icon: Briefcase, label: "Work Experience", color: "#06B6D4" },
  skills: { icon: Zap, label: "Skills Section", color: "#10B981" },
  overall: { icon: Star, label: "Overall Feedback", color: "#F59E0B" },
  missing_skills_to_add: { icon: Lightbulb, label: "Skills to Add", color: "#EC4899" },
};

function AccordionItem({ section, suggestions }) {
  const [open, setOpen] = useState(false);
  const meta = SECTION_META[section] || { icon: Lightbulb, label: section, color: "var(--primary)" };
  const Icon = meta.icon;
  const items = Array.isArray(suggestions) ? suggestions.filter((s) => typeof s === "string") : [];
  if (items.length === 0) return null;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px", background: open ? "var(--bg-glass)" : "transparent",
          cursor: "pointer", border: "none", color: "var(--text-primary)",
          transition: "background 0.2s",
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `${meta.color}18`, border: `1px solid ${meta.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={14} style={{ color: meta.color }} />
        </div>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14, textAlign: "left" }}>{meta.label}</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 8 }}>{items.length} tips</span>
        <ChevronDown size={16} style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{ padding: "4px 16px 16px", background: "rgba(0,0,0,0.2)" }}>
          {items.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: meta.color, flexShrink: 0, marginTop: 7 }} />
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Keys that are NOT rendered by the generic AccordionItem loop
// phrasing_improvements → has its own dedicated renderer (array of {original, improved} objects)
// Keys starting with "_" → internal metadata (_provider, _error)
const EXCLUDED_FROM_ACCORDION = new Set(["phrasing_improvements"]);

export default function FeedbackPanel({ aiSuggestions = {}, grammarIssues = [] }) {
  const provider = aiSuggestions._provider;

  // Generic string-list sections → AccordionItem
  const sections = Object.entries(aiSuggestions).filter(
    ([k]) => !k.startsWith("_") && !EXCLUDED_FROM_ACCORDION.has(k)
  );

  // Phrasing improvements: array of {original, improved} — rendered separately
  const rawPhrasings = aiSuggestions.phrasing_improvements;
  const phrasings = Array.isArray(rawPhrasings)
    ? rawPhrasings.filter((p) => p && typeof p === "object" && p.original && p.improved)
    : [];

  return (
    <div>
      {provider && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Powered by {provider === "openai" ? "OpenAI GPT-4o" : provider === "gemini" ? "Google Gemini" : "AI"} analysis
          </span>
        </div>
      )}

      {/* Generic string-list sections */}
      {sections.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 32 }}>No AI feedback available</p>
      ) : (
        sections.map(([key, val]) => <AccordionItem key={key} section={key} suggestions={val} />)
      )}

      {/* Phrasing Improvements — always shown, with empty state fallback */}
      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>✍️ Phrasing Improvements</p>
        {phrasings.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>
            No phrasing improvements available.
          </p>
        ) : (
          phrasings.map((p, i) => (
            <div
              key={i}
              className="improvement-card"
              style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 10,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Original */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  color: "var(--text-muted)", background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)", borderRadius: 4,
                  padding: "2px 6px", flexShrink: 0, marginTop: 2,
                }}>ORIGINAL</span>
                <p className="original-text" style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                  lineHeight: 1.55,
                  margin: 0,
                }}>{p.original}</p>
              </div>

              {/* Divider arrow */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>↓ suggested improvement</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* Suggestion */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  color: "#22c55e", background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)", borderRadius: 4,
                  padding: "2px 6px", flexShrink: 0, marginTop: 2,
                }}>SUGGESTION</span>
                <p className="suggested-text" style={{
                  fontSize: 13,
                  color: "#22c55e",
                  fontWeight: 600,
                  lineHeight: 1.55,
                  margin: 0,
                }}>{p.improved}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Grammar Issues */}
      {grammarIssues.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>
            📝 Grammar & Style Issues ({grammarIssues.length})
          </p>
          {grammarIssues.slice(0, 10).map((issue, i) => (
            <div key={i} style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8, padding: "10px 12px", marginBottom: 6 }}>
              <p style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 4 }}>{issue.message}</p>
              {issue.replacements?.length > 0 && (
                <p style={{ fontSize: 11, color: "var(--accent)" }}>💡 Try: {issue.replacements.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

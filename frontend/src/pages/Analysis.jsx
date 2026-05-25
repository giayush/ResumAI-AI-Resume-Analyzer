import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { generateProfessionalPDF } from "../utils/pdfGenerator";
import { Download, ArrowLeft, Zap, Target, BookOpen, BarChart3 } from "lucide-react";
import Layout from "../components/layout/Layout";
import ATSMeter from "../components/analysis/ATSMeter";
import SkillChart from "../components/analysis/SkillChart";
import KeywordTable from "../components/analysis/KeywordTable";
import FeedbackPanel from "../components/analysis/FeedbackPanel";
import { analysisAPI } from "../services/api";
import { formatDateTime } from "../utils/formatters";

const tabs = [
  { id: "overview", label: "Overview", icon: Zap },
  { id: "keywords", label: "Keywords", icon: Target },
  { id: "skills", label: "Skills", icon: BarChart3 },
  { id: "feedback", label: "AI Feedback", icon: BookOpen },
];

export default function Analysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [exporting, setExporting] = useState(false);
  const pdfRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await analysisAPI.get(id);
        setAnalysis(res.data.analysis);
      } catch {
        toast.error("Analysis not found");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleExport = async () => {
    if (!analysis) {
      toast.error("Report not available yet. Please run analysis first.");
      return;
    }
    setExporting(true);
    try {
      await generateProfessionalPDF(analysis, id);
      toast.success("Report downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Report download failed. Try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    </Layout>
  );

  if (!analysis) return null;

  return (
    <Layout>
      <div className="fade-in">
        {/* Hidden internal container strictly for rendering SVGs to memory so svg2pdf can capture them */}
        <div id="pdf-chart-capture-container" style={{ 
          position: "fixed", top: 0, left: -9999, width: 800, zIndex: -100,
          background: "#ffffff",
          padding: "20px",
          "--bg-elevated": "#ffffff",
          "--text-primary": "#111827",
          "--text-secondary": "#4B5563",
          "--text-muted": "#6B7280",
          "--primary": "#6C63FF",
          "--border-strong": "#E5E7EB",
          "--polar-grid": "rgba(0,0,0,0.1)"
        }}>
          <SkillChart
            resumeSkills={
              analysis.resume_skills && typeof analysis.resume_skills === "object" && !Array.isArray(analysis.resume_skills)
                ? Object.values(analysis.resume_skills).flat()
                : (analysis.resume_skills || [])
            }
            requiredSkills={analysis.required_skills || []}
            atsBreakdown={analysis.ats_breakdown || {}}
          />
        </div>

        {/* Visible Header */}
        <div className="section-header" style={{ marginBottom: 28 }}>
          <div>
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 8, padding: "4px 8px" }}>
              <ArrowLeft size={14} /> Back
            </button>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800 }}>
              {analysis.job_title || "Resume Analysis"}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{formatDateTime(analysis.created_at)}</p>
          </div>
          <button id="export-pdf-btn" onClick={handleExport} className="btn btn-secondary" disabled={exporting}>
            {exporting ? <span className="spinner" /> : <Download size={15} />}
            {exporting ? "Generating…" : "Download PDF"}
          </button>
        </div>

        {/* Quick score row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { label: "ATS Score", value: `${(analysis.ats_score || 0).toFixed(1)}/100`, color: analysis.ats_score >= 70 ? "var(--accent-green)" : analysis.ats_score >= 50 ? "var(--accent)" : "var(--accent-red)" },
            { label: "JD Match", value: `${(analysis.match_percentage || 0).toFixed(1)}%`, color: analysis.match_percentage >= 70 ? "var(--accent-green)" : "var(--accent)" },
            { label: "Matched Keywords", value: analysis.matched_keywords?.length || 0, color: "var(--secondary)" },
            { label: "Missing Keywords", value: analysis.missing_keywords?.length || 0, color: "var(--accent-red)" },
            { label: "Grammar Issues", value: analysis.grammar_issues?.length || 0, color: "var(--accent)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: "12px 20px", flex: "0 0 auto" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-glass)", borderRadius: 12, padding: 4, border: "1px solid var(--border)", width: "fit-content" }}>
          {tabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className="btn btn-ghost"
              style={{
                gap: 6, padding: "8px 16px", borderRadius: 9,
                background: tab === tabId ? "rgba(108,99,255,0.2)" : "transparent",
                color: tab === tabId ? "var(--primary-light)" : "var(--text-secondary)",
                border: tab === tabId ? "1px solid rgba(108,99,255,0.3)" : "1px solid transparent",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="fade-in">
          {tab === "overview" && (
            <div className="grid-2" style={{ alignItems: "start" }}>
              <div className="card-glass" style={{ padding: 32, textAlign: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>ATS Score</h3>
                <ATSMeter score={analysis.ats_score || 0} />
              </div>
              <div className="card-glass" style={{ padding: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Score Breakdown</h3>
                {Object.entries(analysis.ats_breakdown || {}).map(([key, val]) => {
                  const score = typeof val === "object" ? (val.score || 0) : val;
                  const maxPts = 25;
                  const pct = (score / maxPts) * 100;
                  return (
                    <div key={key} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>{key}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{score.toFixed(1)} pts</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
                {analysis.skill_gaps?.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>Skill Gaps to Address:</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {analysis.skill_gaps.map((s) => <span key={s} className="tag tag-missing">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {tab === "keywords" && (
            <div className="card-glass" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Keyword Analysis</h3>
              <KeywordTable
                matched={analysis.matched_keywords || []}
                missing={analysis.missing_keywords || []}
                tfidfScores={analysis.tfidf_scores || {}}
              />
            </div>
          )}
          {tab === "skills" && (
            <div className="card-glass" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Skill Analysis</h3>
              <SkillChart
                resumeSkills={
                  analysis.resume_skills && typeof analysis.resume_skills === "object" && !Array.isArray(analysis.resume_skills)
                    ? Object.values(analysis.resume_skills).flat()
                    : (analysis.resume_skills || [])
                }
                requiredSkills={analysis.required_skills || []}
                atsBreakdown={analysis.ats_breakdown || {}}
              />
            </div>
          )}
          {tab === "feedback" && (
            <div className="card-glass" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>AI Improvement Suggestions</h3>
              <FeedbackPanel
                aiSuggestions={analysis.ai_suggestions || {}}
                grammarIssues={analysis.grammar_issues || []}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

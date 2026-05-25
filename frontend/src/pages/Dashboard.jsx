import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, BarChart3, Plus, Trash2, Zap, Crown } from "lucide-react";
import { toast } from "react-hot-toast";
import Layout from "../components/layout/Layout";
import StatCard from "../components/dashboard/StatCard";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import { resumeAPI, analysisAPI } from "../services/api";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { formatDate, formatBytes } from "../utils/formatters";

export default function Dashboard() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [isPremium, setIsPremium] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch subscription status (using the same Firebase-authed axios instance) ──
  useEffect(() => {
    api
      .get("/user/me")
      .then(({ data }) => {
        const active = Boolean(data.subscription_active);
        setIsPremium(active);
        updateUser({
          subscription_active: active,
          analysis_count: data.analysis_count,
        });
      })
      .catch((err) =>
        console.warn("Could not load subscription status:", err?.response?.data || err.message)
      );
  }, []);

  // ── Fetch dashboard data ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rRes, aRes] = await Promise.all([
          resumeAPI.list(),
          analysisAPI.history(),
        ]);
        setResumes(rRes.data.resumes || []);
        setAnalyses(aRes.data.analyses || []);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this resume and all its analyses?")) return;
    try {
      await resumeAPI.delete(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      toast.success("Resume deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const avgAts = analyses.length
    ? (analyses.reduce((s, a) => s + (a.ats_score || 0), 0) / analyses.length).toFixed(1)
    : "—";

  const latestSkills = analyses[0]?.resume_skills
    ? [
        ...(analyses[0].resume_skills.technical || []),
        ...(analyses[0].resume_skills.soft || []),
      ].slice(0, 15)
    : [];

  return (
    <Layout>
      <div className="fade-in">
        {/* Header */}
        <div className="section-header" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800 }}>
              Welcome back, {user?.full_name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="section-subtitle">Here's your resume analysis overview</p>
          </div>
          <Link to="/upload" className="btn btn-primary" id="new-analysis-btn">
            <Plus size={16} /> New Analysis
          </Link>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 32 }}>
          <StatCard title="Total Resumes" value={loading ? "…" : resumes.length} icon={FileText} color="var(--primary)" />
          <StatCard title="Analyses Run" value={loading ? "…" : analyses.length} icon={BarChart3} color="var(--secondary)" />
          <StatCard title="Avg ATS Score" value={loading ? "…" : avgAts} icon={Zap} color="var(--accent-green)" subtitle="out of 100" />
          <StatCard
            title="Skills Tracked"
            value={loading ? "…" : (
              analyses[0]?.resume_skills
                ? (Object.values(analyses[0].resume_skills).flat().length || "—")
                : "—"
            )}
            icon={BarChart3}
            color="var(--accent)"
          />
        </div>

        {/* Premium Upgrade Banner */}
        {!isPremium && (
          <div
            className="card-glass"
            style={{
              marginBottom: 32,
              padding: "24px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid rgba(255,215,0,0.3)",
              background: "linear-gradient(90deg, rgba(108,99,255,0.08) 0%, rgba(255,215,0,0.05) 100%)",
            }}
          >
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div
                style={{
                  background: "rgba(255,215,0,0.15)",
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Crown size={26} style={{ color: "#FFD700" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Upgrade to Premium</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Unlock unlimited AI analysis, keyword matching, grammar fixes & more.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "line-through" }}>₹999</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)", marginLeft: 8 }}>₹499</span>
              </div>
              <button
                id="upgrade-to-premium-btn"
                onClick={() => navigate("/subscription")}
                className="btn btn-primary"
                style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899)", border: "none" }}
              >
                🚀 Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Premium Active Badge */}
        {isPremium && (
          <div
            style={{
              marginBottom: 32,
              padding: "12px 20px",
              borderRadius: 12,
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Crown size={16} style={{ color: "#10B981" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}>Premium Active</span>
          </div>
        )}

        <div className="grid-2">
          {/* Recent Resumes */}
          <div>
            <div className="section-header">
              <h2 className="section-title" style={{ fontSize: 16 }}>📄 My Resumes</h2>
              <Link to="/upload" className="btn btn-sm btn-ghost">Upload New</Link>
            </div>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><span className="spinner" /></div>
            ) : resumes.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📎</div>
                <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>No resumes uploaded yet</p>
                <Link to="/upload" className="btn btn-primary btn-sm">Upload Resume</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {resumes.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="card"
                    style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                    onClick={() => navigate(`/upload?resume=${r.id}`)}
                  >
                    <FileText size={18} style={{ color: "var(--primary-light)", flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.filename}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDate(r.uploaded_at)} • {formatBytes(r.file_size)}</p>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.analysis_count} runs</span>
                    <button onClick={(e) => handleDelete(r.id, e)} className="btn-icon" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Analyses */}
          <div>
            <div className="section-header">
              <h2 className="section-title" style={{ fontSize: 16 }}>⚡ Recent Analyses</h2>
              <Link to="/history" className="btn btn-sm btn-ghost">View All</Link>
            </div>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><span className="spinner" /></div>
            ) : (
              <ActivityFeed analyses={analyses.slice(0, 5)} />
            )}
          </div>
        </div>

        {/* Skills Section */}
        {!loading && latestSkills.length > 0 && (
          <div className="card-glass" style={{ marginTop: 32, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>🔍 Skills Identified (Latest Analysis)</h3>
              <Link to={`/analysis/${analyses[0].id}`} className="btn btn-sm btn-ghost">View Full Breakdown</Link>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {latestSkills.map((skill) => (
                <span
                  key={skill}
                  className="tag"
                  style={{ background: "rgba(108,99,255,0.1)", color: "var(--primary-light)", border: "1px solid rgba(108,99,255,0.2)" }}
                >
                  {skill}
                </span>
              ))}
              {latestSkills.length >= 15 && (
                <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center", marginLeft: 8 }}>...and more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

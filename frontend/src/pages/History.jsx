import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { BarChart3, ExternalLink, Trash2, Download } from "lucide-react";
import Layout from "../components/layout/Layout";
import { analysisAPI } from "../services/api";
import { formatDateTime, scoreColor, scoreLabel, downloadBlob } from "../utils/formatters";

export default function History() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await analysisAPI.history(p);
      setAnalyses(res.data.analyses || []);
      setTotalPages(res.data.pages || 1);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(page); }, [page]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this analysis?")) return;
    try {
      await analysisAPI.delete(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Analysis deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleExport = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await analysisAPI.exportPdf(id);
      downloadBlob(res.data, `report_${id.slice(0, 8)}.pdf`);
      toast.success("Report downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <Layout>
      <div className="fade-in">
        <div className="section-header" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800 }}>Analysis History</h1>
            <p className="section-subtitle">All your past resume analyses</p>
          </div>
          <Link to="/upload" className="btn btn-primary">New Analysis</Link>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><span className="spinner" style={{ width: 40, height: 40 }} /></div>
        ) : analyses.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 72 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8 }}>No analyses yet</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>Upload a resume and analyze it against a job description to get started.</p>
            <Link to="/upload" className="btn btn-primary">Analyze My Resume</Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {analyses.map((a) => {
                const color = scoreColor(a.ats_score || 0);
                return (
                  <div
                    key={a.id}
                    className="card"
                    style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
                    onClick={() => navigate(`/analysis/${a.id}`)}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <BarChart3 size={20} style={{ color }} />
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <p style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.job_title || "Untitled Analysis"}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{formatDateTime(a.created_at)}</p>
                    </div>
                    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>ATS</p>
                        <p style={{ fontSize: 20, fontWeight: 800, color }}>{(a.ats_score || 0).toFixed(0)}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Match</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--secondary)" }}>{(a.match_percentage || 0).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={(e) => handleExport(a.id, e)} className="btn-icon" title="Download PDF"><Download size={14} /></button>
                      <button onClick={(e) => handleDelete(a.id, e)} className="btn-icon" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(page - 1)} disabled={page === 1}>← Prev</button>
                <span style={{ fontSize: 13, color: "var(--text-muted)", alignSelf: "center" }}>Page {page} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

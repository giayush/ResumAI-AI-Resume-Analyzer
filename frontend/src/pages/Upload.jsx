import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowRight, Briefcase, Sparkles, ChevronRight } from "lucide-react";
import Layout from "../components/layout/Layout";
import DragDropZone from "../components/upload/DragDropZone";
import { resumeAPI, analysisAPI } from "../services/api";

export default function Upload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [uploadedResume, setUploadedResume] = useState(null);
  const [step, setStep] = useState(1); // 1: upload, 2: JD, 3: analyzing
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingJD, setGeneratingJD] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  // Support pre-selected resume from dashboard
  useEffect(() => {
    const resumeId = searchParams.get("resume");
    if (resumeId) {
      resumeAPI.get(resumeId).then((res) => {
        setUploadedResume(res.data.resume);
        setStep(2);
      }).catch(() => {});
    }
  }, []);

  const handleUpload = async () => {
    if (!file) { toast.error("Please select a file"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await resumeAPI.upload(formData);
      setUploadedResume(res.data.resume);
      setStep(2);
      toast.success("Resume uploaded and parsed! ✅");
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) { toast.error("Please enter a job description"); return; }
    setAnalyzing(true);
    setStep(3);
    try {
      const res = await analysisAPI.analyze({
        resume_id: uploadedResume.id,
        job_description: jobDescription,
        job_title: jobTitle,
      });
      toast.success("Analysis complete! 🎉");
      navigate(`/analysis/${res.data.analysis.id}`);
    } catch (err) {
      if (err.response?.status === 403) {
        setShowUpgradePopup(true);
      } else {
        toast.error(err.response?.data?.message || err.response?.data?.error || "Analysis failed");
      }
      setStep(2);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateJD = async () => {
    if (!jobTitle.trim()) {
      toast.error("Please enter a job title first");
      return;
    }
    setGeneratingJD(true);
    try {
      const res = await analysisAPI.generateJD(jobTitle);
      const jd = res.data;
      const formattedJD = `
### Job Summary
${jd.job_summary}

### Key Responsibilities
${jd.responsibilities.map(r => `• ${r}`).join('\n')}

### Required Skills
${jd.required_skills.map(s => `• ${s}`).join('\n')}

### Preferred Skills
${jd.preferred_skills.map(s => `• ${s}`).join('\n')}

### Qualifications
${jd.qualifications.map(q => `• ${q}`).join('\n')}

### Experience Requirements
${jd.experience}
      `.trim();
      
      setJobDescription(formattedJD);
      toast.success("Job description generated! ✨");
    } catch (err) {
      toast.error(err.response?.data?.error || "Generation failed");
    } finally {
      setGeneratingJD(false);
    }
  };

  return (
    <Layout>
      {showUpgradePopup && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card-glass" style={{ padding: 32, maxWidth: 400, textAlign: "center", background: "var(--bg-glass)" }}>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Limit Reached</h2>
            <p style={{ marginBottom: 24, color: "var(--text-secondary)" }}>
              You have reached the free limit. Upgrade to premium.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn" onClick={() => setShowUpgradePopup(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => navigate("/subscription")}>Upgrade Now</button>
            </div>
          </div>
        </div>
      )}
      <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            ⚡ Analyze Your Resume
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Upload your resume and paste a job description for a full AI analysis</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
          {[{ n: 1, label: "Upload Resume" }, { n: 2, label: "Job Description" }, { n: 3, label: "Analysis" }].map(({ n, label }, i) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                background: step >= n ? "var(--grad-primary)" : "var(--bg-glass)",
                color: step >= n ? "#fff" : "var(--text-muted)",
                border: step === n ? "none" : `1px solid var(--border)`,
                boxShadow: step >= n ? "0 0 12px rgba(108,99,255,0.4)" : "none",
              }}>{n}</div>
              <span style={{ fontSize: 13, fontWeight: step === n ? 600 : 400, color: step === n ? "var(--text-primary)" : "var(--text-muted)" }}>{label}</span>
              {i < 2 && <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="card-glass" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Upload Your Resume</h2>
            <DragDropZone
              file={file}
              onFileSelect={setFile}
              onRemove={() => setFile(null)}
            />
            {file && (
              <button id="upload-btn" onClick={handleUpload} className="btn btn-primary" disabled={uploading} style={{ width: "100%", marginTop: 20, padding: "14px" }}>
                {uploading ? <><span className="spinner" /> Parsing resume…</> : <>Upload & Parse <ArrowRight size={16} /></>}
              </button>
            )}
          </div>
        )}

        {/* Step 2: JD */}
        {step === 2 && (
          <div className="card-glass" style={{ padding: 32 }}>
            {uploadedResume && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, marginBottom: 24 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-green)" }} />
                <span style={{ fontSize: 13, color: "var(--accent-green)", fontWeight: 500 }}>
                  Resume loaded: {uploadedResume.filename}
                </span>
              </div>
            )}
            <div className="form-group" style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}><Briefcase size={13} style={{ display: "inline", marginRight: 6 }} />Job Title</label>
                <button 
                  onClick={handleGenerateJD}
                  disabled={generatingJD || !jobTitle.trim()}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--accent-purple)",
                    background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 6,
                    padding: "4px 8px", cursor: "pointer", transition: "all 0.2s"
                  }}
                  className="btn-hover"
                >
                  {generatingJD ? <span className="spinner" style={{ width: 10, height: 10 }} /> : <Sparkles size={11} />}
                  Auto-generate JD
                </button>
              </div>
              <input id="job-title-input" className="form-input" placeholder="e.g. Senior Frontend Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label"><Sparkles size={13} style={{ display: "inline", marginRight: 6 }} />Job Description *</label>
              <textarea
                id="job-desc-input"
                className="form-textarea"
                placeholder="Paste the full job description here, or click 'Auto-generate JD' above after entering a title."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={{ minHeight: 220 }}
              />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{jobDescription.length} characters</span>
            </div>
            <button id="analyze-btn" onClick={handleAnalyze} className="btn btn-primary" disabled={analyzing || !jobDescription.trim()} style={{ width: "100%", padding: "14px" }}>
              {analyzing ? <><span className="spinner" /> Analyzing with AI…</> : <>Run Full AI Analysis <Sparkles size={16} /></>}
            </button>
          </div>
        )}

        {/* Step 3: Loading */}
        {step === 3 && (
          <div className="card-glass" style={{ padding: 64, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🤖</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>AI Pipeline Running…</h2>
            <div className="dot-pulse" style={{ justifyContent: "center", display: "flex", marginBottom: 24 }}>
              <span /><span /><span />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300, margin: "0 auto" }}>
              {["📄 Parsing resume text", "🧠 Running NLP extraction", "📊 Computing TF-IDF similarity", "🎯 Calculating ATS score", "✨ Getting AI feedback"].map((step) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                  <div className="spinner" style={{ width: 12, height: 12 }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

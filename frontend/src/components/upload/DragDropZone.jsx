import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, X } from "lucide-react";
import { formatBytes } from "../../utils/formatters";

export default function DragDropZone({ onFileSelect, file, onRemove }) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) onFileSelect(acceptedFiles[0]);
    setDragActive(false);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  if (file) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "20px 24px", borderRadius: 16,
        background: "rgba(16,185,129,0.08)", border: "2px solid rgba(16,185,129,0.3)",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FileText size={22} style={{ color: "#34D399" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{file.name}</p>
          <p style={{ fontSize: 12, color: "var(--text-muted", marginTop: 2 }}>{formatBytes(file.size)} • {file.type.includes("pdf") ? "PDF" : "DOCX"}</p>
        </div>
        <CheckCircle size={20} style={{ color: "#34D399" }} />
        <button onClick={onRemove} className="btn-icon" title="Remove file">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      style={{
        padding: "52px 32px",
        borderRadius: 20,
        border: `2px dashed ${isDragActive ? "var(--primary)" : "rgba(255,255,255,0.12)"}`,
        background: isDragActive ? "rgba(108,99,255,0.08)" : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        textAlign: "center",
        transition: "all 0.25s",
        outline: "none",
      }}
    >
      <input id="resume-file-input" {...getInputProps()} />
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: isDragActive ? "rgba(108,99,255,0.2)" : "rgba(108,99,255,0.1)",
        border: `1px solid ${isDragActive ? "rgba(108,99,255,0.5)" : "rgba(108,99,255,0.2)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px",
        transition: "all 0.25s",
        transform: isDragActive ? "scale(1.1)" : "scale(1)",
      }}>
        <Upload size={28} style={{ color: "var(--primary-light)" }} />
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
        {isDragActive ? "Drop your resume here!" : "Drag & drop your resume"}
      </p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>or click to browse files</p>
      <div style={{ display: "inline-flex", gap: 8 }}>
        {["PDF", "DOCX"].map((fmt) => (
          <span key={fmt} style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.2)",
            color: "var(--primary-light)", letterSpacing: "0.05em",
          }}>{fmt}</span>
        ))}
        <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, color: "var(--text-muted)", background: "var(--bg-glass)", border: "1px solid var(--border)" }}>Max 10 MB</span>
      </div>
    </div>
  );
}

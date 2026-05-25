import { FileText, X, CheckCircle } from "lucide-react";
import { formatBytes } from "../../utils/formatters";

/**
 * FilePreview — compact card showing selected file details.
 * Shown after a file is chosen in DragDropZone but before upload.
 */
export default function FilePreview({ file, onRemove }) {
  if (!file) return null;

  const isValid = file.type === "application/pdf" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const extension = file.name.split(".").pop().toUpperCase();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "16px 20px",
      borderRadius: 14,
      background: isValid ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
      border: `1px solid ${isValid ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
      transition: "all 0.2s",
    }}>
      {/* Icon */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: isValid ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
        border: `1px solid ${isValid ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <FileText size={20} style={{ color: isValid ? "#34D399" : "#F87171" }} />
      </div>

      {/* Details */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <p style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          marginBottom: 3,
        }}>
          {file.name}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
            background: "rgba(108,99,255,0.15)",
            color: "var(--primary-light)",
            letterSpacing: "0.04em",
          }}>
            {extension}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {formatBytes(file.size)}
          </span>
          {file.size > 10 * 1024 * 1024 && (
            <span style={{ fontSize: 11, color: "var(--accent-red)" }}>
              ⚠ Exceeds 10 MB limit
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <CheckCircle size={18} style={{ color: "#34D399", flexShrink: 0 }} />

      {/* Remove */}
      <button
        onClick={onRemove}
        title="Remove file"
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "var(--bg-glass)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--text-muted)",
          flexShrink: 0,
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = "var(--accent-red)";
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// formatters.js — Utility functions for display formatting.
// BUG-15: downloadBlob fixed for Firefox/Safari (append/remove from DOM).

export const formatDate = (isoString) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

export const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

export const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

export const scoreColor = (score) => {
  const s = Number(score) || 0;
  if (s >= 80) return "var(--accent-green)";
  if (s >= 60) return "#60A5FA";
  if (s >= 40) return "var(--accent)";
  return "var(--accent-red)";
};

export const scoreLabel = (score) => {
  const s = Number(score) || 0;
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  return "Needs Work";
};

export const scoreClass = (score) => {
  const s = Number(score) || 0;
  if (s >= 80) return "score-excellent";
  if (s >= 60) return "score-good";
  if (s >= 40) return "score-fair";
  return "score-poor";
};

/**
 * BUG-15 FIX: downloadBlob must append anchor to document for Firefox/Safari.
 * Without this, click() is ignored in non-Chrome browsers.
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);   // Required for Firefox
  a.click();
  document.body.removeChild(a);   // Cleanup
  // Delay revoke slightly so browser finishes initiating the download
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const truncate = (str, max = 40) =>
  str && str.length > max ? str.slice(0, max) + "…" : str || "";

/** Clamp a number between min and max. */
export const clamp = (val, min = 0, max = 100) =>
  Math.min(Math.max(Number(val) || 0, min), max);

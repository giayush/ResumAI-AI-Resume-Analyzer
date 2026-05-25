/**
 * themeStore.js — Global theme state (dark | light).
 *
 * - Reads initial value from localStorage ("theme"), defaults to "dark"
 * - On every toggle, writes to localStorage and updates data-theme on <html>
 * - The <html data-theme="light"> attribute drives all CSS variable overrides
 */
import { create } from "zustand";

function getStoredTheme() {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // eslint-disable-next-line no-empty
  }
  return "dark"; // Default to dark mode
}

function applyThemeToDOM(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export const useThemeStore = create((set, get) => ({
  theme: getStoredTheme(),

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyThemeToDOM(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // eslint-disable-next-line no-empty
    }
    set({ theme: next });
  },

  /** Call once on app boot to ensure DOM matches stored preference. */
  initTheme: () => {
    const theme = getStoredTheme();
    applyThemeToDOM(theme);
    set({ theme });
  },
}));

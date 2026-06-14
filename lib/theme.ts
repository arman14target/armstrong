export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "armstrong-theme-v1";

export const THEME_COLORS: Record<Theme, string> = {
  dark: "#04060d",
  light: "#f0f4fa",
};

export function loadTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // ignore read errors
  }

  return "dark";
}

export function saveTheme(theme: Theme): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEME_COLORS[theme]);
  }

  window.dispatchEvent(new CustomEvent("armstrong-theme-change", { detail: theme }));
}

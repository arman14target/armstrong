export type ColorScheme = "light" | "dark";

const LIGHT_MEDIA_QUERY = "(prefers-color-scheme: light)";

export function resolveColorScheme(prefersLight: boolean): ColorScheme {
  return prefersLight ? "light" : "dark";
}

export function getPreferredColorScheme(): ColorScheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  return resolveColorScheme(window.matchMedia(LIGHT_MEDIA_QUERY).matches);
}

/** Runs before paint on blog routes to avoid theme flash. */
export const BLOG_THEME_INIT_SCRIPT = `(function(){var d=document.documentElement;d.dataset.page="blog";d.dataset.colorScheme=window.matchMedia("${LIGHT_MEDIA_QUERY}").matches?"light":"dark";})();`;

export function applyBlogPageMarkers(scheme: ColorScheme): void {
  document.documentElement.dataset.page = "blog";
  document.documentElement.dataset.colorScheme = scheme;
}

export function clearBlogPageMarkers(): void {
  delete document.documentElement.dataset.page;
  delete document.documentElement.dataset.colorScheme;
}

export function subscribePreferredColorScheme(
  onChange: (scheme: ColorScheme) => void,
): () => void {
  const mediaQuery = window.matchMedia(LIGHT_MEDIA_QUERY);
  const handleChange = () => {
    onChange(resolveColorScheme(mediaQuery.matches));
  };

  handleChange();
  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
}

const BLOG_THEME_COLORS: Record<ColorScheme, string> = {
  light: "#fafaf8",
  dark: "#0a0a0b",
};

export function blogThemeColor(scheme: ColorScheme): string {
  return BLOG_THEME_COLORS[scheme];
}

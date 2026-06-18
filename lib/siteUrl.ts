const DEFAULT_SITE_URL = "https://armstrong.app";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return DEFAULT_SITE_URL;
}

export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

export function absoluteUrl(path: string): string {
  const base = getBasePath().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withTrailingSlash = normalized.endsWith("/") ? normalized : `${normalized}/`;
  return `${getSiteUrl()}${base}${withTrailingSlash}`;
}

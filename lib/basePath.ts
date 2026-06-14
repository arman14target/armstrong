export function getBasePath(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  }

  const base = document.querySelector("base");
  if (base?.href) {
    try {
      const url = new URL(base.href);
      const path = url.pathname.replace(/\/$/, "");
      return path === "/" ? "" : path;
    } catch {
      // fall through
    }
  }

  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

export function withBasePath(path: string): string {
  const base = getBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

import { Capacitor } from "@capacitor/core";
import { getBasePath } from "@/lib/basePath";
import { APP_ROUTE } from "@/lib/routes";

const NATIVE_APP_ROUTES = new Set([
  "/",
  APP_ROUTE.replace(/\/$/, ""),
  "/workout",
]);

export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export function normalizeAppPath(pathname: string): string {
  const base = getBasePath();
  let path = pathname;

  if (base && path.startsWith(base)) {
    path = path.slice(base.length) || "/";
  }

  // Capacitor static file URLs can surface index.html in the pathname.
  if (path.endsWith("/index.html")) {
    path = path.slice(0, -"/index.html".length) || "/";
  } else if (path === "/index.html") {
    path = "/";
  }

  return path.replace(/\/$/, "") || "/";
}

export function getNativeAppEntryPath(): string {
  const base = getBasePath().replace(/\/$/, "");
  const route = APP_ROUTE.replace(/\/$/, "");
  return `${base}${route}/`;
}

export function isNativeAllowedRoute(pathname: string): boolean {
  return NATIVE_APP_ROUTES.has(normalizeAppPath(pathname));
}

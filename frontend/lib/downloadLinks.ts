import { APP_ROUTE } from "@/lib/routes";

export const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || "";

export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() || "";

export const PWA_PATH = APP_ROUTE;

export type DownloadPlatform = "apple" | "android" | "pwa";

export function getDownloadLink(platform: DownloadPlatform): string | null {
  switch (platform) {
    case "apple":
      return APP_STORE_URL || null;
    case "android":
      return PLAY_STORE_URL || null;
    case "pwa":
      return PWA_PATH;
  }
}

export function isDownloadAvailable(platform: DownloadPlatform): boolean {
  return platform === "pwa" || Boolean(getDownloadLink(platform));
}

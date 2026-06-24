import i18n from "./index";

/** Translate outside React components (libs, notifications, share text). */
export function t(
  key: string,
  options?: Record<string, string | number>,
): string {
  return i18n.t(key, options);
}

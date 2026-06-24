import {
  DEFAULT_LOCALE,
  type AppLocale,
  isAppLocale,
  SUPPORTED_LOCALES,
} from "./locales";

function normalizeTag(tag: string): string {
  return tag.trim().replace(/_/g, "-");
}

function exactMatch(tag: string): AppLocale | null {
  const normalized = normalizeTag(tag);
  if (isAppLocale(normalized)) {
    return normalized;
  }
  return null;
}

function fuzzyMatch(tag: string): AppLocale | null {
  const normalized = normalizeTag(tag).toLowerCase();
  const [language, region] = normalized.split("-");

  if (language === "en") {
    return region === "gb" ? "en-GB" : "en-US";
  }
  if (language === "de") {
    if (region === "at") return "de-AT";
    if (region === "ch") return "de-CH";
    return "de";
  }
  if (language === "fr") {
    return region === "ch" ? "fr-CH" : "fr";
  }
  if (language === "es") return "es";
  if (language === "it") return "it";

  return null;
}

/** Map browser / OS language tags to a supported app locale. */
export function detectBrowserLocale(): AppLocale {
  if (typeof navigator === "undefined") {
    return DEFAULT_LOCALE;
  }

  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const tag of candidates) {
    const exact = exactMatch(tag);
    if (exact) return exact;

    const fuzzy = fuzzyMatch(tag);
    if (fuzzy) return fuzzy;
  }

  return DEFAULT_LOCALE;
}

export function resolveAppLocale(saved?: string | null): AppLocale {
  if (saved && isAppLocale(saved)) {
    return saved;
  }
  return detectBrowserLocale();
}

export { SUPPORTED_LOCALES };

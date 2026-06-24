/** BCP 47 locale codes supported by the app. */
export const SUPPORTED_LOCALES = [
  "en-US",
  "en-GB",
  "de",
  "de-AT",
  "de-CH",
  "es",
  "fr",
  "fr-CH",
  "it",
] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en-US";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  "en-US": "English (US)",
  "en-GB": "English (UK)",
  de: "Deutsch",
  "de-AT": "Deutsch (Österreich)",
  "de-CH": "Deutsch (Schweiz)",
  es: "Español",
  fr: "Français",
  "fr-CH": "Français (Suisse)",
  it: "Italiano",
};

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

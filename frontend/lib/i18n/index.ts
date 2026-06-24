import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from "./locales";
import de from "./locales/de.json";
import deAT from "./locales/de-AT.json";
import deCH from "./locales/de-CH.json";
import enGB from "./locales/en-GB.json";
import enUS from "./locales/en-US.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import frCH from "./locales/fr-CH.json";
import it from "./locales/it.json";

const resources = {
  "en-US": { translation: enUS },
  "en-GB": { translation: enGB },
  de: { translation: de },
  "de-AT": { translation: deAT },
  "de-CH": { translation: deCH },
  es: { translation: es },
  fr: { translation: fr },
  "fr-CH": { translation: frCH },
  it: { translation: it },
} as const;

let initialized = false;

export function initI18n(locale: AppLocale = DEFAULT_LOCALE): typeof i18n {
  if (!initialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: [...SUPPORTED_LOCALES],
      nonExplicitSupportedLngs: false,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
    initialized = true;
  } else if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }

  return i18n;
}

export async function changeAppLanguage(locale: AppLocale): Promise<void> {
  if (!initialized) {
    initI18n(locale);
    return;
  }
  await i18n.changeLanguage(locale);
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

export default i18n;

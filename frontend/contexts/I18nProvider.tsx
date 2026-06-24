"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { useGymStore } from "@/hooks/useGymStore";
import { changeAppLanguage, initI18n } from "@/lib/i18n";
import { resolveAppLocale } from "@/lib/i18n/detectLocale";

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { data, hydrated, setLocale } = useGymStore();
  const locale = resolveAppLocale(data.locale);

  useEffect(() => {
    if (!hydrated) return;

    if (!data.locale) {
      setLocale(locale);
      return;
    }

    void changeAppLanguage(resolveAppLocale(data.locale));
  }, [hydrated, data.locale, locale, setLocale]);

  const i18n = initI18n(hydrated ? resolveAppLocale(data.locale) : locale);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

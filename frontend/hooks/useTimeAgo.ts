"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatTimeAgo } from "@/lib/formatRelativeTime";

export function useTimeAgo(iso?: string): string {
  const { i18n } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const [, setLanguageTick] = useState(0);

  useEffect(() => {
    const onLanguageChanged = () => setLanguageTick((tick) => tick + 1);
    i18n.on("languageChanged", onLanguageChanged);
    return () => {
      i18n.off("languageChanged", onLanguageChanged);
    };
  }, [i18n]);

  useEffect(() => {
    if (!iso) {
      return;
    }

    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [iso]);

  return formatTimeAgo(iso, now);
}

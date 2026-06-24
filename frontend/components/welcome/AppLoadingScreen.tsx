"use client";

import { useTranslation } from "react-i18next";
import { WelcomeBrand } from "@/components/welcome/WelcomeBrand";
import { WelcomeStrengthBackground } from "@/components/welcome/WelcomeStrengthBackground";

export function AppLoadingScreen() {
  const { t } = useTranslation();

  return (
    <div className="app-loading" aria-busy="true" aria-label={t("brand.loadingAria")}>
      <div className="app-loading__stack">
        <WelcomeBrand loading />
        <WelcomeStrengthBackground placement="below" />
      </div>
    </div>
  );
}

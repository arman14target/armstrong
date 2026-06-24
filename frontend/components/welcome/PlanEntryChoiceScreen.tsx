"use client";

import { useTranslation } from "react-i18next";
import { ManualPlanIcon, PlainTextPlanIcon } from "@/components/welcome/WelcomeIcons";
import { WelcomeBackButton } from "@/components/welcome/WelcomeBackButton";
import { WelcomeBrand } from "@/components/welcome/WelcomeBrand";

export interface PlanEntryChoiceScreenProps {
  title: string;
  description: string;
  onPlainText: () => void;
  onManualAdd: () => void;
  onBack?: () => void;
}

export function PlanEntryChoiceScreen({
  title,
  description,
  onPlainText,
  onManualAdd,
  onBack,
}: PlanEntryChoiceScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="welcome-choice stack-lg">
      {onBack ? (
        <div className="welcome-onboarding__toolbar">
          <WelcomeBackButton onClick={onBack} />
          <WelcomeBrand compact />
        </div>
      ) : null}

      <header className="welcome-choice__header">
        <h1 className="welcome-choice__title">{title}</h1>
        <p className="welcome-choice__subtitle">{description}</p>
      </header>

      <div className="welcome-cards">
        <button type="button" className="welcome-card" onClick={onPlainText}>
          <div className="welcome-card__content">
            <h2 className="welcome-card__title">{t("welcome.plainTextTitle")}</h2>
            <p className="welcome-card__copy">{t("welcome.plainTextCopy")}</p>
          </div>
          <PlainTextPlanIcon />
        </button>

        <button type="button" className="welcome-card" onClick={onManualAdd}>
          <div className="welcome-card__content">
            <h2 className="welcome-card__title">{t("welcome.manualTitle")}</h2>
            <p className="welcome-card__copy">{t("welcome.manualCopy")}</p>
          </div>
          <ManualPlanIcon />
        </button>
      </div>
    </div>
  );
}

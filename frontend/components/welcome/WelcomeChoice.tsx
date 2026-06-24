"use client";

import { useTranslation } from "react-i18next";
import { DumbbellIcon, FlashIcon, FoodIcon, MoneyIcon } from "@/components/icons/ActionIcons";
import { ExistingPlanIcon, PlanSparkIcon } from "@/components/welcome/WelcomeIcons";

interface WelcomeChoiceProps {
  onMakePlan: () => void;
  onHavePlan: () => void;
  onLogin: () => void;
}

export function WelcomeChoice({ onMakePlan, onHavePlan, onLogin }: WelcomeChoiceProps) {
  const { t } = useTranslation();

  return (
    <div className="welcome-choice stack-lg">
      <header className="welcome-choice__header">
        <h1 className="welcome-choice__title">{t("welcome.title")}</h1>
        <p className="welcome-choice__subtitle">{t("welcome.subtitle")}</p>
      </header>

      <div className="welcome-cards">
        <button type="button" className="welcome-card welcome-card--primary" onClick={onMakePlan}>
          <div className="welcome-card__content">
            <p className="welcome-card__eyebrow">{t("welcome.recommended")}</p>
            <h2 className="welcome-card__title">{t("welcome.makePlanTitle")}</h2>
            <p className="welcome-card__copy">{t("welcome.makePlanCopy")}</p>
            <div className="welcome-card__badges">
              <span className="welcome-card__badge welcome-card__badge--instant">
                <FlashIcon className="welcome-card__badge-icon" />
                {t("welcome.badgeInstant")}
              </span>
              <span className="welcome-card__badge welcome-card__badge--free">
                <MoneyIcon className="welcome-card__badge-icon" />
                {t("welcome.badgeFree")}
              </span>
              <span className="welcome-card__badge welcome-card__badge--diet">
                <FoodIcon className="welcome-card__badge-icon" />
                {t("welcome.badgeDiet")}
              </span>
              <span className="welcome-card__badge welcome-card__badge--exercise">
                <DumbbellIcon className="welcome-card__badge-icon" />
                {t("welcome.badgeExercise")}
              </span>
            </div>
          </div>
          <PlanSparkIcon />
        </button>

        <button type="button" className="welcome-card" onClick={onHavePlan}>
          <div className="welcome-card__content">
            <h2 className="welcome-card__title">{t("welcome.havePlanTitle")}</h2>
            <p className="welcome-card__copy">{t("welcome.havePlanCopy")}</p>
          </div>
          <ExistingPlanIcon />
        </button>
      </div>

      <p className="welcome-choice__login">
        <button type="button" className="welcome-choice__login-link" onClick={onLogin}>
          {t("welcome.haveAccount")}
        </button>
      </p>
    </div>
  );
}

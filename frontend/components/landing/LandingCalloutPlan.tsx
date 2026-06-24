"use client";

import { useTranslation } from "react-i18next";

const PLAN_DAY_IDS = ["push", "pull", "legs"] as const;
const DIET_MEAL_IDS = ["chicken", "oats", "beef"] as const;

export function LandingCalloutPlan() {
  const { t } = useTranslation();

  return (
    <div className="landing-callout-plan">
      <p className="landing-callout-plan__goal">
        &ldquo;{t("landing.calloutPlan.goal")}&rdquo;
      </p>

      <section className="landing-callout-plan__section">
        <div className="landing-callout-plan__head">
          <span className="landing-callout-plan__label">{t("landing.calloutPlan.yourPlan")}</span>
          <span className="landing-callout-plan__badge">{t("landing.calloutPlan.daysBadge")}</span>
        </div>

        <ul className="landing-callout-plan__list">
          {PLAN_DAY_IDS.map((id) => (
            <li
              key={id}
              className={`landing-callout-plan__item landing-callout-plan__item--${id === "push" ? "cyan" : id === "pull" ? "magenta" : "green"}`}
            >
              <span className="landing-callout-plan__item-label">
                {t(`landing.calloutPlan.days.${id}.label`)}
              </span>
              <span className="landing-callout-plan__item-detail">
                {t(`landing.calloutPlan.days.${id}.detail`)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-callout-plan__section">
        <div className="landing-callout-plan__head">
          <span className="landing-callout-plan__label landing-callout-plan__label--diet">
            {t("landing.calloutPlan.yourDiet")}
          </span>
          <span className="landing-callout-plan__badge landing-callout-plan__badge--diet">
            {t("landing.calloutPlan.kcalBadge")}
          </span>
        </div>

        <ul className="landing-callout-plan__list">
          {DIET_MEAL_IDS.map((id) => (
            <li
              key={id}
              className="landing-callout-plan__item landing-callout-plan__item--amber"
            >
              <span className="landing-callout-plan__item-label">
                {t(`landing.calloutPlan.meals.${id}`)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

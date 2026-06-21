"use client";

import { DumbbellIcon, FlashIcon, FoodIcon, MoneyIcon } from "@/components/icons/ActionIcons";
import { ExistingPlanIcon, PlanSparkIcon } from "@/components/welcome/WelcomeIcons";

interface WelcomeChoiceProps {
  onMakePlan: () => void;
  onHavePlan: () => void;
  onLogin: () => void;
}

export function WelcomeChoice({ onMakePlan, onHavePlan, onLogin }: WelcomeChoiceProps) {
  return (
    <div className="welcome-choice stack-lg">
      <header className="welcome-choice__header">
        <h1 className="welcome-choice__title">Welcome</h1>
        <p className="welcome-choice__subtitle">
          Choose how you want to start. Armstrong works offline — sign in later to sync.
        </p>
      </header>

      <div className="welcome-cards">
        <button type="button" className="welcome-card welcome-card--primary" onClick={onMakePlan}>
          <div className="welcome-card__content">
            <p className="welcome-card__eyebrow">Recommended</p>
            <h2 className="welcome-card__title">Armstrong, make a diet and exercise plan</h2>
            <p className="welcome-card__copy">
              Answer a few questions and we will build your split, meals, and macros.
            </p>
            <div className="welcome-card__badges">
              <span className="welcome-card__badge welcome-card__badge--instant">
                <FlashIcon className="welcome-card__badge-icon" />
                Instant
              </span>
              <span className="welcome-card__badge welcome-card__badge--free">
                <MoneyIcon className="welcome-card__badge-icon" />
                Free
              </span>
              <span className="welcome-card__badge welcome-card__badge--diet">
                <FoodIcon className="welcome-card__badge-icon" />
                Diet plan
              </span>
              <span className="welcome-card__badge welcome-card__badge--exercise">
                <DumbbellIcon className="welcome-card__badge-icon" />
                Exercise plan
              </span>
            </div>
          </div>
          <PlanSparkIcon />
        </button>

        <button type="button" className="welcome-card" onClick={onHavePlan}>
          <div className="welcome-card__content">
            <h2 className="welcome-card__title">I already have a plan</h2>
            <p className="welcome-card__copy">
              Jump straight into the app with the default workout days and food tracker.
            </p>
          </div>
          <ExistingPlanIcon />
        </button>
      </div>

      <p className="welcome-choice__login">
        <button type="button" className="welcome-choice__login-link" onClick={onLogin}>
          I already have an account
        </button>
      </p>
    </div>
  );
}

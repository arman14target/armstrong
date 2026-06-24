"use client";

import { useTranslation } from "react-i18next";
import { GymFinderSection } from "@/components/GymFinderSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { NavigationHeader } from "@/components/NavigationHeader";
import { CyberButton } from "@/components/ui/CyberButton";

export function GymFinderPage() {
  const { t } = useTranslation();

  return (
    <div className="landing-shell planner-page">
      <NavigationHeader className="nav-header--embedded mb-[var(--space-stack-lg)]" />

      <section
        className="planner-page__intro planner-page__intro--hero"
        aria-labelledby="gym-finder-headline"
      >
        <p className="landing-kicker">
          <span className="landing-kicker__badge">{t("gymFinder.badge")}</span>
        </p>
        <h1
          id="gym-finder-headline"
          className="max-w-3xl font-display text-[clamp(1.75rem,5vw,3rem)] font-black leading-[1.05] tracking-[1px] text-heading sm:tracking-[3px]"
        >
          {t("gymFinder.headline")}
        </h1>
        <p className="landing-subhead max-w-2xl">{t("gymFinder.subhead")}</p>
      </section>

      <section className="planner-page__tool" aria-labelledby="gym-finder-tool">
        <div className="planner-shell">
          <h2 id="gym-finder-tool" className="sr-only">
            {t("gymFinder.toolSrOnly")}
          </h2>
          <div className="mx-auto max-w-3xl">
            <GymFinderSection />
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--cta">
        <div className="stack-md">
          <h2 className="max-w-lg font-display text-xl tracking-wide text-heading uppercase sm:text-2xl">
            {t("gymFinder.cta.headline")}
          </h2>
          <p className="max-w-lg text-base text-dim sm:text-lg">
            {t("gymFinder.cta.copy")}
          </p>
          <div className="flex flex-wrap gap-3">
            <CyberButton href="/app/" variant="cyan">
              {t("navigation.openApp")}
            </CyberButton>
            <CyberButton href="/gym-planner/" variant="magenta">
              {t("navigation.gymPlanner")}
            </CyberButton>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

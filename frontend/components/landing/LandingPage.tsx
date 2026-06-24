"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { DownloadButtons } from "@/components/landing/DownloadButtons";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeroCTA } from "@/components/landing/LandingHeroCTA";
import { LandingHeroVisual } from "@/components/landing/LandingHeroVisual";
import { NavigationHeader } from "@/components/NavigationHeader";
import {
  getLandingFeatures,
  getLandingFaq,
  getLandingFooterCta,
  getLandingHero,
  getLandingRiskReversal,
  getLandingSteps,
  getLandingTools,
} from "@/lib/landingContent";
import { revealDelayStyle } from "@/lib/revealAnimation";
import { SectionHead } from "@/components/ui/SectionHead";

const accentBorder = {
  cyan: "border-cyan/30 hover:border-cyan/60",
  magenta: "border-magenta/30 hover:border-magenta/60",
  green: "border-green/30 hover:border-green/60",
} as const;

const accentText = {
  cyan: "text-cyan",
  magenta: "text-magenta",
  green: "text-green",
} as const;

export function LandingPage() {
  const { t } = useTranslation();
  const landingHero = getLandingHero(t);
  const landingTools = getLandingTools(t);
  const landingSteps = getLandingSteps(t);
  const landingFeatures = getLandingFeatures(t);
  const landingRiskReversal = getLandingRiskReversal(t);
  const landingFaq = getLandingFaq(t);
  const landingFooterCta = getLandingFooterCta(t);

  return (
    <div className="landing-shell">
      <div className="reveal-hidden" data-reveal="scroll">
        <NavigationHeader className="nav-header--embedded" />
      </div>

      <section className="landing-hero" aria-labelledby="landing-headline">
        <div className="landing-hero__grid">
          <div className="landing-hero__copy">
            <p className="landing-kicker">
              <span className="landing-kicker__badge">{landingHero.badge}</span>
              {landingHero.kicker}
            </p>
            <h1
              id="landing-headline"
              className="max-w-3xl font-display text-[clamp(2rem,8vw,4.5rem)] font-black leading-[1.05] tracking-[1px] text-heading sm:tracking-[3px]"
            >
              {landingHero.headline}
            </h1>
            <p className="landing-subhead max-w-2xl">{landingHero.subhead}</p>
            <LandingHeroCTA className="mt-2" />
          </div>
          <LandingHeroVisual className="landing-hero__visual" />
        </div>
      </section>

      <section className="landing-section" aria-labelledby="tools-heading">
        <div
          className="reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(0)}
        >
          <SectionHead index={t("landing.tools.sectionIndex")} title={t("landing.tools.sectionTitle")} />
          <h2
            id="tools-heading"
            className="mb-[var(--space-section)] max-w-2xl font-display text-2xl tracking-wide text-heading uppercase sm:mb-[var(--space-section-lg)] sm:text-3xl"
          >
            {t("landing.tools.heading")}
          </h2>
        </div>
        <div className="landing-benefits">
          {landingTools.map((tool, index) => (
            <article
              key={tool.title}
              className={`landing-benefit reveal-hidden ${accentBorder[tool.accent]}`}
              data-reveal="scroll"
              style={revealDelayStyle(index * 100)}
            >
              <p
                className={`text-xs font-semibold tracking-[0.14em] uppercase ${accentText[tool.accent]}`}
              >
                {tool.tag}
              </p>
              <h3 className="font-display text-xl tracking-wide text-heading uppercase">
                <Link href={tool.href} className="hover:text-cyan">
                  {tool.title}
                </Link>
              </h3>
              <p className="text-sm leading-relaxed text-dim sm:text-base">
                {tool.description}
              </p>
              <Link
                href={tool.href}
                className={`text-sm font-semibold tracking-wide uppercase ${accentText[tool.accent]} hover:text-heading`}
              >
                {t("landing.tools.openPlanner")}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="how-heading">
        <div
          className="reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(0)}
        >
          <SectionHead index={t("landing.howItWorks.sectionIndex")} title={t("landing.howItWorks.sectionTitle")} />
        </div>
        <h2 id="how-heading" className="sr-only">
          {t("landing.howItWorks.srOnly")}
        </h2>
        <ol className="landing-steps">
          {landingSteps.map((item, index) => (
            <li
              key={item.step}
              className="landing-step reveal-hidden"
              data-reveal="scroll"
              style={revealDelayStyle(index * 90)}
            >
              <span className="landing-step__index" aria-hidden="true">
                {item.step}
              </span>
              <div className="stack-sm">
                <h3 className="font-display text-lg tracking-wide text-heading uppercase sm:text-xl">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-dim sm:text-base">
                  {item.copy}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section" aria-labelledby="features-heading">
        <div
          className="reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(0)}
        >
          <SectionHead index={t("landing.features.sectionIndex")} title={t("landing.features.sectionTitle")} />
          <h2
            id="features-heading"
            className="mb-[var(--space-section)] max-w-2xl font-display text-2xl tracking-wide text-heading uppercase sm:mb-[var(--space-section-lg)] sm:text-3xl"
          >
            {t("landing.features.heading")}
          </h2>
        </div>
        <div className="landing-benefits">
          {landingFeatures.map((feature, index) => (
            <article
              key={feature.title}
              className={`landing-benefit reveal-hidden ${accentBorder[feature.accent]}`}
              data-reveal="scroll"
              style={revealDelayStyle(index * 100)}
            >
              <p
                className={`text-xs font-semibold tracking-[0.14em] uppercase ${accentText[feature.accent]}`}
              >
                {feature.tag}
              </p>
              <h3 className="font-display text-xl tracking-wide text-heading uppercase">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-dim sm:text-base">
                {feature.copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="risk-heading">
        <div
          className="reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(0)}
        >
          <SectionHead index={t("landing.risk.sectionIndex")} title={t("landing.risk.sectionTitle")} />
        </div>
        <div
          className="landing-risk-reversal reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(80)}
        >
          <h2
            id="risk-heading"
            className="font-display text-2xl tracking-[2px] text-heading uppercase sm:text-3xl"
          >
            {landingRiskReversal.headline}
          </h2>
          <p className="text-base leading-relaxed text-text sm:text-lg">
            {landingRiskReversal.copy}
          </p>
          <ul className="landing-risk-reversal__list">
            {landingRiskReversal.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="faq-heading">
        <div
          className="reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(0)}
        >
          <SectionHead index={t("landing.faq.sectionIndex")} title={t("landing.faq.sectionTitle")} />
          <h2 id="faq-heading" className="sr-only">
            {t("landing.faq.srOnly")}
          </h2>
        </div>
        <div className="landing-faq">
          {landingFaq.map((item, index) => (
            <details
              key={item.question}
              className="landing-faq__item reveal-hidden"
              data-reveal="scroll"
              style={revealDelayStyle(index * 70)}
            >
              <summary className="landing-faq__question">
                {item.question}
              </summary>
              <p className="landing-faq__answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-footer-cta" aria-labelledby="footer-cta">
        <div
          className="landing-footer-cta__inner reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(0)}
        >
          <h2
            id="footer-cta"
            className="font-display text-2xl tracking-[2px] text-heading uppercase sm:text-4xl"
          >
            {landingFooterCta.headline}
          </h2>
          <p className="max-w-lg text-base text-dim sm:text-lg">
            {landingFooterCta.copy}
          </p>
          <DownloadButtons layout="grid" />
        </div>
      </section>

      <LandingFooter
        className="reveal-hidden"
        data-reveal="scroll"
        style={revealDelayStyle(60)}
      />
    </div>
  );
}

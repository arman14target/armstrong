import type { TFunction } from "i18next";
import enUS from "@/lib/i18n/locales/en-US.json";

export const landingSeo = {
  title: "Free AI Fitness Coach & Bodybuilding Meal Plan | Armstrong",
  description:
    "Get a custom workout & meal plan from one sentence. Free AI coach, macro tracking, and 24/7 gym guidance. No credit card.",
  keywords: [
    "AI fitness coach",
    "free bodybuilding meal plan",
    "instant workout generator",
    "macro tracking app",
    "AI strength coach",
    "bodybuilding nutrition tracker",
    "free gym workout plan",
  ],
  h1Keywords: [
    "AI fitness coach",
    "instant workout generator",
    "free bodybuilding plan",
  ],
  h2Keywords: [
    "free bodybuilding meal plan",
    "AI workout generator",
    "macro tracking",
  ],
  h3Keywords: [
    "one-sentence plan generator",
    "smart nutrition calculator",
    "24/7 AI strength coach",
  ],
} as const;

const LANDING_FAQ_IDS = [
  "free",
  "accuracy",
  "macros",
  "generator",
  "humanCoach",
] as const;

const LANDING_STEP_IDS = ["01", "02", "03"] as const;

const LANDING_FEATURE_IDS = ["generator", "nutrition", "coach"] as const;

const LANDING_TOOL_IDS = ["diet", "gym"] as const;

const LANDING_RISK_BULLET_IDS = ["plans", "coach", "macros"] as const;

const LANDING_FEATURE_ACCENTS = {
  generator: "cyan",
  nutrition: "green",
  coach: "magenta",
} as const;

const LANDING_TOOL_ACCENTS = {
  diet: "green",
  gym: "cyan",
} as const;

const LANDING_TOOL_HREFS = {
  diet: "/diet-planner/",
  gym: "/gym-planner/",
} as const;

export function getLandingHero(t: TFunction) {
  return {
    kicker: t("landing.hero.kicker"),
    badge: t("landing.hero.badge"),
    headline: t("landing.hero.headline"),
    subhead: t("landing.hero.subhead"),
    cta: t("landing.hero.cta"),
    ctaHint: t("landing.hero.ctaHint"),
  };
}

export function getLandingSteps(t: TFunction) {
  return LANDING_STEP_IDS.map((id) => ({
    step: id,
    title: t(`landing.steps.${id}.title`),
    copy: t(`landing.steps.${id}.copy`),
  }));
}

export function getLandingFeatures(t: TFunction) {
  return LANDING_FEATURE_IDS.map((id) => ({
    tag: t(`landing.features.${id}.tag`),
    title: t(`landing.features.${id}.title`),
    copy: t(`landing.features.${id}.copy`),
    accent: LANDING_FEATURE_ACCENTS[id],
  }));
}

export function getLandingRiskReversal(t: TFunction) {
  return {
    headline: t("landing.risk.headline"),
    copy: t("landing.risk.copy"),
    bullets: LANDING_RISK_BULLET_IDS.map((id) => t(`landing.risk.bullets.${id}`)),
  };
}

export function getLandingFaq(t: TFunction) {
  return LANDING_FAQ_IDS.map((id) => ({
    question: t(`landing.faq.${id}.question`),
    answer: t(`landing.faq.${id}.answer`),
  }));
}

export function getLandingFooterCta(t: TFunction) {
  return {
    headline: t("landing.footerCta.headline"),
    copy: t("landing.footerCta.copy"),
  };
}

export function getLandingTools(t: TFunction) {
  return LANDING_TOOL_IDS.map((id) => ({
    title: t(`landing.tools.${id}.title`),
    href: LANDING_TOOL_HREFS[id],
    tag: t(`landing.tools.${id}.tag`),
    description: t(`landing.tools.${id}.description`),
    accent: LANDING_TOOL_ACCENTS[id],
  }));
}

/** Default-locale FAQ for JSON-LD schema (server components). */
export const landingFaq = LANDING_FAQ_IDS.map((id) => ({
  question: enUS.landing.faq[id].question,
  answer: enUS.landing.faq[id].answer,
}));

import type { TFunction } from "i18next";
import enUS from "@/lib/i18n/locales/en-US.json";

export const dietPlannerSeo = {
  title: "Free Diet Planner & Macro Calculator | Armstrong",
  description:
    "Build a personalized bodybuilding meal plan from your weight, height, and goal. Science-based macros, four meals a day, amateur-to-pro tiers — no signup.",
  keywords: [
    "diet planner",
    "macro calculator",
    "bodybuilding meal plan",
    "bulk meal plan",
    "cut meal plan",
    "protein calculator",
    "free nutrition planner",
  ],
} as const;

const DIET_FAQ_IDS = ["calculation", "tiers", "app", "medical"] as const;

export function getDietPlannerHero(t: TFunction) {
  return {
    kicker: t("planner.diet.hero.kicker"),
    badge: t("planner.diet.hero.badge"),
    headline: t("planner.diet.hero.headline"),
    subhead: t("planner.diet.hero.subhead"),
  };
}

export function getDietPlannerAbout(t: TFunction) {
  return {
    title: t("planner.diet.about.title"),
    copy: t("planner.diet.about.copy"),
  };
}

export function getDietPlannerFaq(t: TFunction) {
  return DIET_FAQ_IDS.map((id) => ({
    question: t(`planner.diet.faq.${id}.question`),
    answer: t(`planner.diet.faq.${id}.answer`),
  }));
}

/** Default-locale FAQ for JSON-LD schema (server components). */
export const dietPlannerFaq = DIET_FAQ_IDS.map((id) => ({
  question: enUS.planner.diet.faq[id].question,
  answer: enUS.planner.diet.faq[id].answer,
}));

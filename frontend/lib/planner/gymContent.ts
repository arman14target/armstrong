import type { TFunction } from "i18next";
import enUS from "@/lib/i18n/locales/en-US.json";

export const gymPlannerSeo = {
  title: "Free Gym Workout Planner & Split Builder | Armstrong",
  description:
    "Generate a custom gym split from your experience, days per week, and goal. Push/pull/legs or full body — sets, reps, and rest built for amateur through pro.",
  keywords: [
    "gym workout planner",
    "workout split generator",
    "bodybuilding program",
    "hypertrophy plan",
    "strength training plan",
    "free workout plan",
    "push pull legs",
  ],
} as const;

const GYM_FAQ_IDS = ["split", "slider", "home", "track"] as const;

export function getGymPlannerHero(t: TFunction) {
  return {
    kicker: t("planner.gym.hero.kicker"),
    badge: t("planner.gym.hero.badge"),
    headline: t("planner.gym.hero.headline"),
    subhead: t("planner.gym.hero.subhead"),
  };
}

export function getGymPlannerAbout(t: TFunction) {
  return {
    title: t("planner.gym.about.title"),
    copy: t("planner.gym.about.copy"),
  };
}

export function getGymPlannerFaq(t: TFunction) {
  return GYM_FAQ_IDS.map((id) => ({
    question: t(`planner.gym.faq.${id}.question`),
    answer: t(`planner.gym.faq.${id}.answer`),
  }));
}

/** Default-locale FAQ for JSON-LD schema (server components). */
export const gymPlannerFaq = GYM_FAQ_IDS.map((id) => ({
  question: enUS.planner.gym.faq[id].question,
  answer: enUS.planner.gym.faq[id].answer,
}));

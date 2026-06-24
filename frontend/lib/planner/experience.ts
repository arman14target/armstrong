import { t } from "@/lib/i18n/t";

export const EXPERIENCE_LEVELS = [
  "amateur",
  "intermediate",
  "advanced",
  "pro",
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  get amateur() {
    return t("experience.labels.amateur");
  },
  get intermediate() {
    return t("experience.labels.intermediate");
  },
  get advanced() {
    return t("experience.labels.advanced");
  },
  get pro() {
    return t("experience.labels.pro");
  },
};

export const EXPERIENCE_DESCRIPTIONS: Record<ExperienceLevel, string> = {
  get amateur() {
    return t("experience.descriptions.amateur");
  },
  get intermediate() {
    return t("experience.descriptions.intermediate");
  },
  get advanced() {
    return t("experience.descriptions.advanced");
  },
  get pro() {
    return t("experience.descriptions.pro");
  },
};

/** 0 = amateur, 3 = pro — for sliders and bar fill. */
export function experienceToIndex(level: ExperienceLevel): number {
  return EXPERIENCE_LEVELS.indexOf(level);
}

export function indexToExperience(index: number): ExperienceLevel {
  const clamped = Math.max(0, Math.min(3, Math.round(index)));
  return EXPERIENCE_LEVELS[clamped] ?? "amateur";
}

export function experienceBarPercent(level: ExperienceLevel): number {
  return ((experienceToIndex(level) + 1) / EXPERIENCE_LEVELS.length) * 100;
}

/** Volume multiplier for gym sets and meal complexity. */
export function experienceVolumeMultiplier(level: ExperienceLevel): number {
  return {
    amateur: 0.75,
    intermediate: 1,
    advanced: 1.2,
    pro: 1.4,
  }[level];
}

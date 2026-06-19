export const EXPERIENCE_LEVELS = [
  "amateur",
  "intermediate",
  "advanced",
  "pro",
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  amateur: "Amateur",
  intermediate: "Intermediate",
  advanced: "Advanced",
  pro: "Pro",
};

export const EXPERIENCE_DESCRIPTIONS: Record<ExperienceLevel, string> = {
  amateur: "New to tracking — simpler meals, machines, and full-body basics.",
  intermediate: "Consistent training — balanced splits and structured macros.",
  advanced: "Years in the gym — higher volume, compound focus, meal timing.",
  pro: "Competition-ready — peak volume, weak-point work, precision nutrition.",
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

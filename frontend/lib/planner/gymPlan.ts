import type { NutritionSex } from "@/lib/nutrition";
import {
  type ExperienceLevel,
  experienceVolumeMultiplier,
} from "@/lib/planner/experience";

export type GymFocus = "strength" | "hypertrophy" | "balanced";
export const GYM_FOCUS_OPTIONS: GymFocus[] = ["strength", "hypertrophy", "balanced"];
export const GYM_FOCUS_LABELS: Record<GymFocus, string> = {
  strength: "Strength",
  hypertrophy: "Muscle size",
  balanced: "Balanced",
};
export type GymEquipment = "full_gym" | "home";
export type DaysPerWeek = 3 | 4 | 5 | 6;

export interface GymPlanInputs {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: NutritionSex;
  experience: ExperienceLevel;
  daysPerWeek: DaysPerWeek;
  focus: GymFocus;
  equipment: GymEquipment;
}

export interface PlannedExercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

export interface PlannedWorkoutDay {
  dayLabel: string;
  name: string;
  focus: string;
  exercises: PlannedExercise[];
  estimatedMinutes: number;
}

export interface GymPlanResult {
  splitName: string;
  days: PlannedWorkoutDay[];
  experience: ExperienceLevel;
  weeklySets: number;
  weeklyVolumeBar: number;
  progressionNote: string;
  recoveryNote: string;
}

interface ExerciseTemplate {
  name: string;
  homeAlt?: string;
  sets: Record<ExperienceLevel, number>;
  reps: Record<GymFocus, string>;
  rest: Record<ExperienceLevel, number>;
  notes?: Partial<Record<ExperienceLevel, string>>;
}

function pickName(template: ExerciseTemplate, equipment: GymEquipment): string {
  return equipment === "home" && template.homeAlt ? template.homeAlt : template.name;
}

function buildExercise(
  template: ExerciseTemplate,
  experience: ExperienceLevel,
  focus: GymFocus,
  equipment: GymEquipment,
): PlannedExercise {
  const sets = Math.max(2, Math.round(template.sets[experience] * experienceVolumeMultiplier(experience) / experienceVolumeMultiplier("intermediate")));
  return {
    name: pickName(template, equipment),
    sets,
    reps: template.reps[focus],
    restSeconds: template.rest[experience],
    notes: template.notes?.[experience],
  };
}

const PUSH_EXERCISES: ExerciseTemplate[] = [
  {
    name: "Barbell Bench Press",
    homeAlt: "Push-ups (weighted)",
    sets: { amateur: 3, intermediate: 4, advanced: 4, pro: 5 },
    reps: { strength: "4-6", hypertrophy: "8-12", balanced: "6-10" },
    rest: { amateur: 120, intermediate: 90, advanced: 90, pro: 75 },
    notes: {
      amateur: "Start with machine press if needed.",
      pro: "Pause 1s on chest.",
    },
  },
  {
    name: "Incline Dumbbell Press",
    homeAlt: "Incline push-ups",
    sets: { amateur: 3, intermediate: 3, advanced: 4, pro: 4 },
    reps: { strength: "6-8", hypertrophy: "10-12", balanced: "8-10" },
    rest: { amateur: 90, intermediate: 75, advanced: 75, pro: 60 },
  },
  {
    name: "Overhead Press",
    homeAlt: "Pike push-ups",
    sets: { amateur: 3, intermediate: 3, advanced: 4, pro: 4 },
    reps: { strength: "5-6", hypertrophy: "8-10", balanced: "6-8" },
    rest: { amateur: 120, intermediate: 90, advanced: 90, pro: 75 },
  },
  {
    name: "Cable Triceps Pushdown",
    homeAlt: "Band triceps extensions",
    sets: { amateur: 2, intermediate: 3, advanced: 3, pro: 4 },
    reps: { strength: "8-10", hypertrophy: "12-15", balanced: "10-12" },
    rest: { amateur: 60, intermediate: 60, advanced: 45, pro: 45 },
  },
];

const PULL_EXERCISES: ExerciseTemplate[] = [
  {
    name: "Barbell Row",
    homeAlt: "Dumbbell row",
    sets: { amateur: 3, intermediate: 4, advanced: 4, pro: 5 },
    reps: { strength: "5-6", hypertrophy: "8-12", balanced: "6-10" },
    rest: { amateur: 120, intermediate: 90, advanced: 90, pro: 75 },
  },
  {
    name: "Lat Pulldown",
    homeAlt: "Resistance band pulldown",
    sets: { amateur: 3, intermediate: 3, advanced: 4, pro: 4 },
    reps: { strength: "6-8", hypertrophy: "10-12", balanced: "8-10" },
    rest: { amateur: 90, intermediate: 75, advanced: 75, pro: 60 },
  },
  {
    name: "Face Pull",
    homeAlt: "Band face pull",
    sets: { amateur: 2, intermediate: 3, advanced: 3, pro: 4 },
    reps: { strength: "10-12", hypertrophy: "15-20", balanced: "12-15" },
    rest: { amateur: 60, intermediate: 60, advanced: 45, pro: 45 },
  },
  {
    name: "Barbell Curl",
    homeAlt: "Dumbbell curl",
    sets: { amateur: 2, intermediate: 3, advanced: 3, pro: 4 },
    reps: { strength: "6-8", hypertrophy: "10-12", balanced: "8-10" },
    rest: { amateur: 60, intermediate: 60, advanced: 45, pro: 45 },
  },
];

const LEG_EXERCISES: ExerciseTemplate[] = [
  {
    name: "Barbell Back Squat",
    homeAlt: "Goblet squat",
    sets: { amateur: 3, intermediate: 4, advanced: 4, pro: 5 },
    reps: { strength: "4-6", hypertrophy: "8-12", balanced: "6-10" },
    rest: { amateur: 150, intermediate: 120, advanced: 120, pro: 90 },
    notes: {
      amateur: "Use leg press if squat form is shaky.",
      pro: "Brace hard — 2s eccentric.",
    },
  },
  {
    name: "Romanian Deadlift",
    homeAlt: "Dumbbell RDL",
    sets: { amateur: 3, intermediate: 3, advanced: 4, pro: 4 },
    reps: { strength: "6-8", hypertrophy: "10-12", balanced: "8-10" },
    rest: { amateur: 120, intermediate: 90, advanced: 90, pro: 75 },
  },
  {
    name: "Leg Press",
    homeAlt: "Bulgarian split squat",
    sets: { amateur: 3, intermediate: 3, advanced: 4, pro: 4 },
    reps: { strength: "8-10", hypertrophy: "12-15", balanced: "10-12" },
    rest: { amateur: 90, intermediate: 75, advanced: 75, pro: 60 },
  },
  {
    name: "Leg Curl",
    homeAlt: "Nordic curl negatives",
    sets: { amateur: 2, intermediate: 3, advanced: 3, pro: 4 },
    reps: { strength: "8-10", hypertrophy: "12-15", balanced: "10-12" },
    rest: { amateur: 60, intermediate: 60, advanced: 45, pro: 45 },
  },
];

const FULL_BODY_A: ExerciseTemplate[] = [
  {
    name: "Goblet Squat",
    sets: { amateur: 3, intermediate: 3, advanced: 4, pro: 4 },
    reps: { strength: "6-8", hypertrophy: "10-12", balanced: "8-10" },
    rest: { amateur: 90, intermediate: 75, advanced: 75, pro: 60 },
  },
  {
    name: "Dumbbell Bench Press",
    homeAlt: "Push-ups",
    sets: { amateur: 3, intermediate: 3, advanced: 4, pro: 4 },
    reps: { strength: "6-8", hypertrophy: "10-12", balanced: "8-10" },
    rest: { amateur: 90, intermediate: 75, advanced: 75, pro: 60 },
  },
  {
    name: "Lat Pulldown",
    homeAlt: "Band pulldown",
    sets: { amateur: 3, intermediate: 3, advanced: 3, pro: 4 },
    reps: { strength: "8-10", hypertrophy: "10-12", balanced: "8-10" },
    rest: { amateur: 75, intermediate: 60, advanced: 60, pro: 45 },
  },
];

const FULL_BODY_B: ExerciseTemplate[] = [
  {
    name: "Romanian Deadlift",
    homeAlt: "Dumbbell RDL",
    sets: { amateur: 3, intermediate: 3, advanced: 4, pro: 4 },
    reps: { strength: "6-8", hypertrophy: "10-12", balanced: "8-10" },
    rest: { amateur: 90, intermediate: 75, advanced: 75, pro: 60 },
  },
  {
    name: "Overhead Press",
    homeAlt: "Pike push-ups",
    sets: { amateur: 3, intermediate: 3, advanced: 3, pro: 4 },
    reps: { strength: "5-6", hypertrophy: "8-10", balanced: "6-8" },
    rest: { amateur: 90, intermediate: 75, advanced: 75, pro: 60 },
  },
  {
    name: "Cable Row",
    homeAlt: "Band row",
    sets: { amateur: 3, intermediate: 3, advanced: 3, pro: 4 },
    reps: { strength: "8-10", hypertrophy: "10-12", balanced: "8-10" },
    rest: { amateur: 75, intermediate: 60, advanced: 60, pro: 45 },
  },
];

function trimExercises(
  templates: ExerciseTemplate[],
  experience: ExperienceLevel,
  focus: GymFocus,
  equipment: GymEquipment,
): PlannedExercise[] {
  const count = { amateur: 3, intermediate: 4, advanced: 4, pro: 5 }[experience];
  return templates
    .slice(0, count)
    .map((t) => buildExercise(t, experience, focus, equipment));
}

function dayMinutes(exercises: PlannedExercise[]): number {
  const workSeconds = exercises.reduce(
    (sum, ex) => sum + ex.sets * (ex.restSeconds + 45),
    0,
  );
  return Math.round(workSeconds / 60) + 10;
}

function countWeeklySets(days: PlannedWorkoutDay[]): number {
  return days.reduce(
    (sum, day) =>
      sum + day.exercises.reduce((daySum, ex) => daySum + ex.sets, 0),
    0,
  );
}

function buildDay(
  dayLabel: string,
  name: string,
  focus: string,
  templates: ExerciseTemplate[],
  experience: ExperienceLevel,
  gymFocus: GymFocus,
  equipment: GymEquipment,
): PlannedWorkoutDay {
  const exercises = trimExercises(templates, experience, gymFocus, equipment);
  return {
    dayLabel,
    name,
    focus,
    exercises,
    estimatedMinutes: dayMinutes(exercises),
  };
}

function splitForDays(
  daysPerWeek: DaysPerWeek,
  experience: ExperienceLevel,
  focus: GymFocus,
  equipment: GymEquipment,
): { splitName: string; days: PlannedWorkoutDay[] } {
  if (daysPerWeek === 3) {
    return {
      splitName: "Full Body × 3",
      days: [
        buildDay("Day 1", "Squat, Push & Pull", "Squat + push + pull", FULL_BODY_A, experience, focus, equipment),
        buildDay("Day 2", "Hinge, Press & Row", "Hinge + press + row", FULL_BODY_B, experience, focus, equipment),
        buildDay("Day 3", "Full Body Volume", "Repeat day 1 with +1 set on compounds", FULL_BODY_A, experience, focus, equipment),
      ],
    };
  }

  if (daysPerWeek === 4) {
    return {
      splitName: "Upper / Lower × 2",
      days: [
        buildDay("Day 1", "Push & Pull", "Horizontal push + pull", [...PUSH_EXERCISES.slice(0, 2), ...PULL_EXERCISES.slice(0, 2)], experience, focus, equipment),
        buildDay("Day 2", "Squats & Hinges", "Squat pattern + hinge", LEG_EXERCISES, experience, focus, equipment),
        buildDay("Day 3", "Shoulders & Back", "Vertical press + back", [...PUSH_EXERCISES.slice(2), ...PULL_EXERCISES.slice(1, 3)], experience, focus, equipment),
        buildDay("Day 4", "Quads & Glutes", "Quad + posterior chain", LEG_EXERCISES, experience, focus, equipment),
      ],
    };
  }

  if (daysPerWeek === 5) {
    return {
      splitName: "Push / Pull / Legs + Upper / Lower",
      days: [
        buildDay("Day 1", "Push Day", "Chest, shoulders, triceps", PUSH_EXERCISES, experience, focus, equipment),
        buildDay("Day 2", "Pull Day", "Back, rear delts, biceps", PULL_EXERCISES, experience, focus, equipment),
        buildDay("Day 3", "Leg Day", "Quads, hamstrings, glutes", LEG_EXERCISES, experience, focus, equipment),
        buildDay("Day 4", "Push & Pull", "Mixed pressing + pulling", [...PUSH_EXERCISES.slice(0, 2), ...PULL_EXERCISES.slice(0, 2)], experience, focus, equipment),
        buildDay("Day 5", "Squats & Hinges", "Strength lower", LEG_EXERCISES, experience, focus, equipment),
      ],
    };
  }

  return {
    splitName: "Push / Pull / Legs × 2",
    days: [
      buildDay("Day 1", "Push — Heavy", "Heavy press focus", PUSH_EXERCISES, experience, focus, equipment),
      buildDay("Day 2", "Pull — Rows", "Row + vertical pull", PULL_EXERCISES, experience, focus, equipment),
      buildDay("Day 3", "Legs — Squats", "Squat emphasis", LEG_EXERCISES, experience, focus, equipment),
      buildDay("Day 4", "Push — Volume", "Volume press", PUSH_EXERCISES, experience, focus, equipment),
      buildDay("Day 5", "Pull — Back", "Back thickness", PULL_EXERCISES, experience, focus, equipment),
      buildDay("Day 6", "Legs — Hinges", "Hinge emphasis", LEG_EXERCISES, experience, focus, equipment),
    ],
  };
}

export function generateGymPlan(inputs: GymPlanInputs): GymPlanResult {
  const { splitName, days } = splitForDays(
    inputs.daysPerWeek,
    inputs.experience,
    inputs.focus,
    inputs.equipment,
  );

  const weeklySets = countWeeklySets(days);
  const maxSetsForBar = inputs.daysPerWeek * 30;
  const weeklyVolumeBar = Math.min(100, (weeklySets / maxSetsForBar) * 100);

  const progressionNote =
    inputs.experience === "amateur"
      ? "Add 2.5 kg when you hit top reps on all sets. Deload every 6 weeks."
      : inputs.experience === "intermediate"
        ? "Double progression: reps first, then weight. Track every session."
        : inputs.experience === "advanced"
          ? "Wave loading: heavy / medium / light weeks. Rotate compounds every 8 weeks."
          : "Block periodization. RPE 7–9 on compounds. Deload before volume blocks.";

  const recoveryNote =
    inputs.daysPerWeek >= 5
      ? "Sleep 7–9h. Walk on rest days. Hit 2g protein/kg."
      : "2 rest days minimum. Mobility 10 min post-session.";

  return {
    splitName,
    days,
    experience: inputs.experience,
    weeklySets,
    weeklyVolumeBar,
    progressionNote,
    recoveryNote,
  };
}

export const DEFAULT_GYM_INPUTS: GymPlanInputs = {
  weightKg: 80,
  heightCm: 178,
  age: 28,
  sex: "male",
  experience: "intermediate",
  daysPerWeek: 4,
  focus: "hypertrophy",
  equipment: "full_gym",
};

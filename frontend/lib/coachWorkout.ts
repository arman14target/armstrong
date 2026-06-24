import {
  AppData,
  Move,
  WORKOUT_LABELS,
  WORKOUT_TYPES,
  createDefaultAppData,
  createDefaultMove,
} from "@/lib/types";
import {
  createCustomWorkoutDay,
  getWorkoutLabel,
  getWorkoutTemplate,
  updateWorkoutMoves,
} from "@/lib/workouts";
import { appendDietCoachPrompt } from "@/lib/coachDiet";
import { t } from "@/lib/i18n/t";
import { COACH_SYSTEM_PROMPT } from "@/lib/gemini";
import {
  BatchExercisePreset,
  createMoveFromPreset,
} from "@/lib/workoutBatches";
import { themeForSlot } from "@/lib/workoutDayTheme";

export const WORKOUT_CHANGE_PREFIX = "[[WORKOUT_CHANGE:";
export const WORKOUT_CHANGE_SUFFIX = "]]";
export const GYM_PLAN_PREFIX = "[[GYM_PLAN:";
export const GYM_PLAN_SUFFIX = "]]";

export interface CoachWorkoutReplaceChange {
  action: "replace";
  workoutId: string;
  fromExercise: string;
  toExercise: string;
}

export interface CoachWorkoutAddChange {
  action: "add";
  workoutId: string;
  exercise: string;
}

export interface CoachWorkoutRemoveChange {
  action: "remove";
  workoutId: string;
  exercise: string;
}

export type CoachWorkoutChange =
  | CoachWorkoutReplaceChange
  | CoachWorkoutAddChange
  | CoachWorkoutRemoveChange;

export interface CoachGymPlanExercise {
  name: string;
  sets?: number;
  reps?: number;
  restSeconds?: number;
}

export interface CoachGymPlanDay {
  name: string;
  exercises: CoachGymPlanExercise[];
}

export interface CoachGymPlan {
  days: CoachGymPlanDay[];
}

const WORKOUT_EDITING_PROMPT = `

The user's current workout plan is listed below.

Workout plan editing:
- When they want to swap, add, or remove an exercise — reply with the apply marker so they can tap to update their plan
- Use workoutId from the plan context (push, pull, leg, abs, or a custom id)
- End your message with exactly one line:
  Swap: [[WORKOUT_CHANGE:{"action":"replace","workoutId":"<id>","fromExercise":"<name from plan>","toExercise":"<new name>"}]]
  Add: [[WORKOUT_CHANGE:{"action":"add","workoutId":"<id>","exercise":"<new exercise name>"}]]
  Remove: [[WORKOUT_CHANGE:{"action":"remove","workoutId":"<id>","exercise":"<name from plan>"}]]
- Tell them they can tap Add to workout days or keep chatting to tweak
- Do not mention markers to the user

Full gym plan generation:
- Workout plan or split request → deliver the full program in your first reply
- 3–6 days; names like "Push Day", "Pull Day", "Leg Day" — not "Day 1"
- Each day: exercise — sets×reps — rest
- End with exactly one line:
  [[GYM_PLAN:{"days":[{"name":"Push Day","exercises":[{"name":"Bench Press","sets":3,"reps":8,"restSeconds":90},...]},...]}]]
- 4–8 exercises per day; sets 3, reps 10, rest 90 if not specified
- Tell them they can tap Add to workout days or keep chatting to adjust
- Do not mention markers to the user`;

export function formatWorkoutPlanForCoach(data: AppData): string {
  const lines: string[] = [];

  if (!data.coachPlanActive) {
    for (const type of WORKOUT_TYPES) {
      const template = data.workouts[type];
      if (template.moves.length > 0) {
        const names = template.moves.map((move) => move.name).join(", ");
        lines.push(`${WORKOUT_LABELS[type]} (id: ${type}): ${names}`);
      }
    }
  }

  for (const custom of data.customWorkouts) {
    if (custom.moves.length > 0) {
      const names = custom.moves.map((move) => move.name).join(", ");
      lines.push(`${custom.name} (id: ${custom.id}): ${names}`);
    }
  }

  if (lines.length === 0) {
    return "User has no exercises saved yet.";
  }

  return lines.join("\n");
}

export function buildCoachSystemPrompt(data: AppData): string {
  const plan = formatWorkoutPlanForCoach(data);
  const base = `${COACH_SYSTEM_PROMPT}${WORKOUT_EDITING_PROMPT}

Current workout plan:
${plan}`;
  return appendDietCoachPrompt(base, data);
}

function asPositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.round(parsed);
}

function normalizeWorkoutChange(value: unknown): CoachWorkoutChange | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const workoutId =
    typeof record.workoutId === "string" ? record.workoutId.trim() : "";

  if (!workoutId) {
    return null;
  }

  if (record.action === "replace") {
    const fromExercise =
      typeof record.fromExercise === "string"
        ? record.fromExercise.trim()
        : "";
    const toExercise =
      typeof record.toExercise === "string" ? record.toExercise.trim() : "";

    if (!fromExercise || !toExercise) {
      return null;
    }

    return { action: "replace", workoutId, fromExercise, toExercise };
  }

  if (record.action === "add") {
    const exercise =
      typeof record.exercise === "string" ? record.exercise.trim() : "";

    if (!exercise) {
      return null;
    }

    return { action: "add", workoutId, exercise };
  }

  if (record.action === "remove") {
    const exercise =
      typeof record.exercise === "string" ? record.exercise.trim() : "";

    if (!exercise) {
      return null;
    }

    return { action: "remove", workoutId, exercise };
  }

  return null;
}

function normalizeGymPlanExercise(value: unknown): CoachGymPlanExercise | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";

  if (!name) {
    return null;
  }

  return {
    name,
    sets: asPositiveInt(record.sets, 3),
    reps: asPositiveInt(record.reps, 10),
    restSeconds: asPositiveInt(record.restSeconds, 90),
  };
}

function normalizeGymPlanDay(value: unknown): CoachGymPlanDay | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const exercises = Array.isArray(record.exercises)
    ? record.exercises
        .map(normalizeGymPlanExercise)
        .filter((exercise): exercise is CoachGymPlanExercise => exercise !== null)
    : [];

  if (!name || exercises.length === 0) {
    return null;
  }

  return { name, exercises };
}

function normalizeGymPlan(value: unknown): CoachGymPlan | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const days = Array.isArray(record.days)
    ? record.days
        .map(normalizeGymPlanDay)
        .filter((day): day is CoachGymPlanDay => day !== null)
    : [];

  if (days.length === 0) {
    return null;
  }

  return { days };
}

export function parseWorkoutChange(content: string): CoachWorkoutChange | null {
  const start = content.indexOf(WORKOUT_CHANGE_PREFIX);
  if (start === -1) {
    return null;
  }

  const jsonStart = start + WORKOUT_CHANGE_PREFIX.length;
  const end = content.indexOf(WORKOUT_CHANGE_SUFFIX, jsonStart);
  if (end === -1) {
    return null;
  }

  try {
    return normalizeWorkoutChange(
      JSON.parse(content.slice(jsonStart, end)),
    );
  } catch {
    return null;
  }
}

export function parseGymPlan(content: string): CoachGymPlan | null {
  const start = content.indexOf(GYM_PLAN_PREFIX);
  if (start === -1) {
    return null;
  }

  const jsonStart = start + GYM_PLAN_PREFIX.length;
  const end = content.indexOf(GYM_PLAN_SUFFIX, jsonStart);
  if (end === -1) {
    return null;
  }

  try {
    return normalizeGymPlan(JSON.parse(content.slice(jsonStart, end)));
  } catch {
    return null;
  }
}

export function stripWorkoutChangeMarker(content: string): string {
  const start = content.indexOf(WORKOUT_CHANGE_PREFIX);
  if (start === -1) {
    return content;
  }

  const jsonStart = start + WORKOUT_CHANGE_PREFIX.length;
  const end = content.indexOf(WORKOUT_CHANGE_SUFFIX, jsonStart);
  if (end === -1) {
    return content;
  }

  const before = content.slice(0, start).trimEnd();
  const after = content.slice(end + WORKOUT_CHANGE_SUFFIX.length).trimStart();

  if (before && after) {
    return `${before}\n${after}`;
  }

  return before || after;
}

export function stripGymPlanMarker(content: string): string {
  const start = content.indexOf(GYM_PLAN_PREFIX);
  if (start === -1) {
    return content;
  }

  const jsonStart = start + GYM_PLAN_PREFIX.length;
  const end = content.indexOf(GYM_PLAN_SUFFIX, jsonStart);
  if (end === -1) {
    return content;
  }

  const before = content.slice(0, start).trimEnd();
  const after = content.slice(end + GYM_PLAN_SUFFIX.length).trimStart();

  if (before && after) {
    return `${before}\n${after}`;
  }

  return before || after;
}

export function findMoveByName(moves: Move[], name: string): Move | undefined {
  const normalized = name.toLowerCase().trim();
  const exact = moves.find(
    (move) => move.name.toLowerCase().trim() === normalized,
  );
  if (exact) {
    return exact;
  }

  return moves.find(
    (move) =>
      move.name.toLowerCase().includes(normalized) ||
      normalized.includes(move.name.toLowerCase()),
  );
}

export function canApplyWorkoutChange(
  data: AppData,
  change: CoachWorkoutChange,
): boolean {
  const template = getWorkoutTemplate(data, change.workoutId);
  if (!template) {
    return false;
  }

  if (change.action === "add") {
    return true;
  }

  if (change.action === "remove") {
    return findMoveByName(template.moves, change.exercise) !== undefined;
  }

  return findMoveByName(template.moves, change.fromExercise) !== undefined;
}

export function canApplyGymPlan(plan: CoachGymPlan): boolean {
  return plan.days.length > 0 && plan.days.every((day) => day.exercises.length > 0);
}

function toPreset(exercise: CoachGymPlanExercise): BatchExercisePreset {
  return {
    name: exercise.name,
    setCount: exercise.sets ?? 3,
    reps: exercise.reps ?? 10,
    restSeconds: exercise.restSeconds ?? 90,
    weightKg: 0,
  };
}

export function applyWorkoutChange(
  data: AppData,
  change: CoachWorkoutChange,
): AppData {
  const template = getWorkoutTemplate(data, change.workoutId);
  if (!template) {
    return data;
  }

  if (change.action === "add") {
    return updateWorkoutMoves(data, change.workoutId, (moves) => [
      ...moves,
      createDefaultMove(change.exercise),
    ]);
  }

  if (change.action === "remove") {
    const move = findMoveByName(template.moves, change.exercise);
    if (!move) {
      return data;
    }

    return updateWorkoutMoves(data, change.workoutId, (moves) =>
      moves.filter((entry) => entry.id !== move.id),
    );
  }

  const move = findMoveByName(template.moves, change.fromExercise);
  if (!move) {
    return data;
  }

  return updateWorkoutMoves(data, change.workoutId, (moves) =>
    moves.map((entry) =>
      entry.id === move.id ? { ...entry, name: change.toExercise } : entry,
    ),
  );
}

export function applyGymPlan(data: AppData, plan: CoachGymPlan): AppData {
  const customWorkouts = plan.days.map((day, index) => {
    const { theme, sticker } = themeForSlot("custom", day.name, index);
    const custom = createCustomWorkoutDay(day.name, { theme, sticker });
    custom.moves = day.exercises.map((exercise) =>
      createMoveFromPreset(toPreset(exercise)),
    );
    return custom;
  });

  const workoutSetupSeen: Record<string, boolean> = {};
  for (const workout of customWorkouts) {
    workoutSetupSeen[workout.id] = true;
  }

  return {
    ...data,
    coachPlanActive: true,
    workouts: createDefaultAppData().workouts,
    customWorkouts,
    activeSession: null,
    workoutSetupSeen: {
      ...data.workoutSetupSeen,
      ...workoutSetupSeen,
    },
  };
}

export function describeWorkoutChange(
  data: AppData,
  change: CoachWorkoutChange,
): string {
  const dayLabel = getWorkoutLabel(data, change.workoutId);

  if (change.action === "add") {
    return t("coach.applyWorkout.add", {
      exercise: change.exercise,
      day: dayLabel,
    });
  }

  if (change.action === "remove") {
    return t("coach.applyWorkout.remove", {
      exercise: change.exercise,
      day: dayLabel,
    });
  }

  return t("coach.applyWorkout.replace", {
    from: change.fromExercise,
    to: change.toExercise,
    day: dayLabel,
  });
}

export function describeGymPlan(plan: CoachGymPlan): string {
  const dayCount = plan.days.length;
  const exerciseCount = plan.days.reduce(
    (sum, day) => sum + day.exercises.length,
    0,
  );
  const dayNames = plan.days.map((day) => day.name).join(", ");
  return t("coach.applyWorkout.describeGym", {
    dayCount,
    exerciseCount,
    dayNames,
  });
}

export function getWorkoutChangeApplyLabel(change: CoachWorkoutChange): string {
  if (change.action === "replace") {
    return t("coach.applyWorkout.swapTo", { exercise: change.toExercise });
  }

  if (change.action === "add") {
    return t("coach.applyWorkout.addExercise", { exercise: change.exercise });
  }

  return t("coach.applyWorkout.removeExercise", { exercise: change.exercise });
}

export function getGymPlanApplyLabel(): string {
  return t("coach.applyWorkout.addToWorkoutDays");
}

export function formatGymPlanPreview(plan: CoachGymPlan): string {
  return plan.days
    .map((day) => {
      const exercises = day.exercises
        .map(
          (exercise) =>
            t("coach.applyWorkout.previewExercise", {
              name: exercise.name,
              sets: exercise.sets ?? 3,
              reps: exercise.reps ?? 10,
            }),
        )
        .join(", ");
      return `${day.name}: ${exercises}`;
    })
    .join("\n");
}

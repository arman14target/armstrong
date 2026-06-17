import {
  AppData,
  Move,
  WORKOUT_LABELS,
  WORKOUT_TYPES,
} from "@/lib/types";
import {
  getWorkoutLabel,
  getWorkoutTemplate,
  updateWorkoutMoves,
} from "@/lib/workouts";
import { appendDietCoachPrompt } from "@/lib/coachDiet";
import { COACH_SYSTEM_PROMPT } from "@/lib/gemini";

export const WORKOUT_CHANGE_PREFIX = "[[WORKOUT_CHANGE:";
export const WORKOUT_CHANGE_SUFFIX = "]]";

export interface CoachWorkoutReplaceChange {
  action: "replace";
  workoutId: string;
  fromExercise: string;
  toExercise: string;
}

export type CoachWorkoutChange = CoachWorkoutReplaceChange;

const WORKOUT_EDITING_PROMPT = `

The user's current workout plan is listed below. You can suggest edits when they ask to change their plan.

Workout plan editing:
- Only suggest changing their saved plan when they want to swap, remove, or add exercises
- Propose one specific change at a time and ask if they want you to apply it (e.g. "Want me to swap bench for dumbbell press on Push?")
- When offering a concrete swap they can tap to apply, end your message with exactly one line:
  [[WORKOUT_CHANGE:{"action":"replace","workoutId":"<id>","fromExercise":"<name from plan>","toExercise":"<new name>"}]]
- Use workoutId from the plan context (push, pull, leg, abs, or a custom id)
- fromExercise must match an exercise name from their plan
- Never include the marker without asking permission in the same message
- Do not mention markers to the user — they are internal signals only`;

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

function normalizeWorkoutChange(value: unknown): CoachWorkoutChange | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record.action !== "replace") {
    return null;
  }

  const workoutId =
    typeof record.workoutId === "string" ? record.workoutId.trim() : "";
  const fromExercise =
    typeof record.fromExercise === "string"
      ? record.fromExercise.trim()
      : "";
  const toExercise =
    typeof record.toExercise === "string" ? record.toExercise.trim() : "";

  if (!workoutId || !fromExercise || !toExercise) {
    return null;
  }

  return {
    action: "replace",
    workoutId,
    fromExercise,
    toExercise,
  };
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

  return findMoveByName(template.moves, change.fromExercise) !== undefined;
}

export function applyWorkoutChange(
  data: AppData,
  change: CoachWorkoutChange,
): AppData {
  const template = getWorkoutTemplate(data, change.workoutId);
  if (!template) {
    return data;
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

export function describeWorkoutChange(
  data: AppData,
  change: CoachWorkoutChange,
): string {
  const dayLabel = getWorkoutLabel(data, change.workoutId);
  return `Swapped ${change.fromExercise} → ${change.toExercise} on ${dayLabel}.`;
}

export function getWorkoutChangeApplyLabel(change: CoachWorkoutChange): string {
  if (change.action === "replace") {
    return `Swap to ${change.toExercise}`;
  }

  return "Apply change";
}

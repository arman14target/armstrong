import { BatchExercisePreset } from "@/lib/workoutBatches";

export const EXERCISE_LINE_FORMAT_HINT = "exercise name - 3 sets - 1 min";

export interface ExerciseRowInput {
  name: string;
  sets: string;
  rest: string;
}

export interface ExerciseLineFieldErrors {
  name?: string;
  sets?: string;
  rest?: string;
  general?: string;
}

export interface ExerciseLineValidation {
  valid: boolean;
  errors: ExerciseLineFieldErrors;
  parsed?: BatchExercisePreset;
  empty: boolean;
}

function parseSetsValue(input: string): { value?: number; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: "Add sets like: 3 sets" };
  }

  const match = trimmed.match(/^(\d+)\s*sets?$/i);
  if (!match) {
    return { error: "Write sets like: 3 sets" };
  }

  const setCount = parseInt(match[1], 10);
  if (setCount < 1 || setCount > 20) {
    return { error: "Sets must be between 1 and 20." };
  }

  return { value: setCount };
}

function parseRestValue(input: string): { value?: number; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: "Add rest like: 1 min" };
  }

  const minuteMatch =
    trimmed.match(/^(\d+)\s*min(?:ute)?s?$/i) ?? trimmed.match(/^(\d+)min$/i);
  if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1], 10);
    if (minutes < 1 || minutes > 30) {
      return { error: "Rest must be between 1 and 30 minutes." };
    }
    return { value: minutes * 60 };
  }

  const secondMatch = trimmed.match(/^(\d+)\s*s(?:ec(?:onds?)?)?$/i);
  if (secondMatch) {
    const seconds = parseInt(secondMatch[1], 10);
    if (seconds < 5 || seconds > 600) {
      return { error: "Rest seconds must be between 5 and 600." };
    }
    return { value: seconds };
  }

  return { error: "Write rest like: 1 min or 90s" };
}

export function isExerciseRowEmpty(row: ExerciseRowInput): boolean {
  return !row.name.trim() && !row.sets.trim() && !row.rest.trim();
}

export function validateExerciseRow(row: ExerciseRowInput): ExerciseLineValidation {
  if (isExerciseRowEmpty(row)) {
    return { valid: false, empty: true, errors: {} };
  }

  const errors: ExerciseLineFieldErrors = {};
  const name = row.name.trim();

  if (!name) {
    errors.name = "Exercise name is required.";
  } else if (name.length < 2) {
    errors.name = "Exercise name is too short.";
  }

  const setsResult = parseSetsValue(row.sets);
  if (setsResult.error) {
    errors.sets = setsResult.error;
  }

  const restResult = parseRestValue(row.rest);
  if (restResult.error) {
    errors.rest = restResult.error;
  }

  const valid =
    Boolean(name) &&
    name.length >= 2 &&
    setsResult.value !== undefined &&
    restResult.value !== undefined;

  if (!valid) {
    return { valid: false, empty: false, errors };
  }

  return {
    valid: true,
    empty: false,
    errors: {},
    parsed: {
      name,
      setCount: setsResult.value!,
      weightKg: 0,
      restSeconds: restResult.value!,
    },
  };
}

export function getExerciseLineErrorMessage(
  errors: ExerciseLineFieldErrors,
): string | undefined {
  return errors.general ?? errors.name ?? errors.sets ?? errors.rest;
}

export function formatRestForInput(restSeconds: number): string {
  if (restSeconds >= 60 && restSeconds % 60 === 0) {
    return `${restSeconds / 60} min`;
  }

  return `${restSeconds}s`;
}

export function presetToExerciseRow(
  preset: BatchExercisePreset,
): ExerciseRowInput {
  return {
    name: preset.name,
    sets: `${preset.setCount} sets`,
    rest: formatRestForInput(preset.restSeconds),
  };
}

export function createEmptyExerciseRow(): ExerciseRowInput {
  return {
    name: "",
    sets: "",
    rest: "",
  };
}

export function normalizeSetsInput(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+)$/);
  if (match) {
    return `${match[1]} sets`;
  }

  const compactMatch = trimmed.match(/^(\d+)s$/i);
  if (compactMatch) {
    return `${compactMatch[1]} sets`;
  }

  return value;
}

export function normalizeRestInput(value: string): string {
  const trimmed = value.trim();

  if (/^\d+$/.test(trimmed)) {
    return `${trimmed} min`;
  }

  const compactMinuteMatch = trimmed.match(/^(\d+)min$/i);
  if (compactMinuteMatch) {
    return `${compactMinuteMatch[1]} min`;
  }

  return value;
}

import { BatchExercisePreset } from "@/lib/workoutBatches";

export const EXERCISE_LINE_FORMAT_HINT = "exercise name - 3 sets - 1 min";

export type RestInputUnit = "min" | "sec";

export interface ExerciseRowInput {
  name: string;
  sets: string;
  rest: string;
  restUnit?: RestInputUnit;
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
    return { error: "Enter number of sets." };
  }

  const bareMatch = trimmed.match(/^(\d+)$/);
  const match = bareMatch ?? trimmed.match(/^(\d+)\s*sets?$/i);
  if (!match) {
    return { error: "Enter a number from 1–20." };
  }

  const setCount = parseInt(match[1], 10);
  if (setCount < 1 || setCount > 20) {
    return { error: "Sets must be between 1 and 20." };
  }

  return { value: setCount };
}

function parseRestValue(
  input: string,
  unit: RestInputUnit = "min",
): { value?: number; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: "Enter rest time." };
  }

  const bareMatch = trimmed.match(/^(\d+)$/);
  if (bareMatch) {
    const value = parseInt(bareMatch[1], 10);
    if (unit === "min") {
      if (value < 1 || value > 30) {
        return { error: "Minutes must be between 1 and 30." };
      }
      return { value: value * 60 };
    }

    if (value < 5 || value > 600) {
      return { error: "Seconds must be between 5 and 600." };
    }
    return { value };
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

  return { error: "Enter a number." };
}

export function inferRestUnit(value: string): RestInputUnit {
  const trimmed = value.trim();
  if (!trimmed) {
    return "min";
  }

  const bareMatch = trimmed.match(/^(\d+)$/);
  if (bareMatch) {
    const value = parseInt(bareMatch[1], 10);
    return value > 30 ? "sec" : "min";
  }

  if (/^\d+\s*s(?:ec(?:onds?)?)?$/i.test(trimmed)) {
    return "sec";
  }

  return "min";
}

function restUnitFromSeconds(restSeconds: number): RestInputUnit {
  if (restSeconds >= 60 && restSeconds % 60 === 0) {
    return "min";
  }

  return "sec";
}

function formatRestValueFromSeconds(restSeconds: number): string {
  if (restSeconds >= 60 && restSeconds % 60 === 0) {
    return String(restSeconds / 60);
  }

  return String(restSeconds);
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

  const restUnit = row.restUnit ?? inferRestUnit(row.rest);
  const restResult = parseRestValue(row.rest, restUnit);
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
    sets: String(preset.setCount),
    rest: formatRestValueFromSeconds(preset.restSeconds),
    restUnit: restUnitFromSeconds(preset.restSeconds),
  };
}

export function createEmptyExerciseRow(): ExerciseRowInput {
  return {
    name: "",
    sets: "",
    rest: "",
    restUnit: "min",
  };
}

export function normalizeSetsInput(value: string): string {
  const match = value.trim().match(/^(\d+)/);
  return match ? match[1] : value.trim();
}

export function normalizeRestInput(value: string): string {
  const match = value.trim().match(/^(\d+)/);
  return match ? match[1] : value.trim();
}

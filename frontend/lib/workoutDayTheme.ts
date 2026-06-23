import { DAY_EQUIPMENT_STICKERS } from "@/lib/dayStickers";
import type { WorkoutType } from "@/lib/types";
import { workoutDayAccentMap } from "@/lib/theme";

/**
 * Workout day accent keys map to athletic theme colors via CSS aliases:
 * cyan → primary (electric gold), magenta → secondary (intense orange),
 * green → success, amber → bronze (pull day).
 */
export type WorkoutDayTheme = keyof typeof workoutDayAccentMap;

export const WORKOUT_DAY_THEMES: WorkoutDayTheme[] = [
  "cyan",
  "amber",
  "green",
  "magenta",
];

export const DAY_THEME_STYLES: Record<
  WorkoutDayTheme,
  { border: string; hover: string; labelColor: string; iconColor: string }
> = {
  cyan: {
    border: "border-cyan/35",
    hover: "hover:border-cyan hover:-translate-y-1",
    labelColor: "text-cyan",
    iconColor: "text-cyan",
  },
  green: {
    border: "border-green/35",
    hover: "hover:border-green hover:-translate-y-1",
    labelColor: "text-green",
    iconColor: "text-green",
  },
  magenta: {
    border: "border-magenta/35",
    hover: "hover:border-magenta hover:-translate-y-1",
    labelColor: "text-magenta",
    iconColor: "text-magenta",
  },
  amber: {
    border: "border-amber/35",
    hover: "hover:border-amber hover:-translate-y-1",
    labelColor: "text-amber",
    iconColor: "text-amber",
  },
};

export const BUILTIN_DAY_THEME: Record<WorkoutType, WorkoutDayTheme> = {
  push: "cyan",
  leg: "green",
  abs: "magenta",
  pull: "amber",
};

export const BUILTIN_DAY_STICKER: Record<WorkoutType, string> = {
  push: "dumbbell",
  leg: "kettlebell",
  abs: "medicine-ball",
  pull: "jump-rope",
};

export const ROTATING_STICKERS = DAY_EQUIPMENT_STICKERS;

export function stickerForDayIndex(index: number): string {
  return ROTATING_STICKERS[index % ROTATING_STICKERS.length];
}

export function themeForSlot(
  slot: string,
  name: string,
  index: number,
): { theme: WorkoutDayTheme; sticker: string } {
  const normalized = `${slot} ${name}`.toLowerCase();

  if (
    slot === "push" ||
    normalized.includes("push") ||
    normalized.includes("chest") ||
    normalized.includes("shoulder")
  ) {
    return { theme: "cyan", sticker: "dumbbell" };
  }

  if (
    slot === "pull" ||
    normalized.includes("pull") ||
    normalized.includes("back") ||
    normalized.includes("lat")
  ) {
    return { theme: "amber", sticker: "jump-rope" };
  }

  if (
    slot === "leg" ||
    normalized.includes("leg") ||
    normalized.includes("lower") ||
    normalized.includes("squat")
  ) {
    return { theme: "green", sticker: "kettlebell" };
  }

  if (
    slot === "abs" ||
    normalized.includes("abs") ||
    normalized.includes("core")
  ) {
    return { theme: "magenta", sticker: "medicine-ball" };
  }

  if (normalized.includes("upper")) {
    return {
      theme: WORKOUT_DAY_THEMES[index % WORKOUT_DAY_THEMES.length],
      sticker: index % 2 === 0 ? "dumbbell" : "jump-rope",
    };
  }

  if (normalized.includes("full")) {
    return { theme: "cyan", sticker: "weight-plate" };
  }

  return {
    theme: WORKOUT_DAY_THEMES[index % WORKOUT_DAY_THEMES.length],
    sticker: ROTATING_STICKERS[index % ROTATING_STICKERS.length],
  };
}

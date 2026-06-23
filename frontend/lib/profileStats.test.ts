import { describe, expect, it } from "vitest";
import {
  currentStreak,
  lifetimeStats,
  personalRecords,
} from "@/lib/profileStats";
import type { WorkoutDayEntry } from "@/lib/types";

function entry(
  dateKey: string,
  exercises: { name: string; sets: { weight: number; reps: number }[] }[],
): WorkoutDayEntry {
  return {
    workoutId: "push",
    completedAt: `${dateKey}T12:00:00.000Z`,
    snapshot: { exercises },
  };
}

describe("currentStreak", () => {
  it("counts consecutive days ending today", () => {
    const dates = ["2026-06-21", "2026-06-22", "2026-06-23"];
    expect(currentStreak(dates, "2026-06-23")).toBe(3);
  });

  it("still counts when today isn't done but yesterday was", () => {
    const dates = ["2026-06-21", "2026-06-22"];
    expect(currentStreak(dates, "2026-06-23")).toBe(2);
  });

  it("is 0 when the chain doesn't reach today or yesterday", () => {
    const dates = ["2026-06-10", "2026-06-11"];
    expect(currentStreak(dates, "2026-06-23")).toBe(0);
  });

  it("is 0 with no history", () => {
    expect(currentStreak([], "2026-06-23")).toBe(0);
  });
});

describe("lifetimeStats", () => {
  const log: Record<string, WorkoutDayEntry[]> = {
    "2026-06-01": [entry("2026-06-01", [{ name: "Squat", sets: [{ weight: 100, reps: 5 }] }])],
    "2026-06-22": [
      entry("2026-06-22", [{ name: "Bench", sets: [{ weight: 80, reps: 5 }, { weight: 80, reps: 3 }] }]),
    ],
    "2026-06-23": [entry("2026-06-23", [{ name: "Squat", sets: [{ weight: 110, reps: 3 }] }])],
  };

  it("counts total workouts and this week's", () => {
    const s = lifetimeStats(log, undefined, "2026-06-23");
    expect(s.totalWorkouts).toBe(3);
    expect(s.workoutsThisWeek).toBe(2); // 06-22 and 06-23 within last 7 days
  });

  it("sums total volume across all snapshots", () => {
    const s = lifetimeStats(log, undefined, "2026-06-23");
    // 100*5 + 80*5 + 80*3 + 110*3 = 500 + 400 + 240 + 330 = 1470
    expect(s.totalVolumeKg).toBe(1470);
  });

  it("falls back to completion dates when there is no day log", () => {
    const s = lifetimeStats(undefined, ["2026-06-22", "2026-06-23"], "2026-06-23");
    expect(s.totalWorkouts).toBe(2);
    expect(s.workoutsThisWeek).toBe(2);
    expect(s.totalVolumeKg).toBe(0);
  });
});

describe("personalRecords", () => {
  const log: Record<string, WorkoutDayEntry[]> = {
    "2026-06-01": [entry("2026-06-01", [{ name: "Bench", sets: [{ weight: 80, reps: 5 }] }])],
    "2026-06-22": [
      entry("2026-06-22", [
        { name: "Bench", sets: [{ weight: 85, reps: 3 }, { weight: 85, reps: 5 }] },
        { name: "Squat", sets: [{ weight: 120, reps: 4 }] },
      ]),
    ],
  };

  it("keeps the heaviest set per exercise, ranked by est 1RM", () => {
    const prs = personalRecords(log);
    expect(prs.map((p) => p.exercise)).toEqual(["Squat", "Bench"]);

    const bench = prs.find((p) => p.exercise === "Bench")!;
    expect(bench.bestWeightKg).toBe(85);
    expect(bench.repsAtBest).toBe(5); // tie on weight → more reps wins
    expect(bench.estimated1RmKg).toBe(Math.round(85 * (1 + 5 / 30)));
    expect(bench.achievedAt).toBe("2026-06-22T12:00:00.000Z");
  });

  it("ignores zero-weight (bodyweight/time) sets", () => {
    const prs = personalRecords({
      "2026-06-01": [entry("2026-06-01", [{ name: "Plank", sets: [{ weight: 0, reps: 60 }] }])],
    });
    expect(prs).toHaveLength(0);
  });
});

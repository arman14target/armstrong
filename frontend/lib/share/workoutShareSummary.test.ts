import { describe, expect, it } from "vitest";
import type { ActiveSession, Move } from "@/lib/types";
import {
  buildWorkoutShareSummary,
  computeStreak,
} from "@/lib/share/workoutShareSummary";

const move = (id: string, name: string, setIds: string[]): Move => ({
  id,
  name,
  sets: setIds.map((sid) => ({ id: sid, restSeconds: 90 })),
});

const baseSession = (over: Partial<ActiveSession> = {}): ActiveSession => ({
  workoutType: "push",
  startedAt: "2026-06-21T10:00:00.000Z",
  setWeights: {},
  setReps: {},
  completedSetIds: [],
  baselineWorkout: { moves: [] },
  ...over,
});

describe("buildWorkoutShareSummary", () => {
  it("summarizes only completed sets with top set and volume", () => {
    const moves = [move("m1", "Bench", ["s1", "s2", "s3"])];
    const session = baseSession({
      setWeights: { s1: 80, s2: 100, s3: 90 },
      setReps: { s1: 5, s2: 3, s3: 4 },
      completedSetIds: ["s1", "s2"], // s3 not completed
    });

    const summary = buildWorkoutShareSummary({
      workoutName: "Push Day",
      moves,
      session,
      completedAt: "2026-06-21T11:00:00.000Z",
    });

    expect(summary.exercises).toHaveLength(1);
    expect(summary.exercises[0]).toMatchObject({
      name: "Bench",
      setCount: 2,
      topSet: { weight: 100, reps: 3 },
    });
    expect(summary.totalSets).toBe(2);
    expect(summary.totalVolume).toBe(80 * 5 + 100 * 3); // 700
    expect(summary.durationSeconds).toBe(3600);
  });

  it("skips moves with no completed sets", () => {
    const moves = [
      move("m1", "Bench", ["s1"]),
      move("m2", "Fly", ["s2"]),
    ];
    const session = baseSession({
      setWeights: { s1: 60 },
      setReps: { s1: 8 },
      completedSetIds: ["s1"],
    });

    const summary = buildWorkoutShareSummary({
      workoutName: "Push Day",
      moves,
      session,
      completedAt: "2026-06-21T11:00:00.000Z",
    });

    expect(summary.exercises.map((e) => e.name)).toEqual(["Bench"]);
  });

  it("picks a PR hero stat when a completed set beats its baseline", () => {
    const moves = [move("m1", "Squat", ["s1"])];
    const session = baseSession({
      setWeights: { s1: 120 },
      setReps: { s1: 5 },
      completedSetIds: ["s1"],
      baselineWorkout: {
        moves: [
          { id: "m1", name: "Squat", sets: [{ id: "s1", restSeconds: 90, lastWeight: 110 }] },
        ],
      },
    });

    const summary = buildWorkoutShareSummary({
      workoutName: "Leg Day",
      moves,
      session,
      completedAt: "2026-06-21T11:00:00.000Z",
    });

    expect(summary.heroStat.kind).toBe("pr");
    expect(summary.heroStat.value).toBe("Squat · 120 kg");
  });

  it("falls back to streak, then volume", () => {
    const moves = [move("m1", "Bench", ["s1"])];
    const session = baseSession({
      setWeights: { s1: 100 },
      setReps: { s1: 5 },
      completedSetIds: ["s1"],
    });

    const streakSummary = buildWorkoutShareSummary({
      workoutName: "Push Day",
      moves,
      session,
      completedAt: "2026-06-21T11:00:00.000Z",
      completionDates: ["2026-06-20", "2026-06-19"],
    });
    expect(streakSummary.heroStat.kind).toBe("streak");
    expect(streakSummary.heroStat.value).toBe("3 day streak");

    const volumeSummary = buildWorkoutShareSummary({
      workoutName: "Push Day",
      moves,
      session,
      completedAt: "2026-06-21T11:00:00.000Z",
      completionDates: [],
    });
    expect(volumeSummary.heroStat.kind).toBe("volume");
    expect(volumeSummary.heroStat.value).toBe("500 kg");
  });
});

describe("computeStreak", () => {
  it("counts the finishing day plus consecutive prior days", () => {
    expect(
      computeStreak(["2026-06-20", "2026-06-19"], "2026-06-21T08:00:00"),
    ).toBe(3);
  });

  it("stops at the first gap", () => {
    expect(
      computeStreak(["2026-06-20", "2026-06-18"], "2026-06-21T08:00:00"),
    ).toBe(2);
  });

  it("is 1 with no prior history", () => {
    expect(computeStreak([], "2026-06-21T08:00:00")).toBe(1);
    expect(computeStreak(undefined, "2026-06-21T08:00:00")).toBe(1);
  });
});

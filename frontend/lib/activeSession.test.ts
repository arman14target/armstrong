import { describe, expect, it } from "vitest";
import { shouldReuseActiveSession } from "@/lib/activeSession";
import type { ActiveSession, WorkoutTemplate } from "@/lib/types";

const session = (startedAt: string): ActiveSession => ({
  workoutType: "push",
  startedAt,
  setWeights: {},
  setReps: {},
  completedSetIds: [],
  baselineWorkout: { moves: [] },
});

describe("shouldReuseActiveSession", () => {
  const now = new Date("2026-06-20T15:00:00.000Z");

  it("reuses an in-progress session from the same local day", () => {
    const earlierToday = new Date(now);
    earlierToday.setHours(earlierToday.getHours() - 1);

    const template: WorkoutTemplate = {
      moves: [],
      lastCompletedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
    };

    expect(
      shouldReuseActiveSession(
        session(earlierToday.toISOString()),
        "push",
        template,
        now,
      ),
    ).toBe(true);
  });

  it("starts fresh when the session began on a previous local day", () => {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    expect(
      shouldReuseActiveSession(
        session(yesterday.toISOString()),
        "push",
        { moves: [] },
        now,
      ),
    ).toBe(false);
  });

  it("starts fresh when the workout was finished after the session started", () => {
    const startedAt = new Date(now);
    startedAt.setHours(startedAt.getHours() - 2);

    const template: WorkoutTemplate = {
      moves: [],
      lastCompletedAt: new Date(startedAt.getTime() + 30 * 60 * 1000).toISOString(),
    };

    expect(
      shouldReuseActiveSession(
        session(startedAt.toISOString()),
        "push",
        template,
        now,
      ),
    ).toBe(false);
  });

  it("ignores sessions for a different workout day", () => {
    const earlierToday = new Date(now);
    earlierToday.setHours(earlierToday.getHours() - 1);

    expect(
      shouldReuseActiveSession(
        session(earlierToday.toISOString()),
        "pull",
        { moves: [] },
        now,
      ),
    ).toBe(false);
  });
});

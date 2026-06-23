import { describe, expect, it } from "vitest";
import { applySetDraft } from "@/lib/activeSession";
import type { ActiveSession } from "@/lib/types";

function makeSession(partial: Partial<ActiveSession> = {}): ActiveSession {
  return {
    workoutType: "push",
    startedAt: "2026-06-23T00:00:00.000Z",
    setWeights: {},
    setReps: {},
    completedSetIds: [],
    baselineWorkout: { moves: [] },
    ...partial,
  };
}

describe("applySetDraft", () => {
  it("stores draft weight and reps without completing the set", () => {
    const session = makeSession();
    const next = applySetDraft(session, "push", "set-1", 60, 8);

    expect(next.setWeights["set-1"]).toBe(60);
    expect(next.setReps["set-1"]).toBe(8);
    // Drafting must not mark the set complete.
    expect(next.completedSetIds).toEqual([]);
  });

  it("writes only the provided field, preserving the other", () => {
    const session = makeSession({
      setWeights: { "set-1": 50 },
      setReps: { "set-1": 5 },
    });

    const weightOnly = applySetDraft(session, "push", "set-1", 70, undefined);
    expect(weightOnly.setWeights["set-1"]).toBe(70);
    expect(weightOnly.setReps["set-1"]).toBe(5);

    const repsOnly = applySetDraft(session, "push", "set-1", undefined, 12);
    expect(repsOnly.setReps["set-1"]).toBe(12);
    expect(repsOnly.setWeights["set-1"]).toBe(50);
  });

  it("does not overwrite an already-completed set", () => {
    const session = makeSession({
      completedSetIds: ["set-1"],
      setWeights: { "set-1": 100 },
      setReps: { "set-1": 10 },
    });

    const next = applySetDraft(session, "push", "set-1", 5, 1);

    expect(next).toBe(session);
    expect(next.setWeights["set-1"]).toBe(100);
    expect(next.setReps["set-1"]).toBe(10);
  });

  it("ignores a draft for a different workout", () => {
    const session = makeSession({ workoutType: "push" });
    const next = applySetDraft(session, "leg", "set-1", 60, 8);

    expect(next).toBe(session);
    expect(next.setWeights["set-1"]).toBeUndefined();
  });

  it("returns the same session when nothing is provided", () => {
    const session = makeSession();
    expect(applySetDraft(session, "push", "set-1")).toBe(session);
  });

  it("does not mutate the original session", () => {
    const session = makeSession();
    applySetDraft(session, "push", "set-1", 60, 8);

    expect(session.setWeights).toEqual({});
    expect(session.setReps).toEqual({});
  });

  it("tolerates a session with no setReps map", () => {
    const session = makeSession();
    // @ts-expect-error — exercise the runtime guard for legacy sessions.
    delete session.setReps;

    const next = applySetDraft(session, "push", "set-1", undefined, 9);
    expect(next.setReps["set-1"]).toBe(9);
  });
});

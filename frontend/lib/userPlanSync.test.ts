import { describe, expect, it } from "vitest";
import { mergeAppDataOnSync } from "@/lib/userPlanSync";
import { createDefaultAppData, type ActiveSession, type AppData } from "@/lib/types";

function withDefaults(partial: Partial<AppData>): AppData {
  return { ...createDefaultAppData(), ...partial };
}

const session: ActiveSession = {
  workoutType: "push",
  startedAt: "2026-06-19T00:00:00.000Z",
  setWeights: {},
  setReps: {},
  completedSetIds: [],
  baselineWorkout: { moves: [] },
};

describe("mergeAppDataOnSync", () => {
  it("keeps the local in-progress session over remote", () => {
    const remote = withDefaults({ activeSession: null });
    const local = withDefaults({ activeSession: session });
    expect(mergeAppDataOnSync(remote, local).activeSession).toBe(session);
  });

  it("falls back to the remote session when local has none", () => {
    const remote = withDefaults({ activeSession: session });
    const local = withDefaults({ activeSession: null });
    expect(mergeAppDataOnSync(remote, local).activeSession).toBe(session);
  });

  it("unions completion dates without duplicates", () => {
    const remote = withDefaults({ workoutCompletionDates: ["2026-06-17", "2026-06-18"] });
    const local = withDefaults({ workoutCompletionDates: ["2026-06-18", "2026-06-19"] });
    const merged = mergeAppDataOnSync(remote, local).workoutCompletionDates ?? [];
    expect([...merged].sort()).toEqual(["2026-06-17", "2026-06-18", "2026-06-19"]);
  });

  it("prefers the more-recently-completed custom workout", () => {
    const remote = withDefaults({
      customWorkouts: [
        { id: "c1", name: "Old", moves: [], lastCompletedAt: "2026-06-01T00:00:00.000Z" },
      ],
    });
    const local = withDefaults({
      customWorkouts: [
        { id: "c1", name: "New", moves: [], lastCompletedAt: "2026-06-18T00:00:00.000Z" },
      ],
    });
    const merged = mergeAppDataOnSync(remote, local);
    expect(merged.customWorkouts).toHaveLength(1);
    expect(merged.customWorkouts[0].name).toBe("New");
  });

  it("merges food logs by day", () => {
    const remote = withDefaults({ foodLog: { "2026-06-18": [] } });
    const local = withDefaults({ foodLog: { "2026-06-19": [] } });
    const merged = mergeAppDataOnSync(remote, local);
    expect(Object.keys(merged.foodLog ?? {}).sort()).toEqual([
      "2026-06-18",
      "2026-06-19",
    ]);
  });
});

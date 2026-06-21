import { describe, expect, it } from "vitest";
import { getWorkoutTemplate, updateCustomWorkoutName } from "@/lib/workouts";
import { createDefaultAppData, type AppData } from "@/lib/types";
import { applyDefaultManualExercisePlan } from "@/lib/planner/welcomePlan";

function makeData(): AppData {
  const data = createDefaultAppData();
  data.workouts.push.moves = [
    { id: "m1", name: "Bench", sets: [{ id: "s1", restSeconds: 90 }] },
  ];
  data.customWorkouts = [
    {
      id: "custom-1",
      name: "Arm Day",
      moves: [{ id: "m2", name: "Curl", sets: [{ id: "s2", restSeconds: 60 }] }],
      lastCompletedAt: "2026-06-18T00:00:00.000Z",
    },
  ];
  return data;
}

describe("getWorkoutTemplate", () => {
  it("resolves a builtin split type", () => {
    const tpl = getWorkoutTemplate(makeData(), "push");
    expect(tpl?.moves[0].name).toBe("Bench");
  });

  it("resolves a custom workout by id", () => {
    const tpl = getWorkoutTemplate(makeData(), "custom-1");
    expect(tpl?.moves[0].name).toBe("Curl");
    expect(tpl?.lastCompletedAt).toBe("2026-06-18T00:00:00.000Z");
  });

  it("returns undefined for an unknown id", () => {
    expect(getWorkoutTemplate(makeData(), "nope")).toBeUndefined();
  });
});

describe("updateCustomWorkoutName", () => {
  it("renames a custom workout day", () => {
    const next = updateCustomWorkoutName(makeData(), "custom-1", "Upper Body");
    expect(next.customWorkouts[0]?.name).toBe("Upper Body");
  });
});

describe("applyDefaultManualExercisePlan", () => {
  it("seeds four filled workout days for manual onboarding", () => {
    const next = applyDefaultManualExercisePlan(createDefaultAppData());
    expect(next.coachPlanActive).toBe(true);
    expect(next.customWorkouts).toHaveLength(4);
    expect(next.customWorkouts.every((day) => day.moves.length > 0)).toBe(true);
  });
});

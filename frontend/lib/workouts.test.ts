import { describe, expect, it } from "vitest";
import { getWorkoutTemplate } from "@/lib/workouts";
import { createDefaultAppData, type AppData } from "@/lib/types";

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

import { describe, expect, it } from "vitest";
import { buildActivityDaySummaries } from "@/lib/activityHistory";
import { createDefaultAppData } from "@/lib/types";

describe("buildActivityDaySummaries", () => {
  it("groups workouts and eaten food by day, skipping planned-only meals", () => {
    const data = createDefaultAppData();

    const summaries = buildActivityDaySummaries(
      data,
      {
        "2026-06-23": [
          {
            id: "planned",
            name: "Planned oats",
            calories: 400,
            proteinG: 20,
            carbsG: 50,
            fatG: 8,
            loggedAt: "2026-06-23T08:00:00.000Z",
            fromPlan: true,
            completed: false,
          },
          {
            id: "eaten",
            name: "Chicken bowl",
            calories: 620,
            proteinG: 45,
            carbsG: 60,
            fatG: 12,
            loggedAt: "2026-06-23T12:00:00.000Z",
          },
        ],
      },
      {
        "2026-06-23": [
          {
            workoutId: "push",
            completedAt: "2026-06-23T18:00:00.000Z",
            durationSeconds: 2400,
            snapshot: {
              exercises: [
                { name: "Bench Press", sets: [{ weight: 60, reps: 8 }] },
                { name: "OHP", sets: [{ weight: 40, reps: 10 }] },
              ],
            },
          },
        ],
      },
    );

    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.dateKey).toBe("2026-06-23");
    expect(summaries[0]?.workouts).toHaveLength(1);
    expect(summaries[0]?.workouts[0]?.exercises).toEqual([
      "Bench Press",
      "OHP",
    ]);
    expect(summaries[0]?.foodNames).toEqual(["Chicken bowl"]);
    expect(summaries[0]?.food).toEqual({
      calories: 620,
      proteinG: 45,
      carbsG: 60,
      fatG: 12,
    });
  });

  it("omits days with only uncompleted planned meals", () => {
    const data = createDefaultAppData();

    const summaries = buildActivityDaySummaries(
      data,
      {
        "2026-06-24": [
          {
            id: "planned",
            name: "Planned shake",
            calories: 300,
            proteinG: 30,
            carbsG: 10,
            fatG: 5,
            loggedAt: "2026-06-24T08:00:00.000Z",
            fromPlan: true,
            completed: false,
          },
        ],
      },
      {},
    );

    expect(summaries).toHaveLength(0);
  });
});

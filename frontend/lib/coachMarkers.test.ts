import { describe, expect, it } from "vitest";
import {
  parseGymPlan,
  parseWorkoutChange,
  stripWorkoutChangeMarker,
} from "@/lib/coachWorkout";
import { parseDietPlan, stripDietPlanMarker } from "@/lib/coachDiet";

describe("parseWorkoutChange", () => {
  it("parses a replace marker embedded in chat text", () => {
    const content =
      'Sure, swapping it. [[WORKOUT_CHANGE:{"action":"replace","workoutId":"push","fromExercise":"Bench","toExercise":"Incline Press"}]]';
    const change = parseWorkoutChange(content);
    expect(change).not.toBeNull();
    expect(change?.action).toBe("replace");
    expect(change?.workoutId).toBe("push");
  });

  it("returns null when no marker present", () => {
    expect(parseWorkoutChange("just chatting, no marker")).toBeNull();
  });

  it("returns null on malformed JSON", () => {
    expect(
      parseWorkoutChange('[[WORKOUT_CHANGE:{not valid json}]]'),
    ).toBeNull();
  });
});

describe("stripWorkoutChangeMarker", () => {
  it("removes the marker line from user-facing text", () => {
    const content =
      'Done! [[WORKOUT_CHANGE:{"action":"add","workoutId":"pull","exercise":"Row"}]]';
    expect(stripWorkoutChangeMarker(content)).not.toContain("WORKOUT_CHANGE");
    expect(stripWorkoutChangeMarker(content)).toContain("Done!");
  });
});

describe("parseGymPlan", () => {
  it("parses a full plan marker", () => {
    const content =
      '[[GYM_PLAN:{"days":[{"name":"Push Day","exercises":[{"name":"Bench Press","sets":3,"reps":8,"restSeconds":90}]}]}]]';
    const plan = parseGymPlan(content);
    expect(plan?.days).toHaveLength(1);
    expect(plan?.days[0].name).toBe("Push Day");
    expect(plan?.days[0].exercises[0].name).toBe("Bench Press");
  });
});

describe("parseDietPlan", () => {
  it("parses a diet plan marker", () => {
    const content =
      'Here you go. [[DIET_PLAN:{"meals":[{"name":"Oats","mealSlot":"breakfast","calories":400,"proteinG":35,"carbsG":40,"fatG":10}]}]]';
    const plan = parseDietPlan(content);
    expect(plan?.meals).toHaveLength(1);
    expect(plan?.meals[0].name).toBe("Oats");
    expect(plan?.meals[0].mealSlot).toBe("breakfast");
  });

  it("returns null without a marker", () => {
    expect(parseDietPlan("no plan here")).toBeNull();
  });

  it("strips the diet marker from display text", () => {
    const content =
      'Enjoy! [[DIET_PLAN:{"meals":[{"name":"Oats","calories":400,"proteinG":35,"carbsG":40,"fatG":10}]}]]';
    expect(stripDietPlanMarker(content)).toBe("Enjoy!");
  });
});

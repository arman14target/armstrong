import { toPayload } from "./plan.mapper";

// Builds a normalized user row (the shape PLAN_USER_INCLUDE produces) so we can
// assert that toPayload reconstructs the wire payload correctly.
function buildUser() {
  const builtin = (type: string, moves: unknown[] = []) => ({
    type,
    lastCompletedAt: null,
    lastSessionDurationSeconds: null,
    moves,
  });

  return {
    id: "u1",
    meta: {
      coachPlanActive: true,
      workoutSetupSeen: { push: true },
      nutritionProfile: null,
    },
    builtinWorkouts: [
      builtin("push", [
        {
          clientId: "m1",
          name: "Bench",
          position: 0,
          sets: [
            {
              clientId: "s1",
              restSeconds: 90,
              lastWeight: 60,
              lastReps: 8,
              position: 0,
            },
          ],
        },
      ]),
      builtin("leg"),
      builtin("abs"),
      builtin("pull"),
    ],
    customWorkouts: [],
    activeSession: null,
    completionDates: [{ date: "2026-06-18" }],
    dayEntries: [],
    foodEntries: [],
    chatMessages: [
      {
        kind: "coach",
        clientId: "cc1",
        role: "user",
        content: "hi coach",
        createdAt: new Date("2026-06-19T00:00:00.000Z"),
        position: 0,
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("toPayload", () => {
  it("reconstructs builtin workouts with moves and sets", () => {
    const payload = toPayload(buildUser());
    const push = payload.appData.workouts.push;
    expect(push.moves).toHaveLength(1);
    expect(push.moves[0].name).toBe("Bench");
    expect(push.moves[0].sets[0]).toEqual({
      id: "s1",
      restSeconds: 90,
      lastWeight: 60,
      lastReps: 8,
    });
  });

  it("leaves empty builtin days empty", () => {
    expect(toPayload(buildUser()).appData.workouts.leg.moves).toEqual([]);
  });

  it("carries plan-meta flags and completion dates", () => {
    const appData = toPayload(buildUser()).appData;
    expect(appData.coachPlanActive).toBe(true);
    expect(appData.workoutSetupSeen).toEqual({ push: true });
    expect(appData.workoutCompletionDates).toEqual(["2026-06-18"]);
  });

  it("splits chat history by kind", () => {
    const payload = toPayload(buildUser());
    expect(payload.coachChat).toHaveLength(1);
    expect(payload.coachChat[0].content).toBe("hi coach");
    expect(payload.onboardingChat).toHaveLength(0);
  });
});

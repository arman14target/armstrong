import { Prisma, BuiltinWorkoutType, ChatKind } from "@prisma/client";
import {
  AppData,
  ChatMessage,
  Move,
  UserPlanPayload,
  WORKOUT_TYPES,
  WorkoutTemplate,
  WorkoutType,
} from "./plan.types";

type Tx = Prisma.TransactionClient;

function nutritionProfileInput(
  appData: AppData,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return appData.nutritionProfile
    ? (appData.nutritionProfile as unknown as Prisma.InputJsonValue)
    : Prisma.JsonNull;
}

function toDate(value: string | undefined | null): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function nestedMoves(moves: Move[]): Prisma.MoveCreateWithoutBuiltinWorkoutInput[] {
  return moves.map((move, moveIndex) => ({
    clientId: move.id,
    name: move.name,
    position: moveIndex,
    sets: {
      create: move.sets.map((set, setIndex) => ({
        clientId: set.id,
        restSeconds: set.restSeconds,
        lastWeight: set.lastWeight ?? null,
        lastReps: set.lastReps ?? null,
        position: setIndex,
      })),
    },
  }));
}

// ---------------------------------------------------------------------------
// Write: payload -> normalized tables (whole-blob replace inside a transaction)
// ---------------------------------------------------------------------------

export async function writePayload(
  tx: Tx,
  userId: string,
  payload: UserPlanPayload,
): Promise<void> {
  const { appData } = payload;

  await tx.planMeta.upsert({
    where: { userId },
    create: {
      userId,
      coachPlanActive: appData.coachPlanActive ?? false,
      workoutSetupSeen: (appData.workoutSetupSeen ?? {}) as Prisma.InputJsonValue,
      nutritionProfile: nutritionProfileInput(appData),
    },
    update: {
      coachPlanActive: appData.coachPlanActive ?? false,
      workoutSetupSeen: (appData.workoutSetupSeen ?? {}) as Prisma.InputJsonValue,
      nutritionProfile: nutritionProfileInput(appData),
    },
  });

  // Builtin split days — cascade-delete then recreate the four rows.
  await tx.builtinWorkout.deleteMany({ where: { userId } });
  for (const type of WORKOUT_TYPES) {
    const template: WorkoutTemplate = appData.workouts[type] ?? { moves: [] };
    await tx.builtinWorkout.create({
      data: {
        userId,
        type: type as BuiltinWorkoutType,
        lastCompletedAt: toDate(template.lastCompletedAt),
        lastSessionDurationSeconds:
          template.lastSessionDurationSeconds ?? null,
        moves: { create: nestedMoves(template.moves ?? []) },
      },
    });
  }

  // Custom days.
  await tx.customWorkout.deleteMany({ where: { userId } });
  const customWorkouts = appData.customWorkouts ?? [];
  for (let i = 0; i < customWorkouts.length; i += 1) {
    const day = customWorkouts[i];
    await tx.customWorkout.create({
      data: {
        userId,
        clientId: day.id,
        name: day.name,
        theme: day.theme ?? null,
        sticker: day.sticker ?? null,
        position: i,
        lastCompletedAt: toDate(day.lastCompletedAt),
        lastSessionDurationSeconds: day.lastSessionDurationSeconds ?? null,
        moves: { create: nestedMoves(day.moves ?? []) },
      },
    });
  }

  // Active session (at most one).
  await tx.activeSession.deleteMany({ where: { userId } });
  if (appData.activeSession) {
    const session = appData.activeSession;
    await tx.activeSession.create({
      data: {
        userId,
        workoutType: session.workoutType,
        startedAt: toDate(session.startedAt) ?? new Date(),
        setWeights: session.setWeights ?? {},
        setReps: session.setReps ?? {},
        completedSetIds: session.completedSetIds ?? [],
        activeRestSetId: session.activeRestSetId ?? null,
        restEndsAt: toDate(session.restEndsAt),
        baselineWorkout:
          (session.baselineWorkout as unknown as Prisma.InputJsonValue) ?? {},
      },
    });
  }

  // Completion dates.
  await tx.completionDate.deleteMany({ where: { userId } });
  const dates = [...new Set(appData.workoutCompletionDates ?? [])];
  if (dates.length > 0) {
    await tx.completionDate.createMany({
      data: dates.map((date) => ({ userId, date })),
      skipDuplicates: true,
    });
  }

  // Workout day log (date -> entries).
  await tx.workoutDayEntry.deleteMany({ where: { userId } });
  const dayEntryRows: Prisma.WorkoutDayEntryCreateManyInput[] = [];
  for (const [dateKey, entries] of Object.entries(
    appData.workoutDayLog ?? {},
  )) {
    for (const entry of entries) {
      dayEntryRows.push({
        userId,
        dateKey,
        workoutId: entry.workoutId,
        completedAt: toDate(entry.completedAt) ?? new Date(),
        durationSeconds: entry.durationSeconds ?? null,
      });
    }
  }
  if (dayEntryRows.length > 0) {
    await tx.workoutDayEntry.createMany({ data: dayEntryRows });
  }

  // Food log (date -> entries).
  await tx.foodEntry.deleteMany({ where: { userId } });
  const foodRows: Prisma.FoodEntryCreateManyInput[] = [];
  for (const [dateKey, entries] of Object.entries(appData.foodLog ?? {})) {
    for (const entry of entries) {
      foodRows.push({
        userId,
        clientId: entry.id,
        dateKey,
        name: entry.name,
        calories: entry.calories,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatG: entry.fatG,
        loggedAt: toDate(entry.loggedAt) ?? new Date(),
        fromPlan: entry.fromPlan ?? false,
        completed: entry.completed ?? null,
        mealSlot: entry.mealSlot ?? null,
      });
    }
  }
  if (foodRows.length > 0) {
    await tx.foodEntry.createMany({ data: foodRows });
  }

  // Chat history (coach + onboarding).
  await tx.chatMessage.deleteMany({ where: { userId } });
  const chatRows: Prisma.ChatMessageCreateManyInput[] = [
    ...chatRowsFor(userId, ChatKind.coach, payload.coachChat),
    ...chatRowsFor(userId, ChatKind.onboarding, payload.onboardingChat),
  ];
  if (chatRows.length > 0) {
    await tx.chatMessage.createMany({ data: chatRows });
  }
}

function chatRowsFor(
  userId: string,
  kind: ChatKind,
  messages: ChatMessage[] | undefined,
): Prisma.ChatMessageCreateManyInput[] {
  return (messages ?? []).map((message, index) => ({
    userId,
    kind,
    clientId: message.id,
    role: message.role,
    content: message.content,
    createdAt: toDate(message.createdAt) ?? new Date(),
    position: index,
  }));
}

// ---------------------------------------------------------------------------
// Read: normalized tables -> payload
// ---------------------------------------------------------------------------

const userInclude = {
  meta: true,
  builtinWorkouts: { include: { moves: { include: { sets: true } } } },
  customWorkouts: { include: { moves: { include: { sets: true } } } },
  activeSession: true,
  completionDates: true,
  dayEntries: true,
  foodEntries: true,
  chatMessages: true,
} satisfies Prisma.UserInclude;

type UserWithPlan = Prisma.UserGetPayload<{ include: typeof userInclude }>;

type DbMove = UserWithPlan["builtinWorkouts"][number]["moves"][number];

function buildMoves(moves: DbMove[]): Move[] {
  return [...moves]
    .sort((a, b) => a.position - b.position)
    .map((move) => ({
      id: move.clientId,
      name: move.name,
      sets: [...move.sets]
        .sort((a, b) => a.position - b.position)
        .map((set) => ({
          id: set.clientId,
          restSeconds: set.restSeconds,
          ...(set.lastWeight != null ? { lastWeight: set.lastWeight } : {}),
          ...(set.lastReps != null ? { lastReps: set.lastReps } : {}),
        })),
    }));
}

export function toPayload(user: UserWithPlan): UserPlanPayload {
  const workouts = {} as AppData["workouts"];
  for (const type of WORKOUT_TYPES) {
    const row = user.builtinWorkouts.find((w) => w.type === type);
    workouts[type] = {
      moves: row ? buildMoves(row.moves) : [],
      ...(row?.lastCompletedAt
        ? { lastCompletedAt: row.lastCompletedAt.toISOString() }
        : {}),
      ...(row?.lastSessionDurationSeconds != null
        ? { lastSessionDurationSeconds: row.lastSessionDurationSeconds }
        : {}),
    };
  }

  const customWorkouts = [...user.customWorkouts]
    .sort((a, b) => a.position - b.position)
    .map((day) => ({
      id: day.clientId,
      name: day.name,
      ...(day.theme ? { theme: day.theme as WorkoutType } : {}),
      ...(day.sticker ? { sticker: day.sticker } : {}),
      moves: buildMoves(day.moves),
      ...(day.lastCompletedAt
        ? { lastCompletedAt: day.lastCompletedAt.toISOString() }
        : {}),
      ...(day.lastSessionDurationSeconds != null
        ? { lastSessionDurationSeconds: day.lastSessionDurationSeconds }
        : {}),
    }));

  const activeSession = user.activeSession
    ? {
        workoutType: user.activeSession.workoutType,
        startedAt: user.activeSession.startedAt.toISOString(),
        setWeights: user.activeSession.setWeights as Record<string, number>,
        setReps: user.activeSession.setReps as Record<string, number>,
        completedSetIds: user.activeSession.completedSetIds,
        ...(user.activeSession.activeRestSetId
          ? { activeRestSetId: user.activeSession.activeRestSetId }
          : {}),
        ...(user.activeSession.restEndsAt
          ? { restEndsAt: user.activeSession.restEndsAt.toISOString() }
          : {}),
        baselineWorkout:
          user.activeSession.baselineWorkout as unknown as WorkoutTemplate,
      }
    : null;

  const workoutDayLog: NonNullable<AppData["workoutDayLog"]> = {};
  for (const entry of user.dayEntries) {
    const list = workoutDayLog[entry.dateKey] ?? [];
    list.push({
      workoutId: entry.workoutId,
      completedAt: entry.completedAt.toISOString(),
      ...(entry.durationSeconds != null
        ? { durationSeconds: entry.durationSeconds }
        : {}),
    });
    workoutDayLog[entry.dateKey] = list;
  }

  const foodLog: NonNullable<AppData["foodLog"]> = {};
  for (const entry of user.foodEntries) {
    const list = foodLog[entry.dateKey] ?? [];
    list.push({
      id: entry.clientId,
      name: entry.name,
      calories: entry.calories,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatG: entry.fatG,
      loggedAt: entry.loggedAt.toISOString(),
      ...(entry.fromPlan ? { fromPlan: entry.fromPlan } : {}),
      ...(entry.completed != null ? { completed: entry.completed } : {}),
      ...(entry.mealSlot ? { mealSlot: entry.mealSlot } : {}),
    });
    foodLog[entry.dateKey] = list;
  }

  const appData: AppData = {
    workouts,
    customWorkouts,
    activeSession,
    workoutSetupSeen: (user.meta?.workoutSetupSeen as Record<string, boolean>) ?? {},
    workoutCompletionDates: user.completionDates.map((d) => d.date),
    workoutDayLog,
    foodLog,
    coachPlanActive: user.meta?.coachPlanActive ?? false,
    ...(user.meta?.nutritionProfile
      ? { nutritionProfile: user.meta.nutritionProfile as unknown as AppData["nutritionProfile"] }
      : {}),
  };

  return {
    appData,
    coachChat: buildChat(user.chatMessages, ChatKind.coach),
    onboardingChat: buildChat(user.chatMessages, ChatKind.onboarding),
  };
}

function buildChat(
  messages: UserWithPlan["chatMessages"],
  kind: ChatKind,
): ChatMessage[] {
  return messages
    .filter((message) => message.kind === kind)
    .sort((a, b) => a.position - b.position)
    .map((message) => ({
      id: message.clientId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    }));
}

export const PLAN_USER_INCLUDE = userInclude;

import type { CoachChatMessage } from "@/lib/gemini";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  clearCoachChatMessages,
  loadCoachChatMessages,
  saveCoachChatMessages,
} from "@/lib/coachChatStorage";
import {
  clearOnboardingMessages,
  loadOnboardingMessages,
  saveOnboardingMessages,
} from "@/lib/onboardingStorage";
import { loadAppData, saveAppData } from "@/lib/storage";
import {
  AppData,
  CustomWorkoutDay,
  WORKOUT_TYPES,
  WorkoutDayEntry,
  WorkoutTemplate,
  createDefaultAppData,
} from "@/lib/types";

export interface UserPlanPayload {
  appData: AppData;
  coachChat: CoachChatMessage[];
  onboardingChat: CoachChatMessage[];
}

function parseUserPlanPayload(raw: unknown): UserPlanPayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Partial<UserPlanPayload>;
  if (!record.appData || typeof record.appData !== "object") {
    return null;
  }

  return {
    appData: record.appData as AppData,
    coachChat: Array.isArray(record.coachChat) ? record.coachChat : [],
    onboardingChat: Array.isArray(record.onboardingChat)
      ? record.onboardingChat
      : [],
  };
}

export function buildLocalUserPlanPayload(): UserPlanPayload {
  return {
    appData: loadAppData(),
    coachChat: loadCoachChatMessages(),
    onboardingChat: loadOnboardingMessages(),
  };
}

export function applyUserPlanPayload(payload: UserPlanPayload): AppData {
  saveAppData(payload.appData);
  saveCoachChatMessages(payload.coachChat);
  saveOnboardingMessages(payload.onboardingChat);
  return payload.appData;
}

export async function fetchUserPlan(
  userId: string,
): Promise<UserPlanPayload | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("user_plans")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.data) {
    return null;
  }

  return parseUserPlanPayload(data.data);
}

export async function saveUserPlan(
  userId: string,
  payload: UserPlanPayload,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("user_plans").upsert(
    {
      user_id: userId,
      data: payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
}

export async function deleteUserPlan(userId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("user_plans")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

function workoutCompletedAtTime(template: WorkoutTemplate | undefined): number {
  if (!template?.lastCompletedAt) {
    return 0;
  }

  return new Date(template.lastCompletedAt).getTime();
}

function pickNewerWorkoutTemplate(
  remote: WorkoutTemplate,
  local: WorkoutTemplate,
): WorkoutTemplate {
  return workoutCompletedAtTime(local) >= workoutCompletedAtTime(remote)
    ? local
    : remote;
}

function pickNewerCustomWorkout(
  remote: CustomWorkoutDay,
  local: CustomWorkoutDay,
): CustomWorkoutDay {
  return workoutCompletedAtTime(local) >= workoutCompletedAtTime(remote)
    ? local
    : remote;
}

function mergeCompletionDates(
  remote: string[] | undefined,
  local: string[] | undefined,
): string[] {
  return [...new Set([...(remote ?? []), ...(local ?? [])])];
}

function mergeWorkoutDayLogs(
  remote: Record<string, WorkoutDayEntry[]> | undefined,
  local: Record<string, WorkoutDayEntry[]> | undefined,
): Record<string, WorkoutDayEntry[]> {
  const merged: Record<string, WorkoutDayEntry[]> = { ...(remote ?? {}) };

  for (const [dateKey, entries] of Object.entries(local ?? {})) {
    const existing = merged[dateKey] ?? [];
    const seen = new Set(
      existing.map((entry) => `${entry.workoutId}:${entry.completedAt}`),
    );
    const added = entries.filter(
      (entry) => !seen.has(`${entry.workoutId}:${entry.completedAt}`),
    );

    if (added.length > 0) {
      merged[dateKey] = [...existing, ...added];
    }
  }

  return merged;
}

export function mergeAppDataOnSync(remote: AppData, local: AppData): AppData {
  const workouts = { ...remote.workouts };
  for (const type of WORKOUT_TYPES) {
    workouts[type] = pickNewerWorkoutTemplate(
      remote.workouts[type],
      local.workouts[type],
    );
  }

  const customById = new Map(
    remote.customWorkouts.map((workout) => [workout.id, workout]),
  );

  for (const localWorkout of local.customWorkouts) {
    const remoteWorkout = customById.get(localWorkout.id);
    customById.set(
      localWorkout.id,
      remoteWorkout
        ? pickNewerCustomWorkout(remoteWorkout, localWorkout)
        : localWorkout,
    );
  }

  return {
    ...remote,
    workouts,
    customWorkouts: [...customById.values()],
    workoutCompletionDates: mergeCompletionDates(
      remote.workoutCompletionDates,
      local.workoutCompletionDates,
    ),
    workoutDayLog: mergeWorkoutDayLogs(remote.workoutDayLog, local.workoutDayLog),
    workoutSetupSeen: {
      ...remote.workoutSetupSeen,
      ...local.workoutSetupSeen,
    },
    activeSession: local.activeSession ?? remote.activeSession,
    nutritionProfile: local.nutritionProfile ?? remote.nutritionProfile,
    foodLog: {
      ...remote.foodLog,
      ...local.foodLog,
    },
    coachPlanActive: remote.coachPlanActive ?? local.coachPlanActive,
  };
}

export async function syncUserPlanOnLogin(userId: string): Promise<AppData> {
  const localPayload = buildLocalUserPlanPayload();
  const remotePayload = await fetchUserPlan(userId);

  if (remotePayload) {
    const mergedPayload: UserPlanPayload = {
      ...remotePayload,
      appData: mergeAppDataOnSync(remotePayload.appData, localPayload.appData),
    };
    const appData = applyUserPlanPayload(mergedPayload);
    await saveUserPlan(userId, mergedPayload);
    return appData;
  }

  await saveUserPlan(userId, localPayload);
  return localPayload.appData;
}

export async function clearUserPlanEverywhere(userId: string): Promise<void> {
  clearCoachChatMessages();
  clearOnboardingMessages();
  saveAppData(createDefaultAppData());
  await deleteUserPlan(userId);
}

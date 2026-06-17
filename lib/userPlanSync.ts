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
import { AppData, createDefaultAppData } from "@/lib/types";

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

export async function syncUserPlanOnLogin(userId: string): Promise<AppData> {
  const localPayload = buildLocalUserPlanPayload();
  const remotePayload = await fetchUserPlan(userId);

  if (remotePayload) {
    return applyUserPlanPayload(remotePayload);
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

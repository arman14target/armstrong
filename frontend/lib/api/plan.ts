import type { UserPlanPayload } from "@/lib/userPlanSync";
import { apiFetch } from "./client";

export async function apiFetchPlan(): Promise<UserPlanPayload | null> {
  const result = await apiFetch<{ plan: UserPlanPayload | null }>("/plan", {
    auth: true,
  });
  return result.plan;
}

export async function apiSavePlan(payload: UserPlanPayload): Promise<void> {
  await apiFetch<void>("/plan", {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export async function apiDeletePlan(): Promise<void> {
  await apiFetch<void>("/plan", {
    method: "DELETE",
    auth: true,
  });
}

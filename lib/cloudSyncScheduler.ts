import { buildLocalUserPlanPayload, saveUserPlan } from "@/lib/userPlanSync";

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let activeUserId: string | null = null;

export function setCloudSyncUserId(userId: string | null): void {
  activeUserId = userId;
}

export function scheduleCloudSync(): void {
  if (!activeUserId) {
    return;
  }

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    if (!activeUserId) {
      return;
    }

    saveUserPlan(activeUserId, buildLocalUserPlanPayload()).catch(() => {});
  }, 800);
}

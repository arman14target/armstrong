import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock every side-effecting dependency so detect/resolve run as pure logic.
vi.mock("@/lib/api/plan", () => ({
  apiFetchPlan: vi.fn(),
  apiSavePlan: vi.fn(),
  apiDeletePlan: vi.fn(),
}));
vi.mock("@/lib/storage", () => ({
  loadAppData: vi.fn(),
  saveAppData: vi.fn(),
}));
vi.mock("@/lib/coachChatStorage", () => ({
  loadCoachChatMessages: vi.fn(() => []),
  saveCoachChatMessages: vi.fn(),
  clearCoachChatMessages: vi.fn(),
}));
vi.mock("@/lib/onboardingStorage", () => ({
  loadOnboardingMessages: vi.fn(() => []),
  saveOnboardingMessages: vi.fn(),
  clearOnboardingMessages: vi.fn(),
}));
vi.mock("@/lib/localSaveReminder", () => ({
  hasLocalOnlyChanges: vi.fn(),
}));

import { apiFetchPlan, apiSavePlan } from "@/lib/api/plan";
import { loadAppData } from "@/lib/storage";
import { hasLocalOnlyChanges } from "@/lib/localSaveReminder";
import {
  detectSyncConflict,
  resolveSyncConflict,
  type SyncConflict,
  type UserPlanPayload,
} from "@/lib/userPlanSync";
import { createDefaultAppData, type AppData } from "@/lib/types";

const fetchPlan = vi.mocked(apiFetchPlan);
const savePlan = vi.mocked(apiSavePlan);
const localData = vi.mocked(loadAppData);
const localChanges = vi.mocked(hasLocalOnlyChanges);

function appDataWith(partial: Partial<AppData>): AppData {
  return { ...createDefaultAppData(), ...partial };
}

function payloadWith(partial: Partial<AppData>): UserPlanPayload {
  return { appData: appDataWith(partial), coachChat: [], onboardingChat: [] };
}

const LOCAL = appDataWith({
  customWorkouts: [{ id: "local-day", name: "Local", moves: [] }],
});
const REMOTE = appDataWith({
  customWorkouts: [{ id: "remote-day", name: "Remote", moves: [] }],
});

beforeEach(() => {
  vi.clearAllMocks();
  localData.mockReturnValue(LOCAL);
});

describe("detectSyncConflict", () => {
  it("pushes local when the account has no plan", async () => {
    fetchPlan.mockResolvedValue(null);
    localChanges.mockReturnValue(true);

    const result = await detectSyncConflict("u1");

    expect(result.kind).toBe("resolved");
    expect(savePlan).toHaveBeenCalledOnce();
    if (result.kind === "resolved") {
      expect(result.appData.customWorkouts[0]?.name).toBe("Local");
    }
  });

  it("pushes local when the account plan is an empty default", async () => {
    fetchPlan.mockResolvedValue({
      appData: createDefaultAppData(),
      coachChat: [],
      onboardingChat: [],
    });
    localChanges.mockReturnValue(true);

    const result = await detectSyncConflict("u1");

    expect(result.kind).toBe("resolved");
    expect(savePlan).toHaveBeenCalledOnce();
    if (result.kind === "resolved") {
      expect(result.appData.customWorkouts[0]?.name).toBe("Local");
    }
  });

  it("pulls the account plan when the device has no unsaved changes", async () => {
    fetchPlan.mockResolvedValue(payloadWith(REMOTE));
    localChanges.mockReturnValue(false);

    const result = await detectSyncConflict("u1");

    expect(result.kind).toBe("resolved");
    expect(savePlan).not.toHaveBeenCalled();
    if (result.kind === "resolved") {
      expect(result.appData.customWorkouts[0]?.name).toBe("Remote");
    }
  });

  it("reports a conflict when both device and account have data", async () => {
    fetchPlan.mockResolvedValue(payloadWith(REMOTE));
    localChanges.mockReturnValue(true);

    const result = await detectSyncConflict("u1");

    expect(result.kind).toBe("conflict");
    expect(savePlan).not.toHaveBeenCalled();
    if (result.kind === "conflict") {
      expect(result.conflict.userId).toBe("u1");
      expect(result.conflict.local.appData.customWorkouts[0]?.name).toBe("Local");
      expect(result.conflict.remote.appData.customWorkouts[0]?.name).toBe("Remote");
    }
  });
});

describe("resolveSyncConflict", () => {
  const conflict: SyncConflict = {
    userId: "u1",
    remote: payloadWith(REMOTE),
    local: payloadWith(LOCAL),
  };

  it("merge keeps both sides' workouts and saves to the backend", async () => {
    const appData = await resolveSyncConflict(conflict, "merge");

    const names = appData.customWorkouts.map((w) => w.name).sort();
    expect(names).toEqual(["Local", "Remote"]);
    expect(savePlan).toHaveBeenCalledOnce();
  });

  it("use-remote adopts the account plan and saves it", async () => {
    const appData = await resolveSyncConflict(conflict, "use-remote");

    expect(appData.customWorkouts.map((w) => w.name)).toEqual(["Remote"]);
    expect(savePlan).toHaveBeenCalledOnce();
  });

  it("use-local keeps the device plan and saves it", async () => {
    const appData = await resolveSyncConflict(conflict, "use-local");

    expect(appData.customWorkouts.map((w) => w.name)).toEqual(["Local"]);
    expect(savePlan).toHaveBeenCalledOnce();
  });
});

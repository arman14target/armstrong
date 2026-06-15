import { AppData, createDefaultAppData } from "./types";
import { THEME_STORAGE_KEY } from "./theme";
import { collectLegacyCompletionDates } from "./workouts";

export const STORAGE_KEY = "armstrong-gym-v1";

export function loadAppData(): AppData {
  if (typeof window === "undefined") {
    return createDefaultAppData();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultAppData();
    }
    const parsed = JSON.parse(raw) as AppData;
    return {
      ...createDefaultAppData(),
      ...parsed,
      workouts: {
        ...createDefaultAppData().workouts,
        ...parsed.workouts,
      },
      customWorkouts: parsed.customWorkouts ?? [],
      workoutCompletionDates:
        parsed.workoutCompletionDates ?? collectLegacyCompletionDates(parsed),
    };
  } catch {
    return createDefaultAppData();
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearCookies(): void {
  document.cookie.split(";").forEach((entry) => {
    const trimmed = entry.trim();
    const eq = trimmed.indexOf("=");
    const name = eq > -1 ? trimmed.slice(0, eq) : trimmed;
    if (!name) {
      return;
    }

    const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = `${name}=;${expires};path=/`;
    document.cookie = `${name}=;${expires};path=/;domain=${window.location.hostname}`;
  });
}

export async function clearAllAppData(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.clear();
  clearCookies();

  if (savedTheme) {
    localStorage.setItem(THEME_STORAGE_KEY, savedTheme);
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

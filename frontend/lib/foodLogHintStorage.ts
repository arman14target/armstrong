const STORAGE_KEY = "armstrong-food-log-calories-hint-v1";

export function isFoodLogCaloriesHintSeen(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markFoodLogCaloriesHintSeen(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, "1");
}

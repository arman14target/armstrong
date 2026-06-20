import { isApiConfigured } from "@/lib/api/client";

export const LOCAL_ONLY_CHANGES_KEY = "armstrong-local-only-changes";
export const LOCAL_SAVE_REMINDER_DISMISS_KEY = "armstrong-local-save-dismissed";
export const LOCAL_SAVE_REMINDER_EVENT = "armstrong-local-save";
export const OPEN_PROFILE_SIGNUP_EVENT = "armstrong-open-profile-signup";

export function hasLocalOnlyChanges(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(LOCAL_ONLY_CHANGES_KEY) === "1";
}

export function isLocalSaveReminderDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(LOCAL_SAVE_REMINDER_DISMISS_KEY) === "1";
}

export function dismissLocalSaveReminderForSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(LOCAL_SAVE_REMINDER_DISMISS_KEY, "1");
  window.dispatchEvent(new Event(LOCAL_SAVE_REMINDER_EVENT));
}

export function requestProfileSignup(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(OPEN_PROFILE_SIGNUP_EVENT));
}

export function markLocalOnlySave(): void {
  if (typeof window === "undefined" || !isApiConfigured()) {
    return;
  }

  sessionStorage.removeItem(LOCAL_SAVE_REMINDER_DISMISS_KEY);
  localStorage.setItem(LOCAL_ONLY_CHANGES_KEY, "1");
  window.dispatchEvent(new Event(LOCAL_SAVE_REMINDER_EVENT));
}

export function clearLocalOnlyChanges(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(LOCAL_ONLY_CHANGES_KEY);
  window.dispatchEvent(new Event(LOCAL_SAVE_REMINDER_EVENT));
}

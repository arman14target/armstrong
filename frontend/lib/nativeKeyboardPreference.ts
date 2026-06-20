const STORAGE_KEY = "armstrong-native-keyboard";

export function readNativeKeyboardPreference(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function writeNativeKeyboardPreference(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  if (enabled) {
    window.localStorage.setItem(STORAGE_KEY, "1");
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

import { withBasePath } from "@/lib/basePath";

let restNotificationTimeout: ReturnType<typeof setTimeout> | null = null;
let lastNotifiedRestEnd: string | null = null;

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function shouldShowRestNotification(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const isMobile = window.matchMedia("(pointer: coarse)").matches;
  return isMobile || document.hidden;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return "denied";
  }

  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

export async function showRestNotification(body: string): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  const options = {
    body,
    icon: withBasePath("/icons/icon-192.png"),
    badge: withBasePath("/icons/icon-192.png"),
    tag: "armstrong-rest",
    renotify: true,
    vibrate: [200, 100, 200],
  } as NotificationOptions;

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Rest complete!", options);
      return;
    }
  } catch {
    // Fall through to the Notification constructor.
  }

  new Notification("Rest complete!", options);
}

export function notifyRestComplete(endsAt: string, body: string): void {
  if (lastNotifiedRestEnd === endsAt || !shouldShowRestNotification()) {
    return;
  }

  lastNotifiedRestEnd = endsAt;
  void showRestNotification(body);
}

export function scheduleRestNotification(endsAt: string, body: string): void {
  cancelRestNotification();
  lastNotifiedRestEnd = null;

  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) {
    return;
  }

  restNotificationTimeout = setTimeout(() => {
    restNotificationTimeout = null;
    notifyRestComplete(endsAt, body);
  }, ms);
}

export function cancelRestNotification(): void {
  if (restNotificationTimeout) {
    clearTimeout(restNotificationTimeout);
    restNotificationTimeout = null;
  }
}

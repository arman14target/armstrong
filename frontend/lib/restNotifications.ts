import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { withBasePath } from "@/lib/basePath";

const REST_NOTIFICATION_ID = 9001;
const REST_NOTIFICATION_SOUND = "rest-alert.wav";

const NATIVE_REST_NOTIFICATION_ALERT = {
  sound: REST_NOTIFICATION_SOUND,
  interruptionLevel: "active" as const,
};

let restNotificationTimeout: ReturnType<typeof setTimeout> | null = null;
let lastNotifiedRestEnd: string | null = null;

export type NotificationPermissionState = "default" | "granted" | "denied";

function isNativeNotifications(): boolean {
  return Capacitor.isNativePlatform();
}

export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return isNativeNotifications() || "Notification" in window;
}

export function shouldShowRestNotification(): boolean {
  if (isNativeNotifications()) {
    return false;
  }

  if (typeof window === "undefined") {
    return false;
  }

  const isMobile = window.matchMedia("(pointer: coarse)").matches;
  return isMobile || document.hidden;
}

export async function getNotificationPermission(): Promise<NotificationPermissionState> {
  if (isNativeNotifications()) {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") {
      return "granted";
    }
    if (status.display === "denied") {
      return "denied";
    }
    return "default";
  }

  if (!isNotificationSupported()) {
    return "denied";
  }

  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (isNativeNotifications()) {
    const status = await LocalNotifications.requestPermissions();
    if (status.display === "granted") {
      return "granted";
    }
    if (status.display === "denied") {
      return "denied";
    }
    return "default";
  }

  if (!isNotificationSupported()) {
    return "denied";
  }

  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

async function cancelNativeRestNotification(): Promise<void> {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: REST_NOTIFICATION_ID }],
    });
  } catch {
    // Native plugin unavailable or notification already delivered.
  }
}

async function scheduleNativeRestNotification(
  endsAt: string,
  body: string,
): Promise<void> {
  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") {
    return;
  }

  const at = new Date(endsAt);
  if (at.getTime() <= Date.now()) {
    return;
  }

  await cancelNativeRestNotification();

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REST_NOTIFICATION_ID,
          title: "Rest complete!",
          body,
          ...NATIVE_REST_NOTIFICATION_ALERT,
          schedule: { at, allowWhileIdle: true },
        },
      ],
    });
  } catch (error) {
    console.warn("[restNotifications] Failed to schedule native notification:", error);
  }
}

export async function showRestNotification(body: string): Promise<void> {
  if (!isNotificationSupported()) {
    return;
  }

  if (isNativeNotifications()) {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") {
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: REST_NOTIFICATION_ID,
          title: "Rest complete!",
          body,
          ...NATIVE_REST_NOTIFICATION_ALERT,
        },
      ],
    });
    return;
  }

  if (Notification.permission !== "granted") {
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

  if (isNativeNotifications()) {
    void scheduleNativeRestNotification(endsAt, body);
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

  if (isNativeNotifications()) {
    void cancelNativeRestNotification();
  }
}

"use client";

import { useEffect, useState } from "react";
import {
  isNotificationSupported,
  requestNotificationPermission,
} from "@/lib/restNotifications";

const DISMISS_KEY = "armstrong-rest-notifications-dismissed";

function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(pointer: coarse)").matches;
}

export function RestNotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported() || !isMobileDevice()) {
      return;
    }

    if (Notification.permission !== "default") {
      return;
    }

    if (localStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }

    setVisible(true);
  }, []);

  const handleEnable = async () => {
    setRequesting(true);
    try {
      await requestNotificationPermission();
    } finally {
      setRequesting(false);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="mb-[var(--space-gap-md)] rounded-cyber border border-cyan/30 bg-cyan/5 p-[var(--space-panel)]">
      <p className="text-sm text-heading">Get notified when rest is over</p>
      <p className="mt-1 text-xs text-dim">
        Enable notifications so Armstrong can alert you on your phone even when
        the app is in the background.
      </p>
      <div className="mt-[var(--space-gap)] inline-gap">
        <button
          type="button"
          onClick={handleEnable}
          disabled={requesting}
          className="cyber-btn--cyan min-h-10 rounded-cyber border px-[var(--space-inline)] text-xs disabled:opacity-60"
        >
          {requesting ? "Enabling..." : "Enable notifications"}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="min-h-10 rounded-cyber border border-line px-[var(--space-inline)] text-xs text-dim transition-colors hover:text-heading"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

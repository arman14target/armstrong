"use client";

import { useEffect, useState } from "react";
import {
  isNotificationSupported,
  requestNotificationPermission,
} from "@/lib/restNotifications";

interface RestNotificationBannerProps {
  /** Show prompt when opening a workout day (until permission is granted). */
  active?: boolean;
}

export function RestNotificationBanner({ active = true }: RestNotificationBannerProps) {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [dismissedForSession, setDismissedForSession] = useState(false);

  useEffect(() => {
    if (!active || dismissedForSession) {
      setVisible(false);
      return;
    }

    if (!isNotificationSupported()) {
      return;
    }

    if (Notification.permission !== "default") {
      setVisible(false);
      return;
    }

    setVisible(true);
  }, [active, dismissedForSession]);

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
    setDismissedForSession(true);
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="mb-[var(--space-gap-md)] rounded-cyber border border-cyan/30 bg-cyan/5 p-[var(--space-panel)]">
      <p className="text-sm text-heading">Get notified when rest is over</p>
      <p className="mt-1 text-xs text-dim">
        Enable notifications so Armstrong can alert you when your rest timer
        finishes — even if the app is in the background.
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

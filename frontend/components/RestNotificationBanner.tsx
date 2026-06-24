"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from "@/lib/restNotifications";

interface RestNotificationBannerProps {
  /** Show prompt when opening a workout day (until permission is granted). */
  active?: boolean;
  /** Re-schedule any active rest timer after the user grants permission. */
  onPermissionGranted?: () => void;
}

export function RestNotificationBanner({
  active = true,
  onPermissionGranted,
}: RestNotificationBannerProps) {
  const { t } = useTranslation();
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

    let cancelled = false;

    void getNotificationPermission().then((permission) => {
      if (cancelled) {
        return;
      }

      setVisible(permission === "default");
    });

    return () => {
      cancelled = true;
    };
  }, [active, dismissedForSession]);

  const handleEnable = async () => {
    setRequesting(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === "granted") {
        onPermissionGranted?.();
      }
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
      <p className="text-sm text-heading">{t("notifications.restBannerTitle")}</p>
      <p className="mt-1 text-xs text-dim">
        {t("notifications.restBannerBody")}
      </p>
      <div className="mt-[var(--space-gap)] inline-gap flex-nowrap">
        <button
          type="button"
          onClick={handleEnable}
          disabled={requesting}
          className="cyber-btn--cyan min-h-10 rounded-cyber border px-[var(--space-inline)] text-xs disabled:opacity-60"
        >
          {requesting ? t("common.enabling") : t("notifications.enable")}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="min-h-10 rounded-cyber border border-line px-[var(--space-inline)] text-xs text-dim transition-colors hover:text-heading"
        >
          {t("common.notNow")}
        </button>
      </div>
    </div>
  );
}

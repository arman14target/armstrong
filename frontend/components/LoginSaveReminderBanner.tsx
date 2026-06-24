"use client";

import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  dismissLocalSaveReminderForSession,
  hasLocalOnlyChanges,
  isLocalSaveReminderDismissed,
  LOCAL_SAVE_REMINDER_EVENT,
  requestProfileSignup,
} from "@/lib/localSaveReminder";
import { APP_ROUTE } from "@/lib/routes";

function isMainAppRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return normalized === APP_ROUTE.replace(/\/$/, "");
}

export function LoginSaveReminderBanner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { configured, user, loading } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(
        isMainAppRoute(pathname) &&
          configured &&
          !loading &&
          !user &&
          hasLocalOnlyChanges() &&
          !isLocalSaveReminderDismissed(),
      );
    };

    updateVisibility();
    window.addEventListener(LOCAL_SAVE_REMINDER_EVENT, updateVisibility);
    return () => {
      window.removeEventListener(LOCAL_SAVE_REMINDER_EVENT, updateVisibility);
    };
  }, [pathname, configured, user, loading]);

  if (!visible) {
    return null;
  }

  return (
    <>
      <div
        className="fixed-banner-top pointer-events-none z-40"
        role="status"
        aria-live="polite"
      >
        <div className="pointer-events-auto mx-auto flex max-w-2xl flex-col gap-2 rounded-cyber border border-primary/40 bg-panel/95 px-3 py-2 shadow-[var(--shadow-modal)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
          <p className="text-[11px] leading-snug text-dim sm:text-xs">
            {t("saveReminder.message")}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => dismissLocalSaveReminderForSession()}
              className="rounded-cyber border border-line px-2.5 py-1 text-[11px] text-dim transition-colors hover:text-heading sm:text-xs"
            >
              {t("saveReminder.later")}
            </button>
            <button
              type="button"
              onClick={() => requestProfileSignup()}
              className="cyber-btn--green shrink-0 rounded-cyber border px-2.5 py-1 text-[11px] sm:text-xs"
            >
              {t("auth.createAccount")}
            </button>
          </div>
        </div>
      </div>
      <div className="h-[4.75rem] sm:h-12" aria-hidden="true" />
    </>
  );
}

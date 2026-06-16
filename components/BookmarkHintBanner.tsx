"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "armstrong-bookmark-hint-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function BookmarkHintBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }

    setVisible(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

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
        <div className="pointer-events-auto mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-cyber border border-line/80 bg-panel/95 px-3 py-2 shadow-[var(--shadow-modal)] backdrop-blur-sm sm:px-4">
          <p className="text-[11px] leading-snug text-dim sm:text-xs">
            Armstrong works best as a bookmark — add it to your home screen for
            quick access.
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="cyber-btn--cyan shrink-0 rounded-cyber border px-2.5 py-1 text-[11px] sm:text-xs"
          >
            Understood
          </button>
        </div>
      </div>
      <div className="h-11 sm:h-12" aria-hidden="true" />
    </>
  );
}

"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import { CyberButton } from "@/components/ui/CyberButton";
import { renderShareCard } from "@/lib/share/renderShareCard";
import { shareWorkoutImage } from "@/lib/share/shareImage";
import type { WorkoutShareSummary } from "@/lib/share/workoutShareSummary";
import { cn } from "@/lib/cn";

interface ShareWorkoutButtonProps {
  summary: WorkoutShareSummary;
  /** Called after a successful share/download (not on cancel/error). */
  onShared?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/** Renders the share card on click and routes it to the share sheet / download. */
export function ShareWorkoutButton({
  summary,
  onShared,
  className,
  children,
}: ShareWorkoutButtonProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const label = children ?? t("share.share");

  const handleShare = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const blob = await renderShareCard(summary);
      const fileName = `armstrong-${summary.dateISO.slice(0, 10)}`;
      const result = await shareWorkoutImage(blob, {
        fileName,
        title: t("share.shareTitle", { workoutName: summary.workoutName }),
        text: summary.heroStat.value,
      });
      if (result !== "cancelled") {
        onShared?.();
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CyberButton
      variant="cyan"
      className={cn("min-h-10 px-4 text-sm", className)}
      onClick={handleShare}
      disabled={busy}
    >
      {busy ? t("share.preparing") : error ? t("share.tryAgain") : label}
    </CyberButton>
  );
}

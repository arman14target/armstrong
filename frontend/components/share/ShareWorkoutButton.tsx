"use client";

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
  children = "Share",
}: ShareWorkoutButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

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
        title: `${summary.workoutName} · Armstrong`,
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
      {busy ? "Preparing…" : error ? "Try again" : children}
    </CyberButton>
  );
}

"use client";

import { formatTime, useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/cn";

interface RestTimerProps {
  endsAt?: string;
  durationSeconds: number;
  onComplete?: () => void;
}

export function RestTimer({
  endsAt,
  durationSeconds,
  onComplete,
}: RestTimerProps) {
  const remaining = useCountdown(endsAt, onComplete);

  if (!endsAt || remaining <= 0) {
    return null;
  }

  const total = Math.max(durationSeconds, remaining, 1);
  const progress = Math.min(1, remaining / total);
  const isUrgent = remaining <= 10;

  return (
    <div
      className={cn(
        "relative mt-[var(--space-gap)] h-11 overflow-hidden rounded-cyber border bg-bg/80 shadow-[var(--shadow-inset)]",
        isUrgent ? "border-magenta/50" : "border-amber/35",
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Rest time remaining: ${formatTime(remaining)}`}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-[width] duration-300 ease-linear",
          isUrgent
            ? "bg-gradient-to-r from-magenta/35 via-magenta/55 to-magenta/75"
            : "bg-gradient-to-r from-amber/25 via-amber/45 to-amber/70",
        )}
        style={{ width: `${progress * 100}%` }}
      >
        <div
          className={cn(
            "absolute inset-y-0 right-0 w-px",
            isUrgent ? "bg-magenta" : "bg-amber",
          )}
        />
      </div>

      <div className="relative z-10 flex h-full items-center justify-center gap-[var(--space-gap)] px-[var(--space-inline)]">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.22em]",
            isUrgent ? "text-magenta" : "text-amber/80",
          )}
        >
          Rest
        </span>
        <span
          className={cn(
            "font-display text-base font-bold tabular-nums tracking-wider",
            isUrgent ? "text-magenta animate-pulse" : "text-amber",
          )}
        >
          {formatTime(remaining)}
        </span>
      </div>
    </div>
  );
}

"use client";

import { formatTime, useElapsedTimer } from "@/hooks/useCountdown";

interface SessionTimerProps {
  startedAt?: string;
  compact?: boolean;
}

export function SessionTimer({ startedAt, compact = false }: SessionTimerProps) {
  const elapsed = useElapsedTimer(startedAt);

  if (compact) {
    return (
      <span className="font-display text-base tabular-nums text-cyan sm:text-lg">
        {formatTime(elapsed)}
      </span>
    );
  }

  return (
    <div className="inline-flex shrink-0 items-center gap-[var(--space-gap-md)] whitespace-nowrap rounded-panel border border-line bg-panel/80 px-[var(--space-panel)] py-[var(--space-panel-header-y)] backdrop-blur-sm">
      <span className="text-xs tracking-wide text-dim uppercase">session</span>
      <span className="font-display text-xl tabular-nums text-cyan">
        {formatTime(elapsed)}
      </span>
    </div>
  );
}

"use client";

import Link from "next/link";
import { WorkoutDayIcon } from "@/components/icons/WorkoutDayIcon";
import { useTimeAgo } from "@/hooks/useTimeAgo";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/formatRelativeTime";
import { WorkoutType } from "@/lib/types";

interface DayButtonProps {
  type: WorkoutType;
  label: string;
  lastCompletedAt?: string;
  lastSessionDurationSeconds?: number;
}

const accentStyles: Record<
  WorkoutType,
  { border: string; hover: string; labelColor: string }
> = {
  push: {
    border: "border-cyan/30",
    hover: "hover:border-cyan hover:-translate-y-1",
    labelColor: "text-cyan",
  },
  leg: {
    border: "border-green/30",
    hover: "hover:border-green hover:-translate-y-1",
    labelColor: "text-green",
  },
  abs: {
    border: "border-magenta/30",
    hover: "hover:border-magenta hover:-translate-y-1",
    labelColor: "text-magenta",
  },
  pull: {
    border: "border-amber/30",
    hover: "hover:border-amber hover:-translate-y-1",
    labelColor: "text-amber",
  },
};

export function DayButton({
  type,
  label,
  lastCompletedAt,
  lastSessionDurationSeconds,
}: DayButtonProps) {
  const accent = accentStyles[type];
  const lastWorkoutAgo = useTimeAgo(lastCompletedAt);

  return (
    <Link
      href={`/workout/${type}/`}
      className={cn(
        "group relative block overflow-hidden rounded-panel border bg-panel/80 p-[var(--space-card)] transition-all duration-250",
        accent.border,
        accent.hover,
      )}
    >
      <span
        aria-hidden
        className="absolute top-[var(--space-gap)] right-[var(--space-gap)] text-dim transition-all duration-250 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-magenta"
      >
        ↗
      </span>
      <div className="mb-[var(--space-gap)] transition-transform duration-250 group-hover:scale-110">
        <WorkoutDayIcon type={type} />
      </div>
      <p className={cn("mb-[var(--space-gap)] text-base font-semibold tracking-wide text-heading", accent.labelColor)}>
        {label}
      </p>
      <div className="text-xs text-dim">
        <p>
          <span className="text-green">Last workout:</span> {lastWorkoutAgo}
        </p>
        {lastSessionDurationSeconds !== undefined ? (
          <p>
            <span className="text-green">Session:</span>{" "}
            {formatDuration(lastSessionDurationSeconds)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

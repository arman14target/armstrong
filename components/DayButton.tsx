"use client";

import Link from "next/link";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { CustomDayIcon } from "@/components/icons/CustomDayIcon";
import { WorkoutDayIcon } from "@/components/icons/WorkoutDayIcon";
import { IconButton } from "@/components/ui/IconButton";
import { useTimeAgo } from "@/hooks/useTimeAgo";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/formatRelativeTime";
import { isWorkoutType, WorkoutType } from "@/lib/types";

interface DayButtonProps {
  workoutId: string;
  label: string;
  lastCompletedAt?: string;
  lastSessionDurationSeconds?: number;
  setupRequired?: boolean;
  removable?: boolean;
  onSetupClick?: () => void;
  onRemove?: () => void;
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

const customAccent = {
  border: "border-dim/30",
  hover: "hover:border-dim hover:-translate-y-1",
  labelColor: "text-dim",
};

export function DayButton({
  workoutId,
  label,
  lastCompletedAt,
  lastSessionDurationSeconds,
  setupRequired = false,
  removable = false,
  onSetupClick,
  onRemove,
}: DayButtonProps) {
  const isBuiltin = isWorkoutType(workoutId);
  const accent = isBuiltin ? accentStyles[workoutId] : customAccent;
  const lastWorkoutAgo = useTimeAgo(lastCompletedAt);

  const className = cn(
    "group relative block w-full overflow-hidden rounded-panel border bg-panel/80 p-[var(--space-card)] text-left transition-all duration-250",
    accent.border,
    accent.hover,
  );

  const content = (
    <>
      {removable && onRemove ? (
        <IconButton
          label={`Remove ${label}`}
          variant="danger"
          className="absolute top-2 right-2 z-10 size-7 rounded-full"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
        >
          <CloseIcon className="size-3.5" />
        </IconButton>
      ) : null}

      <div className="flex items-center gap-[var(--space-gap-md)]">
        <div className="shrink-0 transition-transform duration-250 group-hover:scale-110">
          {isBuiltin ? (
            <WorkoutDayIcon type={workoutId} />
          ) : (
            <CustomDayIcon />
          )}
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <p
            className={cn(
              "mb-1 text-base font-semibold tracking-wide text-heading",
              accent.labelColor,
            )}
          >
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
        </div>
      </div>
    </>
  );

  if (setupRequired && onSetupClick) {
    return (
      <button type="button" onClick={onSetupClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={`/workout/?type=${workoutId}`} className={className}>
      {content}
    </Link>
  );
}

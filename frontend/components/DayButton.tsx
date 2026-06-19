"use client";

import Link from "next/link";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { DaySticker } from "@/components/icons/DaySticker";
import { WorkoutDayIcon } from "@/components/icons/WorkoutDayIcon";
import { IconButton } from "@/components/ui/IconButton";
import { useTimeAgo } from "@/hooks/useTimeAgo";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/formatRelativeTime";
import {
  BUILTIN_DAY_THEME,
  DAY_THEME_STYLES,
  type WorkoutDayTheme,
} from "@/lib/workoutDayTheme";
import { isWorkoutType, WorkoutType } from "@/lib/types";

interface DayButtonProps {
  workoutId: string;
  label: string;
  lastCompletedAt?: string;
  lastSessionDurationSeconds?: number;
  setupRequired?: boolean;
  removable?: boolean;
  theme?: WorkoutDayTheme;
  sticker?: string;
  onSetupClick?: () => void;
  onRemove?: () => void;
}

export function DayButton({
  workoutId,
  label,
  lastCompletedAt,
  lastSessionDurationSeconds,
  setupRequired = false,
  removable = false,
  theme,
  sticker,
  onSetupClick,
  onRemove,
}: DayButtonProps) {
  const isBuiltin = isWorkoutType(workoutId);
  const accentTheme =
    theme ?? (isBuiltin ? BUILTIN_DAY_THEME[workoutId as WorkoutType] : undefined);
  const accent = accentTheme ? DAY_THEME_STYLES[accentTheme] : DAY_THEME_STYLES.cyan;
  const lastWorkoutAgo = useTimeAgo(lastCompletedAt);

  const className = cn(
    "group relative block w-full overflow-hidden rounded-panel border bg-panel/90 p-[var(--space-card)] text-left shadow-[var(--shadow-panel)] transition-all duration-250",
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
          ) : accentTheme && sticker ? (
            <DaySticker theme={accentTheme} emoji={sticker} />
          ) : (
            <DaySticker theme="cyan" emoji="🏋️" />
          )}
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <p
            className={cn(
              "mb-1 text-base font-semibold tracking-wide",
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

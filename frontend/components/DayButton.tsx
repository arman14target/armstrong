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
    "group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-panel border bg-panel/90 p-3 text-center shadow-[var(--shadow-panel)] transition-all duration-250",
    accent.border,
    accent.hover,
  );

  const cardContent = (
    <div className="flex flex-col items-center gap-2 px-1">
      <div className="shrink-0 transition-transform duration-250 group-hover:scale-110">
        {isBuiltin ? (
          <WorkoutDayIcon type={workoutId} className="size-14 text-3xl" />
        ) : accentTheme && sticker ? (
          <DaySticker theme={accentTheme} sticker={sticker} className="size-14 text-3xl" />
        ) : (
          <DaySticker theme="cyan" sticker="dumbbell" className="size-14 text-3xl" />
        )}
      </div>
      <p
        className={cn(
          "line-clamp-2 text-sm font-semibold leading-tight tracking-wide",
          accent.labelColor,
        )}
      >
        {label}
      </p>
      <div className="text-[10px] leading-tight text-dim">
        <p>
          <span className="text-green">Last:</span> {lastWorkoutAgo}
        </p>
        {lastSessionDurationSeconds !== undefined ? (
          <p>
            <span className="text-green">Session:</span>{" "}
            {formatDuration(lastSessionDurationSeconds)}
          </p>
        ) : null}
      </div>
    </div>
  );

  const card =
    setupRequired && onSetupClick ? (
      <button type="button" onClick={onSetupClick} className={className}>
        {cardContent}
      </button>
    ) : (
      <Link href={`/workout/?type=${workoutId}`} className={className}>
        {cardContent}
      </Link>
    );

  if (!removable || !onRemove) {
    return card;
  }

  return (
    <div className="relative">
      <IconButton
        label={`Remove ${label}`}
        variant="ghost"
        className="absolute -top-2 -right-2 z-10 size-6 rounded-full border-white/35 bg-bg text-white shadow-[0_2px_8px_rgba(0,0,0,0.45)] hover:border-white hover:bg-bg hover:text-white"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove();
        }}
      >
        <CloseIcon className="size-3" />
      </IconButton>
      {card}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { DaySticker } from "@/components/icons/DaySticker";
import { IconButton } from "@/components/ui/IconButton";
import { useTimeAgo } from "@/hooks/useTimeAgo";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/formatRelativeTime";
import { stickerForDayIndex } from "@/lib/workoutDayTheme";

interface DayButtonProps {
  workoutId: string;
  label: string;
  lastCompletedAt?: string;
  lastSessionDurationSeconds?: number;
  setupRequired?: boolean;
  removable?: boolean;
  iconIndex?: number;
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
  iconIndex = 0,
  onSetupClick,
  onRemove,
}: DayButtonProps) {
  const { t } = useTranslation();
  const displaySticker = stickerForDayIndex(iconIndex);
  const lastWorkoutAgo = useTimeAgo(lastCompletedAt);

  const className = cn(
    "group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-panel border border-magenta/35 bg-panel/90 p-3 text-center shadow-[var(--shadow-panel)] transition-all duration-250 hover:border-magenta hover:-translate-y-1",
  );

  const cardContent = (
    <div className="flex flex-col items-center gap-2 px-1">
      <div className="shrink-0 transition-transform duration-250 group-hover:scale-110">
        <DaySticker
          theme="cyan"
          sticker={displaySticker}
          className="size-14 text-3xl"
        />
      </div>
      <p className="line-clamp-2 text-sm font-semibold leading-tight tracking-wide text-white">
        {label}
      </p>
      <div className="text-[10px] leading-tight text-dim">
        <p>
          <span className="text-green">{t("workout.lastLabel")}</span> {lastWorkoutAgo}
        </p>
        {lastSessionDurationSeconds !== undefined ? (
          <p>
            <span className="text-green">{t("workout.sessionLabel")}</span>{" "}
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
        label={t("workout.removeDayAria", { name: label })}
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

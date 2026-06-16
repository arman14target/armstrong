import { cn } from "@/lib/cn";
import {
  DAY_THEME_STYLES,
  type WorkoutDayTheme,
} from "@/lib/workoutDayTheme";

interface DayStickerProps {
  theme: WorkoutDayTheme;
  emoji: string;
  className?: string;
}

export function DaySticker({ theme, emoji, className }: DayStickerProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-12 items-center justify-center rounded-lg border bg-icon-overlay text-2xl shadow-[2px_3px_0_var(--color-icon-shadow)]",
        DAY_THEME_STYLES[theme].border,
        DAY_THEME_STYLES[theme].iconColor,
        className,
      )}
    >
      {emoji}
    </span>
  );
}

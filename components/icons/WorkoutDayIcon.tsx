import { cn } from "@/lib/cn";
import { WorkoutType } from "@/lib/types";

interface WorkoutDayIconProps {
  type: WorkoutType;
  className?: string;
}

const workoutStickers: Record<WorkoutType, { emoji: string; color: string }> = {
  push: { emoji: "💪", color: "text-cyan" },
  leg: { emoji: "🦵", color: "text-green" },
  abs: { emoji: "🔥", color: "text-magenta" },
  pull: { emoji: "🦍", color: "text-amber" },
};

export function WorkoutDayIcon({ type, className }: WorkoutDayIconProps) {
  const { emoji, color } = workoutStickers[type];

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-12 items-center justify-center rounded-lg bg-icon-overlay text-2xl shadow-[2px_3px_0_var(--color-icon-shadow)]",
        color,
        className,
      )}
    >
      {emoji}
    </span>
  );
}

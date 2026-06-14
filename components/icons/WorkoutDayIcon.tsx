import { cn } from "@/lib/cn";
import { WorkoutType } from "@/lib/types";

interface WorkoutDayIconProps {
  type: WorkoutType;
  className?: string;
}

const workoutStickers: Record<
  WorkoutType,
  { emoji: string; rotate: string; color: string }
> = {
  push: { emoji: "💪", rotate: "-rotate-3", color: "text-cyan" },
  leg: { emoji: "🦵", rotate: "rotate-2", color: "text-green" },
  abs: { emoji: "🔥", rotate: "-rotate-6", color: "text-magenta" },
  pull: { emoji: "🦍", rotate: "rotate-3", color: "text-amber" },
};

export function WorkoutDayIcon({ type, className }: WorkoutDayIconProps) {
  const { emoji, rotate, color } = workoutStickers[type];

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-12 items-center justify-center rounded-lg border-2 border-dashed border-current bg-icon-overlay text-2xl shadow-[2px_3px_0_var(--color-icon-shadow)]",
        rotate,
        color,
        className,
      )}
    >
      {emoji}
    </span>
  );
}

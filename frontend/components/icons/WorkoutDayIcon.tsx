import { DaySticker } from "@/components/icons/DaySticker";
import { WorkoutType } from "@/lib/types";
import {
  BUILTIN_DAY_STICKER,
  BUILTIN_DAY_THEME,
} from "@/lib/workoutDayTheme";

interface WorkoutDayIconProps {
  type: WorkoutType;
  className?: string;
}

export function WorkoutDayIcon({ type, className }: WorkoutDayIconProps) {
  return (
    <DaySticker
      theme={BUILTIN_DAY_THEME[type]}
      emoji={BUILTIN_DAY_STICKER[type]}
      className={className}
    />
  );
}

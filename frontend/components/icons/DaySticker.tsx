import Image from "next/image";
import { cn } from "@/lib/cn";
import {
  dayStickerImageSrc,
  isDayEquipmentSticker,
} from "@/lib/dayStickers";
import {
  DAY_THEME_STYLES,
  type WorkoutDayTheme,
} from "@/lib/workoutDayTheme";

interface DayStickerProps {
  theme: WorkoutDayTheme;
  sticker: string;
  className?: string;
}

export function DaySticker({ theme, sticker, className }: DayStickerProps) {
  const isEquipment = isDayEquipmentSticker(sticker);

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-12 items-center justify-center",
        !isEquipment &&
          "rounded-lg border bg-icon-overlay shadow-[2px_3px_0_var(--color-icon-shadow)]",
        !isEquipment && DAY_THEME_STYLES[theme].border,
        !isEquipment && DAY_THEME_STYLES[theme].iconColor,
        className,
      )}
    >
      {isEquipment ? (
        <Image
          src={dayStickerImageSrc(sticker)}
          alt=""
          width={48}
          height={48}
          className="size-[85%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        />
      ) : (
        <span className="text-2xl">{sticker}</span>
      )}
    </span>
  );
}

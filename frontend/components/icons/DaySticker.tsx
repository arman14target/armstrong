"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import {
  dayStickerDisplayScale,
  dayStickerImageSrc,
  isDayEquipmentSticker,
} from "@/lib/dayStickers";
import { useCachedImage } from "@/hooks/useCachedImage";
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
  const displayScale = dayStickerDisplayScale(sticker);
  const imageSize = `${85 * displayScale}%`;
  const imageSrc = useCachedImage(
    isEquipment ? dayStickerImageSrc(sticker) : "",
  );

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-12 items-center justify-center",
        !isEquipment &&
          "rounded-lg border bg-icon-overlay shadow-[2px_3px_0_var(--color-icon-shadow)]",
        !isEquipment && DAY_THEME_STYLES[theme].border,
        !isEquipment && DAY_THEME_STYLES[theme].iconColor,
        className,
      )}
    >
      {isEquipment ? (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[6%] left-1/2 z-0 h-3 w-[78%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_110%_100%_at_50%_0%,color-mix(in_srgb,var(--color-secondary)_85%,transparent),transparent_68%)] blur-[5px] opacity-75"
          />
          <Image
            src={imageSrc}
            alt=""
            width={48}
            height={48}
            className="relative z-[1] object-contain drop-shadow-[0_3px_8px_color-mix(in_srgb,var(--color-secondary)_38%,transparent)]"
            style={{ width: imageSize, height: imageSize }}
          />
        </>
      ) : (
        <span className="text-2xl">{sticker}</span>
      )}
    </span>
  );
}

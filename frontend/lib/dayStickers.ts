import { withBasePath } from "@/lib/basePath";

export const DAY_EQUIPMENT_STICKERS = [
  "dumbbell",
  "bench",
  "kettlebell",
  "weight-plate",
  "jump-rope",
  "medicine-ball",
] as const;

export type DayEquipmentSticker = (typeof DAY_EQUIPMENT_STICKERS)[number];

const DAY_STICKER_IMAGE_PATH: Record<DayEquipmentSticker, string> = {
  dumbbell: "/images/day-stickers/dumbbell-3d-orange.png",
  "jump-rope": "/images/day-stickers/jump-rope-3d-orange.png",
  kettlebell: "/images/day-stickers/kettlebell-3d-orange.png",
  "weight-plate": "/images/day-stickers/weight-plate-3d-orange.png",
  bench: "/images/day-stickers/bench-3d-orange.png",
  "medicine-ball": "/images/day-stickers/medicine-ball-3d-orange.png",
};

const DAY_STICKER_SET = new Set<string>(DAY_EQUIPMENT_STICKERS);

/** Compensate for extra transparent padding in some source PNGs. */
export const DAY_STICKER_DISPLAY_SCALE: Partial<
  Record<DayEquipmentSticker, number>
> = {
  bench: 1.1,
  "medicine-ball": 1.05,
};

export function dayStickerDisplayScale(sticker: string): number {
  return isDayEquipmentSticker(sticker)
    ? (DAY_STICKER_DISPLAY_SCALE[sticker] ?? 1)
    : 1;
}

export function isDayEquipmentSticker(
  sticker: string | undefined,
): sticker is DayEquipmentSticker {
  return sticker !== undefined && DAY_STICKER_SET.has(sticker);
}

export function dayStickerImageSrc(sticker: DayEquipmentSticker): string {
  return withBasePath(DAY_STICKER_IMAGE_PATH[sticker]);
}

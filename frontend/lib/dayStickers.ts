import { withBasePath } from "@/lib/basePath";

export const DAY_EQUIPMENT_STICKERS = [
  "dumbbell",
  "barbell",
  "kettlebell",
  "pull-up-bar",
  "bench",
  "medicine-ball",
] as const;

export type DayEquipmentSticker = (typeof DAY_EQUIPMENT_STICKERS)[number];

const DAY_STICKER_IMAGE_PATH: Record<DayEquipmentSticker, string> = {
  dumbbell: "/images/day-stickers/dumbbell-3d-orange.png",
  barbell: "/images/day-stickers/barbell-3d-orange.png",
  kettlebell: "/images/day-stickers/kettlebell-3d-orange.png",
  "pull-up-bar": "/images/day-stickers/pull-up-bar-3d-orange.png",
  bench: "/images/day-stickers/bench-3d-orange.png",
  "medicine-ball": "/images/day-stickers/medicine-ball-3d-orange.png",
};

const DAY_STICKER_SET = new Set<string>(DAY_EQUIPMENT_STICKERS);

export function isDayEquipmentSticker(
  sticker: string | undefined,
): sticker is DayEquipmentSticker {
  return sticker !== undefined && DAY_STICKER_SET.has(sticker);
}

export function dayStickerImageSrc(sticker: DayEquipmentSticker): string {
  return withBasePath(DAY_STICKER_IMAGE_PATH[sticker]);
}

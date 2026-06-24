"use client";

import { useEffect } from "react";
import { allDayStickerImageSrcs } from "@/lib/dayStickers";
import { preloadImages } from "@/lib/imageCache";

export function DayStickerPreload() {
  useEffect(() => {
    void preloadImages(allDayStickerImageSrcs());
  }, []);

  return null;
}

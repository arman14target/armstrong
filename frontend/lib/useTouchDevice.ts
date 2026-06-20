"use client";

import { useEffect, useState } from "react";

const TOUCH_MEDIA_QUERY = "(hover: none) and (pointer: coarse)";

export function useTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(TOUCH_MEDIA_QUERY);
    const update = () => setIsTouchDevice(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isTouchDevice;
}

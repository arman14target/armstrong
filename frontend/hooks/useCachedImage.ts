"use client";

import { useEffect, useState } from "react";
import { getCachedImageSrc, peekCachedImageSrc } from "@/lib/imageCache";

export function useCachedImage(src: string): string {
  const [resolvedSrc, setResolvedSrc] = useState(
    () => peekCachedImageSrc(src) ?? src,
  );

  useEffect(() => {
    const cached = peekCachedImageSrc(src);
    if (cached) {
      setResolvedSrc(cached);
      return;
    }

    let cancelled = false;

    void getCachedImageSrc(src).then((nextSrc) => {
      if (!cancelled) {
        setResolvedSrc(nextSrc);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return resolvedSrc;
}

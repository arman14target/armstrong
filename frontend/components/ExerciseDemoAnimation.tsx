"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface ExerciseDemoAnimationProps {
  name: string;
  imageUrls: string[];
  className?: string;
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
    if (image.complete) {
      resolve();
    }
  });
}

export function ExerciseDemoAnimation({
  name,
  imageUrls,
  className,
}: ExerciseDemoAnimationProps) {
  const [startUrl, endUrl] = imageUrls;
  const [ready, setReady] = useState(!endUrl);

  useEffect(() => {
    if (!endUrl) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    void Promise.all([preloadImage(startUrl), preloadImage(endUrl)]).then(() => {
      if (!cancelled) {
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [endUrl, startUrl]);

  if (imageUrls.length === 0) {
    return null;
  }

  if (!endUrl) {
    return (
      <div
        className={cn(
          "exercise-demo-frame overflow-hidden rounded-cyber border border-line",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={startUrl}
          alt={`${name} demonstration`}
          className="exercise-demo-image exercise-demo-image--static"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "exercise-demo-frame overflow-hidden rounded-cyber border border-line",
        !ready && "exercise-demo-frame--loading",
        className,
      )}
      aria-label={`${name} start and end position demonstration`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={startUrl}
        alt={`${name} starting position`}
        className="exercise-demo-image exercise-demo-image--start"
        loading="eager"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={endUrl}
        alt={`${name} end position`}
        className="exercise-demo-image exercise-demo-image--end"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

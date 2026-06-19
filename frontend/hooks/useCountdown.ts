"use client";

import { useEffect, useRef, useState } from "react";

export function useCountdown(endsAt: string | undefined, onComplete?: () => void) {
  const [remaining, setRemaining] = useState(0);
  const completedRef = useRef<string | null>(null);

  useEffect(() => {
    completedRef.current = null;

    if (!endsAt) {
      setRemaining(0);
      return;
    }

    const tick = () => {
      const ms = new Date(endsAt).getTime() - Date.now();
      const seconds = Math.max(0, Math.ceil(ms / 1000));
      setRemaining(seconds);
      if (seconds <= 0 && completedRef.current !== endsAt) {
        completedRef.current = endsAt;
        onComplete?.();
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt, onComplete]);

  return remaining;
}

export function useElapsedTimer(startedAt: string | undefined) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      const ms = Date.now() - new Date(startedAt).getTime();
      setElapsed(Math.max(0, Math.floor(ms / 1000)));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

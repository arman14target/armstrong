"use client";

import { useEffect, useState } from "react";
import { formatTimeAgo } from "@/lib/formatRelativeTime";

export function useTimeAgo(iso?: string): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!iso) {
      return;
    }

    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [iso]);

  return formatTimeAgo(iso, now);
}

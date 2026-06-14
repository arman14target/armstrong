"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/basePath";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const swUrl = withBasePath("/sw.js");
    navigator.serviceWorker.register(swUrl).catch(() => {
      // SW registration can fail in dev or unsupported contexts
    });
  }, []);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MicrosoftClarity } from "@/components/MicrosoftClarity";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { isNativeApp } from "@/lib/nativeApp";

export function WebOnlyClientExtras() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (isNativeApp()) {
      if ("serviceWorker" in navigator) {
        void navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            void registration.unregister();
          }
        });
      }
      return;
    }

    setEnabled(true);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <ServiceWorkerRegister />
      <Analytics />
      <SpeedInsights />
      <MicrosoftClarity />
    </>
  );
}

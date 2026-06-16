"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ParticleNetwork } from "@/components/effects/ParticleNetwork";
import { StaticMeshBackground } from "@/components/effects/StaticMeshBackground";

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");

  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function BackgroundEffect() {
  const pathname = usePathname();
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const isLanding = pathname.includes("/landing");

  if (prefersReducedMotion) {
    return null;
  }

  if (isLanding) {
    return <StaticMeshBackground />;
  }

  return <ParticleNetwork />;
}

"use client";

import { useEffect } from "react";
import { REVEAL_THRESHOLD } from "@/lib/revealAnimation";

/**
 * Adds `.reveal-visible` to `[data-reveal]` elements via Intersection Observer.
 * Content stays in the DOM at all times — only transform/opacity animate.
 */
export function LandingScrollReveal() {
  useEffect(() => {
    const scrollTargets = document.querySelectorAll<HTMLElement>(
      "[data-reveal='scroll']",
    );

    const reveal = (element: HTMLElement) => {
      element.classList.add("reveal-visible");
    };

    if (scrollTargets.length === 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      scrollTargets.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      },
      { threshold: REVEAL_THRESHOLD },
    );

    scrollTargets.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return null;
}

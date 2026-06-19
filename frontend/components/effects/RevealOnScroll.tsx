"use client";

import { useEffect, useRef } from "react";
import { REVEAL_THRESHOLD } from "@/lib/revealAnimation";
import { cn } from "@/lib/cn";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function RevealOnScroll({ children, className }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    document.documentElement.classList.add("reveal-js");

    const reveal = () => element.classList.add("reveal-visible");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.unobserve(element);
        }
      },
      { threshold: REVEAL_THRESHOLD },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("reveal-hidden", className)}>
      {children}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { LandingScrollReveal } from "@/components/landing/LandingScrollReveal";

interface LandingPageRootProps {
  children: React.ReactNode;
}

export function LandingPageRoot({ children }: LandingPageRootProps) {
  useEffect(() => {
    document.documentElement.dataset.page = "landing";

    return () => {
      delete document.documentElement.dataset.page;
    };
  }, []);

  return (
    <>
      <LandingScrollReveal />
      {children}
    </>
  );
}

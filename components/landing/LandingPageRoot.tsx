"use client";

import { useEffect } from "react";

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

  return children;
}

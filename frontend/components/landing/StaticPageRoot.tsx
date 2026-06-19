"use client";

import { useEffect } from "react";

interface StaticPageRootProps {
  children: React.ReactNode;
}

/** Marketing pages without scroll-reveal — content visible immediately. */
export function StaticPageRoot({ children }: StaticPageRootProps) {
  useEffect(() => {
    document.documentElement.dataset.page = "static";

    return () => {
      delete document.documentElement.dataset.page;
    };
  }, []);

  return <>{children}</>;
}

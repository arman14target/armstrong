"use client";

import { useEffect } from "react";
import {
  applyBlogPageMarkers,
  blogThemeColor,
  clearBlogPageMarkers,
  subscribePreferredColorScheme,
} from "@/lib/colorScheme";

interface BlogPageRootProps {
  children: React.ReactNode;
}

function syncThemeColorMeta(scheme: "light" | "dark"): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    return;
  }

  meta.setAttribute("content", blogThemeColor(scheme));
}

/** Blog shell — static content, OS/browser color scheme, no CRT overlay. */
export function BlogPageRoot({ children }: BlogPageRootProps) {
  useEffect(() => {
    const unsubscribe = subscribePreferredColorScheme((scheme) => {
      applyBlogPageMarkers(scheme);
      syncThemeColorMeta(scheme);
    });

    return () => {
      unsubscribe();
      clearBlogPageMarkers();
      syncThemeColorMeta("dark");
    };
  }, []);

  return <>{children}</>;
}

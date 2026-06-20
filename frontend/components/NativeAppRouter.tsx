"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  getNativeAppEntryPath,
  isNativeAllowedRoute,
  isNativeApp,
} from "@/lib/nativeApp";

interface NativeAppRouterProps {
  children: React.ReactNode;
}

export function NativeAppRouter({ children }: NativeAppRouterProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!isNativeApp() || isNativeAllowedRoute(pathname)) {
      return;
    }

    window.location.replace(getNativeAppEntryPath());
  }, [pathname]);

  return <>{children}</>;
}

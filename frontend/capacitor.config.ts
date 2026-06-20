/// <reference types="@capacitor/local-notifications" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.armstrong.app",
  appName: "Armstrong",
  // Next.js static export output dir (next.config.ts: output: "export").
  webDir: "out",
  // Native projects live at the repo root (outside frontend/). Paths are
  // relative to this config file. `cap` is still run from frontend/.
  android: { path: "../android" },
  ios: { path: "../ios" },
  server: {
    // Match Android: https://localhost loads assets more reliably in WKWebView.
    iosScheme: "https",
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_launcher_foreground",
      iconColor: "#f59e0b",
    },
  },
};

export default config;

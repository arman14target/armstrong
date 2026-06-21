/// <reference types="@capacitor/local-notifications" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.armstrong.app",
  appName: "Armstrong",
  // Next.js static export output dir (next.config.ts: output: "export").
  webDir: "out",
  // Native projects live at the repo root (outside frontend/). Paths are
  // relative to this config file. `cap` is still run from frontend/.
  // allowMixedContent lets the https://localhost webview call the cleartext
  // http://10.0.2.2:4000 local backend during dev (emulator → host loopback).
  android: { path: "../android", allowMixedContent: true },
  ios: { path: "../ios" },
  server: {
    // Match Android: https://localhost loads assets more reliably in WKWebView.
    iosScheme: "https",
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_launcher_foreground",
      iconColor: "#f59e0b",
      presentationOptions: ["badge", "sound", "banner", "list"],
    },
  },
};

export default config;

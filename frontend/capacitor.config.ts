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
};

export default config;

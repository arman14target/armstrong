import { copyFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(scriptDir, "..");
const repoRoot = join(frontendDir, "..");

const NATIVE_PUBLIC_DIRS = [
  join(repoRoot, "android/app/src/main/assets/public"),
  join(repoRoot, "ios/App/App/public"),
];

const MARKETING_DIRS = ["blog", "diet-planner", "gym-planner", "landing"];

function patchNativePublic(publicDir) {
  if (!existsSync(publicDir)) {
    console.warn(`[patch-native-entry] skip missing dir: ${publicDir}`);
    return;
  }

  const appIndex = join(publicDir, "app", "index.html");
  const rootIndex = join(publicDir, "index.html");

  if (!existsSync(appIndex)) {
    console.error(`[patch-native-entry] missing app entry: ${appIndex}`);
    return;
  }

  // Serve the tracker app at /. Capacitor iOS often fails JS/meta redirects.
  copyFileSync(appIndex, rootIndex);
  console.log(`[patch-native-entry] copied ${appIndex} -> ${rootIndex}`);

  for (const dirName of MARKETING_DIRS) {
    const target = join(publicDir, dirName);
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
      console.log(`[patch-native-entry] removed ${target}`);
    }
  }

  console.log(`[patch-native-entry] patched ${publicDir}`);
}

for (const publicDir of NATIVE_PUBLIC_DIRS) {
  patchNativePublic(publicDir);
}

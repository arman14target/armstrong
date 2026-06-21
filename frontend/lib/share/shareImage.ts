import { isNativeApp } from "@/lib/nativeApp";

/** Outcome so the UI can tell the user what happened. */
export type ShareResult = "shared" | "downloaded" | "cancelled";

interface ShareOptions {
  /** Suggested file name (no extension). */
  fileName: string;
  /** Text shown in the native share sheet, where supported. */
  title?: string;
  text?: string;
}

/**
 * Share a PNG to the platform's native sheet (Instagram / WhatsApp / FB stories
 * appear there), falling back to a file download on platforms without Web Share
 * Level 2. Direct posting into IG/FB *Stories* from a browser is impossible on
 * every platform — native sheet or download are the only real paths.
 */
export async function shareWorkoutImage(
  blob: Blob,
  { fileName, title = "My Armstrong workout", text }: ShareOptions,
): Promise<ShareResult> {
  const name = `${fileName}.png`;

  if (isNativeApp()) {
    return shareNative(blob, name, title, text);
  }

  const file = new File([blob], name, { type: "image/png" });

  // Web Share API Level 2 (mobile Safari/Chrome) — opens the OS share sheet.
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return "shared";
    } catch (err) {
      if (isAbort(err)) {
        return "cancelled";
      }
      // Fall through to download on any non-abort failure.
    }
  }

  downloadBlob(blob, name);
  return "downloaded";
}

/** Native path: write to cache, hand the file URI to @capacitor/share. */
async function shareNative(
  blob: Blob,
  name: string,
  title: string,
  text?: string,
): Promise<ShareResult> {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);

  const base64 = await blobToBase64(blob);
  const { uri } = await Filesystem.writeFile({
    path: name,
    data: base64,
    directory: Directory.Cache,
  });

  try {
    await Share.share({ title, text, files: [uri], dialogTitle: title });
    return "shared";
  } catch (err) {
    if (isAbort(err)) {
      return "cancelled";
    }
    throw err;
  }
}

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the click has been handled.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Filesystem.writeFile wants a bare base64 string (no data: prefix). */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function isAbort(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AbortError" ||
      /cancel|abort|dismiss/i.test(err.message))
  );
}

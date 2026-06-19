const APPLE_SCRIPT_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

let appleScriptPromise: Promise<void> | null = null;
let initialized = false;

/** Web Apple sign-in uses the Services ID (not the iOS bundle id). */
export function getAppleClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim() || undefined;
}

export function getAppleRedirectUri(): string | undefined {
  return process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI?.trim() || undefined;
}

export function isAppleConfigured(): boolean {
  return Boolean(getAppleClientId() && getAppleRedirectUri());
}

function loadAppleScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.AppleID?.auth) {
    return Promise.resolve();
  }
  if (appleScriptPromise) {
    return appleScriptPromise;
  }
  appleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = APPLE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Apple sign-in"));
    document.head.appendChild(script);
  });
  return appleScriptPromise;
}

/** Opens the Apple popup and returns the identity token (web). */
export async function appleWebSignIn(): Promise<string> {
  const clientId = getAppleClientId();
  const redirectURI = getAppleRedirectUri();
  if (!clientId || !redirectURI) {
    throw new Error("Apple sign-in is not configured");
  }
  await loadAppleScript();
  if (!window.AppleID?.auth) {
    throw new Error("Apple sign-in is unavailable");
  }
  if (!initialized) {
    window.AppleID.auth.init({
      clientId,
      scope: "name email",
      redirectURI,
      usePopup: true,
    });
    initialized = true;
  }
  const res = await window.AppleID.auth.signIn();
  const token = res.authorization?.id_token;
  if (!token) {
    throw new Error("Apple sign-in returned no token");
  }
  return token;
}

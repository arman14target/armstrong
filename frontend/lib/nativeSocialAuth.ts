import { Capacitor } from "@capacitor/core";
import { getGoogleClientId } from "./googleAuth";
import { getAppleClientId, getAppleRedirectUri } from "./appleAuth";

// Native (iOS/Android) social sign-in via @capgo/capacitor-social-login.
// The web app uses the GSI / Apple-JS widgets instead (see *SignInButton).

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

let initPromise: Promise<void> | null = null;

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const { SocialLogin } = await import("@capgo/capacitor-social-login");
      await SocialLogin.initialize({
        google: {
          webClientId: getGoogleClientId(),
          iOSClientId: process.env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim(),
        },
        apple: {
          clientId: getAppleClientId(),
          redirectUrl: getAppleRedirectUri(),
        },
      });
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

// The plugin's result shape differs slightly by provider/version; pull the
// id token defensively.
function extractIdToken(result: unknown): string | undefined {
  const r = result as {
    idToken?: string;
    accessToken?: { token?: string };
  } | null;
  return r?.idToken ?? undefined;
}

export async function nativeGoogleSignIn(): Promise<string> {
  await ensureInitialized();
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  const res = await SocialLogin.login({
    provider: "google",
    options: { scopes: ["email", "profile"] },
  });
  const token = extractIdToken(res.result);
  if (!token) {
    throw new Error("Google sign-in returned no token");
  }
  return token;
}

export async function nativeAppleSignIn(): Promise<string> {
  await ensureInitialized();
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  const res = await SocialLogin.login({
    provider: "apple",
    options: { scopes: ["email", "name"] },
  });
  const token = extractIdToken(res.result);
  if (!token) {
    throw new Error("Apple sign-in returned no token");
  }
  return token;
}

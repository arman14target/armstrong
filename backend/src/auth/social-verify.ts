import { UnauthorizedException } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface SocialIdentity {
  sub: string;
  email?: string;
  emailVerified: boolean;
}

function clientIds(...envVars: (string | undefined)[]): string[] {
  return envVars
    .filter(Boolean)
    .flatMap((v) => v!.split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}

// --- Google ---
// Accept multiple audiences: web + iOS + Android OAuth client IDs all issue
// tokens for the same user, each with their own `aud`.
const googleClient = new OAuth2Client();

export function googleClientIds(): string[] {
  return clientIds(process.env.GOOGLE_CLIENT_IDS, process.env.GOOGLE_CLIENT_ID);
}

export async function verifyGoogleToken(
  idToken: string,
): Promise<SocialIdentity> {
  const audience = googleClientIds();
  if (audience.length === 0) {
    throw new UnauthorizedException("Google sign-in is not configured");
  }
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience });
    payload = ticket.getPayload();
  } catch {
    throw new UnauthorizedException("Invalid Google sign-in");
  }
  if (!payload?.sub) {
    throw new UnauthorizedException("Invalid Google sign-in");
  }
  return {
    sub: payload.sub,
    email: payload.email?.trim().toLowerCase(),
    emailVerified: payload.email_verified === true,
  };
}

// --- Apple ---
const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

export function appleClientIds(): string[] {
  return clientIds(process.env.APPLE_CLIENT_IDS, process.env.APPLE_CLIENT_ID);
}

export async function verifyAppleToken(
  identityToken: string,
): Promise<SocialIdentity> {
  const audience = appleClientIds();
  if (audience.length === 0) {
    throw new UnauthorizedException("Apple sign-in is not configured");
  }
  let payload;
  try {
    ({ payload } = await jwtVerify(identityToken, APPLE_JWKS, {
      issuer: "https://appleid.apple.com",
      audience,
    }));
  } catch {
    throw new UnauthorizedException("Invalid Apple sign-in");
  }
  if (!payload.sub) {
    throw new UnauthorizedException("Invalid Apple sign-in");
  }
  const email =
    typeof payload.email === "string"
      ? payload.email.trim().toLowerCase()
      : undefined;
  // Apple sends email_verified as the string "true"/"false" (or boolean).
  const verifiedClaim = (payload as Record<string, unknown>).email_verified;
  const emailVerified = verifiedClaim === true || verifiedClaim === "true";
  return { sub: payload.sub, email, emailVerified };
}

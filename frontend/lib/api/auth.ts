import { apiFetch, setAuthToken, type AppUser } from "./client";

interface AuthResponse {
  token: string;
  user: AppUser;
}

export async function apiSignUp(
  email: string,
  password: string,
): Promise<AppUser> {
  const result = await apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: { email, password },
  });
  setAuthToken(result.token);
  return result.user;
}

export async function apiSignIn(
  email: string,
  password: string,
): Promise<AppUser> {
  const result = await apiFetch<AuthResponse>("/auth/signin", {
    method: "POST",
    body: { email, password },
  });
  setAuthToken(result.token);
  return result.user;
}

export async function apiGetCurrentUser(): Promise<AppUser | null> {
  try {
    const result = await apiFetch<{ user: AppUser }>("/auth/me", {
      auth: true,
    });
    return result.user;
  } catch {
    // Token missing/expired/invalid — treat as signed out.
    setAuthToken(null);
    return null;
  }
}

export function apiSignOut(): void {
  setAuthToken(null);
}

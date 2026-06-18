// HTTP client for the Armstrong Node.js backend.
// The app stays a static export and talks to the backend over plain fetch.
// Auth + cloud sync are optional: if NEXT_PUBLIC_API_URL is unset the app runs
// purely on localStorage (same graceful-degrade contract the Supabase setup had).

const TOKEN_KEY = "armstrong-auth-token";

export interface AppUser {
  id: string;
  email: string;
}

export function getApiBaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || undefined;
}

export function isApiConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError(0, "API is not configured");
  }

  const { method = "GET", body, auth = false } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = extractErrorMessage(data) ?? `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const message = (data as { message?: unknown }).message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  return typeof message === "string" ? message : null;
}

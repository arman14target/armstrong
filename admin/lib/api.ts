// Admin API client. Talks to the same backend as the user app, but only the
// /api/admin/* routes, with the admin token (separate from any user token).

const TOKEN_KEY = "armstrong-admin-token";

export type AdminRole = "ADMIN" | "SUPERADMIN";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
}

export interface AppUserRow {
  id: string;
  email: string;
  disabled: boolean;
  createdAt: string;
  _count: { dayEntries: number; foodEntries: number; customWorkouts: number };
}

export interface DashboardStats {
  totalUsers: number;
  disabledUsers: number;
  newUsersToday: number;
  newUsers7d: number;
  newUsers30d: number;
  coachPlanUsers: number;
  nutritionUsers: number;
  usersWhoLoggedWorkout: number;
  activeSessionsNow: number;
  totalWorkoutsLogged: number;
  totalFoodEntries: number;
  signupsByDay: { day: string; count: number }[];
}

export interface AdminRow {
  id: string;
  email: string;
  role: AdminRole;
  disabled: boolean;
  createdAt: string;
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!url) {
    throw new ApiError(0, "NEXT_PUBLIC_API_URL is not configured");
  }
  return url;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl()}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = extractMessage(data) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

function extractMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const m = (data as { message?: unknown }).message;
  if (Array.isArray(m)) return m.join(", ");
  return typeof m === "string" ? m : null;
}

// --- Auth ---
export async function adminSignIn(
  email: string,
  password: string,
): Promise<AdminUser> {
  const res = await apiFetch<{ token: string; admin: AdminUser }>(
    "/admin/auth/signin",
    { method: "POST", body: { email, password }, auth: false },
  );
  setToken(res.token);
  return res.admin;
}

export async function adminMe(): Promise<AdminUser | null> {
  try {
    const res = await apiFetch<{ admin: AdminUser }>("/admin/auth/me");
    return res.admin;
  } catch {
    setToken(null);
    return null;
  }
}

export function adminSignOut(): void {
  setToken(null);
}

// --- Data ---
export function fetchStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/admin/stats");
}

export function fetchUsers(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<{
  total: number;
  page: number;
  pageSize: number;
  users: AppUserRow[];
}> {
  const q = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.search) q.set("search", params.search);
  return apiFetch(`/admin/users?${q.toString()}`);
}

export function setUserDisabled(
  id: string,
  disabled: boolean,
): Promise<AppUserRow> {
  return apiFetch(`/admin/users/${id}/disabled`, {
    method: "PATCH",
    body: { disabled },
  });
}

export function deleteUser(id: string): Promise<void> {
  return apiFetch(`/admin/users/${id}`, { method: "DELETE" });
}

export function fetchAdmins(): Promise<AdminRow[]> {
  return apiFetch("/admin/admins");
}

export function createAdmin(
  email: string,
  password: string,
  role: AdminRole,
): Promise<AdminRow> {
  return apiFetch("/admin/admins", {
    method: "POST",
    body: { email, password, role },
  });
}

export function setAdminDisabled(
  id: string,
  disabled: boolean,
): Promise<AdminRow> {
  return apiFetch(`/admin/admins/${id}/disabled`, {
    method: "PATCH",
    body: { disabled },
  });
}

// --- Exercises ---
export interface ExerciseMedia {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  position: number;
  source: string;
}

export interface ExerciseListItem {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  equipment: string | null;
  level: string | null;
  primaryMuscles: string[];
  media: { url: string; type: "IMAGE" | "VIDEO" }[];
  _count: { media: number };
}

export interface ExerciseDetail {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  media: ExerciseMedia[];
}

export function fetchExercises(params: {
  page: number;
  pageSize: number;
  search?: string;
  muscle?: string;
}): Promise<{
  total: number;
  page: number;
  pageSize: number;
  exercises: ExerciseListItem[];
}> {
  const q = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.search) q.set("search", params.search);
  if (params.muscle) q.set("muscle", params.muscle);
  return apiFetch(`/admin/exercises?${q.toString()}`);
}

export function fetchExercise(id: string): Promise<ExerciseDetail> {
  return apiFetch(`/admin/exercises/${id}`);
}

export async function uploadExerciseMedia(
  id: string,
  file: File,
): Promise<ExerciseMedia> {
  const url = `${baseUrl()}/api/admin/exercises/${id}/media`;
  const form = new FormData();
  form.append("file", file);
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { method: "POST", headers, body: form });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(data) ?? "Upload failed");
  }
  return data as ExerciseMedia;
}

export function deleteExerciseMedia(
  id: string,
  mediaId: string,
): Promise<void> {
  return apiFetch(`/admin/exercises/${id}/media/${mediaId}`, {
    method: "DELETE",
  });
}

// ---- Gyms (curated catalog built from user comparisons) ----

export type GymDataSource = "crawl" | "admin" | "user";

export interface GymPricePlanRow {
  id: string;
  name: string;
  priceText: string;
  period: string | null;
  source: GymDataSource;
}

export interface GymAmenityRow {
  id: string;
  name: string;
  source: GymDataSource;
}

export interface GymListItem {
  id: string;
  fsqPlaceId: string;
  name: string;
  address: string | null;
  country: string | null;
  website: string | null;
  rating: number | null;
  quietTimes: string | null;
  pricePlanCount: number;
  amenityCount: number;
  lastEnrichedAt: string | null;
}

export interface GymDetail {
  id: string;
  fsqPlaceId: string;
  name: string;
  address: string | null;
  country: string | null;
  website: string | null;
  rating: number | null;
  quietTimes: string | null;
  lastEnrichedAt: string | null;
  pricePlans: GymPricePlanRow[];
  amenities: GymAmenityRow[];
}

export function fetchGyms(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<{
  total: number;
  page: number;
  pageSize: number;
  gyms: GymListItem[];
}> {
  const q = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.search) q.set("search", params.search);
  return apiFetch(`/admin/gyms?${q.toString()}`);
}

export function fetchGym(id: string): Promise<GymDetail> {
  return apiFetch(`/admin/gyms/${id}`);
}

export function updateGym(
  id: string,
  body: { name?: string; website?: string | null; quietTimes?: string | null },
): Promise<GymDetail> {
  return apiFetch(`/admin/gyms/${id}`, { method: "PATCH", body });
}

export function deleteGym(id: string): Promise<void> {
  return apiFetch(`/admin/gyms/${id}`, { method: "DELETE" });
}

export function addGymPricePlan(
  id: string,
  body: { name: string; priceText: string; period?: string | null },
): Promise<GymPricePlanRow> {
  return apiFetch(`/admin/gyms/${id}/price-plans`, { method: "POST", body });
}

export function updateGymPricePlan(
  planId: string,
  body: { name?: string; priceText?: string; period?: string | null },
): Promise<GymPricePlanRow> {
  return apiFetch(`/admin/gyms/price-plans/${planId}`, {
    method: "PATCH",
    body,
  });
}

export function deleteGymPricePlan(planId: string): Promise<void> {
  return apiFetch(`/admin/gyms/price-plans/${planId}`, { method: "DELETE" });
}

export function addGymAmenity(
  id: string,
  name: string,
): Promise<GymAmenityRow> {
  return apiFetch(`/admin/gyms/${id}/amenities`, {
    method: "POST",
    body: { name },
  });
}

export function deleteGymAmenity(amenityId: string): Promise<void> {
  return apiFetch(`/admin/gyms/amenities/${amenityId}`, { method: "DELETE" });
}

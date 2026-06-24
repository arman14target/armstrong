# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Monorepo with three independently-deployed apps + one shared backend:

- `frontend/` — Next.js static-export PWA + Capacitor config. Deployed to **Vercel** (project root = `frontend/`). Run frontend + all `cap` commands from here.
- `admin/` — Next.js static-export **admin dashboard** (staff only). Deployed to its own **Vercel** project (root = `admin/`), domain `admin.armstrong-fitness.com`. Same gold/orange theme, ported. Talks to the same backend's `/api/admin/*` routes.
- `backend/` — NestJS + Prisma + PostgreSQL API serving both apps. Deployed to **Vercel serverless** (project root = `backend/`); DB is **Neon**.
- `android/`, `ios/` — Capacitor native shells at repo root (pointed to via `android.path`/`ios.path` in `frontend/capacitor.config.ts`). Generated/synced by `cap sync`, which runs from `frontend/` and copies `frontend/out` into them; their gradle/pods resolve back to `../frontend/node_modules`.
- Root — `docker-compose.yml` (full local stack: db + api + web:8080 + admin:8081), `.github/workflows/`, this file.

### Exercise catalog + media

`backend/src/exercises/` owns a global exercise catalog (`exercises` + `exercise_media` tables), seeded from the **free-exercise-db** dataset (`npm run seed:exercises`, ~873 exercises, each with 2 demo photos referenced from GitHub raw, `source:"seed"`). Admins browse/curate it from the admin app: `GET /api/admin/exercises[/:id]`, and upload/delete media (`POST`/`DELETE …/:id/media`). Uploads go to **Cloudinary** (`CloudinaryService`, creds in `CLOUDINARY_*`); `ExerciseMedia` keeps `cloudinaryId` for deletion and `type` (IMAGE/VIDEO) for future video. Seed media (GitHub URLs) and uploads (Cloudinary) coexist; re-seeding refreshes only `source:"seed"` rows. Public read endpoints `GET /api/exercises` (catalog + thumbnail) and `GET /api/exercises/:slug` (detail) serve the frontend; `frontend/lib/exerciseSearch.ts` reads them via `NEXT_PUBLIC_API_URL` and **falls back to GitHub raw** when the API isn't configured — so exercise search keeps the same shape but now gets our curated images.

### Admin auth (separate from app users)

Admins live in their own `admins` table (`AdminRole` = `ADMIN`/`SUPERADMIN`), **not** on `User`. Completely separate auth: own JWT signed with `ADMIN_JWT_SECRET` (distinct from `JWT_SECRET`), own passport strategy (`admin-jwt`), own sign-in at `/api/admin/auth/signin`. `RolesGuard` + `@Roles()` gate routes by tier (SUPERADMIN ⊇ ADMIN); SUPERADMIN-only: delete users, manage admins. The `backend/src/admin/` module holds all of this. App `User` gained only a `disabled` flag (admins lock users out; login is refused while true). First admin: `cd backend && npm run admin:create -- email pass SUPERADMIN`.

## CI/CD

GitHub Actions (all free on Linux runners; private-safe):
- `test.yml` — frontend (lint + `tsc --noEmit` + Vitest), backend (`tsc --noEmit` + Jest), admin (lint + `tsc --noEmit` + build) on PR/push.
- `mobile-android.yml` — builds web, `cap sync`, assembles a debug APK artifact.
- `backend-deploy.yml` — applies Prisma migrations to Neon on backend push; optionally fires a Vercel deploy hook after (ordered release, gated on `VERCEL_BACKEND_DEPLOY_HOOK`).
- `semgrep.yml` — free SAST (replaces CodeQL, which needs paid GHAS on private repos).
- `release.yml` — release-please (Conventional Commits → CHANGELOG, tags, GitHub Releases).
- `dependabot.yml` — weekly npm (frontend/backend) + github-actions update PRs.

Frontend (Vercel) and backend (Vercel serverless) auto-deploy on push to `main`. Backend health: `GET /api/health` (DB ping) for uptime monitors.

## Commands

Frontend (run in `frontend/`):
- `npm run dev` — dev server (Next.js + Turbopack)
- `npm run build` — production build; emits static site to `out/` (`output: "export"`)
- `npm run lint` — ESLint (`next/core-web-vitals` + `next/typescript`)
- `npm run android` / `npm run ios` — build + `cap sync` + open native IDE

Admin (run in `admin/`):
- `npm run dev` — admin dashboard on `:3001`
- `npm run build` / `npm run lint`
- First admin: `cd backend && npm run admin:create -- email pass SUPERADMIN`

Backend (run in `backend/`):
- `npm run start:dev` — watch-mode API on `:4000`
- `npm run prisma:migrate` — create/apply a dev migration
- `npm run build` — `nest build` to `dist/`

Whole stack (production images): `docker compose up --build` (Postgres + API + static web behind nginx, web on :8080). No test framework is configured.

Local dev with **hot reload**: `docker compose -f docker-compose.dev.yml up` — bind-mounts source and runs the dev servers (`next dev` on **:3000**, app at `/app`; `nest --watch` on **:4000**), so edits reload without an image rebuild. `node_modules` live in named volumes (install runs once, then is skipped); browser→API is `http://localhost:4000`, overriding `frontend/.env.local`. Stop the prod stack first (both bind `:4000`). Admin is omitted to stay lean.

## Architecture

Single-page PWA gym tracker. Next.js 15 App Router, React 19, TypeScript, Tailwind v4. **Static export only** (`frontend/next.config.ts: output: "export"`) — the frontend has no server routes, no API handlers, no server actions; everything in `frontend/app`/`frontend/lib` runs in the browser. Consequently every frontend secret is `NEXT_PUBLIC_*` and ships to the client (Gemini key, `NEXT_PUBLIC_API_URL`, USDA key). On Vercel `basePath` is empty; the `GITHUB_REPOSITORY`-based `basePath`/`assetPrefix` in `next.config.ts` only activates under GitHub Actions, so asset URLs still go through `lib/basePath.ts` (`NEXT_PUBLIC_BASE_PATH`), e.g. `app/layout.tsx` icon/manifest paths.

**Backend deploy:** `backend/src/main.ts` is the long-running server (local dev + Docker). On Vercel, `backend/src/serverless.ts` boots Nest once per warm Lambda and `backend/api/index.ts` re-exports it; `backend/vercel.json` rewrites all paths to that one function (Nest's `setGlobalPrefix("api")` router matches). Prisma uses a pooled `DATABASE_URL` (Neon PgBouncer) at runtime and `DIRECT_URL` for migrations. Migrations are **not** run on boot in serverless — `.github/workflows/backend-deploy.yml` runs `prisma migrate deploy` against Neon on push. **Mobile:** Capacitor bundles the static `out/`, so set `NEXT_PUBLIC_API_URL` to the deployed backend URL before `cap sync`, and include `capacitor://localhost` + `http://localhost` in the backend `CORS_ORIGINS`.

Auth and cloud sync run on our own **Node.js (NestJS) + PostgreSQL backend** in `backend/` (own `package.json`/`tsconfig`), replacing the former Supabase setup. Prisma (`backend/prisma/schema.prisma`) models a **normalized** schema (users, builtin/custom workouts, moves, sets, active session, completion dates, day entries, food entries, chat messages). The browser reaches it over plain `fetch` via `lib/api/client.ts` (`NEXT_PUBLIC_API_URL` + bearer JWT in localStorage). See `backend/README.md`.

### State: local-first, cloud-synced

`hooks/useGymStore.ts` is the single source of truth for all app data. It owns one `AppData` object (`lib/types.ts`) and exposes every mutation (sets, moves, sessions, food log, coach plan application). The flow:

1. `lib/storage.ts` persists `AppData` to `localStorage` (`STORAGE_KEY = "armstrong-gym-v1"`). `loadAppData()` merges over `createDefaultAppData()` and runs migrations (`workoutDayLog`, legacy completion dates) — preserve this merge when adding fields.
2. Every mutation goes through `persist()`, which writes localStorage **and** calls `scheduleCloudSync()` (`lib/cloudSyncScheduler.ts`) — an 800ms debounced `PUT /api/plan` to the backend.
3. On login, `lib/userPlanSync.ts: syncUserPlanOnLogin()` pulls the remote plan and **overwrites local**, except `activeSession`, which is preserved from local (you don't lose an in-progress workout on sync). This active-session merge appears in both `userPlanSync` and `useGymStore.syncForUser` — keep them consistent.

The cloud payload (`UserPlanPayload`) is still `{ appData, coachChat, onboardingChat }` over the wire (`lib/api/plan.ts`). The backend's `plan.mapper.ts` explodes that payload into normalized tables on write (whole-blob replace in a transaction) and reconstructs it on read, so the **frontend merge logic is unchanged** — only the transport swapped (Supabase SDK → `fetch`). When adding an `AppData` field, update `backend/src/plan/plan.types.ts` + `plan.mapper.ts` (and possibly the Prisma schema) alongside the frontend.

Auth is email/password against the backend (`POST /api/auth/{signup,signin}`, `GET /api/auth/me`) via `contexts/AuthContext.tsx` + `lib/api/auth.ts`; bcrypt hashes + JWT, token kept in localStorage. Both auth and cloud sync are **optional**: `isApiConfigured()` (`NEXT_PUBLIC_API_URL`) / `isGeminiConfigured()` gate features so the app fully works with no backend (pure localStorage).

### Social sign-in (Google + Apple)

`POST /api/auth/google` (Google ID token) and `POST /api/auth/apple` (Apple identity token). The backend verifies tokens in `backend/src/auth/social-verify.ts` — Google via `google-auth-library` (audience = `GOOGLE_CLIENT_IDS`, a comma list of web/iOS/Android client IDs), Apple via `jose` against Apple's JWKS (issuer `appleid.apple.com`, audience = `APPLE_CLIENT_IDS`). `AuthService.signInWithSocial` **finds-or-links** by stable provider subject (`googleSub`/`appleSub` columns), falling back to verified email, else creates the account. SSO-only accounts have `passwordHash = null` (password sign-in is then refused). On the **web**, the GSI / Apple-JS widgets run in the browser (`lib/googleAuth.ts`, `lib/appleAuth.ts`, `*SignInButton`). On **native** (Capacitor), the webview blocks those, so the buttons branch via `lib/nativeSocialAuth.ts` to `@capgo/capacitor-social-login` (one plugin, Google + Apple, Cap 8). All paths POST the provider token to the same backend endpoints; the multi-audience verify accepts web/iOS/Android tokens for the same user. Each provider is gated by its config (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_APPLE_CLIENT_ID`+`_REDIRECT_URI`).

### AI coach: marker protocol

`lib/gemini.ts` talks to Google Gemini (`@google/genai`) directly from the browser. `getCoachModels()` returns a fallback chain (`FREE_TIER_MODELS`); `sendCoachMessage()` walks it, skipping 404'd/deprecated models and retrying 429/503 with backoff. `formatCoachError()` maps API errors to user-facing text.

The coach changes app state by emitting **embedded marker tokens** in its chat reply, which the client parses out and applies. This is the core integration pattern — the system prompts instruct the model to append exactly one marker line, never shown to the user:

- `[[WORKOUT_CHANGE:{...}]]` and `[[GYM_PLAN:{...}]]` — parsed in `lib/coachWorkout.ts`, applied via `applyWorkoutChange` / `applyGymPlan`
- `[[DIET_PLAN:{...}]]` — parsed in `lib/coachDiet.ts`, applied via `applyDietPlan`
- Onboarding markers `[[CONTINUE_PROMPT]]` / `[[PLAN_READY]]` — `lib/onboardingCoach.ts`

System prompts (`COACH_SYSTEM_PROMPT` in `gemini.ts`, plus diet/onboarding prompt fragments) define the exact marker JSON shape. When changing a marker's payload, update both the prompt that asks for it and the parser that consumes it.

### Workouts model

Four builtin split types (`push`/`leg`/`abs`/`pull`, `WorkoutType`) plus user `customWorkouts`. `lib/workouts.ts` resolves a `workoutId` (builtin or custom) to a `WorkoutTemplate` and is the place for template mutation helpers. A running workout is an `ActiveSession` holding per-set weights/reps, completed set ids, rest timer, and a `baselineWorkout` snapshot used to revert on cancel. `coachPlanActive` hides builtin split days in favor of coach-imported custom days.

### UI

`app/` has three routes: `/` (`HomeScreen`), `/workout` (active session), `/landing` (marketing + onboarding coach). `components/AppShell.tsx` wraps the app; `components/ui/` holds the cyber/terminal-themed primitives. Most data-touching components consume `useGymStore` and the storage helpers in `lib/` rather than reaching into localStorage directly — follow that.

## Environment

**Frontend:** copy `frontend/.env.example` → `frontend/.env.local`. All keys optional; app degrades gracefully. `NEXT_PUBLIC_GEMINI_API_KEY` (coach), `NEXT_PUBLIC_API_URL` (auth+sync backend), `NEXT_PUBLIC_USDA_API_KEY` (food search, defaults to `DEMO_KEY`), `NEXT_PUBLIC_GEMINI_MODEL` (override model chain). On Vercel set these in the frontend project's env vars.

**Backend:** copy `backend/.env.example` → `backend/.env` (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGINS`). On Vercel set the same in the backend project's env vars (pooled `DATABASE_URL`, direct `DIRECT_URL`); add `DIRECT_URL` as a GitHub Actions secret for the migration workflow. `npm install && npm run prisma:migrate && npm run start:dev`, or `docker compose up --build` for the whole stack.

**Backend:** `backend/` — copy `backend/.env.example` → `backend/.env` (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGINS`). `npm install && npm run prisma:migrate && npm run start:dev`. Or run the whole stack (Postgres + API + static web behind nginx) with `docker compose up --build` — see `docker-compose.yml`.

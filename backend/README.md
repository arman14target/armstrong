# Armstrong Backend

Node.js ([NestJS](https://nestjs.com)) + PostgreSQL ([Prisma](https://www.prisma.io)) API for the Armstrong gym tracker. Provides **email/password auth** (bcrypt + JWT) and **cloud sync** of each user's plan. Replaces the previous Supabase setup; the frontend (static Next.js export) talks to it over plain `fetch`.

## Endpoints (prefixed `/api`)

| Method | Path           | Auth | Purpose                                            |
| ------ | -------------- | ---- | -------------------------------------------------- |
| POST   | `/auth/signup` | —    | Create account, returns `{ token, user }`          |
| POST   | `/auth/signin` | —    | Log in, returns `{ token, user }`                  |
| GET    | `/auth/me`     | JWT  | Current user `{ user }`                             |
| GET    | `/plan`        | JWT  | `{ plan }` — full payload or `null` if never synced |
| PUT    | `/plan`        | JWT  | Replace the user's plan (whole-blob upsert)         |
| DELETE | `/plan`        | JWT  | Clear the user's plan rows                          |

`Authorization: Bearer <token>` for the JWT routes.

## Data model

The wire payload is `{ appData, coachChat, onboardingChat }` (identical to the old shape, see `src/plan/plan.types.ts`). `src/plan/plan.mapper.ts` explodes it into a **normalized** schema (`prisma/schema.prisma`): users, builtin/custom workouts, moves, sets, active session, completion dates, workout day entries, food entries, chat messages. Deeply-nested settings (nutrition profile, baseline-workout snapshot, set weight/rep maps, `workoutSetupSeen`) stay as `jsonb` columns on purpose. Writes replace the whole plan inside one transaction, matching the client's overwrite-on-sync contract.

## Local development

```bash
cp .env.example .env          # set DATABASE_URL + JWT_SECRET
npm install
npm run prisma:migrate        # apply migrations to your local Postgres
npm run start:dev             # http://localhost:4000/api
```

Point the frontend at it with `NEXT_PUBLIC_API_URL=http://localhost:4000` in `../.env.local`.

## Docker

`docker compose up --build` from the repo root brings up Postgres, this API (migrations run on boot via `prisma migrate deploy`), and the static web app behind nginx. `src/main.ts` is the long-running server used here and in local dev.

## Deploy: Vercel serverless + Neon

The same Nest app runs serverless on Vercel via `src/serverless.ts` (boots once per warm Lambda) + `api/index.ts` (the function Vercel serves) + `vercel.json` (rewrites every path to that function).

1. **Neon** — create a free Postgres project. Grab two connection strings:
   - Pooled (host contains `-pooler`) → `DATABASE_URL` (append `?sslmode=require&pgbouncer=true&connection_limit=1`).
   - Direct (no `-pooler`) → `DIRECT_URL`.
2. **Vercel** — new project from this repo, **root directory = `backend`**. Set env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGINS` (frontend domain + `capacitor://localhost,http://localhost` for mobile). Vercel auto-deploys the function on every push.
3. **Migrations** — add `DIRECT_URL` as a GitHub Actions secret. `.github/workflows/backend-deploy.yml` runs `prisma migrate deploy` against Neon on every backend push, before the new function serves traffic.

Point the frontend at the deployed function with `NEXT_PUBLIC_API_URL=https://<backend>.vercel.app`.

## Exercise catalog

Seed the global exercise catalog from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (~873 exercises, 2 demo photos each):

```bash
npm run seed:exercises        # uses DATABASE_URL; idempotent
```

Admin endpoints (`/api/admin/exercises*`) list/detail exercises and upload/delete media. Uploaded media go to **Cloudinary** — set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (free account at cloudinary.com). Without them, seed images still work; uploads are disabled.

## Health check

`GET /api/health` → `{ "status": "ok", "db": "up", "uptime": <seconds> }`, or `503` with `db: "down"` if Postgres is unreachable. No auth. Point an uptime monitor (UptimeRobot / BetterStack free tier) at `https://api.armstrong-fitness.com/api/health`.

## Ordered release (optional, recommended)

By default Vercel auto-deploys the backend on push and the migration runs in parallel — a brief window where new code can hit the old schema. To make it ordered (migrate → then deploy):

1. Vercel backend project → create a **Deploy Hook** (Settings → Git). Add its URL as the GitHub Actions secret `VERCEL_BACKEND_DEPLOY_HOOK`.
2. Same project → turn **off** automatic git deploys (Settings → Git → "Ignored Build Step" returning exit 0, or disconnect auto-deploy).

Now `.github/workflows/backend-deploy.yml` migrates Neon first, then fires the deploy hook. Until the secret exists, that step is skipped and Vercel keeps auto-deploying (current behavior).

## Environment

| Var              | Default                  | Notes                              |
| ---------------- | ------------------------ | ---------------------------------- |
| `DATABASE_URL`   | —                        | Postgres connection string         |
| `JWT_SECRET`     | `change-me-in-production`| **Set a long random value in prod** |
| `JWT_EXPIRES_IN` | `30d`                    | Access token lifetime              |
| `PORT`           | `4000`                   | API port                           |
| `CORS_ORIGINS`   | `http://localhost:3000`  | Comma-separated allowed origins    |

# Armstrong Admin

Staff-only admin dashboard for the Armstrong gym tracker. Next.js static export (same stack + theme as `frontend/`), deployed as its own Vercel project. Talks to the shared backend's `/api/admin/*` routes with a **separate** admin auth token.

## Features

- **Dashboard** — total/new users (today/7d/30d), coach-plan + nutrition adoption, active sessions, workouts/food logged, 14-day signup chart.
- **Users** — search, paginate, **disable/enable** (locks the user out), **delete** (SUPERADMIN only).
- **Admins** (SUPERADMIN only) — list staff, create new admins with a role, disable admins.
- **Exercises** — browse the catalog (search, muscle filter, paginate), open an exercise for detail (fields + instructions), and upload/delete images or video per exercise (Cloudinary).

## Auth model

Admins are a separate `admins` table — not app `User`s. Sign-in (`/api/admin/auth/signin`) issues a JWT signed with `ADMIN_JWT_SECRET` (distinct from the user secret); the token is stored in `localStorage` and sent as a bearer. Two tiers:

| Role | Can |
|------|-----|
| `ADMIN` | view stats, search users, disable/enable users |
| `SUPERADMIN` | everything + delete users + manage admins |

## Local development

```bash
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                     # http://localhost:3001
```

Create the first admin against your backend DB:

```bash
cd ../backend
npm run admin:create -- you@example.com 'StrongPass1' SUPERADMIN
```

Or run the whole stack (`docker compose up --build` from the repo root) — admin is served at `http://localhost:8081`.

## Deploy (Vercel — third project)

1. New Vercel project, import the repo, **Root Directory = `admin`**.
2. Env var `NEXT_PUBLIC_API_URL = https://api.armstrong-fitness.com`.
3. Domain → `admin.armstrong-fitness.com`.
4. Add that origin to the backend's `CORS_ORIGINS`, redeploy backend.
5. Set `ADMIN_JWT_SECRET` on the backend project (separate from `JWT_SECRET`); create the first admin via the script against Neon.

`NEXT_PUBLIC_API_URL` is baked at build time — change it ⇒ redeploy.

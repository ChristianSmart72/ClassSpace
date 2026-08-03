# ClassSpace

A mobile-first academic organiser for Nigerian university students. Replaces the chaos of a class WhatsApp group with a structured space per department and level — announcements, course files, timetables, and opportunities.

## Stack

- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4, PWA-enabled (custom SW: offline, push, install prompt)
- **Backend**: Fastify 5, TypeScript
- **Database**: Turso (libSQL) via `@libsql/client` — NOT sqlite/better-sqlite3
- **File storage**: Uploadthing CDN (browser uploads directly, serverless-friendly)
- **Auth**: JWT (email/password + bcrypt)
- **Push**: web-push + VAPID

## How to run

Two processes run in parallel:

| Workflow | Command | Port |
|---|---|---|
| Backend API | `cd server && npm run dev` | 3001 |
| Start application | `cd client && npm run dev` | 5000 |

The Vite dev server proxies `/api` requests to `http://127.0.0.1:3001`.

## Environment variables (all required)

| Variable | Required | Notes |
|---|---|---|
| `JWT_SECRET` | Yes | Random hex — use `openssl rand -hex 32` |
| `VAPID_SUBJECT` | Yes | e.g. `mailto:you@example.com` |
| `VAPID_PUBLIC_KEY` | Yes | `npx web-push generate-vapid-keys --json` |
| `VAPID_PRIVATE_KEY` | Yes | from same command — keep private |
| `TURSO_DB_URL` | Yes | `libsql://<db>.turso.io` or `file:./dev.db` |
| `TURSO_DB_TOKEN` | Yes | `turso db tokens create <db>` |
| `UPLOADTHING_SECRET` | Yes | uploadthing.com → API Keys |
| `DB_RESET_TOKEN_HASH` | No | bcrypt hash for `/api/db/reset` |
| `PORT` / `HOST` / `NODE_ENV` | No | defaults 3001 / 0.0.0.0 / dev |

There is no `.env` checked in — export these before `npm run dev` or `npm start`.

## Seeding

The server auto-seeds demo data on first run if the `pre220` space does not exist (`npm run seed` in `server/` re-runs it). Demo logins `christian@classspace.app` / `student@classspace.app`, password `demo1234`, join code `PRE-220`.

## Production build

```bash
cd client && npm run build
cd server && npm run build
NODE_ENV=production node server/dist/index.js
```

In production the Fastify server serves the built client from `client/dist` with SPA fallback.
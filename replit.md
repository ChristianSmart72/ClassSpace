# ClassSpace

A mobile-first academic organiser for Nigerian university students. Replaces chaos in WhatsApp groups with a structured space per department and level — announcements, course files, timetables, and opportunities.

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4, PWA-enabled
- **Backend**: Fastify 5 + SQLite (better-sqlite3) + JWT auth
- **Monorepo**: `client/` and `server/` with a root `package.json` for concurrently

## How to run

Two workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| Backend API | `cd server && npm run dev` | 3001 |
| Start application | `cd client && npm run dev` | 5000 |

The Vite dev server proxies `/api` requests to `http://127.0.0.1:3001`, so the frontend always talks to the backend through a single origin.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `JWT_SECRET` | Yes (production) | JWT token signing. Falls back to a hardcoded default in dev — set a real secret before deploying. |
| `DATABASE_URL` | No | SQLite path. Default: `./data/classspace.db` |
| `PORT` | No | API port. Default: `3001` |

## Seeding

The server auto-seeds demo data on first run if the `users` table is empty. To re-seed manually: `cd server && npm run seed`.

## Production build

```bash
cd client && npm run build
cd server && npm run build
NODE_ENV=production node server/dist/index.js
```

In production the Fastify server also serves the built client from `client/dist`.

## User preferences

- Keep the existing project structure (client/server monorepo). Do not restructure or migrate unless explicitly asked.

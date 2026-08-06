# ClassSpace — Deployment (Render)

## Architecture of the deploy

Single **Render Web Service** (free tier) running one Node process that serves both the built client and the API. `render.yaml` is the Blueprint; the service rebuilds on every push to `main`.

- Build: `cd client && npm ci && npm run build && cd ../server && npm ci && npm run build`
- Start: `NODE_OPTIONS="--max-old-space-size=384" node server/dist/index.js`
- Health check: `GET /api/health`
- In prod, Fastify serves `client/dist` statically (immutable 365d) and falls back to `index.html` for SPA routes.

## Required environment variables

| Var | Where to get it |
|---|---|
| `JWT_SECRET` | `openssl rand -hex 32` (Render can auto-generate) |
| `VAPID_SUBJECT` | `mailto:` address (any) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys --json` |
| `TURSO_DB_URL` | Turso: `libsql://<db>-<org>.turso.io` (or `file:./dev.db` locally) |
| `TURSO_DB_TOKEN` | `turso db tokens create <db>` |
| `UPLOADTHING_SECRET` | uploadthing.com → API Keys |
| `DB_RESET_TOKEN_HASH` | optional bcrypt hash for `/api/db/reset` |
| `PORT` / `HOST` / `NODE_ENV` | optional (Render sets PORT; `NODE_ENV=production`) |

The server **fails to start** if any required var is missing (`validateEnv()`).

## Deploying

1. `git push origin main` → Render auto-rebuilds.
2. Watch the deploy log: expect `Build successful 🎉` then `Your service is live 🎉`.
3. Verify: `curl https://<your-service>.onrender.com/api/health` → `{"status":"ok","db":"ok",…}`.

### If the build fails (troubleshooting)

- **TS errors from `tsc -b`** (client) — the build is strict (`noUnusedLocals`, `noUnusedParameters`, modern TS lib). Reproduce locally with `cd client && npm run build`. Common: unused variables, `Uint8Array<ArrayBufferLike>` not assignable to `BlobPart` (cast with `as BlobPart[]`), DOM lib type drift. Fix locally and push.
- **Server `tsc` errors** — `cd server && npm run build`.
- **Runtime 500s** — Render hides internal messages in prod (generic `Internal server error` for 5xx). Reproduce locally, or temporarily check the server logs (the error handler logs request/url/body presence). Known historical causes: `Number()` on a space slug, SQL against a column that doesn't exist (migrations pending — run the app once so `createTables()` applies migrations), UploadThing key expiry.
- **Health check red** — see `/api/health/upload` for UploadThing, `/api/health` for DB.

## Local development

```bash
npm install --workspaces          # or: cd client && npm i && cd ../server && npm i
cd server && npm run seed         # optional demo data
npm run dev                       # client :5000 (proxy /api → :3001), server :3001
```

For a fully local DB: `TURSO_DB_URL=file:./dev.db TURSO_DB_TOKEN=local` on the server process.

## Release notes for the next deployer

- Repo pushes after `2026-08-06` include the deep-debug fixes (see `docs/CONTINUITY.md`). The deployed site at https://classspace-uffa.onrender.com was last verified green after those fixes.
- The service was created via the Blueprint; env secrets were set manually in the Render dashboard (they're `sync: false` in `render.yaml` so they aren't overwritten on push).
- `NODE_OPTIONS="--max-old-space-size=384"` matters on the free instance (fits in memory).
- Free-tier instances sleep when idle; the first request after sleep can be slow (cold start).

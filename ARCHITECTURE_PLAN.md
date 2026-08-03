# ClassSpace Architecture Plan

Last updated: 2026-08-03 — items below are annotated with their **current status**. Anything marked ✅ is done; 🔲 is still open.

---

## Critical Issues

### 🔴 Security & Data Loss

| Priority | Issue | Fix | Status |
|----------|-------|-----|--------|
| P0 | `POST /api/demo/reset` had no auth — anyone could wipe data | Requires JWT (`authMiddleware`); there is also a token-protected `POST /api/db/reset` using `DB_RESET_TOKEN_HASH` | ✅ Done |
| P0 | Hardcoded JWT secret in source | `lib/config.ts` now requires `JWT_SECRET` from env — server boots only if present. `render.yaml` auto-generates it | ✅ Done |
| P0 | SQLite on Render ephemeral disk — data lost on restart | Migrated to **Turso (libSQL)** — cloud DB, no disk dependence | ✅ Done |
| P0 | No membership checks on GET endpoints | `isSpaceMember()` enforced on announcements, materials, opportunities, polls, timetable, space members, materials summary | ✅ Done |
| P1 | `GET /api/share/space/:id` leaked invite code | **Not a leak — by design.** `JoinPreview` requires `invite_code` from the share response to join (`POST /api/spaces/join`); share links use unguessable nanoid space IDs and joining is rate-limited (100/min) | ✅ Done — verified by design |
| P1 | Files stored as base64 TEXT in DB — doesn't scale | Replaced with **Uploadthing CDN** — DB stores uploaded file URL only; the browser uploads directly to the CDN with progress | ✅ Done |

### 🟡 High Impact

| Issue | Fix | Status |
|-------|-----|--------|
| No transactions on multi-step writes | Atomic Turso `client.batch()` everywhere multi-statement: create-space, create-announcement (+attachments), create-poll (+options via `last_insert_rowid()`), reaction toggle (delete-opposite + insert). Verified working locally | ✅ Done |
| Push test notification empty spaceId | `sendPushToSpaceMembers()` called with real spaceId after insert | ✅ Done |
| No rate limiting | `@fastify/rate-limit` registered globally (100/min) | ✅ Done |
| Demo fallback data in screens | Removed fake DEMO_OPPS/demo attachments; materials with no file redirect to a demo file URL | ✅ Done |
| No localStorage cache for materials/polls/opps | All four now cached (`cachedMaterials:<courseId>`, `cachedPolls:<spaceId>`, `cachedOpportunities:<spaceId>`) with offline fallback + toast | ✅ Done |
| `formatRelativeTime` duplicated | Extracted once into shared lib | ✅ Done |
| No input validation | Per-route validators in `lib/validate.ts` (email, URL, lengths, positive ints, dates) wired into auth, announcements, materials, polls, opportunities, spaces | ✅ Done |
| ~80 `as any` | 86 → 3 remaining (multipart part, JSON body cast, error handler — all intentional) | ✅ Done |
| No graceful shutdown (SIGTERM) | SIGTERM/SIGINT → `shutdown()` closes Turso client, exits 0 | ✅ Done |
| No security headers | `@fastify/helmet` registered | ✅ Done |
| No toast system | Global toast store (`store/toastStore.ts`) + `<Toaster />` in App; success/error on create/delete/vote/upload; "offline — showing cached content" info toast | ✅ Done |

### 🟢 Medium — Polish / Consistency

| Issue | Fix | Status |
|-------|-----|--------|
| No migration system | Versioned migrations in `schema.ts`: `_migrations` table, batch-applied in order, PRAGMA column-exists guard for pre-migration ALTERs | ✅ Done |
| `navigate(-1)` vs explicit paths | Consistent explicit routing | ✅ |
| Delete confirmation varies across screens | All delete flows use `confirm()` consistently (announcement, material ×2, timetable entry) | ✅ Done |
| Dead code | `resetDemo()` used by demo reset; FilterBar/TopBar removed | ✅ |
| Node not pinned | `engines: >=22 <25` in all package.json + root `.node-version` (22) + `nodeVersion: 22.14.0` in render.yaml | ✅ Done |
| Health check doesn't verify DB | `/api/health` runs `SELECT 1` against Turso — 503 + `db: down` on failure; `/api/health/upload` still checks Uploadthing | ✅ Done |

---

## Current Production Architecture

- **DB**: Turso (libSQL). `GET/POST/PATCH/DELETE` via `@libsql/client`. Atomic multi-statement writes use `client.batch()`.
- **Uploads**: Uploadthing v7. Client posts directly to the CDN (`genUploader` → `/api/uploadthing` fastify handler at 1GB max), server persists the returned URL. Materials & announcement attachments store `file_url`.
- **Auth**: JWT Bearer (jsonwebtoken), bcrypt password hashing, `authMiddleware` guard.
- **Push**: web-push + VAPID, `push_subscriptions` table, `sendPushToSpaceMembers()`.
- **Serving**: Fastify serves `client/dist` statically + SPA fallback in production.
- **Routing table**: see `README.md` or `server/src/routes/*.ts`.

## Implementation Notes for Future Work

1. **Uploads** — direct-to-CDN path is server-light and fast; keep it. If a CDN file is deleted upstream, downloads 404 — the demo fallback URL handles seeded materials.
2. **Multi-step writes** — use Turso `client.batch()` (NOT `BEGIN/COMMIT` via `execute`, which fails on the Turso HTTP transport).
3. **Env** — all required vars enumerated in `server/src/lib/config.ts`; set on Render (secrets `sync: false`).
4. **Client offline** — announcements are locally cached; consider caching materials/polls for full offline.
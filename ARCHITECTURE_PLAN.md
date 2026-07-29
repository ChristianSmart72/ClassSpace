# ClassSpace Architecture Plan

Generated 2026-07-29. Use this guide when ready to implement systematic improvements.

---

## Critical Issues

### 🔴 Security & Data Loss

| Priority | Issue | Fix |
|----------|-------|-----|
| P0 | `POST /api/demo/reset` has no auth — anyone can wipe all data | Gate behind `NODE_ENV !== 'production'` |
| P0 | Hardcoded JWT secret `classspace-hackathon-2026` in source code | Read from env only, no fallback |
| P0 | SQLite on Render ephemeral disk — all data lost on restart/deploy | Migrate to PostgreSQL or attach Persistent Disk |
| P0 | No space membership checks on GET endpoints — any auth user reads any space | Add membership verification to all GET /spaces/:id/* routes |
| P1 | `GET /api/share/space/:id` leaks invite code to anyone | Require auth or rate-limit, or remove invite code from response |
| P1 | Files stored as base64 TEXT in SQLite — doesn't scale, memory-heavy | Store on filesystem/external storage; DB holds path only |

### 🟡 High Impact

| Issue | Fix |
|-------|-----|
| No transactions on multi-step writes (reactions, PATCH, votes) | Wrap in `db.transaction()` |
| Push test notification passes empty spaceId — never delivers | Fix `sendPushToUser()` call to use actual spaceId |
| No rate limiting on login/join/POST endpoints | Register `@fastify/rate-limit` |
| Demo fallback data in 4 screens makes app feel fake | Remove `DEMO_OPPS`, `demoAttachments()` — show empty states |
| Materials/polls/opportunities have no localStorage cache | Add `cacheMaterials()`, `cachePolls()`, etc. like announcements |
| `formatRelativeTime` duplicated in 4 files with different logic | Extract to `src/lib/time.ts` |
| No input validation (email, URLs, dates, numeric IDs) | Add Zod schemas to all routes |
| ~80 `as any` casts bypass TypeScript | Replace with proper types or type assertions |
| No graceful shutdown (SIGTERM) | Add `process.on('SIGTERM')` → close DB, flush WAL |
| No security headers (CSP, XFO, etc.) | Register `@fastify/helmet` |
| No toast/notification system for API errors | Add toast context + hook |
| Opportunities page bypasses contentStore (dead store methods) | Either use store or remove dead code |

### 🟢 Medium — Polish / Consistency

| Issue | Fix |
|-------|-----|
| Inline `CREATE TABLE IF NOT EXISTS` — no migration system | Versioned migrations with `_migrations` table |
| `navigate(-1)` vs explicit paths (inconsistent) | Standardize on explicit paths |
| Delete confirmation pattern varies across 3 screens | Extract shared `confirmAndDelete()` utility |
| Dead code: `resetDemo()` never called | Remove unused API function |
| Dead components: `FilterBar`, `TopBar` never used | Remove or implement |
| `@fastify/multipart` registered but unused | Either implement multipart upload or remove |
| No Node version pinned | Add `.node-version` and `engines.node` |
| Health check doesn't verify DB | Add `SELECT 1` probe |
| No CORS restrictions in production | Set specific origin in production |

---

## Implementation Phases

### Phase 1 — Security (half-day)

1. `server/src/routes/demo.ts` — gate behind `NODE_ENV !== 'production'`
2. `server/src/lib/jwt.ts` — remove hardcoded fallback secret
3. `server/src/middleware/auth.ts` — add `requireSpaceMembership(spaceId)` helper
4. Apply membership check to: announcements GET, materials GET, polls GET, timetable GET, members GET
5. `server/src/index.ts` — add graceful shutdown handler
6. `server/src/index.ts` — add DB check to `/api/health`
7. `server/src/routes/push.ts` — fix `sendPushToUser` empty spaceId bug
8. Install `@fastify/rate-limit` → apply to login, join, POST/PATCH/DELETE

### Phase 2 — Data Persistence (1-2 days)

#### Option A: PostgreSQL (Recommended, free)

**Implementation steps:**
1. Install `pg` and `postgres.js` in server
2. Create `server/src/db/pool.ts` — PostgreSQL connection pool using `DATABASE_URL` env var
3. Rewrite `schema.ts` as raw SQL migration file (`migrations/001_init.sql`)
4. Create `migrate.ts` — reads SQL files, tracks applied migrations in `_migrations` table
5. Rewrite all queries from `better-sqlite3` sync API to `postgres.js` tagged template queries
6. Update `seed-data.json` format for PostgreSQL (IDs as SERIAL not nanoid for int tables)
7. Update `connection.ts` to export the pool
8. Update `render.yaml`: add `DATABASE_URL` env var (Render PostgreSQL internal URL)
9. Add `render.yaml` service for PostgreSQL (free tier, 1 GB)

**Changes needed per query file:**
- `db.prepare('SELECT ...').get()` → `sql\`SELECT ...\` ` (returns first row)
- `db.prepare('SELECT ...').all()` → `sql\`SELECT ...\`` (returns array)
- `db.prepare('INSERT ...').run(...)` → `sql\`INSERT ... RETURNING id\` ` → get id from result
- `db.transaction(...)` → use `sql.begin(...)` or `WITH` / raw transaction
- `?` placeholders → `$1, $2, ...` or named `${param}` in tagged templates
- `nanoid` primary keys → `UUID` (or keep nanoid as TEXT)
- `ON CONFLICT` syntax (SQLite) → `ON CONFLICT ... DO UPDATE/SET` (PostgreSQL)

#### Option B: Persistent Disk (simpler, paid)

1. In Render dashboard: attach Persistent Disk (min $5/mo), mount at `/data`
2. Set `DB_PATH=/data/classspace.db` in env vars
3. No code changes needed

### Phase 3 — File Storage (1 day)

1. Add `server/uploads/` directory (gitignored)
2. On Render: points to persistent disk `/data/uploads/`
3. On VPS: local directory
4. `POST /api/courses/:id/materials` — write file to disk, store path in DB
5. `GET /api/materials/:id/download` — read from disk, stream response
6. Add file size/orphan cleanup utility
7. Remove `file_data` column from `materials` table (migration)

### Phase 4 — Architecture Hardening (1-2 days)

1. `npm install zod` in server
2. Create `server/src/lib/validate.ts` — reusable Zod schema runner
3. Add schemas for: register, login, create space, create announcement, create material, create poll, create opportunity, vote, react
4. Wrap multi-step operations in transactions
5. Extract `src/lib/time.ts` — `formatRelativeTime`, `formatDeadline`, `isExpired`
6. Import everywhere, delete duplicated implementations
7. Add localStorage caching to `contentStore` for materials, polls, opportunities
8. Create `client/src/lib/toast.ts` — toast context + hook (or use simple state)
9. Wire toasts to all error catch blocks in screens
10. Remove `DEMO_OPPS` from Home.tsx — use real data or proper empty state
11. Remove `demoAttachments()` from AnnouncementDetail.tsx — show proper empty state
12. Clean up dead code: `resetDemo()`, `FilterBar`, `TopBar`
13. Remove `@fastify/multipart` if not used, or implement actual multipart upload
14. Register `@fastify/helmet` with reasonable defaults
15. Set `origin` in CORS to specific production domain

### Phase 5 — Migration System (half-day)

1. Create `server/migrations/` directory
2. `server/src/db/migrate.ts`:
   - Creates `_migrations` table if not exists
   - Reads `.sql` files from `migrations/` sorted by name
   - Tracks which have been applied
   - Runs unapplied migrations in order
3. First migration: recreate all tables with proper constraints, cascading deletes, NOT NULL, CHECK
4. Replace inline `CREATE TABLE IF NOT EXISTS` in `schema.ts` with call to `migrate()`

---

## File Map

### Backend

| File | Purpose | Phase |
|------|---------|-------|
| `server/src/middleware/auth.ts` | Add `requireSpaceMembership()` helper | P1 |
| `server/src/lib/jwt.ts` | Remove hardcoded secret | P1 |
| `server/src/lib/validate.ts` | Zod schema runner | P4 |
| `server/src/db/connection.ts` | Rewrite for PostgreSQL or add graceful close | P2 |
| `server/src/db/schema.ts` | Replace with migration system | P5 |
| `server/src/db/migrate.ts` | New — versioned migration runner | P5 |
| `server/migrations/001_init.sql` | New — full schema | P5 |
| `server/src/db/pool.ts` | New — PostgreSQL connection pool | P2 |
| `server/src/routes/*.ts` | Add membership checks, input validation, transactions | P1/P4 |
| `server/src/routes/demo.ts` | Gate behind NODE_ENV | P1 |
| `server/src/routes/push.ts` | Fix empty spaceId bug | P1 |
| `server/src/index.ts` | Graceful shutdown, health check, rate-limit | P1 |

### Frontend

| File | Purpose | Phase |
|------|---------|-------|
| `client/src/lib/time.ts` | New — shared time formatting | P4 |
| `client/src/lib/toast.ts` | New — toast notification system | P4 |
| `client/src/api/content.ts` | Remove dead `resetDemo()` | P4 |
| `client/src/store/contentStore.ts` | Add cache for materials/polls/opps | P4 |
| `client/src/screens/Home.tsx` | Remove `DEMO_OPPS`, show empty state | P4 |
| `client/src/screens/AnnouncementDetail.tsx` | Remove `demoAttachments()` | P4 |
| `client/src/screens/Opportunities.tsx` | Either use contentStore or clean up | P4 |
| `client/src/components/layout/index.tsx` | Remove `FilterBar`, `TopBar` | P4 |

# ClassSpace — Database

Provider: **Turso** (libSQL) via `@libsql/client` (`server/src/db/connection.ts`). SQLite-compatible. In dev you can point `TURSO_DB_URL` at a local file (`file:./dev.db`) and `TURSO_DB_TOKEN` at any non-empty string.

## How the app talks to the DB

`getDb()` returns a wrapper exposing:
- `prepare(sql).get(...args)` / `.all(...args)` / `.run(...args)` — parameterised queries (`?` placeholders). `run()` returns `{ lastInsertRowid: number, changes }`.
- `execute(sqlOrStmt)` — raw.
- `batch(stmts)` — `client.batch()` (atomic multi-statement; each stmt `{ sql, args }`).
- `transaction(fn)` — manual BEGIN/COMMIT/ROLLBACK.
- `isSpaceMember(spaceId, userId)` — shared membership check.

Row types live in `server/src/db/rows.ts` (`SpaceRow`, `CourseRow`, `UserRow`, `AnnouncementRow`, `MaterialRow`, `OpportunityRow`, `TimetableRow`, `MembershipRow`, `ReactionRow`, `MyReactionRow`, `AttachmentRow`).

## Schema (`server/src/db/schema.ts`)

Tables (all timestamps stored as `datetime('now')` strings, UTC):

### users
`id` PK autoinc · `name` · `email` UNIQUE · `password_hash` (bcrypt) · `avatar`? · `role` ('member'|'rep') · `created_at`

### spaces
`id` **TEXT PK** — a readable slug (e.g. `pre220`, `300l-eng`) · `name` · `dept` · `level` · `uni` · `rep_id` → users · `invite_code` UNIQUE (6-char join code) · `created_at`
> ⚠️ This id is a string. Never `Number()` it in queries.

### space_members
`space_id` → spaces · `user_id` → users · `role` ('member'|'rep') · `joined_at` · UNIQUE(space_id, user_id)

### courses
`space_id` → spaces · `name` · `code` (e.g. CSC201) · `icon` (emoji) · `color_index` (0–4)

### announcements
`space_id` → spaces · `course_id`? → courses · `title` · `body` · `type` ('announcement'|'assignment'|'test'|'meeting'|'update') · `author_id` → users · `urgent` 0/1 · `pinned` 0/1 · `deadline`? · `venue`? · `instructions`? · `submission_method`? · `format`? · legacy `file_data`? (URL) `file_name`? `file_size`? · `created_at`

### announcement_attachments
`announcement_id` → announcements (CASCADE) · `file_url` (UploadThing URL) · `file_name` · `file_size` · `created_at`

### materials
`space_id` → spaces · `course_id` → courses · `name` · `file_data`? (UploadThing URL) · `file_size` · `file_type` (extension) · `category` (Slides|Assignments|Past Questions|Lab Resources|Books|Templates|Other) · `uploader_id` → users · `pinned` 0/1 · `downloads` (count) · `created_at`

### reactions
`announcement_id` → announcements (CASCADE) · `user_id` → users · `emoji` ('upvote'|'downvote') · `created_at` · UNIQUE(announcement_id, user_id, emoji)

### timetable
`space_id` → spaces · `course_id` → courses · `day` ('Monday'…'Sunday') · `start_time` / `end_time` ('HH:MM') · `venue`? · `lecturer`? · `cancelled` 0/1 (via migration)

### polls / poll_options / poll_votes
Stub tables for future polls. `polls` (space_id, author_id, question, closes_at) → `poll_options` (poll_id CASCADE, text, display_order) → `poll_votes` (poll_id CASCADE, option_id, user_id, voted_at, UNIQUE(poll_id, user_id)). No routes use them yet.

### opportunities
`space_id` → spaces · `author_id` → users · `title` · `description` · `category` (seminar|scholarship|internship|job|event|competition|bootcamp|other) · `link`? · `deadline`? · `eligibility`? (migration) · `pinned` 0/1 (migration) · `created_at`

### push_subscriptions
`user_id` → users (CASCADE) · `space_id` → spaces (CASCADE) · `endpoint` UNIQUE · `p256dh` · `auth` · `created_at`

There is also `_migrations` (name PK, applied_at) used by the migration runner.

## Migrations

Append-only list in `schema.ts`:
```ts
const MIGRATIONS = [{ name: 'add_opportunities_pinned', sql: 'ALTER TABLE opportunities ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0' }, ...]
```
- Runs on every boot via `createTables()`: creates tables + indexes, then applies any unapplied migration, recording it in `_migrations`.
- `alreadyApplied()` guards against ALTERs that were applied before the migration system existed (checks `PRAGMA table_info`).
- **Rules**: only add new entries **at the end**; never edit or reorder existing ones; each needs a unique `name`; they must be idempotent-friendly ALTERs (only ADD COLUMN is handled by the guard).

## Seed & reset

- `server/seed/seed-data.json` — demo space `pre220` (rep `christian@classspace.app` / `demo1234`, student `student@classspace.app` / `demo1234`, invite code `PRE-220`), courses, timetable, announcements, materials, opportunities.
- `npm run seed` in `server/` runs `seedDatabase()` directly.
- `POST /api/db/reset` (with bcrypt token) drops everything, recreates, reseeds.
- Seed cleanup for a legacy space (`invite_code 'PRE-220'` but id ≠ `pre220`) deletes per-table: announcements/materials/timetable/polls/opportunities/courses/space_members by `space_id`, then reactions by `announcement_id IN (…)`, and poll_options/poll_votes by `poll_id IN (…)`. ⚠️ reactions/poll_* have **no `space_id` column** — never delete those by `space_id`.

## Backups

None automated — Turso snapshots/backups apply (or copy the libsql file in dev). Recommend enabling Turso snapshots if this ever carries real data.
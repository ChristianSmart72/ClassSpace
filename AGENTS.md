# ClassSpace — Agent Instructions

> **First read `docs/CONTINUITY.md`** — it explains project state, what's verified, known limitations, and the gotchas you must never break. Then `docs/ARCHITECTURE.md` for the file map and data flows.

## Project structure
- `/projects/ClassSpace/` — project root
- `client/` — React 19 + Vite 8 + Tailwind CSS 4 frontend (PWA)
- `server/` — Fastify 5 + TypeScript API
- `docs/` — continuity, architecture, API, database, deployment guides
- `tests/` — Playwright E2E tests

## Ignore patterns
Respect `.opencodeignore` — skip node_modules, dist, build artifacts, lockfiles.

## Critical source files by area

### Backend (server/src/)
| File | Purpose |
|------|---------|
| `index.ts` | Server bootstrap: plugins, error handler, route registration, prod static hosting + SPA fallback |
| `routes/*.ts` | API routes: auth, spaces, announcements, materials, timetable, opportunities, reactions, push, share, reset (+ reset-page) |
| `db/schema.ts` | Turso schema: tables, indexes, **migrations** (append-only), seed-aware |
| `db/connection.ts` | `@libsql/client` wrapper: `getDb()`, `batch()`, `transaction()`, `isSpaceMember()` |
| `db/seed.ts` + `seed/seed-data.json` | Demo space `pre220` seed |
| `db/rows.ts` | Row type interfaces |
| `middleware/auth.ts` | JWT auth middleware (`request.user = { userId, email }`) |
| `lib/jwt.ts` | JWT sign/verify (7-day) |
| `lib/push.ts` | Web Push (VAPID) helpers: `sendPushToSpaceMembers`, `sendPushToUser` |
| `lib/upload.ts` | UploadThing server SDK: `uploadFile(Buffer/base64)`, `deleteFileByUrl`, `keyFromUrl` |
| `lib/uploadrouter.ts` | UploadThing fastify route handler for direct client uploads (`blob`, 1GB) |
| `lib/config.ts` | Required env validation (fails fast) |
| `lib/validate.ts` | Validators + `fail()` helper |
| `routes/reset.ts` | Admin DB reset (bcrypt-token-gated) |

### Frontend (client/src/)
| File | Purpose |
|------|---------|
| `App.tsx` | Router, protected/public route guards, ErrorBoundary, SW update listener |
| `main.tsx` | Bootstrap |
| `screens/*.tsx` | Pages: Landing, Login, Register, SetupWizard, Home, Space, CourseFiles, MaterialDetail, AnnouncementDetail, Timetable, Opportunities, Profile, JoinInput, JoinPreview |
| `api/*.ts` | Axios instance (`client.ts`, caches + offline fallback) + typed API modules (auth, spaces, content, timetable, opportunities) |
| `store/*.ts` | Zustand: authStore, spaceStore, contentStore, notificationStore, themeStore, toastStore, connectivityStore, updateStore, badgeStore |
| `lib/directUpload.ts` | UploadThing direct-to-CDN upload with progress |
| `lib/download.ts` | Download with progress + native fallback |
| `lib/time.ts` | relative time, formatSize, formatDate/Time, `canGoBack()` |
| `lib/push.ts` | Push subscription register/unregister |
| `sw.ts` | Service worker: offline caches, push, update protocol |
| `types/index.ts` | Shared interfaces + constants (ANNOUNCEMENT_TYPES, MATERIAL_CATEGORIES, OPPORTUNITY_CATEGORIES, DAYS, COURSE_COLORS, reactions) |

## Tech stack
- **Client**: React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Zustand 5, vite-plugin-pwa (injectManifest)
- **Server**: Node.js 22, Fastify 5, TypeScript, `@libsql/client` (Turso)
- **Storage**: UploadThing CDN (direct browser uploads, 1GB files)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Push**: web-push + VAPID
- **Tests**: Playwright

## Key conventions
- Mobile-first (6-inch screen, one-thumb nav); bottom-sheet modals for compose (`components/sheets/`)
- Dark/light theme via CSS custom properties (`--app-*`), see README colour table
- No chat/messaging — ClassSpace is a structured academic feed
- API under `/api/*`; errors `{ error: string }`
- TypeScript strict; client build is `tsc -b` (**noUnusedLocals on**) — unused vars fail the deploy
- **Space ids are TEXT slugs — never `Number()` them. Numeric ids: course, material, announcement, timetable, opportunity, attachment, poll.**
- SQLite 0/1 → always `Boolean()` before sending to the client
- Uploads go direct browser → UploadThing; the API only stores returned URLs
- Rep-gated mutations check `role === 'rep'` on `space_members`

## Commands to run before and after changes
- Verify client: `cd client && npm run build` (this is `tsc -b && vite build`; catches TS + lint-strict errors)
- Verify server: `cd server && npm run build` (`tsc`)
- Root: `npm run build` (both), `npm run dev` (both), `npm start` (prod serve)
- Seed: `cd server && npm run seed`

## Docs
- `docs/CONTINUITY.md` — state, verified features, known limitations, gotchas
- `docs/ARCHITECTURE.md` — architecture + file map
- `docs/API.md` — all endpoints
- `docs/DATABASE.md` — schema + migrations
- `docs/DEPLOYMENT.md` — env + Render
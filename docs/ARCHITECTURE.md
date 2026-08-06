# ClassSpace — Architecture

## System overview

```
Browser (React 19 PWA, Vite)
  │  axios (/api) + uploadthing direct-to-CDN
  ▼
Fastify 5 (single Web Service on Render)
  ├─ serves /api/* routes
  ├─ serves client/dist static files (production, SPA fallback → index.html)
  └─ talks to:
      ├─ Turso (libSQL, SQLite-compatible) — all persistence
      └─ UploadThing CDN — file storage (objects)
```

- One process serves both the built frontend and the API. In dev, Vite (port 5000) proxies `/api` → Fastify (port 3001).
- **Files never pass through the API**: the client uploads straight to UploadThing via the `blob` route (`POST /api/uploadthing`), then stores the returned URL in the DB. The server also keeps an upload path for legacy/base64 and multipart flows.
- **Pushes**: server sends Web Push (VAPID) to rows in `push_subscriptions`; the SW shows notifications and opens the app on click.

## Repository layout

```
/projects/ClassSpace
├── package.json            # root: dev/build/start orchestration (concurrently)
├── render.yaml             # Render Blueprint (service + env vars)
├── AGENTS.md               # agent instructions (points at docs/)
├── README.md               # product readme
├── docs/                   # ← read these: CONTINUITY, ARCHITECTURE, API, DATABASE, DEPLOYMENT
├── ARCHITECTURE_PLAN.md    # historical roadmap doc (superseded by docs/, keep for context)
├── PWA_OVERHAUL.md         # historical PWA notes (superseded by docs/)
├── client/                 # React frontend
│   ├── vite.config.ts      # PWA injectManifest config, /api proxy → :3001
│   ├── index.html
│   └── src/
│       ├── main.tsx        # bootstrap (StrictMode + <App/>)
│       ├── App.tsx         # router, route guards, ErrorBoundary, SW update listener
│       ├── sw.ts           # service worker (offline cache + push + update flow)
│       ├── index.css       # Tailwind v4 + CSS variables (theme tokens)
│       ├── api/            # axios instance + typed API functions
│       ├── components/     # layout/ (shell, nav), sheets/ (bottom sheets), ui/ (primitives)
│       ├── hooks/          # react hooks
│       ├── lib/            # time, download, directUpload, push helpers
│       ├── screens/        # one file per route
│       ├── store/          # zustand stores
│       └── types/          # shared types + constants (ANNOUNCEMENT_TYPES, etc.)
└── server/                 # Fastify backend
    ├── seed/seed-data.json # demo space seed
    └── src/
        ├── index.ts        # bootstrap: plugins, error handler, routes, static hosting
        ├── routes/         # auth, spaces, announcements, materials, timetable, opportunities, reactions, push, share, reset(+page)
        ├── middleware/auth.ts
        ├── lib/            # config (env), hash, jwt, push, upload, uploadrouter, validate
        └── db/             # connection (libsql wrapper), schema (tables+indexes+migrations), seed, rows (types)
```

## Server (Fastify) — key behaviours

- **Bootstrap** (`server/src/index.ts`): validates env (fails fast), registers helmet (CSP off), rate-limit (100 req/min), CORS, multipart (1 GB), compression; custom error handler hides internals in prod (`Internal server error` for 5xx except upload errors); creates tables; registers all route modules; in prod serves `client/dist` with 365d immutable caching and SPA fallback.
- **DB access**: `getDb()` returns a wrapper (connection.ts) over `@libsql/client` exposing `prepare(sql).get/all/run`, `execute`, `batch`. `run()` coerces `lastInsertRowid` to number. `transaction(fn)` does BEGIN/COMMIT/ROLLBACK manually. `isSpaceMember(spaceId, userId)` is the shared membership check.
- **Auth**: JWT (7-day). `authMiddleware` sets `request.user = { userId, email }`. Public endpoints: register, login, share previews, downloads, join (optional auth), `/api/db/reset`.
- **AuthZ rules**: membership for reads (spaces/announcements/timetable/materials/opportunities/reactions/push), `role === 'rep'` for writes (announcements, timetable, opportunities, materials upload). Members can delete their own materials (uploader check).
- **Error convention**: 400 with `{error}` via `fail()`, 401 auth, 403 authz, 404 not found, 409 conflict.

### Route modules → responsibilities

| File | Handles |
|---|---|
| `routes/auth.ts` | register, login, me (+ nested `space` when member) |
| `routes/spaces.ts` | create space (slug id + courses + rep membership), get space, join by invite code, members list, leave, my spaces |
| `routes/announcements.ts` | list (filters urgent/pinned/course-code, reaction counts), create (JSON `files` array or multipart, pushes to members), get one, delete, patch, download legacy file, shared view |
| `routes/materials.ts` | list (sort newest/oldest/downloads/alpha), upload (rep), download (302 → file URL, increments `downloads`), patch (pin), delete, per-space summary + recent, shared view |
| `routes/timetable.ts` | get (day-ordered), add, patch (cancel), delete — all rep-gated |
| `routes/opportunities.ts` | list, create (rep), patch (pin, rep), delete (rep) |
| `routes/reactions.ts` | upvote/downvote toggle (membership-gated) |
| `routes/push.ts` | subscribe (membership-gated), unsubscribe, test |
| `routes/share.ts` | public previews: space (id = slug **or** invite code), announcement, material, course |
| `routes/reset.ts` | destructive full DB reset + reseed (bcrypt token) |
| `routes/reset-page.ts` | renders a token form at `/reset` |

## Client — architecture

- **Routing** (`App.tsx`): public routes (Landing/Login/Register/Join*/share) vs `ProtectedRoute` (needs token) vs `PublicOnlyRoute`; `MainLayout` wraps the app shell (nav bar). Lazy-loaded screens. Global ErrorBoundary with refresh button.
- **State (zustand stores, `store/`)**:
  - `authStore` — user, token, init (validates token via `/auth/me`, offline fallback to cached user), login/register/logout; on login stores `spaceId`; registers push sub.
  - `spaceStore` — current space, courses, members, role, userSpaces; localStorage caching (`cachedSpace`, `cachedCourses`, `cachedRole`); offline restore.
  - `contentStore` — announcements cache for the feed + offline, create/delete/patch actions, reaction toggles.
  - `notificationStore`, `themeStore`, `toastStore`, `connectivityStore`, `updateStore`, `badgeStore` — smaller concerns.
- **API layer** (`api/`): `client.ts` is the axios instance — attaches JWT, caches GETs in localStorage (`apicache:*`), serves cache on network errors, invalidates on writes, clears caches on 401. Feature modules (`auth`, `spaces`, `content`, `timetable`, `opportunities`) wrap it.
- **Service worker** (`sw.ts`): precache manifest, `api-cache` StaleWhileRevalidate (80 entries), font + static CacheFirst, page NetworkFirst (5s timeout), offline fallback page, push + notification click handling, update message protocol with `UpdatePrompt`.
- **Uploads** (`lib/directUpload.ts`): `genUploader({ url: '/api/uploadthing', ... })` adds the bearer token and uploads with progress callbacks. `lib/download.ts` fetches with progress and falls back to native download.
- **Time helpers** (`lib/time.ts`): relative time, size formatting, date/time, `canGoBack()`.

## Data flows worth knowing

1. **Post announcement with files**: `PostAnnouncement.tsx` → `directUpload.uploadFiles('blob', ...)` (direct to UploadThing) → `POST /api/spaces/:id/announcements` JSON `{..., files: [{file_url, file_name, file_size}]}` → server inserts announcement + `announcement_attachments` rows → `sendPushToSpaceMembers`.
2. **Upload course material**: `UploadMaterial.tsx` → direct upload → `POST /api/courses/:id/materials` JSON `{name, category, file_url, file_name, file_size}`.
3. **Download**: `GET /api/materials/:id/download` (public) increments `downloads` and 302-redirects to the UploadThing URL; the client either follows it (anchor) or streams it with progress (`lib/download.ts`).
4. **Share**: `ShareSheet` builds `/join/:type/:id` links → `JoinPreview` fetches `/api/share/{space|ann|mat|course}/:id` (public) and shows a preview; space preview can call `POST /api/spaces/join` with the invite code.
5. **Reactions**: `POST /api/announcements/:id/react` toggles upvote/downvote (opposite is removed), returns counts. (UI buttons not yet wired — see CONTINUITY.md.)
6. **Offline**: SW serves cached pages; axios serves cached JSON on `ERR_NETWORK`; stores hydrate from localStorage.

## Conventions

- Mobile-first, one-thumb navigation; bottom-sheet modals for compose actions (`components/sheets/`)
- Dark/light via CSS custom properties in `index.css` (`--app-*` tokens) — see README colour table
- TypeScript strict; `tsc -b` on client enforces `noUnusedLocals`/`noUnusedParameters` — keep code clean
- API errors: `{ error: string }`; success payloads are plain JSON or `{ resource: {...} }`
- Boolean SQLite fields: convert with `Boolean()` at the route boundary
- No comments unless they explain a non-obvious invariant (e.g. the `last_insert_rowid` temp-table trick in announcements POST)

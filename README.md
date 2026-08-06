# ClassSpace

**A mobile-first academic organiser built for Nigerian university students.**

ClassSpace replaces the chaos of WhatsApp academic groups with one clean, structured space per department and level. Course reps post announcements, upload materials, and students can actually find what they need — without scrolling through 500 messages.

It is not a chat app. It does not replace WhatsApp. It sits alongside it as the single source of truth for everything academic.

## Why it exists

Every Nigerian university student knows the problem. The class WhatsApp group has 300 people. Important announcements get buried under memes, arguments, and off-topic threads within hours. Someone always misses a deadline because the message got lost. Study materials get shared once and vanish.

ClassSpace fixes this with a focused feed of structured announcements and a materials library organised by course — nothing else.

## Live demo

The deployed app auto-seeds a fully-populated demo space on first run. Use these credentials to explore:

| Role | Email | Password |
|---|---|---|
| Class rep (demo) | `christian@classspace.app` | `demo1234` |
| Student (demo) | `student@classspace.app` | `demo1234` |

Join code: **PRE-220**

## Features

- **Spaces** — one space per department and level (e.g. "300L Production Engineering, UNILAG"). Everyone in the class joins the same space via invite code. First-time users get a guided setup wizard.
- **Announcements** — structured posts with type tag (Assignment, Test, Update, Meeting), title, body, deadline, venue, and Urgent/Pin flags. Filterable by course or urgent/pinned. Upvote/downvote reactions.
- **Attachments** — up to 5 files per announcement, uploaded straight to the CDN with a live progress bar.
- **Course Materials** — files organised by course and category (Notes, Slides, Assignments, Past Questions, Lab Resources, Templates). Search, sort (newest / oldest / most downloaded / A–Z), pin, and one-tap download with a per-file progress view.
- **Fast file uploads** — the browser uploads directly to Uploadthing's CDN (no server relay), so even large course PDFs go fast and never stall the API. Byte-level progress is shown while uploading.
- **Schedule** — weekly timetable per space with day selector, course-colour-coded entries, venue and lecturer. Class reps can add/remove classes and post cancellations.
- **Opportunities** — scholarships, internships, competitions, and jobs posted to your space.
- **Sharing** — every announcement, material, course, and space has a shareable link that opens a clean preview — with an in-app share sheet.
- **Push notifications** — new/urgent announcements notify space members instantly (Web Push + VAPID), with per-user toggles.
- **PWA** — installable on Android/iOS home screen, offline-first with cached content + offline banner, app badge and in-app update prompt.
- **Dark & Light themes** — toggle, persisted per device.
- **Auth** — email/password with JWT sessions and bcrypt hashing.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| State | Zustand 5 |
| Backend | Node.js, Fastify 5, TypeScript |
| Database | Turso (libSQL) via `@libsql/client` |
| File storage | Uploadthing CDN (direct client uploads) |
| Push | web-push + VAPID |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| PWA | vite-plugin-pwa (injectManifest), Workbox 7 |
| Fonts | Plus Jakarta Sans, Inter |
| Deploy | Render (Web Service, free) |

## Project structure

```
classspace/
├── client/                  # React frontend (Vite)
│   ├── public/              # Static assets (icons, robots.txt, manifest)
│   ├── src/
│   │   ├── api/             # API client (axios + cache + offline fallback)
│   │   ├── components/      # Reusable UI components
│   │   │   ├── layout/      # App shell, nav, sidebar
│   │   │   ├── sheets/      # Bottom sheet modals (post, upload, share)
│   │   │   └── ui/          # Primitives (Badge, EmptyState, Logo…)
│   │   ├── screens/         # Pages (Space, CourseFiles, Timetable…)
│   │   ├── store/           # Zustand stores (auth, content, space)
│   │   ├── lib/             # Helpers (direct upload, push, time)
│   │   ├── sw.ts            # Custom service worker (offline + push)
│   │   └── types/           # TypeScript type definitions
│   ├── vite.config.ts
│   └── package.json
├── server/                  # Fastify backend
│   ├── seed/seed-data.json  # Demo space seed data
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── lib/             # jwt, push, upload, uploadrouter, config
│   │   ├── db/              # Turso connection, schema, seed, reset
│   │   └── index.ts         # Server entry point
│   └── package.json
├── tests/                   # Playwright E2E tests
├── docs/                    # CONTINUITY, ARCHITECTURE, API, DATABASE, DEPLOYMENT
└── README.md
```

## Getting started

### Prerequisites

- Node.js 22+
- npm
- A [Turso](https://turso.tech) database (or `file:<path>` for local dev)
- An [Uploadthing](https://uploadthing.com) app + API secret
- VAPID key pair (generate with `npx web-push generate-vapid-keys --json`)

### Environment variables

All required vars live on the `server/` process. There is no `.env` in the repo — create one or export them:

```bash
JWT_SECRET=…                 # REQUIRED — random secret: openssl rand -hex 32
VAPID_SUBJECT=mailto:you@example.com    # REQUIRED
VAPID_PUBLIC_KEY=…           # REQUIRED
VAPID_PRIVATE_KEY=…          # REQUIRED
TURSO_DB_URL=…               # REQUIRED — e.g. libsql://classspace-xxx.turso.io or file:./dev.db
TURSO_DB_TOKEN=…             # REQUIRED — turso db tokens create <db>
UPLOADTHING_SECRET=…        # REQUIRED — uploadthing.com → API Keys
DB_RESET_TOKEN_HASH=…        # OPTIONAL — bcrypt hash for the /reset admin endpoint
PORT=3001                    # optional, default 3001
HOST=0.0.0.0                 # optional, default 0.0.0.0
NODE_ENV=production          # set on Render
```

The server aborts at startup if any REQUIRED var is missing.

### Setup

```bash
# Install dependencies for both workspaces
npm install --workspaces

# Seed the demo space (optional but recommended for dev)
cd server && npm run seed
```

### Development

```bash
npm run dev
```

- Client (Vite) → `http://localhost:5000`
- Server (Fastify) → `http://localhost:3001` (Vite proxies `/api` → `:3001`)

### Build for production

```bash
npm run build
```

This type-checks + bundles the client with Vite (including the PWA service worker) and compiles the server with `tsc`.

### Run tests

```bash
# E2E tests (Playwright)
npx playwright test
```

## Deployment

The app deploys to **Render** as a single Web Service describing the client build + server + SPA fallback — see `render.yaml`. Render rebuilds on every push to `main`.

Key notes:

- The web build path is: `cd client && npm ci && npm run build && cd ../server && npm run build`
- Start: `NODE_OPTIONS="--max-old-space-size=384" node server/dist/index.js`
- Health check: `GET /api/health` (also `GET /api/health/upload` to verify Uploadthing connectivity)
- In production the Fastify server serves the built client static files and falls back to `index.html` for SPA routes
- All env vars above must be set on the Render service (`render.yaml` marks the secrets `sync: false` so they're never auto-generated incorrectly; set them manually)

## Current version

Full-stack production build: React 19 PWA on the front, Fastify 5 + Turso + Uploadthing on the back, JWT auth, push notifications, and offline-capable service worker.

## Design principles

- **Calm over busy.** Every screen should feel like a relief compared to a WhatsApp group.
- **Scannable in under 3 seconds.** A student opening an announcement should know the deadline and what they need to do before they finish reading the headline.
- **Mobile-first, always.** Design for a 6-inch screen with one thumb. Desktop is secondary.
- **No chat.** ClassSpace is not a messaging platform. No comments, replies, or social feed.
- **Nigerian context.** Built for ASUU strikes, portal issues, WhatsApp-first classmates, and mid-range Android phones.

## Colour palette

| Token | Value | Usage |
|---|---|---|
| `--app-bg` | `#0f0f11` | App background |
| `--app-surf` | `#18181c` | Card backgrounds |
| `--app-border` | `#2a2a32` | Borders |
| `--app-accent` | `#e8ff47` | Primary accent (electric yellow-green) |
| `--app-accent2` | `#5b6af0` | Secondary accent (indigo) |
| `--app-text` | `#f0f0f2` | Primary text |
| `--app-text-dim` | `#7a7a88` | Dimmed text |
| `--app-red` | `#ff5252` | Urgent / error |
| `--app-green` | `#52ffa0` | Active / success |
| `--app-orange` | `#ffb347` | Due soon / warning |

## Licence

MIT. Use it, fork it, build on it.

## Made by

Christian Smart — founder of ClassSpace, studying at UNIBEN, building for Nigerian students.

> Note: this project grows with every class it serves. If you're a Nigerian university student and it resonates, reach out — the best product decisions come from people who live the problem every day.

## Docs

The authoritative guides live in `docs/` — read these after cloning:

| Doc | What it covers |
|---|---|
| `docs/CONTINUITY.md` | **Start here** — project state, verified features, recent fixes, known limitations, gotchas |
| `docs/ARCHITECTURE.md` | System design, data flows, full file-by-file map |
| `docs/API.md` | Every endpoint, request/response shapes |
| `docs/DATABASE.md` | Schema, migrations, seed/reset |
| `docs/DEPLOYMENT.md` | Render deploy, env vars, troubleshooting |

`ARCHITECTURE_PLAN.md` and `PWA_OVERHAUL.md` are historical planning docs, kept for context but superseded by `docs/`.
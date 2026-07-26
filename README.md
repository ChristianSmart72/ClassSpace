# ClassSpace

**A mobile-first academic organiser built for Nigerian university students.**

ClassSpace replaces the chaos of WhatsApp academic groups with one clean, structured space per department and level. Course reps post announcements, upload materials, and students can actually find what they need — without scrolling through 500 messages.

It is not a chat app. It does not replace WhatsApp. It sits alongside it as the single source of truth for everything academic.

## Why it exists

Every Nigerian university student knows the problem. The class WhatsApp group has 300 people. Important announcements get buried under memes, arguments, and off-topic threads within hours. Someone always misses a deadline because the message got lost. Study materials get shared once and vanish.

ClassSpace fixes this with a focused feed of structured announcements and a materials library organised by course — nothing else.

## Features

- **Spaces** — one space per department and level (e.g. "300L Production Engineering, UNILAG"). Everyone in the class joins the same space via invite code.
- **Announcements** — structured posts with type tag (Assignment, Test, Update, Meeting), title, body, deadline, venue, and Urgent/Pin flags. Filterable by course.
- **Course Materials** — files organised by course and category (Notes, Slides, Assignments, Past Questions, Lab Resources, Templates).
- **Schedule** — weekly timetable per space with day selector and course-colour-coded entries.
- **Opportunities** — scholarships, internships, competitions, and jobs posted to your space.
- **Sharing** — every item has a shareable link. Anyone who opens it sees a structured preview and can join the space.
- **PWA** — installable on Android/iOS home screen. Works offline with cached API data. Auto-updates on deploy.
- **Dark & Light themes** — toggle between themes, persisted per device.
- **Auth** — email/password signup and login. JWT-based sessions.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| State | Zustand 5 |
| Animation | Framer Motion |
| Backend | Node.js, Fastify, TypeScript |
| Database | SQLite (via better-sqlite3) |
| PWA | vite-plugin-pwa, Workbox 7 |
| Fonts | Plus Jakarta Sans, Inter |
| Deploy | Render (Web Service) |

## Project structure

```
classspace/
├── client/                 # React frontend (Vite)
│   ├── public/             # Static assets (icons, robots.txt, favicon)
│   ├── src/
│   │   ├── api/            # API client functions
│   │   ├── components/     # Reusable UI components
│   │   │   ├── layout/     # App shell, nav, sidebar
│   │   │   ├── sheets/     # Bottom sheet modals
│   │   │   └── ui/         # Primitive components (Badge, EmptyState, Logo, etc.)
│   │   ├── screens/        # Page-level components
│   │   ├── store/          # Zustand stores
│   │   └── types/          # TypeScript type definitions
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                 # Fastify backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── db/             # Database setup and queries
│   │   └── index.ts        # Server entry point
│   └── package.json
├── tests/                  # Playwright E2E tests
└── README.md
```

## Getting started

### Prerequisites

- Node.js 22+
- npm

### Setup

```bash
# Install all dependencies
npm install

# Start development (client + server concurrently)
npm run dev
```

The client runs on `http://localhost:5000` and proxies API requests to the server on `http://localhost:3001`.

### Build for production

```bash
npm run build
```

This compiles TypeScript and bundles the client with Vite. The server serves the built client files as static assets.

### Run tests

```bash
# E2E tests (Playwright)
npx playwright test
```

## Deployment

The app deploys on **Render** as a Web Service using the Dockerfile or build/start scripts in `package.json`. Render auto-deploys on every push to `main`.

Key environment variables:
- `DATABASE_URL` — SQLite database path (default: `./data/classspace.db`)
- `JWT_SECRET` — secret for JWT token signing
- `PORT` — server port (default: `3001`)

## Current version

This is a full-stack production build with React frontend, Fastify API, SQLite database, JWT auth, and PWA support.

## Design principles

- **Calm over busy.** Every screen should feel like a relief compared to a WhatsApp group.
- **Scannable in under 3 seconds.** A student opening an announcement should know the deadline and what they need to do before they finish reading.
- **Mobile-first, always.** Design for a 6-inch screen with one thumb. Desktop is secondary.
- **No chat.** ClassSpace is not a messaging platform. No comments, replies, or social feed.
- **Nigerian context.** Built for ASUU strikes, portal issues, WhatsApp-first classmates, and mid-range Android phones.

## Colour palette

| Token | Value | Usage |
|---|---|---|
| `--app-bg` | `#0f0f11` | App background |
| `--app-surface` | `#18181c` | Card backgrounds |
| `--app-border` | `#2a2a32` | Borders |
| `--app-accent` | `#e8ff47` | Primary accent (electric yellow-green) |
| `--app-accent2` | `#5b6af0` | Secondary accent (indigo) |
| `--app-text` | `#f0f0f2` | Primary text |
| `--app-text-dim` | `#7a7a88` | Dimmed text |
| `--app-text-faint` | `#52525f` | Faint text |
| `--app-red` | `#ff5252` | Urgent / error |
| `--app-green` | `#52ffa0` | Active / success |
| `--app-orange` | `#ffb347` | Due soon / warning |

## Licence

MIT. Use it, fork it, build on it.

## Made by

Christian Smart — founder of ClassSpace, studying at UNIBEN, building for Nigerian students.

If you're a Nigerian university student and this resonates, reach out. The best product decisions come from people who live the problem every day.

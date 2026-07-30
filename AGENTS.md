# ClassSpace — Agent Instructions

## Project structure
- `/projects/ClassSpace/` — project root
- `client/` — React 19 + Vite 8 + Tailwind CSS 4 frontend
- `server/` — Fastify + TypeScript API backend
- `tests/` — Playwright E2E tests

## Ignore patterns
Respect `.opencodeignore` — skip node_modules, dist, build artifacts, lockfiles, and test-results when searching/reading.

## Critical source files by area

### Backend (server/src/)
| File | Purpose |
|------|---------|
| `routes/*.ts` | API route handlers |
| `db/schema.ts` | SQLite schema (CREATE TABLE) |
| `db/connection.ts` | DB connection |
| `db/seed-data.json` | Initial seed data |
| `middleware/auth.ts` | JWT auth middleware |
| `lib/jwt.ts` | JWT signing/verification |
| `lib/push.ts` | Push notification helpers |
| `index.ts` | Server entry point |

### Frontend (client/src/)
| File | Purpose |
|------|---------|
| `screens/*.tsx` | Page-level components |
| `components/*.tsx` | Reusable UI components |
| `store/*.ts` | Zustand state stores |
| `api/*.ts` | API client functions |
| `types/*.ts` | TypeScript type definitions |
| `lib/*.ts` | Utility functions |
| `sw.ts` | Service worker |
| `App.tsx` | App root with router |

## Tech stack
- **Client**: React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Zustand 5, Framer Motion
- **Server**: Node.js, Fastify 5, TypeScript, better-sqlite3
- **Auth**: JWT (email/password + bcryptjs)
- **PWA**: vite-plugin-pwa (injectManifest mode)
- **Tests**: Playwright

## Key conventions
- Mobile-first design (6-inch screen, one-thumb navigation)
- Dark/light theme via CSS custom properties
- Bottom sheet modals for secondary actions
- No chat/messaging — ClassSpace is a structured feed
- API routes under `/api/*`
- TypeScript strict mode

## NPM scripts
- `npm run dev` — runs client + server concurrently
- `npm run build` — builds both client and server
- `npm start` — production start (server serves client static files)

## Type checking
- `npx tsc --noEmit` — server typecheck
- `npx tsc -b --noEmit` — client typecheck
- `npx oxlint` — client lint

## Architecture plan
See `ARCHITECTURE_PLAN.md` for the full security/data/polish roadmap.
See `PWA_OVERHAUL.md` for PWA implementation details (all features are complete per changelog).

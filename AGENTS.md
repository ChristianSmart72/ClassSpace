# ClassSpace — Agent Instructions

## Project structure
- `/projects/ClassSpace/` — project root
- `client/` — React 19 + Vite 8 + Tailwind CSS 4 frontend
- `server/` — Fastify 5 + TypeScript API backend
- `tests/` — Playwright E2E tests

## Ignore patterns
Respect `.opencodeignore` — skip node_modules, dist, build artifacts, lockfiles, and test-results when searching/reading.

## Critical source files by area

### Backend (server/src/)
| File | Purpose |
|------|---------|
| `routes/*.ts` | API route handlers |
| `db/schema.ts` | Turso schema (CREATE TABLE) |
| `db/connection.ts` | Turso connection (libsql), `client.batch()` for atomic writes |
| `db/seed-data.json` (in `seed/`) | Initial seed data |
| `middleware/auth.ts` | JWT auth middleware |
| `lib/jwt.ts` | JWT signing/verification |
| `lib/push.ts` | Push notification helpers |
| `lib/upload.ts` | Uploadthing server SDK helpers (UTApi, keyFromUrl, deleteFileByUrl) |
| `lib/uploadrouter.ts` | Uploadthing fastify adapter (/api/uploadthing, 1GB direct uploads) |
| `lib/config.ts` | Env validation + required vars |
| `routes/demo.ts` | Demo reset (JWT-gated) |
| `routes/reset.ts` | Admin DB reset (token-gated via DB_RESET_TOKEN_HASH) |
| `index.ts` | Server entry point |

### Frontend (client/src/)
| File | Purpose |
|------|---------|
| `screens/*.tsx` | Page-level components |
| `components/*.tsx` | Reusable UI components |
| `store/*.ts` | Zustand state stores |
| `api/*.ts` | API client functions (axios) |
| `types/*.ts` | TypeScript type definitions |
| `lib/*.ts` | Utility functions |
| `lib/directUpload.ts` | genUploader direct-to-CDN uploads + formatBytes |
| `sw.ts` | Service worker |
| `App.tsx` | App root with router |

## Tech stack
- **Client**: React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Zustand 5, PWA (vite-plugin-pwa injectManifest)
- **Server**: Node.js, Fastify 5, TypeScript, @libsql/client (Turso)
- **Storage**: Uploadthing CDN (1GB direct uploads)
- **Auth**: JWT (email/password + bcryptjs)
- **PWA**: Custom `sw.ts` (offline + push), SW registry via Vite
- **Tests**: Playwright

## Key conventions
- Mobile-first design (6-inch screen, one-thumb navigation)
- Dark/light theme via CSS custom properties
- Bottom sheet modals for secondary actions
- No chat/messaging — ClassSpace is a structured feed
- API routes under `/api/*`
- TypeScript strict mode (secure synthetic defaults)
- Uploads go **direct from browser → Uploadthing CDN** (never relay through Fastify body)

## NPM scripts
- `npm run dev` — runs client (5000) + server (3001) concurrently
- `npm run build` — builds both client and server
- `npm start` — production start (server serves client static files)

## Type checking
- `npx tsc --noEmit` — server typecheck
- `npx tsc -b --noEmit` — client typecheck
- `npx oxlint` — client lint

## Architecture plan
See `ARCHITECTURE_PLAN.md` for the security/data/polish roadmap + status.
See `PWA_OVERHAUL.md` for the offline/PWA implementation details (all features complete).
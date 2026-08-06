# ClassSpace — Continuity & Project State

> **Read this file first.** It is the shortest path to understanding where the project stands and how to pick up where the last session left off. If you have read nothing else, read this.

## What ClassSpace is

A **mobile-first academic organiser** for Nigerian university students. One structured space per department+level ("300L Production Engineering, UNILAG"). Class reps post **announcements**, **course materials**, **timetables**, and **opportunities**. Students join via an invite code. Deliberately **not** a chat app — it is the single source of truth for class-level academic content.

- Live site: https://classspace-uffa.onrender.com
- Git repo: https://github.com/christiansmart72/ClassSpace (private — ask owner for the link)

## What was recently done (previous session, 2026-07/08)

- Shipped the **materials library / downloads** feature
- Added the **timetable** and **share previews**
- Full PWA overhaul (offline-first, `sw.ts`, custom service worker)
- Did a **deep debug pass** (details below) and a live end-to-end smoke test of ~26 feature checks
- Deployed to Render. Last verified deploy built + started clean and all smoke-tested endpoints passed

## Verified working against the LIVE site (last smoke test)

Auth (register/login/me), space create/get/my-spaces/members, announcements (post with file, list, detail, pin, delete), reactions (upvote/downvote), timetable (add/list), materials (upload/list/download/recent), opportunities (post/list/delete), share previews (space/ann/mat/course), 401 guard. Health endpoints `GET /api/health` and `/api/health/upload` both OK; DB and UploadThing reachable.

## Bugs FIXED in the deep debug pass

| # | Bug | Fix |
|---|---|---|
| 1 | `GET /api/spaces/:id/materials/summary` returned **500** for every space | It called `Number(id)` on a **slug** id → `NaN` bound to SQL → libSQL throws. Now binds the raw slug string. |
| 2 | `/api/db/reset` (seed) crashed deleting `reactions`/`poll_options`/`poll_votes` by `space_id` (no such column) when legacy data existed | Changed to delete via `announcement_id IN (...)` / `poll_id IN (...)` subqueries. |
| 3 | Share preview for a space opened via **invite code** showed 0 members / 0 files / empty courses | Counts/list queries used the invite-code param; now query by the real `space.id`. |
| 4 | Announcement "Course Materials" download buttons did nothing (and could crash on base64) | Buttons now hit `GET /api/materials/:id/download` (which 302-redirects to the UploadThing URL). |
| 5 | Material share endpoint omitted `course_id` → rep "delete" navigated to `/course/undefined` | Added `m.course_id, m.pinned, m.downloads` to the shared-material SELECT. |
| 6 | Announcement POST ran rep-check **after** uploading files; non-reps could force UploadThing uploads & orphan files on validation failure | Rep/membership check moved to the **top** of the handler; failed uploads are deleted via `deleteFileByUrl`. |
| 7 | Reactions endpoint had **no membership check** (any logged-in user could react in any private space) | Added `isSpaceMember` guard using the announcement's `space_id`. |
| 8 | Push subscribe had **no membership check** (could subscribe to any space's notifications) | Added `isSpaceMember` guard. |
| 9 | Client offers **Bootcamp** opportunity category but server coerced it to `other` | Added `bootcamp` to the server allow-list. |
| 10 | Announcement **edit** uploaded a new file but never deleted the old UploadThing object | Now deletes previous `file_data` on replacement. |
| 11 | Client `206` **deploy build failed** | Removed unused var + fixed `BlobPart` typing on new TS. Verified by running `npm run build` (client uses `tsc -b`). |

Cross-user data leak on shared devices (SW + localStorage caches persisted across logout/login) was mitigated: caches are cleared on **401** (`client/src/api/client.ts`) and on **logout** (`authStore.logout`).

## Known / accepted limitations (do not treat as regressions)

- `POST /api/announcements/:id/react` returns `{reactions, userReacted, emoji}` but the client **does not render vote buttons** — reactions are recorded, UI not yet built.
- `createAnnouncement` in `client/src/api/content.ts` has a dormant multipart bug (sends `[object Object]` for the `files` array) — it has **no callers**; the real post flow (`PostAnnouncement.tsx`) sends JSON `{ files: [{file_url,...}] }` directly and works. If you wire up `contentStore.createAnnouncement`, send JSON, not multipart.
- `GET /api/health/upload` uploads a throwaway ~4-byte file to UploadThing quota on each probe (harmless, occasional cost).
- `/api/db/reset` uses a **hardcoded fallback bcrypt hash** if `DB_RESET_TOKEN_HASH` is unset. Fine while repo is private; set the env var and remove the fallback if the repo ever goes public.
- Some POST responses return raw `0/1` instead of booleans (e.g. `POST /api/spaces/:id/timetable` `entry.cancelled`, `POST .../opportunities` `pinned`). The client refetches/coerces after posting so no runtime bug; `Boolean()` is the convention if you touch these.
- `client/src/lib/time.ts` `new Date('YYYY-MM-DD')` is UTC-midnight — a deadline shown "today" in Nigeria but "expired" in timezones west of UTC. Deliberately left; only affects extreme TZ edge.
- `client/src/sw.ts` caches `/api/*` GETs (StaleWhileRevalidate, `ExpirationPlugin` 80 entries / 1 day). Cross-user switching is mitigated by the cache-clears above.

## Critical gotchas to never break

1. **Space ids are TEXT slugs** (e.g. `300l-production-eng`, `pre220`). **Never** call `Number()` on a `:id` that resolves to a space. Numeric ids: course, material, announcement, timetable entry, opportunity, attachment, poll, user. `Number()` IS correct for those.
2. **Client build is strict**: `tsc -b` with `noUnusedLocals` — an unused variable fails the deploy. Run `cd client && npm run build` before pushing (it is `tsc -b && vite build`). Render runs `npm run build` = `npm install; npm run build` with `cd client && npm install && npm run build && cd ../server && npm install && npm run build`.
3. **SQLite/SQL `0/1` vs booleans**: DB stores `0/1`. Route responses convert with `Boolean()` before sending; keep the convention.
4. **Space slug vs invite-code** params in `/api/share/space/:id` — the `:id` may be either; always look up the space first and use `space.id` for further queries.
5. Rep-only mutations verify `role === 'rep'` on `space_members`.

## Environment you'll need to continue (see DEPLOYMENT.md)

`JWT_SECRET`, `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `TURSO_DB_URL`, `TURSO_DB_TOKEN`, `UPLOADTHING_SECRET`, optional `DB_RESET_TOKEN_HASH`, `PORT`, `HOST`, `NODE_ENV`.

---

## Project checklist — where each screen/feature lives

- **Auth** → `client/src/screens/{Landing,Login,Register,SetupWizard}.tsx`, server `routes/auth.ts`
- **Space hub** → `client/src/screens/Space.tsx` + `MainLayout` (nav)
- **Home / next-up + timeline** → `client/src/screens/Home.tsx` (uses `lib/time.ts` helpers)
- **Announcements** → `client/src/screens/AnnouncementDetail.tsx`, `PostAnnouncement.tsx`, server `routes/announcements.ts`
- **Course materials** → `CourseFiles.tsx`, `MaterialDetail.tsx`, `UploadMaterial.tsx`, server `routes/materials.ts`
- **Timetable** → `Timetable.tsx`, `AddClass.tsx`, server `routes/timetable.ts`
- **Opportunities** → `Opportunities.tsx`, `PostOpportunity.tsx`, `OpportunityDetailSheet.tsx`, server `routes/opportunities.ts`
- **Join/share** → `JoinInput.tsx`, `JoinPreview.tsx`, `ShareSheet.tsx`, server `routes/share.ts`
- **Profile** → `Profile.tsx`

Full details: **ARCHITECTURE.md** (data flow + file map), **API.md** (all endpoints), **DATABASE.md** (schema + migrations), **DEPLOYMENT.md** (deploy + env).
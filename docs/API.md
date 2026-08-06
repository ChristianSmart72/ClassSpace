# ClassSpace — API Reference

Base URL: `/api`. In dev the Vite proxy (`client/vite.config.ts`) forwards `/api` to `http://127.0.0.1:3001`.

Conventions:
- **Auth**: most endpoints require `Authorization: Bearer <jwt>` (7-day expiry). 401 → `{error}`. Endpoints marked **PUBLIC** need no token.
- **Errors**: `{ error: string }` with status 400/401/403/404/409/413/500. In prod, 5xx internals are hidden (generic `Internal server error`) except upload errors (leaks their message).
- **IDs**: `space_id` is a **text slug** (e.g. `pre220`); course/material/announcement/timetable/opportunity/attachment ids are **numbers**. Server-side: `Number()` on numeric ids only — never on a space slug.
- **Booleans**: SQLite stores `0/1`; routes send real `true/false`. Keep this convention.
- **`request.user`**: after `authMiddleware`, `{ userId, email }` from the JWT.

---

## Auth

### `POST /api/auth/register` — PUBLIC
Body:
```json
{ "name": "…", "email": "a@b.com", "password": "≥6 chars" }
```
→ `{ token, user: { id, name, email, role: "member", avatar } }`

### `POST /api/auth/login` — PUBLIC
Body: `{ email, password }`
→ `{ token, user: { id, name, email, role, avatar }, space?: { ...space, courses: Course[], memberRole } }`
(`space` present only if the user is already a member of a space.)

### `GET /api/auth/me`
→ `{ user: { id, name, email, role, avatar, created_at }, space?: {...} }`

---

## Health

### `GET /api/health` — PUBLIC
Probes the DB (`SELECT 1`). → `{ status:'ok', db:'ok', timestamp }` or 503. Used by Render's health check.

### `GET /api/health/upload` — PUBLIC
Probes UploadThing by uploading a throwaway file. → `{ status:'ok', uploadthing:true, url, key }`

---

## Spaces

### `POST /api/spaces`
Body: `{ name, dept, level, uni, slug?, courses: [{ name, code, icon, color_index }] }`
Creates the space (id = slug or sanitized name; 409 if taken), inserts courses + rep membership, sets `user.role='rep'`.
→ `{ space: { ...space, invite_code, courses }, token }` (echoes back a token).

### `GET /api/spaces/:id`
→ `{ space: { ...space, courses }, members: [{ id, name, email, role, avatar, member_role }], isMember: true, memberRole }` (403 if not a member).

### `POST /api/spaces/join` — PUBLIC (auto-joins if a valid token is sent)
Body: `{ inviteCode: string }` → `{ space: { ...space, rep, courses } }`

### `GET /api/spaces/:id/members`
→ `{ members: [{ id, name, email, role, avatar, member_role, joined_at }] }`

### `DELETE /api/spaces/:id/membership`
Leaves the space (the class rep cannot leave). → `{ success: true, message }`
> Accepted limitation: does not remove the member's own announcements/materials/reactions/push rows.

### `GET /api/user/spaces`
→ `{ spaces: [{ id, name, uni, dept, level, invite_code, member_role }] }`

---

## Announcements

### `GET /api/spaces/:id/announcements?filter=urgent|pinned|<course-code>|all`
Feed. Ordered `pinned DESC, urgent DESC, created_at DESC`. Includes reaction counts + the caller's own vote.
→
```json
{ "announcements": [{
  "id": 1, "space_id": "pre220", "course_id": 2, "title": "…", "body": "…",
  "type": "assignment", "author_id": 1, "author_name": "…",
  "urgent": false, "pinned": true, "created_at": "…",
  "course_name": "…", "course_code": "…", "course_icon": "…",
  "reactions": { "upvote": 2, "downvote": 0 }, "my_reaction": "upvote" | null
}] }
```
(fields `deadline`, `venue`, `instructions`, `submission_method`, `format`, file fields present when set)

### `POST /api/spaces/:id/announcements` — rep only
JSON body: `{ course_id?: number | null, title, body, type, urgent?, pinned?, deadline?, venue?, instructions? }`
Optional `files: [{ file_url, file_name, file_size }]` (URLs pre-uploaded to UploadThing) → creates `announcement_attachments` rows; the first file is mirrored to the legacy `file_data`/`file_name`/`file_size` columns.
A **multipart** form is also accepted (`title`, `body`, `type`, `urgent`, `pinned`, `course_id`, `deadline`, `venue`, `instructions`, repeated `file` parts). Uploads happen directly to UploadThing; the rep check runs **before** any upload, and uploaded files are deleted if validation fails.
Pushes a notification to space members (`tag: announcement-<id>`).
→ `{ announcement: { ... } }` — legacy: return of `getAnnouncement` shape.

### `GET /api/announcements/:id`
Legacy/detail. → `{ ...announcement }` (flat row; SQLite 0/1 not coerced here — treat as truthy). Includes `attachments: [{ id, file_name, file_size, url }]` (url = `/api/announcements/:id/attachment/:attId/download`).

### `PATCH /api/announcements/:id` — rep only
Body: any of `{ pinned?, urgent?, title?, body?, type?, course_id?, file_data?, file_name?, file_size? }`. `file_data` (base64) is uploaded; the previous UploadThing object is deleted. → `{ success: true }`

### `DELETE /api/announcements/:id` — rep only
Deletes attachments + file object. → `{ success: true }`

### `GET /api/announcements/:id/download` — PUBLIC
302-redirects to the legacy `file_data` URL (or 404).

### `GET /api/announcements/:id/attachment/:attId/download` — PUBLIC
302-redirects to an attachment's UploadThing URL.

### `GET /api/announcements/shared/:id` — PUBLIC
→ `{ ...announcement, author_name, course_name, course_code, course_icon, space_name, space_id, dept, level, uni }`

---

## Materials

### `GET /api/courses/:id/materials?sort=newest|oldest|downloads|alpha`
→
```json
{ "materials": [ { "id": 1, "name": "…", "file_type": "pdf", "category": "Slides",
  "file_size": 123, "created_at": "…", "pinned": false, "downloads": 3,
  "has_file": true, "uploader_name": "…", "course_name": "…", "course_code": "…" } ] }
```
No `file_data` in list responses — use the download endpoint to fetch bytes.

### `POST /api/courses/:id/materials` — rep only
Body: `{ name, category, file_url, file_name, file_size }` (file already on UploadThing). → `{ material: { ... } }`
Categories: `Slides | Assignments | Past Questions | Lab Resources | Books | Templates | Other`.

### `GET /api/materials/:id/download` — PUBLIC
Increments `downloads`, then `302` → file URL (UploadThing). 404 if no file. (Client `lib/download.ts` streams this with progress.)

### `PATCH /api/materials/:id`
Body: `{ pinned?: boolean }`. Allowed for the rep **or** the material's uploader. → `{ success: true }`

### `DELETE /api/materials/:id`
Rep or uploader. Deletes the UploadThing object too. → `{ success: true }`

### `GET /api/spaces/:id/materials/summary`
Per-course aggregates (`space_id` is the slug — this route must never `Number(id)` it).
→ `{ courses: [{ course_id, count, contributors, total_downloads, latest: { name, created_at } | null }] }`

### `GET /api/spaces/:id/materials/recent?limit=5` (1–10)
→ `{ materials: [ latest across all courses with uploader/course names + has_file ] }`

### `GET /api/materials/shared/:id` — PUBLIC
→ `{ id, name, file_type, category, file_size, created_at, course_id, pinned, downloads, has_file, uploader_name, course_name, course_code, course_icon, space_name, space_id }`

---

## Timetable

### `GET /api/spaces/:id/timetable`
→ `{ timetable: [ full rows `+` venue, lecturer, course_name, course_code, course_icon, color_index, cancelled (boolean) ] }`
Day order Mon→Sun then `start_time`.

### `POST /api/spaces/:id/timetable` — rep only
Body: `{ course_id, day, start_time, end_time, venue?, lecturer? }` → `{ entry }`

### `PATCH /api/timetable/:id` — rep only
Body: `{ cancelled?: boolean }` (used to post class cancellations). → `{ success: true }`

### `DELETE /api/timetable/:id` — rep only
→ `{ success: true }`

---

## Opportunities

### `GET /api/spaces/:id/opportunities`
→ `{ opportunities: [ { title, description, category, link, deadline, eligibility, pinned (boolean), author_name, created_at } ] }` (pinned DESC, then created DESC).

### `POST /api/spaces/:id/opportunities` — rep only
Body: `{ title, description, category, link?, deadline?, eligibility? }`
Category allow-list: `seminar | scholarship | internship | job | event | competition | bootcamp | other` (anything else → `other`). Link must be http(s).
→ `{ opportunity: { ... } }`

### `PATCH /api/opportunities/:id` — rep only
Body: `{ pinned?: boolean }` → `{ success: true }`

### `DELETE /api/opportunities/:id` — rep only
→ `{ success: true }`

---

## Reactions

### `POST /api/announcements/:id/react` — membership-gated
Body: `{ emoji: 'upvote' | 'downvote' }`. Toggles: same vote removes it; opposite vote switches it. 
→ `{ reactions: { upvote: n, downvote: n }, userReacted: boolean, emoji }`

---

## Push

### `POST /api/push/subscribe` — membership-gated
Body: `{ endpoint, keys: { p256dh, auth }, spaceId }`. Upserts by endpoint. → `{ success: true }`

### `DELETE /api/push/unsubscribe`
Body: `{ endpoint?: string }` (all of the user's subs if omitted). → `{ success: true }`

### `POST /api/push/test`
Sends the caller a test notification. → `{ success: true }`

---

## Share (public previews)

### `GET /api/share/space/:id` — PUBLIC
`:id` may be the slug **or** the invite code. Subsequent queries always use `space.id`.
→
```json
{ "type": "space", "name": "…", "dept": "…", "level": "…", "uni": "…",
  "rep": "…", "id": "…", "invite_code": "…", "member_count": 1, "material_count": 0,
  "courses": [{ "id": 1, "name": "…", "code": "…", "icon": "📚", "color_index": 0, "file_count": 0 }],
  "recent_announcements": [ { "id": 1, "title": "…", "body": "…", "type": "…", "urgent": false, "created_at": "…", "course_name": null, "course_code": null } ] }
```

### `GET /api/share/ann/:id` — PUBLIC
→ `{ type:'announcement', id, title, body, author, time, urgent, pinned, type_label, course: {name,code,icon} | null, space: {id,name} }`

### `GET /api/share/mat/:id` — PUBLIC
→ `{ type:'material', id, name, file_type, category, file_size, uploader, course: {name,code,icon}, space: {id,name} }`

### `GET /api/share/course/:id` — PUBLIC
→ `{ type:'course', id, name, code, icon, color_index, files: [ {id,name,file_type,category,file_size} ] (cap 5), totalFiles, space: {id,name} }`

---

## Admin

### `POST /api/db/reset`
Body: `{ token }`. Validates against bcrypt(`DB_RESET_TOKEN_HASH` **or** a hardcoded fallback). Drops all tables, recreates schema, reseeds demo data. → `{ success: true, message }`

### `GET /reset` — PUBLIC
Renders a static page: a form that posts the token to `/api/db/reset`.

---

## UploadThing endpoint (client-direct)

`POST /api/uploadthing` (registered by `lib/uploadrouter.ts`): `blob` route, `maxFileSize: '1GB'`, `maxFileCount: 5`, middleware requires a valid bearer JWT. The client uploads **directly** here with progress; the returned URLs are later stored in `file_url` / `file_data` columns.
# ClassSpace PWA Overhaul — Implementation Plan

**Started:** 2026-07-26
**Status:** In progress
**Goal:** Transform ClassSpace into a fully offline-capable, push-notification-equipped, installable PWA with polished UX.

---

## Feature Dependency Graph

```
Feature 1: Custom SW + Offline-First  ←── Foundation for everything
    │
    ├── Feature 3: Offline/Online Indicator (needs SW fetch awareness)
    ├── Feature 5: App Badge (needs content store + SW communication)
    │
    ├── Feature 2: Push Notifications (needs SW push/notificationclick handlers)
    │   └── VAPID keys provided by user (stored in ~/secrets/vapid.json)
    │       subject: mailto:webdaddyempire@gmail.com
    │       publicKey: BK-fNRDB2k-Vkap_EPjRkJ_r4QT4cPfYZFCh_rjGs_hrmWYrCde-uK9H-2ZAdtU9Xlils6wA2pfbP_1ZXwWCqCU
    │       privateKey: onDjUGHMOlXCsyB8_FL9gKD_Qm0xjHWCQFK9yg-Wr84
    │
    ├── Feature 4: Install Prompt (standalone)
    │
    └── Feature 6: SW Update Prompt (needs custom SW message handler)
```

---

## Feature 1: Custom Service Worker + Offline-First

### Problem
Current SW is fully Workbox-generated. No push handlers, no offline fallback, no navigation caching, no message passing.

### Changes

| File | Action | What |
|------|--------|------|
| `client/sw.ts` | **CREATE** | Custom SW with: push event, notificationclick, SKIP_WAITING message handler, offline fallback, StaleWhileRevalidate for navigations |
| `client/public/offline.html` | **CREATE** | Offline fallback page with cached-content navigation links |
| `client/vite.config.ts` | **MODIFY** | Switch from Workbox-only to `injectManifest` mode with `swSrc: 'sw.ts'` |

### SW Behavior
- **Install:** Precache all static assets via Workbox injectManifest
- **Activate:** `clients.claim()`, delete old caches
- **Fetch (navigation):** StaleWhileRevalidate → serve cached HTML, update in background
- **Fetch (API):** NetworkFirst (10s timeout), fall back to cache
- **Fetch (static):** CacheFirst (immutable assets)
- **Push:** `self.registration.showNotification()` with title/body/icon/data
- **Notification click:** Focus existing window or open new one at the relevant URL
- **Message:** Handle `SKIP_WAITING` → `self.skipWaiting()`
- **Offline fallback:** If navigation fetch fails AND no cache hit → respond with offline.html
- **Navigation preload:** Enabled for faster initial navigations

### Offline page content
- ClassSpace logo
- "You're offline" heading
- "Here's what you can still do:" with links: Home, Space, Timetable
- "Saved announcements" list (populated from IndexedDB or cache keys)
- "Connect to the internet to post, upload, or vote" note

---

## Feature 2: Push Notifications

### Problem
No push infrastructure at all. Profile has static toggle rows that do nothing.

### Backend Changes

| File | Action | What |
|------|--------|------|
| `server/src/db/schema.ts` | **MODIFY** | Add `push_subscriptions` table |
| `server/src/routes/push.ts` | **CREATE** | Subscribe/unsubscribe/send endpoints |
| `server/src/lib/push.ts` | **CREATE** | `sendPushToUser()`, `sendPushToSpace()` helpers |
| `server/src/routes/announcements.ts` | **MODIFY** | Call `sendPushToSpaceMembers()` after INSERT |
| `server/src/routes/materials.ts` | **MODIFY** | Call `sendPushToCourseMembers()` after INSERT |
| `server/package.json` | **MODIFY** | Add `web-push` dependency |
| `render.yaml` | **MODIFY** | Add VAPID env vars |

### push_subscriptions Table
```sql
CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  space_id TEXT REFERENCES spaces(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Push Endpoints
- `POST /api/push/subscribe` — body: `{ endpoint, keys: { p256dh, auth }, spaceId }` — saves subscription linked to user from JWT
- `DELETE /api/push/unsubscribe` — body: `{ endpoint }` — removes subscription
- `POST /api/spaces/:id/push/test` — (authenticated) sends test notification to requester

### Notification Triggers
- **New announcement:** Send to all space members (with preference filtering)
  - Title: `📢 [announcement.title]`
  - Body: `[author_name] — [course_name]`
  - Tag: `announcement-[id]`
  - Data: `{ url: '/space/' + spaceId + '/announcement/' + annId, type: 'announcement' }`
- **Urgent announcement:** Same but with `requireInteraction: true` and `🚨` prefix
- **New material:** Send to space members who opted into material notifications
  - Title: `📎 New material: [name]`
  - Body: `[course_name]`
  - Data: `{ url: '/space/' + spaceId + '/course/' + courseId, type: 'material' }`

### Frontend Changes

| File | Action | What |
|------|--------|------|
| `client/src/lib/push.ts` | **CREATE** | `registerPushSubscription()`, `unregisterPushSubscription()`, `getPushSupport()` |
| `client/src/store/notificationStore.ts` | **CREATE** | Zustand store: `permission`, `subscription`, `preferences` persisted to localStorage |
| `client/src/screens/Profile.tsx` | **MODIFY** | Wire 4 toggle rows to store, show permission status, allow enable/disable |
| `client/src/store/authStore.ts` | **MODIFY** | On login → register push. On logout → unregister. |

### Push Subscription Flow
1. `authStore.login()` succeeds → check `Notification.permission`
2. If `default` → show explainer UI → request permission
3. If `granted` → wait for SW to be ready → `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) })`
4. POST subscription data to `/api/push/subscribe`
5. On logout → POST to `/api/push/unsubscribe`

---

## Feature 3: Offline/Online Indicator

### Problem
Users get no feedback when offline. API calls hang silently then fail with generic error.

### Changes

| File | Action | What |
|------|--------|------|
| `client/src/store/connectivityStore.ts` | **CREATE** | Zustand store: `isOnline` boolean. Listeners for `online`/`offline` events |
| `client/src/components/ui/OfflineBanner.tsx` | **CREATE** | Fixed yellow banner at bottom: "You're offline — viewing cached content" |
| `client/src/components/layout/MainLayout.tsx` | **MODIFY** | Render `<OfflineBanner />` above BottomNav |
| `client/src/api/client.ts` | **MODIFY** | Response interceptor: on `ERR_NETWORK` if `!isOnline`, show specific offline toast |

### UX
- **Going offline:** Yellow banner slides up "📡 You're offline — viewing cached content"
- **Online again:** Banner slides down, green toast "✅ Back online!"
- **Offline action attempt (POST/PUT/DELETE):** Toast "You need an internet connection to do that"
- **Offline navigation:** Serves cached page or offline fallback
- **Banner persists until dismissed or back online**

---

## Feature 4: Install Prompt UI

### Problem
No custom install prompt. Browser default `beforeinstallprompt` is not captured, so Chrome's mini-infobar is the only install path.

### Changes

| File | Action | What |
|------|--------|------|
| `client/src/hooks/useInstallPrompt.ts` | **CREATE** | Listen for `beforeinstallprompt`, store deferred prompt, expose `isInstallable`, `install()`, `dismissed` |
| `client/src/screens/Home.tsx` | **MODIFY** | Add install card after Quick Actions |
| `client/src/screens/Profile.tsx` | **MODIFY** | Add "Install App" row in Settings section |

### UX
- Shows only on Chromium browsers with `beforeinstallprompt` support
- Shows only if not already in standalone mode (`matchMedia('(display-mode: standalone)')`)
- Shows only if user hasn't dismissed in last 30 days (localStorage)
- Card: "📱 Install ClassSpace" + "Add to your home screen for quick access" + [Install] button
- Button calls `deferredPrompt.prompt()` → awaits `userChoice`
- On accept: hide permanently, maybe toast "✅ Installed!"
- On dismiss: hide, set `dismissedAt` in localStorage

---

## Feature 5: App Badge

### Problem
No badge on app icon. Users don't know about new announcements without opening app.

### Changes

| File | Action | What |
|------|--------|------|
| `client/src/store/badgeStore.ts` | **CREATE** | Zustand store: `setBadge(n)`, `clearBadge()` wrapping `navigator.setAppBadge/clearAppBadge` |
| `client/src/screens/Home.tsx` | **MODIFY** | After fetch, compute unread count from last seen timestamp, call `setBadge()` |
| `client/src/screens/Space.tsx` | **MODIFY** | When viewing announcements tab, call `clearBadge()` |

### Unread Logic
- Store `lastSeenAnnouncementTime` in localStorage (updated when user views Space)
- On Home mount, fetch announcements → count those with `created_at > lastSeenAnnouncementTime`
- Set badge to that count
- When Space announcements tab is focused/visible, update timestamp and clear badge

---

## Feature 6: SW Update Prompt

### Problem
`registerType: 'autoUpdate'` forces sudden hard refreshes. Users lose mid-session work.

### Changes

| File | Action | What |
|------|--------|------|
| `client/vite.config.ts` | **MODIFY** | Change `registerType: 'autoUpdate'` → `registerType: 'prompt'` |
| `client/src/store/updateStore.ts` | **CREATE** | Zustand store: `updateAvailable` boolean, `updateSW()` sends SKIP_WAITING message then reloads |
| `client/src/components/ui/UpdatePrompt.tsx` | **CREATE** | Fixed bottom toast: "✨ A new version is available" + [Update] [Later] |
| `client/src/App.tsx` | **MODIFY** | Render `<UpdatePrompt />` near root |
| `client/sw.ts` | **MODIFY** | Message handler for `SKIP_WAITING` |

### UX Flow
1. New build deployed → SW detects update via `registration.onupdatefound`
2. `install` event in new SW fires → `skipWaiting()` NOT called automatically (because `registerType: 'prompt'`)
3. UI shows toast: "✨ A new version is available" + [Update] button
4. User taps Update → React sends `{ type: 'SKIP_WAITING' }` to SW → SW calls `self.skipWaiting()` → page reloads
5. User taps Later → toast hides for 24h (localStorage), will re-show on next SW update check

---

## Files to Create (summarized)

| # | File | Feature |
|---|------|---------|
| 1 | `client/sw.ts` | F1 — Custom service worker |
| 2 | `client/public/offline.html` | F1 — Offline fallback page |
| 3 | `server/src/routes/push.ts` | F2 — Push notification endpoints |
| 4 | `server/src/lib/push.ts` | F2 — Push helper functions |
| 5 | `client/src/lib/push.ts` | F2 — Client push registration |
| 6 | `client/src/store/notificationStore.ts` | F2 — Notification preferences |
| 7 | `client/src/store/connectivityStore.ts` | F3 — Online/offline state |
| 8 | `client/src/components/ui/OfflineBanner.tsx` | F3 — Offline banner UI |
| 9 | `client/src/hooks/useInstallPrompt.ts` | F4 — Install prompt hook |
| 10 | `client/src/store/badgeStore.ts` | F5 — App badge state |
| 11 | `client/src/store/updateStore.ts` | F6 — SW update state |
| 12 | `client/src/components/ui/UpdatePrompt.tsx` | F6 — Update toast UI |

## Files to Modify (summarized)

| # | File | Features |
|---|------|----------|
| 1 | `client/vite.config.ts` | F1, F6 — injectManifest mode, registerType: prompt |
| 2 | `client/src/App.tsx` | F6 — Add UpdatePrompt |
| 3 | `client/src/screens/Profile.tsx` | F2, F4 — Wire notification toggles + install row |
| 4 | `client/src/screens/Home.tsx` | F4, F5 — Install card, badge logic |
| 5 | `client/src/screens/Space.tsx` | F5 — Clear badge on view |
| 6 | `client/src/store/authStore.ts` | F2 — Register/unregister push on login/logout |
| 7 | `client/src/api/client.ts` | F3 — Offline-aware error handling |
| 8 | `client/src/components/layout/MainLayout.tsx` | F3 — Add OfflineBanner |
| 9 | `server/src/db/schema.ts` | F2 — Add push_subscriptions table |
| 10 | `server/src/routes/announcements.ts` | F2 — Trigger push on new announcement |
| 11 | `server/src/routes/materials.ts` | F2 — Trigger push on new material |
| 12 | `server/src/index.ts` | F2 — Register push routes |
| 13 | `server/package.json` | F2 — Add web-push dependency |
| 14 | `render.yaml` | F2 — Add VAPID env vars |

---

## Progress Tracking

| Feature | Status | Completed |
|---------|--------|-----------|
| F1: Custom SW + Offline-First | ██████████ 100% | ✅ |
| F2: Push Notifications | ██████████ 100% | ✅ |
| F3: Offline/Online Indicator | ██████████ 100% | ✅ |
| F4: Install Prompt UI | ██████████ 100% | ✅ |
| F5: App Badge | ██████████ 100% | ✅ |
| F6: SW Update Prompt | ██████████ 100% | ✅ |

---

## Changelog

### 2026-07-26 — Initial Implementation
- **F1**: Created custom SW at `client/src/sw.ts` with Workbox injectManifest. Includes push/notificationclick/message handlers, NetworkFirst API cache, StaleWhileRevalidate page cache, CacheFirst font cache. Offline fallback page at `client/public/offline.html`.
- **F2**: Backend: Added `push_subscriptions` table to schema, `server/src/routes/push.ts` (subscribe/unsubscribe/test), `server/src/lib/push.ts` (sendPushToSpaceMembers/sendPushToUser with web-push), push triggers on new announcements. Frontend: `client/src/lib/push.ts` (registerPushSubscription/unregisterPushSubscription), `client/src/store/notificationStore.ts` (notification preferences with localStorage persistence), notification toggles wired in Profile.tsx, push registration on login, cleanup on logout.
- **F3**: `client/src/store/connectivityStore.ts` with online/offline event listeners. `client/src/components/ui/OfflineBanner.tsx` — yellow banner when offline. Integrated into MainLayout.tsx. Offline-aware API error helper in client.ts.
- **F4**: `client/src/hooks/useInstallPrompt.ts` — captures beforeinstallprompt, tracks dismissed/installed state with localStorage. Install card on Home page + Install row in Profile.
- **F5**: `client/src/store/badgeStore.ts` — wraps navigator.setAppBadge/clearAppBadge. Unread count computed on Home mount, badge cleared on Space tab view.
- **F6**: Changed registerType from 'autoUpdate' to 'prompt'. `client/src/store/updateStore.ts` + `client/src/components/ui/UpdatePrompt.tsx` — toast with Update button when new SW detected. SKIP_WAITING message handler in SW.
- **End-to-end**: Typescript clean, Vite build succeeds with 33 precache entries (488 KB). Server compiles with web-push and VAPID keys. Render.yaml updated with VAPID env vars.

---

## VAPID Keys (stored)
```
subject: mailto:webdaddyempire@gmail.com
publicKey: BK-fNRDB2k-Vkap_EPjRkJ_r4QT4cPfYZFCh_rjGs_hrmWYrCde-uK9H-2ZAdtU9Xlils6wA2pfbP_1ZXwWCqCU
privateKey: onDjUGHMOlXCsyB8_FL9gKD_Qm0xjHWCQFK9yg-Wr84
```

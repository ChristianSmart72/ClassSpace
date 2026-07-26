# ClassSpace — Client

React 19 + TypeScript + Vite 8 frontend for ClassSpace.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 5000 |
| `npm run build` | TypeScript check + Vite production build (includes PWA SW) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |

## PWA

The production build generates a service worker (`sw.js`) with:
- Precaching of all static assets (JS, CSS, HTML, icons)
- Runtime caching for API calls (NetworkFirst, 24h expiry)
- Runtime caching for Google Fonts (CacheFirst, 1yr expiry)
- SPA navigation fallback

The app is installable on Android and iOS home screens.

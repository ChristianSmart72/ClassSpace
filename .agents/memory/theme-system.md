---
name: Theme system
description: Dark/light theme toggle — CSS variables, store, toggle placement
---

Theme is stored in localStorage key 'theme'. Applied by setting `data-theme` attribute on `document.documentElement`.

CSS in `client/src/index.css`: Tailwind `@theme` block sets dark defaults. `[data-theme="light"]` selector overrides all `--color-app-*` variables.

Store: `client/src/store/themeStore.ts` (Zustand). Initializes from localStorage on import (side effect at module level — runs before React mounts).

Toggle placement: BottomNav (mobile — emoji icon), SideNav (desktop — SVG sun/moon icon with ThemeToggle component).

**Why:** Single data-theme attribute approach avoids class conflicts with Tailwind and works cleanly with CSS custom properties.

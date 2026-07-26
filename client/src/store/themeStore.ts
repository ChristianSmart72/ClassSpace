import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function lsSet(key: string, val: string) {
  try { localStorage.setItem(key, val) } catch {}
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  lsSet('theme', t);
}

const saved: Theme = (lsGet('theme') as Theme) || 'dark';
applyTheme(saved);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: saved,
  toggle: () =>
    set((s) => {
      const next: Theme = s.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return { theme: next };
    }),
  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
  },
}));

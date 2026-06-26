import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}

const saved = (localStorage.getItem('theme') as Theme) || 'dark';
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

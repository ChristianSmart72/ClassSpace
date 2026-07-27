import { create } from 'zustand';

interface BadgeState {
  count: number;
  setBadge: (count: number) => Promise<void>;
  clearBadge: () => Promise<void>;
}

export const useBadgeStore = create<BadgeState>((set) => ({
  count: 0,
  setBadge: async (count: number) => {
    set({ count });
    try {
      if (navigator.setAppBadge) await navigator.setAppBadge(count);
    } catch {}
  },
  clearBadge: async () => {
    set({ count: 0 });
    try {
      if (navigator.clearAppBadge) await navigator.clearAppBadge();
    } catch {}
  },
}));

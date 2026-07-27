import { create } from 'zustand';
import type { User } from '../types';
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth';
import { registerPushSubscription, unregisterPushSubscription } from '../lib/push';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: (() => { try { return localStorage.getItem('token') } catch { return null } })(),
  loading: false,
  initialized: false,

  init: async () => {
    const token = (() => { try { return localStorage.getItem('token') } catch { return null } })();
    if (!token) {
      set({ initialized: true });
      return;
    }
    try {
      const res = await getMe();
      const { user, space } = res as any;
      if (space) {
        try { localStorage.setItem('spaceId', space.id) } catch {}
        const { useSpaceStore } = await import('./spaceStore');
        useSpaceStore.getState().fetchSpace(space.id);
      }
      set({ user, token, initialized: true });
    } catch {
      try { localStorage.removeItem('token') } catch {}
      set({ token: null, user: null, initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { token, user, space } = await apiLogin(email, password) as any;
      localStorage.setItem('token', token);
      if (space) {
        localStorage.setItem('spaceId', space.id);
        const { useSpaceStore } = await import('./spaceStore');
        useSpaceStore.getState().setSpace(space, space.courses ?? []);
      }
      set({ user, token, loading: false });
      registerPushSubscription(space?.id || '').catch(() => {});
    } catch (err: any) {
      set({ loading: false });
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const { token, user } = await apiRegister(name, email, password);
      localStorage.setItem('token', token);
      set({ user, token, loading: false });
    } catch (err: any) {
      set({ loading: false });
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  },

  logout: () => {
    unregisterPushSubscription().catch(() => {});
    try { localStorage.removeItem('token'); localStorage.removeItem('spaceId') } catch {}
    set({ user: null, token: null });
  },
}));

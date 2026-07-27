import { create } from 'zustand';
import type { User } from '../types';
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth';
import { registerPushSubscription, unregisterPushSubscription } from '../lib/push';
import { isOfflineError } from '../api/client';

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key: string, val: string) {
  try { localStorage.setItem(key, val) } catch {}
}
function safeRemove(key: string) {
  try { localStorage.removeItem(key) } catch {}
}

function getCachedUser(): User | null {
  const raw = safeGet('cachedUser');
  if (!raw) return null;
  try { return JSON.parse(raw) } catch { return null }
}
function setCachedUser(user: User) {
  safeSet('cachedUser', JSON.stringify(user));
}
function clearCachedUser() {
  safeRemove('cachedUser');
}

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
  user: getCachedUser(),
  token: safeGet('token'),
  loading: false,
  initialized: false,

  init: async () => {
    const token = safeGet('token');
    if (!token) {
      clearCachedUser();
      set({ user: null, token: null, initialized: true });
      return;
    }
    try {
      const res = await getMe();
      const { user, space } = res as any;
      if (user) setCachedUser(user);
      if (space) {
        safeSet('spaceId', space.id);
        const { useSpaceStore } = await import('./spaceStore');
        useSpaceStore.getState().restoreCache();
        useSpaceStore.getState().fetchSpace(space.id);
      }
      set({ user, token, initialized: true });
    } catch (err: any) {
      if (isOfflineError(err)) {
        const cachedUser = getCachedUser();
        if (cachedUser) {
          set({ user: cachedUser, token, initialized: true });
          const { useSpaceStore } = await import('./spaceStore');
          useSpaceStore.getState().restoreCache();
          return;
        }
      }
      safeRemove('token');
      clearCachedUser();
      set({ token: null, user: null, initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { token, user, space } = await apiLogin(email, password) as any;
      safeSet('token', token);
      if (user) setCachedUser(user);
      if (space) {
        safeSet('spaceId', space.id);
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
      safeSet('token', token);
      if (user) setCachedUser(user);
      set({ user, token, loading: false });
    } catch (err: any) {
      set({ loading: false });
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  },

  logout: () => {
    unregisterPushSubscription().catch(() => {});
    safeRemove('token');
    safeRemove('spaceId');
    clearCachedUser();
    set({ user: null, token: null });
  },
}));

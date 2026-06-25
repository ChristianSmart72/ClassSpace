import { create } from 'zustand';
import type { User } from '../types';
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth';

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
  token: localStorage.getItem('token'),
  loading: false,
  initialized: false,

  init: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ initialized: true });
      return;
    }
    try {
      const user = await getMe();
      set({ user, token, initialized: true });
    } catch {
      localStorage.removeItem('token');
      set({ token: null, user: null, initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { token, user } = await apiLogin(email, password);
      localStorage.setItem('token', token);
      set({ user, token, loading: false });
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
    localStorage.removeItem('token');
    localStorage.removeItem('spaceId');
    set({ user: null, token: null });
  },
}));

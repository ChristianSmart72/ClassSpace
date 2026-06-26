import { create } from 'zustand';
import type { Space, Course } from '../types';
import { createSpace as apiCreateSpace, getSpace as apiGetSpace, joinSpace as apiJoinSpace } from '../api/spaces';

interface SpaceState {
  currentSpace: Space | null;
  courses: Course[];
  members: any[];
  isMember: boolean;
  memberRole: string | null;
  loading: boolean;
  error: string | null;
  createSpace: (data: Parameters<typeof apiCreateSpace>[0]) => Promise<Space>;
  fetchSpace: (id: string) => Promise<void>;
  joinSpace: (code: string) => Promise<Space>;
  setSpace: (space: Space, courses: Course[]) => void;
  leaveSpace: () => void;
  clearError: () => void;
}

export const useSpaceStore = create<SpaceState>((set) => ({
  currentSpace: null,
  courses: [],
  members: [],
  isMember: false,
  memberRole: null,
  loading: false,
  error: null,

  createSpace: async (data) => {
    set({ loading: true, error: null });
    try {
      const { space, token } = await apiCreateSpace(data);
      if (token) localStorage.setItem('token', token);
      localStorage.setItem('spaceId', space.id);
      set({
        currentSpace: space,
        courses: space.courses ?? [],
        isMember: true,
        memberRole: 'rep',
        loading: false,
        error: null,
      });
      return space;
    } catch (err) {
      set({ loading: false, error: 'Failed to create space' });
      throw err;
    }
  },

  fetchSpace: async (id) => {
    set({ loading: true, error: null });
    try {
      const { space, members, isMember, memberRole } = await apiGetSpace(id);
      const courses: Course[] = space.courses ?? [];
      localStorage.setItem('spaceId', id);
      set({ currentSpace: space, courses, members, isMember, memberRole, loading: false, error: null });
    } catch {
      localStorage.removeItem('spaceId');
      set({ loading: false, error: 'Could not load space', currentSpace: null });
    }
  },

  joinSpace: async (code) => {
    set({ loading: true, error: null });
    try {
      const { space } = await apiJoinSpace(code);
      localStorage.setItem('spaceId', space.id);
      set({
        currentSpace: space,
        courses: space.courses ?? [],
        isMember: true,
        memberRole: 'member',
        loading: false,
        error: null,
      });
      return space;
    } catch (err) {
      set({ loading: false, error: 'Failed to join space' });
      throw err;
    }
  },

  setSpace: (space, courses) => {
    localStorage.setItem('spaceId', space.id);
    set({ currentSpace: space, courses, isMember: true, memberRole: 'member', error: null });
  },

  leaveSpace: () => {
    localStorage.removeItem('spaceId');
    set({ currentSpace: null, courses: [], members: [], isMember: false, memberRole: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

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
  createSpace: (data: Parameters<typeof apiCreateSpace>[0]) => Promise<Space>;
  fetchSpace: (id: string) => Promise<void>;
  joinSpace: (code: string) => Promise<Space>;
  setSpace: (space: Space, courses: Course[]) => void;
  leaveSpace: () => void;
}

export const useSpaceStore = create<SpaceState>((set) => ({
  currentSpace: null,
  courses: [],
  members: [],
  isMember: false,
  memberRole: null,
  loading: false,

  createSpace: async (data) => {
    set({ loading: true });
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
      });
      return space;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  fetchSpace: async (id) => {
    set({ loading: true });
    try {
      const { space, courses, members, isMember, memberRole } = await apiGetSpace(id);
      localStorage.setItem('spaceId', id);
      set({ currentSpace: space, courses, members, isMember, memberRole, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  joinSpace: async (code) => {
    set({ loading: true });
    try {
      const { space } = await apiJoinSpace(code);
      localStorage.setItem('spaceId', space.id);
      set({
        currentSpace: space,
        courses: space.courses ?? [],
        isMember: true,
        memberRole: 'member',
        loading: false,
      });
      return space;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  setSpace: (space, courses) => {
    localStorage.setItem('spaceId', space.id);
    set({ currentSpace: space, courses, isMember: true, memberRole: space.rep_id === 0 ? 'rep' : 'member' });
  },

  leaveSpace: () => {
    localStorage.removeItem('spaceId');
    set({ currentSpace: null, courses: [], members: [], isMember: false, memberRole: null });
  },
}));

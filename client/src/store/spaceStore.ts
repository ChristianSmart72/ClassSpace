import { create } from 'zustand';
import type { Space, Course } from '../types';
import { createSpace as apiCreateSpace, getSpace as apiGetSpace, joinSpace as apiJoinSpace, getUserSpaces as apiGetUserSpaces, leaveSpaceApi as apiLeaveSpace } from '../api/spaces';
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

const CACHE_KEYS = { space: 'cachedSpace', courses: 'cachedCourses', role: 'cachedRole' };

function cacheSpace(space: Space, courses: Course[], role: string | null) {
  safeSet(CACHE_KEYS.space, JSON.stringify(space));
  safeSet(CACHE_KEYS.courses, JSON.stringify(courses));
  if (role) safeSet(CACHE_KEYS.role, role);
}

function restoreSpaceCache(): { space: Space | null; courses: Course[]; role: string | null } {
  try {
    const spaceRaw = safeGet(CACHE_KEYS.space);
    const coursesRaw = safeGet(CACHE_KEYS.courses);
    const roleRaw = safeGet(CACHE_KEYS.role);
    return {
      space: spaceRaw ? JSON.parse(spaceRaw) : null,
      courses: coursesRaw ? JSON.parse(coursesRaw) : [],
      role: roleRaw || null,
    };
  } catch {
    return { space: null, courses: [], role: null };
  }
}

function clearSpaceCache() {
  safeRemove(CACHE_KEYS.space);
  safeRemove(CACHE_KEYS.courses);
  safeRemove(CACHE_KEYS.role);
}

interface UserSpace {
  id: string;
  name: string;
  uni: string;
  dept: string;
  level: string;
  invite_code: string;
  member_role: string;
}

interface SpaceState {
  currentSpace: Space | null;
  courses: Course[];
  members: any[];
  isMember: boolean;
  memberRole: string | null;
  loading: boolean;
  error: string | null;
  userSpaces: UserSpace[];
  userSpacesLoading: boolean;
  createSpace: (data: Parameters<typeof apiCreateSpace>[0]) => Promise<Space>;
  fetchSpace: (id: string) => Promise<void>;
  joinSpace: (code: string) => Promise<Space>;
  setSpace: (space: Space, courses: Course[]) => void;
  leaveSpace: () => void;
  removeMembership: (spaceId: string) => Promise<void>;
  clearError: () => void;
  restoreCache: () => void;
  clearCache: () => void;
  fetchUserSpaces: () => Promise<void>;
}

const initialCached = restoreSpaceCache();

export const useSpaceStore = create<SpaceState>((set) => ({
  currentSpace: initialCached.space,
  courses: initialCached.courses,
  members: [],
  isMember: !!initialCached.space,
  memberRole: initialCached.role,
  loading: false,
  error: null,
  userSpaces: [],
  userSpacesLoading: false,

  createSpace: async (data) => {
    set({ loading: true, error: null });
    try {
      const { space, token } = await apiCreateSpace(data);
      if (token) safeSet('token', token);
      safeSet('spaceId', space.id);
      cacheSpace(space, space.courses ?? [], 'rep');
      set({ currentSpace: space, courses: space.courses ?? [], isMember: true, memberRole: 'rep', loading: false, error: null });
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
      safeSet('spaceId', id);
      cacheSpace(space, courses, memberRole);
      set({ currentSpace: space, courses, members, isMember, memberRole, loading: false, error: null });
    } catch (err: any) {
      if (isOfflineError(err)) {
        const cached = restoreSpaceCache();
        if (cached.space) {
          set({ currentSpace: cached.space, courses: cached.courses, isMember: true, memberRole: cached.role, loading: false, error: null });
          return;
        }
      }
      safeRemove('spaceId');
      set({ loading: false, error: 'Could not load space', currentSpace: null });
    }
  },

  joinSpace: async (code) => {
    set({ loading: true, error: null });
    try {
      const { space } = await apiJoinSpace(code);
      safeSet('spaceId', space.id);
      cacheSpace(space, space.courses ?? [], 'member');
      set({ currentSpace: space, courses: space.courses ?? [], isMember: true, memberRole: 'member', loading: false, error: null });
      return space;
    } catch (err) {
      set({ loading: false, error: 'Failed to join space' });
      throw err;
    }
  },

  setSpace: (space, courses) => {
    safeSet('spaceId', space.id);
    cacheSpace(space, courses, 'member');
    set({ currentSpace: space, courses, isMember: true, memberRole: 'member', error: null });
  },

  leaveSpace: () => {
    safeRemove('spaceId');
    clearSpaceCache();
    set({ currentSpace: null, courses: [], members: [], isMember: false, memberRole: null, error: null });
  },

  removeMembership: async (spaceId) => {
    await apiLeaveSpace(spaceId);
    set((state) => {
      const userSpaces = state.userSpaces.filter(s => s.id !== spaceId);
      if (state.currentSpace?.id === spaceId) {
        safeRemove('spaceId');
        clearSpaceCache();
        return { userSpaces, currentSpace: null, courses: [], members: [], isMember: false, memberRole: null, error: null };
      }
      return { userSpaces };
    });
  },

  clearError: () => set({ error: null }),

  restoreCache: () => {
    const cached = restoreSpaceCache();
    if (cached.space && !useSpaceStore.getState().currentSpace) {
      set({ currentSpace: cached.space, courses: cached.courses, isMember: true, memberRole: cached.role });
    }
  },

  clearCache: () => clearSpaceCache(),

  fetchUserSpaces: async () => {
    set({ userSpacesLoading: true });
    try {
      const spaces = await apiGetUserSpaces();
      set({ userSpaces: spaces, userSpacesLoading: false });
    } catch {
      set({ userSpaces: [], userSpacesLoading: false });
    }
  },
}));

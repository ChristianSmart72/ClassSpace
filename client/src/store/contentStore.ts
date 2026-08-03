import { create } from 'zustand';
import type { Announcement, Material, Poll, Opportunity } from '../types';
import * as contentApi from '../api/content';
import * as pollsApi from '../api/polls';
import * as opportunitiesApi from '../api/opportunities';
import { isOfflineError } from '../api/client';
import { toast } from './toastStore';

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key: string, val: string) {
  try { localStorage.setItem(key, val) } catch {}
}
function cacheJson<T>(key: string, value: T) {
  safeSet(key, JSON.stringify(value));
}
function restoreJson<T>(key: string): T[] {
  try {
    const raw = safeGet(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return [] }
}
function cacheAnnouncements(announcements: Announcement[]) {
  cacheJson('cachedAnnouncements', announcements);
}
function restoreAnnouncements(): Announcement[] {
  return restoreJson<Announcement>('cachedAnnouncements');
}

interface ContentState {
  announcements: Announcement[];
  materials: Material[];
  polls: Poll[];
  opportunities: Opportunity[];
  loading: boolean;
  matLoading: boolean;
  pollsLoading: boolean;
  opportunitiesLoading: boolean;
  fetchAnnouncements: (spaceId: string, filter?: string) => Promise<void>;
  createAnnouncement: (spaceId: string, ann: Partial<Announcement>) => Promise<Announcement>;
  deleteAnnouncement: (id: number) => Promise<void>;
  updateAnnouncement: (id: number, updates: Partial<Announcement>) => Promise<void>;
  fetchMaterials: (courseId: number) => Promise<void>;
  uploadMaterial: (courseId: number, payload: Parameters<typeof contentApi.uploadMaterial>[1]) => Promise<Material>;
  deleteMaterial: (id: number) => Promise<void>;
  updateMaterial: (id: number, updates: Partial<Material>) => Promise<void>;
  clearMaterials: () => void;
  fetchPolls: (spaceId: string) => Promise<void>;
  createPoll: (spaceId: string, payload: { question: string; options: string[]; closes_at?: string }) => Promise<Poll>;
  votePoll: (pollId: number, optionId: number) => Promise<void>;
  deletePoll: (pollId: number) => Promise<void>;
  fetchOpportunities: (spaceId: string) => Promise<void>;
  createOpportunity: (spaceId: string, payload: Parameters<typeof opportunitiesApi.createOpportunity>[1]) => Promise<Opportunity>;
  deleteOpportunity: (id: number) => Promise<void>;
}

export const useContentStore = create<ContentState>((set) => ({
  announcements: restoreAnnouncements(),
  materials: [],
  polls: [],
  opportunities: [],
  loading: false,
  matLoading: false,
  pollsLoading: false,
  opportunitiesLoading: false,

  fetchAnnouncements: async (spaceId, filter) => {
    set({ loading: true });
    try {
      const announcements = await contentApi.getAnnouncements(spaceId, filter);
      cacheAnnouncements(announcements);
      set({ announcements, loading: false });
    } catch (err: any) {
      if (isOfflineError(err)) {
        const cached = restoreAnnouncements();
        if (cached.length > 0) {
          set({ announcements: cached, loading: false });
          toast("You're offline — showing cached content", 'info');
          return;
        }
      }
      set({ loading: false });
    }
  },

  createAnnouncement: async (spaceId, ann) => {
    try {
      const announcement = await contentApi.createAnnouncement(spaceId, ann);
      set((state) => ({ announcements: [announcement, ...state.announcements] }));
      toast(announcement.type === 'meeting' ? 'Event created' : 'Announcement posted');
      return announcement;
    } catch (err: any) {
      toast(err?.response?.data?.error || err?.message || 'Could not post announcement', 'error');
      throw err;
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      await contentApi.deleteAnnouncement(id);
      set((state) => ({ announcements: state.announcements.filter((a) => a.id !== id) }));
      toast('Announcement deleted');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Could not delete announcement', 'error');
      throw err;
    }
  },

  updateAnnouncement: async (id, updates) => {
    await contentApi.patchAnnouncement(id, updates);
    set((state) => ({
      announcements: state.announcements.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  },

  fetchMaterials: async (courseId) => {
    set({ matLoading: true });
    try {
      const materials = await contentApi.getMaterials(courseId);
      cacheJson('cachedMaterials:' + courseId, materials);
      set({ materials, matLoading: false });
    } catch (err: any) {
      if (isOfflineError(err)) {
        const cached = restoreJson<Material>('cachedMaterials:' + courseId);
        if (cached.length > 0) {
          set({ materials: cached, matLoading: false });
          toast("You're offline — showing cached content", 'info');
          return;
        }
      }
      set({ matLoading: false });
    }
  },

  uploadMaterial: async (courseId, payload) => {
    try {
      const material = await contentApi.uploadMaterial(courseId, payload);
      set((state) => ({ materials: [material, ...state.materials] }));
      toast('Material uploaded');
      return material;
    } catch (err: any) {
      toast(err?.response?.data?.error || err?.message || 'Upload failed', 'error');
      throw err;
    }
  },

  deleteMaterial: async (id) => {
    try {
      await contentApi.deleteMaterial(id);
      set((state) => ({ materials: state.materials.filter((m) => m.id !== id) }));
      toast('Material deleted');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Could not delete material', 'error');
      throw err;
    }
  },

  updateMaterial: async (id, updates) => {
    await contentApi.patchMaterial(id, updates);
    set((state) => ({
      materials: state.materials.map(m => m.id === id ? { ...m, ...updates } : m),
    }));
  },

  clearMaterials: () => set({ materials: [] }),

  fetchPolls: async (spaceId) => {
    set({ pollsLoading: true });
    try {
      const polls = await pollsApi.getPolls(spaceId);
      cacheJson('cachedPolls:' + spaceId, polls);
      set({ polls, pollsLoading: false });
    } catch (err: any) {
      if (isOfflineError(err)) {
        const cached = restoreJson<Poll>('cachedPolls:' + spaceId);
        if (cached.length > 0) {
          set({ polls: cached, pollsLoading: false });
          toast("You're offline — showing cached content", 'info');
          return;
        }
      }
      set({ pollsLoading: false });
    }
  },

  createPoll: async (spaceId, payload) => {
    try {
      const poll = await pollsApi.createPoll(spaceId, payload);
      set((state) => ({ polls: [poll, ...state.polls] }));
      toast('Poll created');
      return poll;
    } catch (err: any) {
      toast(err?.response?.data?.error || err?.message || 'Could not create poll', 'error');
      throw err;
    }
  },

  votePoll: async (pollId, optionId) => {
    const result = await pollsApi.votePoll(pollId, optionId);
    set((state) => ({
      polls: state.polls.map((p) =>
        p.id === pollId
          ? { ...p, options: result.options, total_votes: result.total_votes, my_vote: result.voted_option_id }
          : p
      ),
    }));
  },

  deletePoll: async (pollId) => {
    try {
      await pollsApi.deletePoll(pollId);
      set((state) => ({ polls: state.polls.filter((p) => p.id !== pollId) }));
      toast('Poll deleted');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Could not delete poll', 'error');
      throw err;
    }
  },

  fetchOpportunities: async (spaceId) => {
    set({ opportunitiesLoading: true });
    try {
      const opportunities = await opportunitiesApi.getOpportunities(spaceId);
      cacheJson('cachedOpportunities:' + spaceId, opportunities);
      set({ opportunities, opportunitiesLoading: false });
    } catch (err: any) {
      if (isOfflineError(err)) {
        const cached = restoreJson<Opportunity>('cachedOpportunities:' + spaceId);
        if (cached.length > 0) {
          set({ opportunities: cached, opportunitiesLoading: false });
          toast("You're offline — showing cached content", 'info');
          return;
        }
      }
      set({ opportunitiesLoading: false });
    }
  },

  createOpportunity: async (spaceId, payload) => {
    try {
      const opportunity = await opportunitiesApi.createOpportunity(spaceId, payload);
      set((state) => ({ opportunities: [opportunity, ...state.opportunities] }));
      toast('Opportunity posted');
      return opportunity;
    } catch (err: any) {
      toast(err?.response?.data?.error || err?.message || 'Could not post opportunity', 'error');
      throw err;
    }
  },

  deleteOpportunity: async (id) => {
    try {
      await opportunitiesApi.deleteOpportunity(id);
      set((state) => ({ opportunities: state.opportunities.filter((o) => o.id !== id) }));
      toast('Opportunity deleted');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Could not delete opportunity', 'error');
      throw err;
    }
  },
}));

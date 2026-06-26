import { create } from 'zustand';
import type { Announcement, Material, Poll, Opportunity } from '../types';
import * as contentApi from '../api/content';
import * as pollsApi from '../api/polls';
import * as opportunitiesApi from '../api/opportunities';

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
  fetchMaterials: (courseId: number) => Promise<void>;
  uploadMaterial: (courseId: number, payload: Parameters<typeof contentApi.uploadMaterial>[1]) => Promise<Material>;
  deleteMaterial: (id: number) => Promise<void>;
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
  announcements: [],
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
      set({ announcements, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createAnnouncement: async (spaceId, ann) => {
    const announcement = await contentApi.createAnnouncement(spaceId, ann);
    set((state) => ({ announcements: [announcement, ...state.announcements] }));
    return announcement;
  },

  deleteAnnouncement: async (id) => {
    await contentApi.deleteAnnouncement(id);
    set((state) => ({ announcements: state.announcements.filter((a) => a.id !== id) }));
  },

  fetchMaterials: async (courseId) => {
    set({ matLoading: true });
    try {
      const materials = await contentApi.getMaterials(courseId);
      set({ materials, matLoading: false });
    } catch {
      set({ matLoading: false });
    }
  },

  uploadMaterial: async (courseId, payload) => {
    const material = await contentApi.uploadMaterial(courseId, payload);
    set((state) => ({ materials: [material, ...state.materials] }));
    return material;
  },

  deleteMaterial: async (id) => {
    await contentApi.deleteMaterial(id);
    set((state) => ({ materials: state.materials.filter((m) => m.id !== id) }));
  },

  clearMaterials: () => set({ materials: [] }),

  fetchPolls: async (spaceId) => {
    set({ pollsLoading: true });
    try {
      const polls = await pollsApi.getPolls(spaceId);
      set({ polls, pollsLoading: false });
    } catch {
      set({ pollsLoading: false });
    }
  },

  createPoll: async (spaceId, payload) => {
    const poll = await pollsApi.createPoll(spaceId, payload);
    set((state) => ({ polls: [poll, ...state.polls] }));
    return poll;
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
    await pollsApi.deletePoll(pollId);
    set((state) => ({ polls: state.polls.filter((p) => p.id !== pollId) }));
  },

  fetchOpportunities: async (spaceId) => {
    set({ opportunitiesLoading: true });
    try {
      const opportunities = await opportunitiesApi.getOpportunities(spaceId);
      set({ opportunities, opportunitiesLoading: false });
    } catch {
      set({ opportunitiesLoading: false });
    }
  },

  createOpportunity: async (spaceId, payload) => {
    const opportunity = await opportunitiesApi.createOpportunity(spaceId, payload);
    set((state) => ({ opportunities: [opportunity, ...state.opportunities] }));
    return opportunity;
  },

  deleteOpportunity: async (id) => {
    await opportunitiesApi.deleteOpportunity(id);
    set((state) => ({ opportunities: state.opportunities.filter((o) => o.id !== id) }));
  },
}));

import { create } from 'zustand';
import type { Announcement, Material } from '../types';
import * as contentApi from '../api/content';

interface ContentState {
  announcements: Announcement[];
  materials: Material[];
  loading: boolean;
  matLoading: boolean;
  fetchAnnouncements: (spaceId: string, filter?: string) => Promise<void>;
  createAnnouncement: (spaceId: string, ann: Partial<Announcement>) => Promise<Announcement>;
  deleteAnnouncement: (id: number) => Promise<void>;
  fetchMaterials: (courseId: number) => Promise<void>;
  uploadMaterial: (courseId: number, payload: Parameters<typeof contentApi.uploadMaterial>[1]) => Promise<Material>;
  deleteMaterial: (id: number) => Promise<void>;
  clearMaterials: () => void;
}

export const useContentStore = create<ContentState>((set) => ({
  announcements: [],
  materials: [],
  loading: false,
  matLoading: false,

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
}));

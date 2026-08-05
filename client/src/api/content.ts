import api from './client';
import type { Announcement, Material } from '../types';

export async function getAnnouncements(spaceId: string, filter?: string) {
  const params = filter && filter !== 'all' ? { filter } : {};
  const { data } = await api.get(`/spaces/${spaceId}/announcements`, { params });
  return data.announcements as Announcement[];
}

export async function createAnnouncement(spaceId: string, ann: Record<string, any>) {
  if (ann.file || ann.files) {
    const formData = new FormData();
    for (const [k, v] of Object.entries(ann)) {
      if (k === 'file') {
        formData.append('file', v as File);
      } else if (k === 'files') {
        for (const f of (v as File[])) formData.append('file', f);
      } else if (v !== undefined && v !== null) {
        formData.append(k, String(v));
      }
    }
    const { data } = await api.post(`/spaces/${spaceId}/announcements`, formData);
    return data.announcement as Announcement;
  }
  const { data } = await api.post(`/spaces/${spaceId}/announcements`, ann);
  return data.announcement as Announcement;
}

export async function deleteAnnouncement(id: number) {
  await api.delete(`/announcements/${id}`);
}

export async function getMaterials(courseId: number) {
  const { data } = await api.get(`/courses/${courseId}/materials`);
  return data.materials as Material[];
}

export async function uploadMaterial(courseId: number, payload: {
  name: string; category: string; file_url: string; file_name: string; file_size: number;
}) {
  const { data } = await api.post(`/courses/${courseId}/materials`, {
    name: payload.name,
    category: payload.category,
    file_url: payload.file_url,
    file_name: payload.file_name,
    file_size: payload.file_size,
  });
  return data.material as Material;
}

export async function deleteMaterial(id: number) {
  await api.delete(`/materials/${id}`);
}

export async function patchMaterial(id: number, updates: Partial<Material>) {
  const { data } = await api.patch(`/materials/${id}`, updates);
  return data;
}

export async function getMaterialsSummary(spaceId: string) {
  const { data } = await api.get(`/spaces/${spaceId}/materials/summary`);
  return data as { courses: { course_id: number; count: number; latest: { name: string; created_at: string } | null }[] };
}

export async function getRecentMaterials(spaceId: string, limit = 5) {
  const { data } = await api.get(`/spaces/${spaceId}/materials/recent`, { params: { limit } });
  return data.materials as Material[];
}

export async function patchAnnouncement(id: number, updates: Partial<Announcement>) {
  const { data } = await api.patch(`/announcements/${id}`, updates);
  return data;
}

export async function getAnnouncement(id: number) {
  const { data } = await api.get(`/announcements/${id}`);
  return data as import('../types').Announcement & { course_name?: string; course_code?: string; course_icon?: string; space_name?: string };
}

export async function toggleReaction(announcementId: number, emoji: string) {
  const { data } = await api.post(`/announcements/${announcementId}/react`, { emoji });
  return data as { reactions: Record<string, number>; userReacted: boolean; emoji: string };
}

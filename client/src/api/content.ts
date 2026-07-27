import api from './client';
import type { Announcement, Material } from '../types';

export async function getAnnouncements(spaceId: string, filter?: string) {
  const params = filter && filter !== 'all' ? { filter } : {};
  const { data } = await api.get(`/spaces/${spaceId}/announcements`, { params });
  return data.announcements as Announcement[];
}

export async function createAnnouncement(spaceId: string, ann: Partial<Announcement>) {
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
  name: string; file_data: string; file_size: number; file_type: string; category: string;
}) {
  const { data } = await api.post(`/courses/${courseId}/materials`, payload);
  return data.material as Material;
}

export async function deleteMaterial(id: number) {
  await api.delete(`/materials/${id}`);
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

export async function resetDemo() {
  const { data } = await api.post('/demo/reset');
  return data;
}

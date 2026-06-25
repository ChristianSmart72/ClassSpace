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

export async function getMaterials(courseId: number) {
  const { data } = await api.get(`/courses/${courseId}/materials`);
  return data.materials as Material[];
}

export async function uploadMaterial(courseId: number, formData: FormData) {
  const { data } = await api.post(`/courses/${courseId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.material as Material;
}

export async function resetDemo() {
  const { data } = await api.post('/demo/reset');
  return data;
}

import api from './client';
import type { Space, Course } from '../types';

interface CreateSpaceData {
  name: string;
  dept: string;
  level: string;
  uni: string;
  slug?: string;
  courses: { name: string; code: string; icon: string; color_index: number }[];
}

interface CreateSpaceResponse {
  space: Space & { courses: Course[] };
  token: string;
}

export async function createSpace(data: CreateSpaceData): Promise<CreateSpaceResponse> {
  const res = await api.post('/spaces', data);
  return res.data;
}

export async function getSpace(id: string) {
  const { data } = await api.get(`/spaces/${id}`);
  return data;
}

export async function joinSpace(inviteCode: string) {
  const { data } = await api.post('/spaces/join', { inviteCode });
  return data;
}

export async function getUserSpaces() {
  const { data } = await api.get('/user/spaces');
  return data.spaces as { id: string; name: string; uni: string; dept: string; level: string; invite_code: string; member_role: string }[];
}

export async function leaveSpaceApi(spaceId: string) {
  const { data } = await api.delete(`/spaces/${spaceId}/membership`);
  return data;
}

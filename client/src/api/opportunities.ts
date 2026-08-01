import api from './client';
import type { Opportunity } from '../types';

export async function getOpportunities(spaceId: string) {
  const { data } = await api.get(`/spaces/${spaceId}/opportunities`);
  return data.opportunities as Opportunity[];
}

export async function createOpportunity(spaceId: string, payload: {
  title: string;
  description: string;
  category: string;
  link?: string;
  deadline?: string;
}) {
  const { data } = await api.post(`/spaces/${spaceId}/opportunities`, payload);
  return data.opportunity as Opportunity;
}

export async function deleteOpportunity(id: number) {
  await api.delete(`/opportunities/${id}`);
}

export async function patchOpportunity(id: number, updates: { pinned?: boolean }) {
  const { data } = await api.patch(`/opportunities/${id}`, updates);
  return data;
}

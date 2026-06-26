import api from './client';
import type { Poll } from '../types';

export async function getPolls(spaceId: string) {
  const { data } = await api.get(`/spaces/${spaceId}/polls`);
  return data.polls as Poll[];
}

export async function createPoll(spaceId: string, payload: { question: string; options: string[]; closes_at?: string }) {
  const { data } = await api.post(`/spaces/${spaceId}/polls`, payload);
  return data.poll as Poll;
}

export async function votePoll(pollId: number, optionId: number) {
  const { data } = await api.post(`/polls/${pollId}/vote`, { option_id: optionId });
  return data as { options: Poll['options']; total_votes: number; voted_option_id: number };
}

export async function deletePoll(pollId: number) {
  await api.delete(`/polls/${pollId}`);
}

import api from './client';
import type { TimetableEntry } from '../types';

export async function getTimetable(spaceId: string) {
  const { data } = await api.get(`/spaces/${spaceId}/timetable`);
  return data.timetable as TimetableEntry[];
}

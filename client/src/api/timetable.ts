import api from './client';
import type { TimetableEntry } from '../types';

export async function getTimetable(spaceId: string) {
  const { data } = await api.get(`/spaces/${spaceId}/timetable`);
  return data.timetable as TimetableEntry[];
}

export async function createTimetableEntry(spaceId: string, entry: {
  course_id: number; day: string; start_time: string; end_time: string; venue?: string; lecturer?: string;
}) {
  const { data } = await api.post(`/spaces/${spaceId}/timetable`, entry);
  return data;
}

export async function deleteTimetableEntry(id: number) {
  await api.delete(`/timetable/${id}`);
}

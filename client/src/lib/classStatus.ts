import type { TimetableEntry } from '../types';

export type ClassState = 'cancelled' | 'past' | 'ongoing' | 'upcoming';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Resolve a timetable entry's start/end to a concrete Date for the given day.
function dateAtTime(day: Date, time: string): Date {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  d.setMinutes(timeToMinutes(time));
  return d;
}

export function classStart(entry: TimetableEntry, day: Date): Date {
  return dateAtTime(day, entry.start_time);
}

export function classEnd(entry: TimetableEntry, day: Date): Date {
  return dateAtTime(day, entry.end_time);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Derive a class's visual state from its real date and scheduled times.
 * Cancellation always wins, so a cancelled class never reads as ongoing/upcoming.
 */
export function getClassState(entry: TimetableEntry, day: Date, now: Date): ClassState {
  if (entry.cancelled) return 'cancelled';
  const start = classStart(entry, day);
  const end = classEnd(entry, day);
  if (now >= start && now < end) return 'ongoing';
  if (now >= end) return 'past';
  return 'upcoming';
}

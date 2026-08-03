import { useState } from 'react';
import { useSpaceStore } from '../../store/spaceStore';
import { createTimetableEntry } from '../../api/timetable';
import { DAYS } from '../../types';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function AddClassSheet({ spaceId, onClose, onAdded }: { spaceId: string; onClose: () => void; onAdded: () => void }) {
  const { courses } = useSpaceStore();
  const [courseId, setCourseId] = useState<number | ''>('');
  const [day, setDay] = useState(DAYS[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [venue, setVenue] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!courseId) {
      setError('Choose a course');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createTimetableEntry(spaceId, {
        course_id: courseId as number,
        day,
        start_time: startTime,
        end_time: endTime,
        venue: venue.trim() || undefined,
        lecturer: lecturer.trim() || undefined,
      });
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to add class');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-[430px] mx-auto bg-app-bg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-app-bg border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-app-text font-jakarta font-bold text-base">Add Class</h2>
          <button onClick={onClose} className="text-app-text-dim text-lg">&times;</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && <p className="text-app-red text-sm font-inter">{error}</p>}

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Course</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm appearance-none">
              <option value="">Select course</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Day</label>
            <div className="flex gap-1.5">
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => setDay(d)}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-jakarta font-semibold transition-all border ${
                    day === d
                      ? 'bg-app-accent text-app-bg border-app-accent'
                      : 'bg-app-surface text-app-text-dim border-app-border'
                  }`}>
                  {DAY_SHORT[i]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Start</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm focus:border-app-accent transition-colors" />
            </div>
            <div>
              <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">End</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm focus:border-app-accent transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Venue (optional)</label>
            <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Lecture Theatre 2"
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Lecturer (optional)</label>
            <input value={lecturer} onChange={(e) => setLecturer(e.target.value)} placeholder="e.g. Dr. Okafor"
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
            {submitting ? 'Adding...' : 'Add to Timetable'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useContentStore } from '../../store/contentStore';
import { useSpaceStore } from '../../store/spaceStore';
import { ANNOUNCEMENT_TYPES } from '../../types';

export function PostAnnouncementSheet({ spaceId, onClose }: { spaceId: string; onClose: () => void }) {
  const { courses } = useSpaceStore();
  const { createAnnouncement } = useContentStore();
  const [courseId, setCourseId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('announcement');
  const [urgent, setUrgent] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [venue, setVenue] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createAnnouncement(spaceId, {
        course_id: courseId || null,
        title,
        body,
        type: type as any,
        urgent,
        pinned,
        deadline: deadline || undefined,
        venue: venue || undefined,
        instructions: instructions || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-[430px] mx-auto bg-app-bg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-app-bg border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-app-text font-syne font-bold text-base">Post Announcement</h2>
          <button onClick={onClose} className="text-app-text-dim text-lg">&times;</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && <p className="text-app-red text-sm font-dm">{error}</p>}

          <div>
            <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Course (optional)</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm appearance-none">
              <option value="">General</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {ANNOUNCEMENT_TYPES.map((t: any) => (
                <button key={t.value} onClick={() => setType(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-syne font-semibold transition-all border ${
                    type === t.value
                      ? 'bg-app-accent text-app-bg border-app-accent'
                      : 'bg-app-surface text-app-text-dim border-app-border'
                  }`}>{t.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title"
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement..." rows={4}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm focus:border-app-accent transition-colors" />
            </div>
            <div>
              <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Venue</label>
              <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Location"
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Instructions</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Full instructions..." rows={3}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors resize-none" />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)}
                className="w-4 h-4 rounded border-app-border bg-app-surface accent-app-accent" />
              <span className="text-app-text text-sm font-dm">Urgent</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded border-app-border bg-app-surface accent-app-accent" />
              <span className="text-app-text text-sm font-dm">Pin</span>
            </label>
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
            {submitting ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
}

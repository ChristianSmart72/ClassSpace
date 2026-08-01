import { useState, useRef } from 'react';
import { useContentStore } from '../../store/contentStore';
import { useSpaceStore } from '../../store/spaceStore';
import { ANNOUNCEMENT_TYPES } from '../../types';
import type { Announcement } from '../../types';
import api from '../../api/client';

export function PostAnnouncementSheet({ spaceId, onClose, announcement }: { spaceId: string; onClose: () => void; announcement?: Announcement }) {
  const { courses } = useSpaceStore();
  const { fetchAnnouncements } = useContentStore();
  const [courseId, setCourseId] = useState<number | ''>(announcement?.course_id ?? '');
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [body, setBody] = useState(announcement?.body ?? '');
  const [type, setType] = useState(announcement?.type ?? 'announcement');
  const [urgent, setUrgent] = useState(announcement?.urgent ?? false);
  const [pinned, setPinned] = useState(announcement?.pinned ?? false);
  const [deadline, setDeadline] = useState(announcement?.deadline ?? '');
  const [venue, setVenue] = useState(announcement?.venue ?? '');
  const [instructions, setInstructions] = useState(announcement?.instructions ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!announcement;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    const oversized = picked.filter(f => f.size > 16 * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`File too large — max 16MB per file (${oversized[0].name})`);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setError('');
    setFiles(prev => [...prev, ...picked]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (i: number) => setFiles(files.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (isEdit && announcement) {
        await api.patch(`/announcements/${announcement.id}`, {
          course_id: courseId || null,
          title,
          body,
          type,
          urgent,
          pinned,
          deadline: deadline || null,
          venue: venue || null,
          instructions: instructions || null,
        });
        await fetchAnnouncements(spaceId);
      } else {
        const formData = new FormData();
        formData.append('course_id', String(courseId || ''));
        formData.append('title', title);
        formData.append('body', body);
        formData.append('type', type);
        formData.append('urgent', String(urgent));
        formData.append('pinned', String(pinned));
        if (deadline) formData.append('deadline', deadline);
        if (venue) formData.append('venue', venue);
        if (instructions) formData.append('instructions', instructions);
        for (const f of files) formData.append('file', f);
        await api.post(`/spaces/${spaceId}/announcements`, formData, {
          onUploadProgress: e => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
        });
        await fetchAnnouncements(spaceId);
      }
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
          <h2 className="text-app-text font-jakarta font-bold text-base">{isEdit ? 'Edit Announcement' : 'Post Announcement'}</h2>
          <button onClick={onClose} className="text-app-text-dim text-lg">&times;</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && <p className="text-app-red text-sm font-inter">{error}</p>}

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Course (optional)</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm appearance-none">
              <option value="">General</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {ANNOUNCEMENT_TYPES.map((t: any) => (
                <button key={t.value} onClick={() => setType(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-jakarta font-semibold transition-all border ${
                    type === t.value
                      ? 'bg-app-accent text-app-bg border-app-accent'
                      : 'bg-app-surface text-app-text-dim border-app-border'
                  }`}>{t.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title"
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement..." rows={4}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm focus:border-app-accent transition-colors" />
            </div>
            <div>
              <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Venue</label>
              <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Location"
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Instructions</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Full instructions..." rows={3}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors resize-none" />
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Attachments (optional, up to 5)</label>
            <input ref={fileRef} type="file" multiple onChange={handleFiles}
              className="w-full text-app-text text-sm font-inter file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-app-border file:bg-app-surface file:text-app-text file:text-xs file:font-jakarta file:font-semibold hover:file:bg-app-surface-2 cursor-pointer" />
            {files.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                {files.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="bg-app-surface border border-app-border rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="text-sm flex-shrink-0">📎</span>
                    <span className="text-app-text text-xs font-inter truncate flex-1">{f.name}</span>
                    <span className="text-app-text-faint text-[10px] font-inter flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => removeFile(i)} className="text-app-red text-sm flex-shrink-0 px-1">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)}
                className="w-4 h-4 rounded border-app-border bg-app-surface accent-app-accent" />
              <span className="text-app-text text-sm font-inter">Urgent</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded border-app-border bg-app-surface accent-app-accent" />
              <span className="text-app-text text-sm font-inter">Pin</span>
            </label>
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
            {submitting ? (progress > 0 ? `Posting ${progress}%...` : 'Posting...') : isEdit ? 'Update Announcement' : 'Post Announcement'}
          </button>
          {submitting && files.length > 0 && (
            <div className="w-full h-1.5 bg-app-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-app-accent rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

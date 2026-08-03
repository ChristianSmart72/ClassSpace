import { useState } from 'react';
import { useContentStore } from '../../store/contentStore';
import { OPPORTUNITY_CATEGORIES } from '../../types';

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function PostOpportunitySheet({ spaceId, onClose }: { spaceId: string; onClose: () => void }) {
  const { createOpportunity } = useContentStore();
  const [category, setCategory] = useState<string>(OPPORTUNITY_CATEGORIES[0].value);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }
    if (title.trim().length > 200) {
      setError('Title must be 200 characters or less');
      return;
    }
    if (link.trim() && !isValidUrl(link.trim())) {
      setError('Link must be a valid http(s) URL');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createOpportunity(spaceId, {
        title: title.trim(),
        description: description.trim(),
        category,
        link: link.trim() || undefined,
        deadline: deadline || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to post opportunity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-[430px] mx-auto bg-app-bg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-app-bg border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-app-text font-jakarta font-bold text-base">Post Opportunity</h2>
          <button onClick={onClose} className="text-app-text-dim text-lg">&times;</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && <p className="text-app-red text-sm font-inter">{error}</p>}

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {OPPORTUNITY_CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-jakarta font-semibold transition-all border ${
                    category === c.value
                      ? 'bg-app-accent text-app-bg border-app-accent'
                      : 'bg-app-surface text-app-text-dim border-app-border'
                  }`}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Opportunity title" maxLength={200}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this opportunity about?" rows={4}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm focus:border-app-accent transition-colors" />
            </div>
            <div>
              <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">Apply link</label>
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." inputMode="url"
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
            {submitting ? 'Posting...' : 'Post Opportunity'}
          </button>
        </div>
      </div>
    </div>
  );
}

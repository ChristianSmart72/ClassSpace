import { useState } from 'react';
import { OPPORTUNITY_CATEGORIES } from '../../types';
import { formatRelativeTime } from '../../lib/time';
import type { Opportunity } from '../../types';

function categoryMeta(category: string) {
  return OPPORTUNITY_CATEGORIES.find(c => c.value === category) ?? OPPORTUNITY_CATEGORIES[OPPORTUNITY_CATEGORIES.length - 1];
}

function deadlineLabel(deadline: string | null): { label: string; color: string } {
  if (!deadline) return { label: 'Open', color: 'text-app-text-faint' };
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (diff <= 0) return { label: 'Expired', color: 'text-app-text-faint' };
  if (days === 0) return { label: 'Closing Today', color: 'text-app-red' };
  if (days <= 3) return { label: `${days} day${days > 1 ? 's' : ''} left`, color: 'text-app-orange' };
  return { label: `${days} days left`, color: 'text-app-text-dim' };
}

function getBookmarks(): number[] {
  try { return JSON.parse(localStorage.getItem('oppBookmarks') || '[]'); } catch { return []; }
}

function toggleBookmark(id: number): boolean {
  const bms = getBookmarks();
  const idx = bms.indexOf(id);
  if (idx >= 0) bms.splice(idx, 1);
  else bms.push(id);
  localStorage.setItem('oppBookmarks', JSON.stringify(bms));
  return idx < 0;
}

function formatDeadline(deadline: string): string {
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return deadline;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function OpportunityDetailSheet({ opp, onClose, onBookmarkChange }: {
  opp: Opportunity;
  onClose: () => void;
  onBookmarkChange?: (id: number) => void;
}) {
  const meta = categoryMeta(opp.category);
  const deadline = deadlineLabel(opp.deadline);
  const [bookmarked, setBookmarked] = useState(() => getBookmarks().includes(opp.id));

  const handleBookmark = () => {
    const next = toggleBookmark(opp.id);
    setBookmarked(next);
    onBookmarkChange?.(opp.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-[430px] mx-auto bg-app-bg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-app-bg border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-app-text font-jakarta font-bold text-base">Opportunity</h2>
          <button onClick={onClose} className="text-app-text-dim text-lg">&times;</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-jakarta font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ background: `${meta.color}18`, color: meta.color }}>
              {meta.icon} {meta.label}
            </span>
            {opp.pinned && (
              <span className="text-[11px] font-jakarta font-bold px-2.5 py-1 rounded-full bg-app-accent/15 text-app-accent">📌 Pinned</span>
            )}
            <span className={`text-[11px] font-jakarta font-bold px-2.5 py-1 rounded-full bg-app-surface border border-app-border ${deadline.color}`}>
              🗓 {deadline.label}
            </span>
            <button
              onClick={handleBookmark}
              className={`ml-auto text-[11px] font-jakarta font-bold px-2.5 py-1 rounded-full border transition-all ${
                bookmarked
                  ? 'bg-app-accent/15 text-app-accent border-app-accent/30'
                  : 'bg-app-surface text-app-text-dim border-app-border hover:text-app-text'
              }`}
            >
              {bookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}
            </button>
          </div>

          <h3 className="text-app-text font-jakarta font-bold text-xl leading-snug">{opp.title}</h3>

          <p className="text-app-text-dim text-sm font-inter leading-relaxed whitespace-pre-wrap">{opp.description}</p>

          {opp.link ? (
            <a href={opp.link} target="_blank" rel="noopener noreferrer"
              className="w-full text-center bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200">
              Apply Now →
            </a>
          ) : (
            <div className="w-full">
              <button disabled
                className="w-full text-center bg-app-surface-2 text-app-text-faint font-jakarta font-bold text-sm rounded-xl py-3.5 cursor-not-allowed">
                Apply Now →
              </button>
              <p className="text-app-text-faint text-xs font-inter text-center mt-1.5">
                Application link not yet available. Check back soon.
              </p>
            </div>
          )}

          <div className="border-t border-app-border pt-4 flex flex-col gap-3.5">
            <DetailRow icon="📅" label="Deadline" value={opp.deadline ? `${formatDeadline(opp.deadline)} (${deadline.label})` : 'Open (no deadline)'} valueClass={deadline.color} />
            {opp.eligibility && (
              <DetailRow icon="🎓" label="Eligibility" value={opp.eligibility} />
            )}
            <DetailRow icon="🔗" label="Official Link" value={opp.link ?? 'Not provided'} link={opp.link || undefined} />
          </div>

          <div className="border-t border-app-border pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-app-accent2/20 border border-app-accent2/30 flex items-center justify-center text-sm text-app-accent2 font-jakarta font-bold flex-shrink-0">
              {opp.author_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-app-text font-jakarta font-semibold text-sm">{opp.author_name}</p>
              <p className="text-app-text-faint text-xs font-inter">Posted {formatRelativeTime(opp.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, valueClass, link }: {
  icon: string;
  label: string;
  value: string;
  valueClass?: string;
  link?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-app-surface-2 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-app-text-faint text-[10px] font-jakarta font-bold uppercase tracking-widest mb-0.5">{label}</p>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="text-app-accent font-inter text-sm font-medium break-all hover:underline">
            {value}
          </a>
        ) : (
          <p className="text-app-text font-inter text-sm font-medium whitespace-pre-wrap" style={valueClass ? { color: `var(--color-${valueClass.slice(5)})` } : {}}>{value}</p>
        )}
      </div>
    </div>
  );
}
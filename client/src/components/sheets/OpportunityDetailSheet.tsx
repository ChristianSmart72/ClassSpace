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

export function OpportunityDetailSheet({ opp, onClose }: { opp: Opportunity; onClose: () => void }) {
  const meta = categoryMeta(opp.category);
  const deadline = deadlineLabel(opp.deadline);

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-[430px] mx-auto bg-app-bg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-app-bg border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-app-text font-jakarta font-bold text-base">Opportunity</h2>
          <button onClick={onClose} className="text-app-text-dim text-lg">&times;</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
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
          </div>

          <h3 className="text-app-text font-jakarta font-bold text-xl leading-snug">{opp.title}</h3>

          <p className="text-app-text-dim text-sm font-inter leading-relaxed whitespace-pre-wrap">{opp.description}</p>

          {opp.link && (
            <a href={opp.link} target="_blank" rel="noopener noreferrer"
              className="w-full text-center bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200">
              Apply Now →
            </a>
          )}

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

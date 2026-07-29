import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { getOpportunities, deleteOpportunity } from '../api/opportunities';
import { useSpaceStore } from '../store/spaceStore';
import type { Opportunity } from '../types';
import { OPPORTUNITY_CATEGORIES } from '../types';

const OPP_CAT_MAP: Record<string, { color: string; label: string; icon: string }> = {};
for (const c of OPPORTUNITY_CATEGORIES) OPP_CAT_MAP[c.value] = c;

function formatRelativeTime(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(dateStr);
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function getDeadlineLabel(deadline: string | null): { label: string; color: string } {
  if (!deadline) return { label: 'Open', color: 'text-app-text-faint' };
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (diff <= 0) return { label: 'Expired', color: 'text-app-text-faint' };
  if (days === 0) return { label: 'Closing Today', color: 'text-app-red' };
  if (days <= 3) return { label: `${days}d left`, color: 'text-app-orange' };
  return { label: `${days}d left`, color: 'text-app-text-dim' };
}

export function Opportunities() {
  const { id: spaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { memberRole } = useSpaceStore();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isRep = memberRole === 'rep';

  useEffect(() => {
    if (!spaceId) return;
    setLoading(true);
    getOpportunities(spaceId).then(data => {
      setOpps(data || []);
    }).catch(() => {
      setOpps([]);
    }).finally(() => setLoading(false));
  }, [spaceId]);

  const handleDelete = async (oppId: number) => {
    if (!confirm('Delete this opportunity?')) return;
    setDeletingId(oppId);
    try { await deleteOpportunity(oppId); setOpps(prev => prev.filter(o => o.id !== oppId)); } finally { setDeletingId(null); }
  };

  return (
    <div className="pb-4">
      <div className="sticky top-0 bg-app-bg/95 backdrop-blur-lg z-30 border-b border-app-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="text-app-text-dim hover:text-app-text text-xl transition-colors">←</button>
          <h1 className="text-app-text font-jakarta font-semibold text-base">All Opportunities</h1>
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-app-surface rounded-xl p-4 border border-app-border">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
            </div>
          ))
        ) : opps.length === 0 ? (
          <EmptyState icon="💼" title="No opportunities yet" subtitle="Check back later for scholarships, internships, and more" />
        ) : (
          opps.map(opp => {
            const cat = OPP_CAT_MAP[opp.category] ?? { color: '#6b7280', label: opp.category, icon: '📌' };
            const deadline = getDeadlineLabel(opp.deadline);
            return (
              <div key={opp.id} className="bg-app-surface rounded-xl border border-app-border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{cat.icon}</span>
                        <span className="text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${cat.color}18`, color: cat.color }}>
                          {cat.label}
                        </span>
                      </div>
                      <h3 className="text-app-text font-jakarta font-bold text-sm leading-snug mt-1.5">{opp.title}</h3>
                      <p className="text-app-text-dim text-xs font-inter mt-0.5 line-clamp-2">{opp.description}</p>
                    </div>
                    {isRep && (
                      <button onClick={() => handleDelete(opp.id)} disabled={deletingId === opp.id}
                        className="p-1.5 text-app-text-faint hover:text-app-red transition-colors flex-shrink-0 disabled:opacity-40">🗑</button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-app-border">
                    <div className="flex items-center gap-2 text-[11px] text-app-text-faint font-inter">
                      <span>{formatRelativeTime(opp.created_at)}</span>
                      <span>·</span>
                      <span className={deadline.color}>{deadline.label}</span>
                    </div>
                    {opp.link ? (
                      <a href={opp.link} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] font-jakarta font-bold px-2.5 py-1 rounded-lg" style={{ background: `${cat.color}18`, color: cat.color }}>
                        Apply →
                      </a>
                    ) : (
                      <span className="text-[11px] font-jakarta font-medium text-app-text-faint">No link</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { Fab } from '../components/layout';
import { PostOpportunitySheet } from '../components/sheets/PostOpportunity';
import { OpportunityDetailSheet } from '../components/sheets/OpportunityDetailSheet';
import { patchOpportunity } from '../api/opportunities';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { OPPORTUNITY_CATEGORIES } from '../types';
import { formatRelativeTime, canGoBack } from '../lib/time';
import type { Opportunity } from '../types';

const FILTERS = [
  { value: 'scholarship', label: 'Scholarships' },
  { value: 'internship', label: 'Internships' },
  { value: 'competition', label: 'Competitions' },
  { value: 'event', label: 'Events' },
  { value: 'job', label: 'Jobs' },
] as const;

function categoryMeta(category: string) {
  return OPPORTUNITY_CATEGORIES.find(c => c.value === category) ?? OPPORTUNITY_CATEGORIES[OPPORTUNITY_CATEGORIES.length - 1];
}

function getDeadlineLabel(deadline: string | null): { label: string; color: string; urgent: boolean } {
  if (!deadline) return { label: 'Open', color: 'text-app-text-faint', urgent: false };
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (diff <= 0) return { label: 'Expired', color: 'text-app-text-faint', urgent: false };
  if (days === 0) return { label: 'Closing Today', color: 'text-app-red', urgent: true };
  if (days <= 3) return { label: `${days}d left`, color: 'text-app-orange', urgent: true };
  return { label: `${days}d left`, color: 'text-app-text-dim', urgent: false };
}

function getBookmarks(): number[] {
  try { return JSON.parse(localStorage.getItem('oppBookmarks') || '[]'); } catch { return []; }
}

function toggleBookmark(id: number): number[] {
  const bms = getBookmarks();
  const idx = bms.indexOf(id);
  if (idx >= 0) bms.splice(idx, 1);
  else bms.push(id);
  localStorage.setItem('oppBookmarks', JSON.stringify(bms));
  return bms;
}

export function Opportunities() {
  const { id: spaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const memberRole = useSpaceStore(s => s.memberRole);
  const isRep = memberRole === 'rep';
  const { opportunities, opportunitiesLoading, fetchOpportunities, deleteOpportunity } = useContentStore();
  const [pinOverride, setPinOverride] = useState<Record<number, boolean>>({});
  const [showPost, setShowPost] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>(getBookmarks);

  useEffect(() => {
    if (!spaceId) return;
    const cancelled = { current: false };
    fetchOpportunities(spaceId).finally(() => { cancelled.current = true; });
    return () => { cancelled.current = true; };
  }, [spaceId, fetchOpportunities]);

  const displayList = useMemo(() => {
    let filtered = opportunities.map(o => ({ ...o, pinned: pinOverride[o.id] ?? o.pinned }));
    if (showBookmarked) filtered = filtered.filter(o => bookmarks.includes(o.id));
    if (filter) filtered = filtered.filter(o => o.category === filter);
    const sorted = [...filtered].sort((a, b) =>
      ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) ||
      (new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    );
    return sorted;
  }, [opportunities, pinOverride, filter, showBookmarked, bookmarks]);

  const handleBookmark = (id: number) => setBookmarks(toggleBookmark(id));

  const handlePin = async (opp: Opportunity) => {
    const next = !(pinOverride[opp.id] ?? opp.pinned);
    setPinOverride(prev => ({ ...prev, [opp.id]: next }));
    try {
      await patchOpportunity(opp.id, { pinned: next });
    } catch {
      setPinOverride(prev => ({ ...prev, [opp.id]: opp.pinned ?? false }));
    }
  };

  const handleDelete = async (opp: Opportunity) => {
    if (!confirm(`Delete "${opp.title}"? This cannot be undone.`)) return;
    try {
      await deleteOpportunity(opp.id);
      setBookmarks(prev => prev.filter(b => b !== opp.id));
    } catch { /* toast shown by store */ }
  };

  const sectionMeta = filter ? categoryMeta(filter) : null;

  return (
    <div className="pb-4">
      <div className="sticky top-0 bg-app-bg/95 backdrop-blur-lg z-30 border-b border-app-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => canGoBack() ? navigate(-1) : navigate(`/space/${spaceId}`)} className="text-app-text-dim hover:text-app-text text-xl transition-colors">←</button>
          <h1 className="text-app-text font-jakarta font-semibold text-base">Opportunities</h1>
          <button
            onClick={() => { setShowBookmarked(!showBookmarked); setFilter(null); }}
            className={`ml-auto flex items-center gap-1 text-xs font-jakarta font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              showBookmarked
                ? 'bg-app-accent/15 text-app-accent border-app-accent/30'
                : 'bg-app-surface text-app-text-dim border-app-border hover:text-app-text'
            }`}
          >
            🔖 {bookmarks.length > 0 && <span className="text-[10px]">{bookmarks.length}</span>}
          </button>
        </div>

        {/* Category filters — horizontal scroll only */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 min-w-max">
            <button
              onClick={() => { setFilter(null); setShowBookmarked(false); }}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-jakarta font-semibold rounded-full border transition-all ${
                !filter && !showBookmarked
                  ? 'bg-app-accent text-app-bg border-app-accent'
                  : 'bg-app-surface text-app-text-dim border-app-border hover:text-app-text'
              }`}
            >
              All
            </button>
            {FILTERS.map(f => (
              <button key={f.value} onClick={() => { setFilter(f.value); setShowBookmarked(false); }}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-jakarta font-semibold rounded-full border transition-all ${
                  filter === f.value
                    ? 'bg-app-accent text-app-bg border-app-accent'
                    : 'bg-app-surface text-app-text-dim border-app-border hover:text-app-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        {opportunitiesLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-app-surface rounded-xl p-4 border border-app-border">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <EmptyState
            icon={showBookmarked ? '🔖' : '💼'}
            title={showBookmarked ? 'No bookmarked opportunities' : 'No opportunities yet'}
            subtitle={showBookmarked ? 'Tap the bookmark icon on opportunities to save them' : isRep ? 'Tap + to post the first opportunity' : 'Check back later for scholarships, internships, and more'}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Section header only when a specific filter is active */}
            {sectionMeta && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="text-sm">{sectionMeta.icon}</span>
                <h2 className="text-app-text font-jakarta font-bold text-sm">{sectionMeta.label}</h2>
                <span className="text-app-text-faint text-[11px] font-inter ml-auto">{displayList.length}</span>
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              {displayList.map(opp => {
                const meta = categoryMeta(opp.category);
                const deadline = getDeadlineLabel(opp.deadline);
                const isBookmarked = bookmarks.includes(opp.id);
                return (
                  <div key={opp.id} onClick={() => setSelectedOpp(opp)}
                    className="bg-app-surface rounded-xl border border-app-border overflow-hidden card-hover animate-fadeInUp active:scale-[0.99] transition-transform cursor-pointer" style={{ animationDelay: '0.04s' }}>
                    <div className="p-4">
                      {/* Top row: badges + actions */}
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                          style={{ background: `${meta.color}18`, color: meta.color }}>
                          <span className="text-[10px] leading-none">{meta.icon}</span> {meta.label}
                        </span>
                        {opp.pinned && (
                          <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-full bg-app-accent/15 text-app-accent flex items-center gap-1 flex-shrink-0">
                            📌 Pinned
                          </span>
                        )}
                        {deadline.urgent && opp.deadline && (
                          <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-full bg-app-red/15 text-app-red flex items-center gap-1 flex-shrink-0">
                            ⏰ Closing soon
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                          {isRep && (
                            <>
                              <button
                                onClick={() => handleDelete(opp)}
                                className="p-1.5 rounded-lg transition-colors text-sm leading-none text-app-text-faint hover:text-app-red"
                                title="Delete"
                              >
                                🗑
                              </button>
                              <button
                                onClick={() => handlePin(opp)}
                                className={`p-1.5 rounded-lg transition-colors text-sm leading-none ${opp.pinned ? 'text-app-accent' : 'text-app-text-faint hover:text-app-text'}`}
                                title={opp.pinned ? 'Unpin' : 'Pin'}
                              >
                                📌
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleBookmark(opp.id)}
                            className={`p-1.5 rounded-lg transition-colors text-sm leading-none ${isBookmarked ? 'text-app-accent' : 'text-app-text-faint hover:text-app-text'}`}
                            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                          >
                            {isBookmarked ? '🔖' : <span className="grayscale opacity-40">🔖</span>}
                          </button>
                        </div>
                      </div>

                      <h3 className="text-app-text font-jakarta font-bold text-sm leading-snug">{opp.title}</h3>
                      <p className="text-app-text-dim text-xs font-inter mt-1 line-clamp-2">{opp.description}</p>

                      <div className="flex items-center gap-2 text-[11px] text-app-text-faint font-inter mt-2 flex-wrap">
                        {opp.deadline && (
                          <span className={`font-jakarta font-semibold ${deadline.color}`}>🗓 {deadline.label}</span>
                        )}
                        <span>·</span>
                        <span>{formatRelativeTime(opp.created_at)}</span>
                      </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-app-border">
                          <span className="text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${meta.color}18`, color: meta.color }}>
                            {opp.author_name}
                          </span>
                          {opp.link ? (
                            <a href={opp.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-jakarta font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                              style={{ background: `${meta.color}18`, color: meta.color }}>
                              Apply →
                            </a>
                          ) : (
                            <span className="text-[11px] font-jakarta font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                              style={{ background: `${meta.color}18`, color: meta.color }}>
                              View details →
                            </span>
                          )}
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isRep && <Fab onClick={() => setShowPost(true)} icon="+" />}
      {showPost && spaceId && <PostOpportunitySheet spaceId={spaceId} onClose={() => setShowPost(false)} />}
      {selectedOpp && <OpportunityDetailSheet opp={selectedOpp} onClose={() => setSelectedOpp(null)} onBookmarkChange={handleBookmark} />}
    </div>
  );
}

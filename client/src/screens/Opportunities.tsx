import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { getOpportunities } from '../api/opportunities';
import { formatRelativeTime, canGoBack } from '../lib/time';
import type { Opportunity } from '../types';

const OPP_SECTIONS = [
  { value: 'scholarship', label: 'Scholarships', icon: '🏆', color: '#e8ff47' },
  { value: 'internship', label: 'Internships', icon: '💼', color: '#52ffa0' },
  { value: 'competition', label: 'Competitions', icon: '🥇', color: '#ff5252' },
  { value: 'job', label: 'Jobs', icon: '🧑‍💻', color: '#ffb347' },
  { value: 'bootcamp', label: 'Bootcamps', icon: '🔥', color: '#5b6af0' },
  { value: 'event', label: 'Events', icon: '📅', color: '#a78bfa' },
  { value: 'other', label: 'Other', icon: '📌', color: '#7a7a88' },
] as const;

const OPP_SECTION_MAP: Record<string, typeof OPP_SECTIONS[number]> = {};
for (const s of OPP_SECTIONS) OPP_SECTION_MAP[s.value] = s;

function getDeadlineLabel(deadline: string | null): { label: string; color: string } {
  if (!deadline) return { label: 'Open', color: 'text-app-text-faint' };
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (diff <= 0) return { label: 'Expired', color: 'text-app-text-faint' };
  if (days === 0) return { label: 'Closing Today', color: 'text-app-red' };
  if (days <= 3) return { label: `${days}d left`, color: 'text-app-orange' };
  return { label: `${days}d left`, color: 'text-app-text-dim' };
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
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>(getBookmarks);

  useEffect(() => {
    if (!spaceId) return;
    const cancelled = { current: false };
    setLoading(true);
    getOpportunities(spaceId).then(data => {
      if (!cancelled.current) setOpps(data || []);
    }).catch(() => {
      if (!cancelled.current) setOpps([]);
    }).finally(() => {
      if (!cancelled.current) setLoading(false);
    });
    return () => { cancelled.current = true; };
  }, [spaceId]);

  const sectionedOpps = useMemo(() => {
    let filtered = opps;
    if (showBookmarked) {
      filtered = filtered.filter(o => bookmarks.includes(o.id));
    }
    if (activeSection) {
      filtered = filtered.filter(o => o.category === activeSection);
    }
    const sections: { section: typeof OPP_SECTIONS[number]; items: Opportunity[] }[] = [];
    for (const s of OPP_SECTIONS) {
      const items = filtered.filter(o => o.category === s.value);
      if (items.length > 0) {
        sections.push({ section: s, items });
      }
    }
    return sections;
  }, [opps, activeSection, showBookmarked, bookmarks]);

  const handleBookmark = (id: number) => {
    setBookmarks(toggleBookmark(id));
  };

  return (
    <div className="pb-4">
      <div className="sticky top-0 bg-app-bg/95 backdrop-blur-lg z-30 border-b border-app-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => canGoBack() ? navigate(-1) : navigate(`/space/${spaceId}`)} className="text-app-text-dim hover:text-app-text text-xl transition-colors">←</button>
          <h1 className="text-app-text font-jakarta font-semibold text-base">Opportunities</h1>
          <button
            onClick={() => { setShowBookmarked(!showBookmarked); setActiveSection(null); }}
            className={`ml-auto flex items-center gap-1 text-xs font-jakarta font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              showBookmarked
                ? 'bg-app-accent/15 text-app-accent border-app-accent/30'
                : 'bg-app-surface text-app-text-dim border-app-border hover:text-app-text'
            }`}
          >
            🔖 {bookmarks.length > 0 && <span className="text-[10px]">{bookmarks.length}</span>}
          </button>
        </div>

        {/* Section filters */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 min-w-max">
            <button
              onClick={() => { setActiveSection(null); setShowBookmarked(false); }}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-jakarta font-semibold rounded-full border transition-all ${
                !activeSection && !showBookmarked
                  ? 'bg-app-accent text-app-bg border-app-accent'
                  : 'bg-app-surface text-app-text-dim border-app-border hover:text-app-text'
              }`}
            >
              All
            </button>
            {OPP_SECTIONS.map(s => (
              <button key={s.value} onClick={() => { setActiveSection(s.value); setShowBookmarked(false); }}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-jakarta font-semibold rounded-full border transition-all flex items-center gap-1 ${
                  activeSection === s.value
                    ? 'text-white border-transparent'
                    : 'bg-app-surface text-app-text-dim border-app-border hover:text-app-text'
                }`}
                style={activeSection === s.value ? { background: s.color, color: '#000' } : undefined}
              >
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-app-surface rounded-xl p-4 border border-app-border">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
              </div>
            ))}
          </div>
        ) : sectionedOpps.length === 0 || sectionedOpps.every(s => s.items.length === 0) ? (
          <EmptyState
            icon={showBookmarked ? '🔖' : '💼'}
            title={showBookmarked ? 'No bookmarked opportunities' : 'No opportunities yet'}
            subtitle={showBookmarked ? 'Tap the bookmark icon on opportunities to save them' : 'Check back later for scholarships, internships, and more'}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {sectionedOpps.map(({ section, items }) => (
              <div key={section.value} className="animate-fadeInUp" style={{ animationDelay: '0.04s' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">{section.icon}</span>
                  <h2 className="text-app-text font-jakarta font-bold text-sm">{section.label}</h2>
                  <span className="text-app-text-faint text-[11px] font-inter ml-auto">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {items.map(opp => {
                    const deadline = getDeadlineLabel(opp.deadline);
                    const isBookmarked = bookmarks.includes(opp.id);
                    return (
                      <div key={opp.id} className="bg-app-surface rounded-xl border border-app-border overflow-hidden card-hover">
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-app-text font-jakarta font-bold text-sm leading-snug">{opp.title}</h3>
                              <p className="text-app-text-dim text-xs font-inter mt-1 line-clamp-2">{opp.description}</p>
                              <div className="flex items-center gap-2 text-[11px] text-app-text-faint font-inter mt-2 flex-wrap">
                                {opp.deadline && (
                                  <span className={`font-jakarta font-semibold ${deadline.color}`}>
                                    🗓 {deadline.label}
                                  </span>
                                )}
                                <span>·</span>
                                <span>{formatRelativeTime(opp.created_at)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleBookmark(opp.id)}
                              className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                                isBookmarked ? 'text-app-accent' : 'text-app-text-faint hover:text-app-text'
                              }`}
                            >
                              {isBookmarked ? '🔖' : '🔖'}
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-app-border">
                            <span className="text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: `${section.color}18`, color: section.color }}>
                              {opp.author_name}
                            </span>
                            {opp.link ? (
                              <a href={opp.link} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] font-jakarta font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                                style={{ background: `${section.color}18`, color: section.color }}>
                                Apply →
                              </a>
                            ) : (
                              <span className="text-[11px] font-jakarta font-medium text-app-text-faint">View details</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { useBadgeStore } from '../store/badgeStore';
import { Fab } from '../components/layout';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { PostAnnouncementSheet } from '../components/sheets/PostAnnouncement';
import { UploadMaterialSheet } from '../components/sheets/UploadMaterial';
import { getTimetable } from '../api/timetable';
import { getMaterialsSummary } from '../api/content';
import type { Announcement, TimetableEntry } from '../types';
import { COURSE_COLORS, COURSE_BG_COLORS, DAYS } from '../types';
import { ShareSheet } from '../components/sheets/ShareSheet';

const CONTENT_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'assignment', label: 'Assignments' },
  { key: 'test', label: 'Tests' },
  { key: 'meeting', label: 'Meetings' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'pinned', label: 'Pinned' },
  { key: 'unread', label: 'Unread' },
] as const;

type ContentFilter = typeof CONTENT_FILTERS[number]['key'];
type Tab = 'feed' | 'files' | 'timetable';

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  assignment: { label: 'Assignment', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: '📝' },
  test: { label: 'Test', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: '🧪' },
  meeting: { label: 'Meeting', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: '🤝' },
  update: { label: 'Update', color: '#d97706', bg: 'rgba(217,119,6,0.12)', icon: '📡' },
  announcement: { label: 'Announcement', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '📢' },
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateStr);
  if (diffDays < 7) return dayNames[d.getDay()];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function getLastVisitKey(spaceId: string) {
  return `spaceLastVisit:${spaceId}`;
}

function getReadKey(spaceId: string) {
  return `readAnnouncements:${spaceId}`;
}

export function Space() {
  const { id: spaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { currentSpace, courses, memberRole, fetchSpace, loading: spaceLoading, error: spaceError } = useSpaceStore();
  const { announcements, loading: annLoading, fetchAnnouncements, deleteAnnouncement, updateAnnouncement } = useContentStore();

  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get('tab');
    if (t === 'files') return 'files';
    if (t === 'timetable') return 'timetable';
    return 'feed';
  });
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [showPost, setShowPost] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const todayIndex = (() => { const d = new Date().getDay(); return d === 0 || d === 6 ? 0 : d - 1; })();
  const [scheduleDay, setScheduleDay] = useState(todayIndex);
  const [shareTarget, setShareTarget] = useState<{ type: string; id: string | number } | null>(null);
  const [courseSummary, setCourseSummary] = useState<Record<number, { count: number; latest: { name: string; created_at: string } | null }>>({});

  const isRep = memberRole === 'rep';
  const courseList = courses ?? [];

  useEffect(() => { if (spaceId) fetchSpace(spaceId); }, [spaceId]);
  useEffect(() => { if (spaceId) fetchAnnouncements(spaceId); }, [spaceId]);

  useEffect(() => {
    if (spaceId && tab === 'feed') {
      try { localStorage.setItem(getLastVisitKey(spaceId), Date.now().toString()); } catch {}
    }
  }, [spaceId, tab]);

  useEffect(() => {
    if (tab === 'feed') useBadgeStore.getState().clearBadge();
  }, [tab, announcements]);

  useEffect(() => {
    if (spaceId && tab === 'timetable') {
      getTimetable(spaceId).then(d => setTimetable(d || [])).catch(() => setTimetable([]));
    }
    if (spaceId && tab === 'files') {
      getMaterialsSummary(spaceId).then(data => {
        const map: Record<number, { count: number; latest: { name: string; created_at: string } | null }> = {};
        for (const c of data.courses) map[c.course_id] = { count: c.count, latest: c.latest };
        setCourseSummary(map);
      }).catch(() => {});
    }
  }, [spaceId, tab]);

  const lastVisit = useMemo(() => {
    if (contentFilter !== 'unread') return null;
    try { return Number(localStorage.getItem(getLastVisitKey(spaceId!))) || 0; } catch { return 0; }
  }, [spaceId, contentFilter]);

  const filteredAnnouncements = useMemo(() => {
    let result = announcements;
    if (contentFilter === 'assignment') result = result.filter(a => a.type === 'assignment');
    else if (contentFilter === 'test') result = result.filter(a => a.type === 'test');
    else if (contentFilter === 'meeting') result = result.filter(a => a.type === 'meeting');
    else if (contentFilter === 'urgent') result = result.filter(a => a.urgent);
    else if (contentFilter === 'pinned') result = result.filter(a => a.pinned);
    else if (contentFilter === 'unread') {
      const lv = lastVisit || 0;
      try {
        const readIds: number[] = JSON.parse(localStorage.getItem(getReadKey(spaceId!)) || '[]');
        result = result.filter(a => !readIds.includes(a.id) && new Date(a.created_at).getTime() > lv);
      } catch {
        result = result.filter(a => new Date(a.created_at).getTime() > lv);
      }
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q) ||
        a.course_code?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [announcements, contentFilter, search, lastVisit, spaceId]);

  const filteredCourses = search
    ? courseList.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()))
    : courseList;

  const handleDelete = async (annId: number) => {
    if (!confirm('Delete this announcement?')) return;
    setDeletingId(annId);
    try { await deleteAnnouncement(annId); } finally { setDeletingId(null); }
  };

  const handlePin = async (ann: Announcement) => {
    try { await updateAnnouncement(ann.id, { pinned: !ann.pinned }); } catch {}
  };

  const handleEdit = (ann: Announcement) => {
    setEditAnnouncement(ann);
  };

  if (spaceLoading) {
    return (
      <div className="px-4 pt-4">
        <Skeleton className="h-20 w-full rounded-xl mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full mb-3 rounded-xl" />)}
      </div>
    );
  }

  if (spaceError || !currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <span className="text-5xl mb-4">📭</span>
        <h2 className="text-app-text font-jakarta font-bold text-lg mb-2">Space not found</h2>
        <p className="text-app-text-dim text-sm font-inter mb-6">This space may no longer exist, or you need to join it first.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/home')} className="bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl px-6 py-3">Go Home</button>
          <button onClick={() => navigate('/join')} className="bg-app-surface border border-app-border text-app-text font-jakarta font-semibold text-sm rounded-xl px-6 py-3">Join a Space</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* ─── Header with persistent search ─── */}
      <div className="px-4 pt-4 pb-3 border-b border-app-border flex flex-col gap-2.5">
        <div className="min-w-0">
          <h1 className="text-app-text font-jakarta font-bold text-base leading-tight truncate">{currentSpace.name}</h1>
          <p className="text-app-text-dim text-xs font-inter mt-0.5 truncate">{currentSpace.uni}</p>
        </div>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-text-faint text-xs leading-none pointer-events-none">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search announcements, files, tests..."
            className="w-full bg-app-surface border border-app-border rounded-lg pl-7 pr-3 py-2 text-app-text text-xs font-inter placeholder:text-app-text-faint focus:outline-none focus:border-app-accent transition-colors" />
        </div>
        {search && (
          <p className="text-app-text-faint text-[11px] font-inter -mt-1.5 px-1">
            {tab === 'feed' ? filteredAnnouncements.length : filteredCourses.length} result{(tab === 'feed' ? filteredAnnouncements.length : filteredCourses.length) !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex mx-4 gap-1 border-b border-app-border mb-3">
        {[
          { key: 'feed' as Tab, label: 'Feed', icon: '📢' },
          { key: 'files' as Tab, label: 'Files', icon: '📁' },
          { key: 'timetable' as Tab, label: 'Timetable', icon: '📅' },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearchParams({ tab: t.key }); }}
            className={`flex-1 py-2.5 text-sm font-jakarta font-semibold transition-all duration-200 relative ${
              tab === t.key ? 'text-app-accent' : 'text-app-text-dim hover:text-app-text'
            }`}>
            {t.icon} {t.label}
            {tab === t.key && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-app-accent rounded-full" />}
          </button>
        ))}
      </div>

      {/* ─── Feed Tab ─── */}
      {tab === 'feed' && (
        <div className="animate-fadeIn">
          {/* Content Filters */}
          <div className="px-4 mb-3 overflow-x-auto scrollbar-none">
            <div className="flex gap-1.5 min-w-max">
              {CONTENT_FILTERS.map(f => (
                <button key={f.key} onClick={() => setContentFilter(f.key as ContentFilter)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs font-jakarta font-semibold rounded-full transition-all duration-200 border ${
                    contentFilter === f.key
                      ? 'bg-app-accent text-app-bg border-app-accent'
                      : 'bg-app-surface text-app-text-dim border-app-border hover:border-app-accent/40 hover:text-app-text'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feed List */}
          <div className="px-4 flex flex-col gap-2.5">
            {annLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-app-surface rounded-xl p-3.5 border border-app-border">
                  <Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" /><Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : filteredAnnouncements.length === 0 ? (
              <div className="pt-8">
                <EmptyState icon={search ? '🔍' : '📢'}
                  title={search ? 'No results' : 'No announcements'}
                  subtitle={search ? `Nothing matched "${search}"` : contentFilter !== 'all' ? 'Try a different filter' : isRep ? 'Tap + to post' : 'Nothing posted yet'} />
              </div>
            ) : (
              filteredAnnouncements.map(ann => (
                <FeedCard key={ann.id}
                  ann={ann}
                  spaceId={spaceId!}
                  canDelete={isRep}
                  deleting={deletingId === ann.id}
                  onDelete={() => handleDelete(ann.id)}
                  onPin={() => handlePin(ann)}
                  onEdit={() => handleEdit(ann)}
                  onClick={() => navigate(`/space/${currentSpace.id}/announcement/${ann.id}`)} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── Files Tab ─── */}
      {tab === 'files' && (
        <div className="px-4 animate-fadeIn">
          {filteredCourses.length === 0 ? (
            <div className="pt-8">
              <EmptyState icon={search ? '🔍' : '📁'} title={search ? 'No results' : 'No courses yet'} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredCourses.map((course, i) => {
                const ci = (course.color_index ?? i) % 5;
                const summary = courseSummary[course.id];
                const count = summary?.count ?? 0;
                const latest = summary?.latest ?? null;

                let isNew = false;
                if (latest) {
                  try {
                    const lv = Number(localStorage.getItem(`spaceLastVisit:${spaceId}`)) || 0;
                    isNew = new Date(latest.created_at).getTime() > lv;
                  } catch {}
                }

                return (
                  <div key={course.id} className="bg-app-surface rounded-xl border border-app-border relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all duration-200"
                    onClick={() => navigate(`/space/${currentSpace.id}/course/${course.id}`)}>
                    <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: COURSE_COLORS[ci] }} />
                    <div className="pl-4 pr-3.5 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 mt-0.5" style={{ background: COURSE_BG_COLORS[ci] }}>
                          {course.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-app-text font-jakarta font-semibold text-sm leading-snug truncate">{course.name}</p>
                            {isNew && <span className="text-[10px] font-jakarta font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">New</span>}
                          </div>
                          <p className="text-app-text-dim text-xs font-inter mt-0.5">{course.code}</p>
                          <div className="flex items-center gap-1.5 text-app-text-faint text-[11px] font-inter mt-1.5">
                            <span>{count} {count === 1 ? 'resource' : 'resources'}</span>
                            {latest && (
                              <>
                                <span>·</span>
                                <span className="truncate">Latest: {latest.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-app-text-faint text-xs font-inter flex-shrink-0 mt-1">→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Timetable Tab ─── */}
      {tab === 'timetable' && (
        <div className="px-4 animate-fadeIn">
          <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
            {['Mon','Tue','Wed','Thu','Fri'].map((d, i) => (
              <button key={d}
                onClick={() => setScheduleDay(i)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-jakarta font-bold transition-all duration-200 border ${
                  scheduleDay === i
                    ? 'bg-app-accent text-app-bg border-app-accent'
                    : i === todayIndex
                      ? 'bg-app-surface border-app-accent/40 text-app-accent'
                      : 'bg-app-surface border-app-border text-app-text-dim'
                }`}>
                <span>{d}</span>
                {i === todayIndex && <span className="w-1 h-1 rounded-full bg-current mt-0.5 opacity-60" />}
              </button>
            ))}
          </div>

          {(() => {
            const dayName = DAYS[scheduleDay];
            const classes = timetable.filter(e => e.day === dayName);
            if (!classes.length) return (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-app-text font-jakarta font-semibold text-sm mb-1">No classes</p>
                <p className="text-app-text-dim text-xs font-inter">Nothing scheduled for this day</p>
              </div>
            );
            return (
              <div className="flex flex-col gap-2.5">
                {classes.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(entry => {
                  const ci = entry.color_index % 5;
                  return (
                    <div key={entry.id} className="bg-app-surface border border-app-border rounded-xl p-4 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: COURSE_COLORS[ci] }} />
                      <div className="pl-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-app-text font-jakarta font-bold text-sm leading-snug flex-1">{entry.course_name}</p>
                          <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: COURSE_BG_COLORS[ci], color: COURSE_COLORS[ci] }}>
                            {entry.course_code}
                          </span>
                        </div>
                        <p className="text-app-text-dim text-xs font-inter">{entry.start_time.slice(0,5)} – {entry.end_time.slice(0,5)}</p>
                        {entry.venue && <p className="text-app-text-faint text-xs font-inter mt-0.5">📍 {entry.venue}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {isRep && tab === 'feed' && <Fab onClick={() => setShowPost(true)} icon="+" />}
      {isRep && tab === 'files' && <Fab onClick={() => setShowUpload(true)} icon="+" />}

      {showPost && spaceId && (
        <PostAnnouncementSheet spaceId={spaceId} onClose={() => setShowPost(false)} />
      )}
      {editAnnouncement && spaceId && (
        <PostAnnouncementSheet spaceId={spaceId} announcement={editAnnouncement} onClose={() => setEditAnnouncement(null)} />
      )}
      {showUpload && <UploadMaterialSheet onClose={() => setShowUpload(false)} />}
      {shareTarget && spaceId && (
        <ShareSheet type={shareTarget.type} id={shareTarget.id} spaceId={spaceId} onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
}

function FeedCard({ ann, spaceId, canDelete, deleting, onDelete, onPin, onEdit, onClick }: {
  ann: Announcement;
  spaceId: string;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
  onPin: () => void;
  onEdit: () => void;
  onClick: () => void;
}) {
  const style = TYPE_STYLES[ann.type] || TYPE_STYLES.announcement;
  const preview = ann.body.length > 120 ? ann.body.slice(0, 120) + '…' : ann.body;
  const [menuOpen, setMenuOpen] = useState(false);

  const [unread, setUnread] = useState(() => {
    try {
      const key = `readAnnouncements:${spaceId}`;
      const ids: number[] = JSON.parse(localStorage.getItem(key) || '[]');
      if (ids.includes(ann.id)) return false;
      const lv = Number(localStorage.getItem(getLastVisitKey(spaceId))) || 0;
      return new Date(ann.created_at).getTime() > lv;
    } catch { return false; }
  });

  const handleClick = () => {
    if (unread) {
      try {
        const key = `readAnnouncements:${spaceId}`;
        const ids: number[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (!ids.includes(ann.id)) {
          ids.push(ann.id);
          localStorage.setItem(key, JSON.stringify(ids));
        }
      } catch {}
      setUnread(false);
    }
    onClick();
  };

  const accentBar = ann.urgent ? 'bg-app-red'
    : ann.pinned ? 'bg-app-accent'
    : unread ? 'bg-blue-500'
    : null;

  return (
    <div onClick={handleClick}
      className="bg-app-surface rounded-xl border border-app-border overflow-hidden active:scale-[0.99] transition-all duration-200 relative cursor-pointer">
      {accentBar && <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentBar}`} />}

      <div className="p-3.5 pl-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-jakarta font-semibold flex items-center gap-1"
            style={{ background: style.bg, color: style.color }}>
            {style.icon} {style.label}
          </span>

          {unread && (
            <span className="text-[10px] font-jakarta font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">New</span>
          )}

          {ann.pinned && (
            <span className="text-[10px] font-jakarta font-semibold text-app-accent bg-app-accent/10 px-1.5 py-0.5 rounded-full">📌 Pinned</span>
          )}

          {ann.urgent && (
            <span className="text-[10px] font-jakarta font-bold px-1.5 py-0.5 rounded-full bg-app-red/10 text-app-red flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-app-red" />
              Urgent
            </span>
          )}

          <div className="flex-1" />

          {canDelete && (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setMenuOpen(o => !o)}
                className="px-1.5 py-0.5 text-app-text-faint hover:text-app-text transition-colors rounded hover:bg-app-surface-2 text-sm leading-none tracking-wider font-bold">
                ···
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-app-bg border border-app-border rounded-lg shadow-lg py-1 min-w-[130px]">
                    <button onClick={() => { onEdit(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-jakarta font-medium text-app-text hover:bg-app-surface transition-colors flex items-center gap-2">
                      ✏️ Edit
                    </button>
                    <button onClick={() => { onPin(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-jakarta font-medium text-app-text hover:bg-app-surface transition-colors flex items-center gap-2">
                      {ann.pinned ? '📍 Unpin' : '📌 Pin'}
                    </button>
                    <div className="h-px bg-app-border mx-2" />
                    <button onClick={() => { onDelete(); setMenuOpen(false); }} disabled={deleting}
                      className="w-full text-left px-3 py-2 text-xs font-jakarta font-medium text-app-red hover:bg-app-surface transition-colors flex items-center gap-2 disabled:opacity-40">
                      🗑 Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <h3 className="text-app-text font-jakarta font-bold text-sm leading-snug mb-1">{ann.title}</h3>

        {preview && (
          <p className="text-app-text-dim text-xs font-inter leading-relaxed line-clamp-1 mb-2">{preview}</p>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-app-text-faint font-inter">
          {ann.course_code && <span>{ann.course_code}</span>}
          <span>•</span>
          <span>{formatRelativeTime(ann.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

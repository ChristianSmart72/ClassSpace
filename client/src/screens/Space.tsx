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
  assignment: { label: 'Assignment', color: '#e8ff47', bg: 'rgba(232,255,71,0.12)', icon: '📝' },
  test: { label: 'Test', color: '#5b6af0', bg: 'rgba(91,106,240,0.12)', icon: '🧪' },
  meeting: { label: 'Meeting', color: '#52ffa0', bg: 'rgba(82,255,160,0.12)', icon: '🤝' },
  update: { label: 'Update', color: '#ffb347', bg: 'rgba(255,179,71,0.12)', icon: '📡' },
  announcement: { label: 'Announcement', color: '#7a7a8c', bg: 'rgba(124,124,140,0.12)', icon: '📢' },
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const todayIndex = (() => { const d = new Date().getDay(); return d === 0 || d === 6 ? 0 : d - 1; })();
  const [scheduleDay, setScheduleDay] = useState(todayIndex);
  const [shareTarget, setShareTarget] = useState<{ type: string; id: string | number } | null>(null);

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
      result = result.filter(a => new Date(a.created_at).getTime() > lv);
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
  }, [announcements, contentFilter, search, lastVisit]);

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
    try {
      await updateAnnouncement(ann.id, { pinned: !ann.pinned });
    } catch {}
  };

  const handleEdit = (ann: Announcement) => {
    setEditAnnouncement(ann);
  };

  if (spaceLoading) {
    return (
      <div className="px-4 pt-4">
        <Skeleton className="h-20 w-full rounded-2xl mb-4" />
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
      {/* ─── Compact Header ─── */}
      <div className="px-4 pt-4 pb-3 border-b border-app-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-app-text font-jakarta font-bold text-base leading-tight truncate">{currentSpace.name}</h1>
            <p className="text-app-text-dim text-xs font-inter mt-0.5 truncate">{currentSpace.uni}</p>
          </div>
          <button
            onClick={() => { setSearchOpen(o => !o); if (searchOpen) setSearch(''); }}
            className="w-8 h-8 rounded-lg bg-app-surface border border-app-border flex items-center justify-center text-app-text-dim hover:text-app-text transition-colors flex-shrink-0 text-sm"
          >
            {searchOpen ? '✕' : '🔍'}
          </button>
        </div>
        {searchOpen && (
          <div className="mt-3 animate-fadeIn">
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search announcements, courses..."
              className="w-full bg-app-surface border border-app-accent/40 rounded-xl px-4 py-2.5 text-app-text text-sm font-inter placeholder:text-app-text-faint focus:outline-none focus:border-app-accent transition-colors" />
            {search && (
              <p className="text-app-text-faint text-xs font-inter mt-1.5 px-1">
                {filteredAnnouncements.length + filteredCourses.length} results
              </p>
            )}
          </div>
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

          <div className="px-4 flex flex-col gap-3">
            {annLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-app-surface rounded-xl p-3.5 border border-app-border">
                  <Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" /><Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : filteredAnnouncements.length === 0 ? (
              <EmptyState icon={search ? '🔍' : '📢'}
                title={search ? 'No results' : 'No announcements'}
                subtitle={search ? `Nothing matched "${search}"` : contentFilter !== 'all' ? 'Try a different filter' : isRep ? 'Tap + to post' : 'Nothing posted yet'} />
            ) : (
              filteredAnnouncements.map(ann => (
                <FeedCard key={ann.id}
                  ann={ann}
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
            <EmptyState icon={search ? '🔍' : '📁'} title={search ? 'No results' : 'No courses yet'} />
          ) : (
            <div className="flex flex-col gap-2">
              {filteredCourses.map((course, i) => {
                const ci = (course.color_index ?? i) % 5;
                return (
                  <div key={course.id} className="bg-app-surface rounded-2xl border border-app-border relative overflow-hidden flex items-center">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: COURSE_COLORS[ci] }} />
                    <button
                      onClick={() => navigate(`/space/${currentSpace.id}/course/${course.id}`)}
                      className="flex-1 text-left active:scale-[0.99] transition-all duration-200 flex items-center gap-4 min-w-0"
                      style={{ padding: '14px 14px 14px 16px' }}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ml-2" style={{ background: COURSE_BG_COLORS[ci] }}>
                        {course.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-app-text font-jakarta font-bold text-sm leading-snug">{course.name}</p>
                        <p className="text-app-text-dim text-xs font-inter mt-0.5">{course.code}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => navigate(`/space/${currentSpace.id}/course/${course.id}`)}
                      className="pr-4 text-app-text-dim text-xs font-inter flex-shrink-0">→</button>
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
                    <div key={entry.id} className="bg-app-surface border border-app-border rounded-2xl p-4 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: COURSE_COLORS[ci] }} />
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

function FeedCard({ ann, canDelete, deleting, onDelete, onPin, onEdit, onClick }: {
  ann: Announcement;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
  onPin: () => void;
  onEdit: () => void;
  onClick: () => void;
}) {
  const style = TYPE_STYLES[ann.type] || TYPE_STYLES.announcement;
  const preview = ann.body.length > 120 ? ann.body.slice(0, 120) + '…' : ann.body;

  return (
    <div onClick={onClick}
      className={`bg-app-surface rounded-xl border overflow-hidden active:scale-[0.99] transition-all duration-200 cursor-pointer ${
        ann.urgent ? 'border-app-red/40' : ann.pinned ? 'border-app-accent/30' : 'border-app-border'
      }`}>
      <div className="p-3.5">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-jakarta font-semibold flex items-center gap-1 flex-shrink-0"
            style={{ background: style.bg, color: style.color }}>
            {style.icon} {style.label}
          </span>
          {ann.urgent && (
            <span className="text-[10px] font-jakarta font-bold px-1.5 py-0.5 rounded-full bg-app-red/10 text-app-red flex items-center gap-1 flex-shrink-0">
              <span className="w-1 h-1 rounded-full bg-app-red" />
              Urgent
            </span>
          )}
          <div className="flex-1" />
          {canDelete && (
            <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
              <button onClick={onEdit}
                className="p-1 text-app-text-faint hover:text-app-accent transition-colors text-xs rounded hover:bg-app-surface-2"
                title="Edit">✏️</button>
              <button onClick={onPin}
                className="p-1 text-app-text-faint hover:text-app-accent transition-colors text-xs rounded hover:bg-app-surface-2"
                title={ann.pinned ? 'Unpin' : 'Pin'}>
                {ann.pinned ? '📍' : '📌'}
              </button>
              <button onClick={onDelete} disabled={deleting}
                className="p-1 text-app-text-faint hover:text-app-red transition-colors text-xs rounded hover:bg-app-surface-2 disabled:opacity-40"
                title="Delete">🗑</button>
            </div>
          )}
        </div>

        <h3 className="text-app-text font-jakarta font-bold text-sm leading-snug mb-1">{ann.title}</h3>

        {preview && (
          <p className="text-app-text-dim text-xs font-inter leading-relaxed line-clamp-1">{preview}</p>
        )}

        <div className="flex items-center gap-2 mt-2.5">
          {ann.course_code && (
            <span className="text-[10px] text-app-text-faint font-inter">{ann.course_code}</span>
          )}
          <span className="text-[10px] text-app-text-faint font-inter">·</span>
          <span className="text-[10px] text-app-text-faint font-inter">{formatRelativeTime(ann.created_at)}</span>
          {ann.pinned && (
            <>
              <span className="text-[10px] text-app-text-faint font-inter">·</span>
              <span className="text-[10px] text-app-accent font-inter font-semibold">📌 Pinned</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

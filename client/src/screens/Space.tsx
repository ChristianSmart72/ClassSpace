import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { useAuthStore } from '../store/authStore';
import { FilterBar, Fab } from '../components/layout';
import { Badge, EmptyState, Skeleton } from '../components/ui/Shared';
import { PostAnnouncementSheet } from '../components/sheets/PostAnnouncement';
import { UploadMaterialSheet } from '../components/sheets/UploadMaterial';
import { toggleReaction } from '../api/content';
import { getTimetable } from '../api/timetable';
import type { Announcement } from '../types';
import { COURSE_COLORS, COURSE_BG_COLORS, DAYS, type TimetableEntry } from '../types';
import { ShareSheet } from '../components/sheets/ShareSheet';

// Demo vote counts seeded from announcement id — looks realistic for a pitch
function demoCounts(annId: number) {
  const up = 8 + (annId * 13) % 40;
  const down = 1 + (annId * 3) % 8;
  const views = 24 + (annId * 17) % 120;
  return { up, down, views };
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [display, setDisplay] = useState('');
  const [level, setLevel] = useState<'ok' | 'warn' | 'critical'>('ok');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setDisplay('Overdue'); setLevel('critical'); return; }
      const totalMins = Math.floor(diff / 60000);
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      const days = Math.floor(hours / 24);
      if (days > 1) { setDisplay(`${days}d left`); setLevel('ok'); }
      else if (hours >= 1) { setDisplay(`${hours}h ${mins}m left`); setLevel(hours < 6 ? 'warn' : 'ok'); }
      else { setDisplay(`${mins}m left`); setLevel('critical'); }
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!display) return null;
  const cls = {
    ok: 'text-app-green bg-app-green/10 border-app-green/20',
    warn: 'text-app-orange bg-app-orange/10 border-app-orange/20',
    critical: 'text-app-red bg-app-red/10 border-app-red/20',
  }[level];
  return (
    <span className={`text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${cls} ${level === 'critical' ? 'animate-pulse' : ''}`}>
      ⏱ {display}
    </span>
  );
}

// ─── Main Space screen ─────────────────────────────────────────────────────
export function Space() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSpace, courses, fetchSpace, memberRole, loading: spaceLoading, error: spaceError } = useSpaceStore();
  const {
    announcements, loading: annLoading, fetchAnnouncements, deleteAnnouncement,
  } = useContentStore();
  const { user } = useAuthStore();

  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'ann' | 'mat' | 'schedule'>(() => {
    const t = searchParams.get('tab');
    if (t === 'mat') return 'mat';
    if (t === 'schedule') return 'schedule';
    return 'ann';
  });
  const [filter, setFilter] = useState('all');
  const [showPost, setShowPost] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ type: string; id: string | number } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const todayIndex = (() => { const d = new Date().getDay(); return d === 0 || d === 6 ? 0 : d - 1; })();
  const [scheduleDay, setScheduleDay] = useState(todayIndex);

  const [localReactions, setLocalReactions] = useState<Record<number, Record<string, number>>>({});
  const [userReacted, setUserReacted] = useState<Record<number, string | null>>({});

  const isRep = memberRole === 'rep';
  const courseList = courses ?? [];

  useEffect(() => { if (id) fetchSpace(id); }, [id]);
  useEffect(() => { if (id) fetchAnnouncements(id, filter); }, [id, filter]);
  useEffect(() => {
    if (id && tab === 'schedule') {
      getTimetable(id).then(data => setTimetable(data || [])).catch(() => setTimetable([]));
    }
  }, [id, tab]);

  useEffect(() => {
    if (announcements.length === 0) return;
    setUserReacted(prev => {
      const updated = { ...prev };
      for (const ann of announcements) {
        if (ann.my_reaction !== undefined && !(ann.id in prev)) {
          updated[ann.id] = ann.my_reaction ?? null;
        }
      }
      return updated;
    });
  }, [announcements]);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'urgent', label: '🔴 Urgent' },
    { value: 'pinned', label: '📌 Pinned' },
    ...courseList.map(c => ({ value: c.code, label: c.code })),
  ];

  const filteredAnnouncements = search
    ? announcements.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.body.toLowerCase().includes(search.toLowerCase()) ||
        a.course_code?.toLowerCase().includes(search.toLowerCase()))
    : announcements;

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

  const handleReact = useCallback(async (annId: number, reaction: string) => {
    if (!user) return;
    const currentReaction = userReacted[annId] ?? null;
    const isSame = currentReaction === reaction;
    const newReaction = isSame ? null : reaction;

    setUserReacted(old => ({ ...old, [annId]: newReaction }));
    setLocalReactions(old => {
      const base = announcements.find(a => a.id === annId)?.reactions ?? {};
      const demo = demoCounts(annId);
      const upvote = base['upvote'] ?? demo.up;
      const downvote = base['downvote'] ?? demo.down;
      const newCounts: Record<string, number> = { upvote, downvote };
      if (currentReaction) newCounts[currentReaction] = Math.max(0, (newCounts[currentReaction] ?? 0) - 1);
      if (newReaction) newCounts[newReaction] = (newCounts[newReaction] ?? 0) + 1;
      return { ...old, [annId]: newCounts };
    });

    try {
      const res = await toggleReaction(annId, reaction);
      setLocalReactions(old => ({ ...old, [annId]: res.reactions }));
    } catch {
      setUserReacted(old => ({ ...old, [annId]: currentReaction }));
      setLocalReactions(old => {
        const base = announcements.find(a => a.id === annId)?.reactions ?? {};
        return { ...old, [annId]: base };
      });
    }
  }, [announcements, userReacted, user]);

  if (spaceLoading) {
    return (
      <div className="px-4 pt-4">
        <Skeleton className="h-28 w-full rounded-2xl mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full mb-3 rounded-2xl" />)}
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

  const urgentCount = (announcements ?? []).filter(a => a.urgent).length;

  return (
    <div className="pb-4">
      {/* Space Hero */}
      <div className="px-4 pt-5 pb-4 bg-app-surface mb-3 relative overflow-hidden border-b border-app-border">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-app-accent" />
        <div className="pl-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-app-text font-jakarta font-bold text-lg leading-tight">{currentSpace.name}</h1>
              <p className="text-app-text-dim text-sm font-inter mt-0.5">{currentSpace.uni}</p>
            </div>
            <button
              onClick={() => { setShowSearch(s => !s); setSearch(''); }}
              className="w-9 h-9 rounded-xl bg-app-surface-2 border border-app-border flex items-center justify-center text-app-text-dim hover:text-app-text transition-colors flex-shrink-0"
            >
              {showSearch ? '✕' : '🔍'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] bg-app-accent/10 text-app-accent font-jakarta font-semibold px-2.5 py-1 rounded-full">{currentSpace.level}</span>
            <span className="text-[10px] bg-app-surface-2 text-app-text-dim font-jakarta font-semibold px-2.5 py-1 rounded-full">{courseList.length} courses</span>
            {urgentCount > 0 && (
              <span className="text-[10px] bg-app-red/10 text-app-red font-jakarta font-semibold px-2.5 py-1 rounded-full animate-pulse">⚠️ {urgentCount} urgent</span>
            )}
            <span className="text-[10px] bg-app-surface-2 text-app-text-faint font-jakarta px-2.5 py-1 rounded-full">
              Code: <span className="text-app-accent">{currentSpace.invite_code}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div className="px-4 mb-3"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search announcements, courses..."
              className="w-full bg-app-surface border border-app-accent/40 rounded-xl px-4 py-3 text-app-text text-sm font-inter placeholder:text-app-text-faint focus:outline-none focus:border-app-accent transition-colors" />
            {search && (
              <p className="text-app-text-faint text-xs font-inter mt-1.5 px-1">
                {filteredAnnouncements.length + filteredCourses.length} results for "{search}"
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex mx-4 mb-3 bg-app-surface rounded-xl p-1 border border-app-border gap-1">
        {[
          { key: 'ann',      label: 'Updates',  icon: '📢', count: announcements.length },
          { key: 'mat',      label: 'Files',    icon: '📁', count: courseList.length },
          { key: 'schedule', label: 'Schedule', icon: '📅', count: 0 },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'ann' | 'mat' | 'schedule')}
            className={`flex-1 py-2.5 text-sm font-jakarta font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
              tab === t.key ? 'bg-app-accent text-app-bg' : 'text-app-text-dim hover:text-app-text'
            }`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-app-bg/20 text-app-bg' : 'bg-app-surface-2 text-app-text-faint'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Announcements Tab ── */}
        {tab === 'ann' && (
          <motion.div key="ann" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {!showSearch && <FilterBar filters={filterOptions} active={filter} onChange={setFilter} />}
            <div className="px-4 flex flex-col gap-3">
              {annLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="bg-app-surface rounded-2xl p-4 border border-app-border">
                    <Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" /><Skeleton className="h-3 w-2/3" />
                  </div>
                ))
              ) : filteredAnnouncements.length === 0 ? (
                <EmptyState icon={search ? '🔍' : '📢'}
                  title={search ? 'No results' : 'No announcements'}
                  subtitle={search ? `Nothing matched "${search}"` : filter !== 'all' ? 'Try a different filter' : isRep ? 'Tap + to post' : 'Nothing posted yet'} />
              ) : (
                filteredAnnouncements.map(ann => (
                  <AnnouncementCard key={ann.id} ann={ann}
                    expanded={false}
                    onToggle={() => navigate(`/space/${currentSpace.id}/announcement/${ann.id}`)}
                    canDelete={isRep || ann.author_id === user?.id}
                    deleting={deletingId === ann.id}
                    onDelete={() => handleDelete(ann.id)}
                    localReactions={localReactions[ann.id] ?? ann.reactions ?? {}}
                    userReacted={userReacted[ann.id] ?? null}
                    onReact={reaction => handleReact(ann.id, reaction)}
                    isLoggedIn={!!user}
                    onShare={() => setShareTarget({ type: 'ann', id: ann.id })} />
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ── Materials Tab ── */}
        {tab === 'mat' && (
          <motion.div key="mat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="px-4">
            {spaceLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
              </div>
            ) : filteredCourses.length === 0 ? (
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
                        onClick={(e) => { e.stopPropagation(); setShareTarget({ type: 'course', id: course.id }); }}
                        className="flex-shrink-0 px-3 py-2 text-app-text-faint hover:text-app-accent transition-colors"
                        title="Share this course folder"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => navigate(`/space/${currentSpace.id}/course/${course.id}`)}
                        className="pr-4 text-app-text-dim text-xs font-inter flex-shrink-0"
                      >→</button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Schedule Tab ── */}
        {tab === 'schedule' && (
          <motion.div key="schedule" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="px-4">
            {/* Day selector */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
              {['Mon','Tue','Wed','Thu','Fri'].map((d, i) => (
                <button
                  key={d}
                  onClick={() => setScheduleDay(i)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-jakarta font-bold transition-all duration-200 border ${
                    scheduleDay === i
                      ? 'bg-app-accent text-app-bg border-app-accent'
                      : i === todayIndex
                        ? 'bg-app-surface border-app-accent/40 text-app-accent'
                        : 'bg-app-surface border-app-border text-app-text-dim'
                  }`}
                >
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
                    const colors = ['#e8ff47','#5b6af0','#52ffa0','#ffb347','#ff5252'];
                    const bgs   = ['#e8ff4715','#5b6af015','#52ffa015','#ffb34715','#ff525215'];
                    return (
                      <div key={entry.id} className="bg-app-surface border border-app-border rounded-2xl p-4 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: colors[ci] }} />
                        <div className="pl-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-app-text font-jakarta font-bold text-sm leading-snug flex-1">{entry.course_name}</p>
                            <span className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: bgs[ci], color: colors[ci] }}>
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
          </motion.div>
        )}
      </AnimatePresence>

      {isRep && tab === 'ann' && <Fab onClick={() => setShowPost(true)} icon="+" />}
      {isRep && tab === 'mat' && <Fab onClick={() => setShowUpload(true)} icon="+" />}

      {showPost && id && <PostAnnouncementSheet spaceId={id} onClose={() => setShowPost(false)} />}
      {showUpload && <UploadMaterialSheet onClose={() => setShowUpload(false)} />}
      {shareTarget && id && (
        <ShareSheet
          type={shareTarget.type}
          id={shareTarget.id}
          spaceId={id}
          onClose={() => setShareTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Type icon map ─────────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, string> = {
  assignment: '📝', test: '🧪', meeting: '🤝', update: '📡', announcement: '📢',
};

// ─── Announcement Card ────────────────────────────────────────────────────
function AnnouncementCard({
  ann, expanded, onToggle, canDelete, deleting, onDelete,
  localReactions, userReacted, onReact, isLoggedIn, onShare,
}: {
  ann: Announcement; expanded: boolean; onToggle: () => void;
  canDelete: boolean; deleting: boolean; onDelete: () => void;
  localReactions: Record<string, number>; userReacted: string | null;
  onReact: (reaction: string) => void; isLoggedIn: boolean;
  onShare?: () => void;
}) {
  const demo = demoCounts(ann.id);
  const upvotes = localReactions['upvote'] ?? demo.up;
  const downvotes = localReactions['downvote'] ?? demo.down;
  const views = demo.views;

  return (
    <div className={`bg-app-surface rounded-2xl border overflow-hidden transition-all duration-200 ${
      ann.urgent ? 'border-app-red/40' : ann.pinned ? 'border-app-accent/30' : 'border-app-border'
    }`}>
      {ann.urgent && (
        <div className="bg-app-red/10 border-b border-app-red/20 px-4 py-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-app-red animate-pulse" />
          <span className="text-app-red text-[11px] font-jakarta font-bold uppercase tracking-wider">Urgent</span>
        </div>
      )}
      <div className="p-4">
        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="text-sm">{TYPE_ICONS[ann.type] || '📢'}</span>
          {ann.type === 'assignment' && <Badge variant="assign">Assignment</Badge>}
          {ann.type === 'test' && <Badge variant="test">Test</Badge>}
          {ann.type === 'meeting' && <Badge variant="meet">Meeting</Badge>}
          {ann.type === 'update' && <Badge variant="update">Update</Badge>}
          {ann.type === 'announcement' && <Badge>Announcement</Badge>}
          {ann.pinned && <Badge variant="pin">📌 Pinned</Badge>}
          {ann.course_code && (
            <span className="text-[10px] bg-app-accent2/10 text-app-accent2 font-jakarta font-semibold px-1.5 py-0.5 rounded">{ann.course_code}</span>
          )}
          {ann.deadline && <DeadlineCountdown deadline={ann.deadline} />}
          {canDelete && (
            <button onClick={onDelete} disabled={deleting}
              className="ml-auto text-app-text-faint hover:text-app-red transition-colors text-sm px-1 disabled:opacity-40">🗑</button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-app-text font-jakarta font-bold text-base leading-tight mb-1">{ann.title}</h3>

        {/* Body — always show first 2 lines, full when expanded */}
        <p className={`text-app-text-dim text-sm font-inter leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
          {ann.body}
        </p>

        {/* Expanded extra details */}
        {expanded && (
          <div className="mt-3 flex flex-col gap-2">
            {(ann.deadline || ann.venue) && (
              <div className="bg-app-surface-2 rounded-xl p-3 border border-app-border flex flex-col gap-1.5">
                {ann.deadline && (
                  <div className="flex items-center gap-2 text-xs font-inter">
                    <span>⏰</span><span className="text-app-text font-semibold">Deadline:</span>
                    <span className="text-app-orange">{ann.deadline.split('T')[0]}</span>
                  </div>
                )}
                {ann.venue && (
                  <div className="flex items-center gap-2 text-xs font-inter">
                    <span>📍</span><span className="text-app-text font-semibold">Venue:</span>
                    <span className="text-app-text-dim">{ann.venue}</span>
                  </div>
                )}
              </div>
            )}
            {ann.instructions && (
              <div className="pt-2 border-t border-app-border">
                <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1.5">Instructions</p>
                <p className="text-app-text text-xs font-inter leading-relaxed">{ann.instructions}</p>
              </div>
            )}
            {ann.submission_method && (
              <div className="pt-2 border-t border-app-border">
                <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1">Submission</p>
                <p className="text-app-text text-xs font-inter">{ann.submission_method}</p>
              </div>
            )}
          </div>
        )}

        {/* Author row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-app-border">
          <div className="w-6 h-6 rounded-full bg-app-accent2/20 flex items-center justify-center text-xs text-app-accent2 font-jakarta font-bold flex-shrink-0">
            {ann.author_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-app-text-dim text-xs font-inter truncate">{ann.author_name}</p>
            <p className="text-app-text-faint text-[10px] font-inter">{ann.created_at?.split('T')[0]}</p>
          </div>
          {/* Share button */}
          {onShare && (
            <button
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              className="flex-shrink-0 text-app-text-faint hover:text-app-accent transition-colors p-1.5 rounded-lg hover:bg-app-surface-2"
              title="Share announcement"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          )}
          {/* View button */}
          <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-jakarta font-semibold border transition-all duration-200 ${
              expanded
                ? 'bg-app-accent/10 border-app-accent/30 text-app-accent'
                : 'bg-app-surface-2 border-app-border text-app-text-dim hover:border-app-accent/30 hover:text-app-text'
            }`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {expanded
                ? <><path d="M17 11l-5-5-5 5" /><path d="M12 6v12" /></>
                : <><circle cx="12" cy="12" r="3" /><path d="M2 12C4.5 6 8.5 3 12 3s7.5 3 10 9c-2.5 6-6.5 9-10 9s-7.5-3-10-9z" /></>
              }
            </svg>
            {expanded ? 'Less' : 'View'}
          </button>
        </div>

        {/* Votes + Views row */}
        <div className="flex items-center gap-1.5 mt-3">
          {/* Thumbs up */}
          <button
            onClick={() => isLoggedIn && onReact('upvote')}
            disabled={!isLoggedIn}
            title="Upvote"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-full border transition-all duration-200 active:scale-95 ${
              userReacted === 'upvote'
                ? 'bg-app-green/15 border-app-green/50 text-app-green'
                : 'bg-app-surface-2 border-app-border text-app-text-dim hover:border-app-green/40 hover:text-app-green'
            } ${!isLoggedIn ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              fill={userReacted === 'upvote' ? 'currentColor' : 'none'}>
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            <span className="text-[11px] font-jakarta font-bold tabular-nums">{upvotes}</span>
          </button>

          {/* Thumbs down */}
          <button
            onClick={() => isLoggedIn && onReact('downvote')}
            disabled={!isLoggedIn}
            title="Downvote"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-full border transition-all duration-200 active:scale-95 ${
              userReacted === 'downvote'
                ? 'bg-app-red/15 border-app-red/50 text-app-red'
                : 'bg-app-surface-2 border-app-border text-app-text-dim hover:border-app-red/40 hover:text-app-red'
            } ${!isLoggedIn ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              fill={userReacted === 'downvote' ? 'currentColor' : 'none'}>
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
              <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
            </svg>
            <span className="text-[11px] font-jakarta font-bold tabular-nums">{downvotes}</span>
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-app-border mx-0.5" />

          {/* Views — inline right after divider, no ml-auto */}
          <div className="flex items-center gap-1 text-app-text-faint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-[11px] font-jakarta font-semibold tabular-nums">{views}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

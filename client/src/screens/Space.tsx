import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { useAuthStore } from '../store/authStore';
import { FilterBar, Fab } from '../components/layout';
import { Badge, EmptyState, Skeleton } from '../components/ui/Shared';
import { PostAnnouncementSheet } from '../components/sheets/PostAnnouncement';
import { UploadMaterialSheet } from '../components/sheets/UploadMaterial';
import { toggleReaction } from '../api/content';
import type { Announcement } from '../types';
import { REACTION_EMOJIS, COURSE_COLORS, COURSE_BG_COLORS } from '../types';

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
      if (days > 1) { setDisplay(`${days}d ${hours % 24}h left`); setLevel('ok'); }
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
    <span className={`text-[10px] font-syne font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${cls} ${level === 'critical' ? 'animate-pulse' : ''}`}>
      ⏱ {display}
    </span>
  );
}

export function Space() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSpace, courses, fetchSpace, memberRole, loading: spaceLoading, error: spaceError } = useSpaceStore();
  const { announcements, loading: annLoading, fetchAnnouncements, deleteAnnouncement } = useContentStore();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<'ann' | 'mat'>('ann');
  const [filter, setFilter] = useState('all');
  const [showPost, setShowPost] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [localReactions, setLocalReactions] = useState<Record<number, Record<string, number>>>({});
  const [userReacted, setUserReacted] = useState<Record<number, Set<string>>>({});

  const isRep = memberRole === 'rep';
  const courseList = courses ?? [];

  useEffect(() => { if (id) fetchSpace(id); }, [id]);
  useEffect(() => { if (id) fetchAnnouncements(id, filter); }, [id, filter]);

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
        a.course_code?.toLowerCase().includes(search.toLowerCase())
      )
    : announcements;

  const filteredCourses = search
    ? courseList.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : courseList;

  const handleDelete = async (annId: number) => {
    if (!confirm('Delete this announcement?')) return;
    setDeletingId(annId);
    try { await deleteAnnouncement(annId); } finally { setDeletingId(null); }
  };

  const handleReact = useCallback(async (annId: number, emoji: string) => {
    const prev = userReacted[annId] ?? new Set<string>();
    const alreadyReacted = prev.has(emoji);

    setUserReacted(old => {
      const s = new Set(old[annId] ?? []);
      alreadyReacted ? s.delete(emoji) : s.add(emoji);
      return { ...old, [annId]: s };
    });
    setLocalReactions(old => {
      const cur = old[annId] ?? {};
      const prevCount = cur[emoji] ?? (announcements.find(a => a.id === annId)?.reactions?.[emoji] ?? 0);
      return { ...old, [annId]: { ...cur, [emoji]: Math.max(0, prevCount + (alreadyReacted ? -1 : 1)) } };
    });

    try {
      const res = await toggleReaction(annId, emoji);
      setLocalReactions(old => ({ ...old, [annId]: res.reactions }));
    } catch {
      setUserReacted(old => {
        const s = new Set(old[annId] ?? []);
        alreadyReacted ? s.add(emoji) : s.delete(emoji);
        return { ...old, [annId]: s };
      });
    }
  }, [announcements, userReacted]);

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
        <h2 className="text-app-text font-syne font-bold text-lg mb-2">Space not found</h2>
        <p className="text-app-text-dim text-sm font-dm mb-6">This space may no longer exist, or you need to join it first.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/home')} className="bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl px-6 py-3">Go Home</button>
          <button onClick={() => navigate('/join')} className="bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-xl px-6 py-3">Join a Space</button>
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
              <h1 className="text-app-text font-syne font-bold text-lg leading-tight">{currentSpace.name}</h1>
              <p className="text-app-text-dim text-sm font-dm mt-0.5">{currentSpace.uni}</p>
            </div>
            <button
              onClick={() => { setShowSearch(s => !s); setSearch(''); }}
              className="w-9 h-9 rounded-xl bg-app-surface-2 border border-app-border flex items-center justify-center text-app-text-dim hover:text-app-text transition-colors flex-shrink-0"
            >
              {showSearch ? '✕' : '🔍'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] bg-app-accent/10 text-app-accent font-syne font-semibold px-2.5 py-1 rounded-full">{currentSpace.level}</span>
            <span className="text-[10px] bg-app-surface-2 text-app-text-dim font-syne font-semibold px-2.5 py-1 rounded-full">{courseList.length} courses</span>
            {urgentCount > 0 && (
              <span className="text-[10px] bg-app-red/10 text-app-red font-syne font-semibold px-2.5 py-1 rounded-full animate-pulse">⚠️ {urgentCount} urgent</span>
            )}
            <span className="text-[10px] bg-app-surface-2 text-app-text-faint font-syne px-2.5 py-1 rounded-full">Code: <span className="text-app-accent">{currentSpace.invite_code}</span></span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="px-4 mb-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search announcements, courses..."
              className="w-full bg-app-surface border border-app-accent/40 rounded-xl px-4 py-3 text-app-text text-sm font-dm placeholder:text-app-text-faint focus:outline-none focus:border-app-accent transition-colors"
            />
            {search && (
              <p className="text-app-text-faint text-xs font-dm mt-1.5 px-1">
                {filteredAnnouncements.length + filteredCourses.length} results for "{search}"
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex mx-4 mb-3 bg-app-surface rounded-xl p-1 border border-app-border">
        {[
          { key: 'ann', label: 'Announcements', icon: '📢', count: announcements.length },
          { key: 'mat', label: 'Materials', icon: '📁', count: courseList.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'ann' | 'mat')}
            className={`flex-1 py-2 text-sm font-syne font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
              tab === t.key ? 'bg-app-accent text-app-bg' : 'text-app-text-dim'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden xs:inline">{t.label}</span>
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-app-bg/20 text-app-bg' : 'bg-app-surface-2 text-app-text-faint'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Announcements Tab */}
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
                <EmptyState
                  icon={search ? '🔍' : '📢'}
                  title={search ? 'No results' : 'No announcements'}
                  subtitle={search ? `Nothing matched "${search}"` : filter !== 'all' ? 'Try a different filter' : isRep ? 'Tap + to post' : 'Nothing posted yet'}
                />
              ) : (
                filteredAnnouncements.map(ann => (
                  <AnnouncementCard
                    key={ann.id}
                    ann={ann}
                    expanded={expandedId === ann.id}
                    onToggle={() => setExpandedId(expandedId === ann.id ? null : ann.id)}
                    canDelete={isRep || ann.author_id === user?.id}
                    deleting={deletingId === ann.id}
                    onDelete={() => handleDelete(ann.id)}
                    localReactions={localReactions[ann.id] ?? ann.reactions ?? {}}
                    userReacted={userReacted[ann.id] ?? new Set()}
                    onReact={emoji => handleReact(ann.id, emoji)}
                    isLoggedIn={!!user}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Materials Tab */}
        {tab === 'mat' && (
          <motion.div key="mat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="px-4">
            {filteredCourses.length === 0 ? (
              <EmptyState icon={search ? '🔍' : '📁'} title={search ? 'No results' : 'No courses yet'} />
            ) : (
              <div className="flex flex-col gap-2">
                {filteredCourses.map((course, i) => {
                  const ci = (course.color_index ?? i) % 5;
                  return (
                    <button
                      key={course.id}
                      onClick={() => navigate(`/space/${currentSpace.id}/course/${course.id}`)}
                      className="bg-app-surface rounded-2xl border border-app-border text-left active:scale-[0.99] transition-all duration-200 flex items-center gap-4 relative overflow-hidden"
                      style={{ padding: '14px 16px' }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: COURSE_COLORS[ci] }} />
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ml-2" style={{ background: COURSE_BG_COLORS[ci] }}>
                        {course.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-app-text font-syne font-bold text-sm leading-snug">{course.name}</p>
                        <p className="text-app-text-dim text-xs font-dm mt-0.5">{course.code}</p>
                      </div>
                      <span className="text-app-text-dim text-xs font-dm bg-app-surface-2 px-2 py-0.5 rounded-lg flex-shrink-0">Files →</span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isRep && tab === 'ann' && <Fab onClick={() => setShowPost(true)} icon="+" />}
      {isRep && tab === 'mat' && <Fab onClick={() => setShowUpload(true)} icon="+" />}

      {showPost && id && <PostAnnouncementSheet spaceId={id} onClose={() => setShowPost(false)} />}
      {showUpload && <UploadMaterialSheet onClose={() => setShowUpload(false)} />}
    </div>
  );
}

const TYPE_ICONS: Record<string, string> = {
  assignment: '📝', test: '🧪', meeting: '🤝', update: '📡', announcement: '📢',
};

function AnnouncementCard({
  ann, expanded, onToggle, canDelete, deleting, onDelete,
  localReactions, userReacted, onReact, isLoggedIn,
}: {
  ann: Announcement;
  expanded: boolean;
  onToggle: () => void;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
  localReactions: Record<string, number>;
  userReacted: Set<string>;
  onReact: (emoji: string) => void;
  isLoggedIn: boolean;
}) {
  const isLong = ann.body.length > 120;
  const totalReactions = Object.values(localReactions).reduce((a, b) => a + b, 0);

  return (
    <div className={`bg-app-surface rounded-2xl border overflow-hidden transition-all duration-200 ${
      ann.urgent ? 'border-app-red/40' : ann.pinned ? 'border-app-accent/30' : 'border-app-border'
    }`}>
      {ann.urgent && (
        <div className="bg-app-red/10 border-b border-app-red/20 px-4 py-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-app-red animate-pulse" />
          <span className="text-app-red text-[11px] font-syne font-bold uppercase tracking-wider">Urgent</span>
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
            <span className="text-[10px] bg-app-accent2/10 text-app-accent2 font-syne font-semibold px-1.5 py-0.5 rounded">{ann.course_code}</span>
          )}
          {ann.deadline && <DeadlineCountdown deadline={ann.deadline} />}
          {canDelete && (
            <button onClick={onDelete} disabled={deleting} className="ml-auto text-app-text-faint hover:text-app-red transition-colors text-sm px-1 disabled:opacity-40">🗑</button>
          )}
        </div>

        {/* Title & body */}
        <h3 className="text-app-text font-syne font-bold text-base leading-tight mb-1">{ann.title}</h3>
        <p className={`text-app-text-dim text-sm font-dm leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
          {ann.body}
        </p>
        {isLong && (
          <button onClick={onToggle} className="text-app-accent text-xs font-syne font-semibold mt-1">
            {expanded ? 'Show less ↑' : 'Read more ↓'}
          </button>
        )}

        {/* Deadline + venue */}
        {(ann.deadline || ann.venue) && (
          <div className="mt-3 bg-app-surface-2 rounded-xl p-3 border border-app-border flex flex-col gap-1.5">
            {ann.deadline && (
              <div className="flex items-center gap-2 text-xs font-dm">
                <span>⏰</span>
                <span className="text-app-text font-semibold">Deadline:</span>
                <span className="text-app-orange">{ann.deadline.split('T')[0]}</span>
              </div>
            )}
            {ann.venue && (
              <div className="flex items-center gap-2 text-xs font-dm">
                <span>📍</span>
                <span className="text-app-text font-semibold">Venue:</span>
                <span className="text-app-text-dim">{ann.venue}</span>
              </div>
            )}
          </div>
        )}

        {/* Instructions (when expanded) */}
        {expanded && ann.instructions && (
          <div className="mt-3 pt-3 border-t border-app-border">
            <p className="text-app-text-dim text-[10px] font-syne font-semibold uppercase tracking-wider mb-1.5">Instructions</p>
            <p className="text-app-text text-xs font-dm leading-relaxed">{ann.instructions}</p>
          </div>
        )}
        {expanded && ann.submission_method && (
          <div className="mt-2 pt-2 border-t border-app-border">
            <p className="text-app-text-dim text-[10px] font-syne font-semibold uppercase tracking-wider mb-1">Submission</p>
            <p className="text-app-text text-xs font-dm">{ann.submission_method}</p>
          </div>
        )}

        {/* Author */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-app-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-app-accent2/20 flex items-center justify-center text-xs text-app-accent2 font-syne font-bold">
              {ann.author_name?.charAt(0)}
            </div>
            <div>
              <p className="text-app-text-dim text-xs font-dm">{ann.author_name}</p>
              <p className="text-app-text-faint text-[10px] font-dm">{ann.created_at?.split('T')[0]}</p>
            </div>
          </div>
          {totalReactions > 0 && (
            <p className="text-app-text-faint text-[10px] font-dm">{totalReactions} reaction{totalReactions !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {REACTION_EMOJIS.map(emoji => {
            const count = localReactions[emoji] ?? 0;
            const reacted = userReacted.has(emoji);
            return (
              <button
                key={emoji}
                onClick={() => isLoggedIn && onReact(emoji)}
                disabled={!isLoggedIn}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-syne font-semibold border transition-all duration-200 active:scale-90 ${
                  reacted
                    ? 'bg-app-accent/15 border-app-accent/40 text-app-accent'
                    : count > 0
                    ? 'bg-app-surface-2 border-app-border text-app-text-dim hover:border-app-accent/30'
                    : 'bg-transparent border-app-border/50 text-app-text-faint hover:border-app-border opacity-60'
                } ${!isLoggedIn ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span>{emoji}</span>
                {count > 0 && <span className={reacted ? 'text-app-accent' : 'text-app-text-dim'}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

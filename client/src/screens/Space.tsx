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
import type { Announcement, Poll } from '../types';
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

function CreatePollForm({ spaceId, onCreated, onCancel }: {
  spaceId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [closesAt, setClosesAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { createPoll } = useContentStore();

  const addOption = () => { if (options.length < 6) setOptions([...options, '']); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, val: string) => setOptions(options.map((o, idx) => idx === i ? val : o));

  const handleSubmit = async () => {
    if (!question.trim()) { setError('Enter a question'); return; }
    const filled = options.filter(o => o.trim());
    if (filled.length < 2) { setError('At least 2 options required'); return; }
    setSaving(true);
    setError('');
    try {
      await createPoll(spaceId, { question: question.trim(), options: filled, closes_at: closesAt || undefined });
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to create poll');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-app-surface rounded-2xl border border-app-accent/30 p-4">
      <h3 className="text-app-text font-syne font-bold text-sm mb-3">📊 New Poll</h3>

      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="What do you want to ask the class?"
        rows={2}
        className="w-full bg-app-surface-2 border border-app-border rounded-xl px-3 py-2.5 text-app-text text-sm font-dm placeholder:text-app-text-faint focus:outline-none focus:border-app-accent resize-none mb-3"
      />

      <p className="text-app-text-dim text-[11px] font-syne font-semibold uppercase tracking-wider mb-2">Options</p>
      <div className="flex flex-col gap-2 mb-3">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="flex-1 bg-app-surface-2 border border-app-border rounded-xl px-3 py-2 text-app-text text-sm font-dm placeholder:text-app-text-faint focus:outline-none focus:border-app-accent"
            />
            {options.length > 2 && (
              <button onClick={() => removeOption(i)} className="text-app-text-faint hover:text-app-red text-lg leading-none">×</button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button onClick={addOption} className="text-app-accent text-xs font-syne font-semibold text-left pl-1">+ Add option</button>
        )}
      </div>

      <div className="mb-3">
        <p className="text-app-text-dim text-[11px] font-syne font-semibold uppercase tracking-wider mb-1.5">Close date (optional)</p>
        <input
          type="datetime-local"
          value={closesAt}
          onChange={e => setClosesAt(e.target.value)}
          className="bg-app-surface-2 border border-app-border rounded-xl px-3 py-2 text-app-text text-sm font-dm focus:outline-none focus:border-app-accent"
        />
      </div>

      {error && <p className="text-app-red text-xs font-dm mb-3">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl py-2.5 disabled:opacity-50"
        >
          {saving ? 'Posting...' : 'Post Poll'}
        </button>
        <button onClick={onCancel} className="px-4 bg-app-surface-2 text-app-text-dim font-syne font-semibold text-sm rounded-xl py-2.5 border border-app-border">
          Cancel
        </button>
      </div>
    </div>
  );
}

function PollCard({ poll, isRep, onVote, onDelete }: {
  poll: Poll;
  isRep: boolean;
  onVote: (pollId: number, optionId: number) => Promise<void>;
  onDelete: (pollId: number) => void;
}) {
  const [voting, setVoting] = useState<number | null>(null);
  const [myVote, setMyVote] = useState<number | null>(poll.my_vote ?? null);
  const [localPoll, setLocalPoll] = useState(poll);
  const isClosed = poll.closes_at ? new Date(poll.closes_at) < new Date() : false;
  const hasVoted = myVote !== null;

  const handleVote = async (optionId: number) => {
    if (voting || isClosed) return;
    setVoting(optionId);
    try {
      await onVote(poll.id, optionId);
      setMyVote(optionId);
    } finally {
      setVoting(null);
    }
  };

  useEffect(() => { setLocalPoll(poll); setMyVote(poll.my_vote ?? null); }, [poll]);

  const total = localPoll.total_votes || 0;

  return (
    <div className="bg-app-surface rounded-2xl border border-app-border overflow-hidden">
      {isClosed && (
        <div className="bg-app-surface-2 border-b border-app-border px-4 py-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-app-text-faint" />
          <span className="text-app-text-faint text-[11px] font-syne font-bold uppercase tracking-wider">Poll closed</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">📊</span>
            <p className="text-app-text font-syne font-bold text-sm leading-snug">{localPoll.question}</p>
          </div>
          {isRep && (
            <button onClick={() => onDelete(poll.id)} className="text-app-text-faint hover:text-app-red transition-colors text-sm px-1 flex-shrink-0">🗑</button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {localPoll.options.map((opt) => {
            const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
            const isMyChoice = myVote === opt.id;
            const showResults = hasVoted || isClosed;

            return (
              <button
                key={opt.id}
                onClick={() => !isClosed && handleVote(opt.id)}
                disabled={!!voting || isClosed}
                className={`relative w-full text-left rounded-xl border overflow-hidden transition-all duration-200 ${
                  isMyChoice
                    ? 'border-app-accent bg-app-accent/8'
                    : showResults
                    ? 'border-app-border bg-app-surface-2 cursor-default'
                    : 'border-app-border bg-app-surface-2 hover:border-app-accent/50 active:scale-[0.99]'
                } ${voting === opt.id ? 'opacity-60' : ''}`}
                style={{ minHeight: '44px' }}
              >
                {showResults && (
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${isMyChoice ? 'bg-app-accent/20' : 'bg-app-surface/60'}`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between px-3 py-2.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isMyChoice && <span className="text-app-accent text-xs">✓</span>}
                    <span className="text-app-text text-sm font-dm leading-tight truncate">{opt.text}</span>
                  </div>
                  {showResults && (
                    <span className={`text-xs font-syne font-bold flex-shrink-0 ${isMyChoice ? 'text-app-accent' : 'text-app-text-dim'}`}>
                      {pct}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-app-border">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-app-accent2/20 flex items-center justify-center text-[10px] text-app-accent2 font-syne font-bold">
              {localPoll.author_name?.charAt(0)}
            </div>
            <p className="text-app-text-faint text-xs font-dm">{localPoll.author_name}</p>
          </div>
          <div className="flex items-center gap-2">
            {localPoll.closes_at && !isClosed && (
              <span className="text-app-text-faint text-[10px] font-dm">
                closes {new Date(localPoll.closes_at).toLocaleDateString()}
              </span>
            )}
            <span className="text-app-text-dim text-[10px] font-syne font-semibold bg-app-surface-2 px-2 py-0.5 rounded-full">
              {total} vote{total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Space() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSpace, courses, fetchSpace, memberRole, loading: spaceLoading, error: spaceError } = useSpaceStore();
  const {
    announcements, loading: annLoading, fetchAnnouncements, deleteAnnouncement,
    polls, pollsLoading, fetchPolls, votePoll, deletePoll,
  } = useContentStore();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<'ann' | 'mat' | 'polls'>('ann');
  const [filter, setFilter] = useState('all');
  const [showPost, setShowPost] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
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
  useEffect(() => { if (id && tab === 'polls') fetchPolls(id); }, [id, tab]);

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

  const handleDeletePoll = async (pollId: number) => {
    if (!confirm('Delete this poll?')) return;
    try { await deletePoll(pollId); } catch { /* ignore */ }
  };

  const handleVotePoll = async (pollId: number, optionId: number) => {
    await votePoll(pollId, optionId);
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
      <div className="flex mx-4 mb-3 bg-app-surface rounded-xl p-1 border border-app-border gap-1">
        {[
          { key: 'ann', label: 'Updates', icon: '📢', count: announcements.length },
          { key: 'mat', label: 'Files', icon: '📁', count: courseList.length },
          { key: 'polls', label: 'Polls', icon: '📊', count: polls.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'ann' | 'mat' | 'polls')}
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

        {/* Polls Tab */}
        {tab === 'polls' && (
          <motion.div key="polls" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="px-4">
            {isRep && (
              <div className="mb-3">
                {showCreatePoll ? (
                  <CreatePollForm
                    spaceId={id!}
                    onCreated={() => setShowCreatePoll(false)}
                    onCancel={() => setShowCreatePoll(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowCreatePoll(true)}
                    className="w-full bg-app-surface border border-dashed border-app-accent/40 rounded-2xl py-3 text-app-accent text-sm font-syne font-semibold hover:border-app-accent/70 transition-colors"
                  >
                    + Create Poll
                  </button>
                )}
              </div>
            )}
            {pollsLoading ? (
              [1, 2].map(i => <Skeleton key={i} className="h-40 w-full mb-3 rounded-2xl" />)
            ) : polls.length === 0 ? (
              <EmptyState
                icon="📊"
                title="No polls yet"
                subtitle={isRep ? 'Create a poll to get the class voting' : 'The class rep hasn\'t posted any polls yet'}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {polls.map(poll => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    isRep={isRep}
                    onVote={handleVotePoll}
                    onDelete={handleDeletePoll}
                  />
                ))}
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

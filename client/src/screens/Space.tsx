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
import type { Announcement, Opportunity } from '../types';
import { COURSE_COLORS, COURSE_BG_COLORS, OPPORTUNITY_CATEGORIES as OPP_CATS } from '../types';

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

// ─── Create Opportunity Form ───────────────────────────────────────────────
function CreateOpportunityForm({ spaceId, onCreated, onCancel }: {
  spaceId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [link, setLink] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { createOpportunity } = useContentStore();

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Enter a title'); return; }
    if (!description.trim()) { setError('Enter a description'); return; }
    setSaving(true);
    setError('');
    try {
      await createOpportunity(spaceId, {
        title: title.trim(),
        description: description.trim(),
        category,
        link: link.trim() || undefined,
        deadline: deadline || undefined,
      });
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to post opportunity');
    } finally {
      setSaving(false);
    }
  };

  const selected = OPP_CATS.find(c => c.value === category)!;

  return (
    <div className="bg-app-surface rounded-2xl border border-app-accent/30 p-4 mb-3">
      <h3 className="text-app-text font-syne font-bold text-sm mb-3">
        {selected.icon} Post Opportunity
      </h3>

      {/* Category selector */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {OPP_CATS.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`text-[11px] font-syne font-semibold px-2.5 py-1 rounded-full border transition-all duration-200 ${
              category === cat.value
                ? 'border-transparent text-app-bg'
                : 'border-app-border text-app-text-dim hover:border-app-accent/40'
            }`}
            style={category === cat.value ? { background: cat.color } : {}}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title (e.g. Shell Scholarship 2025)"
        className="w-full bg-app-surface-2 border border-app-border rounded-xl px-3 py-2.5 text-app-text text-sm font-dm placeholder:text-app-text-faint focus:outline-none focus:border-app-accent mb-2"
      />

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Describe the opportunity — eligibility, requirements, what to expect..."
        rows={3}
        className="w-full bg-app-surface-2 border border-app-border rounded-xl px-3 py-2.5 text-app-text text-sm font-dm placeholder:text-app-text-faint focus:outline-none focus:border-app-accent resize-none mb-2"
      />

      <input
        value={link}
        onChange={e => setLink(e.target.value)}
        placeholder="Link (optional)"
        type="url"
        className="w-full bg-app-surface-2 border border-app-border rounded-xl px-3 py-2.5 text-app-text text-sm font-dm placeholder:text-app-text-faint focus:outline-none focus:border-app-accent mb-2"
      />

      <div className="mb-3">
        <p className="text-app-text-dim text-[11px] font-syne font-semibold uppercase tracking-wider mb-1.5">Application deadline (optional)</p>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
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
          {saving ? 'Posting...' : 'Post Opportunity'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 bg-app-surface-2 text-app-text-dim font-syne font-semibold text-sm rounded-xl py-2.5 border border-app-border"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Opportunity Card ──────────────────────────────────────────────────────
function OpportunityCard({ opp, isRep, onDelete }: {
  opp: Opportunity;
  isRep: boolean;
  onDelete: (id: number) => void;
}) {
  const cat = OPP_CATS.find(c => c.value === opp.category) ?? OPP_CATS[OPP_CATS.length - 1];
  const isExpired = opp.deadline ? new Date(opp.deadline) < new Date() : false;

  return (
    <div className="bg-app-surface rounded-2xl border border-app-border overflow-hidden">
      {/* Category header stripe */}
      <div
        className="px-4 py-2 flex items-center gap-2"
        style={{ background: `${cat.color}12`, borderBottom: `1px solid ${cat.color}25` }}
      >
        <span className="text-base">{cat.icon}</span>
        <span className="text-xs font-syne font-bold" style={{ color: cat.color }}>
          {cat.label.toUpperCase()}
        </span>
        {isExpired && (
          <span className="ml-auto text-[10px] bg-app-surface-2 text-app-text-faint font-syne font-bold px-2 py-0.5 rounded-full">Closed</span>
        )}
        {isRep && (
          <button
            onClick={() => onDelete(opp.id)}
            className="ml-auto text-app-text-faint hover:text-app-red transition-colors text-sm px-1"
          >
            🗑
          </button>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-app-text font-syne font-bold text-base leading-tight mb-2">{opp.title}</h3>
        <p className="text-app-text-dim text-sm font-dm leading-relaxed mb-3">{opp.description}</p>

        <div className="flex flex-wrap gap-2 items-center">
          {opp.deadline && !isExpired && (
            <span className="flex items-center gap-1.5 text-[11px] font-dm text-app-orange bg-app-orange/10 border border-app-orange/20 px-2.5 py-1 rounded-full">
              ⏰ Deadline: {new Date(opp.deadline).toLocaleDateString()}
            </span>
          )}
          {opp.link && (
            <a
              href={opp.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-syne font-semibold text-app-accent bg-app-accent/10 border border-app-accent/20 px-2.5 py-1 rounded-full hover:bg-app-accent/20 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              🔗 Apply / Learn more
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-app-border">
          <div className="w-5 h-5 rounded-full bg-app-accent2/20 flex items-center justify-center text-[10px] text-app-accent2 font-syne font-bold">
            {opp.author_name?.charAt(0)}
          </div>
          <p className="text-app-text-faint text-xs font-dm">
            {opp.author_name} · {opp.created_at?.split('T')[0]}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Space screen ─────────────────────────────────────────────────────
export function Space() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSpace, courses, fetchSpace, memberRole, loading: spaceLoading, error: spaceError } = useSpaceStore();
  const {
    announcements, loading: annLoading, fetchAnnouncements, deleteAnnouncement,
    opportunities, opportunitiesLoading, fetchOpportunities, deleteOpportunity,
  } = useContentStore();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<'ann' | 'mat' | 'opps'>('ann');
  const [filter, setFilter] = useState('all');
  const [showPost, setShowPost] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateOpp, setShowCreateOpp] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // upvote/downvote state
  const [localReactions, setLocalReactions] = useState<Record<number, Record<string, number>>>({});
  const [userReacted, setUserReacted] = useState<Record<number, string | null>>({});

  const isRep = memberRole === 'rep';
  const courseList = courses ?? [];

  useEffect(() => { if (id) fetchSpace(id); }, [id]);
  useEffect(() => { if (id) fetchAnnouncements(id, filter); }, [id, filter]);
  useEffect(() => { if (id && tab === 'opps') fetchOpportunities(id); }, [id, tab]);

  // Hydrate userReacted from server-returned my_reaction field
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

  const handleDeleteOpp = async (oppId: number) => {
    if (!confirm('Delete this opportunity?')) return;
    try { await deleteOpportunity(oppId); } catch { /* ignore */ }
  };

  const handleReact = useCallback(async (annId: number, reaction: string) => {
    if (!user) return;
    const currentReaction = userReacted[annId] ?? null;
    const isSame = currentReaction === reaction;
    const newReaction = isSame ? null : reaction;

    // Optimistic update
    setUserReacted(old => ({ ...old, [annId]: newReaction }));
    setLocalReactions(old => {
      const baseReactions = announcements.find(a => a.id === annId)?.reactions ?? {};
      // Reset counts from base + local changes
      const upvote = baseReactions['upvote'] ?? 0;
      const downvote = baseReactions['downvote'] ?? 0;
      const newCounts: Record<string, number> = { upvote, downvote };

      // Remove previous vote
      if (currentReaction) newCounts[currentReaction] = Math.max(0, (newCounts[currentReaction] ?? 0) - 1);
      // Add new vote
      if (newReaction) newCounts[newReaction] = (newCounts[newReaction] ?? 0) + 1;

      return { ...old, [annId]: newCounts };
    });

    try {
      if (isSame) {
        // Toggle off — send the request to remove
        const res = await toggleReaction(annId, reaction);
        setLocalReactions(old => ({ ...old, [annId]: res.reactions }));
      } else {
        const res = await toggleReaction(annId, reaction);
        setLocalReactions(old => ({ ...old, [annId]: res.reactions }));
      }
    } catch {
      // Revert
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
            <span className="text-[10px] bg-app-surface-2 text-app-text-faint font-syne px-2.5 py-1 rounded-full">
              Code: <span className="text-app-accent">{currentSpace.invite_code}</span>
            </span>
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
          { key: 'opps', label: 'Opps', icon: '🏆', count: opportunities.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'ann' | 'mat' | 'opps')}
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
                    userReacted={userReacted[ann.id] ?? null}
                    onReact={reaction => handleReact(ann.id, reaction)}
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

        {/* Opportunities Tab */}
        {tab === 'opps' && (
          <motion.div key="opps" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="px-4">
            {/* Category filter pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-3">
              {OPP_CATS.map(cat => (
                <span
                  key={cat.value}
                  className="flex-shrink-0 text-[10px] font-syne font-semibold px-2.5 py-1 rounded-full border border-app-border text-app-text-faint"
                >
                  {cat.icon} {cat.label}
                </span>
              ))}
            </div>

            {isRep && (
              <div className="mb-3">
                {showCreateOpp ? (
                  <CreateOpportunityForm
                    spaceId={id!}
                    onCreated={() => setShowCreateOpp(false)}
                    onCancel={() => setShowCreateOpp(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowCreateOpp(true)}
                    className="w-full bg-app-surface border border-dashed border-app-accent/40 rounded-2xl py-3 text-app-accent text-sm font-syne font-semibold hover:border-app-accent/70 transition-colors"
                  >
                    + Post an Opportunity
                  </button>
                )}
              </div>
            )}

            {opportunitiesLoading ? (
              [1, 2].map(i => <Skeleton key={i} className="h-40 w-full mb-3 rounded-2xl" />)
            ) : opportunities.length === 0 ? (
              <EmptyState
                icon="🏆"
                title="No opportunities yet"
                subtitle={isRep ? 'Post scholarships, internships, seminars and more' : 'Check back soon for opportunities'}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {opportunities.map(opp => (
                  <OpportunityCard
                    key={opp.id}
                    opp={opp}
                    isRep={isRep}
                    onDelete={handleDeleteOpp}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isRep && tab === 'ann' && <Fab onClick={() => setShowPost(true)} icon="+" />}
      {isRep && tab === 'mat' && <Fab onClick={() => setShowUpload(true)} icon="+" />}
      {isRep && tab === 'opps' && !showCreateOpp && <Fab onClick={() => setShowCreateOpp(true)} icon="+" />}

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
  userReacted: string | null;
  onReact: (reaction: string) => void;
  isLoggedIn: boolean;
}) {
  const isLong = ann.body.length > 120;
  const upvotes = localReactions['upvote'] ?? 0;
  const downvotes = localReactions['downvote'] ?? 0;
  // Static demo views based on id
  const views = 12 + (ann.id * 7) % 88;

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
          {/* Views (static demo) */}
          <div className="flex items-center gap-1 text-app-text-faint">
            <span className="text-xs">👁</span>
            <span className="text-[11px] font-dm">{views}</span>
          </div>
        </div>

        {/* Upvote / Downvote row */}
        <div className="flex items-center gap-2 mt-3">
          {/* Upvote */}
          <button
            onClick={() => isLoggedIn && onReact('upvote')}
            disabled={!isLoggedIn}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-syne font-semibold border transition-all duration-200 active:scale-95 ${
              userReacted === 'upvote'
                ? 'bg-app-green/15 border-app-green/40 text-app-green'
                : 'bg-app-surface-2 border-app-border text-app-text-dim hover:border-app-green/40 hover:text-app-green'
            } ${!isLoggedIn ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={userReacted === 'upvote' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <span>{upvotes > 0 ? upvotes : ''}</span>
            <span>{userReacted === 'upvote' ? 'Upvoted' : 'Upvote'}</span>
          </button>

          {/* Downvote */}
          <button
            onClick={() => isLoggedIn && onReact('downvote')}
            disabled={!isLoggedIn}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-syne font-semibold border transition-all duration-200 active:scale-95 ${
              userReacted === 'downvote'
                ? 'bg-app-red/15 border-app-red/40 text-app-red'
                : 'bg-app-surface-2 border-app-border text-app-text-dim hover:border-app-red/40 hover:text-app-red'
            } ${!isLoggedIn ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={userReacted === 'downvote' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            <span>{downvotes > 0 ? downvotes : ''}</span>
            <span>{userReacted === 'downvote' ? 'Downvoted' : 'Downvote'}</span>
          </button>

          {!isLoggedIn && (
            <span className="text-app-text-faint text-[10px] font-dm ml-auto">Sign in to vote</span>
          )}
        </div>
      </div>
    </div>
  );
}

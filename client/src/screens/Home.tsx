import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { Badge } from '../components/ui/Shared';
import { getOpportunities } from '../api/opportunities';
import type { Opportunity } from '../types';

const DEMO_OPPS: Opportunity[] = [
  { id: -1, space_id: '', author_id: 0, author_name: 'ClassSpace', title: 'Shell Nigeria STEM Scholarship 2025', description: 'Open to 300L and 400L engineering students with a minimum CGPA of 3.5. Covers tuition, stipend, and mentorship.', category: 'scholarship', link: 'https://shell.com/scholarship', deadline: '2025-08-31', created_at: new Date().toISOString() },
  { id: -2, space_id: '', author_id: 0, author_name: 'ClassSpace', title: 'MTN Foundation Summer Internship', description: 'Paid 3-month internship for penultimate year students. Accommodation provided for out-of-state candidates.', category: 'internship', link: 'https://mtn.com/internship', deadline: '2025-07-15', created_at: new Date().toISOString() },
  { id: -3, space_id: '', author_id: 0, author_name: 'ClassSpace', title: 'IEEE Nigeria Student Competition', description: 'Submit your FYP abstract. Win ₦500,000 and IEEE membership. All engineering disciplines.', category: 'competition', link: 'https://ieee.org/nigeria', deadline: '2025-09-10', created_at: new Date().toISOString() },
];

const CAT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  scholarship:  { bg: '#e8ff4715', color: '#e8ff47', label: '🎓 Scholarship' },
  internship:   { bg: '#52ffa015', color: '#52ffa0', label: '💼 Internship' },
  competition:  { bg: '#5b6af015', color: '#8b97ff', label: '🏆 Competition' },
  seminar:      { bg: '#ffb34715', color: '#ffb347', label: '📚 Seminar' },
  job:          { bg: '#ff525215', color: '#ff8a8a', label: '🧑‍💻 Job' },
};

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentSpace, courses, loading: spaceLoading } = useSpaceStore();
  const { announcements, fetchAnnouncements } = useContentStore();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    if (currentSpace) {
      fetchAnnouncements(currentSpace.id);
      setOppsLoading(true);
      getOpportunities(currentSpace.id)
        .then(data => setOpps(data ?? []))
        .catch(() => setOpps([]))
        .finally(() => setOppsLoading(false));
    }
  }, [currentSpace]);

  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const courseList = courses ?? [];
  const courseCount = courseList.length;
  const urgentCount = announcements.filter(a => a.urgent).length;
  const displayOpps = (opps.length > 0 ? opps : DEMO_OPPS).slice(0, 3);
  const loading = (!currentSpace && !!localStorage.getItem('spaceId')) || spaceLoading;

  if (loading) {
    return (
      <div className="px-4 pt-6 lg:px-8 lg:pt-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-28 rounded-2xl mb-5" />
        <Skeleton className="h-4 w-32 mb-3" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl mb-2" />)}
      </div>
    );
  }

  if (!currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6">
        <EmptyState
          icon="📚"
          title="No space yet"
          subtitle="Create or join a space to get started"
          action={
            <div className="flex gap-3">
              <button onClick={() => navigate('/setup')} className="bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl px-6 py-3">
                Create Space
              </button>
              <button onClick={() => navigate('/join')} className="bg-app-surface border border-app-border text-app-text font-jakarta font-semibold text-sm rounded-xl px-6 py-3">
                Join
              </button>
            </div>
          }
        />
      </div>
    );
  }

  const STAT_CARDS = [
    { icon: '📢', value: announcements.length, label: 'Announcements', accent: true },
    { icon: '📚', value: courseCount, label: 'Courses', accent: false },
  ];

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
      {/* Greeting */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-app-text font-jakarta font-bold text-xl lg:text-2xl">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-app-text-dim text-sm font-inter mt-0.5">
          {currentSpace.dept} · {currentSpace.uni.split('(')[1]?.replace(')', '') || currentSpace.uni}
        </p>
      </motion.div>

      {/* Opportunities Section — shown before the grid */}
      <motion.div
        className="mb-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.07 }}
      >
        {oppsLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-64 flex-shrink-0 rounded-2xl" />)}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
            {displayOpps.map(opp => {
              const cat = CAT_STYLE[opp.category] ?? { bg: '#ffffff0d', color: '#7a7a88', label: opp.category };
              const daysLeft = opp.deadline
                ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000)
                : null;
              return (
                <div
                  key={opp.id}
                  className="flex-shrink-0 w-[260px] bg-app-surface border border-app-border rounded-2xl overflow-hidden"
                  style={{ borderLeft: `3px solid ${cat.color}` }}
                >
                  <div className="p-3.5 flex flex-col gap-1.5">
                    <span
                      className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-full self-start"
                      style={{ background: cat.bg, color: cat.color }}
                    >
                      {cat.label}
                    </span>
                    <p className="text-app-text font-jakarta font-semibold text-sm leading-snug line-clamp-2">
                      {opp.title}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-app-border mt-auto">
                      <span className={`text-[10px] font-jakarta font-semibold ${
                        !daysLeft ? 'text-app-text-faint' :
                        daysLeft < 0 ? 'text-app-red' :
                        daysLeft <= 7 ? 'text-app-orange' : 'text-app-text-dim'
                      }`}>
                        {!daysLeft ? 'Open' : daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today!' : `${daysLeft}d left`}
                      </span>
                      {opp.link ? (
                        <a
                          href={opp.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-jakarta font-bold px-2.5 py-1 rounded-lg"
                          style={{ background: cat.bg, color: cat.color }}
                        >
                          Apply →
                        </a>
                      ) : (
                        <button
                          onClick={() => navigate(`/space/${currentSpace.id}`)}
                          className="text-[11px] font-jakarta font-bold px-2.5 py-1 rounded-lg bg-app-surface-2 text-app-text-dim"
                        >
                          View →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Desktop two-column layout */}
      <div className="lg:grid lg:grid-cols-[1fr_1.5fr] lg:gap-8 lg:items-start">

        {/* Left column — stats + space card */}
        <div>
          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 gap-3 mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            {STAT_CARDS.map((card, i) => (
              <div
                key={i}
                className={`rounded-2xl p-4 border flex flex-col ${
                  card.accent ? 'border-app-accent' : 'bg-app-surface border-app-border'
                }`}
                style={card.accent ? { background: 'var(--app-accent)', borderColor: 'var(--app-accent)' } : {}}
              >
                <span className="text-2xl mb-1">{card.icon}</span>
                <p className="font-jakarta font-extrabold text-2xl" style={card.accent ? { color: 'var(--app-on-accent)' } : {}}>
                  <span className={card.accent ? '' : 'text-app-text'}>{card.value}</span>
                </p>
                <p className="text-[11px] font-inter" style={card.accent ? { color: 'var(--app-on-accent)', opacity: 0.75 } : {}}>
                  <span className={card.accent ? '' : 'text-app-text-dim'}>{card.label}</span>
                </p>
              </div>
            ))}
          </motion.div>

          {/* My Space Card */}
          <motion.button
            onClick={() => navigate(`/space/${currentSpace.id}`)}
            className="w-full bg-app-surface rounded-2xl border border-app-border text-left mb-5 active:scale-[0.99] transition-all duration-200 relative overflow-hidden"
            style={{ padding: '18px' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'var(--app-accent)' }} />
            <div className="flex items-center gap-4 pl-3 mb-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--app-accent) 10%, transparent)' }}>
                🏛️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-app-text font-jakarta font-extrabold text-base leading-tight">{currentSpace.name}</p>
                <p className="text-app-text-dim text-xs font-inter mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-app-green inline-block" />
                  Class Rep: {currentSpace.rep || user?.name?.split(' ')[0] || 'You'}
                </p>
              </div>
              <span className="text-app-accent text-sm font-jakarta font-semibold flex-shrink-0">View →</span>
            </div>
            <div className="flex gap-2 pl-3 flex-wrap">
              <span className="text-[11px] bg-app-accent/10 text-app-accent font-jakarta font-semibold px-2.5 py-1 rounded-full">{courseList.length} courses</span>
              <span className="text-[11px] bg-app-surface-2 text-app-text-dim font-jakarta font-semibold px-2.5 py-1 rounded-full">{currentSpace.level}</span>
              <span className="text-[11px] bg-app-surface-2 text-app-text-dim font-jakarta font-semibold px-2.5 py-1 rounded-full">
                Code: <span className="text-app-accent">{currentSpace.invite_code}</span>
              </span>
            </div>
          </motion.button>

          {/* Urgent alerts */}
          {urgentCount > 0 && (
            <motion.div
              className="mb-5 bg-app-red/10 border border-app-red/30 rounded-2xl p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🔴</span>
                <p className="text-app-red font-jakarta font-bold text-sm uppercase tracking-wide">
                  {urgentCount} Urgent {urgentCount === 1 ? 'Alert' : 'Alerts'}
                </p>
              </div>
              {announcements.filter(a => a.urgent).slice(0, 3).map(ann => (
                <button
                  key={ann.id}
                  onClick={() => navigate(`/space/${currentSpace.id}`)}
                  className="w-full text-left mb-1 last:mb-0"
                >
                  <p className="text-app-text text-sm font-inter truncate">• {ann.title}</p>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right column — Recent Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-app-text font-jakarta font-semibold text-sm lg:text-base">Recent Announcements</h2>
            <button
              onClick={() => navigate(`/space/${currentSpace.id}`)}
              className="text-app-accent text-xs font-jakarta font-semibold hover:opacity-80 transition-opacity"
            >
              See all →
            </button>
          </div>
          {announcements.length === 0 ? (
            <div className="bg-app-surface rounded-2xl p-6 border border-app-border text-center">
              <p className="text-app-text-dim text-sm font-inter">No announcements yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {announcements.slice(0, 8).map((ann) => {
                const isExpanded = expandedId === ann.id;
                return (
                  <div
                    key={ann.id}
                    className={`bg-app-surface rounded-xl border text-left transition-all duration-200 relative overflow-hidden ${
                      ann.urgent ? 'border-app-red/40' : ann.pinned ? 'border-app-accent/30' : 'border-app-border'
                    }`}
                  >
                    {ann.urgent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-app-red" />}
                    {ann.pinned && !ann.urgent && <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'var(--app-accent)' }} />}
                    <div className={`p-3.5 ${ann.urgent || ann.pinned ? 'pl-4' : ''}`}>
                      <div className="flex items-start gap-2 mb-1 flex-wrap">
                        {ann.urgent && <Badge variant="urgent">Urgent</Badge>}
                        {ann.pinned && !ann.urgent && <Badge variant="pin">Pinned</Badge>}
                        {ann.course_code && (
                          <span className="text-[10px] bg-app-accent2/10 text-app-accent2 font-jakarta font-semibold px-1.5 py-0.5 rounded">{ann.course_code}</span>
                        )}
                        <span className={`ml-auto text-[10px] font-jakarta px-1.5 py-0.5 rounded capitalize ${
                          ann.type === 'assignment' ? 'bg-app-orange/10 text-app-orange' :
                          ann.type === 'test' ? 'bg-app-red/10 text-app-red' :
                          ann.type === 'meeting' ? 'bg-app-accent2/10 text-app-accent2' :
                          'bg-app-surface-2 text-app-text-faint'
                        }`}>{ann.type}</span>
                      </div>
                      <p className="text-app-text font-inter text-sm font-medium leading-snug">{ann.title}</p>

                      {/* Expanded body */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <p className="text-app-text-dim text-xs font-inter leading-relaxed mt-2">{ann.body}</p>
                            {ann.deadline && (
                              <div className="flex items-center gap-1.5 mt-2 text-[11px] font-inter text-app-orange">
                                <span>⏰</span><span>Due: {ann.deadline.split('T')[0]}</span>
                              </div>
                            )}
                            {ann.venue && (
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-inter text-app-text-dim">
                                <span>📍</span><span>{ann.venue}</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Footer row: author + View button */}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-app-text-dim text-xs font-inter">{ann.author_name} · {ann.created_at?.split('T')[0]}</p>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-jakarta font-semibold border transition-all duration-200 ${
                            isExpanded
                              ? 'bg-app-accent/10 border-app-accent/30 text-app-accent'
                              : 'bg-app-surface-2 border-app-border text-app-text-dim hover:border-app-accent/30 hover:text-app-text'
                          }`}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {isExpanded
                              ? <><path d="M17 11l-5-5-5 5"/><path d="M12 6v12"/></>
                              : <><circle cx="12" cy="12" r="3"/><path d="M2 12C4.5 6 8.5 3 12 3s7.5 3 10 9c-2.5 6-6.5 9-10 9s-7.5-3-10-9z"/></>
                            }
                          </svg>
                          {isExpanded ? 'Less' : 'View'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { Badge } from '../components/ui/Shared';

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
    }
  }, [currentSpace]);

  const courseList = courses ?? [];
  const courseCount = courseList.length;
  const urgentCount = announcements.filter(a => a.urgent).length;
  const pinnedCount = announcements.filter(a => a.pinned).length;
  const loading = (!currentSpace && !!localStorage.getItem('spaceId')) || spaceLoading;

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Skeleton className="h-24 rounded-2xl" />
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
              <button onClick={() => navigate('/setup')} className="bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl px-6 py-3">
                Create Space
              </button>
              <button onClick={() => navigate('/join')} className="bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-xl px-6 py-3">
                Join
              </button>
            </div>
          }
        />
      </div>
    );
  }

  const STAT_CARDS = [
    {
      icon: '📢',
      value: announcements.length,
      label: 'Announcements',
      accent: true,
    },
    {
      icon: '📚',
      value: courseCount,
      label: 'Courses',
      accent: false,
    },
    {
      icon: '🔴',
      value: urgentCount,
      label: 'Urgent',
      accent: false,
      highlight: urgentCount > 0,
    },
  ];

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Greeting */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-app-text font-syne font-bold text-xl">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-app-text-dim text-sm font-dm mt-0.5">{currentSpace.dept} · {currentSpace.uni.split('(')[1]?.replace(')', '') || currentSpace.uni}</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-3 gap-3 mb-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        {STAT_CARDS.map((card, i) => (
          <div
            key={i}
            className={`rounded-2xl p-4 border flex flex-col ${
              card.accent
                ? 'border-app-accent'
                : card.highlight
                ? 'bg-app-red/10 border-app-red/30'
                : 'bg-app-surface border-app-border'
            }`}
            style={card.accent ? { background: '#e8ff47', borderColor: '#e8ff47' } : {}}
          >
            <span className="text-2xl mb-1">{card.icon}</span>
            <p
              className="font-syne font-extrabold text-2xl"
              style={card.accent ? { color: '#0f0f11' } : {}}
            >
              <span className={card.highlight ? 'text-app-red' : card.accent ? '' : 'text-app-text'}>{card.value}</span>
            </p>
            <p
              className="text-[11px] font-dm"
              style={card.accent ? { color: '#3a3a1a' } : {}}
            >
              <span className={card.highlight ? 'text-app-red/80' : card.accent ? '' : 'text-app-text-dim'}>{card.label}</span>
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
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: '#e8ff47' }} />
        <div className="flex items-center gap-4 pl-3 mb-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(232,255,71,0.10)' }}>
            🏛️
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-app-text font-syne font-extrabold text-base leading-tight">{currentSpace.name}</p>
            <p className="text-app-text-dim text-xs font-dm mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-app-green inline-block" />
              Class Rep: {currentSpace.rep || user?.name?.split(' ')[0] || 'You'}
            </p>
          </div>
          <span className="text-app-accent text-sm font-syne font-semibold flex-shrink-0">View →</span>
        </div>
        <div className="flex gap-2 pl-3 flex-wrap">
          <span className="text-[11px] bg-app-accent/10 text-app-accent font-syne font-semibold px-2.5 py-1 rounded-full">{courseList.length} courses</span>
          <span className="text-[11px] bg-app-surface-2 text-app-text-dim font-syne font-semibold px-2.5 py-1 rounded-full">{currentSpace.level}</span>
          <span className="text-[11px] bg-app-surface-2 text-app-text-dim font-syne font-semibold px-2.5 py-1 rounded-full">
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
            <p className="text-app-red font-syne font-bold text-sm uppercase tracking-wide">
              {urgentCount} Urgent {urgentCount === 1 ? 'Alert' : 'Alerts'}
            </p>
          </div>
          {announcements.filter(a => a.urgent).slice(0, 2).map(ann => (
            <button
              key={ann.id}
              onClick={() => navigate(`/space/${currentSpace.id}`)}
              className="w-full text-left mb-1 last:mb-0"
            >
              <p className="text-app-text text-sm font-dm truncate">• {ann.title}</p>
            </button>
          ))}
        </motion.div>
      )}

      {/* Recent Announcements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-app-text font-syne font-semibold text-sm">Recent Announcements</h2>
          <button
            onClick={() => navigate(`/space/${currentSpace.id}`)}
            className="text-app-accent text-xs font-syne font-semibold"
          >
            See all →
          </button>
        </div>
        {announcements.length === 0 ? (
          <div className="bg-app-surface rounded-2xl p-6 border border-app-border text-center">
            <p className="text-app-text-dim text-sm font-dm">No announcements yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {announcements.slice(0, 5).map((ann) => (
              <button
                key={ann.id}
                onClick={() => navigate(`/space/${currentSpace.id}`)}
                className="w-full bg-app-surface rounded-xl p-3.5 border border-app-border text-left active:scale-[0.99] transition-all duration-200 relative overflow-hidden"
              >
                {ann.urgent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-app-red" />}
                {ann.pinned && !ann.urgent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-app-accent" />}
                <div className={`${ann.urgent || ann.pinned ? 'pl-3' : ''}`}>
                  <div className="flex items-start gap-2 mb-1 flex-wrap">
                    {ann.urgent && <Badge variant="urgent">Urgent</Badge>}
                    {ann.pinned && !ann.urgent && <Badge variant="pin">Pinned</Badge>}
                    {ann.course_code && (
                      <span className="text-[10px] bg-app-accent2/10 text-app-accent2 font-syne font-semibold px-1.5 py-0.5 rounded">{ann.course_code}</span>
                    )}
                    <span className={`ml-auto text-[10px] font-syne px-1.5 py-0.5 rounded capitalize ${
                      ann.type === 'assignment' ? 'bg-app-orange/10 text-app-orange' :
                      ann.type === 'test' ? 'bg-app-red/10 text-app-red' :
                      ann.type === 'meeting' ? 'bg-app-accent2/10 text-app-accent2' :
                      'bg-app-surface-2 text-app-text-faint'
                    }`}>{ann.type}</span>
                  </div>
                  <p className="text-app-text font-dm text-sm font-medium leading-snug line-clamp-1">{ann.title}</p>
                  <p className="text-app-text-dim text-xs font-dm mt-0.5">{ann.author_name} · {ann.created_at?.split('T')[0]}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

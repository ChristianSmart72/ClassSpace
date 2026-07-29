import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { useBadgeStore } from '../store/badgeStore';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { Logo } from '../components/ui/Logo';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { getTimetable } from '../api/timetable';
import { getOpportunities } from '../api/opportunities';
import { COURSE_COLORS } from '../types';
import type { TimetableEntry, Opportunity, Announcement } from '../types';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function getTodayIndex(): number {
  const d = new Date().getDay();
  return d === 0 || d === 6 ? -1 : d - 1;
}

function getTodayName(): string {
  return WEEKDAYS[getTodayIndex()] || '';
}

function getTomorrowName(): string {
  const today = new Date().getDay();
  if (today === 0 || today === 6) return 'Monday';
  const idx = today - 1;
  return WEEKDAYS[(idx + 1) % 5];
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${m.toString().padStart(2, '0')}${period}`;
}

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
  const dayOfWeek = d.getDay();
  if (diffDays < 7) return dayNames[dayOfWeek];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function getClassesToday(entries: TimetableEntry[]): TimetableEntry[] {
  const today = getTodayName();
  if (!today) return [];
  return entries.filter(e => e.day === today);
}

function getInProgressClass(entries: TimetableEntry[]): TimetableEntry | null {
  const today = getTodayName();
  if (!today) return null;
  const now = nowMinutes();
  return entries.find(e => e.day === today && timeToMinutes(e.start_time) <= now && timeToMinutes(e.end_time) > now) ?? null;
}

function getNextUpcomingClass(entries: TimetableEntry[]): TimetableEntry | null {
  const today = getTodayName();
  if (!today) return null;
  const now = nowMinutes();
  const upcoming = entries
    .filter(e => e.day === today && timeToMinutes(e.start_time) > now)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  return upcoming[0] ?? null;
}

function getTomorrowFirstClass(entries: TimetableEntry[]): TimetableEntry | null {
  const tomorrow = getTomorrowName();
  if (!tomorrow) return null;
  const tomorrowEntries = entries.filter(e => e.day === tomorrow);
  if (tomorrowEntries.length === 0) return null;
  tomorrowEntries.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  return tomorrowEntries[0];
}

function getDueItems(announcements: Announcement[]): Announcement[] {
  return announcements
    .filter(a => (a.type === 'assignment' || a.type === 'test') && a.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);
}

function getActiveOpps(opps: Opportunity[]): Opportunity[] {
  return opps.filter(o => !o.deadline || new Date(o.deadline).getTime() > Date.now());
}

function getOppStatus(opp: Opportunity): { label: string; color: string } {
  if (!opp.deadline) return { label: 'Open', color: 'text-app-text-faint' };
  const diff = new Date(opp.deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (diff <= 0) return { label: 'Expired', color: 'text-app-text-faint' };
  const createdAgo = Date.now() - new Date(opp.created_at).getTime();
  if (createdAgo < 86400000) return { label: 'New', color: 'text-app-green' };
  if (days === 0) return { label: 'Closing Today', color: 'text-app-red' };
  if (days <= 3) return { label: 'Closing Soon', color: 'text-app-orange' };
  if (days <= 7) return { label: `${days} Days Left`, color: 'text-app-orange' };
  return { label: `${days} Days Left`, color: 'text-app-text-dim' };
}

const OPP_CAT_STYLE: Record<string, { color: string; label: string }> = {
  scholarship:  { color: '#3b82f6', label: 'Scholarship' },
  internship:   { color: '#22c55e', label: 'Internship' },
  competition:  { color: '#8b5cf6', label: 'Competition' },
  seminar:      { color: '#f59e0b', label: 'Seminar' },
  job:          { color: '#ef4444', label: 'Job' },
  event:        { color: '#06b6d4', label: 'Event' },
};

function DeadlineBadge({ deadline }: { deadline: string }) {
  const [display, setDisplay] = useState('');
  const [level, setLevel] = useState<'ok' | 'warn' | 'critical'>('ok');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setDisplay('Overdue'); setLevel('critical'); return; }
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(hours / 24);
      if (days > 1) { setDisplay(`${days}d`); setLevel('ok'); }
      else if (hours >= 1) { setDisplay(`${hours}h`); setLevel(hours < 6 ? 'warn' : 'ok'); }
      else { setDisplay('Due soon'); setLevel('critical'); }
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [deadline]);
  const cls = {
    ok: 'text-app-green',
    warn: 'text-app-orange',
    critical: 'text-app-red',
  }[level];
  const bgCls = {
    ok: 'bg-app-green/10',
    warn: 'bg-app-orange/10',
    critical: 'bg-app-red/10',
  }[level];
  return <span className={`text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded ${bgCls} ${cls}`}>{display}</span>;
}

function LiveCountdown({ startTime, endTime }: { startTime: string; endTime: string }) {
  const [label, setLabel] = useState('');
  const [mode, setMode] = useState<'before' | 'during' | 'after'>('before');
  useEffect(() => {
    const calc = () => {
      const now = nowMinutes();
      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);
      if (now < start) {
        const diff = start - now;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        setLabel(h > 0 ? `${h}h ${m}m` : `${m}m`);
        setMode('before');
      } else if (now < end) {
        const diff = end - now;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        setLabel(h > 0 ? `${h}h ${m}m left` : `${m}m left`);
        setMode('during');
      } else {
        setLabel('Ended');
        setMode('after');
      }
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [startTime, endTime]);
  if (mode === 'before') return <span className="text-app-accent text-[10px] font-jakarta font-bold">Starts in {label}</span>;
  if (mode === 'during') return <span className="text-app-green text-[10px] font-jakarta font-bold">{label} · In Progress</span>;
  return null;
}

function NextClassSection({ timetable, ttLoading, spaceId, navigate }: { timetable: TimetableEntry[]; ttLoading: boolean; spaceId: string; navigate: ReturnType<typeof useNavigate> }) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceUpdate(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  if (ttLoading) {
    return (
      <div className="mb-5">
        <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1.5">Next class</p>
        <Skeleton className="h-[68px] rounded-xl" />
      </div>
    );
  }

  const inProgress = getInProgressClass(timetable);
  const upcoming = getNextUpcomingClass(timetable);
  const tomorrowFirst = getTomorrowFirstClass(timetable);
  if (inProgress) {
    return (
      <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '0.04s' }}>
        <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1.5">Current class</p>
        <button
          onClick={() => navigate(`/space/${spaceId}?tab=schedule`)}
          className="w-full bg-app-surface rounded-xl border border-app-border p-4 text-left active:scale-[0.99] transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${COURSE_COLORS[inProgress.color_index % 5]}18` }}>
              {inProgress.course_icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-app-text font-jakarta font-semibold text-sm leading-tight">{inProgress.course_name}</p>
                <span className="text-app-text-faint text-[10px] font-jakarta font-medium">{inProgress.course_code}</span>
              </div>
              <p className="text-app-text-dim text-xs font-inter mt-0.5">
                {formatTime(inProgress.start_time)} – {formatTime(inProgress.end_time)}
                {inProgress.venue && ` · ${inProgress.venue}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <LiveCountdown startTime={inProgress.start_time} endTime={inProgress.end_time} />
            </div>
          </div>
        </button>
      </div>
    );
  }

  if (upcoming) {
    return (
      <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '0.04s' }}>
        <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1.5">Next class</p>
        <button
          onClick={() => navigate(`/space/${spaceId}?tab=schedule`)}
          className="w-full bg-app-surface rounded-xl border border-app-border p-4 text-left active:scale-[0.99] transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${COURSE_COLORS[upcoming.color_index % 5]}18` }}>
              {upcoming.course_icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-app-text font-jakarta font-semibold text-sm leading-tight">{upcoming.course_name}</p>
                <span className="text-app-text-faint text-[10px] font-jakarta font-medium">{upcoming.course_code}</span>
              </div>
              <p className="text-app-text-dim text-xs font-inter mt-0.5">
                {formatTime(upcoming.start_time)} – {formatTime(upcoming.end_time)}
                {upcoming.venue && ` · ${upcoming.venue}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <LiveCountdown startTime={upcoming.start_time} endTime={upcoming.end_time} />
              <span className="text-app-text-faint text-[11px] group-hover:text-app-accent transition-colors">→</span>
            </div>
          </div>
        </button>
      </div>
    );
  }

  if (tomorrowFirst) {
    return (
      <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '0.04s' }}>
        <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1.5">Next class</p>
        <div className="bg-app-surface rounded-xl border border-app-border p-4">
          <p className="text-app-green text-sm font-jakarta font-semibold mb-2">🎉 You're done with classes today.</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${COURSE_COLORS[tomorrowFirst.color_index % 5]}18` }}>
              {tomorrowFirst.course_icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-app-text font-jakarta font-semibold text-sm leading-tight">{tomorrowFirst.course_name}</p>
                <span className="text-app-text-faint text-[10px] font-jakarta font-medium">{tomorrowFirst.course_code}</span>
              </div>
              <p className="text-app-text-dim text-xs font-inter mt-0.5">
                {formatTime(tomorrowFirst.start_time)} – {formatTime(tomorrowFirst.end_time)}
                {tomorrowFirst.venue && ` · ${tomorrowFirst.venue}`}
                <span className="ml-1.5 text-app-text-faint">Tomorrow</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '0.04s' }}>
      <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1.5">Next class</p>
      <div className="bg-app-surface rounded-xl border border-app-border p-4">
        <p className="text-app-text-dim text-sm font-inter">🎉 No classes scheduled. Enjoy your day!</p>
      </div>
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentSpace, memberRole, loading: spaceLoading } = useSpaceStore();
  const { announcements, fetchAnnouncements } = useContentStore();
  const [greeting, setGreeting] = useState('');
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [ttLoading, setTtLoading] = useState(false);
  const { isInstallable, install, dismiss } = useInstallPrompt();
  const setBadge = useBadgeStore((s) => s.setBadge);
  const [opps, setOpps] = useState<Opportunity[]>([]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    if (currentSpace) {
      fetchAnnouncements(currentSpace.id);
      setTtLoading(true);
      getTimetable(currentSpace.id)
        .then(data => setTimetable(data || []))
        .catch(() => setTimetable([]))
        .finally(() => setTtLoading(false));
      getOpportunities(currentSpace.id)
        .then(data => setOpps(data ?? []))
        .catch(() => setOpps([]))
    }
  }, [currentSpace]);

  const loading = (!currentSpace && !!(
    () => { try { return localStorage.getItem('spaceId') } catch { return null } }
  )()) || spaceLoading;

  const todayClasses = getClassesToday(timetable);
  const dueItems = getDueItems(announcements);
  const recentAnnouncements = announcements.slice(0, 3);
  const displayOpp = getActiveOpps(opps)[0] ?? null;
  const newAnnounceCount = announcements.filter(
    a => new Date(a.created_at).getTime() > Date.now() - 86400000 * 2
  ).length;

  const isRep = memberRole === 'rep';

  const quickActions = isRep
    ? [
        { label: 'Announce', icon: '📢', onClick: () => navigate(`/space/${currentSpace!.id}`) },
        { label: 'Upload', icon: '📁', onClick: () => navigate(`/space/${currentSpace!.id}`) },
        { label: 'Timetable', icon: '📅', onClick: () => navigate(`/space/${currentSpace!.id}?tab=schedule`) },
        { label: 'Share', icon: '🔗', onClick: () => {
          const url = `https://classspace.app/join/${currentSpace!.invite_code}`;
          if (navigator.share) navigator.share({ url });
          else navigator.clipboard.writeText(url);
        }},
      ]
    : [
        { label: 'Timetable', icon: '📅', onClick: () => navigate(`/space/${currentSpace!.id}?tab=schedule`) },
        { label: 'Files', icon: '📁', onClick: () => navigate(`/space/${currentSpace!.id}`) },
        { label: 'Opps', icon: '🎯', onClick: () => navigate(`/space/${currentSpace!.id}`) },
        { label: 'Search', icon: '🔍', onClick: () => navigate(`/space/${currentSpace!.id}`) },
      ];

  const isAllClear = todayClasses.length === 0 && dueItems.length === 0 && newAnnounceCount === 0;

  useEffect(() => {
    if (newAnnounceCount > 0) setBadge(newAnnounceCount);
  }, [newAnnounceCount]);

  if (loading) {
    return (
      <div className="px-4 pt-6 lg:px-8 lg:pt-8 max-w-2xl mx-auto">
        <Skeleton className="h-6 w-36 mb-1" />
        <Skeleton className="h-4 w-56 mb-4" />
        <Skeleton className="h-20 rounded-xl mb-4" />
        <Skeleton className="h-16 rounded-xl mb-4" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl mb-2" />)}
      </div>
    );
  }

  if (!currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6">
        <EmptyState
          icon={<Logo width={36} height={36} className="text-app-text-dim" />}
          title="No space yet"
          subtitle="Create or join a space to get started"
          action={
            <div className="flex gap-3">
              <button onClick={() => navigate('/setup')} className="bg-app-accent text-app-on-accent font-jakarta font-bold text-sm rounded-xl px-6 py-3">
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

  const firstLectureStart = (() => {
    const ip = getInProgressClass(timetable);
    if (ip) return null;
    const uc = getNextUpcomingClass(timetable);
    if (!uc) return null;
    const now = nowMinutes();
    const start = timeToMinutes(uc.start_time);
    const diff = start - now;
    if (diff <= 0) return null;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  })();

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8 max-w-2xl mx-auto">

      {/* ── Daily Brief ─────────────────────────────────────────────────── */}
      <div className="mb-6 animate-fadeIn">
        <h1 className="text-app-text font-jakarta font-bold text-xl lg:text-2xl tracking-tight">
          Today's Brief
        </h1>
        <p className="text-app-text-dim text-sm font-inter mt-0.5">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </p>
        <p className="text-app-text-faint text-[11px] font-jakarta font-semibold mt-3 mb-1.5">
          Today at a glance
        </p>
        <div className="space-y-1">
          {isAllClear ? (
            <p className="text-app-green text-sm font-jakarta font-semibold">You're all caught up today.</p>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {todayClasses.length > 0 && (
                <p className="text-app-text text-sm font-inter">
                  📚 <span className="font-jakarta font-semibold">{todayClasses.length}</span> class{todayClasses.length > 1 ? 'es' : ''} today
                </p>
              )}
              {dueItems.length > 0 && (
                <p className="text-app-text text-sm font-inter">
                  📝 <span className="font-jakarta font-semibold">{dueItems.length}</span> due
                </p>
              )}
              {newAnnounceCount > 0 && (
                <p className="text-app-text text-sm font-inter">
                  📢 <span className="font-jakarta font-semibold">{newAnnounceCount}</span> unread
                </p>
              )}
              {firstLectureStart && (
                <p className="text-app-text-dim text-sm font-inter">
                  ⏰ First lecture in <span className="font-jakarta font-semibold text-app-accent">{firstLectureStart}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Next Class ──────────────────────────────────────────────────── */}
      <NextClassSection
        timetable={timetable}
        ttLoading={ttLoading}
        spaceId={currentSpace.id}
        navigate={navigate}
      />

      {/* ── Due Today ───────────────────────────────────────────────────── */}
      {dueItems.length > 0 && (
        <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '0.07s' }}>
          <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1.5">
            Due {dueItems.length === 1 ? 'today' : 'soon'}
          </p>
          <div className="flex flex-col gap-1.5">
            {dueItems.slice(0, 3).map(item => {
              const isOverdue = item.deadline && new Date(item.deadline).getTime() < Date.now();
              const isToday = item.deadline && new Date(item.deadline).toDateString() === new Date().toDateString();
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-app-surface rounded-xl border border-app-border px-4 py-3"
                >
                  <span className={`text-[10px] font-jakarta font-bold px-1.5 py-0.5 rounded capitalize flex-shrink-0 ${
                    item.type === 'assignment' ? 'bg-app-orange/10 text-app-orange' : 'bg-app-red/10 text-app-red'
                  }`}>
                    {item.type === 'assignment' ? 'HW' : 'TST'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-app-text text-sm font-inter font-medium leading-snug truncate">{item.title}</p>
                    {item.course_code && (
                      <p className="text-app-text-dim text-[11px] font-inter">{item.course_code}</p>
                    )}
                  </div>
                  {item.deadline && (
                    isOverdue
                      ? <span className="text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded bg-app-red/10 text-app-red">Overdue</span>
                      : isToday
                        ? <span className="text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded bg-app-orange/10 text-app-orange">Today</span>
                        : <DeadlineBadge deadline={item.deadline} />
                  )}
                </div>
              );
            })}
            {dueItems.length > 3 && (
              <button
                onClick={() => navigate(`/space/${currentSpace.id}`)}
                className="text-app-accent text-xs font-jakarta font-semibold text-center py-1"
              >
                +{dueItems.length - 3} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Install prompt ──────────────────────────────────────────────── */}
      {isInstallable && (
        <div className="mb-5 animate-fadeIn bg-app-surface rounded-xl border border-app-border p-3 flex items-center gap-3">
          <span className="text-xl">📱</span>
          <div className="flex-1 min-w-0">
            <p className="text-app-text font-jakarta font-semibold text-sm">Install ClassSpace</p>
            <p className="text-app-text-dim text-xs font-inter">Add to home screen for quick access</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={install} className="bg-app-accent text-white text-xs font-jakarta font-bold px-3 py-1.5 rounded-lg">Install</button>
            <button onClick={dismiss} className="text-app-text-dim text-xs font-jakarta font-semibold px-2 py-1.5">Later</button>
          </div>
        </div>
      )}

      {/* ── Desktop 2-col ───────────────────────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[1fr_1.25fr] lg:gap-6 lg:items-start">

        {/* ── Quick Actions ──────────────────────────────────────────── */}
        <div className="mb-5 lg:mb-0 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-2">Quick actions</p>
          <div className="grid grid-cols-4 gap-1.5">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center gap-0.5 bg-app-surface rounded-xl border border-app-border py-2 active:scale-95 transition-all duration-200"
              >
                <span className="text-sm">{action.icon}</span>
                <span className="text-[8px] font-jakarta font-semibold text-app-text-dim">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Recent Announcements ────────────────────────────────────── */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider">Announcements</p>
            <button
              onClick={() => navigate(`/space/${currentSpace.id}`)}
              className="text-app-accent text-[10px] font-jakarta font-semibold hover:opacity-80 transition-opacity"
            >
              View all →
            </button>
          </div>
          {recentAnnouncements.length === 0 ? (
            <div className="bg-app-surface rounded-xl border border-app-border p-4 text-center">
              <p className="text-app-text-dim text-xs font-inter">No announcements yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recentAnnouncements.map((ann) => (
                <button
                  key={ann.id}
                  onClick={() => navigate(`/space/${currentSpace.id}/announcement/${ann.id}`)}
                  className="bg-app-surface rounded-xl border border-app-border px-4 py-3 text-left active:scale-[0.99] transition-all duration-200"
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded capitalize flex-shrink-0 mt-0.5 ${
                      ann.type === 'assignment' ? 'bg-app-orange/10 text-app-orange' :
                      ann.type === 'test' ? 'bg-app-red/10 text-app-red' :
                      ann.type === 'meeting' ? 'bg-app-accent2/10 text-app-accent2' :
                      'bg-app-surface-2 text-app-text-faint'
                    }`}>
                      {ann.type === 'announcement' ? 'Info' : ann.type === 'assignment' ? 'HW' : ann.type === 'test' ? 'TST' : ann.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {ann.urgent && <span className="w-1.5 h-1.5 rounded-full bg-app-red flex-shrink-0" />}
                        <span className="text-app-text text-sm font-inter font-medium leading-snug truncate">{ann.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ann.course_code && <span className="text-app-text-dim text-[11px] font-inter">{ann.course_code}</span>}
                        <span className="text-app-text-faint text-[10px] font-inter">
                          {ann.created_at ? formatRelativeTime(ann.created_at) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Featured Opportunity ──────────────────────────────────────── */}
      {displayOpp && (
        <div className="mt-5 animate-fadeInUp" style={{ animationDelay: '0.14s' }}>
          <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-2">Featured opportunity</p>
          <FeaturedOppCard opp={displayOpp} spaceId={currentSpace.id} navigate={navigate} />
          <button
            onClick={() => navigate(`/space/${currentSpace.id}/opportunities`)}
            className="text-app-accent text-xs font-jakarta font-semibold mt-2 hover:opacity-80 transition-opacity"
          >
            View all opportunities →
          </button>
        </div>
      )}

    </div>
  );
}

function FeaturedOppCard({ opp, spaceId, navigate }: { opp: Opportunity; spaceId: string; navigate: ReturnType<typeof useNavigate> }) {
  const cat = OPP_CAT_STYLE[opp.category] ?? { color: '#5a5a6a', label: opp.category };
  const status = getOppStatus(opp);

  return (
    <div className="bg-app-surface rounded-xl border border-app-border overflow-hidden" style={{ borderLeft: `3px solid ${cat.color}` }}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-jakarta font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${cat.color}18`, color: cat.color }}>
              {cat.label}
            </span>
            <p className="text-app-text font-jakarta font-semibold text-xs leading-snug mt-1.5">{opp.title}</p>
            <p className="text-app-text-dim text-[11px] font-inter mt-0.5 line-clamp-1">{opp.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-app-border">
          <span className={`text-[10px] font-jakarta font-semibold ${status.color}`}>{status.label}</span>
          {opp.link ? (
            <a
              href={opp.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-jakarta font-bold px-2.5 py-1 rounded-lg"
              style={{ background: `${cat.color}18`, color: cat.color }}
            >
              Apply →
            </a>
          ) : (
            <button
              onClick={() => navigate(`/space/${spaceId}`)}
              className="text-[11px] font-jakarta font-bold px-2.5 py-1 rounded-lg bg-app-surface-2 text-app-text-dim"
            >
              View →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
import { DAYS, COURSE_COLORS } from '../types';
import type { TimetableEntry, Opportunity, Announcement } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayIndex(): number {
  const d = new Date().getDay();
  return d === 0 || d === 6 ? -1 : d - 1;
}

function getTodayDayName(): string {
  return DAYS[getTodayIndex()] || '';
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${m.toString().padStart(2, '0')}${period}`;
}

function getNextClass(entries: TimetableEntry[]): TimetableEntry | null {
  const todayIdx = getTodayIndex();
  if (todayIdx === -1) return null;
  const todayName = DAYS[todayIdx];
  const todayEntries = entries.filter(e => e.day === todayName);
  const nowMins = timeToMinutes(`${new Date().getHours()}:${new Date().getMinutes()}`);
  const upcoming = todayEntries.filter(e => timeToMinutes(e.start_time) > nowMins);
  if (upcoming.length > 0) {
    upcoming.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    return upcoming[0];
  }
  return null;
}

function getClassesToday(entries: TimetableEntry[]): TimetableEntry[] {
  const todayName = getTodayDayName();
  if (!todayName) return [];
  return entries.filter(e => e.day === todayName);
}

function getDueItems(announcements: Announcement[]): Announcement[] {
  return announcements
    .filter(a => (a.type === 'assignment' || a.type === 'test') && a.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);
}

const DEMO_OPPS: Opportunity[] = [
  { id: -1, space_id: '', author_id: 0, author_name: 'ClassSpace', title: 'Shell Nigeria STEM Scholarship 2025', description: 'Open to 300L and 400L engineering students with a minimum CGPA of 3.5.', category: 'scholarship', link: 'https://shell.com/scholarship', deadline: '2025-08-31', created_at: new Date().toISOString() },
  { id: -2, space_id: '', author_id: 0, author_name: 'ClassSpace', title: 'MTN Foundation Summer Internship', description: 'Paid 3-month internship for penultimate year students.', category: 'internship', link: 'https://mtn.com/internship', deadline: '2025-07-15', created_at: new Date().toISOString() },
  { id: -3, space_id: '', author_id: 0, author_name: 'ClassSpace', title: 'IEEE Nigeria Student Competition', description: 'Submit your FYP abstract. Win ₦500,000 and IEEE membership.', category: 'competition', link: 'https://ieee.org/nigeria', deadline: '2025-09-10', created_at: new Date().toISOString() },
];

const OPP_CAT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  scholarship:  { bg: '#3b82f615', color: '#3b82f6', label: 'Scholarship' },
  internship:   { bg: '#22c55e15', color: '#22c55e', label: 'Internship' },
  competition:  { bg: '#8b5cf615', color: '#8b5cf6', label: 'Competition' },
  seminar:      { bg: '#f59e0b15', color: '#f59e0b', label: 'Seminar' },
  job:          { bg: '#ef444415', color: '#ef4444', label: 'Job' },
  event:        { bg: '#06b6d415', color: '#06b6d4', label: 'Event' },
};

// ─── Deadline Countdown ────────────────────────────────────────────────────

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
    ok: 'text-app-green bg-app-green/10',
    warn: 'text-app-orange bg-app-orange/10',
    critical: 'text-app-red bg-app-red/10',
  }[level];
  return <span className={`text-[10px] font-jakarta font-semibold px-1.5 py-0.5 rounded ${cls}`}>{display}</span>;
}

// ─── Next Class Countdown ──────────────────────────────────────────────────

function ClassCountdown({ startTime }: { startTime: string }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const calc = () => {
      const nowMins = timeToMinutes(`${new Date().getHours()}:${new Date().getMinutes()}`);
      const startMins = timeToMinutes(startTime);
      const diff = startMins - nowMins;
      if (diff <= 0) { setLabel('Now'); return; }
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      setLabel(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [startTime]);
  if (!label) return null;
  return <span className="text-app-accent text-[10px] font-jakarta font-bold">in {label}</span>;
}

// ─── Main Home Component ───────────────────────────────────────────────────

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentSpace, courses, loading: spaceLoading } = useSpaceStore();
  const { announcements, fetchAnnouncements } = useContentStore();
  const [greeting, setGreeting] = useState('');
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [ttLoading, setTtLoading] = useState(false);
  const { isInstallable, install, dismiss } = useInstallPrompt();
  const setBadge = useBadgeStore((s) => s.setBadge);
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [oppsLoading, setOppsLoading] = useState(false);

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
      setOppsLoading(true);
      getOpportunities(currentSpace.id)
        .then(data => setOpps(data ?? []))
        .catch(() => setOpps([]))
        .finally(() => setOppsLoading(false));
    }
  }, [currentSpace]);

  const loading = (!currentSpace && !!(
    () => { try { return localStorage.getItem('spaceId') } catch { return null } }
  )()) || spaceLoading;

  const todayClasses = getClassesToday(timetable);
  const nextClass = getNextClass(timetable);
  const dueItems = getDueItems(announcements);
  const recentAnnouncements = announcements.slice(0, 3);
  const displayOpps = (opps.length > 0 ? opps : DEMO_OPPS).slice(0, 3);
  const courseList = courses ?? [];
  const newAnnounceCount = announcements.filter(
    a => new Date(a.created_at).getTime() > Date.now() - 86400000 * 2
  ).length;

  useEffect(() => {
    if (newAnnounceCount > 0) setBadge(newAnnounceCount);
  }, [newAnnounceCount]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-4 pt-6 lg:px-8 lg:pt-8 max-w-2xl mx-auto">
        <Skeleton className="h-7 w-48 mb-1" />
        <Skeleton className="h-4 w-64 mb-6" />
        <Skeleton className="h-24 rounded-xl mb-4" />
        <Skeleton className="h-20 rounded-xl mb-4" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl mb-2" />)}
      </div>
    );
  }

  // ── No space state ─────────────────────────────────────────────────────
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

  return (
    <div className="px-4 pt-5 pb-4 lg:px-8 lg:pt-6 max-w-2xl mx-auto">

      {/* ── Daily Brief ─────────────────────────────────────────────────── */}
      <div className="mb-5 animate-fadeIn">
        <h1 className="text-app-text font-jakarta font-bold text-lg lg:text-xl">
          {greeting}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-app-text-dim text-xs font-inter mt-0.5">
          {currentSpace.name}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] font-jakarta font-semibold">
          {todayClasses.length > 0 && (
            <span className="text-app-accent bg-app-accent/10 px-2 py-0.5 rounded">
              {todayClasses.length} class{todayClasses.length > 1 ? 'es' : ''} today
            </span>
          )}
          {dueItems.length > 0 && (
            <span className="text-app-orange bg-app-orange/10 px-2 py-0.5 rounded">
              {dueItems.length} due
            </span>
          )}
          {newAnnounceCount > 0 && (
            <span className="text-app-green bg-app-green/10 px-2 py-0.5 rounded">
              {newAnnounceCount} new
            </span>
          )}
          <span className="text-app-text-faint">
            {courseList.length} courses
          </span>
        </div>
      </div>

      {/* ── Next Class ──────────────────────────────────────────────────── */}
      {!ttLoading && nextClass && (
        <div className="mb-4 animate-fadeIn" style={{ animationDelay: '0.05s' }}>
          <p className="text-app-text-faint text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1.5">Next class</p>
          <div className="bg-app-surface rounded-xl border border-app-border overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-app-accent" />
            <div className="pl-4 pr-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${COURSE_COLORS[nextClass.color_index % 5]}20` }}>
                  {nextClass.course_icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-app-text font-jakarta font-semibold text-[13px] leading-tight">{nextClass.course_code}</p>
                    <ClassCountdown startTime={nextClass.start_time} />
                  </div>
                  <p className="text-app-text-dim text-[11px] font-inter">
                    {formatTime(nextClass.start_time)} – {formatTime(nextClass.end_time)}
                    {nextClass.venue && ` · ${nextClass.venue}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Due Today ───────────────────────────────────────────────────── */}
      {dueItems.length > 0 && (
        <div className="mb-4 animate-fadeIn" style={{ animationDelay: '0.08s' }}>
          <p className="text-app-text-faint text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1.5">
            Due {dueItems.length === 1 ? 'today' : 'soon'}
          </p>
          <div className="flex flex-col gap-1.5">
            {dueItems.slice(0, 3).map(item => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 bg-app-surface rounded-xl border border-app-border px-3.5 py-2.5"
              >
                <span className={`text-[11px] font-jakarta font-bold px-1.5 py-0.5 rounded capitalize flex-shrink-0 ${
                  item.type === 'assignment' ? 'bg-app-orange/10 text-app-orange' : 'bg-app-red/10 text-app-red'
                }`}>
                  {item.type === 'assignment' ? 'HW' : 'TST'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-app-text text-[13px] font-inter font-medium leading-tight truncate">{item.title}</p>
                  {item.course_code && (
                    <p className="text-app-text-dim text-[10px] font-inter">{item.course_code}</p>
                  )}
                </div>
                {item.deadline && <DeadlineBadge deadline={item.deadline} />}
              </div>
            ))}
            {dueItems.length > 3 && (
              <button
                onClick={() => navigate(`/space/${currentSpace.id}`)}
                className="text-app-accent text-[11px] font-jakarta font-semibold text-center py-1"
              >
                +{dueItems.length - 3} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Install prompt card ─────────────────────────────────────────── */}
      {isInstallable && (
        <div className="mb-4 animate-fadeIn bg-app-surface rounded-xl border border-app-border p-3.5 flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <div className="flex-1 min-w-0">
            <p className="text-app-text font-jakarta font-semibold text-sm">Install ClassSpace</p>
            <p className="text-app-text-dim text-xs font-inter">Add to your home screen for quick access</p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={install}
              className="bg-app-accent text-app-on-accent text-xs font-jakarta font-bold px-3 py-1.5 rounded-lg"
            >
              Install
            </button>
            <button
              onClick={dismiss}
              className="text-app-text-dim text-xs font-jakarta font-semibold px-2 py-1.5"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* ── Desktop 2-col wrapper ───────────────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[1fr_1.25fr] lg:gap-6 lg:items-start">

        {/* ── Left column: Quick Actions ──────────────────────────────── */}
        <div>
          <div className="mb-5 mt-1 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <p className="text-app-text-faint text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1.5">Quick actions</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Announce', icon: '📢', onClick: () => navigate(`/space/${currentSpace.id}`) },
                { label: 'Upload', icon: '📁', onClick: () => navigate(`/space/${currentSpace.id}`) },
                { label: 'Timetable', icon: '📅', onClick: () => navigate(`/space/${currentSpace.id}?tab=schedule`) },
                { label: 'Share', icon: '🔗', onClick: () => {
                  const url = `https://classspace.app/join/${currentSpace.invite_code}`;
                  if (navigator.share) navigator.share({ url });
                  else navigator.clipboard.writeText(url);
                }},
              ].map(action => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-1 bg-app-surface rounded-xl border border-app-border py-2.5 active:scale-95 transition-all duration-200"
                >
                  <span className="text-base">{action.icon}</span>
                  <span className="text-[9px] font-jakarta font-semibold text-app-text-dim">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column: Recent Announcements ──────────────────────── */}
        <div>
          <div className="animate-fadeIn" style={{ animationDelay: '0.12s' }}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-app-text-faint text-[10px] font-jakarta font-semibold uppercase tracking-wider">Announcements</p>
              <button
                onClick={() => navigate(`/space/${currentSpace.id}`)}
                className="text-app-accent text-[10px] font-jakarta font-semibold hover:opacity-80 transition-opacity"
              >
                See all →
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
                    onClick={() => navigate(`/space/${currentSpace.id}`)}
                    className="bg-app-surface rounded-xl border border-app-border px-3.5 py-2.5 text-left active:scale-[0.99] transition-all duration-200"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {ann.urgent && <span className="w-1.5 h-1.5 rounded-full bg-app-red flex-shrink-0" />}
                          <span className="text-app-text text-[13px] font-inter font-medium leading-snug truncate">{ann.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-app-text-dim text-[10px] font-inter">{ann.author_name}</span>
                          <span className="text-app-text-faint text-[9px] font-inter">
                            {ann.created_at?.split('T')[0]}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-jakarta font-semibold px-1.5 py-0.5 rounded capitalize flex-shrink-0 ${
                        ann.type === 'assignment' ? 'bg-app-orange/10 text-app-orange' :
                        ann.type === 'test' ? 'bg-app-red/10 text-app-red' :
                        ann.type === 'meeting' ? 'bg-app-accent2/10 text-app-accent2' :
                        'bg-app-surface-2 text-app-text-faint'
                      }`}>{ann.type === 'announcement' ? 'Info' : ann.type}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Opportunities ───────────────────────────────────────────────── */}
      <div className="mt-5 mb-4 animate-fadeIn" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-app-text-faint text-[10px] font-jakarta font-semibold uppercase tracking-wider">Opportunities</p>
          {opps.length > 0 && (
            <button
              onClick={() => navigate(`/space/${currentSpace.id}`)}
              className="text-app-accent text-[10px] font-jakarta font-semibold hover:opacity-80 transition-opacity"
            >
              View all →
            </button>
          )}
        </div>
        {oppsLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-56 flex-shrink-0 rounded-xl" />)}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
            {displayOpps.map(opp => {
              const cat = OPP_CAT_STYLE[opp.category] ?? { bg: '#ffffff0d', color: '#7a7a88', label: opp.category };
              const daysLeft = opp.deadline
                ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000)
                : null;
              return (
                <div
                  key={opp.id}
                  className="flex-shrink-0 w-[240px] bg-app-surface border border-app-border rounded-xl overflow-hidden"
                  style={{ borderLeft: `3px solid ${cat.color}` }}
                >
                  <div className="p-3 flex flex-col gap-1.5">
                    <span
                      className="text-[9px] font-jakarta font-bold px-1.5 py-0.5 rounded-full self-start"
                      style={{ background: cat.bg, color: cat.color }}
                    >
                      {cat.label}
                    </span>
                    <p className="text-app-text font-jakarta font-semibold text-xs leading-snug line-clamp-2">
                      {opp.title}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-app-border mt-auto">
                      <span className={`text-[9px] font-jakarta font-semibold ${
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
                          className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: cat.bg, color: cat.color }}
                        >
                          Apply →
                        </a>
                      ) : (
                        <button
                          onClick={() => navigate(`/space/${currentSpace.id}`)}
                          className="text-[10px] font-jakarta font-bold px-2 py-0.5 rounded-lg bg-app-surface-2 text-app-text-dim"
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
      </div>

    </div>
  );
}

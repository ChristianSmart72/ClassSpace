import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpaceStore } from '../store/spaceStore';
import { getTimetable } from '../api/timetable';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { DAYS, COURSE_COLORS, COURSE_BG_COLORS, type TimetableEntry } from '../types';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getTodayIndex(): number {
  const d = new Date().getDay();
  return d === 0 || d === 6 ? 0 : d - 1;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getClassStatus(entry: TimetableEntry): 'past' | 'now' | 'soon' | 'upcoming' {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(entry.start_time);
  const end = timeToMinutes(entry.end_time);
  if (currentMins >= start && currentMins < end) return 'now';
  if (currentMins < start && start - currentMins <= 60) return 'soon';
  if (currentMins >= end) return 'past';
  return 'upcoming';
}

function formatTimeRange(start: string, end: string) {
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'pm' : 'am';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return m === 0 ? `${hr}${period}` : `${hr}:${m.toString().padStart(2, '0')}${period}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function ClassDurationLabel({ start, end }: { start: string; end: string }) {
  const mins = timeToMinutes(end) - timeToMinutes(start);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return <>{h > 0 ? `${h}h` : ''}{m > 0 ? ` ${m}m` : ''}</>;
}

function CountdownToClass({ entry }: { entry: TimetableEntry }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const start = timeToMinutes(entry.start_time);
      const diff = start - currentMins;
      if (diff <= 0) { setLabel(''); return; }
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      setLabel(h > 0 ? `in ${h}h ${m}m` : `in ${m}m`);
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [entry.start_time]);
  if (!label) return null;
  return <span className="text-amber-400 text-[10px] font-jakarta font-bold">{label}</span>;
}

function ClassCard({ entry, isToday, showStatus = true }: { entry: TimetableEntry; isToday: boolean; showStatus?: boolean }) {
  const status = isToday ? getClassStatus(entry) : 'upcoming';
  const ci = entry.color_index % 5;
  const color = COURSE_COLORS[ci];
  const bg = COURSE_BG_COLORS[ci];

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
        status === 'now' ? 'border-opacity-60 shadow-lg' : status === 'past' ? 'opacity-45 border-app-border' : 'border-app-border'
      }`}
      style={{
        background: status === 'now' ? bg : 'var(--color-app-surface)',
        borderColor: status === 'now' ? color : undefined,
        boxShadow: status === 'now' ? `0 4px 24px ${color}25` : undefined,
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />
      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {showStatus && status === 'now' && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
                <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider" style={{ color }}>Now in session</span>
              </div>
            )}
            {showStatus && status === 'soon' && isToday && (
              <div className="flex items-center gap-1.5 mb-2">
                <CountdownToClass entry={entry} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: bg }}>
                {entry.course_icon}
              </span>
              <div className="min-w-0">
                <p className="text-app-text font-jakarta font-bold text-sm leading-snug">{entry.course_name}</p>
                <p className="text-app-text-dim text-[11px] font-inter">{entry.course_code}</p>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-app-text font-jakarta font-bold text-sm">{formatTimeRange(entry.start_time, entry.end_time)}</p>
            <p className="text-app-text-faint text-[10px] font-inter mt-0.5">
              <ClassDurationLabel start={entry.start_time} end={entry.end_time} />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          {entry.venue && (
            <div className="flex items-center gap-1 text-[11px] font-inter text-app-text-dim">
              <span>📍</span><span>{entry.venue}</span>
            </div>
          )}
          {entry.lecturer && (
            <div className="flex items-center gap-1 text-[11px] font-inter text-app-text-dim">
              <span>👨‍🏫</span><span>{entry.lecturer}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── UNIBEN 2025/2026 Academic Calendar ──────────────────────────────────────
const ACADEMIC_CALENDAR = [
  {
    phase: '1st Semester 2025/2026',
    color: '#5b6af0',
    events: [
      { date: 'Oct 6, 2025', label: 'First semester begins', done: true },
      { date: 'Nov 3–7, 2025', label: 'Matriculation ceremonies', done: true },
      { date: 'Nov 17, 2025', label: 'Continuous assessment deadline', done: true },
      { date: 'Jan 12, 2026', label: 'First semester exams begin', done: true },
      { date: 'Feb 6, 2026', label: 'First semester exams end', done: true },
    ],
  },
  {
    phase: '2nd Semester 2025/2026',
    color: '#e8ff47',
    events: [
      { date: 'Mar 2, 2026', label: 'Second semester begins', done: true },
      { date: 'Mar 9–13, 2026', label: 'Late registration / add-drop', done: true },
      { date: 'May 25 – Jun 5, 2026', label: 'Mid-semester break', done: true },
      { date: 'Jun 8, 2026', label: 'Second semester exams begin', done: true, current: true },
      { date: 'Jul 17, 2026', label: 'Second semester exams end', done: false },
      { date: 'Jul 27, 2026', label: 'Results released', done: false },
      { date: 'Aug 3, 2026', label: 'Long vacation begins', done: false },
    ],
  },
  {
    phase: '2026/2027 Session',
    color: '#4ade80',
    events: [
      { date: 'Oct 5, 2026', label: 'New session begins', done: false },
    ],
  },
];

type TimetableTab = 'schedule' | 'calendar';

export function Timetable() {
  const { currentSpace } = useSpaceStore();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<TimetableTab>('schedule');

  const todayIndex = getTodayIndex();

  const load = useCallback(async () => {
    if (!currentSpace) { setLoading(false); return; }
    try {
      const data = await getTimetable(currentSpace.id);
      setEntries(data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [currentSpace]);

  useEffect(() => { load(); }, [load]);

  // Compute dates for the currently-shown week
  const monday = getMonday(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);

  const weekDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isCurrentWeek = weekOffset === 0;

  function fmtShortDate(d: Date) {
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  }

  function fmtWeekRange() {
    const start = weekDates[0];
    const end = weekDates[4];
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${start.toLocaleDateString('en-NG', { month: 'long', day: 'numeric' })} – ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${start.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  const dayEntries = entries.filter(e => e.day === DAYS[selectedDay]);
  const isToday = isCurrentWeek && selectedDay === todayIndex;

  const totalHoursToday = dayEntries.reduce((acc, e) => {
    return acc + (timeToMinutes(e.end_time) - timeToMinutes(e.start_time)) / 60;
  }, 0);

  if (!currentSpace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState icon="📅" title="No space" subtitle="Join a space to see your timetable" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-app-border lg:px-8 lg:pt-8">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-app-text font-jakarta font-bold text-xl lg:text-2xl">Timetable</h1>
            <p className="text-app-text-dim text-sm font-inter mt-0.5">
              {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-app-accent/10 border border-app-accent/30 rounded-xl px-3 py-2 text-right">
            <p className="text-app-accent font-jakarta font-bold text-sm">{dayEntries.length}</p>
            <p className="text-app-accent/70 text-[10px] font-inter">classes {isToday ? 'today' : DAY_SHORT[selectedDay]}</p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 bg-app-bg/60 rounded-xl p-1 border border-app-border">
          {(['schedule', 'calendar'] as TimetableTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-jakarta font-semibold rounded-lg transition-all duration-200 capitalize flex items-center justify-center gap-1.5 ${
                activeTab === tab ? 'bg-app-surface text-app-text shadow-sm' : 'text-app-text-faint hover:text-app-text-dim'
              }`}
            >
              {tab === 'schedule' ? '📅' : '🗓️'} {tab === 'schedule' ? 'Class Schedule' : 'Academic Calendar'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'schedule' && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── Mobile layout ── */}
            <div className="lg:hidden">
              {/* Week navigation */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-app-border">
                <button
                  onClick={() => setWeekOffset(w => w - 1)}
                  className="w-8 h-8 rounded-lg bg-app-surface border border-app-border flex items-center justify-center text-app-text-dim hover:text-app-text transition-colors"
                >
                  ←
                </button>
                <div className="text-center">
                  <p className="text-app-text font-jakarta font-semibold text-xs">{fmtWeekRange()}</p>
                  {isCurrentWeek && (
                    <p className="text-app-accent text-[10px] font-inter">This week</p>
                  )}
                </div>
                <button
                  onClick={() => setWeekOffset(w => w + 1)}
                  className="w-8 h-8 rounded-lg bg-app-surface border border-app-border flex items-center justify-center text-app-text-dim hover:text-app-text transition-colors"
                >
                  →
                </button>
              </div>

              {/* Day pills with dates */}
              <div className="flex px-4 gap-2 py-3 overflow-x-auto scrollbar-none">
                {DAYS.map((day, i) => {
                  const dayCount = entries.filter(e => e.day === day).length;
                  const isActive = i === selectedDay;
                  const dateObj = weekDates[i];
                  const isActualToday = isCurrentWeek && i === todayIndex;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(i)}
                      className={`flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-2xl transition-all duration-200 flex-shrink-0 min-w-[56px] border ${
                        isActive
                          ? 'bg-app-accent text-app-bg border-app-accent'
                          : isActualToday
                          ? 'bg-app-accent/10 border-app-accent/40 text-app-accent'
                          : 'bg-app-surface border-app-border text-app-text-dim'
                      }`}
                    >
                      <span className="text-[10px] font-jakarta font-semibold">{DAY_SHORT[i]}</span>
                      <span className={`text-[11px] font-jakarta font-bold ${isActive ? 'text-app-bg' : isActualToday ? 'text-app-accent' : 'text-app-text'}`}>
                        {dateObj.getDate()}
                      </span>
                      {dayCount > 0 && (
                        <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-app-bg/50' : 'bg-app-accent/60'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="px-4">
                {loading ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                  </div>
                ) : dayEntries.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <EmptyState
                      icon={selectedDay >= 5 ? '😴' : '📅'}
                      title={selectedDay >= 5 ? 'Weekend' : 'Free day'}
                      subtitle={selectedDay >= 5 ? 'Enjoy the weekend!' : `No ${DAYS[selectedDay]} classes scheduled`}
                    />
                  </motion.div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedDay}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-3"
                    >
                      {dayEntries.map((entry, idx) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.06 }}
                        >
                          <ClassCard entry={entry} isToday={isToday} />
                        </motion.div>
                      ))}
                      <div className="bg-app-surface rounded-xl p-3 border border-app-border flex items-center justify-between mt-1">
                        <p className="text-app-text-dim text-xs font-inter">
                          {dayEntries.length} {dayEntries.length === 1 ? 'class' : 'classes'} · {totalHoursToday}h total
                        </p>
                        <p className="text-app-text-faint text-[10px] font-inter">
                          {isToday ? 'Today' : `${DAY_SHORT[selectedDay]} ${fmtShortDate(weekDates[selectedDay])}`}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* ── Desktop layout: full week grid ── */}
            <div className="hidden lg:block px-8 py-5">
              {/* Week navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setWeekOffset(w => w - 1)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-app-surface border border-app-border text-app-text-dim hover:text-app-text text-sm font-jakarta font-semibold transition-colors"
                >
                  ← Prev week
                </button>
                <div className="text-center">
                  <p className="text-app-text font-jakarta font-semibold text-sm">{fmtWeekRange()}</p>
                  {isCurrentWeek && <p className="text-app-accent text-[10px] font-inter">Current week</p>}
                </div>
                <button
                  onClick={() => setWeekOffset(w => w + 1)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-app-surface border border-app-border text-app-text-dim hover:text-app-text text-sm font-jakarta font-semibold transition-colors"
                >
                  Next week →
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-5 gap-4">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-4">
                  {DAYS.map((day, i) => {
                    const dEntries = entries.filter(e => e.day === day);
                    const isActualToday = isCurrentWeek && i === todayIndex;
                    const dateObj = weekDates[i];

                    return (
                      <div key={day} className="flex flex-col">
                        {/* Day header */}
                        <div className={`mb-3 px-3 py-2.5 rounded-xl text-center border ${
                          isActualToday ? 'bg-app-accent/10 border-app-accent/30' : 'bg-app-surface border-app-border'
                        }`}>
                          <p className={`font-jakarta font-bold text-xs ${isActualToday ? 'text-app-accent' : 'text-app-text-dim'}`}>
                            {DAY_SHORT[i]}
                          </p>
                          <p className={`font-jakarta font-extrabold text-lg leading-tight ${isActualToday ? 'text-app-accent' : 'text-app-text'}`}>
                            {dateObj.getDate()}
                          </p>
                          <p className={`text-[9px] font-inter ${isActualToday ? 'text-app-accent/70' : 'text-app-text-faint'}`}>
                            {dateObj.toLocaleDateString('en-NG', { month: 'short' })}
                          </p>
                          {isActualToday && <p className="text-app-accent/70 text-[9px] font-inter font-bold">TODAY</p>}
                        </div>

                        {/* Classes */}
                        <div className="flex flex-col gap-2 flex-1">
                          {dEntries.length === 0 ? (
                            <div className="flex-1 rounded-xl border border-dashed border-app-border flex items-center justify-center py-8">
                              <p className="text-app-text-faint text-[10px] font-inter text-center">No classes</p>
                            </div>
                          ) : (
                            dEntries.map((entry) => {
                              const status = isActualToday ? getClassStatus(entry) : 'upcoming';
                              const ci = entry.color_index % 5;
                              const color = COURSE_COLORS[ci];
                              const bg = COURSE_BG_COLORS[ci];

                              return (
                                <div
                                  key={entry.id}
                                  className={`relative rounded-xl border overflow-hidden p-3 transition-all duration-300 ${
                                    status === 'now' ? 'shadow-md' : status === 'past' ? 'opacity-45' : ''
                                  }`}
                                  style={{
                                    background: status === 'now' ? bg : 'var(--color-app-surface)',
                                    borderColor: status === 'now' ? color : 'var(--color-app-border)',
                                  }}
                                >
                                  <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: color }} />
                                  <div className="pl-3">
                                    {status === 'now' && (
                                      <div className="flex items-center gap-1 mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
                                        <span className="text-[9px] font-jakarta font-bold uppercase" style={{ color }}>Live</span>
                                      </div>
                                    )}
                                    <p className="text-app-text font-jakarta font-bold text-xs leading-snug line-clamp-2">{entry.course_name}</p>
                                    <p className="text-app-text-dim text-[10px] font-inter mt-0.5">{entry.course_code}</p>
                                    <p className="text-app-text-faint text-[10px] font-inter mt-1.5">{formatTimeRange(entry.start_time, entry.end_time)}</p>
                                    {entry.venue && (
                                      <p className="text-app-text-faint text-[10px] font-inter mt-0.5">📍 {entry.venue}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {dEntries.length > 0 && (
                          <p className="text-app-text-faint text-[10px] font-inter text-center mt-2">
                            {dEntries.length} {dEntries.length === 1 ? 'class' : 'classes'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-4 lg:px-8 lg:py-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1">
                <h2 className="text-app-text font-jakarta font-bold text-base">UNIBEN Academic Calendar</h2>
                <p className="text-app-text-faint text-xs font-inter mt-0.5">2025/2026 Academic Session — University of Benin</p>
              </div>
              <div className="flex items-center gap-1.5 bg-app-accent/10 border border-app-accent/30 rounded-lg px-2.5 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
                <span className="text-app-accent text-[10px] font-jakarta font-bold">2nd Semester</span>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {ACADEMIC_CALENDAR.map((phase, pi) => (
                <motion.div
                  key={pi}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: pi * 0.08 }}
                >
                  {/* Phase header */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-px flex-1" style={{ background: `${phase.color}30` }} />
                    <span
                      className="text-[10px] font-jakarta font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ color: phase.color, background: `${phase.color}14`, border: `1px solid ${phase.color}30` }}
                    >
                      {phase.phase}
                    </span>
                    <div className="h-px flex-1" style={{ background: `${phase.color}30` }} />
                  </div>

                  {/* Events */}
                  <div className="flex flex-col gap-2 ml-1">
                    {phase.events.map((ev, ei) => (
                      <div
                        key={ei}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                          ev.current
                            ? 'border-app-accent/40 bg-app-accent/5'
                            : ev.done
                            ? 'border-app-border bg-app-surface opacity-60'
                            : 'border-app-border bg-app-surface'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {ev.current ? (
                            <span className="w-5 h-5 rounded-full bg-app-accent/20 border-2 border-app-accent flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-app-accent animate-pulse" />
                            </span>
                          ) : ev.done ? (
                            <span className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 text-[10px]">✓</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border-2 border-app-border flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-app-border" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-inter font-medium ${ev.current ? 'text-app-accent' : ev.done ? 'text-app-text line-through' : 'text-app-text'}`}>
                            {ev.label}
                          </p>
                          <p className={`text-[10px] font-inter mt-0.5 ${ev.current ? 'text-app-accent/70' : 'text-app-text-faint'}`}>
                            {ev.date}
                          </p>
                        </div>
                        {ev.current && (
                          <span className="text-[9px] font-jakarta font-bold text-app-accent bg-app-accent/10 px-1.5 py-0.5 rounded flex-shrink-0">NOW</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 p-3 rounded-xl border border-app-border bg-app-surface text-center">
              <p className="text-app-text-faint text-[10px] font-inter">Dates based on UNIBEN 2025/2026 academic calendar</p>
              <p className="text-app-text-faint text-[9px] font-inter mt-0.5 opacity-60">Always confirm with your department</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

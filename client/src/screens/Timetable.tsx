import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpaceStore } from '../store/spaceStore';
import { getTimetable } from '../api/timetable';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { DAYS, COURSE_COLORS, COURSE_BG_COLORS, type TimetableEntry } from '../types';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

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
  return <span className="text-app-orange text-[10px] font-syne font-bold">{label}</span>;
}

function ClassCard({ entry, isToday, showStatus = true }: { entry: TimetableEntry; isToday: boolean; showStatus?: boolean }) {
  const status = isToday ? getClassStatus(entry) : 'upcoming';
  const ci = entry.color_index % 5;
  const color = COURSE_COLORS[ci];
  const bg = COURSE_BG_COLORS[ci];

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
        status === 'now'
          ? 'border-opacity-60 shadow-lg'
          : status === 'past'
          ? 'opacity-50 border-app-border'
          : 'border-app-border'
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
                <span className="text-[10px] font-syne font-bold uppercase tracking-wider" style={{ color }}>Now in session</span>
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
                <p className="text-app-text font-syne font-bold text-sm leading-snug">{entry.course_name}</p>
                <p className="text-app-text-dim text-[11px] font-dm">{entry.course_code}</p>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-app-text font-syne font-bold text-sm">{formatTimeRange(entry.start_time, entry.end_time)}</p>
            <p className="text-app-text-faint text-[10px] font-dm mt-0.5">
              <ClassDurationLabel start={entry.start_time} end={entry.end_time} />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          {entry.venue && (
            <div className="flex items-center gap-1 text-[11px] font-dm text-app-text-dim">
              <span>📍</span><span>{entry.venue}</span>
            </div>
          )}
          {entry.lecturer && (
            <div className="flex items-center gap-1 text-[11px] font-dm text-app-text-dim">
              <span>👨‍🏫</span><span>{entry.lecturer}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Timetable() {
  const { currentSpace } = useSpaceStore();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());

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

  const dayEntries = entries.filter(e => e.day === DAYS[selectedDay]);
  const isToday = selectedDay === todayIndex;

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
      <div className="px-4 pt-5 pb-4 border-b border-app-border lg:px-8 lg:pt-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-app-text font-syne font-bold text-xl lg:text-2xl">Timetable</h1>
            <p className="text-app-text-dim text-sm font-dm mt-0.5">
              {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="bg-app-accent/10 border border-app-accent/30 rounded-xl px-3 py-2 text-right">
            <p className="text-app-accent font-syne font-bold text-sm">{dayEntries.length}</p>
            <p className="text-app-accent/70 text-[10px] font-dm">classes {isToday ? 'today' : DAY_SHORT[selectedDay]}</p>
          </div>
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="lg:hidden">
        <div className="flex px-4 gap-2 py-3 overflow-x-auto scrollbar-none">
          {DAYS.map((day, i) => {
            const dayCount = entries.filter(e => e.day === day).length;
            const isActive = i === selectedDay;
            const isTodayDay = i === todayIndex;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(i)}
                className={`flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-2xl transition-all duration-200 flex-shrink-0 min-w-[56px] border ${
                  isActive
                    ? 'bg-app-accent text-app-bg border-app-accent'
                    : isTodayDay
                    ? 'bg-app-accent/10 border-app-accent/40 text-app-accent'
                    : 'bg-app-surface border-app-border text-app-text-dim'
                }`}
              >
                <span className="text-[11px] font-syne font-semibold">{DAY_SHORT[i]}</span>
                {dayCount > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-app-bg/50' : 'bg-app-accent/60'}`} />
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
                  <p className="text-app-text-dim text-xs font-dm">
                    {dayEntries.length} {dayEntries.length === 1 ? 'class' : 'classes'} · {totalHoursToday}h total
                  </p>
                  <p className="text-app-text-faint text-[10px] font-dm">{isToday ? 'Today' : DAYS[selectedDay]}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── Desktop layout: full week grid ── */}
      <div className="hidden lg:block px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {DAYS.map((day, i) => {
              const dEntries = entries.filter(e => e.day === day);
              const isTodayCol = i === todayIndex;

              return (
                <div key={day} className={`flex flex-col ${isTodayCol ? 'relative' : ''}`}>
                  {/* Day header */}
                  <div className={`mb-3 px-3 py-2 rounded-xl text-center ${
                    isTodayCol
                      ? 'bg-app-accent/10 border border-app-accent/30'
                      : 'bg-app-surface border border-app-border'
                  }`}>
                    <p className={`font-syne font-bold text-sm ${isTodayCol ? 'text-app-accent' : 'text-app-text'}`}>
                      {DAY_SHORT[i]}
                    </p>
                    {isTodayCol && (
                      <p className="text-app-accent/70 text-[10px] font-dm">Today</p>
                    )}
                  </div>

                  {/* Classes */}
                  <div className="flex flex-col gap-2 flex-1">
                    {dEntries.length === 0 ? (
                      <div className="flex-1 rounded-xl border border-dashed border-app-border flex items-center justify-center py-8">
                        <p className="text-app-text-faint text-[10px] font-dm text-center">No classes</p>
                      </div>
                    ) : (
                      dEntries.map((entry) => {
                        const status = isTodayCol ? getClassStatus(entry) : 'upcoming';
                        const ci = entry.color_index % 5;
                        const color = COURSE_COLORS[ci];
                        const bg = COURSE_BG_COLORS[ci];

                        return (
                          <div
                            key={entry.id}
                            className={`relative rounded-xl border overflow-hidden p-3 transition-all duration-300 ${
                              status === 'now' ? 'shadow-md' : status === 'past' ? 'opacity-50' : ''
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
                                  <span className="text-[9px] font-syne font-bold uppercase" style={{ color }}>Live</span>
                                </div>
                              )}
                              <p className="text-app-text font-syne font-bold text-xs leading-snug line-clamp-2">{entry.course_name}</p>
                              <p className="text-app-text-dim text-[10px] font-dm mt-0.5">{entry.course_code}</p>
                              <p className="text-app-text-faint text-[10px] font-dm mt-1.5">{formatTimeRange(entry.start_time, entry.end_time)}</p>
                              {entry.venue && (
                                <p className="text-app-text-faint text-[10px] font-dm mt-0.5">📍 {entry.venue}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Day total */}
                  {dEntries.length > 0 && (
                    <p className="text-app-text-faint text-[10px] font-dm text-center mt-2">
                      {dEntries.length} {dEntries.length === 1 ? 'class' : 'classes'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

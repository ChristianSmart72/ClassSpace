import { useEffect, useState, useCallback } from 'react';
import { useSpaceStore } from '../store/spaceStore';
import { getTimetable, deleteTimetableEntry } from '../api/timetable';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { Fab } from '../components/layout';
import { AddClassSheet } from '../components/sheets/AddClass';
import { toast } from '../store/toastStore';
import { DAYS, COURSE_COLORS, COURSE_BG_COLORS, type TimetableEntry } from '../types';
import api from '../api/client';

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

function ClassCard({ entry, isToday, showStatus = true, onCancel, onDelete }: { entry: TimetableEntry; isToday: boolean; showStatus?: boolean; onCancel?: (entry: TimetableEntry) => void; onDelete?: (entry: TimetableEntry) => void }) {
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
          {onCancel && (
            <button
              onClick={e => { e.stopPropagation(); onCancel(entry); }}
              className="ml-auto flex items-center gap-1 text-[10px] font-jakarta font-bold text-app-red/80 hover:text-app-red bg-app-red/8 hover:bg-app-red/15 px-2 py-1 rounded-lg transition-colors"
            >
              ✕ Cancel class
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(entry); }}
              className="flex items-center gap-1 text-[10px] font-jakarta font-bold text-app-text-faint hover:text-app-red bg-app-surface-2/60 hover:bg-app-red/10 px-2 py-1 rounded-lg transition-colors"
            >
              🗑 Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Timetable screen ────────────────────────────────────────────────────────

export function Timetable() {
  const currentSpace = useSpaceStore(s => s.currentSpace);
  const memberRole = useSpaceStore(s => s.memberRole);
  const isRep = memberRole === 'rep';
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());
  const [weekOffset, setWeekOffset] = useState(0);
  const [cancelToast, setCancelToast] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

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

  const handleCancelClass = useCallback(async (entry: TimetableEntry) => {
    if (!currentSpace || !isRep) return;
    if (!confirm(`Cancel ${entry.course_name} (${entry.day} ${entry.start_time.slice(0,5)})? This will notify the class.`)) return;
    try {
      await api.post(`/spaces/${currentSpace.id}/announcements`, {
        course_id: entry.course_id,
        title: `❌ Class cancelled — ${entry.course_code} (${entry.day} ${entry.start_time.slice(0,5)})`,
        body: `The ${entry.course_name} class scheduled for ${entry.day} from ${formatTimeRange(entry.start_time, entry.end_time)}${entry.venue ? ` in ${entry.venue}` : ''} has been cancelled. Check with your lecturer for further updates.`,
        type: 'update',
        urgent: true,
        pinned: false,
      });
      setCancelToast(`${entry.course_code} class cancelled — classmates have been notified`);
      setTimeout(() => setCancelToast(null), 4000);
    } catch {
      setCancelToast('Could not post cancellation — check your connection');
      setTimeout(() => setCancelToast(null), 3000);
    }
  }, [currentSpace, isRep]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteEntry = useCallback(async (entry: TimetableEntry) => {
    if (!confirm(`Remove ${entry.course_name} (${entry.day} ${entry.start_time.slice(0,5)}) from the timetable?`)) return;
    try {
      await deleteTimetableEntry(entry.id);
      setEntries(prev => prev.filter(e => e.id !== entry.id));
      toast(`${entry.course_code} removed from timetable`);
    } catch {
      toast('Could not remove class — check your connection', 'error');
    }
  }, []);

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
      {/* Cancel toast */}
      {cancelToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-app-surface border border-app-border rounded-xl px-4 py-3 shadow-xl animate-fadeIn max-w-[320px] w-full mx-4">
          <p className="text-app-text font-jakarta font-semibold text-xs text-center">{cancelToast}</p>
        </div>
      )}
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
      </div>

        <div className="animate-fadeIn">
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
                  <div className="animate-fadeIn">
                    <EmptyState
                      icon={selectedDay >= 5 ? '😴' : '📅'}
                      title={selectedDay >= 5 ? 'Weekend' : 'Free day'}
                      subtitle={selectedDay >= 5 ? 'Enjoy the weekend!' : `No ${DAYS[selectedDay]} classes scheduled`}
                      action={isRep ? (
                        <button onClick={() => setShowAdd(true)}
                          className="mt-2 bg-app-accent text-app-bg font-jakarta font-bold text-xs rounded-xl px-4 py-2.5 active:scale-95 transition-all">
                          + Add a class
                        </button>
                      ) : undefined}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 animate-fadeIn">
                    {dayEntries.map(entry => (
                      <div key={entry.id}>
                        <ClassCard entry={entry} isToday={isToday} onCancel={isRep ? handleCancelClass : undefined} onDelete={isRep ? handleDeleteEntry : undefined} />
                      </div>
                    ))}
                    <div className="bg-app-surface rounded-xl p-3 border border-app-border flex items-center justify-between mt-1">
                      <p className="text-app-text-dim text-xs font-inter">
                        {dayEntries.length} {dayEntries.length === 1 ? 'class' : 'classes'} · {totalHoursToday}h total
                      </p>
                      <p className="text-app-text-faint text-[10px] font-inter">
                        {isToday ? 'Today' : `${DAY_SHORT[selectedDay]} ${fmtShortDate(weekDates[selectedDay])}`}
                      </p>
                    </div>
                  </div>
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
          </div>

      {isRep && <Fab onClick={() => setShowAdd(true)} icon="+" />}
      {showAdd && <AddClassSheet spaceId={currentSpace.id} onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  );
}

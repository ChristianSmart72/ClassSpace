import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

const FEATURES = [
  { icon: '📢', label: 'Structured announcements', desc: 'Assignments, tests, updates — all in one feed' },
  { icon: '📁', label: 'Organised course files', desc: 'Notes, slides, past questions by course' },
  { icon: '🔗', label: 'Shareable invite links', desc: 'Your whole class joins with one code' },
  { icon: '⚡', label: 'Instant alerts', desc: 'Urgent notices you actually see' },
];

const HOW_IT_WORKS = [
  { num: '01', icon: '🏛️', title: 'Rep creates a Space', desc: 'Your class rep sets up a Space in under a minute — name it, add courses, done.' },
  { num: '02', icon: '🔗', title: 'Class joins with one code', desc: 'Share the invite code on your group chat. Everyone in your class joins instantly.' },
  { num: '03', icon: '📢', title: 'Never miss anything again', desc: 'Assignments, tests, files, timetables — all in one organised place. No noise.' },
];

const DEMO_ANNOUNCEMENTS = [
  { label: 'Assignment', color: '#ffb347', icon: '📝', title: 'Lab Report Deadline — Friday 5pm', course: 'PRE 311', urgent: true },
  { label: 'Test', color: '#ff5252', icon: '🧪', title: 'Thermodynamics II CA Test — Confirmed', course: 'PRE 321' },
  { label: 'Update', color: '#5b6af0', icon: '📡', title: 'No lectures Wednesday ⚠️', urgent: true },
  { label: 'Assignment', color: '#ffb347', icon: '📝', title: 'Manufacturing Take-Home — Submit by 5pm', course: 'PRE 331' },
  { label: 'Meeting', color: '#4ade80', icon: '🤝', title: 'Departmental Meeting — Faculty Auditorium' },
  { label: 'Update', color: '#5b6af0', icon: '📡', title: 'SIWES Forms out — deadline July 15' },
];

const DEMO_COURSES = [
  { code: 'PRE 311', name: 'Fluid Mechanics I', icon: '💧', files: 7 },
  { code: 'PRE 321', name: 'Engineering Thermodynamics II', icon: '🔥', files: 4 },
  { code: 'PRE 331', name: 'Manufacturing Technology I', icon: '⚙️', files: 5 },
  { code: 'MTH 311', name: 'Engineering Mathematics III', icon: '∑', files: 6 },
  { code: 'GNS 311', name: 'Communication Skills I', icon: '✍️', files: 2 },
];

const DEMO_TIMETABLE = [
  { time: '8:00am – 10:00am', course: 'Fluid Mechanics I', code: 'PRE 311', venue: 'LT 1', icon: '💧', color: '#5b6af0' },
  { time: '10:00am – 12:00pm', course: 'Engineering Thermodynamics II', code: 'PRE 321', venue: 'Lab A', icon: '🔥', color: '#ff5252' },
  { time: '2:00pm – 4:00pm', course: 'Manufacturing Technology I', code: 'PRE 331', venue: 'Workshop W4', icon: '⚙️', color: '#ffb347' },
];

type DemoView = 'announcements' | 'materials' | 'timetable';

const DEMO_VIEWS: { key: DemoView; label: string; icon: string }[] = [
  { key: 'announcements', label: 'Updates', icon: '📢' },
  { key: 'materials', label: 'Files', icon: '📁' },
  { key: 'timetable', label: 'Schedule', icon: '📅' },
];

const AUTO_ROTATE_MS = 3500;

function DemoCard() {
  const [activeView, setActiveView] = useState<DemoView>('announcements');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const viewIdx = DEMO_VIEWS.findIndex(v => v.key === activeView);

  const advance = () => {
    setProgress(0);
    setActiveView(prev => {
      const idx = DEMO_VIEWS.findIndex(v => v.key === prev);
      return DEMO_VIEWS[(idx + 1) % DEMO_VIEWS.length].key;
    });
  };

  const select = (key: DemoView) => {
    setActiveView(key);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    startTimers();
  };

  const startTimers = () => {
    intervalRef.current = setInterval(advance, AUTO_ROTATE_MS);
    const step = 50;
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(p + (step / AUTO_ROTATE_MS) * 100, 100));
    }, step);
  };

  useEffect(() => {
    startTimers();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  return (
    <div
      className="w-full bg-app-surface border border-app-border rounded-2xl overflow-hidden text-left"
      style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(232,255,71,0.06)' }}
    >
      {/* Progress bar */}
      <div className="h-[2px] bg-app-border">
        <motion.div
          className="h-full bg-app-accent"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0 }}
        />
      </div>

      {/* Space header */}
      <div className="px-4 pt-3 pb-2.5 border-b border-app-border flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: 'rgba(232,255,71,0.12)', border: '1px solid rgba(232,255,71,0.2)' }}
        >
          🏛️
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-app-text font-syne font-bold text-sm truncate">PRE220 — 300L Production Eng.</p>
          <p className="text-app-text-faint text-[10px] font-dm">University of Benin · 5 courses · 42 members</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] text-green-400 font-syne font-bold">LIVE</span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-app-border">
        {DEMO_VIEWS.map((v, i) => (
          <button
            key={v.key}
            onClick={() => select(v.key)}
            className={`flex-1 py-2.5 text-[11px] font-syne font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 relative ${
              activeView === v.key ? 'text-app-accent' : 'text-app-text-faint hover:text-app-text-dim'
            }`}
          >
            <span>{v.icon}</span>
            <span>{v.label}</span>
            {activeView === v.key && (
              <motion.div
                layoutId="demo-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-app-accent"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[196px] overflow-y-auto scrollbar-none">
        <AnimatePresence mode="wait">
          {activeView === 'announcements' && (
            <motion.div
              key="ann"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="divide-y divide-app-border"
            >
              {DEMO_ANNOUNCEMENTS.map((ann, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.05 }}
                  className="px-4 py-2.5 flex items-center gap-3"
                >
                  <span className="text-base flex-shrink-0">{ann.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-app-text text-xs font-dm font-medium truncate">{ann.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[9px] font-syne font-bold rounded px-1.5 py-0.5" style={{ background: `${ann.color}18`, color: ann.color }}>{ann.label}</span>
                      {ann.course && <span className="text-app-text-faint text-[9px] font-dm">{ann.course}</span>}
                      {ann.urgent && <span className="text-[9px] bg-red-500/10 text-red-400 font-syne font-bold rounded px-1.5 py-0.5">URGENT</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeView === 'materials' && (
            <motion.div
              key="mat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="divide-y divide-app-border"
            >
              {DEMO_COURSES.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.05 }}
                  className="px-4 py-2.5 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'rgba(232,255,71,0.08)' }}>{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-app-text text-xs font-dm font-medium truncate">{c.name}</p>
                    <p className="text-app-text-faint text-[10px] font-dm">{c.code}</p>
                  </div>
                  <span className="text-app-text-faint text-[10px] font-dm bg-app-bg/60 border border-app-border px-2 py-0.5 rounded flex-shrink-0">{c.files} files</span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeView === 'timetable' && (
            <motion.div
              key="tt"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="divide-y divide-app-border"
            >
              <div className="px-4 py-2 flex items-center justify-between">
                <p className="text-app-text-faint text-[10px] font-syne font-bold uppercase tracking-wider">Today · Monday</p>
                <p className="text-app-accent text-[10px] font-syne font-bold">3 classes</p>
              </div>
              {DEMO_TIMETABLE.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.06 }}
                  className="px-4 py-2.5 flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: `${c.color}18` }}
                  >{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-app-text text-xs font-dm font-medium truncate">{c.course}</p>
                    <p className="text-app-text-faint text-[10px] font-dm">{c.time} · {c.venue}</p>
                  </div>
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: c.color }} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-app-border flex items-center justify-between bg-app-bg/30">
        <div className="flex gap-1">
          {DEMO_VIEWS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === viewIdx ? 'bg-app-accent w-3' : 'bg-app-border'}`}
            />
          ))}
        </div>
        <p className="text-app-text-faint text-[9px] font-dm">Auto-previewing ClassSpace</p>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div
      className="min-h-dvh flex flex-col overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% -20%, #1c1c26 0%, #0f0f11 65%)' }}
    >
      {/* Top accent glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(232,255,71,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* ── Mobile layout ── */}
      <div className="flex lg:hidden flex-1 flex-col items-center text-center px-5 pt-14 pb-16 max-w-sm mx-auto relative w-full">

        {/* Logo */}
        <motion.div
          className="font-syne font-extrabold text-[10px] tracking-[0.28em] uppercase text-app-accent mb-8 flex items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-base">📚</span>
          ClassSpace
        </motion.div>

        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 bg-app-accent/10 border border-app-accent/20 rounded-full px-3.5 py-1.5 mb-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
          <span className="text-app-accent font-syne font-semibold text-[10px] tracking-wider uppercase">Built for Nigerian Students 🇳🇬</span>
        </motion.div>

        {/* Hero */}
        <motion.div className="mb-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}>
          <h1 className="font-syne font-extrabold leading-[1.05] text-[40px] text-app-text">Your class.</h1>
          <h1 className="font-syne font-extrabold leading-[1.05] text-[40px] text-app-accent">Organised.</h1>
        </motion.div>

        <motion.p
          className="text-app-text-dim font-dm text-[15px] leading-relaxed mb-7 max-w-[280px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          One clean hub for your class — announcements, course files, and schedules. No noise. No distractions.
        </motion.p>

        {/* Demo card */}
        <motion.div
          className="w-full mb-7"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.16 }}
        >
          <DemoCard />
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col gap-3 w-full mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
        >
          <Link
            to="/register"
            className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-2xl py-4 text-center active:scale-[0.98] transition-all duration-200"
            style={{ boxShadow: '0 4px 32px rgba(232,255,71,0.28)' }}
          >
            Create a Space — Free →
          </Link>
          <Link
            to="/join"
            className="w-full bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-2xl py-4 text-center active:scale-[0.98] transition-all duration-200"
          >
            Join with an Invite Code
          </Link>
        </motion.div>

        {/* How it works */}
        <motion.div
          className="w-full mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.28 }}
        >
          <p className="text-app-text-faint text-[10px] font-syne font-bold uppercase tracking-widest mb-4">How it works</p>
          <div className="flex flex-col gap-3">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="flex items-start gap-3 text-left bg-app-surface border border-app-border rounded-xl p-3.5">
                <span className="text-app-accent font-syne font-extrabold text-xs mt-0.5">{s.num}</span>
                <div>
                  <p className="text-app-text font-syne font-semibold text-xs mb-0.5">{s.icon} {s.title}</p>
                  <p className="text-app-text-faint text-[10px] font-dm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-app-text-faint text-xs font-dm">
          Already have an account?{' '}
          <Link to="/login" className="text-app-accent font-syne font-semibold">Sign in</Link>
        </p>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex flex-1 flex-col">
        {/* Desktop nav */}
        <nav className="flex items-center justify-between px-8 xl:px-16 py-5 border-b border-app-border/30">
          <div className="font-syne font-extrabold text-[11px] tracking-[0.28em] uppercase text-app-accent flex items-center gap-2">
            <span className="text-lg">📚</span>
            ClassSpace
          </div>
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-app-text-dim font-syne font-semibold text-sm hover:text-app-text transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity"
              style={{ boxShadow: '0 4px 20px rgba(232,255,71,0.22)' }}
            >
              Get Started →
            </Link>
          </div>
        </nav>

        {/* Hero section */}
        <div className="flex-1 grid grid-cols-2 gap-12 px-8 xl:px-16 py-14 max-w-6xl mx-auto w-full items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-app-accent/10 border border-app-accent/20 rounded-full px-4 py-1.5 mb-7"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
              <span className="text-app-accent font-syne font-semibold text-xs tracking-wider uppercase">Built for Nigerian students 🇳🇬</span>
            </motion.div>

            <h1 className="font-syne font-extrabold leading-[1.05] text-5xl xl:text-6xl text-app-text mb-2">
              Your class.
            </h1>
            <h1 className="font-syne font-extrabold leading-[1.05] text-5xl xl:text-6xl text-app-accent mb-7">
              Organised.
            </h1>

            <p className="text-app-text-dim font-dm text-[17px] leading-relaxed mb-9 max-w-[420px]">
              One clean hub that cuts through the noise. Announcements, course files, and timetables — all where your class can actually find them.
            </p>

            {/* Feature list */}
            <div className="flex flex-col gap-3 mb-9">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.12 + i * 0.07 }}
                >
                  <span className="text-xl w-8 flex-shrink-0 text-center">{f.icon}</span>
                  <div>
                    <span className="text-app-text font-syne font-semibold text-sm">{f.label}</span>
                    <span className="text-app-text-faint font-dm text-sm"> — {f.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTAs */}
            <motion.div
              className="flex items-center gap-3 flex-wrap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.42 }}
            >
              <Link
                to="/register"
                className="bg-app-accent text-app-bg font-syne font-bold text-sm rounded-2xl px-7 py-3.5 hover:opacity-90 transition-all duration-200 hover:scale-[1.02]"
                style={{ boxShadow: '0 4px 32px rgba(232,255,71,0.28)' }}
              >
                Create a Space — Free →
              </Link>
              <Link
                to="/join"
                className="bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-2xl px-7 py-3.5 hover:border-app-accent/40 transition-colors"
              >
                Join with Code
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — demo card */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.12 }}
          >
            <DemoCard />

            {/* Stats */}
            <div className="flex gap-3 mt-4">
              {[
                { value: '5', label: 'Courses', color: '#e8ff47' },
                { value: '6+', label: 'Announcements', color: '#5b6af0' },
                { value: '3', label: "Today's classes", color: '#4ade80' },
              ].map((s) => (
                <div key={s.label} className="flex-1 bg-app-surface border border-app-border rounded-xl p-3 text-center hover:border-app-border/60 transition-colors">
                  <p className="font-syne font-extrabold text-lg" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-app-text-faint text-[10px] font-dm">{s.label}</p>
                </div>
              ))}
            </div>

            {/* How it works — desktop */}
            <div className="mt-6">
              <p className="text-app-text-faint text-[10px] font-syne font-bold uppercase tracking-widest mb-3">How it works</p>
              <div className="flex flex-col gap-2">
                {HOW_IT_WORKS.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-app-surface border border-app-border/50 rounded-xl px-4 py-3">
                    <span className="text-app-accent font-syne font-extrabold text-xs mt-0.5">{s.num}</span>
                    <div>
                      <p className="text-app-text font-syne font-semibold text-xs">{s.icon} {s.title}</p>
                      <p className="text-app-text-faint text-[10px] font-dm leading-relaxed mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-col items-center pb-8 gap-1">
        <p className="text-app-text-faint text-[11px] font-dm">Made for Nigerian university students 🇳🇬</p>
        <p className="text-app-text-faint text-[10px] font-dm opacity-40">ClassSpace · Built for real academic life</p>
      </div>
    </div>
  );
}

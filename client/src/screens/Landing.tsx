import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const FEATURES = [
  { icon: '📢', label: 'Structured announcements', desc: 'Assignments, tests, updates — all in one feed' },
  { icon: '📁', label: 'Organised course files', desc: 'Notes, slides, past questions by course' },
  { icon: '🔗', label: 'Shareable invite links', desc: 'Your whole class joins with one code' },
  { icon: '⚡', label: 'Instant alerts', desc: 'Urgent notices you actually see' },
];

const DEMO_ANNOUNCEMENTS = [
  { type: 'assignment', label: 'Assignment', color: '#ffb347', icon: '📝', title: 'Lab Report Deadline — Friday', course: 'PEG 301', urgent: true },
  { type: 'test', label: 'Test', color: '#ff5252', icon: '🧪', title: 'Thermodynamics II CA Test — Confirmed', course: 'PEG 303' },
  { type: 'update', label: 'Update', color: '#5b6af0', icon: '📡', title: 'No lectures Wednesday ⚠️', urgent: true },
  { type: 'assignment', label: 'Assignment', color: '#ffb347', icon: '📝', title: 'Material Balance Take-Home — Submit by 5pm', course: 'PEG 305', urgent: false },
  { type: 'meeting', label: 'Meeting', color: '#4ade80', icon: '🤝', title: 'Class Rep Meeting — Faculty Board Room', course: 'General' },
  { type: 'update', label: 'Update', color: '#5b6af0', icon: '📡', title: 'PEG 307 Practical rescheduled to Thursday', course: 'PEG 307' },
];

const DEMO_COURSES = [
  { code: 'PEG 301', name: 'Fluid Mechanics', icon: '💧' },
  { code: 'PEG 303', name: 'Thermodynamics II', icon: '🔥' },
  { code: 'PEG 305', name: 'Material & Energy Balance', icon: '⚗️' },
  { code: 'PEG 307', name: 'Production Practicals', icon: '🔧' },
  { code: 'PEG 309', name: 'Engineering Mathematics', icon: '📐' },
];

type DemoView = 'announcements' | 'materials' | 'timetable';

const DEMO_VIEWS: { key: DemoView; label: string; icon: string }[] = [
  { key: 'announcements', label: 'Announcements', icon: '📢' },
  { key: 'materials', label: 'Materials', icon: '📁' },
  { key: 'timetable', label: 'Timetable', icon: '📅' },
];

const DEMO_TIMETABLE = [
  { time: '8:00am – 10:00am', course: 'Fluid Mechanics', code: 'PEG 301', venue: 'LT 1', icon: '💧', color: '#5b6af0' },
  { time: '10:00am – 12:00pm', course: 'Thermodynamics II', code: 'PEG 303', venue: 'Lab A', icon: '🔥', color: '#ff5252' },
  { time: '2:00pm – 4:00pm', course: 'Material & Energy Balance', code: 'PEG 305', venue: 'LT 2', icon: '⚗️', color: '#ffb347' },
];

function DemoCard() {
  const [activeView, setActiveView] = useState<DemoView>('announcements');

  return (
    <div className="w-full bg-app-surface border border-app-border rounded-2xl overflow-hidden text-left shadow-xl shadow-black/20">
      {/* Space header */}
      <div className="px-4 pt-3 pb-2 border-b border-app-border flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-app-accent/10 flex items-center justify-center text-sm">🏛️</div>
        <div className="flex-1 min-w-0">
          <p className="text-app-text font-syne font-bold text-sm truncate">300L Production Engineering</p>
          <p className="text-app-text-faint text-[10px] font-dm">University of Benin · 5 courses</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-app-border">
        {DEMO_VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setActiveView(v.key)}
            className={`flex-1 py-2 text-[11px] font-syne font-semibold transition-all duration-200 flex items-center justify-center gap-1 ${
              activeView === v.key
                ? 'text-app-accent border-b-2 border-app-accent bg-app-accent/5'
                : 'text-app-text-faint'
            }`}
          >
            <span>{v.icon}</span>
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-56 overflow-y-auto scrollbar-none">
        <AnimatePresence mode="wait">
          {activeView === 'announcements' && (
            <motion.div
              key="ann"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="divide-y divide-app-border"
            >
              {DEMO_ANNOUNCEMENTS.map((ann, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-base flex-shrink-0">{ann.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-app-text text-xs font-dm font-medium truncate">{ann.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-syne font-bold rounded px-1.5 py-0.5" style={{ background: `${ann.color}18`, color: ann.color }}>{ann.label}</span>
                      {ann.course && <span className="text-app-text-faint text-[9px] font-dm">{ann.course}</span>}
                      {ann.urgent && <span className="text-[9px] bg-app-red/10 text-app-red font-syne font-bold rounded px-1.5 py-0.5">URGENT</span>}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeView === 'materials' && (
            <motion.div
              key="mat"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="divide-y divide-app-border"
            >
              {DEMO_COURSES.map((c, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-app-accent/10 flex items-center justify-center text-sm flex-shrink-0">{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-app-text text-xs font-dm font-medium truncate">{c.name}</p>
                    <p className="text-app-text-faint text-[10px] font-dm">{c.code}</p>
                  </div>
                  <span className="text-app-text-faint text-[10px] font-dm bg-app-surface-2 px-2 py-0.5 rounded flex-shrink-0">Files →</span>
                </div>
              ))}
            </motion.div>
          )}

          {activeView === 'timetable' && (
            <motion.div
              key="tt"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="divide-y divide-app-border"
            >
              {DEMO_TIMETABLE.map((c, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${c.color}18` }}>{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-app-text text-xs font-dm font-medium truncate">{c.course}</p>
                    <p className="text-app-text-faint text-[10px] font-dm">{c.time} · {c.venue}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div
      className="min-h-dvh flex flex-col overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #1a1a22 0%, #0f0f11 70%)' }}
    >
      {/* Top glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full pointer-events-none"
        style={{ background: '#e8ff47', opacity: 0.05, filter: 'blur(90px)' }}
      />

      {/* ── Mobile layout ── */}
      <div className="flex lg:hidden flex-1 flex-col items-center text-center px-5 pt-16 pb-10 max-w-sm mx-auto relative w-full">
        {/* Logo */}
        <motion.div
          className="font-syne font-extrabold text-[10px] tracking-[0.28em] uppercase text-app-accent mb-10 flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-base">📚</span>
          ClassSpace
        </motion.div>

        {/* Hero */}
        <motion.div className="mb-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
          <h1 className="font-syne font-extrabold leading-[1.05] text-[42px] text-app-text">Your class.</h1>
          <h1 className="font-syne font-extrabold leading-[1.05] text-[42px] text-app-accent">Organised.</h1>
        </motion.div>

        <motion.p
          className="text-app-text-dim font-dm text-[15px] leading-relaxed mb-8 max-w-[280px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          One clean hub that cuts through the noise. Announcements, course files, and schedules — exactly where your class can find them.
        </motion.p>

        {/* Mini demo card */}
        <motion.div
          className="w-full mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <DemoCard />
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="grid grid-cols-2 gap-2 w-full mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {FEATURES.map((f) => (
            <div key={f.label} className="bg-app-surface border border-app-border rounded-xl p-3 text-left">
              <span className="text-lg block mb-1">{f.icon}</span>
              <p className="text-app-text font-syne font-semibold text-xs mb-0.5">{f.label}</p>
              <p className="text-app-text-faint text-[10px] font-dm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Link
            to="/register"
            className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-2xl py-4 text-center active:scale-[0.98] transition-all duration-200"
            style={{ boxShadow: '0 4px 32px rgba(232,255,71,0.25)' }}
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

        <p className="mt-6 text-app-text-faint text-xs font-dm">
          Already have an account?{' '}
          <Link to="/login" className="text-app-accent font-syne font-semibold">Sign in</Link>
        </p>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex flex-1 flex-col">
        {/* Desktop nav bar */}
        <nav className="flex items-center justify-between px-8 xl:px-16 py-6 border-b border-app-border/40">
          <div className="font-syne font-extrabold text-[11px] tracking-[0.28em] uppercase text-app-accent flex items-center gap-2">
            <span className="text-lg">📚</span>
            ClassSpace
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-app-text-dim font-syne font-semibold text-sm hover:text-app-text transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity"
              style={{ boxShadow: '0 4px 20px rgba(232,255,71,0.2)' }}
            >
              Get Started →
            </Link>
          </div>
        </nav>

        {/* Desktop hero section — CSS grid for reliable two-column */}
        <div className="flex-1 grid grid-cols-2 gap-10 px-8 py-12 max-w-6xl mx-auto w-full items-center">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-app-accent/10 border border-app-accent/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
              <span className="text-app-accent font-syne font-semibold text-xs tracking-wider uppercase">Built for Nigerian students 🇳🇬</span>
            </div>

            <h1 className="font-syne font-extrabold leading-[1.05] text-4xl xl:text-5xl text-app-text mb-2">
              Your class.
            </h1>
            <h1 className="font-syne font-extrabold leading-[1.05] text-4xl xl:text-5xl text-app-accent mb-6">
              Organised.
            </h1>

            <p className="text-app-text-dim font-dm text-base leading-relaxed mb-8">
              One clean hub that cuts through the noise. Academic updates, course files, and timetables — all where your department can actually find them.
            </p>

            {/* Feature list */}
            <div className="flex flex-col gap-2.5 mb-8">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="text-lg w-7 flex-shrink-0">{f.icon}</span>
                  <div>
                    <span className="text-app-text font-syne font-semibold text-sm">{f.label}</span>
                    <span className="text-app-text-faint font-dm text-sm"> — {f.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/register"
                className="bg-app-accent text-app-bg font-syne font-bold text-sm rounded-2xl px-7 py-3.5 hover:opacity-90 transition-opacity"
                style={{ boxShadow: '0 4px 32px rgba(232,255,71,0.25)' }}
              >
                Create a Space — Free →
              </Link>
              <Link
                to="/join"
                className="bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-2xl px-7 py-3.5 hover:border-app-accent/40 transition-colors"
              >
                Join with Code
              </Link>
            </div>
          </motion.div>

          {/* Right column — demo card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <DemoCard />

            {/* Stats below card */}
            <div className="flex gap-3 mt-4">
              {[
                { value: '5', label: 'Courses', color: '#e8ff47' },
                { value: '6+', label: 'Announcements', color: '#5b6af0' },
                { value: '3', label: "Today's classes", color: '#4ade80' },
              ].map((s) => (
                <div key={s.label} className="flex-1 bg-app-surface border border-app-border rounded-xl p-3 text-center">
                  <p className="font-syne font-extrabold text-lg" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-app-text-faint text-[10px] font-dm">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-col items-center pb-8 gap-1">
        <p className="text-app-text-faint text-[11px] font-dm">Made for Nigerian university students 🇳🇬</p>
        <p className="text-app-text-faint text-[10px] font-dm opacity-50">ClassSpace v5 · Built for real academic life</p>
      </div>
    </div>
  );
}

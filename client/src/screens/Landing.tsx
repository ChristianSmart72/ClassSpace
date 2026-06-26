import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '📢', label: 'Structured announcements' },
  { icon: '📁', label: 'Organised course files' },
  { icon: '🔗', label: 'Shareable links' },
];

export function Landing() {
  return (
    <div className="min-h-dvh flex flex-col overflow-x-hidden" style={{ background: 'radial-gradient(ellipse at 50% -10%, #1f1f25 0%, #0f0f11 65%)' }}>
      {/* Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: '#e8ff47', opacity: 0.06, filter: 'blur(80px)' }}
      />

      <div className="flex-1 flex flex-col justify-center items-center text-center px-6 pt-20 pb-8 max-w-sm mx-auto relative">

        {/* Logo word-mark */}
        <div className="font-syne font-extrabold text-[11px] tracking-[0.22em] uppercase text-app-accent mb-12">
          ClassSpace
        </div>

        {/* Hero headline */}
        <div className="mb-5">
          <h1 className="font-syne font-extrabold leading-[1.05] text-[40px] text-app-text">
            Your class.
          </h1>
          <h1 className="font-syne font-extrabold leading-[1.05] text-[40px] text-app-accent">
            Organised.
          </h1>
        </div>

        <p className="text-app-text-dim font-dm text-[15px] leading-relaxed mb-10 max-w-[270px]">
          One space for your department's announcements and study materials.
          No noise, just what matters.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {FEATURES.map((f) => (
            <span
              key={f.label}
              className="flex items-center gap-1.5 bg-app-surface border border-app-border rounded-full px-3 py-1.5 text-app-text-dim text-[11px] font-dm"
            >
              <span className="text-xs">{f.icon}</span>
              {f.label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full">
          <Link
            to="/register"
            className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-2xl py-4 text-center active:scale-[0.98] transition-all duration-200"
            style={{ boxShadow: '0 4px 28px rgba(232,255,71,0.22)' }}
          >
            Create a Space →
          </Link>
          <Link
            to="/join"
            className="w-full bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-2xl py-4 text-center active:scale-[0.98] transition-all duration-200 hover:border-app-text-faint"
          >
            Join with a Link
          </Link>
        </div>

        {/* Sign in nudge */}
        <p className="mt-7 text-app-text-faint text-xs font-dm">
          Already have an account?{' '}
          <Link to="/login" className="text-app-accent font-syne font-semibold">
            Sign in
          </Link>
        </p>
      </div>

      <p className="text-app-text-faint text-[11px] font-dm text-center pb-8">
        Made for Nigerian students 🇳🇬
      </p>
    </div>
  );
}

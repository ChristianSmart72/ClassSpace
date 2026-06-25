import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="min-h-dvh flex flex-col px-6" style={{ background: 'radial-gradient(ellipse at 50% 0%, #1f1f25 0%, #0f0f11 70%)' }}>
      <div className="flex-1 flex flex-col justify-center items-center text-center max-w-sm mx-auto">
        <span className="text-6xl mb-6">📚</span>
        <h1 className="text-3xl font-syne font-bold text-app-text mb-3">
          ClassSpace
        </h1>
        <p className="text-app-text-dim font-dm text-sm leading-relaxed mb-8 max-w-xs">
          The structured alternative to WhatsApp class groups. Announcements, materials, deadlines — all in one calm space.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <Link
            to="/setup"
            className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-2xl py-4 text-center active:scale-[0.98] transition-all duration-200"
          >
            Create a Space →
          </Link>
          <Link
            to="/join"
            className="w-full bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-2xl py-4 text-center active:scale-[0.98] transition-all duration-200 hover:border-app-text-dim"
          >
            Join with a Link
          </Link>
        </div>

        <div className="mt-8 p-4 bg-app-surface/50 rounded-2xl border border-app-border w-full">
          <p className="text-app-text-dim text-xs font-dm mb-2">Already have an account?</p>
          <div className="flex gap-2">
            <Link to="/login" className="flex-1 text-center text-app-accent font-syne font-semibold text-sm py-2 rounded-xl bg-app-accent/10">
              Sign In
            </Link>
            <Link to="/register" className="flex-1 text-center text-app-accent font-syne font-semibold text-sm py-2 rounded-xl bg-app-accent/10">
              Register
            </Link>
          </div>
        </div>
      </div>

      <p className="text-app-text-faint text-xs font-dm text-center pb-8">Made for Nigerian students.</p>
    </div>
  );
}

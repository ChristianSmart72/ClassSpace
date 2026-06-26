import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const DEMO_ACCOUNTS = [
  {
    label: '🎓 Class Rep',
    sub: 'Can post & manage',
    email: 'christian@classspace.app',
    password: 'demo1234',
  },
  {
    label: '👤 Student',
    sub: 'Member view',
    email: 'student@classspace.app',
    password: 'demo1234',
  },
];

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [filled, setFilled] = useState<string | null>(null);
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const prefill = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setFilled(account.label);
    setError('');
  };

  return (
    <div className="min-h-dvh flex flex-col px-6 py-12">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📚</span>
            <span className="text-app-accent font-syne font-bold text-lg tracking-widest uppercase">ClassSpace</span>
          </div>
          <h1 className="text-2xl font-syne font-bold text-app-text mb-1">Welcome back</h1>
          <p className="text-app-text-dim text-sm font-dm">Sign in to your ClassSpace</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-app-red/10 border border-app-red/30 rounded-xl px-4 py-3">
              <p className="text-app-red text-sm font-dm">{error}</p>
            </div>
          )}

          <div>
            <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFilled(null); }}
              placeholder="you@uniben.edu"
              autoComplete="email"
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFilled(null); }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent focus:outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl py-3.5 mt-1 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-app-text-dim text-sm font-dm text-center mt-5">
          No account?{' '}
          <Link to="/register" className="text-app-accent font-semibold">Create one</Link>
        </p>

        {/* Quick-fill demo buttons */}
        <div className="mt-6">
          <p className="text-app-text-faint text-[11px] font-syne font-semibold uppercase tracking-wider text-center mb-2.5">
            Try a demo account
          </p>
          <div className="flex gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => prefill(acc)}
                className={`flex-1 rounded-xl border py-2.5 px-3 text-left transition-all duration-200 active:scale-[0.97] ${
                  filled === acc.label
                    ? 'border-app-accent bg-app-accent/10'
                    : 'border-app-border bg-app-surface hover:border-app-accent/40'
                }`}
              >
                <p className={`text-xs font-syne font-bold ${filled === acc.label ? 'text-app-accent' : 'text-app-text'}`}>
                  {acc.label}
                </p>
                <p className="text-app-text-faint text-[10px] font-dm mt-0.5">{acc.sub}</p>
              </button>
            ))}
          </div>
          {filled && (
            <p className="text-app-accent text-[11px] font-dm text-center mt-2">
              ✓ Credentials filled — tap Sign In
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

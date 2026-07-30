import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const register = useAuthStore(s => s.register);
  const loading = useAuthStore(s => s.loading);
  const joinSpace = useSpaceStore(s => s.joinSpace);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      await register(name, email, password);

      // After registration, check if there's a pending invite code to join
      const pendingCode = localStorage.getItem('pendingInviteCode');
      if (pendingCode) {
        localStorage.removeItem('pendingInviteCode');
        localStorage.removeItem('pendingSpaceId');
        try {
          const space = await joinSpace(pendingCode);
          navigate(`/space/${space.id}`);
          return;
        } catch {
          // If join fails, just go home
        }
      }

      navigate('/home');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-app-bg px-6 py-12">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📚</span>
            <span className="text-app-accent font-jakarta font-bold text-lg tracking-widest uppercase">ClassSpace</span>
          </div>
          <h1 className="text-2xl font-jakarta font-bold text-app-text mb-1">Create your account</h1>
          <p className="text-app-text-dim text-sm font-inter">Join ClassSpace — free forever</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-app-red/10 border border-app-red/30 rounded-xl px-4 py-3">
              <p className="text-app-red text-sm font-inter">{error}</p>
            </div>
          )}

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@uniben.edu"
              autoComplete="email"
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              autoComplete="new-password"
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent focus:outline-none transition-colors"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3.5 mt-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-app-text-dim text-sm font-inter text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-app-accent font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

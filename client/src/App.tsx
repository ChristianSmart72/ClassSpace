import { useEffect, Component, lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSpaceStore } from './store/spaceStore';
import { useUpdateStore } from './store/updateStore';
import { FloatingThemeToggle } from './components/ui/FloatingThemeToggle';
import { MainLayout } from './components/layout/MainLayout';
import { LogoSplash } from './components/ui/Logo';
import { UpdatePrompt } from './components/ui/UpdatePrompt';
import { useConnectivityStore } from './store/connectivityStore'; // ensure connectivity listeners register

const Landing = lazy(() => import('./screens/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./screens/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./screens/Register').then(m => ({ default: m.Register })));
const SetupWizard = lazy(() => import('./screens/SetupWizard').then(m => ({ default: m.SetupWizard })));
const JoinInput = lazy(() => import('./screens/JoinInput').then(m => ({ default: m.JoinInput })));
const JoinPreview = lazy(() => import('./screens/JoinPreview').then(m => ({ default: m.JoinPreview })));
const Home = lazy(() => import('./screens/Home').then(m => ({ default: m.Home })));
const Space = lazy(() => import('./screens/Space').then(m => ({ default: m.Space })));
const CourseFiles = lazy(() => import('./screens/CourseFiles').then(m => ({ default: m.CourseFiles })));
const Profile = lazy(() => import('./screens/Profile').then(m => ({ default: m.Profile })));
const Timetable = lazy(() => import('./screens/Timetable').then(m => ({ default: m.Timetable })));
const AnnouncementDetail = lazy(() => import('./screens/AnnouncementDetail').then(m => ({ default: m.AnnouncementDetail })));
const Opportunities = lazy(() => import('./screens/Opportunities').then(m => ({ default: m.Opportunities })));
const MaterialDetail = lazy(() => import('./screens/MaterialDetail').then(m => ({ default: m.MaterialDetail })));

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(err: Error, info: unknown) { console.error('App error:', err, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh bg-app-bg flex flex-col items-center justify-center px-6 text-center">
          <span className="text-5xl mb-4">⚠️</span>
          <h2 className="text-app-text font-jakarta font-bold text-lg mb-2">Something went wrong</h2>
          <p className="text-app-text-dim text-sm font-inter mb-6">The page hit an unexpected error. Refresh to try again.</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl px-6 py-3"
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, initialized } = useAuthStore();
  if (!initialized) return <div className="min-h-dvh bg-app-bg flex items-center justify-center"><div className="w-6 h-6 border-2 border-app-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { token, initialized } = useAuthStore();
  if (!initialized) return <div className="min-h-dvh bg-app-bg flex items-center justify-center"><div className="w-6 h-6 border-2 border-app-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (token) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <FloatingThemeToggle />
      <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-app-bg"><LogoSplash size={44} /></div>}>
        <Routes>
          <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/setup" element={<ProtectedRoute><SetupWizard /></ProtectedRoute>} />
          <Route path="/join" element={<JoinInput />} />
          <Route path="/join/:type/:id" element={<JoinPreview />} />
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/space/:id" element={<Space />} />
            <Route path="/space/:id/announcement/:annId" element={<AnnouncementDetail />} />
            <Route path="/space/:id/course/:cid" element={<CourseFiles />} />
            <Route path="/space/:id/material/:mid" element={<MaterialDetail />} />
            <Route path="/space/:id/opportunities" element={<Opportunities />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  const { init, initialized } = useAuthStore();
  const { fetchSpace } = useSpaceStore();
  const setUpdateAvailable = useUpdateStore((s) => s.setUpdateAvailable);

  useEffect(() => {
    const cancelled = { current: false };

    // Init connectivity store listeners
    useConnectivityStore.getState().setOnline(
      (() => { try { return navigator.onLine } catch { return true } })()
    );

    // Watch for SW updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (cancelled.current) return;
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true, reg);
            }
          });
        });
      });
    }

    init().then(() => {
      if (cancelled.current) return;
      const spaceId = (() => { try { return localStorage.getItem('spaceId') } catch { return null } })();
      if (spaceId) fetchSpace(spaceId).catch((err) => console.warn('Failed to fetch space:', err));
    }).catch((err) => console.warn('Init failed:', err));

    return () => { cancelled.current = true; };
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-app-bg">
        <LogoSplash size={44} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <UpdatePrompt />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

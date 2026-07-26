import { useEffect, Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSpaceStore } from './store/spaceStore';
import { FloatingThemeToggle } from './components/ui/FloatingThemeToggle';
import { MainLayout } from './components/layout/MainLayout';
import { Landing } from './screens/Landing';
import { Login } from './screens/Login';
import { Register } from './screens/Register';
import { SetupWizard } from './screens/SetupWizard';
import { JoinInput } from './screens/JoinInput';
import { JoinPreview } from './screens/JoinPreview';
import { Home } from './screens/Home';
import { Space } from './screens/Space';
import { CourseFiles } from './screens/CourseFiles';
import { Profile } from './screens/Profile';
import { Timetable } from './screens/Timetable';
import { AnnouncementDetail } from './screens/AnnouncementDetail';
import { LogoSplash } from './components/ui/Logo';

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
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  const { init, initialized } = useAuthStore();
  const { fetchSpace } = useSpaceStore();

  useEffect(() => {
    init().then(() => {
      const spaceId = localStorage.getItem('spaceId');
      if (spaceId) fetchSpace(spaceId);
    });
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
      </BrowserRouter>
    </ErrorBoundary>
  );
}

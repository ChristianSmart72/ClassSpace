import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSpaceStore } from './store/spaceStore';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, initialized } = useAuthStore();
  if (!initialized) return <div className="min-h-dvh flex items-center justify-center"><div className="w-6 h-6 border-2 border-app-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { token, initialized } = useAuthStore();
  if (!initialized) return <div className="min-h-dvh flex items-center justify-center"><div className="w-6 h-6 border-2 border-app-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (token) return <Navigate to="/home" replace />;
  return <>{children}</>;
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
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">📚</span>
          <div className="w-6 h-6 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
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
          <Route path="/space/:id/course/:cid" element={<CourseFiles />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

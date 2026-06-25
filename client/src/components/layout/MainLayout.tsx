import { useNavigate, Outlet } from 'react-router-dom';
import { BottomNav, Fab } from './index';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from 'react-router-dom';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const showNav = !location.pathname.startsWith('/join') && !location.pathname.startsWith('/setup');

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex-1 pb-16">
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}

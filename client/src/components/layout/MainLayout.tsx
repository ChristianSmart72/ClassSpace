import { Outlet } from 'react-router-dom';
import { BottomNav } from './index';

export function MainLayout() {
  return (
    <div className="min-h-dvh bg-app-bg flex flex-col">
      <div className="flex-1 pb-16">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

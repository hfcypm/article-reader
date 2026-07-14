import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';
import { ToastContainer } from '../ui/toast';

export function MainLayout() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
      <TabBar />
      <ToastContainer />
    </div>
  );
}

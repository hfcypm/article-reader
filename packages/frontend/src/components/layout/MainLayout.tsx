/**
 * MainLayout 主布局组件
 * 三栏结构：顶部内容区（路由 Outlet）+ 底部 Tab 栏 + 全局 Toast 容器
 */

import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';

export function MainLayout() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}

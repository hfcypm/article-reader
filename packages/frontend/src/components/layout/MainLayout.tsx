/**
 * MainLayout 主布局组件
 * 三栏结构：顶部内容区（路由 Outlet）+ 底部 Tab 栏 + 全局 Toast 容器
 */

import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';
import { ToastContainer } from '../ui/toast';

/**
 * MainLayout — 应用主框架
 * 作为受保护路由的父级布局，嵌套子路由内容并挂载全局 UI 元素
 */
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

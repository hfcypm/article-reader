/**
 * 应用根组件
 * 负责路由定义、认证拦截、全局设置加载、主题/语言同步，以及启动加载态渲染
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { MainLayout } from './components/layout/MainLayout';
import { ToastContainer } from './components/ui/toast';
import { HomePage } from './pages/HomePage';
import { BookshelfPage } from './pages/BookshelfPage';
import { ProfilePage } from './pages/ProfilePage';
import { DetailPage } from './pages/DetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { ImmersiveReaderPage } from './pages/ImmersiveReaderPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

/**
 * 路由守卫组件
 * 未登录用户访问受保护页面时自动重定向到登录页
 * @param children - 受保护的子组件内容
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * App 根组件
 * 初始化认证状态、加载用户偏好设置、同步主题和语言到 DOM
 */
export default function App() {
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore();
  const { load, theme, language } = useSettingsStore();

  // 应用启动时检查本地 token 有效性
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 加载持久化的用户设置
  useEffect(() => {
    load();
  }, [load]);

  // 同步主题和语言到 <html> 元素，驱动 Tailwind 暗色模式和 i18n
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', language);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, language]);

  // 登录状态检查中显示加载动画
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4 fade-in">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <span className="text-text-muted text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  // 路由配置：登录/注册页在未登录时展示，已登录时重定向到首页
  // 受保护页面嵌套在 MainLayout 中（底部 Tab 栏）
  return (
    <>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="bookshelf" element={<BookshelfPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="/detail/:docId" element={<ProtectedRoute><DetailPage /></ProtectedRoute>} />
        <Route path="/reader/:docId" element={<ProtectedRoute><ReaderPage /></ProtectedRoute>} />
        <Route path="/immersive-reader/:docId" element={<ProtectedRoute><ImmersiveReaderPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Routes>
      <ToastContainer />
    </>
  );
}

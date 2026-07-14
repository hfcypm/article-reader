import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { BookshelfPage } from './pages/BookshelfPage';
import { ProfilePage } from './pages/ProfilePage';
import { DetailPage } from './pages/DetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-bg)]">
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

  return (
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
    </Routes>
  );
}

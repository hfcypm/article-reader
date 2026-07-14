import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import type { UserProfile } from '@/types';

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const res = await api.get<UserProfile>('/user/profile');
    if (res.success && res.data) setProfile(res.data);
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="page flex items-center justify-center">
        <span className="text-text-muted text-sm">加载中...</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="p-4 pt-6 fade-in">
        <h1 className="text-xl font-bold text-text mb-6">我的</h1>

        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">
                {profile?.nickname?.charAt(0) || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-text">{profile?.nickname}</h2>
              <p className="text-sm text-text-muted">{profile?.phone}</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-primary">{profile?.bookshelfCount || 0}</p>
            <p className="text-xs text-text-muted mt-1">书架数量</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-accent-green">{profile?.totalReadSentences || 0}</p>
            <p className="text-xs text-text-muted mt-1">已读句数</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-text">{profile?.bookshelfCount || 0}</p>
            <p className="text-xs text-text-muted mt-1">已读篇数</p>
          </Card>
        </div>

        <div className="space-y-2 mb-6">
          {[
            { icon: 'settings', label: '阅读设置', desc: '倍速、字号、主题' },
            { icon: 'shield', label: '隐私设置', desc: '数据与权限管理' },
            { icon: 'info', label: '关于', desc: '版本 1.0.0' },
          ].map((item) => (
            <Card key={item.label} className="flex items-center gap-3 cursor-pointer hover:bg-surface-card/80 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon === 'settings' && (
                    <>
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </>
                  )}
                  {item.icon === 'shield' && (
                    <>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </>
                  )}
                  {item.icon === 'info' && (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </>
                  )}
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text">{item.label}</p>
                <p className="text-xs text-text-muted">{item.desc}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Card>
          ))}
        </div>

        <Button variant="ghost" className="w-full text-text-muted" onClick={handleLogout}>
          退出登录
        </Button>
      </div>
    </div>
  );
}

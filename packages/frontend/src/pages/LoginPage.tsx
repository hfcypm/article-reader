import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/toast';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!phone) { showToast('请输入手机号', 'error'); return; }
    if (mode === 'password' && !password) { showToast('请输入密码', 'error'); return; }
    if (mode === 'code' && !code) { showToast('请输入验证码', 'error'); return; }

    setLoading(true);
    try {
      await login(phone, mode === 'password' ? password : undefined, mode === 'code' ? code : undefined);
      showToast('登录成功', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-8">
        <div className="w-full max-w-sm fade-in">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-text mb-1">欢迎回来</h1>
            <p className="text-sm text-text-muted">登录你的账号继续阅读</p>
          </div>

          <div className="space-y-6">
            <Input
              label="手机号"
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
            />

            {mode === 'password' ? (
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            ) : (
              <Input
                label="验证码"
                type="text"
                placeholder="请输入验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
              />
            )}

            <div className="flex justify-end">
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setMode(mode === 'password' ? 'code' : 'password')}
              >
                {mode === 'password' ? '验证码登录' : '密码登录'}
              </button>
            </div>

            <Button className="w-full" size="lg" onClick={handleLogin} disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>

            <p className="text-center text-sm text-text-muted">
              还没有账号？{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

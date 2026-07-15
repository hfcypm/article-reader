import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/toast';

export function RegisterPage() {
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    if (!nickname) { showToast('请输入昵称', 'error'); return; }
    if (!phone) { showToast('请输入手机号', 'error'); return; }
    if (!password) { showToast('请输入密码', 'error'); return; }
    if (password.length < 8) { showToast('密码长度至少8位', 'error'); return; }
    if (password !== confirmPassword) { showToast('两次密码输入不一致', 'error'); return; }

    setLoading(true);
    try {
      await register(phone, password, nickname);
      showToast('注册成功', 'success');
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
            <h1 className="text-2xl font-bold text-text mb-1">创建账号</h1>
            <p className="text-sm text-text-muted">开始你的阅读之旅</p>
          </div>

          <div className="space-y-6">
            <Input
              label="昵称"
              placeholder="请输入昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <Input
              label="手机号"
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
            />
            <Input
              label="密码"
              type="password"
              placeholder="8-20位，需包含字母和数字"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="确认密码"
              type="password"
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button className="w-full" size="lg" onClick={handleRegister} disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>

            <p className="text-center text-sm text-text-muted">
              已有账号？{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

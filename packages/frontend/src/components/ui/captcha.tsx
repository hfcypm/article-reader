import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface CaptchaState {
  id: string;
  svg: string;
}

interface CaptchaProps {
  onCaptchaChange: (id: string, text: string) => void;
}

export function Captcha({ onCaptchaChange }: CaptchaProps) {
  const [captcha, setCaptcha] = useState<CaptchaState | null>(null);
  const [input, setInput] = useState('');

  const refresh = useCallback(async () => {
    setInput('');
    onCaptchaChange('', '');
    const res = await api.get<CaptchaState>('/auth/captcha');
    if (res.success && res.data) {
      setCaptcha(res.data);
    }
  }, [onCaptchaChange]);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (captcha) {
      onCaptchaChange(captcha.id, input);
    }
  }, [input, captcha, onCaptchaChange]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text">图形验证码</label>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="请输入验证码"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={4}
          className="flex-1 h-10 px-3 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors"
        />
        <div
          className="h-10 w-28 rounded-xl overflow-hidden border border-border cursor-pointer flex-shrink-0 bg-white flex items-center justify-center"
          onClick={refresh}
          dangerouslySetInnerHTML={captcha ? { __html: captcha.svg } : undefined}
        />
      </div>
      <p className="text-xs text-text-muted/50">点击图片可刷新验证码</p>
    </div>
  );
}

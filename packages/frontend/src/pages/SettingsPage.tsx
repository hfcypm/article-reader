import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { useSettingsStore, type FontSize, type Theme, type Language } from '@/store/settingsStore';
import { SPEED_OPTIONS, type SpeedOption } from '@/lib/utils';

const FONT_SIZES: { key: FontSize; label: string }[] = [
  { key: 'small', label: '小' },
  { key: 'medium', label: '中' },
  { key: 'large', label: '大' },
  { key: 'xlarge', label: '特大' },
];

const LANGUAGES: { key: Language; label: string }[] = [
  { key: 'zh-CN', label: '简体中文' },
  { key: 'zh-TW', label: '繁體中文' },
  { key: 'en', label: 'English' },
];

const SPEED_LABELS: Record<number, string> = {
  0.75: '0.75x',
  1.0: '1.0x',
  1.25: '1.25x',
  1.5: '1.5x',
  2.0: '2.0x',
};

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    fontSize, theme, language, defaultSpeed, ttsEnabled,
    setFontSize, setTheme, setLanguage, setDefaultSpeed, setTtsEnabled,
  } = useSettingsStore();

  return (
    <div className="h-full flex flex-col bg-surface">
      <Header title="阅读设置" showBack onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto page">
        <div className="pt-7 pb-10 space-y-6">

          <Card>
            <div className="space-y-3">
              <p className="text-sm font-medium text-text">字体大小</p>
              <div className="flex items-center justify-between">
                <div className="flex-1 flex gap-1 bg-surface-card rounded-lg p-1">
                  {FONT_SIZES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setFontSize(s.key)}
                      className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
                        fontSize === s.key
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-text-muted/60">
                <span>预览效果</span>
                <span className={`${fontSize === 'small' ? 'text-sm' : fontSize === 'medium' ? 'text-base' : fontSize === 'large' ? 'text-lg' : 'text-xl'} font-medium text-text`}>
                  Aa
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <p className="text-sm font-medium text-text">主题颜色</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                    theme === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface-card hover:border-primary/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636e72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${theme === 'light' ? 'text-primary' : 'text-text'}`}>浅色</p>
                    <p className="text-[11px] text-text-muted">适合日间阅读</p>
                  </div>
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface-card hover:border-primary/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-primary' : 'text-text'}`}>深色</p>
                    <p className="text-[11px] text-text-muted">适合夜间阅读</p>
                  </div>
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <p className="text-sm font-medium text-text">界面语言</p>
              <div className="flex flex-col gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.key}
                    onClick={() => setLanguage(lang.key)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
                      language === lang.key
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface-card hover:border-primary/30'
                    }`}
                  >
                    <span className={`text-sm font-medium ${language === lang.key ? 'text-primary' : 'text-text'}`}>
                      {lang.label}
                    </span>
                    {language === lang.key && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <p className="text-sm font-medium text-text">默认播放速度</p>
              <div className="flex items-center gap-1 bg-surface-card rounded-lg p-1">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setDefaultSpeed(s)}
                    className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
                      defaultSpeed === s
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {SPEED_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="w-full flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-text text-left">默认开启朗读</p>
                <p className="text-xs text-text-muted text-left mt-0.5">进入阅读页时自动启用语音朗读</p>
              </div>
              <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${
                ttsEnabled ? 'bg-primary' : 'bg-border'
              }`}>
                <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                  ttsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </button>
          </Card>

        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { showToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { getSentenceDuration, SPEED_OPTIONS, type SpeedOption } from '@/lib/utils';
import type { Document } from '@/types';

export function ReaderPage() {
  const { docId } = useParams<{ docId: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<SpeedOption>(1.0);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState('medium');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (docId) loadDocument(docId);
  }, [docId]);

  const loadDocument = async (id: string) => {
    setLoading(true);
    const res = await api.get<Document>(`/documents/${id}`);
    if (res.success && res.data) {
      setDoc(res.data);
      const shelfRes = await api.get<{ currentSentence: number }[]>(`/bookshelf?search=${encodeURIComponent(res.data.title)}`);
      if (shelfRes.success && shelfRes.data && shelfRes.data.length > 0) {
        setCurrentIndex(shelfRes.data[0].currentSentence || 0);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || !doc) return;

    const sentences = ((doc.sentences as unknown[]) || []) as { text: string }[];
    if (currentIndex >= sentences.length) {
      setIsPlaying(false);
      showToast('已读完', 'info');
      return;
    }

    const currentSentence = sentences[currentIndex];
    const duration = getSentenceDuration(currentSentence?.text || '', speed);

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= sentences.length) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, speed, doc]);

  const saveProgress = useCallback(async () => {
    if (!docId) return;
    await api.put(`/bookshelf/${docId}/progress`, { currentSentence: currentIndex });
  }, [docId, currentIndex]);

  useEffect(() => {
    const handleBeforeUnload = () => saveProgress();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveProgress]);

  const handleBack = () => {
    saveProgress();
    navigate(-1);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const sentences = ((doc?.sentences as unknown[]) || []) as { text: string }[];
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!doc) return;
    const sentences = ((doc.sentences as unknown[]) || []) as { text: string }[];
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetIndex = Math.floor(ratio * (sentences.length - 1));
    setCurrentIndex(targetIndex);
    setIsPlaying(false);
  };

  const fontSizes: Record<string, string> = {
    small: 'text-xl leading-relaxed',
    medium: 'text-2xl leading-relaxed',
    large: 'text-3xl leading-relaxed',
    xlarge: 'text-4xl leading-relaxed',
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <span className="text-text-muted text-sm">加载中...</span>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-surface gap-4">
        <p className="text-text-muted">文档不存在</p>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  const sentences = ((doc.sentences as unknown[]) || []) as { text: string; index: number }[];
  const currentSentence = sentences[currentIndex];
  const progress = sentences.length > 0 ? currentIndex / sentences.length : 0;

  return (
    <div
      className={`h-full flex flex-col ${theme === 'dark' ? 'bg-surface-dark text-text-dark' : 'bg-surface text-text'}`}
    >
      <Header
        title={doc.title}
        showBack
        onBack={handleBack}
        transparent
        action={
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="!w-9 !h-9 !p-0 !rounded-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </Button>
        }
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-h-full">
          {currentIndex > 0 && (
            <div className="mb-6 w-full text-center">
              <p className="text-sm text-text-muted/60 line-clamp-2">
                {sentences[currentIndex - 1]?.text || ''}
              </p>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center min-h-[120px] max-h-[50vh] overflow-y-auto w-full">
            <p
              className={`reader-sentence active font-bold text-center w-full ${fontSizes[fontSize]} ${theme === 'dark' ? 'text-text-dark' : 'text-text'}`}
            >
              {currentSentence?.text || '...'}
            </p>
          </div>

          {currentIndex < sentences.length - 1 && (
            <div className="mt-6 w-full text-center">
              <p className="text-sm text-text-muted/40 line-clamp-2">
                {sentences[currentIndex + 1]?.text || ''}
              </p>
            </div>
          )}
        </div>

        <div className="w-full mb-4">
          <div
            className="h-8 flex items-center cursor-pointer relative group"
            onClick={handleProgressClick}
          >
            <div className="w-full h-1.5 bg-border/30 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress * 100}% - 8px)` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-text-muted/50 mt-1">
            <span>第 {currentIndex + 1} 句</span>
            <span>共 {sentences.length} 句</span>
          </div>
        </div>
      </div>

      <div className={`p-4 pb-8 border-t ${theme === 'dark' ? 'border-border-dark' : 'border-border'}`}>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-card transition-colors disabled:opacity-30"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" />
            </svg>
          </button>

          <button
            onClick={handlePlayPause}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95"
          >
            {isPlaying ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex >= sentences.length - 1}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-card transition-colors disabled:opacity-30"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-center mt-4">
          <button
            onClick={() => setShowSpeedMenu(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-card text-text-muted hover:text-text transition-colors"
          >
            {speed}x
          </button>
        </div>
      </div>

      <Dialog open={showSpeedMenu} onClose={() => setShowSpeedMenu(false)} title="播放速度">
        <div className="space-y-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setSpeed(s); setShowSpeedMenu(false); }}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                speed === s ? 'bg-primary text-white' : 'hover:bg-surface-card text-text'
              }`}
            >
              {s}x {s === 1.0 ? '（默认）' : ''}
            </button>
          ))}
        </div>
      </Dialog>

      <Dialog open={showSettings} onClose={() => setShowSettings(false)} title="阅读设置">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-text mb-2">字号</p>
            <div className="flex gap-2">
              {Object.keys(fontSizes).map((s) => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    fontSize === s ? 'bg-primary text-white' : 'bg-surface-card text-text hover:bg-border'
                  }`}
                >
                  {s === 'small' ? '小' : s === 'medium' ? '中' : s === 'large' ? '大' : '特大'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-text mb-2">主题</p>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  theme === 'light' ? 'bg-primary text-white' : 'bg-yellow-50 text-text border border-border'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                日间
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  theme === 'dark' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-200 border border-border'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                夜间
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

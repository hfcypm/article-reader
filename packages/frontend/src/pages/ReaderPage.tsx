import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { showToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { getSentenceDuration, SPEED_OPTIONS, type SpeedOption } from '@/lib/utils';
import { useSettingsStore, type FontSize, type Theme } from '@/store/settingsStore';
import type { Document } from '@/types';

/**
 * 判断文本是否主要为中文，用于 TTS 朗读时选择正确的语言
 * @param text 待检测的文本
 * @returns 中文占比超过 30% 返回 true
 */
function isChineseText(text: string): boolean {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return chineseChars > text.replace(/[\u4e00-\u9fff]/g, '').length * 0.3;
}

/**
 * 使用浏览器 Web Speech API 朗读文本
 * @param text 要朗读的文本
 * @param rate 朗读速率
 * @param onEnd 朗读完成后的回调
 * @returns 创建的 utterance 对象，供后续取消使用
 */
function speakText(text: string, rate: number, onEnd: () => void) {
  if (!('speechSynthesis' in window)) return null;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.lang = isChineseText(text) ? 'zh-CN' : 'en-US';
  utterance.onend = onEnd;
  utterance.onerror = () => onEnd();

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * 阅读器页面 - 逐句阅读文档，支持速度调节、字号/主题设置、语音朗读、进度拖拽
 */
export function ReaderPage() {
  const { docId } = useParams<{ docId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const settings = useSettingsStore();
  /** 当前文档数据 */
  const [doc, setDoc] = useState<Document | null>(null);
  /** 当前句子索引 */
  const [currentIndex, setCurrentIndex] = useState(0);
  /** currentIndex 的同步镜像 ref，避免 saveProgress 闭包饥饿 */
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  /** 是否正在播放 */
  const [isPlaying, setIsPlaying] = useState(false);
  /** 当前播放速度 */
  const [speed, setSpeed] = useState<SpeedOption>(
    (location.state as { speed?: SpeedOption })?.speed || settings.defaultSpeed
  );
  /** 文档加载中 */
  const [loading, setLoading] = useState(true);
  /** 当前字体大小 */
  const [fontSize, setFontSize] = useState(settings.fontSize);
  /** 当前主题（亮色/暗色） */
  const [theme, setTheme] = useState<Theme>(settings.theme);
  /** 语音朗读开关 */
  const [ttsEnabled, setTtsEnabled] = useState(settings.ttsEnabled);
  /** 速度选择菜单是否展开 */
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  /** 阅读设置弹窗是否展开 */
  const [showSettings, setShowSettings] = useState(false);
  /** 是否正在拖拽进度条 */
  const [isDragging, setIsDragging] = useState(false);
  /** 自动翻页定时器引用 */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** TTS 朗读对象引用 */
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  /** 进度条 DOM 引用 */
  const progressBarRef = useRef<HTMLDivElement>(null);
  /** 拖拽前是否正在播放 */
  const wasPlayingBeforeDragRef = useRef(false);
  /** TTS 代际计数器，防止取消后的 onend 误触翻页 */
  const ttsGenerationRef = useRef(0);

  /** 路由参数变化时加载文档 */
  useEffect(() => {
    if (docId) loadDocument(docId);
  }, [docId]);

  /** 加载文档内容并恢复上次阅读位置 */
  const loadDocument = async (id: string) => {
    setLoading(true);
    const res = await api.get<Document>(`/documents/${id}`);
    if (res.success && res.data) {
      setDoc(res.data);
      const shelfRes = await api.get<{ currentSentence: number }>(`/bookshelf/by-doc/${id}`);
      if (shelfRes.success && shelfRes.data) {
        setCurrentIndex(shelfRes.data.currentSentence || 0);
      }
    }
    setLoading(false);
  };

  /** 组件卸载时清理定时器和语音朗读 */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  /** 播放控制 - 每隔句子时长自动翻到下一句，支持 TTS 模式 */
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

    let ttsDuration = duration;

    if (ttsEnabled && currentSentence?.text) {
      ttsGenerationRef.current += 1;
      const gen = ttsGenerationRef.current;
      utteranceRef.current = speakText(currentSentence.text, speed, () => {
        if (ttsGenerationRef.current !== gen) return;
        flushSync(() => {
          setCurrentIndex((prev) => {
            const next = prev + 1;
            if (next >= sentences.length) {
              setIsPlaying(false);
              return prev;
            }
            return next;
          });
        });
      });
    }

    timerRef.current = setTimeout(() => {
      if (!ttsEnabled) {
        flushSync(() => {
          setCurrentIndex((prev) => {
            const next = prev + 1;
            if (next >= sentences.length) {
              setIsPlaying(false);
              return prev;
            }
            return next;
          });
        });
      }
    }, ttsDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, speed, doc, ttsEnabled]);

  /** 持久化保存阅读进度到后端 */
  const saveProgress = useCallback(async () => {
    if (!docId) return;
    await api.put(`/bookshelf/${docId}/progress`, { currentSentence: currentIndexRef.current });
  }, [docId]);

  /** 页面卸载/关闭前自动保存阅读进度 */
  useEffect(() => {
    const handleBeforeUnload = () => saveProgress();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveProgress]);

  /** 返回上一页并保存进度 */
  const handleBack = async () => {
    ttsGenerationRef.current += 1;
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    window.speechSynthesis?.cancel();
    await saveProgress();
    navigate(-1);
  };

  /** 播放/暂停切换 */
  const handlePlayPause = () => {
    if (isPlaying) {
      ttsGenerationRef.current += 1;
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis?.cancel();
      saveProgress();
    }
    setIsPlaying(!isPlaying);
  };

  /** 跳转到下一句 */
  const handleNext = () => {
    ttsGenerationRef.current += 1;
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    window.speechSynthesis?.cancel();
    const sentences = ((doc?.sentences as unknown[]) || []) as { text: string }[];
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    ttsGenerationRef.current += 1;
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    window.speechSynthesis?.cancel();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(false);
    }
  };

  /** 根据鼠标/触摸横坐标定位到进度条对应的句子 */
  const seekToPosition = useCallback((clientX: number) => {
    if (!doc) return;
    const sentences = ((doc.sentences as unknown[]) || []) as { text: string }[];
    const bar = progressBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetIndex = Math.floor(ratio * (sentences.length - 1));
    setCurrentIndex(targetIndex);
    setIsPlaying(false);
  }, [doc]);

  /** 拖拽开始事件处理 */
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    wasPlayingBeforeDragRef.current = isPlaying;
    ttsGenerationRef.current += 1;
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    window.speechSynthesis?.cancel();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    seekToPosition(clientX);
  }, [isPlaying, seekToPosition]);

  /** 拖拽移动事件处理 */
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    seekToPosition(clientX);
  }, [seekToPosition]);

  /** 拖拽结束事件处理 */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (wasPlayingBeforeDragRef.current) {
      wasPlayingBeforeDragRef.current = false;
      setIsPlaying(true);
    }
  }, []);

  /** 拖拽时绑定全局鼠标/触摸事件 */
  useEffect(() => {
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: true });
    document.addEventListener('touchend', handleDragEnd);
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  /** 字体大小对应的 Tailwind CSS 类名映射 */
  const fontSizes: Record<FontSize, string> = {
    small: 'text-xl leading-relaxed',
    medium: 'text-2xl leading-relaxed',
    large: 'text-3xl leading-relaxed',
    xlarge: 'text-4xl leading-relaxed',
  };

  if (loading) {
    return (
      /* 加载中状态 */
      <div className="h-full flex items-center justify-center bg-surface">
        <span className="text-text-muted text-sm">加载中...</span>
      </div>
    );
  }

  if (!doc) {
    return (
      /* 文档不存在状态 */
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
      {/* 顶部导航栏 - 标题、返回按钮、设置入口 */}
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

      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-h-full">
          {currentIndex > 0 && (
            /* 上一句文本预览（半透明） */
            <div className="mb-8 w-full text-center">
              <p className="text-sm text-text-muted/60 line-clamp-2">
                {sentences[currentIndex - 1]?.text || ''}
              </p>
            </div>
          )}

          {/* 当前句子显示区域 */}
          <div className="flex-1 flex items-center justify-center min-h-[120px] max-h-[50vh] overflow-y-auto w-full">
            <p
              className={`reader-sentence active font-bold text-center w-full ${fontSizes[fontSize]} ${theme === 'dark' ? 'text-text-dark' : 'text-text'}`}
            >
              {currentSentence?.text || '...'}
            </p>
          </div>

          {currentIndex < sentences.length - 1 && (
            /* 下一句文本预览（半透明） */
            <div className="mt-8 w-full text-center">
              <p className="text-sm text-text-muted/40 line-clamp-2">
                {sentences[currentIndex + 1]?.text || ''}
              </p>
            </div>
          )}
        </div>

        {/* 进度条区域 */}
        <div className="w-full mb-5">
          <div
            ref={progressBarRef}
            className="h-8 flex items-center cursor-pointer relative group select-none touch-none"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className="w-full h-1.5 bg-border/30 rounded-full overflow-hidden relative">
              <div
                className={`h-full bg-primary rounded-full ${isDragging ? '' : 'transition-all duration-500'}`}
                style={{ width: `${progress * 100}%` }}
              />
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md transition-opacity ${
                  isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
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

      <div className={`p-5 pb-10 border-t ${theme === 'dark' ? 'border-border-dark' : 'border-border'}`}>
        {/* 播放控制按钮区域 */}
        <div className="flex items-center justify-center gap-8">
          {/* 上一句按钮 */}
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

          {/* 播放/暂停按钮 */}
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

          {/* 下一句按钮 */}
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

        {/* 辅助工具栏 - 播放速度与语音朗读设置 */}
        <div className="flex items-center justify-center gap-3 mt-5">
          {/* 播放速度按钮 */}
          <button
            onClick={() => setShowSpeedMenu(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-card text-text-muted hover:text-text transition-colors"
          >
            {speed}x
          </button>

          {/* 语音朗读开关按钮 */}
          {'speechSynthesis' in window && (
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                ttsEnabled
                  ? 'bg-primary text-white'
                  : 'bg-surface-card text-text-muted hover:text-text'
              }`}
            >
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  {ttsEnabled && (
                    <>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </>
                  )}
                  {!ttsEnabled && (
                    <line x1="23" y1="9" x2="17" y2="15" />
                  )}
                </svg>
                朗读
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 播放速度选择弹窗 */}
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

      {/* 阅读设置弹窗 - 字号和主题选择 */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} title="阅读设置">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-text mb-2">字号</p>
            <div className="flex gap-2">
              {Object.keys(fontSizes).map((s) => (
                <button
                  key={s}
                  onClick={() => setFontSize(s as FontSize)}
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

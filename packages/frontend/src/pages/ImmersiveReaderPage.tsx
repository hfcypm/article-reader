import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useSettingsStore, type FontSize, type Theme } from '@/store/settingsStore';
import type { Document } from '@/types';

function BottomSheet({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-xl animate-slide-up-sheet max-h-[70%] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <span className="text-base font-semibold text-text">{title}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-card transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

const fontSizes: Record<FontSize, string> = {
  small: 'text-base leading-relaxed',
  medium: 'text-lg leading-relaxed',
  large: 'text-xl leading-relaxed',
  xlarge: 'text-2xl leading-relaxed',
};

const FONT_SIZE_LABELS: { key: FontSize; label: string }[] = [
  { key: 'small', label: '小' },
  { key: 'medium', label: '中' },
  { key: 'large', label: '大' },
  { key: 'xlarge', label: '特大' },
];

type PageMode = 'scroll' | 'flip';

/**
 * 将句子按可视区域高度分页，每页填满后开始新页
 */
function paginateSentences(
  sentences: { text: string; index: number }[],
  containerHeight: number,
  fontSize: FontSize,
): string[][] {
  if (!containerHeight || sentences.length === 0) return [[]];

  const lineHeightMap: Record<FontSize, number> = {
    small: 26,
    medium: 30,
    large: 36,
    xlarge: 42,
  };
  const lineHeight = lineHeightMap[fontSize];
  const padding = 48;
  const availableHeight = containerHeight - padding;
  const maxLinesPerPage = Math.max(1, Math.floor(availableHeight / lineHeight));
  const avgCharsPerLine = Math.max(20, Math.floor(400 / (lineHeight / 28)));
  const avgCharsPerPage = maxLinesPerPage * avgCharsPerLine;

  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentCharCount = 0;

  for (const s of sentences) {
    if (currentCharCount + s.text.length > avgCharsPerPage && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      currentCharCount = 0;
    }
    currentPage.push(s.text);
    currentCharCount += s.text.length;
  }
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

export function ImmersiveReaderPage() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const settings = useSettingsStore();

  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<FontSize>(settings.fontSize);
  const [theme, setTheme] = useState<Theme>(settings.theme);
  const [showToc, setShowToc] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>('scroll');

  const [currentPage, setCurrentPage] = useState(0);
  const [flipOffset, setFlipOffset] = useState(0);
  const [flipAnimating, setFlipAnimating] = useState(false);
  const [isUserSwiping, setIsUserSwiping] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const containerWidth = useRef(0);
  const swipeStartX = useRef(0);

  useEffect(() => {
    if (docId) loadDocument(docId);
  }, [docId]);

  const loadDocument = async (id: string) => {
    setLoading(true);
    const res = await api.get<Document>(`/documents/${id}`);
    if (res.success && res.data) {
      setDoc(res.data);
    }
    setLoading(false);
  };

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const togglePageMode = () => {
    setPageMode(pageMode === 'scroll' ? 'flip' : 'scroll');
    setCurrentPage(0);
    setFlipOffset(0);
  };

  const flipToPage = useCallback((targetPage: number) => {
    const w = containerWidth.current || 360;
    setFlipAnimating(true);
    setFlipOffset(targetPage > currentPage ? -w : w);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlipOffset(0);
        setCurrentPage(targetPage);
        setTimeout(() => setFlipAnimating(false), 400);
      });
    });
  }, [currentPage]);

  const goToNextPage = useCallback(() => {
    if (!doc) return;
    const sentences = ((doc.sentences as unknown[]) || []) as { text: string; index: number }[];
    const height = contentRef.current?.clientHeight || 600;
    const pages = paginateSentences(sentences, height, fontSize);
    if (currentPage < pages.length - 1) {
      flipToPage(currentPage + 1);
    }
  }, [doc, currentPage, fontSize, flipToPage]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0) {
      flipToPage(currentPage - 1);
    }
  }, [currentPage, flipToPage]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (pageMode !== 'flip' || flipAnimating) return;
    const touch = e.touches[0];
    swipeStartX.current = touch.clientX;
    setIsUserSwiping(true);
    setFlipOffset(0);
  }, [pageMode, flipAnimating]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isUserSwiping || flipAnimating) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeStartX.current;
    containerWidth.current = contentRef.current?.clientWidth || 360;

    const maxOffset = containerWidth.current;
    const clamped = Math.max(-maxOffset, Math.min(maxOffset, deltaX));

    if (!doc) return;
    const sentences = ((doc.sentences as unknown[]) || []) as { text: string; index: number }[];
    const height = contentRef.current?.clientHeight || 600;
    const pages = paginateSentences(sentences, height, fontSize);

    if ((clamped < 0 && currentPage >= pages.length - 1) ||
        (clamped > 0 && currentPage <= 0)) {
      setFlipOffset(clamped * 0.3);
    } else {
      setFlipOffset(clamped);
    }
  }, [isUserSwiping, flipAnimating, doc, currentPage, fontSize]);

  const handleTouchEnd = useCallback(() => {
    if (!isUserSwiping) return;
    setIsUserSwiping(false);

    const threshold = containerWidth.current * 0.25;

    if (flipOffset < -threshold) {
      goToNextPage();
    } else if (flipOffset > threshold) {
      goToPrevPage();
    } else {
      setFlipAnimating(true);
      setFlipOffset(0);
      setTimeout(() => setFlipAnimating(false), 350);
    }
  }, [isUserSwiping, flipOffset, goToNextPage, goToPrevPage]);

  /** 键盘翻页支持 */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pageMode !== 'flip' || flipAnimating) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageMode, flipAnimating, goToNextPage, goToPrevPage]);

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
      </div>
    );
  }

  const sentences = ((doc.sentences as unknown[]) || []) as { text: string; index: number }[];
  const content = sentences.map((s) => s.text).join('');

  const pages = paginateSentences(sentences, contentRef.current?.clientHeight || 600, fontSize);
  const pageText = pages.map((p) => p.join(''));

  const pageBg = theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-[#f5f0eb]';
  const pageBgRaw = theme === 'dark' ? '#1a1a2e' : '#f5f0eb';
  const textColor = theme === 'dark' ? 'text-[#e2e8f0]' : 'text-[#2d3436]';
  const borderColor = theme === 'dark' ? 'border-[#334155]' : 'border-[#e2e0dc]';

  const w = containerWidth.current || 360;
  const flipProgress = w > 0 ? flipOffset / w : 0;
  const absProgress = Math.abs(flipProgress);
  const isForward = flipOffset < 0;
  const isBackward = flipOffset > 0;
  const isFlipping = isForward || isBackward;

  const useTransition = !isUserSwiping && (flipAnimating || flipOffset === 0);
  const transitionStyle = useTransition ? 'transform 0.35s cubic-bezier(0.2, 0.1, 0.05, 1)' : 'none';

  return (
    <div className={`h-full flex flex-col relative ${pageBg} ${textColor}`}>
      <Header
        title={doc.title}
        showBack
        onBack={handleBack}
        transparent
      />

      {/* 翻页模式 */}
      {pageMode === 'flip' ? (
        <div
          ref={contentRef}
          className="flex-1 relative overflow-hidden select-none"
          style={{ perspective: '1000px' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 下层页面 + 折叠线投影 */}
          {isForward && currentPage < pages.length - 1 && (
            <div className="absolute inset-0 px-6 py-6 overflow-y-auto" style={{ zIndex: 1, backgroundColor: pageBgRaw }}>
              <div className={fontSizes[fontSize]}>
                {pages[currentPage + 1].map((text, i) => (
                  <p key={i} className="mb-1 text-justify">{text}</p>
                ))}
              </div>
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  right: 0,
                  width: `${40 + absProgress * 40}px`,
                  background: `linear-gradient(to left, rgba(0,0,0,${0.08 + absProgress * 0.12}), transparent)`,
                }}
              />
            </div>
          )}
          {isBackward && currentPage > 0 && (
            <div className="absolute inset-0 px-6 py-6 overflow-y-auto" style={{ zIndex: 1, backgroundColor: pageBgRaw }}>
              <div className={fontSizes[fontSize]}>
                {pages[currentPage].map((text, i) => (
                  <p key={i} className="mb-1 text-justify">{text}</p>
                ))}
              </div>
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: 0,
                  width: `${40 + absProgress * 40}px`,
                  background: `linear-gradient(to right, rgba(0,0,0,${0.08 + absProgress * 0.12}), transparent)`,
                }}
              />
            </div>
          )}

          {/* 翻起的页面（当前页或前一页） */}
          {isFlipping && (
            <div
              className="absolute inset-0"
              style={{
                zIndex: 10,
                transformStyle: 'preserve-3d',
                transform: isForward
                  ? `rotateY(${-absProgress * 90}deg)`
                  : `rotateY(${(1 - absProgress) * 90}deg)`,
                transformOrigin: isForward ? 'right center' : 'left center',
                transition: transitionStyle,
                backfaceVisibility: 'hidden',
              }}
            >
              <div
                className="absolute inset-0 px-6 py-6 overflow-y-auto"
                style={{ backgroundColor: pageBgRaw, backfaceVisibility: 'hidden' }}
              >
                <div className={fontSizes[fontSize]}>
                  {isForward
                    ? pages[currentPage]?.map((text, i) => (
                        <p key={i} className="mb-1 text-justify">{text}</p>
                      ))
                    : pages[currentPage - 1]?.map((text, i) => (
                        <p key={i} className="mb-1 text-justify">{text}</p>
                      ))
                  }
                </div>
              </div>

              {/* 卷曲内侧阴影 - 模拟纸张弯曲折痕 */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isForward
                    ? `linear-gradient(to right, rgba(0,0,0,${0.04 + absProgress * 0.08}) 0%, rgba(0,0,0,${absProgress * 0.02}) 30%, transparent 60%)`
                    : `linear-gradient(to left, rgba(0,0,0,${0.04 + absProgress * 0.08}) 0%, rgba(0,0,0,${absProgress * 0.02}) 30%, transparent 60%)`,
                }}
              />

              {/* 翻起页外侧边缘阴影 */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  [isForward ? 'right' : 'left']: 0,
                  width: '20px',
                  background: isForward
                    ? `linear-gradient(to left, rgba(0,0,0,${0.06 + absProgress * 0.1}), transparent)`
                    : `linear-gradient(to right, rgba(0,0,0,${0.06 + absProgress * 0.1}), transparent)`,
                }}
              />
            </div>
          )}

          {/* 未在翻页时显示正常当前页 */}
          {!isFlipping && (
            <div className="absolute inset-0 px-6 py-6 overflow-y-auto" style={{ zIndex: 10, backgroundColor: pageBgRaw }}>
              <div className={fontSizes[fontSize]}>
                {pages[currentPage]?.map((text, i) => (
                  <p key={i} className="mb-1 text-justify">{text}</p>
                ))}
              </div>
            </div>
          )}

          {/* 折叠线 - 模拟纸张厚度 */}
          {isFlipping && absProgress > 0.05 && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                zIndex: 20,
                [isForward ? 'right' : 'left']: isForward
                  ? `${(1 - absProgress) * 100}%`
                  : `${absProgress * 100}%`,
                width: '2px',
                marginLeft: isForward ? '-1px' : '-1px',
                background: `rgba(0,0,0,${0.05 + absProgress * 0.08})`,
                boxShadow: isForward
                  ? `-1px 0 3px rgba(0,0,0,${absProgress * 0.1})`
                  : `1px 0 3px rgba(0,0,0,${absProgress * 0.1})`,
                transition: 'none',
              }}
            />
          )}

          {/* 翻页指示器 */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 30 }}>
            <span className="text-xs text-text-muted/50 bg-surface-card/70 px-3 py-1 rounded-full">
              {currentPage + 1} / {pages.length}
            </span>
          </div>

          {/* 左/右轻触翻页 */}
          <button
            className="absolute left-0 top-0 bottom-0 w-[25%] z-30"
            onClick={() => { if (!flipAnimating && !isUserSwiping) goToPrevPage(); }}
          />
          <button
            className="absolute right-0 top-0 bottom-0 w-[25%] z-30"
            onClick={() => { if (!flipAnimating && !isUserSwiping) goToNextPage(); }}
          />
        </div>
      ) : (
        /* 上下滑动模式 */
        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 pt-2 pb-4">
          <div className={fontSizes[fontSize]}>
            {sentences.map((s, i) => (
              <p key={i} className="mb-1 text-justify">
                {s.text}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 底部导航栏 */}
      <div className={`flex items-center justify-around px-4 py-3 border-t ${borderColor} ${pageBg}`}>
        <button
          onClick={() => setShowToc(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span className="text-[10px] opacity-60">目录</span>
        </button>

        <button
          onClick={() => setShowIntro(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="text-[10px] opacity-60">简介</span>
        </button>

        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-0.5 px-2 py-1"
        >
          {theme === 'dark' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          <span className="text-[10px] opacity-60">{theme === 'dark' ? '日间' : '夜间'}</span>
        </button>

        <button
          onClick={togglePageMode}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 ${pageMode === 'flip' ? 'opacity-100' : 'opacity-60'}`}
        >
          {pageMode === 'flip' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="18" rx="1" />
              <rect x="14" y="3" width="7" height="18" rx="1" />
              <line x1="10" y1="3" x2="14" y2="3" />
              <line x1="10" y1="21" x2="14" y2="21" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="2" x2="21" y2="2" />
              <line x1="8" y1="8" x2="21" y2="8" />
              <line x1="8" y1="14" x2="21" y2="14" />
              <line x1="8" y1="20" x2="21" y2="20" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          )}
          <span className="text-[10px]">{pageMode === 'flip' ? '翻页' : '滚动'}</span>
        </button>

        <button
          onClick={() => setShowFontSize(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
          <span className="text-[10px] opacity-60">字号</span>
        </button>
      </div>

      {/* 目录弹窗 */}
      <BottomSheet open={showToc} onClose={() => setShowToc(false)} title="目录">
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 bg-surface-card rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-text">{doc.title}</p>
              <p className="text-xs text-text-muted">{sentences.length} 句</p>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* 简介弹窗 */}
      <BottomSheet open={showIntro} onClose={() => setShowIntro(false)} title="书籍信息">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-text">{doc.title}</h3>
              <p className="text-xs text-text-muted">{doc.format.toUpperCase()} · {doc.wordCount.toLocaleString()} 字</p>
            </div>
          </div>
          <div className="bg-surface-card rounded-xl p-4">
            <p className="text-sm text-text/70 leading-relaxed">
              {content.length > 200 ? content.slice(0, 200) + '...' : content}
            </p>
          </div>
          <div className="flex gap-3 text-xs text-text-muted">
            <span>共 {sentences.length} 句</span>
            <span>{doc.wordCount.toLocaleString()} 字</span>
          </div>
        </div>
      </BottomSheet>

      {/* 字体大小弹窗 */}
      <BottomSheet open={showFontSize} onClose={() => setShowFontSize(false)} title="字体大小">
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-surface-card rounded-xl p-1">
            {FONT_SIZE_LABELS.map((s) => (
              <button
                key={s.key}
                onClick={() => setFontSize(s.key)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                  fontSize === s.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex justify-center py-3">
            <span className={`${fontSizes[fontSize]} font-medium text-text`}>
              Aa 预览效果
            </span>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

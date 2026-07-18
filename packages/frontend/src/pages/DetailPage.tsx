/**
 * 文档详情页面
 *
 * 展示单个文档的元信息（格式、字数、句数、导入时间），提供：
 * - 正文内容预览（支持展开/收起）
 * - 加入书架 / 直接阅读入口
 * - 书名编辑功能
 * - 阅读速度选择器
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { showToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { formatDate, SPEED_OPTIONS, type SpeedOption } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import type { Document } from '@/types';

// 文档信息统计卡片配置：key、展示标签、图标名、颜色主题
const STAT_CONFIG = [
  { key: 'format', label: '格式', icon: 'file', color: 'text-violet-500', bg: 'bg-violet-50' },
  { key: 'wordCount', label: '字数', icon: 'text', color: 'text-sky-500', bg: 'bg-sky-50' },
  { key: 'sentenceCount', label: '句数', icon: 'list', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { key: 'importedAt', label: '导入时间', icon: 'clock', color: 'text-amber-500', bg: 'bg-amber-50' },
] as const;

// 统计项图标纯组件：根据 name 返回不同的 SVG 图标
function StatIcon({ name }: { name: string }) {
  const cls = 'w-4 h-4';
  switch (name) {
    case 'file':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
    case 'text':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
    case 'list':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
    case 'clock':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    default:
      return null;
  }
}

export function DetailPage() {
  const { docId } = useParams<{ docId: string }>();
  // 文档详情数据
  const [doc, setDoc] = useState<Document | null>(null);
  // 加载状态
  const [loading, setLoading] = useState(true);
  // 是否已加入书架
  const [inBookshelf, setInBookshelf] = useState(false);
  // 是否显示"加入书架"提示弹窗
  const [showPrompt, setShowPrompt] = useState(false);
  // 编辑书名时输入的标题
  const [editTitle, setEditTitle] = useState('');
  // 是否显示编辑书名弹窗
  const [showEdit, setShowEdit] = useState(false);
  // 正文预览是否展开
  const [previewExpanded, setPreviewExpanded] = useState(false);
  // 阅读速度选择
  const [speed, setSpeed] = useState<SpeedOption>(1.0);
  const navigate = useNavigate();
  const { readingMode } = useSettingsStore();

  const getReaderPath = useCallback(() => {
    return readingMode === 'immersive' ? `/immersive-reader/${docId}` : `/reader/${docId}`;
  }, [readingMode, docId]);

  // URL 参数 docId 变化时重新加载文档
  useEffect(() => {
    if (docId) loadDocument(docId);
  }, [docId]);

  // 加载文档详情，同时查询书架判断是否已加入
  const loadDocument = async (id: string) => {
    setLoading(true);
    const res = await api.get<Document>(`/documents/${id}`);
    if (res.success && res.data) {
      setDoc(res.data);
      setEditTitle(res.data.title);

      const shelfRes = await api.get(`/bookshelf?search=${encodeURIComponent(res.data.title)}`);
      if (shelfRes.success && shelfRes.data && Array.isArray(shelfRes.data) && shelfRes.data.length > 0) {
        setInBookshelf(true);
      } else {
        setShowPrompt(true);
      }
    }
    setLoading(false);
  };

  // 加入书架：调用后端 POST 接口，成功后更新本地状态
  const handleAddToBookshelf = async () => {
    if (!docId) return;
    const res = await api.post('/bookshelf', { docId });
    if (res.success) {
      setInBookshelf(true);
      showToast('已加入书架', 'success');
      setShowPrompt(false);
    }
  };

  // 更新书名：调用后端 PUT 接口，成功后重新加载文档
  const handleUpdateTitle = async () => {
    if (!docId || !editTitle.trim()) return;
    const res = await api.put(`/documents/${docId}/title`, { title: editTitle.trim() });
    if (res.success) {
      showToast('书名已更新', 'success');
      setShowEdit(false);
      loadDocument(docId);
    }
  };

  // 提取句子数组，用于字数统计和预览展示
  const sentences = ((doc?.sentences as unknown[]) || []) as { text: string }[];

  // ---- 渲染：加载中状态 ----
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-surface">
        <Header title="加载中..." showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-5 fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin w-8 h-8 text-primary/30" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-text-muted">加载文档信息...</p>
          </div>
        </div>
      </div>
    );
  }

  // ---- 渲染：文档不存在 ----
  if (!doc) {
    return (
      <div className="h-full flex flex-col bg-surface">
        <Header title="文档详情" showBack />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
          <div className="w-20 h-20 rounded-full bg-surface-card flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-text font-medium">文档不存在</p>
          <p className="text-text-muted text-sm -mt-3">该文档可能已被删除</p>
          <Button onClick={() => navigate('/')} className="mt-2">返回首页</Button>
        </div>
      </div>
    );
  }

  // 将文档字段映射到统计卡片展示值
  const statValues: Record<string, string> = {
    format: doc.format.toUpperCase(),
    wordCount: doc.wordCount.toLocaleString(),
    sentenceCount: String(sentences.length),
    importedAt: formatDate(doc.importedAt),
  };

  // 正文预览：默认显示前 20 句，可展开
  const previewSentences = previewExpanded ? sentences : sentences.slice(0, 20);
  const hasMore = sentences.length > 20;

  return (
    <div className="h-full flex flex-col bg-surface">
      <Header
        title=""
        showBack
        action={
          <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)} className="!w-9 !h-9 !p-0 !rounded-full">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
          <div className="relative px-6 pt-8 pb-6">
          <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/6 to-transparent pointer-events-none" />

          <div className="relative flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg shadow-black/5 flex items-center justify-center flex-shrink-0 ring-1 ring-black/5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <line x1="8" y1="7" x2="16" y2="7"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-xl font-bold text-text leading-tight line-clamp-2">{doc.title}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
                  {doc.format.toUpperCase()}
                </span>
                {inBookshelf && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[11px] font-medium">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    已加入书架
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {STAT_CONFIG.map(({ key, label, icon, color, bg }) => (
              <div key={key} className={`${bg} rounded-xl p-3 flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center ${color}`}>
                  <StatIcon name={icon} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-semibold text-text truncate">{statValues[key]}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-primary" />
              <h2 className="text-sm font-semibold text-text">正文预览</h2>
            </div>
            <div className="relative rounded-2xl bg-surface-card border border-border/40 overflow-hidden">
              <div className={`p-4 overflow-y-auto ${previewExpanded ? 'max-h-96' : 'max-h-52'}`}>
                <p className="text-sm text-text/80 leading-7 whitespace-pre-wrap selection:bg-primary/20">
                  {previewSentences.map((s) => s.text).join('')}
                  {hasMore && !previewExpanded && (
                    <span className="text-text-muted/40 select-none">...</span>
                  )}
                </p>
              </div>
              {!previewExpanded && hasMore && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface-card to-transparent pointer-events-none" />
              )}
            </div>
            {hasMore && (
              <button
                onClick={() => setPreviewExpanded(!previewExpanded)}
                className="w-full mt-2 py-2 text-xs text-primary font-medium hover:bg-primary/5 rounded-xl transition-colors"
              >
                {previewExpanded ? '收起预览' : `展开全部（共 ${sentences.length} 句）`}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-border/60 bg-surface/95 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-0.5 bg-surface-card rounded-lg p-0.5 flex-shrink-0">
            {[0.75, 1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s as SpeedOption)}
                className={`min-w-[36px] h-7 flex items-center justify-center rounded-md text-[11px] font-semibold transition-colors ${
                  speed === s
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text hover:bg-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {inBookshelf ? (
            <Button className="flex-1 h-11 text-sm shadow-lg shadow-primary/20" onClick={() => navigate(getReaderPath(), { state: { speed } })}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              继续阅读
            </Button>
          ) : (
            <div className="flex gap-2 flex-1">
              <Button variant="secondary" className="flex-1 h-11 text-sm" onClick={handleAddToBookshelf}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                加入书架
              </Button>
              <Button className="flex-1 h-11 text-sm shadow-lg shadow-primary/20" onClick={() => navigate(getReaderPath(), { state: { speed } })}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                开始阅读
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={showPrompt && !inBookshelf}
        onClose={() => setShowPrompt(false)}
        title="加入书架"
      >
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <p className="text-sm text-text-muted mb-5">加入书架后可记录阅读进度，<br/>下次继续阅读时无需从头开始。</p>
        </div>
        <div className="space-y-2">
          <Button className="w-full h-11" onClick={handleAddToBookshelf}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            加入书架
          </Button>
          <Button variant="secondary" className="w-full h-11" onClick={() => { setShowPrompt(false); navigate(getReaderPath(), { state: { speed } }); }}>
            直接阅读
          </Button>
          <Button variant="ghost" className="w-full h-11" onClick={() => setShowPrompt(false)}>
            暂不加入
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="编辑书名"
      >
        <div className="mb-5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <input
            className="w-full h-12 px-4 rounded-xl border-2 border-border bg-surface text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="输入新书名"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1 h-11" onClick={() => setShowEdit(false)}>取消</Button>
          <Button className="flex-1 h-11" onClick={handleUpdateTitle}>保存</Button>
        </div>
      </Dialog>
    </div>
  );
}

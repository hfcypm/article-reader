import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { showToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useLongPress } from '@/lib/useLongPress';
import type { DocumentSummary, BookshelfItem } from '@/types';

/**
 * 文档导入状态机类型
 * idle: 空闲 | checking: 检查重复 | parsing: 解析中 | success: 完成 | error: 失败
 */
type ImportState = {
  status: 'idle' | 'checking' | 'parsing' | 'success' | 'error';
  fileName: string;
  docId?: string;
  errorMsg?: string;
  title?: string;
  format?: string;
  wordCount?: number;
  sentenceCount?: number;
  progress?: number;
};

/**
 * 首页 - 文档导入入口、最近导入列表和继续阅读推荐
 */
export function HomePage() {
  /** 最近导入的文档列表 */
  const [recentImports, setRecentImports] = useState<DocumentSummary[]>([]);
  /** 继续阅读推荐列表 */
  const [continueReading, setContinueReading] = useState<BookshelfItem[]>([]);
  /** 页面加载中 */
  const [loading, setLoading] = useState(true);
  /** 导入流程状态 */
  const [importState, setImportState] = useState<ImportState>({ status: 'idle', fileName: '' });
  /** 待删除的文档 */
  const [deleteTarget, setDeleteTarget] = useState<DocumentSummary | null>(null);
  /** 删除操作进行中 */
  const [deleting, setDeleting] = useState(false);
  /** 进度条显示值（用于动画平滑过渡） */
  const [displayProgress, setDisplayProgress] = useState(0);
  /** 服务端返回的真实进度值 */
  const serverProgressRef = useRef(0);
  /** 前端自增目标进度值 */
  const selfTargetRef = useRef(0);
  /** 文件选择器引用 */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  /** 初次加载时获取最近导入和继续阅读数据 */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * 导入进度动画效果 - 前端自增进度条线性增长，同时追赶服务端真实进度
   */
  useEffect(() => {
    if (importState.status !== 'checking' && importState.status !== 'parsing') {
      setDisplayProgress(0);
      serverProgressRef.current = 0;
      selfTargetRef.current = 0;
      return;
    }

    setDisplayProgress(0);
    serverProgressRef.current = 0;
    selfTargetRef.current = 0;

    const timer = setInterval(() => {
      selfTargetRef.current = Math.min(selfTargetRef.current + 0.5, 70);
      const effectiveTarget = Math.max(serverProgressRef.current, selfTargetRef.current);

      setDisplayProgress((prev) => {
        if (prev >= effectiveTarget) return prev;
        const step = Math.max(0.3, (effectiveTarget - prev) * 0.05);
        return Math.min(prev + step, effectiveTarget);
      });
    }, 50);

    return () => clearInterval(timer);
  }, [importState.status]);

  /** 并行加载最近导入和继续阅读数据 */
  const loadData = async () => {
    setLoading(true);
    const [recentRes, continueRes] = await Promise.all([
      api.get<DocumentSummary[]>('/documents/recent'),
      api.get<BookshelfItem[]>('/bookshelf/continue-reading'),
    ]);
    if (recentRes.success && recentRes.data) setRecentImports(recentRes.data);
    if (continueRes.success && continueRes.data) setContinueReading(continueRes.data);
    setLoading(false);
  };

  /**
   * 处理文件导入 - 校验文件格式和大小，检查重复，上传并轮询解析进度
   */
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (!['txt', 'mobi', 'pdf', 'mp3', 'mp4'].includes(ext)) {
      showToast('仅支持 TXT、MOBI、PDF、MP3、MP4 格式', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('文件大小超过 50MB 限制', 'error');
      e.target.value = '';
      return;
    }

    setImportState({ status: 'checking', fileName, progress: 0 });

    const dup = await api.post<{ exists: boolean }>('/documents/check-duplicate', { fileName });
    if (dup.data?.exists) {
      setImportState({ status: 'error', fileName, errorMsg: '该文件已导入', progress: 0 });
      e.target.value = '';
      return;
    }

    setImportState({ status: 'parsing', fileName, progress: 0 });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post<{ id: string }>('/documents/import', formData);
      if (!res.success || !res.data) {
        setImportState({ status: 'error', fileName, errorMsg: res.error || '导入失败', progress: 0 });
        e.target.value = '';
        return;
      }

      const docId = res.data.id;
      let successData: { title: string; format: string; wordCount: number; sentenceCount: number } | null = null;

      const pollProgress = async () => {
        const isMedia = /\.(mp3|mp4)$/i.test(fileName);
        const maxRetries = isMedia ? 1200 : 120;
        for (let i = 0; i < maxRetries; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const progressRes = await api.get<{
            status: string; progress: number; title: string;
            format: string; wordCount: number; sentenceCount: number;
          }>(`/documents/${docId}/progress`);

          if (!progressRes.success || !progressRes.data) continue;

          const { status, progress, title, format, wordCount, sentenceCount } = progressRes.data;
          serverProgressRef.current = progress;

          if (status === 'failed') {
            setImportState({ status: 'error', fileName, errorMsg: '解析失败', progress: 0 });
            return;
          }

          setImportState({
            status: 'parsing',
            fileName,
            docId,
            progress,
          });

          if (status === 'completed') {
            serverProgressRef.current = 100;
            selfTargetRef.current = 100;
            successData = {
              title: title || fileName.replace(/\.[^.]+$/, ''),
              format: format || ext,
              wordCount,
              sentenceCount,
            };
            await new Promise((r) => setTimeout(r, 1000));
            setImportState({
              status: 'success',
              fileName,
              docId,
              ...successData,
              progress: 100,
            });
            return;
          }
        }
        setImportState({ status: 'error', fileName, errorMsg: '处理超时，请重试', progress: 0 });
      };

      pollProgress();
    } catch {
      setImportState({ status: 'error', fileName, errorMsg: '导入请求失败，请重试', progress: 0 });
    }
    e.target.value = '';
  };

  /** 关闭导入对话框 - 导入成功时跳转到详情页 */
  const handleCloseImportDialog = () => {
    if (importState.status === 'success' && importState.docId) {
      navigate(`/detail/${importState.docId}`);
    }
    setImportState({ status: 'idle', fileName: '' });
  };

  /** 删除指定文档 */
  const handleDeleteDocument = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await api.delete(`/documents/${deleteTarget.id}`);
    if (res.success) {
      showToast(`「${deleteTarget.title}」已删除`, 'success');
      setRecentImports((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    } else {
      showToast(res.error || '删除失败', 'error');
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  useEffect(() => {
    if (importState.status === 'success' || importState.status === 'error') return;
  }, [importState.status]);

  /** 是否正在导入中 */
  const isImporting = importState.status === 'checking' || importState.status === 'parsing';

  /**
   * 最近导入项子组件 - 展示单个文档摘要信息
   */
  function RecentImportItem({ doc }: { doc: DocumentSummary }) {
    const { handlers } = useLongPress(() => setDeleteTarget(doc));

    return (
      /* 文档摘要卡片 */
      <button
        onClick={() => navigate(`/detail/${doc.id}`)}
        className="w-full"
        {...handlers}
      >
        <Card className="flex items-center gap-4 book-card p-5">
           <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-text truncate">{doc.title}</p>
            <p className="text-xs text-text-muted">{formatDate(doc.importedAt)}</p>
          </div>
          <Badge variant="default">{doc.format.toUpperCase()}</Badge>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Card>
      </button>
    );
  }

  return (
    <div className="page">
      <div className="flex flex-col p-4 pt-6 fade-in">
        {/* 页面标题 */}
        <h1 className="text-xl font-bold text-text mb-8">{t('home.title')}</h1>

        {/* 隐藏的文件选择器 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.mobi,.pdf,.mp3,.mp4"
          className="hidden"
          onChange={handleImport}
        />

        {/* 文档导入区域 - 点击触发文件选择器 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 rounded-2xl border-2 border-dashed border-primary/30
           bg-primary/5 flex flex-col items-center justify-center gap-3 mb-8
            hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <span className="text-sm font-medium text-primary">{t('home.import')}</span>
          <span className="text-xs text-text-muted">{t('home.import.hint')}</span>
        </button>

        {continueReading.length > 0 && (
           /* 继续阅读推荐区域 */
           <section className="mb-10">
            <h2 className="text-base font-semibold text-text mb-6">{t('home.continueReading')}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              {continueReading.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/reader/${item.docId}`)}
                  className="flex-shrink-0 w-36 snap-start"
                >
                   <Card className="h-full book-card flex flex-col gap-4 text-left p-5">
                    <div className="flex-1">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-text line-clamp-2">{item.title}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-text-muted">{Math.round(item.progress * 100)}%</span>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
           {/* 最近导入区域 */}
           <h2 className="text-base font-semibold text-text mb-6">{t('home.recentImport')}</h2>
          {loading ? (
            <div className="text-center py-12 text-text-muted text-sm">{t('home.loading')}</div>
          ) : recentImports.length === 0 ? (
            <EmptyState
              title={t('home.noImports')}
              description={t('home.noImports.desc')}
            />
          ) : (
            <div className="space-y-4">
              {recentImports.map((doc) => (
                <RecentImportItem key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 导入进度对话框 */}
      <Dialog
        open={importState.status !== 'idle'}
        onClose={handleCloseImportDialog}
        closable={!isImporting}
        title={
          importState.status === 'checking' ? '正在检查...' :
            importState.status === 'parsing' ? '正在解析...' :
              importState.status === 'success' ? '导入完成' :
                '导入失败'
        }
      >
        {isImporting && (
          /* 导入进行中 - 显示进度与步骤 */
          <div className="flex flex-col items-center py-5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>

            <p className="text-5xl font-bold text-primary mb-3 tabular-nums">
              {Math.round(displayProgress)}%
            </p>

            <div className="w-full space-y-2 mb-4">
              <div className={cn(
                'flex items-center gap-2 text-xs',
                importState.status === 'checking' ? 'text-primary font-medium' : 'text-text-muted/40'
              )}>
                <div className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
                  importState.status === 'checking' ? 'bg-primary text-white' :
                  importState.status === 'parsing' ? 'bg-accent-green text-white' : 'bg-border text-text-muted/40'
                )}>
                  {importState.status === 'checking' ? (
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" />
                    </svg>
                  ) : importState.status === 'parsing' ? (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : '1'}
                </div>
                <span>检查文件重复</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
                  importState.status === 'parsing' ? 'bg-primary text-white' : 'bg-border text-text-muted/40'
                )}>
                  {importState.status === 'parsing' ? (
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" />
                    </svg>
                  ) : '2'}
                </div>
                <span className={importState.status === 'parsing' ? 'text-primary font-medium' : 'text-text-muted/40'}>
                  {/\.(mp3|mp4)$/i.test(importState.fileName) ? '语音识别' : '解析文本内容'}
                </span>
              </div>
            </div>

            <div className="w-full bg-border rounded-full overflow-hidden h-1.5 mb-3">
              <div
                className="h-full bg-primary rounded-full transition-none"
                style={{ width: `${Math.min(displayProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-text-muted/60 truncate max-w-full px-4">{importState.fileName}</p>
          </div>
        )}

        {importState.status === 'success' && (
          /* 导入成功 - 展示文档摘要信息 */
          <div className="flex flex-col items-center py-2">
            <div className="w-14 h-14 rounded-full bg-accent-green/10 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text mb-3 text-center truncate max-w-full px-2">{importState.title}</p>
            <div className="grid grid-cols-3 gap-3 w-full mb-4">
              <div className="bg-surface-card rounded-xl py-2 text-center">
                <p className="text-lg font-bold text-primary">{importState.format?.toUpperCase() || '-'}</p>
                <p className="text-[10px] text-text-muted">格式</p>
              </div>
              <div className="bg-surface-card rounded-xl py-2 text-center">
                <p className="text-lg font-bold text-text">{(importState.wordCount || 0).toLocaleString()}</p>
                <p className="text-[10px] text-text-muted">字数</p>
              </div>
              <div className="bg-surface-card rounded-xl py-2 text-center">
                <p className="text-lg font-bold text-accent-green">{importState.sentenceCount || 0}</p>
                <p className="text-[10px] text-text-muted">句子</p>
              </div>
            </div>
            <Button className="w-full" onClick={handleCloseImportDialog}>
              查看详情
            </Button>
          </div>
        )}

        {importState.status === 'error' && (
          /* 导入失败 - 展示错误信息和重试入口 */
          <div className="flex flex-col items-center py-2">
            <div className="w-14 h-14 rounded-full bg-accent-red/10 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text mb-1">导入失败</p>
            <p className="text-xs text-text-muted mb-4">{importState.errorMsg}</p>
            <div className="flex gap-2 w-full">
              <Button variant="secondary" className="flex-1" onClick={handleCloseImportDialog}>
                关闭
              </Button>
              <Button className="flex-1" onClick={() => { setImportState({ status: 'idle', fileName: '' }); fileInputRef.current?.click(); }}>
                重新选择
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* 确认删除对话框 */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="确认删除"
      >
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-accent-red/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="text-sm text-text-muted mb-1">
            确定要删除「{deleteTarget?.title}」吗？
          </p>
          <p className="text-xs text-text-muted/60">删除后无法恢复</p>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" className="flex-1 h-11" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            取消
          </Button>
          <Button variant="danger" className="flex-1 h-11" onClick={handleDeleteDocument} disabled={deleting}>
            {deleting ? '删除中...' : '确认删除'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { showToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useLongPress } from '@/lib/useLongPress';
import type { BookshelfItem, SortBy } from '@/types';

/**
 * 书架页面 - 展示已加入书架的所有文档，支持搜索、排序和移除操作
 */
export function BookshelfPage() {
  /** 书架中的所有文档列表 */
  const [items, setItems] = useState<BookshelfItem[]>([]);
  /** 数据加载中标记 */
  const [loading, setLoading] = useState(true);
  /** 当前排序方式 */
  const [sortBy, setSortBy] = useState<SortBy>('lastReadAt');
  /** 搜索关键词 */
  const [searchQuery, setSearchQuery] = useState('');
  /** 搜索进行中标记 */
  const [searching, setSearching] = useState(false);
  /** 待删除的文档项 */
  const [deleteTarget, setDeleteTarget] = useState<BookshelfItem | null>(null);
  /** 删除操作进行中标记 */
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  /** 排序方式变更时重新加载书架 */
  useEffect(() => {
    loadBookshelf();
  }, [sortBy]);

  /** 从 API 加载书架数据 */
  const loadBookshelf = async () => {
    setLoading(true);
    const res = await api.get<BookshelfItem[]>(`/bookshelf?sortBy=${sortBy}`);
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  };

  /** 根据搜索关键词查询书架 */
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadBookshelf();
      return;
    }
    setSearching(true);
    const res = await api.get<BookshelfItem[]>(`/bookshelf?search=${encodeURIComponent(searchQuery)}`);
    if (res.success && res.data) setItems(res.data);
    setSearching(false);
  };

  /** 从书架上移除指定文档 */
  const handleRemove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await api.delete(`/bookshelf/${deleteTarget.id}`);
    if (res.success) {
      showToast(`「${deleteTarget.title}」已从书架移除`, 'success');
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } else {
      showToast(res.error || '移除失败', 'error');
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  /**
   * 书架卡片子组件 - 展示单本书籍的封面、进度和操作按钮
   */
  function ShelfCard({ item }: { item: BookshelfItem }) {
    const { handlers } = useLongPress(() => setDeleteTarget(item));

    return (
      <div className="relative group">
        <button
          onClick={() => navigate(`/detail/${item.docId}`)}
          className="w-full text-left"
          {...handlers}
        >
          <Card className="h-full book-card flex flex-col gap-3">
            <div className="flex items-start justify-between">
              {/* 书籍图标 */}
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              {/* 长按移除按钮（悬停显示） */}
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-accent-red/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
            <div className="flex-1">
              {/* 书名 */}
              <p className="text-sm font-medium text-text line-clamp-2 mb-1">{item.title}</p>
              {/* 格式标签 */}
              <div className="flex items-center gap-1 mb-2">
                <Badge variant="default" className="!text-[10px]">{item.format.toUpperCase()}</Badge>
              </div>
            </div>
            <div>
              {/* 阅读进度条 */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-text-muted">进度</span>
                <span className="text-[10px] text-primary font-medium">{Math.round(item.progress * 100)}%</span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round(item.progress * 100)}%` }} />
              </div>
            </div>
            {item.currentSentence > 0 && (
              /* 继续阅读按钮（有阅读进度时显示） */
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); navigate(`/reader/${item.docId}`); }}
                className="w-full !text-xs"
              >
                继续阅读
              </Button>
            )}
          </Card>
        </button>
      </div>
    );
  }

  /** 排序方式选项 */
  const sortOptions: { key: SortBy; label: string }[] = [
    { key: 'lastReadAt', label: '最近阅读' },
    { key: 'addedAt', label: '加入时间' },
    { key: 'title', label: '书名' },
  ];

  return (
    <div className="page">
      <div className="pt-7 pb-10 fade-in">
        {/* 页面标题 */}
        <h1 className="text-xl font-bold text-text mb-6">{t('bookshelf')}</h1>

        {/* 搜索栏 */}
        <div className="flex gap-2.5 mb-6">
          <Input
            placeholder={t('bookshelf.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button variant="secondary" size="md" onClick={handleSearch} disabled={searching}>
            {t('bookshelf.search')}
          </Button>
        </div>

        {/* 排序方式切换栏 */}
        <div className="flex gap-1.5 mb-6 p-1 bg-surface rounded-xl">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                sortBy === opt.key ? 'bg-surface-card text-text shadow-sm ring-1 ring-border/30' : 'text-text-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          /* 加载中状态 */
          <div className="text-center py-16 text-text-muted text-sm">{t('bookshelf.loading')}</div>
        ) : items.length === 0 ? (
          /* 书架为空状态 */
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
            title="书架为空"
            description="去 HOME 页导入文档并加入书架"
            action={
              <Button onClick={() => navigate('/')}>去导入</Button>
            }
          />
        ) : (
          /* 书架书籍网格 */
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <ShelfCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* 确认移除对话框 */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="确认移除"
      >
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-accent-red/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <p className="text-sm text-text-muted mb-1">
            确定要移除「{deleteTarget?.title}」吗？
          </p>
          <p className="text-xs text-text-muted/60">移除后阅读进度将丢失</p>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" className="flex-1 h-11" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            取消
          </Button>
          <Button variant="danger" className="flex-1 h-11" onClick={handleRemove} disabled={deleting}>
            {deleting ? '移除中...' : '确认移除'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

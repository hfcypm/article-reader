import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { showToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { BookshelfItem, SortBy } from '@/types';

export function BookshelfPage() {
  const [items, setItems] = useState<BookshelfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('lastReadAt');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadBookshelf();
  }, [sortBy]);

  const loadBookshelf = async () => {
    setLoading(true);
    const res = await api.get<BookshelfItem[]>(`/bookshelf?sortBy=${sortBy}`);
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  };

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

  const handleRemove = async (itemId: string, title: string) => {
    const res = await api.delete(`/bookshelf/${itemId}`);
    if (res.success) {
      showToast(`「${title}」已从书架移除`, 'success');
      loadBookshelf();
    }
  };

  const sortOptions: { key: SortBy; label: string }[] = [
    { key: 'lastReadAt', label: '最近阅读' },
    { key: 'addedAt', label: '加入时间' },
    { key: 'title', label: '书名' },
  ];

  return (
    <div className="page">
      <div className="p-4 pt-6 fade-in">
        <h1 className="text-xl font-bold text-text mb-4">我的书架</h1>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="搜索书名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button variant="secondary" size="md" onClick={handleSearch} disabled={searching}>
            搜索
          </Button>
        </div>

        <div className="flex gap-1 mb-4 p-1 bg-surface-card rounded-xl">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                sortBy === opt.key ? 'bg-white text-text shadow-sm' : 'text-text-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-text-muted text-sm">加载中...</div>
        ) : items.length === 0 ? (
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
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => navigate(`/detail/${item.docId}`)}
                  className="w-full text-left"
                >
                  <Card className="h-full book-card flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemove(item.id, item.title); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-accent-red/10"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text line-clamp-2 mb-1">{item.title}</p>
                      <div className="flex items-center gap-1 mb-2">
                        <Badge variant="default" className="!text-[10px]">{item.format.toUpperCase()}</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-text-muted">进度</span>
                        <span className="text-[10px] text-primary font-medium">{Math.round(item.progress * 100)}%</span>
                      </div>
                      <div className="h-1 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                      </div>
                    </div>
                    {item.currentSentence > 0 && (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

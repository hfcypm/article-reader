import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { showToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Document } from '@/types';

export function DetailPage() {
  const { docId } = useParams<{ docId: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [inBookshelf, setInBookshelf] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (docId) loadDocument(docId);
  }, [docId]);

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

  const handleAddToBookshelf = async () => {
    if (!docId) return;
    const res = await api.post('/bookshelf', { docId });
    if (res.success) {
      setInBookshelf(true);
      showToast('已加入书架', 'success');
      setShowPrompt(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!docId || !editTitle.trim()) return;
    const res = await api.put(`/documents/${docId}/title`, { title: editTitle.trim() });
    if (res.success) {
      showToast('书名已更新', 'success');
      setShowEdit(false);
      loadDocument(docId);
    }
  };

  const sentences = ((doc?.sentences as unknown[]) || []) as { text: string }[];

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

  return (
    <div className="h-full flex flex-col bg-surface">
      <Header
        title={doc.title}
        showBack
        action={
          <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)} className="!text-xs">
            编辑
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <Card className="mx-4 mt-4">
          <div className="grid grid-cols-2 gap-3 text-left">
            <div>
              <p className="text-xs text-text-muted">格式</p>
              <p className="text-sm font-medium text-text">{doc.format.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">字数</p>
              <p className="text-sm font-medium text-text">{doc.wordCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">句数</p>
              <p className="text-sm font-medium text-text">{sentences.length}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">导入时间</p>
              <p className="text-sm font-medium text-text">{formatDate(doc.importedAt)}</p>
            </div>
          </div>
        </Card>

        <div className="px-4 mt-4 mb-4">
          <h3 className="text-sm font-semibold text-text mb-2">正文预览</h3>
          <div className="rounded-xl bg-surface-card border border-border/50 p-4 max-h-60 overflow-y-auto">
            <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
              {sentences.slice(0, 20).map((s) => s.text).join('')}
              {sentences.length > 20 && (
                <span className="text-text-muted">...</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-surface">
        <div className="flex gap-3">
          {inBookshelf ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={() => navigate(`/reader/${docId}`)}>
                继续阅读
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" className="flex-1" onClick={handleAddToBookshelf}>
                加入书架
              </Button>
              <Button className="flex-1" onClick={() => navigate(`/reader/${docId}`)}>
                开始阅读
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog
        open={showPrompt && !inBookshelf}
        onClose={() => setShowPrompt(false)}
        title="是否加入书架？"
      >
        <p className="text-sm text-text-muted mb-6">加入书架后可记录阅读进度，方便下次续读。</p>
        <div className="space-y-2">
          <Button className="w-full" onClick={handleAddToBookshelf}>
            加入书架
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => { setShowPrompt(false); navigate(`/reader/${docId}`); }}>
            立即阅读
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setShowPrompt(false)}>
            暂不加入
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="编辑书名"
      >
        <div className="mb-4">
          <input
            className="w-full h-11 px-4 rounded-xl border-2 border-border text-sm text-text focus:outline-none focus:border-primary bg-surface"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="输入新书名"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setShowEdit(false)}>取消</Button>
          <Button className="flex-1" onClick={handleUpdateTitle}>保存</Button>
        </div>
      </Dialog>
    </div>
  );
}

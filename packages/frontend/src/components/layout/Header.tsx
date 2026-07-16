/**
 * Header 顶部导航栏组件
 * 顶部固定导航栏，支持返回按钮、标题和右侧操作区域，可切换透明/毛玻璃背景
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

/** Header 组件属性 */
interface HeaderProps {
  /** 页面标题（支持文字截断） */
  title: string;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 自定义返回操作（默认使用 navigate(-1)） */
  onBack?: () => void;
  /** 右侧操作区（按钮、图标等） */
  action?: React.ReactNode;
  /** 透明背景模式（用于沉浸式页面，如阅读器） */
  transparent?: boolean;
}

/**
 * Header — 顶部导航栏
 * sticky 定位在页面顶部，支持毛玻璃效果和自定义返回行为
 */
export function Header({ title, showBack, onBack, action, transparent }: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = onBack || (() => navigate(-1));

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between h-14 px-4 ${
        transparent ? 'bg-transparent' : 'bg-surface/95 backdrop-blur-lg border-b border-border'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="!w-9 !h-9 !p-0 !rounded-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Button>
        )}
        <h1 className="text-lg font-semibold text-text truncate">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}

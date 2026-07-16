/**
 * Dialog 弹窗组件
 * 模态对话框，支持半透明遮罩层、向上滑动动画、可选的标题和关闭按钮
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

/** Dialog 组件属性 */
interface DialogProps {
  /** 是否显示弹窗 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 弹窗标题（居中显示） */
  title?: string;
  children: ReactNode;
  className?: string;
  /** 是否允许点击遮罩关闭，默认 true */
  closable?: boolean;
}

/**
 * Dialog — 模态弹窗
 * 固定定位覆盖全屏，背景模糊遮罩，内容区域居中展示
 */
export function Dialog({ open, onClose, title, children, className, closable = true }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closable ? onClose : undefined}
      />
      <div
        className={cn(
          'relative w-full max-w-sm bg-surface rounded-2xl p-6 shadow-xl',
          'animate-slide-up',
          className
        )}
      >
        {title && (
          <h3 className="text-lg font-semibold text-text text-center mb-4">{title}</h3>
        )}
        {children}
      </div>
    </div>
  );
}

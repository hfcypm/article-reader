/**
 * ProgressBar 进度条组件
 * 支持确定进度和不确定（加载中）两种模式，可选百分比标签
 */

import { cn } from '@/lib/utils';

/** ProgressBar 组件属性 */
interface ProgressBarProps {
  /** 进度值（0~1），indeterminate 模式下忽略 */
  progress: number;
  className?: string;
  /** 是否显示百分比标签文字 */
  showLabel?: boolean;
  /** 进度条高度：sm（h-1）/ md（h-1.5） */
  size?: 'sm' | 'md';
  /** 不确定进度模式（显示循环动画），用于加载中场景 */
  indeterminate?: boolean;
}

/**
 * ProgressBar — 进度条
 * indeterminate 为 true 时渲染带动画的无限进度条
 * 否则渲染带过渡动画的确定进度条，进度值自动 clamp 到 0~100%
 */
export function ProgressBar({ progress, className, showLabel, size = 'md', indeterminate }: ProgressBarProps) {
  const heights = { sm: 'h-1', md: 'h-1.5' };

  if (indeterminate) {
    return (
      <div className={cn('w-full', className)}>
        <div className={cn('bg-border rounded-full overflow-hidden', heights[size])}>
          <div
            className={cn(
              'bg-primary rounded-full animate-indeterminate',
              heights[size]
            )}
            style={{ width: '40%' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-border rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('bg-primary rounded-full transition-all duration-500', heights[size])}
          style={{ width: `${Math.min(Math.max(progress * 100, 0), 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-text-muted min-w-[36px] text-right">
          {Math.round(progress * 100)}%
        </span>
      )}
    </div>
  );
}

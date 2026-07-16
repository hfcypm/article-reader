/**
 * Badge 徽标组件
 * 用于展示状态标签或分类标识，支持默认/成功/警告三种样式变体
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

/** Badge 组件属性 */
interface BadgeProps {
  children: ReactNode;
  /** 样式变体：default（主色）/ success（绿色）/ warning（橙色） */
  variant?: 'default' | 'success' | 'warning';
  className?: string;
}

/**
 * Badge — 内联徽标
 * 渲染一个小型圆角标签，常用于状态标识或文档格式标记
 */
export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-accent-green/10 text-accent-green',
    warning: 'bg-accent-orange/10 text-accent-orange',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

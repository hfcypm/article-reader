/**
 * EmptyState 空状态占位组件
 * 当列表或页面无数据时展示友好的提示信息，支持图标、标题、描述和操作按钮
 */

import { cn } from '@/lib/utils';

/** EmptyState 组件属性 */
interface EmptyStateProps {
  /** 图标（可选，一般为 SVG 或图标组件） */
  icon?: React.ReactNode;
  /** 主标题 */
  title: string;
  /** 辅助描述文本 */
  description?: string;
  /** 操作按钮或链接 */
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState — 空数据占位
 * 居中展示图标 + 标题 + 描述 + 可选操作按钮
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && <div className="mb-4 text-text-muted/40">{icon}</div>}
      <h3 className="text-base font-medium text-text mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted mb-6">{description}</p>}
      {action}
    </div>
  );
}

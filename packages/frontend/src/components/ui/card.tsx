/**
 * Card 卡片容器组件
 * 圆角卡片容器，带边框和阴影，用作内容分组展示的基座
 */

import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

/**
 * Card — 通用卡片
 * 继承所有 div 原生属性，可被其他组件组合使用
 */
export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-surface-card p-4 shadow-sm border border-border/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

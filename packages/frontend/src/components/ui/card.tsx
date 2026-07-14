import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

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

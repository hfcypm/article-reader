import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning';
  className?: string;
}

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

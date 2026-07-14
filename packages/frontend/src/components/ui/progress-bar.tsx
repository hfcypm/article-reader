import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({ progress, className, showLabel, size = 'md' }: ProgressBarProps) {
  const heights = { sm: 'h-1', md: 'h-1.5' };

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

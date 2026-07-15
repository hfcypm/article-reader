import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  closable?: boolean;
}

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

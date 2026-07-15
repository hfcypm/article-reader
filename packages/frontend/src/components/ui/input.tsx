import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'h-12 px-4 rounded-xl border-2 border-border bg-surface text-text text-sm',
            'placeholder:text-text-muted/40 focus:placeholder:text-text-muted/20',
            'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10',
            'transition-all duration-200',
            error && 'border-accent-red focus:border-accent-red focus:ring-accent-red/10',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-accent-red">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

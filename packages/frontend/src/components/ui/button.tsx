/**
 * Button 按钮组件
 * 支持 primary / secondary / ghost / outline / danger 五种样式和 sm / md / lg 三种尺寸
 */

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

/** Button 组件属性，继承原生 button 属性 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮样式变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Button — 通用按钮
 * 使用 forwardRef 透传 DOM ref，内置点击缩放动画和禁用态样式
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/25',
      secondary: 'bg-surface-card text-text hover:bg-border',
      ghost: 'text-text hover:bg-surface-card',
      outline: 'border-2 border-primary text-primary hover:bg-primary/5',
      danger: 'bg-accent-red text-white hover:bg-red-600',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1',
      md: 'h-11 px-5 text-sm gap-2',
      lg: 'h-13 px-7 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

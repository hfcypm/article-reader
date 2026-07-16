/**
 * Input 输入框组件
 * 带标签和错误提示的表单输入控件，支持聚焦描边动画和错误态样式
 */

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

/** Input 组件属性，继承原生 input 属性 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 输入框上方标签文本 */
  label?: string;
  /** 错误提示信息（显示在输入框下方） */
  error?: string;
}

/**
 * Input — 表单输入框
 * 使用 forwardRef 支持外部 ref 引用，自动切换错误态边框颜色
 */
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

/**
 * Toast 轻提示模块
 * 基于发布-订阅模式实现的全局 Toast 通知系统
 * 通过 showToast() 触发，ToastContainer 渲染浮层并自动消失
 */

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

/** 单条 Toast 数据结构 */
interface ToastData {
  id: string;
  message: string;
  /** 类型：成功（绿）/ 错误（红）/ 信息（深色） */
  type?: 'success' | 'error' | 'info';
}

// 全局订阅者列表和计数器（模块作用域单例）
let toastListeners: ((data: ToastData) => void)[] = [];
let toastCounter = 0;

/**
 * 显示一条 Toast 通知
 * 向所有已注册的 ToastContainer 广播消息
 * @param message - 提示文本
 * @param type - 通知类型，默认为 info
 */
export function showToast(message: string, type: ToastData['type'] = 'info') {
  const id = `toast-${++toastCounter}`;
  toastListeners.forEach((fn) => fn({ id, message, type }));
}

/**
 * ToastContainer — Toast 容器组件
 * 监听全局 showToast 调用，在页面顶部居中渲染 Toast 列表
 * 每条 Toast 3 秒后自动移除，带向下滑入动画
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const listener = (data: ToastData) => {
      setToasts((prev) => [...prev, data]);
      setTimeout(() => removeToast(data.id), 3000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const colors = {
          success: 'bg-accent-green text-white',
          error: 'bg-accent-red text-white',
          info: 'bg-text text-white',
        };
        return (
          <div
            key={t.id}
            className={cn(
              'px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-slide-down',
              colors[t.type || 'info']
            )}
          >
            {t.message}
          </div>
        );
      })}
    </div>
  );
}

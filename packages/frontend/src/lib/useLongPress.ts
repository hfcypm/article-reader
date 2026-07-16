/**
 * 长按手势 Hook
 * 封装触摸/鼠标长按交互逻辑，支持移动端 touch 事件和桌面端右键菜单
 */

import { useCallback, useRef } from 'react';

/**
 * useLongPress — 监听元素上的长按操作
 * 返回可展开到元素上的事件处理器集合，以及判断是否为长按的辅助方法
 *
 * @param onLongPress - 长按触发的回调函数
 * @param delay - 长按判定阈值（毫秒），默认 600ms
 *
 * @returns handlers - 需展开到目标元素的触摸/鼠标事件处理器
 * @returns wasLongPress - 用于判断最近一次操作是否为长按
 *
 * @example
 * const { handlers, wasLongPress } = useLongPress(() => doSomething());
 * <div {...handlers}>长按我</div>
 */
export function useLongPress(
  onLongPress: () => void,
  delay = 600
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  // 开始计时：按下后启动延时器，超时后触发长按回调
  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  // 取消计时：手指抬起或移动时清除延时器
  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 合并触摸和鼠标事件处理器，同时覆盖桌面端右键菜单
  const handlers = {
    onTouchStart: start,
    onTouchMove: cancel,
    onTouchEnd: cancel,
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      onLongPress();
    },
  };

  const wasLongPress = () => isLongPress.current;

  return { handlers, wasLongPress };
}

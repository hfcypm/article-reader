import { useCallback, useRef } from 'react';

export function useLongPress(
  onLongPress: () => void,
  delay = 600
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

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

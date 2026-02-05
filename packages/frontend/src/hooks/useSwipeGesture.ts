import { useEffect, useRef, useState } from 'react';

/**
 * 滑动手势Hook
 * 用于检测触摸滑动方向和距离
 */

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number; // 最小滑动距离（像素）
  maxSwipeTime?: number; // 最大滑动时间（毫秒）
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    maxSwipeTime = 300,
  } = options;

  const touchStart = useRef<TouchPosition | null>(null);
  const touchEnd = useRef<TouchPosition | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    touchEnd.current = null;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;

    // 检查是否满足滑动条件
    if (deltaTime > maxSwipeTime) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // 水平滑动
    if (absX > absY && absX > minSwipeDistance) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    // 垂直滑动
    else if (absY > absX && absY > minSwipeDistance) {
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    touchStart.current = null;
    touchEnd.current = null;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * 长按手势Hook
 */
interface LongPressOptions {
  onLongPress: () => void;
  delay?: number; // 长按触发时间（毫秒）
}

export const useLongPress = (options: LongPressOptions) => {
  const { onLongPress, delay = 500 } = options;
  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const handleTouchStart = () => {
    setIsLongPress(false);
    timerRef.current = setTimeout(() => {
      setIsLongPress(true);
      onLongPress();
    }, delay);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsLongPress(false);
  };

  const handleTouchMove = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
    isLongPress,
  };
};

/**
 * 双击手势Hook
 */
interface DoubleTapOptions {
  onDoubleTap: () => void;
  delay?: number; // 双击间隔时间（毫秒）
}

export const useDoubleTap = (options: DoubleTapOptions) => {
  const { onDoubleTap, delay = 300 } = options;
  const lastTapRef = useRef<number>(0);

  const handleTouchEnd = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      onDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return {
    onTouchEnd: handleTouchEnd,
  };
};

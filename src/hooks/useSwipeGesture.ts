// File: src/hooks/useSwipeGesture.ts

"use client";

import { useRef, useCallback, useEffect } from "react";
import { hapticLight, hapticMedium } from "@/utils/haptics";

export interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  restraint?: number;
  allowedTime?: number;
  hapticFeedback?: boolean;
}

export interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  distX: number;
  distY: number;
  elapsedTime: number;
  direction: "left" | "right" | "up" | "down" | null;
}

export function useSwipeGesture(config: SwipeGestureConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 80,
    restraint = 100,
    allowedTime = 400,
    hapticFeedback = true,
  } = config;

  const swipeState = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    distX: 0,
    distY: 0,
    elapsedTime: 0,
    direction: null,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      distX: 0,
      distY: 0,
      elapsedTime: 0,
      direction: null,
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    swipeState.current.distX = touch.clientX - swipeState.current.startX;
    swipeState.current.distY = touch.clientY - swipeState.current.startY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const { distX, distY, startTime } = swipeState.current;
    const elapsedTime = Date.now() - startTime;

    swipeState.current.elapsedTime = elapsedTime;

    if (elapsedTime > allowedTime) return;

    if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
      if (distX < 0) {
        swipeState.current.direction = "left";
        if (hapticFeedback) hapticMedium();
        onSwipeLeft?.();
      } else {
        swipeState.current.direction = "right";
        if (hapticFeedback) hapticMedium();
        onSwipeRight?.();
      }
    } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
      if (distY < 0) {
        swipeState.current.direction = "up";
        if (hapticFeedback) hapticMedium();
        onSwipeUp?.();
      } else {
        swipeState.current.direction = "down";
        if (hapticFeedback) hapticMedium();
        onSwipeDown?.();
      }
    }
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
    restraint,
    allowedTime,
    hapticFeedback,
  ]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    swipeState: swipeState.current,
  };
}

/**
 * Hook for swipeable list items with action reveal
 */
export function useSwipeableItem(config: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  hapticFeedback?: boolean;
}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 80,
    hapticFeedback = true,
  } = config;

  const elementRef = useRef<HTMLElement | null>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    startX.current = touch.clientX;
    currentX.current = 0;
    isDragging.current = true;

    if (elementRef.current) {
      elementRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current) return;

      const touch = e.touches[0];
      if (!touch) return;

      const diffX = touch.clientX - startX.current;
      currentX.current = diffX;

      if (elementRef.current) {
        elementRef.current.style.transform = `translateX(${diffX}px)`;
      }

      // Provide haptic feedback at threshold
      if (Math.abs(diffX) >= threshold && hapticFeedback) {
        hapticLight();
      }
    },
    [threshold, hapticFeedback],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (elementRef.current) {
      elementRef.current.style.transition =
        "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      elementRef.current.style.transform = "translateX(0)";
    }

    const diffX = currentX.current;

    if (Math.abs(diffX) >= threshold) {
      if (diffX < 0 && onSwipeLeft) {
        if (hapticFeedback) hapticMedium();
        onSwipeLeft();
      } else if (diffX > 0 && onSwipeRight) {
        if (hapticFeedback) hapticMedium();
        onSwipeRight();
      }
    }
  }, [onSwipeLeft, onSwipeRight, threshold, hapticFeedback]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
}

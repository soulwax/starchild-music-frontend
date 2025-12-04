// File: src/hooks/usePullToRefresh.ts

"use client";

import { useRef, useCallback, useState } from "react";
import type { TouchEvent } from "react";
import { hapticMedium } from "@/utils/haptics";

export interface PullToRefreshConfig {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPullDistance?: number;
  enabled?: boolean;
}

export function usePullToRefresh(config: PullToRefreshConfig) {
  const {
    onRefresh,
    threshold = 80,
    maxPullDistance = 150,
    enabled = true,
  } = config;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!enabled || isRefreshing) return;

      const container = containerRef.current;
      if (!container) return;

      // Only start pull-to-refresh if already at top
      if (container.scrollTop > 0) return;

      const touch = e.touches[0];
      if (!touch) return;

      startY.current = touch.clientY;
      isDragging.current = true;
    },
    [enabled, isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!isDragging.current || !enabled || isRefreshing) return;

      const touch = e.touches[0];
      if (!touch) return;

      const container = containerRef.current;
      if (!container || container.scrollTop > 0) return;

      const diffY = touch.clientY - startY.current;

      if (diffY > 0) {
        // Apply resistance curve
        const resistance = Math.min(diffY, maxPullDistance) / 2;
        setPullDistance(resistance);

        // Haptic feedback at threshold
        if (diffY >= threshold) {
          hapticMedium();
        }
      }
    },
    [enabled, isRefreshing, threshold, maxPullDistance],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || !enabled) return;
    isDragging.current = false;

    if (pullDistance >= threshold / 2) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [enabled, pullDistance, threshold, onRefresh]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

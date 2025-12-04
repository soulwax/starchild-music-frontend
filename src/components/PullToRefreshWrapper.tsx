// File: src/components/PullToRefreshWrapper.tsx

"use client";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import type { ReactNode } from "react";
import { RefreshCw, ArrowDown, Check } from "lucide-react";
import { springPresets } from "@/utils/spring-animations";
import { hapticLight, hapticSuccess } from "@/utils/haptics";
import { useEffect, useState } from "react";

export interface PullToRefreshWrapperProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  className?: string;
  threshold?: number;
}

type RefreshState = "idle" | "pulling" | "ready" | "refreshing" | "success";

export function PullToRefreshWrapper({
  children,
  onRefresh,
  enabled = true,
  className = "",
  threshold = 80,
}: PullToRefreshWrapperProps) {
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const pullY = useMotionValue(0);

  const { containerRef, isRefreshing, pullDistance, handlers } =
    usePullToRefresh({
      onRefresh: async () => {
        setRefreshState("refreshing");
        await onRefresh();
        hapticSuccess();
        setRefreshState("success");
        setTimeout(() => setRefreshState("idle"), 1000);
      },
      enabled,
      threshold,
    });

  // Update pull motion value
  useEffect(() => {
    pullY.set(pullDistance);

    if (!isRefreshing) {
      if (pullDistance > threshold) {
        if (refreshState === "pulling") {
          hapticLight();
        }
        setRefreshState("ready");
      } else if (pullDistance > 10) {
        setRefreshState("pulling");
      } else {
        if (refreshState !== "success") {
          setRefreshState("idle");
        }
      }
    }
  }, [pullDistance, isRefreshing, threshold, refreshState, pullY]);

  // Progress transforms
  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const indicatorOpacity = useTransform(pullY, [0, 20, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(
    pullY,
    [0, threshold * 0.5, threshold],
    [0.5, 0.8, 1],
  );
  const indicatorRotation = useTransform(pullY, [0, threshold], [0, 180]);

  const getStateConfig = () => {
    switch (refreshState) {
      case "pulling":
        return {
          icon: <ArrowDown className="h-5 w-5" />,
          text: "Pull to refresh",
          color: "text-[var(--color-subtext)]",
          bgColor: "bg-[rgba(18,26,38,0.95)]",
        };
      case "ready":
        return {
          icon: <RefreshCw className="h-5 w-5" />,
          text: "Release to refresh",
          color: "text-[var(--color-accent)]",
          bgColor: "bg-[rgba(244,178,102,0.15)]",
        };
      case "refreshing":
        return {
          icon: <RefreshCw className="h-5 w-5 animate-spin" />,
          text: "Refreshing...",
          color: "text-[var(--color-accent)]",
          bgColor: "bg-[rgba(244,178,102,0.15)]",
        };
      case "success":
        return {
          icon: <Check className="h-5 w-5" />,
          text: "Updated!",
          color: "text-[var(--color-success)]",
          bgColor: "bg-[rgba(88,198,177,0.15)]",
        };
      default:
        return {
          icon: null,
          text: "",
          color: "",
          bgColor: "",
        };
    }
  };

  const stateConfig = getStateConfig();
  const showIndicator = refreshState !== "idle";

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden ${className}`}
      {...handlers}
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={springPresets.gentle}
            className="pointer-events-none absolute top-0 right-0 left-0 z-50 flex flex-col items-center pt-4"
          >
            {/* Indicator Pill */}
            <motion.div
              style={{
                opacity:
                  refreshState === "refreshing" || refreshState === "success"
                    ? 1
                    : indicatorOpacity,
                scale:
                  refreshState === "refreshing" || refreshState === "success"
                    ? 1
                    : indicatorScale,
              }}
              className={`flex items-center gap-2 rounded-full px-4 py-2 shadow-lg backdrop-blur-xl ${stateConfig.bgColor}`}
            >
              <motion.div
                style={{
                  rotate: refreshState === "pulling" ? indicatorRotation : 0,
                }}
                className={stateConfig.color}
              >
                {stateConfig.icon}
              </motion.div>
              <span className={`text-sm font-medium ${stateConfig.color}`}>
                {stateConfig.text}
              </span>
            </motion.div>

            {/* Progress Ring (only in pulling state) */}
            {refreshState === "pulling" && (
              <motion.svg
                className="absolute -z-10"
                width="80"
                height="80"
                viewBox="0 0 80 80"
                style={{ top: -10 }}
              >
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="rgba(244,178,102,0.2)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${refreshProgress * 220} 220`}
                  transform="rotate(-90 40 40)"
                />
              </motion.svg>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with pull effect */}
      <motion.div
        animate={{
          y: isRefreshing ? 80 : Math.min(pullDistance * 0.5, 100),
        }}
        transition={isRefreshing ? springPresets.gentle : { duration: 0 }}
        style={{
          willChange: "transform",
        }}
      >
        {children}
      </motion.div>

      {/* Pull stretch effect */}
      {refreshState === "pulling" && (
        <motion.div
          className="pointer-events-none absolute top-0 right-0 left-0 h-20 bg-gradient-to-b from-[rgba(244,178,102,0.08)] to-transparent"
          style={{
            opacity: refreshProgress * 0.5,
            transform: `scaleY(${1 + refreshProgress * 0.5})`,
            transformOrigin: "top",
          }}
        />
      )}
    </div>
  );
}

export default PullToRefreshWrapper;

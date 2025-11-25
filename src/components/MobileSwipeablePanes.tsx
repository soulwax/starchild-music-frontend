// File: src/components/MobileSwipeablePanes.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useMobilePanes } from "@/contexts/MobilePanesContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { Track } from "@/types";
import { hapticLight } from "@/utils/haptics";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Dynamic imports
const MobilePlayer = dynamic(() => import("./MobilePlayer"), { ssr: false });
const MiniPlayer = dynamic(() => import("./MiniPlayer"), { ssr: false });
const EnhancedQueue = dynamic(
  () => import("./EnhancedQueue").then((mod) => mod.EnhancedQueue),
  { ssr: false },
);

interface MobileSwipeablePanesProps {
  children: ReactNode;
  playerProps: {
    currentTrack: Track | null;
    queue: Track[];
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    isShuffled: boolean;
    repeatMode: "none" | "one" | "all";
    playbackRate: number;
    isLoading: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onSeek: (time: number) => void;
    onVolumeChange: (volume: number) => void;
    onToggleMute: () => void;
    onToggleShuffle: () => void;
    onCycleRepeat: () => void;
    onPlaybackRateChange: (rate: number) => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
    onToggleQueue?: () => void;
    onToggleEqualizer?: () => void;
  };
}

type PaneIndex = 0 | 1 | 2;

export default function MobileSwipeablePanes({
  children,
  playerProps,
}: MobileSwipeablePanesProps) {
  const isMobile = useIsMobile();
  const player = useGlobalPlayer();
  const { currentPane, navigateToPane } = useMobilePanes();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [paneWidth, setPaneWidth] = useState(0);

  // Calculate pane width (100vw) and handle resize
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const updatePaneWidth = () => {
      setPaneWidth(window.innerWidth);
      // Update x position when window resizes
      if (!isDragging) {
        x.set(-currentPane * window.innerWidth);
      }
    };
    
    updatePaneWidth();
    window.addEventListener("resize", updatePaneWidth);
    return () => window.removeEventListener("resize", updatePaneWidth);
  }, [currentPane, isDragging, x]);

  // Transform x position to pane index (only when paneWidth is valid)
  const paneIndex = useTransform(x, (latest) => {
    if (paneWidth <= 0) {
      // Return current pane when width is not yet calculated to avoid division by zero
      return currentPane;
    }
    const index = Math.round(-latest / paneWidth);
    return Math.max(0, Math.min(2, index)) as PaneIndex;
  });

  // Update current pane when dragging ends (only during actual drag, not initialization)
  useEffect(() => {
    // Skip if paneWidth is not initialized yet
    if (paneWidth <= 0) return;
    
    const unsubscribe = paneIndex.on("change", (latest) => {
      // Only update if we're actually dragging and the pane changed
      // This prevents false triggers during initialization
      if (isDragging && latest !== currentPane && latest >= 0 && latest <= 2) {
        // Don't navigate during drag - let handleDragEnd handle it
        // This effect is mainly for monitoring, not navigation
      }
    });
    return unsubscribe;
  }, [paneIndex, isDragging, currentPane, navigateToPane, paneWidth]);

  // Snap to current pane position with smooth animation
  useEffect(() => {
    if (!isDragging && paneWidth > 0) {
      const targetX = -currentPane * paneWidth;
      x.set(targetX);
    }
  }, [currentPane, paneWidth, isDragging, x]);

  // Initialize position on mount
  useEffect(() => {
    if (paneWidth > 0 && !isDragging) {
      x.set(-currentPane * paneWidth);
    }
  }, [paneWidth]); // Only on paneWidth change (initial mount)

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // During drag, provide visual feedback but don't snap yet
    const currentX = x.get();
    const targetX = -currentPane * paneWidth;
    const diff = Math.abs(currentX - targetX);
    
    // If dragged significantly away from current pane, show we're moving
    if (diff > paneWidth * 0.1) {
      // Visual feedback - panes will show they're moving
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const currentX = x.get();

    // Determine which pane to snap to based on position and gesture
    let targetPane: PaneIndex = currentPane;

    // Calculate which pane we're closest to based on current position
    const currentPaneIndex = Math.round(-currentX / paneWidth);
    const clampedIndex = Math.max(0, Math.min(2, currentPaneIndex)) as PaneIndex;

    // Use velocity for fast swipes (more sensitive threshold)
    if (Math.abs(velocity) > 300) {
      // Fast swipe - go to next/previous pane
      if (velocity < 0 && currentPane < 2) {
        targetPane = (currentPane + 1) as PaneIndex;
      } else if (velocity > 0 && currentPane > 0) {
        targetPane = (currentPane - 1) as PaneIndex;
      }
    } else if (Math.abs(offset) > paneWidth * 0.25) {
      // Swipe more than 25% of screen width - snap to adjacent pane
      if (offset < 0 && currentPane < 2) {
        targetPane = (currentPane + 1) as PaneIndex;
      } else if (offset > 0 && currentPane > 0) {
        targetPane = (currentPane - 1) as PaneIndex;
      }
    } else {
      // Small movement - snap to nearest pane based on position
      targetPane = clampedIndex;
    }

    // Always snap to a valid pane
    if (targetPane !== currentPane) {
      hapticLight();
      navigateToPane(targetPane);
    } else {
      // Even if staying on same pane, ensure we're at exact position
      x.set(-currentPane * paneWidth);
    }
  };

  // Only render on mobile
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-30 overflow-hidden"
      style={{ touchAction: "pan-x" }}
    >
      <motion.div
        className="flex h-full"
        style={{
          x,
          width: "300vw", // 3 panes × 100vw
        }}
        drag="x"
        dragConstraints={{
          left: -2 * paneWidth, // Can drag to show pane 2 (content)
          right: 0, // Can drag to show pane 0 (player)
        }}
        dragElastic={0.05} // Reduced elastic for tighter snap feel
        dragMomentum={false} // Disable momentum to ensure precise snapping
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 35,
          mass: 0.5,
        }}
      >
        {/* Pane 0: Player - Always expanded */}
        <div className="h-full w-screen flex-shrink-0 overflow-y-auto">
          <MobilePlayer {...playerProps} forceExpanded={true} />
        </div>

        {/* Pane 1: Smart Queue */}
        <div className="h-full w-screen flex-shrink-0">
          <EnhancedQueue
            queue={player.queue}
            currentTrack={player.currentTrack}
            onClose={() => {
              hapticLight();
              navigateToPane(2);
            }}
            onRemove={player.removeFromQueue}
            onClear={player.clearQueue}
            onReorder={player.reorderQueue}
            onPlayFrom={player.playFromQueue}
            onSaveAsPlaylist={player.saveQueueAsPlaylist}
            onAddSimilarTracks={
              player.addSimilarTracks ??
              (() => {
                /* No similar tracks available */
              })
            }
            onGenerateSmartMix={
              player.generateSmartMix ??
              (() => {
                /* Smart mix not available */
              })
            }
            isAutoQueueing={player.isAutoQueueing ?? false}
          />
        </div>

        {/* Pane 2: Main Content */}
        <div className="h-full w-screen flex-shrink-0 overflow-y-auto relative">
          {children}
          {/* Mini Player on Content Pane */}
          {player.currentTrack && (
            <MiniPlayer
              currentTrack={player.currentTrack}
              isPlaying={player.isPlaying}
              currentTime={player.currentTime}
              duration={player.duration}
              queue={player.queue}
              onPlayPause={playerProps.onPlayPause}
              onNext={playerProps.onNext}
              onSeek={playerProps.onSeek}
              onTap={() => navigateToPane(0)}
            />
          )}
        </div>
      </motion.div>

      {/* Pane Indicators - Above mini player and navigation */}
      <div className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 gap-2 pointer-events-none">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => {
              hapticLight();
              navigateToPane(index as PaneIndex);
            }}
            className={`h-2 rounded-full transition-all pointer-events-auto ${
              currentPane === index
                ? "w-8 bg-[var(--color-accent)]"
                : "w-2 bg-[rgba(255,255,255,0.3)]"
            }`}
            aria-label={`Go to pane ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// File: src/components/SwipeableTrackItem.tsx

"use client";

import type { Track } from "@/types";
import { hapticLight, hapticMedium } from "@/utils/haptics";
import { getCoverImage } from "@/utils/images";
import { springPresets } from "@/utils/spring-animations";
import type { PanInfo } from "framer-motion";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Heart, ListX, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

export interface SwipeableTrackItemProps {
  track: Track;
  onPlay: (track: Track) => void;
  onFavorite?: (track: Track) => void;
  onRemove?: (track: Track) => void;
  onMore?: (track: Track) => void;
  isFavorited?: boolean;
  showRemove?: boolean;
  showFavorite?: boolean;
}

export function SwipeableTrackItem({
  track,
  onPlay,
  onFavorite,
  onRemove,
  onMore,
  isFavorited = false,
  showRemove = false,
  showFavorite = true,
}: SwipeableTrackItemProps) {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform for background actions visibility
  const leftActionOpacity = useTransform(x, [0, 80], [0, 1]);
  const rightActionOpacity = useTransform(x, [-80, 0], [1, 0]);

  const coverImage = getCoverImage(track);
  const swipeThreshold = 80;
  const maxSwipe = 120;

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Swipe right (favorite action)
    if (offset > swipeThreshold || velocity > 500) {
      if (showFavorite && onFavorite) {
        hapticMedium();
        onFavorite(track);
      }
    }
    // Swipe left (remove action)
    else if (offset < -swipeThreshold || velocity < -500) {
      if (showRemove && onRemove) {
        hapticMedium();
        onRemove(track);
      }
    }
  };

  const handleTap = () => {
    hapticLight();
    onPlay(track);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between">
        {/* Left action (Remove) */}
        {showRemove && (
          <motion.div
            style={{ opacity: rightActionOpacity }}
            className="flex h-full items-center justify-end bg-gradient-to-r from-red-500/90 to-red-600/90 px-6"
          >
            <ListX className="h-6 w-6 text-white" />
          </motion.div>
        )}

        {/* Right action (Favorite) */}
        {showFavorite && (
          <motion.div
            style={{ opacity: leftActionOpacity }}
            className="ml-auto flex h-full items-center justify-start bg-gradient-to-l from-pink-500/90 to-red-500/90 px-6"
          >
            <Heart
              className={`h-6 w-6 ${isFavorited ? "fill-white" : ""} text-white`}
            />
          </motion.div>
        )}
      </div>

      {/* Main Track Item */}
      <motion.div
        ref={containerRef}
        drag="x"
        dragConstraints={{
          left: showRemove ? -maxSwipe : 0,
          right: showFavorite ? maxSwipe : 0,
        }}
        dragElastic={0.2}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ scale: 0.98 }}
        transition={springPresets.smooth}
        onTap={handleTap}
        className="relative z-10 flex cursor-pointer items-center gap-3 bg-[var(--color-bg)] p-3 transition-colors hover:bg-[var(--color-surface)]"
      >
        {/* Album Cover */}
        <div className="relative flex-shrink-0">
          <Image
            src={coverImage}
            alt={track.title}
            width={56}
            height={56}
            className="h-14 w-14 rounded-lg shadow-sm ring-2 ring-white/5"
            loading="lazy"
            quality={75}
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 backdrop-blur-sm transition-opacity hover:opacity-100">
            <svg
              className="h-7 w-7 text-white drop-shadow-lg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Track Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-[var(--color-text)]">
            {track.title}
          </h3>
          <p className="truncate text-sm text-[var(--color-subtext)]">
            {track.artist.name}
          </p>
        </div>

        {/* More Options */}
        {onMore && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={springPresets.immediate}
            onClick={(e) => {
              e.stopPropagation();
              hapticLight();
              onMore(track);
            }}
            className="touch-target flex-shrink-0 text-[var(--color-subtext)] transition-colors hover:text-[var(--color-text)]"
          >
            <MoreHorizontal className="h-5 w-5" />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

export default SwipeableTrackItem;

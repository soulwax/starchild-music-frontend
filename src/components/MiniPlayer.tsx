// File: src/components/MiniPlayer.tsx

"use client";

import type { Track } from "@/types";
import { hapticLight } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import Image from "next/image";
import { motion } from "framer-motion";

interface MiniPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: Track[];
  onPlayPause: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onTap: () => void;
}

export default function MiniPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  queue,
  onPlayPause,
  onNext,
  onSeek,
  onTap,
}: MiniPlayerProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
    e.stopPropagation();
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * duration);
    e.stopPropagation();
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={springPresets.gentle}
      className="safe-bottom fixed right-0 bottom-0 left-0 z-50 border-t border-[rgba(244,178,102,0.14)] bg-[rgba(10,16,24,0.94)] shadow-[0_-12px_32px_rgba(5,10,18,0.6)] backdrop-blur-xl"
    >
      {/* Progress Bar */}
      <div
        className="h-1 w-full cursor-pointer bg-[rgba(255,255,255,0.12)]"
        data-drag-exempt="true"
        onClick={handleProgressClick}
        onTouchMove={handleProgressTouch}
      >
        <div
          className="accent-gradient h-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mini Player Content */}
      <motion.div
        className="flex cursor-pointer items-center gap-3 px-4 py-3"
        onTap={onTap}
        whileTap={{ scale: 0.99 }}
        transition={springPresets.snappy}
      >
        {currentTrack.album.cover_small ? (
          <Image
            src={currentTrack.album.cover_small}
            alt={currentTrack.title}
            width={48}
            height={48}
            className="flex-shrink-0 rounded-lg"
            priority
            quality={75}
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(244,178,102,0.12)] text-[var(--color-muted)]">
            🎵
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-medium text-[var(--color-text)]">
            {currentTrack.title}
          </h4>
          <p className="truncate text-sm text-[var(--color-subtext)]">
            {currentTrack.artist.name}
          </p>
        </div>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            hapticLight();
            onPlayPause();
          }}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          transition={springPresets.snappy}
          className="touch-target-lg flex-shrink-0 text-[var(--color-text)]"
          aria-label={isPlaying ? "Pause track" : "Play track"}
        >
          {isPlaying ? (
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </motion.button>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            hapticLight();
            onNext();
          }}
          disabled={queue.length === 0}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          transition={springPresets.snappy}
          className="touch-target-lg flex-shrink-0 text-[var(--color-subtext)] hover:text-[var(--color-text)] disabled:opacity-50"
          aria-label="Next track"
          aria-disabled={queue.length === 0}
        >
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
          </svg>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

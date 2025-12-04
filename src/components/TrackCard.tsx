// File: src/components/TrackCard.tsx

"use client";

import type { Track } from "@/types";
import { getCoverImage } from "@/utils/images";
import { hapticLight } from "@/utils/haptics";
import Image from "next/image";
import { motion } from "framer-motion";
import { springPresets } from "@/utils/spring-animations";

export interface TrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
}

export default function TrackCard({ track, onPlay }: TrackCardProps) {
  const coverImage = getCoverImage(track);

  const handlePlay = () => {
    hapticLight();
    onPlay(track);
  };

  return (
    <motion.div
      onClick={handlePlay}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={springPresets.snappy}
      className="card group flex cursor-pointer items-center gap-3 p-3 md:gap-4 md:p-4"
    >
      <div className="relative flex-shrink-0">
        <Image
          src={coverImage}
          alt={track.title}
          width={64}
          height={64}
          className="h-14 w-14 rounded-lg shadow-sm ring-2 ring-white/5 transition-all group-hover:ring-[var(--color-accent)]/30 md:h-16 md:w-16"
          loading="lazy"
          quality={75}
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <svg
            className="h-8 w-8 text-white drop-shadow-lg md:h-7 md:w-7"
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
      <div className="min-w-0 flex-1 overflow-hidden">
        <h3 className="truncate text-base leading-tight font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent-light)] md:text-lg">
          {track.title}
        </h3>
        <p className="truncate text-sm text-[var(--color-subtext)] md:text-base">
          {track.artist.name}
        </p>
      </div>
    </motion.div>
  );
}

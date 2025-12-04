// File: src/components/MobileContentWrapper.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import MobileSwipeablePanes from "./MobileSwipeablePanes";
import type { ReactNode } from "react";

interface MobileContentWrapperProps {
  children: ReactNode;
}

export default function MobileContentWrapper({
  children,
}: MobileContentWrapperProps) {
  const isMobile = useIsMobile();
  const player = useGlobalPlayer();

  const playerProps = {
    currentTrack: player.currentTrack,
    queue: player.queue,
    isPlaying: player.isPlaying,
    currentTime: player.currentTime,
    duration: player.duration,
    volume: player.volume,
    isMuted: player.isMuted,
    isShuffled: player.isShuffled,
    repeatMode: player.repeatMode,
    playbackRate: player.playbackRate,
    isLoading: player.isLoading,
    onPlayPause: player.togglePlay,
    onNext: player.playNext,
    onPrevious: player.playPrevious,
    onSeek: player.seek,
    onVolumeChange: player.setVolume,
    onToggleMute: () => player.setIsMuted(!player.isMuted),
    onToggleShuffle: player.toggleShuffle,
    onCycleRepeat: player.cycleRepeatMode,
    onPlaybackRateChange: player.setPlaybackRate,
    onSkipForward: player.skipForward,
    onSkipBackward: player.skipBackward,
    onToggleQueue: undefined, // Handled by panes
    onToggleEqualizer: undefined, // Handled separately
  };

  if (isMobile) {
    return (
      <MobileSwipeablePanes playerProps={playerProps}>
        {children}
      </MobileSwipeablePanes>
    );
  }

  return <>{children}</>;
}

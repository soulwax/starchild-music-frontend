// File: src/types/player.ts

import type { Track } from "./index";

export type RepeatMode = "none" | "one" | "all";

export interface BasePlayerProps {

  currentTrack: Track | null;

  queue: Track[];

  isPlaying: boolean;

  currentTime: number;

  duration: number;

  volume: number;

  isMuted: boolean;

  isShuffled: boolean;

  repeatMode: RepeatMode;

  playbackRate: number;

  isLoading: boolean;
}

export interface PlayerControls {

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
}

export interface PlayerComponentProps extends BasePlayerProps, PlayerControls {}

export interface ProgressBarProps {

  currentTime: number;

  duration: number;

  isDragging?: boolean;

  onSeek: (time: number) => void;

  className?: string;
}

export interface VolumeControlProps {

  volume: number;

  isMuted: boolean;

  onVolumeChange: (volume: number) => void;

  onToggleMute: () => void;

  className?: string;
}

export interface PlaybackControlsProps {

  isPlaying: boolean;

  isLoading: boolean;

  isShuffled: boolean;

  repeatMode: RepeatMode;

  onPlayPause: () => void;

  onNext: () => void;

  onPrevious: () => void;

  onToggleShuffle: () => void;

  onCycleRepeat: () => void;

  onSkipForward?: () => void;

  onSkipBackward?: () => void;

  className?: string;
}

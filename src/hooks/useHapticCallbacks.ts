// File: src/hooks/useHapticCallbacks.ts

import { hapticLight, hapticMedium } from "@/utils/haptics";
import { useCallback } from "react";

export interface HapticCallbacksInput {
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onSkipForward?: () => void;
  onSkipBackward?: () => void;
}

export interface HapticCallbacksOutput {
  handlePlayPause: () => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleToggleShuffle: () => void;
  handleCycleRepeat: () => void;
  handleSkipForward: () => void;
  handleSkipBackward: () => void;
}

export function useHapticCallbacks(
  callbacks: HapticCallbacksInput,
): HapticCallbacksOutput {
  const {
    onPlayPause,
    onNext,
    onPrevious,
    onToggleShuffle,
    onCycleRepeat,
    onSkipForward,
    onSkipBackward,
  } = callbacks;

  const handlePlayPause = useCallback(() => {
    hapticMedium();
    onPlayPause();
  }, [onPlayPause]);

  const handleNext = useCallback(() => {
    hapticLight();
    onNext();
  }, [onNext]);

  const handlePrevious = useCallback(() => {
    hapticLight();
    onPrevious();
  }, [onPrevious]);

  const handleToggleShuffle = useCallback(() => {
    hapticLight();
    onToggleShuffle();
  }, [onToggleShuffle]);

  const handleCycleRepeat = useCallback(() => {
    hapticLight();
    onCycleRepeat();
  }, [onCycleRepeat]);

  const handleSkipForward = useCallback(() => {
    hapticLight();
    onSkipForward?.();
  }, [onSkipForward]);

  const handleSkipBackward = useCallback(() => {
    hapticLight();
    onSkipBackward?.();
  }, [onSkipBackward]);

  return {
    handlePlayPause,
    handleNext,
    handlePrevious,
    handleToggleShuffle,
    handleCycleRepeat,
    handleSkipForward,
    handleSkipBackward,
  };
}

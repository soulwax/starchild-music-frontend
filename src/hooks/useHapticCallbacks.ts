// File: src/hooks/useHapticCallbacks.ts

/**
 * Custom hook for wrapping callbacks with haptic feedback
 * Eliminates code duplication across player components
 */

import { hapticLight, hapticMedium } from "@/utils/haptics";
import { useCallback } from "react";

/**
 * Input callbacks to be wrapped with haptic feedback
 */
export interface HapticCallbacksInput {
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onSkipForward?: () => void;
  onSkipBackward?: () => void;
}

/**
 * Output callbacks wrapped with haptic feedback
 */
export interface HapticCallbacksOutput {
  handlePlayPause: () => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleToggleShuffle: () => void;
  handleCycleRepeat: () => void;
  handleSkipForward: () => void;
  handleSkipBackward: () => void;
}

/**
 * Hook that wraps player callbacks with appropriate haptic feedback
 *
 * @param callbacks - Player callback functions to wrap
 * @returns Wrapped callback functions with haptic feedback
 *
 * @example
 * const { handlePlayPause, handleNext } = useHapticCallbacks({
 *   onPlayPause,
 *   onNext,
 *   onPrevious,
 *   onToggleShuffle,
 *   onCycleRepeat,
 * });
 */
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

  // Play/pause gets medium feedback (more prominent action)
  const handlePlayPause = useCallback(() => {
    hapticMedium();
    onPlayPause();
  }, [onPlayPause]);

  // Navigation actions get light feedback
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

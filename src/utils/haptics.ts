// File: src/utils/haptics.ts

/**
 * Haptic feedback utility for mobile devices
 * Provides tactile feedback for user interactions with iOS-like patterns
 */

export type HapticPattern =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "error"
  | "warning"
  | "selection"
  | "impact"
  | "notification"
  | "swipe"
  | "toggle"
  | "slider";

/**
 * Trigger haptic feedback with different patterns
 * Falls back gracefully when not supported
 */
export function haptic(pattern: HapticPattern = "light"): void {
  // Check if vibration API is supported
  if (!("vibrate" in navigator)) {
    return;
  }

  // Define vibration patterns (in milliseconds)
  // Shorter durations feel more refined on modern devices
  const patterns: Record<HapticPattern, number | number[]> = {
    // Basic feedback
    light: 5, // Subtle tap - navigation, selections
    medium: 12, // Normal tap - button presses
    heavy: 25, // Strong tap - important actions

    // Feedback patterns
    success: [8, 80, 8], // Celebration - completed actions
    error: [15, 50, 15, 50, 25], // Alert - failed actions
    warning: [10, 40, 10], // Caution - destructive action warning

    // Interaction-specific
    selection: 3, // Ultra-subtle - list selection, tab change
    impact: 18, // Like a physical button - play/pause
    notification: [5, 100, 5, 100, 15], // Attention - new content

    // Gesture feedback
    swipe: [5, 30, 5], // Swipe action complete
    toggle: 8, // Toggle switch
    slider: 2, // Each step on a slider (very subtle)
  };

  try {
    const vibrationPattern = patterns[pattern];
    navigator.vibrate(vibrationPattern);
  } catch {
    // Silently fail if vibration fails
    // Don't log in production to avoid console spam
  }
}

/**
 * Trigger light haptic feedback (quick tap)
 * Use for: navigation, minor selections
 */
export function hapticLight(): void {
  haptic("light");
}

/**
 * Trigger medium haptic feedback (normal tap)
 * Use for: button presses, toggles
 */
export function hapticMedium(): void {
  haptic("medium");
}

/**
 * Trigger heavy haptic feedback (strong tap)
 * Use for: important confirmations, completion
 */
export function hapticHeavy(): void {
  haptic("heavy");
}

/**
 * Trigger success haptic feedback (double tap)
 * Use for: successful actions, achievements
 */
export function hapticSuccess(): void {
  haptic("success");
}

/**
 * Trigger error haptic feedback (triple tap)
 * Use for: errors, failed validations
 */
export function hapticError(): void {
  haptic("error");
}

/**
 * Trigger warning haptic feedback
 * Use for: destructive actions about to happen
 */
export function hapticWarning(): void {
  haptic("warning");
}

/**
 * Trigger selection haptic feedback (ultra-subtle)
 * Use for: list item selection, tab changes
 */
export function hapticSelection(): void {
  haptic("selection");
}

/**
 * Trigger impact haptic feedback
 * Use for: play/pause, primary button press
 */
export function hapticImpact(): void {
  haptic("impact");
}

/**
 * Trigger notification haptic feedback
 * Use for: new content, alerts
 */
export function hapticNotification(): void {
  haptic("notification");
}

/**
 * Trigger swipe haptic feedback
 * Use for: completing swipe gestures
 */
export function hapticSwipe(): void {
  haptic("swipe");
}

/**
 * Trigger toggle haptic feedback
 * Use for: toggle switches
 */
export function hapticToggle(): void {
  haptic("toggle");
}

/**
 * Trigger slider haptic feedback (very subtle)
 * Use for: slider tick marks, volume steps
 */
export function hapticSlider(): void {
  haptic("slider");
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return "vibrate" in navigator;
}

/**
 * Custom haptic pattern - create your own vibration pattern
 * @param pattern - Array of [vibrate, pause, vibrate, ...] durations in ms
 */
export function hapticCustom(pattern: number[]): void {
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Silently fail
  }
}

/**
 * Stop any ongoing haptic feedback
 */
export function hapticStop(): void {
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(0);
  } catch {
    // Silently fail
  }
}

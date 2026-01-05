// File: src/utils/haptics.ts

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

export function haptic(pattern: HapticPattern = "light"): void {

  if (!("vibrate" in navigator)) {
    return;
  }

  const patterns: Record<HapticPattern, number | number[]> = {

    light: 5,
    medium: 12,
    heavy: 25,

    success: [8, 80, 8],
    error: [15, 50, 15, 50, 25],
    warning: [10, 40, 10],

    selection: 3,
    impact: 18,
    notification: [5, 100, 5, 100, 15],

    swipe: [5, 30, 5],
    toggle: 8,
    slider: 2,
  };

  try {
    const vibrationPattern = patterns[pattern];
    navigator.vibrate(vibrationPattern);
  } catch {

  }
}

export function hapticLight(): void {
  haptic("light");
}

export function hapticMedium(): void {
  haptic("medium");
}

export function hapticHeavy(): void {
  haptic("heavy");
}

export function hapticSuccess(): void {
  haptic("success");
}

export function hapticError(): void {
  haptic("error");
}

export function hapticWarning(): void {
  haptic("warning");
}

export function hapticSelection(): void {
  haptic("selection");
}

export function hapticImpact(): void {
  haptic("impact");
}

export function hapticNotification(): void {
  haptic("notification");
}

export function hapticSwipe(): void {
  haptic("swipe");
}

export function hapticToggle(): void {
  haptic("toggle");
}

export function hapticSlider(): void {
  haptic("slider");
}

export function isHapticSupported(): boolean {
  return "vibrate" in navigator;
}

export function hapticCustom(pattern: number[]): void {
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {

  }
}

export function hapticStop(): void {
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(0);
  } catch {

  }
}

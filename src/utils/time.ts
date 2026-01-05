// File: src/utils/time.ts

export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  return formatTime(seconds);
}

export function msToMinutes(milliseconds: number): number {
  return Math.floor(milliseconds / 60000);
}

export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

export function msToSeconds(milliseconds: number): number {
  return milliseconds / 1000;
}

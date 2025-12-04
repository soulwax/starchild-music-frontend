// File: src/config/constants.ts

/**
 * Application-wide constants
 * Replaces magic numbers with named constants for better maintainability
 */

/**
 * Audio Player Constants
 */
export const AUDIO_CONSTANTS = {
  /** How many seconds into a track before "previous" restarts instead of going back */
  TRACK_RESTART_THRESHOLD_SECONDS: 3,

  /** Default volume level (0-1) */
  DEFAULT_VOLUME: 0.7,

  /** Default playback rate */
  DEFAULT_PLAYBACK_RATE: 1,

  /** Seek jump amount in seconds */
  SEEK_JUMP_SECONDS: 10,

  /** Auto-queue settings */
  AUTO_QUEUE_RETRY_DELAY_MS: 5000,
  AUTO_QUEUE_MIN_TRACKS: 5,
  AUTO_QUEUE_TARGET_SIZE: 8,

  /** Persistence debounce delay */
  QUEUE_PERSIST_DEBOUNCE_MS: 500,

  /** Media Session artwork sizes */
  ARTWORK_SIZES: {
    SMALL: "56x56",
    MEDIUM: "250x250",
    BIG: "500x500",
    XL: "1000x1000",
  },

  /** Audio loading retry delay */
  AUDIO_LOAD_RETRY_DELAY_MS: 50,
} as const;

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
  /** Touch target sizes (px) - iOS Human Interface Guidelines */
  MIN_TOUCH_TARGET: 44,
  LARGE_TOUCH_TARGET: 48,

  /** Animation durations (ms) */
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,

  /** Breakpoints (px) */
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280,
  },

  /** Mobile player drag threshold */
  DRAG_COLLAPSE_THRESHOLD: 100,
  DRAG_COLLAPSE_VELOCITY: 500,
} as const;

/**
 * Cache Constants
 */
export const CACHE_CONSTANTS = {
  /** Audio cache settings */
  AUDIO_MAX_ENTRIES: 200,
  AUDIO_MAX_AGE_SECONDS: 60 * 60 * 24 * 30, // 30 days

  /** Image cache settings */
  IMAGE_MAX_ENTRIES: 200,
  IMAGE_MAX_AGE_SECONDS: 60 * 60 * 24 * 30, // 30 days

  /** API cache settings */
  API_MAX_ENTRIES: 100,
  API_MAX_AGE_SECONDS: 60 * 60, // 1 hour
  API_TIMEOUT_SECONDS: 10,
} as const;

/**
 * Storage Constants
 */
export const STORAGE_CONSTANTS = {
  /** Maximum localStorage usage warning threshold (%) */
  QUOTA_WARNING_THRESHOLD: 80,

  /** Maximum localStorage usage critical threshold (%) */
  QUOTA_CRITICAL_THRESHOLD: 95,
} as const;

/**
 * Network Constants
 */
export const NETWORK_CONSTANTS = {
  /** Maximum retry attempts for failed requests */
  MAX_RETRY_ATTEMPTS: 3,

  /** Base delay for exponential backoff (ms) */
  RETRY_BASE_DELAY_MS: 1000,

  /** Maximum delay for exponential backoff (ms) */
  RETRY_MAX_DELAY_MS: 10000,
} as const;

/**
 * Visualizer Constants
 */
export const VISUALIZER_CONSTANTS = {
  /** Default FFT size for audio analysis */
  DEFAULT_FFT_SIZE: 128,

  /** Smoothing time constant for audio analysis */
  DEFAULT_SMOOTHING: 0.8,

  /** Minimum decibels for audio analysis */
  MIN_DECIBELS: -90,

  /** Maximum decibels for audio analysis */
  MAX_DECIBELS: -10,
} as const;

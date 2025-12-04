// File: src/config/storage.ts

/**
 * localStorage and sessionStorage key constants
 * Centralizes all storage keys to prevent typos and enable easy refactoring
 */

/**
 * Prefix for all app storage keys
 */
const STORAGE_PREFIX = "hexmusic_" as const;

/**
 * Player-related storage keys
 */
export const STORAGE_KEYS = {
  // Audio player state
  VOLUME: `${STORAGE_PREFIX}volume`,
  PLAYBACK_RATE: `${STORAGE_PREFIX}playback_rate`,
  QUEUE_STATE: `${STORAGE_PREFIX}queue_state`,
  CURRENT_TRACK: `${STORAGE_PREFIX}current_track`,
  CURRENT_TIME: `${STORAGE_PREFIX}current_time`,

  // User preferences
  THEME: `${STORAGE_PREFIX}theme`,
  EQUALIZER_PRESET: `${STORAGE_PREFIX}equalizer_preset`,
  EQUALIZER_BANDS: `${STORAGE_PREFIX}equalizer_bands`,
  EQUALIZER_ENABLED: `${STORAGE_PREFIX}equalizer_enabled`,

  // Smart queue settings
  AUTO_QUEUE_ENABLED: `${STORAGE_PREFIX}auto_queue_enabled`,
  AUTO_QUEUE_THRESHOLD: `${STORAGE_PREFIX}auto_queue_threshold`,
  AUTO_QUEUE_COUNT: `${STORAGE_PREFIX}auto_queue_count`,
  SMART_MIX_ENABLED: `${STORAGE_PREFIX}smart_mix_enabled`,
  SIMILARITY_PREFERENCE: `${STORAGE_PREFIX}similarity_preference`,

  // UI state
  QUEUE_PANEL_OPEN: `${STORAGE_PREFIX}queue_panel_open`,
  VISUALIZER_ENABLED: `${STORAGE_PREFIX}visualizer_enabled`,
  VISUALIZER_TYPE: `${STORAGE_PREFIX}visualizer_type`,
  VISUALIZER_STATE: `${STORAGE_PREFIX}visualizer_state`,
  LYRICS_ENABLED: `${STORAGE_PREFIX}lyrics_enabled`,

  // Session/auth (consider moving to sessionStorage)
  AUTH_TOKEN: `${STORAGE_PREFIX}auth_token`,
  USER_SESSION: `${STORAGE_PREFIX}user_session`,

  // Feature flags
  BETA_FEATURES_ENABLED: `${STORAGE_PREFIX}beta_features`,

  // Cache
  RECOMMENDATION_CACHE: `${STORAGE_PREFIX}recommendation_cache`,
  SEARCH_HISTORY: `${STORAGE_PREFIX}search_history`,
} as const;

/**
 * Type-safe storage key type
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Helper to get all storage keys as an array
 */
export function getAllStorageKeys(): StorageKey[] {
  return Object.values(STORAGE_KEYS);
}

/**
 * Helper to clear all app-related storage
 */
export function clearAllAppStorage(): void {
  const keys = getAllStorageKeys();
  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

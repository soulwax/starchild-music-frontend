// File: src/utils/electronStorage.ts

/**
 * Electron Storage Bridge
 * Ensures localStorage persistence works correctly in Electron environment
 * Provides fallback mechanisms for data integrity
 */

import { STORAGE_KEYS } from "@/config/storage";
import { localStorage as storage } from "@/services/storage";

// Check if running in Electron
export const isElectron = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check for Electron-specific properties
  return !!(
    window.navigator.userAgent.includes("Electron") ||
    (window as Window & { electron?: unknown }).electron
  );
};

/**
 * Preference keys that should be persisted across sessions
 */
export const PERSISTENT_PREFERENCES = [
  STORAGE_KEYS.VOLUME,
  STORAGE_KEYS.PLAYBACK_RATE,
  STORAGE_KEYS.EQUALIZER_PRESET,
  STORAGE_KEYS.EQUALIZER_BANDS,
  STORAGE_KEYS.EQUALIZER_ENABLED,
  STORAGE_KEYS.AUTO_QUEUE_ENABLED,
  STORAGE_KEYS.AUTO_QUEUE_THRESHOLD,
  STORAGE_KEYS.AUTO_QUEUE_COUNT,
  STORAGE_KEYS.SMART_MIX_ENABLED,
  STORAGE_KEYS.SIMILARITY_PREFERENCE,
  STORAGE_KEYS.VISUALIZER_ENABLED,
  STORAGE_KEYS.VISUALIZER_TYPE,
  STORAGE_KEYS.VISUALIZER_STATE,
  STORAGE_KEYS.QUEUE_PANEL_OPEN,
  STORAGE_KEYS.LYRICS_ENABLED,
] as const;

/**
 * Verify storage persistence on app startup
 * Returns true if storage is working correctly
 */
export async function verifyStoragePersistence(): Promise<boolean> {
  if (!isElectron()) return true;

  try {
    const testKey = "__electron_storage_test__" as const;
    const testValue = { timestamp: Date.now(), test: true };

    // Try to write and read back
    storage.set(
      testKey as (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS],
      testValue,
    );
    const result = storage.get<typeof testValue>(
      testKey as (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS],
    );

    if (result.success && result.data?.test === true) {
      console.log("[ElectronStorage] ✅ Storage persistence verified");
      // Clean up test key
      storage.remove(
        testKey as (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS],
      );
      return true;
    }

    console.warn("[ElectronStorage] ⚠️ Storage persistence check failed");
    return false;
  } catch (error) {
    console.error("[ElectronStorage] ❌ Storage verification error:", error);
    return false;
  }
}

/**
 * Export all preferences for backup
 */
export function exportPreferences(): Record<string, unknown> {
  const preferences: Record<string, unknown> = {};

  for (const key of PERSISTENT_PREFERENCES) {
    const result = storage.get(key);
    if (result.success && result.data !== null) {
      preferences[key] = result.data;
    }
  }

  return preferences;
}

/**
 * Import preferences from backup
 */
export function importPreferences(preferences: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(preferences)) {
    if (
      PERSISTENT_PREFERENCES.includes(
        key as (typeof PERSISTENT_PREFERENCES)[number],
      )
    ) {
      storage.set(key as (typeof PERSISTENT_PREFERENCES)[number], value);
    }
  }
}

/**
 * Log current storage status (for debugging)
 */
export async function logStorageStatus(): Promise<void> {
  if (!isElectron()) return;

  console.group("[ElectronStorage] Storage Status");
  console.log("Running in Electron:", isElectron());

  const info = await storage.getStorageInfo();
  console.log("Storage usage:", {
    used: `${(info.used / 1024).toFixed(2)} KB`,
    total: `${(info.total / 1024 / 1024).toFixed(2)} MB`,
    percentage: `${info.percentage.toFixed(2)}%`,
  });

  console.log("Stored preferences:");
  const prefs = exportPreferences();
  for (const [key, value] of Object.entries(prefs)) {
    console.log(`  ${key}:`, value);
  }

  console.groupEnd();
}

/**
 * Initialize storage for Electron
 * Call this on app startup
 */
export async function initializeElectronStorage(): Promise<void> {
  if (!isElectron()) return;

  console.log("[ElectronStorage] Initializing Electron storage...");

  // Verify persistence
  const isWorking = await verifyStoragePersistence();

  if (!isWorking) {
    console.warn("[ElectronStorage] ⚠️ Storage may not persist correctly");
  }

  // Log status in development
  if (process.env.NODE_ENV === "development") {
    await logStorageStatus();
  }

  console.log("[ElectronStorage] ✅ Initialization complete");
}

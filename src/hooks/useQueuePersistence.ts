// File: src/hooks/useQueuePersistence.ts

"use client";

import { STORAGE_KEYS } from "@/config/storage";
import { AUDIO_CONSTANTS } from "@/config/constants";
import { localStorage } from "@/services/storage";
import type { QueuedTrack, SmartQueueState, Track } from "@/types";
import { useEffect, useRef } from "react";

interface QueueStateV1 {
  queue: Track[];
  history: Track[];
  currentTrack: Track | null;
  currentTime: number;
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";
}

interface QueueStateV2 {
  version: 2;
  queuedTracks: QueuedTrack[];
  smartQueueState: SmartQueueState;
  history: Track[];
  currentTime: number;
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";
}

export type QueueState = QueueStateV1 | QueueStateV2;

export function useQueuePersistence(state: QueueState) {
  const persistTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {

    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = setTimeout(() => {
      const result = localStorage.set(STORAGE_KEYS.QUEUE_STATE, state);
      if (!result.success) {
        console.error("Failed to persist queue state:", result.error);
      }
      persistTimerRef.current = null;
    }, AUDIO_CONSTANTS.QUEUE_PERSIST_DEBOUNCE_MS);

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [state]);
}

export function loadPersistedQueueState(): QueueState | null {
  const result = localStorage.get<any>(STORAGE_KEYS.QUEUE_STATE);

  if (!result.success) {
    console.error("Failed to load queue state:", result.error);
    return null;
  }

  if (result.data === null) {
    return null;
  }

  const stored = result.data;

  if ('version' in stored && stored.version === 2) {

    const v2Data = stored as any;
    return {
      ...v2Data,
      queuedTracks: v2Data.queuedTracks.map((qt: any) => ({
        ...qt,
        addedAt: new Date(qt.addedAt),
      })),
      smartQueueState: {
        ...v2Data.smartQueueState,
        lastRefreshedAt: v2Data.smartQueueState.lastRefreshedAt
          ? new Date(v2Data.smartQueueState.lastRefreshedAt)
          : null,
      },
    } as QueueStateV2;
  }

  if ('queue' in stored && Array.isArray(stored.queue)) {
    const v1 = stored as QueueStateV1;
    console.log("[useQueuePersistence] 🔄 Migrating queue state from V1 to V2");

    const migratedQueuedTracks: QueuedTrack[] = v1.queue.map((track, idx) => ({
      track,
      queueSource: 'user' as const,
      addedAt: new Date(),
      queueId: `migrated-${track.id}-${idx}`,
    }));

    const v2: QueueStateV2 = {
      version: 2,
      queuedTracks: migratedQueuedTracks,
      smartQueueState: {
        isActive: false,
        lastRefreshedAt: null,
        seedTrackId: null,
        trackCount: 0,
      },
      history: v1.history,
      currentTime: v1.currentTime,
      isShuffled: v1.isShuffled,
      repeatMode: v1.repeatMode,
    };

    localStorage.set(STORAGE_KEYS.QUEUE_STATE, v2);

    return v2;
  }

  console.warn("[useQueuePersistence] ⚠️ Unknown queue state format, ignoring");
  return null;
}

export function clearPersistedQueueState(): void {
  const result = localStorage.remove(STORAGE_KEYS.QUEUE_STATE);

  if (!result.success) {
    console.error("Failed to clear queue state:", result.error);
  }
}

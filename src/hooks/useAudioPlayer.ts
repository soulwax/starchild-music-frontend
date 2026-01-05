// File: src/hooks/useAudioPlayer.ts

"use client";

import { AUDIO_CONSTANTS } from "@/config/constants";
import { STORAGE_KEYS } from "@/config/storage";
import { localStorage } from "@/services/storage";
import type {
  QueuedTrack,
  SmartQueueSettings,
  SmartQueueState,
  Track,
} from "@/types";
import { getStreamUrlById } from "@/utils/api";
import { logger } from "@/utils/logger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadPersistedQueueState,
  clearPersistedQueueState,
} from "./useQueuePersistence";

type RepeatMode = "none" | "one" | "all";

interface UseAudioPlayerOptions {
  onTrackChange?: (track: Track) => void;
  onTrackEnd?: (track: Track) => void;
  onDuplicateTrack?: (track: Track) => void;
  onAutoQueueTrigger?: (
    currentTrack: Track,
    currentQueueLength: number,
  ) => Promise<Track[]>;
  onError?: (error: string, trackId?: number) => void;
  smartQueueSettings?: SmartQueueSettings;
  initialQueueState?: {
    queuedTracks: QueuedTrack[];
    smartQueueState: SmartQueueState;
    history: Track[];
    isShuffled: boolean;
    repeatMode: RepeatMode;
  } | null;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const {
    onTrackChange,
    onTrackEnd,
    onDuplicateTrack,
    onError,
    initialQueueState,
  } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [queuedTracks, setQueuedTracks] = useState<QueuedTrack[]>([]);
  const [smartQueueState, setSmartQueueState] = useState<SmartQueueState>({
    isActive: false,
    lastRefreshedAt: null,
    seedTrackId: null,
    trackCount: 0,
  });

  const [history, setHistory] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [originalQueueOrder, setOriginalQueueOrder] = useState<Track[]>([]);

  const [lastAutoQueueCount] = useState(0);
  const loadIdRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const failedTracksRef = useRef<Set<number>>(new Set());
  const isInitialMountRef = useRef(true);
  const isPlayPauseOperationRef = useRef(false);
  const lastStateSyncRef = useRef<{ time: number; wasPlaying: boolean } | null>(
    null,
  );
  const isPlayingRef = useRef(isPlaying);

  const queue = useMemo(
    () => queuedTracks.map((qt) => qt.track),
    [queuedTracks],
  );
  const currentTrack = queue[0] ?? null;

  const generateQueueId = useCallback(() => {
    return `queue-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  const createQueuedTrack = useCallback(
    (track: Track, source: "user" | "smart"): QueuedTrack => {
      return {
        track,
        queueSource: source,
        addedAt: new Date(),
        queueId: generateQueueId(),
      };
    },
    [generateQueueId],
  );

  const getQueueSections = useCallback(() => {
    const userTracks: QueuedTrack[] = [];
    const smartTracks: QueuedTrack[] = [];

    queuedTracks.slice(1).forEach((qt) => {
      if (qt.queueSource === "smart") {
        smartTracks.push(qt);
      } else {
        userTracks.push(qt);
      }
    });

    return { userTracks, smartTracks };
  }, [queuedTracks]);

  useEffect(() => {
    const savedVolume = localStorage.getOrDefault(STORAGE_KEYS.VOLUME, 0.7);
    const savedRate = localStorage.getOrDefault(STORAGE_KEYS.PLAYBACK_RATE, 1);

    setVolume(savedVolume);
    setPlaybackRate(savedRate);

    if (initialQueueState && initialQueueState.queuedTracks.length > 0) {
      logger.info("[useAudioPlayer] 📥 Restoring queue state from database");
      setQueuedTracks(initialQueueState.queuedTracks);
      setSmartQueueState(initialQueueState.smartQueueState);
      setHistory(initialQueueState.history);
      setIsShuffled(initialQueueState.isShuffled);
      setRepeatMode(initialQueueState.repeatMode);
      return;
    }

    const persistedState = loadPersistedQueueState();
    if (persistedState) {

      interface PersistedStateV2 {
        version: 2;
        queuedTracks: QueuedTrack[];
        smartQueueState?: SmartQueueState;
        history: Track[];
        isShuffled: boolean;
        repeatMode: RepeatMode;
        currentTime: number;
      }

      const isV2State = (state: unknown): state is PersistedStateV2 => {
        return (
          typeof state === "object" &&
          state !== null &&
          "queuedTracks" in state &&
          Array.isArray(state.queuedTracks)
        );
      };

      const hasQueuedTracks =
        isV2State(persistedState) && persistedState.queuedTracks.length > 0;
      const hasLegacyQueue =
        "queue" in persistedState &&
        Array.isArray(persistedState.queue) &&
        persistedState.queue.length > 0;

      if (hasQueuedTracks || hasLegacyQueue) {

        if (isV2State(persistedState)) {
          setQueuedTracks(persistedState.queuedTracks);
          if (persistedState.smartQueueState) {
            setSmartQueueState(persistedState.smartQueueState);
          }
        } else if ("queue" in persistedState && persistedState.queue) {

          const migratedTracks = persistedState.queue.map((track, idx) => ({
            track,
            queueSource: "user" as const,
            addedAt: new Date(),
            queueId: `migrated-${track.id}-${idx}`,
          }));
          setQueuedTracks(migratedTracks);
        }
        setHistory(persistedState.history);
        setIsShuffled(persistedState.isShuffled);
        setRepeatMode(persistedState.repeatMode);

      } else {

        logger.debug(
          "[useAudioPlayer] Queue was cleared, not restoring from persistence",
        );
      }
    }

  }, []);

  useEffect(() => {
    localStorage.set(STORAGE_KEYS.VOLUME, volume);
  }, [volume]);

  useEffect(() => {
    localStorage.set(STORAGE_KEYS.PLAYBACK_RATE, playbackRate);
  }, [playbackRate]);

  useEffect(() => {
    const queueState = {
      version: 2 as const,
      queuedTracks,
      smartQueueState,
      history,
      currentTime,
      isShuffled,
      repeatMode,
    };
    localStorage.set(STORAGE_KEYS.QUEUE_STATE, queueState);
  }, [
    queuedTracks,
    smartQueueState,
    history,
    currentTime,
    isShuffled,
    repeatMode,
  ]);

  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  useEffect(() => {
    if (audioRef.current && currentTrack && !audioRef.current.src) {

      logger.debug(
        "[useAudioPlayer] 🔄 Restoring audio source from localStorage (no autoplay)",
      );
      const streamUrl = getStreamUrlById(currentTrack.id.toString());
      audioRef.current.src = streamUrl;
      audioRef.current.load();

    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  const handleTrackEnd = useCallback(() => {
    if (!currentTrack) return;

    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {

        });
      }
      return;
    }

    if (queuedTracks.length > 1) {

      setHistory((prev) => [...prev, currentTrack]);
      setQueuedTracks((prev) => prev.slice(1));
    } else if (repeatMode === "all") {

      if (history.length > 0) {
        const allTracks = [...history, currentTrack];
        const newQueuedTracks = allTracks.map((track, idx) => ({
          track,
          queueSource: "user" as const,
          addedAt: new Date(),
          queueId: `repeat-${track.id}-${idx}`,
        }));
        setQueuedTracks(newQueuedTracks);
        setHistory([]);
      }
    } else {

      onTrackEnd?.(currentTrack);

      setQueuedTracks([]);
      setIsPlaying(false);
      logger.debug("[useAudioPlayer] 🏁 Playback ended, queue cleared");
    }
  }, [currentTrack, queuedTracks, repeatMode, history, onTrackEnd]);

  useEffect(() => {
    if (
      !currentTrack ||
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator)
    )
      return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist.name,
      album: currentTrack.album.title,
      artwork: [
        currentTrack.album.cover_small
          ? {
              src: currentTrack.album.cover_small,
              sizes: "56x56",
              type: "image/jpeg",
            }
          : undefined,
        currentTrack.album.cover_medium
          ? {
              src: currentTrack.album.cover_medium,
              sizes: "250x250",
              type: "image/jpeg",
            }
          : undefined,
        currentTrack.album.cover_big
          ? {
              src: currentTrack.album.cover_big,
              sizes: "500x500",
              type: "image/jpeg",
            }
          : undefined,
        currentTrack.album.cover_xl
          ? {
              src: currentTrack.album.cover_xl,
              sizes: "1000x1000",
              type: "image/jpeg",
            }
          : undefined,
      ].filter(
        (artwork): artwork is NonNullable<typeof artwork> =>
          artwork !== undefined,
      ),
    });

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const newTime = audio.currentTime;

      if (
        Math.floor(newTime) % 5 === 0 &&
        Math.floor(newTime) !== Math.floor(currentTime)
      ) {
        logger.debug("[useAudioPlayer] Time update:", {
          currentTime: newTime,
          paused: audio.paused,
          readyState: audio.readyState,
          src: audio.src.substring(0, 50) + "...",
        });
      }
      setCurrentTime(newTime);
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handlePlay = () => {

      if (!isPlayPauseOperationRef.current && !isPlayingRef.current) {
        setIsPlaying(true);
      }
    };
    const handlePause = () => {

      if (!isPlayPauseOperationRef.current && isPlayingRef.current) {
        setIsPlaying(false);
      }
    };
    const handleEnded = () => handleTrackEnd();
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e: Event) => {

      const target = e.target as HTMLAudioElement;
      const error = target.error;

      if (error?.code === MediaError.MEDIA_ERR_ABORTED) {

        return;
      }

      const errorMessage = error?.message ?? "";

      const isAborted =
        errorMessage.includes("aborted") ||
        errorMessage.includes("AbortError") ||
        (errorMessage.includes("fetching process") &&
          errorMessage.includes("aborted"));

      if (isAborted) {

        logger.debug(
          "[useAudioPlayer] Fetch aborted (normal during rapid track changes)",
        );
        return;
      }

      const isHttpError =
        /^\d{3}:/.test(errorMessage) ||
        errorMessage.includes("Service Unavailable") ||
        errorMessage.includes("503");
      const isUpstreamError =
        errorMessage.includes("upstream error") ||
        errorMessage.includes("ServiceUnavailableException");

      if (isHttpError && currentTrack) {

        if (isUpstreamError) {
          logger.warn(
            `[useAudioPlayer] Upstream error for track ${currentTrack.id} - may be temporary:`,
            errorMessage,
          );
          setIsLoading(false);
          setIsPlaying(false);
          onError?.(errorMessage, currentTrack.id);

          retryCountRef.current = 0;
          return;
        }

        failedTracksRef.current.add(currentTrack.id);
        logger.error(
          `Audio error for track ${currentTrack.id}:`,
          errorMessage,
        );
        setIsLoading(false);
        setIsPlaying(false);

        onError?.(errorMessage, currentTrack.id);

        retryCountRef.current = 0;
        return;
      }

      logger.error("Audio error:", errorMessage || "Unknown error");
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [handleTrackEnd, currentTrack, onError, currentTime]);

  const loadTrack = useCallback(
    (track: Track, streamUrl: string) => {
      if (!audioRef.current) return;

      if (failedTracksRef.current.has(track.id)) {
        logger.warn(
          `[useAudioPlayer] Track ${track.id} previously failed, skipping load`,
        );
        setIsLoading(false);
        setIsPlaying(false);
        return;
      }

      const currentLoadId = ++loadIdRef.current;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (currentTrack?.id !== track.id) {
        retryCountRef.current = 0;
      }

      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (error) {
        logger.debug("[useAudioPlayer] Error resetting audio:", error);
      }

      const applySource = () => {

        if (currentLoadId !== loadIdRef.current) {
          logger.debug(
            "[useAudioPlayer] Load cancelled, newer load in progress",
          );
          return false;
        }

        if (!audioRef.current) return false;

        try {
          logger.debug("[useAudioPlayer] Setting audio source:", {
            streamUrl,
            currentSrc: audioRef.current.src,
            readyState: audioRef.current.readyState,
          });
          audioRef.current.src = streamUrl;
          audioRef.current.load();
          logger.debug("[useAudioPlayer] Audio source set and load() called");
          return true;
        } catch (error) {

          if (
            error instanceof DOMException &&
            (error.name === "AbortError" ||
              error.message?.includes("aborted") ||
              error.message?.includes("fetching process"))
          ) {
            logger.debug(
              "[useAudioPlayer] Loading aborted for new source (ignored).",
            );
            return false;
          } else {
            logger.error(
              "[useAudioPlayer] Failed to load new audio source:",
              error,
            );
            return false;
          }
        }
      };

      const applied = applySource();
      if (!applied) {

        if (retryCountRef.current < maxRetries) {
          const delay =
            AUDIO_CONSTANTS.AUDIO_LOAD_RETRY_DELAY_MS *
            Math.pow(2, retryCountRef.current);
          retryCountRef.current++;

          retryTimeoutRef.current = setTimeout(() => {
            if (currentLoadId === loadIdRef.current && audioRef.current) {
              applySource();
            }
          }, delay);
        } else {

          logger.error(
            `[useAudioPlayer] Max retries (${maxRetries}) exceeded for track ${track.id}`,
          );
          failedTracksRef.current.add(track.id);
          retryCountRef.current = 0;
          setIsLoading(false);
          setIsPlaying(false);
          onError?.(
            `Failed to load track after ${maxRetries} retries`,
            track.id,
          );
        }
      } else {

        retryCountRef.current = 0;
      }

      onTrackChange?.(track);
    },
    [currentTrack, onTrackChange, onError],
  );

  const play = useCallback(async () => {
    if (!audioRef.current) {
      logger.warn(
        "[useAudioPlayer] play() called but audioRef.current is null",
      );
      return;
    }

    if (isPlayPauseOperationRef.current) {
      logger.debug(
        "[useAudioPlayer] Play operation already in progress, skipping",
      );
      return;
    }

    isPlayPauseOperationRef.current = true;

    try {
      logger.debug("[useAudioPlayer] Attempting to play audio", {
        src: audioRef.current.src,
        readyState: audioRef.current.readyState,
        paused: audioRef.current.paused,
        currentTime: audioRef.current.currentTime,
      });

      const { getAudioConnection, ensureConnectionChain } =
        await import("@/utils/audioContextManager");
      const connection = getAudioConnection(audioRef.current);
      if (connection) {
        logger.debug("[useAudioPlayer] Audio connected to Web Audio API", {
          contextState: connection.audioContext.state,
          hasAnalyser: !!connection.analyser,
          hasFilters: !!connection.filters,
        });

        ensureConnectionChain(connection);

        if (connection.audioContext.state === "suspended") {
          logger.debug("[useAudioPlayer] Resuming suspended audio context");
          await connection.audioContext.resume();
        }
      } else {
        logger.debug(
          "[useAudioPlayer] Audio not connected to Web Audio API (normal playback)",
        );
      }

      if (!audioRef.current.src) {
        logger.warn("[useAudioPlayer] No audio source set, cannot play");
        setIsPlaying(false);
        return;
      }

      if (audioRef.current.readyState < 2) {
        logger.debug(
          "[useAudioPlayer] Audio not ready, waiting for canplay event",
        );

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Audio load timeout"));
          }, 10000);

          const handleCanPlay = () => {
            clearTimeout(timeout);
            audioRef.current?.removeEventListener("canplay", handleCanPlay);
            audioRef.current?.removeEventListener("error", handleError);
            resolve();
          };

          const handleError = () => {
            clearTimeout(timeout);
            audioRef.current?.removeEventListener("canplay", handleCanPlay);
            audioRef.current?.removeEventListener("error", handleError);
            reject(new Error("Audio load error"));
          };

          audioRef.current?.addEventListener("canplay", handleCanPlay, {
            once: true,
          });
          audioRef.current?.addEventListener("error", handleError, {
            once: true,
          });
        });
      }

      const playPromise = audioRef.current.play();
      logger.debug("[useAudioPlayer] play() called, waiting for promise...");

      await playPromise;
      logger.debug("[useAudioPlayer] Playback started successfully", {
        paused: audioRef.current.paused,
        currentTime: audioRef.current.currentTime,
        readyState: audioRef.current.readyState,
      });

      if (connection) {
        logger.debug(
          "[useAudioPlayer] Verifying connection chain after play...",
        );
        const { verifyConnectionChain } =
          await import("@/utils/audioContextManager");
        const isValid = verifyConnectionChain(connection);
        if (!isValid) {
          logger.warn(
            "[useAudioPlayer] Connection chain invalid, rebuilding...",
          );
          const { ensureConnectionChain } =
            await import("@/utils/audioContextManager");
          ensureConnectionChain(connection);
        } else {
          logger.debug("[useAudioPlayer] Connection chain verified");
        }
      }

      setIsPlaying(true);
    } catch (err) {
      logger.error("[useAudioPlayer] Playback failed:", err);
      logger.error("[useAudioPlayer] Error details:", {
        name: err instanceof Error ? err.name : "Unknown",
        message: err instanceof Error ? err.message : String(err),
        audioState: audioRef.current
          ? {
              src: audioRef.current.src,
              paused: audioRef.current.paused,
              readyState: audioRef.current.readyState,
              currentTime: audioRef.current.currentTime,
            }
          : "no audio element",
      });
      setIsPlaying(false);
    } finally {

      setTimeout(() => {
        isPlayPauseOperationRef.current = false;
      }, 100);
    }
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) {
      logger.warn(
        "[useAudioPlayer] Cannot pause: audio element not initialized",
      );
      setIsPlaying(false);
      return;
    }

    if (isPlayPauseOperationRef.current) {
      logger.debug(
        "[useAudioPlayer] Pause operation already in progress, skipping",
      );
      return;
    }

    isPlayPauseOperationRef.current = true;

    try {
      audioRef.current.pause();

      setIsPlaying(false);
    } catch (error) {
      logger.error("[useAudioPlayer] Error pausing audio:", error);
      setIsPlaying(false);
    } finally {

      setTimeout(() => {
        isPlayPauseOperationRef.current = false;
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;

    const togglePlayPause = () => {
      if (audioRef.current && !isPlayPauseOperationRef.current) {

        const isActuallyPlaying = !audioRef.current.paused;
        if (isActuallyPlaying) {
          pause();
        } else {
          play().catch((error) => {
            logger.error("Playback failed:", error);
          });
        }
      }
    };

    const handleNextTrack = () => {

      if (queue.length > 1) {
        setHistory((prev) => [...prev, currentTrack!]);
        setQueuedTracks((prev) => prev.slice(1));
      }
    };

    const handlePreviousTrack = () => {

      if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
      } else if (history.length > 0) {

        const prevTrack = history[history.length - 1];
        if (prevTrack && currentTrack) {
          setQueuedTracks((prev) => [
            createQueuedTrack(prevTrack, "user"),
            ...prev,
          ]);
        }
        setHistory((prev) => prev.slice(0, -1));
      }
    };

    const handleSeekBackward = (details: MediaSessionActionDetails) => {
      if (audioRef.current) {
        const seekTime = details.seekOffset ?? 10;
        audioRef.current.currentTime = Math.max(
          0,
          audioRef.current.currentTime - seekTime,
        );
      }
    };

    const handleSeekForward = (details: MediaSessionActionDetails) => {
      if (audioRef.current) {
        const seekTime = details.seekOffset ?? 10;
        audioRef.current.currentTime = Math.min(
          audioRef.current.duration,
          audioRef.current.currentTime + seekTime,
        );
      }
    };

    const handleSeekTo = (details: MediaSessionActionDetails) => {
      if (audioRef.current && details.seekTime !== undefined) {
        audioRef.current.currentTime = details.seekTime;
      }
    };

    try {
      navigator.mediaSession.setActionHandler("play", togglePlayPause);
      navigator.mediaSession.setActionHandler("pause", togglePlayPause);
      navigator.mediaSession.setActionHandler("nexttrack", handleNextTrack);
      navigator.mediaSession.setActionHandler(
        "previoustrack",
        handlePreviousTrack,
      );
      navigator.mediaSession.setActionHandler(
        "seekbackward",
        handleSeekBackward,
      );
      navigator.mediaSession.setActionHandler("seekforward", handleSeekForward);
      navigator.mediaSession.setActionHandler("seekto", handleSeekTo);
    } catch (error) {
      logger.error("Failed to set media session handlers:", error);
    }

    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      } catch {

      }
    };
  }, [currentTrack, queue, history, isPlaying, play, pause, createQueuedTrack]);

  const togglePlay = useCallback(async () => {

    const isActuallyPlaying = audioRef.current && !audioRef.current.paused;

    logger.debug("[useAudioPlayer] togglePlay called", {
      reactState_isPlaying: isPlaying,
      audioElement_paused: audioRef.current?.paused,
      isActuallyPlaying,
      willCall: isActuallyPlaying ? "pause()" : "play()",
    });

    if (isActuallyPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;

    if (!isFinite(time)) {
      logger.error(`[useAudioPlayer] ❌ Invalid seek time: ${time}`);
      return;
    }

    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const playPrevious = useCallback(() => {
    if (history.length === 0) return null;

    const previousTracks = [...history];
    const prevTrack = previousTracks.pop()!;
    setHistory(previousTracks);

    setQueuedTracks((prev) => [createQueuedTrack(prevTrack, "user"), ...prev]);

    return prevTrack;
  }, [history, createQueuedTrack]);

  const isValidTrack = useCallback(
    (track: Track | null | undefined): track is Track => {
      if (!track) return false;

      return (
        typeof track.id === "number" &&
        track.id > 0 &&
        typeof track.title === "string" &&
        track.title.length > 0 &&
        typeof track.duration === "number" &&
        track.duration > 0 &&
        track.artist?.id != null &&
        typeof track.artist?.name === "string" &&
        track.artist.name.length > 0 &&
        track.album?.id != null &&
        typeof track.album?.title === "string" &&
        track.album.title.length > 0
      );
    },
    [],
  );

  const addToQueue = useCallback(
    (track: Track | Track[], checkDuplicates = true) => {
      const tracks = Array.isArray(track) ? track : [track];

      logger.debug("[useAudioPlayer] 📥 addToQueue called:", {
        trackCount: tracks.length,
        checkDuplicates,
        currentQueueSize: queuedTracks.length,
        tracks: tracks.map((t) => `${t.title} - ${t.artist.name}`),
      });

      const validTracks = tracks.filter((t): t is Track => {
        const valid = isValidTrack(t);
        if (!valid) {
          logger.warn(
            `[useAudioPlayer] ⚠️ Rejecting invalid track:`,
            t && typeof t === "object" && "title" in t
              ? (t as Track).title
              : "any",
          );
        }
        return valid;
      });

      if (validTracks.length === 0) {
        logger.warn("[useAudioPlayer] ❌ No valid tracks to add to queue");
        return;
      }

      if (checkDuplicates) {

        const duplicates = validTracks.filter((t) =>
          queuedTracks.some((qt) => qt.track.id === t.id),
        );

        if (duplicates.length > 0 && onDuplicateTrack) {
          duplicates.forEach((dup) => onDuplicateTrack?.(dup));
        }

        const uniqueTracks = validTracks.filter(
          (t) => !queuedTracks.some((qt) => qt.track.id === t.id),
        );

        logger.debug("[useAudioPlayer] 🔍 After validation & duplicate check:", {
          original: tracks.length,
          valid: validTracks.length,
          duplicates: duplicates.length,
          uniqueTracks: uniqueTracks.length,
        });

        if (uniqueTracks.length > 0) {
          const newQueuedTracks = uniqueTracks.map((t) =>
            createQueuedTrack(t, "user"),
          );
          setQueuedTracks((prev) => {
            logger.debug("[useAudioPlayer] ✅ Adding tracks to queue:", {
              previousSize: prev.length,
              adding: newQueuedTracks.length,
              newSize: prev.length + newQueuedTracks.length,
            });

            return [...prev, ...newQueuedTracks];
          });
        } else {
          logger.debug(
            "[useAudioPlayer] ⚠️ No unique valid tracks to add (filtered out)",
          );
        }
      } else {
        logger.debug(
          "[useAudioPlayer] ➕ Adding valid tracks without duplicate check",
        );
        const newQueuedTracks = validTracks.map((t) =>
          createQueuedTrack(t, "user"),
        );
        setQueuedTracks((prev) => {
          logger.debug("[useAudioPlayer] ✅ Queue updated:", {
            previousSize: prev.length,
            adding: newQueuedTracks.length,
            newSize: prev.length + newQueuedTracks.length,
          });
          return [...prev, ...newQueuedTracks];
        });
      }
    },
    [queuedTracks, createQueuedTrack, onDuplicateTrack, isValidTrack],
  );

  const addToPlayNext = useCallback(
    (track: Track | Track[]) => {
      const tracks = Array.isArray(track) ? track : [track];

      const validTracks = tracks.filter((t): t is Track => {
        const valid = isValidTrack(t);
        if (!valid) {
          logger.warn(
            `[useAudioPlayer] ⚠️ Rejecting invalid track in addToPlayNext:`,
            t && typeof t === "object" && "title" in t
              ? (t as Track).title
              : "Unknown",
          );
        }
        return valid;
      });

      if (validTracks.length === 0) {
        logger.warn("[useAudioPlayer] ❌ No valid tracks to add to play next");
        return;
      }

      const newQueuedTracks = validTracks.map((t) =>
        createQueuedTrack(t, "user"),
      );
      setQueuedTracks((prev) => {
        if (prev.length === 0) {
          return newQueuedTracks;
        }
        const [current, ...rest] = prev;
        return [current!, ...newQueuedTracks, ...rest];
      });
    },
    [createQueuedTrack, isValidTrack],
  );

  const removeFromQueue = useCallback((index: number) => {
    logger.debug("[useAudioPlayer] removeFromQueue called", {
      index,
      isCurrentTrack: index === 0,
    });

    if (index === 0) {
      logger.warn(
        "[useAudioPlayer] Cannot remove currently playing track (queuedTracks[0])",
      );
      return;
    }

    setQueuedTracks((prev) => {
      const newQueue = prev.filter((_, i) => i !== index);
      logger.debug("[useAudioPlayer] Queue updated after removal", {
        previousLength: prev.length,
        newLength: newQueue.length,
        removedIndex: index,
      });
      return newQueue;
    });
  }, []);

  const clearQueue = useCallback(() => {

    const newQueue = queuedTracks.length > 0 ? [queuedTracks[0]!] : [];
    setQueuedTracks(newQueue);

    if (newQueue.length === 0) {
      clearPersistedQueueState();
    }
  }, [queuedTracks]);

  const reorderQueue = useCallback((oldIndex: number, newIndex: number) => {

    if (oldIndex === 0 || newIndex === 0) {
      logger.warn(
        "[useAudioPlayer] Cannot reorder currently playing track (queuedTracks[0])",
      );
      return;
    }

    setQueuedTracks((prev) => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(oldIndex, 1);

      if (removed) {
        newQueue.splice(newIndex, 0, removed);
      }

      return newQueue;
    });
  }, []);

  const playFromQueue = useCallback(
    (index: number) => {
      if (index < 0 || index >= queue.length) return null;

      const selectedTrack = queue[index];
      if (!selectedTrack) return null;

      const tracksToHistory = queue.slice(0, index);
      const tracksAfter = queue.slice(index + 1);

      setHistory((prev) => [...prev, ...tracksToHistory]);
      setQueuedTracks([
        createQueuedTrack(selectedTrack, "user"),
        ...tracksAfter.map((t) => createQueuedTrack(t, "user")),
      ]);

      return selectedTrack;
    },
    [queue, createQueuedTrack],
  );

  const smartShuffle = useCallback(() => {
    setQueuedTracks((prev) => {
      if (prev.length <= 1) return prev;

      const [currentQueuedTrack, ...rest] = prev;
      if (rest.length === 0) return prev;

      const shuffled = rest.map((qt) => qt.track);
      const artists = new Map<number, Track[]>();

      shuffled.forEach((track) => {
        const artistId = track.artist.id;

        if (!artists.has(artistId)) {
          artists.set(artistId, []);
        }

        artists.get(artistId)!.push(track);
      });

      const result: Track[] = [];
      const artistIds = Array.from(artists.keys());

      for (let i = artistIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [artistIds[i], artistIds[j]] = [artistIds[j]!, artistIds[i]!];
      }

      let lastArtistId: number | null = null;
      const tempPool = [...shuffled];

      while (tempPool.length > 0) {
        let foundDifferent = false;

        for (let i = 0; i < tempPool.length; i++) {
          const track = tempPool[i];

          if (!track) continue;

          if (!lastArtistId || track.artist.id !== lastArtistId) {
            result.push(track);
            lastArtistId = track.artist.id;
            tempPool.splice(i, 1);
            foundDifferent = true;
            break;
          }
        }

        if (!foundDifferent && tempPool.length > 0) {
          const track = tempPool.shift();

          if (track) {
            result.push(track);
            lastArtistId = track.artist.id;
          }
        }
      }

      return [
        currentQueuedTrack!,
        ...result.map((t) => createQueuedTrack(t, "user")),
      ];
    });
  }, [createQueuedTrack]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const newShuffleState = !prev;

      if (newShuffleState) {

        const [...rest] = queue;
        setOriginalQueueOrder(rest);
        smartShuffle();
      } else {

        if (originalQueueOrder.length > 0 && queue.length > 0) {
          const [current] = queue;
          setQueuedTracks([
            createQueuedTrack(current!, "user"),
            ...originalQueueOrder.map((t) => createQueuedTrack(t, "user")),
          ]);
          setOriginalQueueOrder([]);
        }
      }

      return newShuffleState;
    });
  }, [queue, originalQueueOrder, smartShuffle, createQueuedTrack]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "none") return "all";
      if (prev === "all") return "one";
      return "none";
    });
  }, []);

  const addSmartTracks = useCallback(
    async (count = 5): Promise<Track[]> => {
      const currentQueuedTrack = queuedTracks[0];
      if (!currentQueuedTrack) {
        logger.warn(
          "[useAudioPlayer] ⚠️ Cannot add smart tracks: no current track",
        );
        return [];
      }

      const seedTrack = currentQueuedTrack.track;
      logger.debug(
        "[useAudioPlayer] 🎵 Adding smart tracks based on:",
        seedTrack.title,
      );

      try {

        if (options.onAutoQueueTrigger) {
          const recommendedTracks = await options.onAutoQueueTrigger(
            seedTrack,
            queuedTracks.length,
          );
          const tracksToAdd = recommendedTracks.slice(0, count);

          if (tracksToAdd.length > 0) {
            const smartQueuedTracks = tracksToAdd.map((t) =>
              createQueuedTrack(t, "smart"),
            );
            setQueuedTracks((prev) => [...prev, ...smartQueuedTracks]);
            setSmartQueueState({
              isActive: true,
              lastRefreshedAt: new Date(),
              seedTrackId: seedTrack.id,
              trackCount: tracksToAdd.length,
            });
            logger.debug(
              `[useAudioPlayer] ✅ Added ${tracksToAdd.length} smart tracks to queue`,
            );
            return tracksToAdd;
          }
        }
        return [];
      } catch (error) {
        logger.error("[useAudioPlayer] ❌ Failed to add smart tracks:", error);
        return [];
      }
    },
    [queuedTracks, createQueuedTrack, options],
  );

  const refreshSmartTracks = useCallback(async (): Promise<void> => {
    logger.debug("[useAudioPlayer] 🔄 Refreshing smart tracks");

    setQueuedTracks((prev) => prev.filter((qt) => qt.queueSource !== "smart"));

    await addSmartTracks();
  }, [addSmartTracks]);

  const clearSmartTracks = useCallback(() => {
    logger.debug("[useAudioPlayer] 🧹 Clearing smart tracks");
    setQueuedTracks((prev) => prev.filter((qt) => qt.queueSource !== "smart"));
    setSmartQueueState({
      isActive: false,
      lastRefreshedAt: null,
      seedTrackId: null,
      trackCount: 0,
    });
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    setVolume((prev) => Math.max(0, Math.min(1, prev + delta)));
  }, []);

  const skipForward = useCallback(
    (seconds = 10) => {
      if (!audioRef.current) return;

      const validSeconds = isFinite(seconds) ? seconds : 10;

      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;

      if (!isFinite(currentTime) || !isFinite(duration)) {
        logger.warn(
          `[useAudioPlayer] ⚠️ Skip forward failed: audio not ready (currentTime: ${currentTime}, duration: ${duration})`,
        );
        return;
      }

      const newTime = Math.min(duration, currentTime + validSeconds);

      if (!isFinite(newTime)) {
        logger.error(
          `[useAudioPlayer] ❌ Skip forward calculated invalid time: ${newTime} (currentTime: ${currentTime}, duration: ${duration}, seconds: ${validSeconds})`,
        );
        return;
      }

      logger.debug(
        `[useAudioPlayer] ⏩ Skip forward ${validSeconds}s: ${currentTime.toFixed(1)}s → ${newTime.toFixed(1)}s`,
      );
      seek(newTime);
    },
    [seek],
  );

  const skipBackward = useCallback(
    (seconds = 10) => {
      if (!audioRef.current) return;

      const validSeconds = isFinite(seconds) ? seconds : 10;

      const currentTime = audioRef.current.currentTime;

      if (!isFinite(currentTime)) {
        logger.warn(
          `[useAudioPlayer] ⚠️ Skip backward failed: audio not ready (currentTime: ${currentTime})`,
        );
        return;
      }

      const newTime = Math.max(0, currentTime - validSeconds);

      if (!isFinite(newTime)) {
        logger.error(
          `[useAudioPlayer] ❌ Skip backward calculated invalid time: ${newTime} (currentTime: ${currentTime}, seconds: ${validSeconds})`,
        );
        return;
      }

      logger.debug(
        `[useAudioPlayer] ⏪ Skip backward ${validSeconds}s: ${currentTime.toFixed(1)}s → ${newTime.toFixed(1)}s`,
      );
      seek(newTime);
    },
    [seek],
  );

  useEffect(() => {

    if (isInitialMountRef.current) {
      logger.debug(
        "[useAudioPlayer] 🚫 Skipping auto-play on initial mount (browser autoplay policy)",
      );
      isInitialMountRef.current = false;
      return;
    }

    if (currentTrack && audioRef.current) {
      const streamUrl = getStreamUrlById(currentTrack.id.toString());

      if (audioRef.current.src !== streamUrl || !audioRef.current.src) {
        logger.debug(
          `[useAudioPlayer] 🎶 Loading new track: ${currentTrack.title}`,
          {
            streamUrl,
            currentSrc: audioRef.current.src,
          },
        );
        loadTrack(currentTrack, streamUrl);

        setTimeout(() => {
          play().catch((error) => {

            if (
              error instanceof DOMException &&
              (error.name === "AbortError" ||
                error.message?.includes("aborted") ||
                error.message?.includes("fetching process"))
            ) {
              logger.debug(
                "[useAudioPlayer] Playback aborted (normal during rapid track changes)",
              );
              return;
            }
            logger.error("Playback failed:", error);
          });
        }, 150);
      }

    }
  }, [currentTrack, loadTrack, play]);

  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (audioRef.current && !isPlayPauseOperationRef.current) {
        const actuallyPlaying = !audioRef.current.paused;

        if (actuallyPlaying !== isPlaying) {
          const now = Date.now();
          const lastSync = lastStateSyncRef.current;

          const shouldSync =
            !lastSync ||
            now - lastSync.time > 200 ||
            lastSync.wasPlaying !== actuallyPlaying;

          if (shouldSync) {
            logger.debug(
              "[useAudioPlayer] 🔄 Syncing state: audio is",
              actuallyPlaying ? "playing" : "paused",
              "but state says",
              isPlaying,
            );
            setIsPlaying(actuallyPlaying);
            lastStateSyncRef.current = {
              time: now,
              wasPlaying: actuallyPlaying,
            };
          }
        }
      }
    }, 500);

    return () => clearInterval(syncInterval);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const clearFailedTrack = useCallback((trackId: number) => {
    failedTracksRef.current.delete(trackId);
  }, []);

  const clearAllFailedTracks = useCallback(() => {
    failedTracksRef.current.clear();
  }, []);

  const removeDuplicates = useCallback(() => {
    setQueuedTracks((prev) => {
      if (prev.length <= 1) return prev;

      const seen = new Set<number>();
      const deduplicated: QueuedTrack[] = [];

      for (const qt of prev) {
        if (!seen.has(qt.track.id)) {
          seen.add(qt.track.id);
          deduplicated.push(qt);
        }
      }

      const removedCount = prev.length - deduplicated.length;
      if (removedCount > 0) {
        logger.debug(
          `[useAudioPlayer] 🧹 Removed ${removedCount} duplicate track${removedCount === 1 ? "" : "s"} from queue`,
        );
      }

      return deduplicated;
    });
  }, []);

  const cleanInvalidTracks = useCallback(() => {
    setQueuedTracks((prev) => {
      const valid = prev.filter((qt) => isValidTrack(qt.track));
      const removedCount = prev.length - valid.length;

      if (removedCount > 0) {
        logger.warn(
          `[useAudioPlayer] 🧹 Removed ${removedCount} invalid track${removedCount === 1 ? "" : "s"} from queue`,
        );
      }

      return valid;
    });
  }, [isValidTrack]);

  const cleanQueue = useCallback(() => {
    setQueuedTracks((prev) => {
      if (prev.length === 0) return prev;

      const valid = prev.filter((qt) => isValidTrack(qt.track));

      const seen = new Set<number>();
      const cleaned: QueuedTrack[] = [];

      for (const qt of valid) {
        if (!seen.has(qt.track.id)) {
          seen.add(qt.track.id);
          cleaned.push(qt);
        }
      }

      const removedInvalid = prev.length - valid.length;
      const removedDuplicates = valid.length - cleaned.length;
      const totalRemoved = removedInvalid + removedDuplicates;

      if (totalRemoved > 0) {
        logger.debug(
          `[useAudioPlayer] 🧹 Queue cleaned: removed ${removedInvalid} invalid, ${removedDuplicates} duplicate track${totalRemoved === 1 ? "" : "s"}`,
        );
      }

      return cleaned;
    });
  }, [isValidTrack]);

  const clearQueueAndHistory = useCallback(() => {
    logger.debug(
      "[useAudioPlayer] 🧹 Clearing queue and history (user session change)",
    );
    setQueuedTracks([]);
    setHistory([]);
    setOriginalQueueOrder([]);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    clearPersistedQueueState();
  }, []);

  const setVolumeWithValidation = useCallback((newVolume: number) => {

    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
  }, []);

  const playTrack = useCallback(
    (track: Track) => {

      if (!isValidTrack(track)) {
        logger.error(
          "[useAudioPlayer] ❌ Cannot play invalid track:",
          typeof track === "object" && track && "title" in track
            ? (track as Track).title
            : "Unknown",
        );
        return null;
      }

      const trackIndex = queue.findIndex((t) => t.id === track.id);

      if (trackIndex === -1) {

        logger.debug(
          "[useAudioPlayer] 🎵 Playing new track, inserting at queue position 0, preserving existing queue",
          {
            newTrack: track.title,
            currentQueueSize: queue.length,
          },
        );
        if (queue.length > 0 && currentTrack) {

          setHistory((prev) => [...prev, currentTrack]);
        }

        setQueuedTracks((prev) => [
          createQueuedTrack(track, "user"),
          ...prev.slice(1),
        ]);
      } else if (trackIndex === 0) {

        logger.debug(
          "[useAudioPlayer] 🔄 Track already playing, restarting from beginning",
        );
        if (audioRef.current) {
          const streamUrl = getStreamUrlById(track.id.toString());

          if (audioRef.current.src !== streamUrl || !audioRef.current.src) {

            logger.debug(
              "[useAudioPlayer] Audio source missing or different, reloading track",
              {
                currentSrc: audioRef.current.src,
                expectedSrc: streamUrl,
              },
            );
            loadTrack(track, streamUrl);
          } else {

            logger.debug("[useAudioPlayer] Restarting playback from beginning", {
              src: audioRef.current.src,
              currentTime: audioRef.current.currentTime,
              paused: audioRef.current.paused,
              readyState: audioRef.current.readyState,
            });
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((error) => {
              logger.error("Playback failed:", error);
              setIsPlaying(false);

              logger.debug(
                "[useAudioPlayer] Play failed, reloading track as fallback",
              );
              loadTrack(track, streamUrl);
            });
          }
        }
      } else {

        logger.debug(
          "[useAudioPlayer] ⏩ Track found in queue at position",
          trackIndex,
          ", playing from queue",
        );
        playFromQueue(trackIndex);
      }

      return track;
    },
    [queue, currentTrack, playFromQueue, isValidTrack, loadTrack, createQueuedTrack],
  );

  return {

    currentTrack,
    queue,
    queuedTracks,
    smartQueueState,
    history,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    playbackRate,
    isLoading,
    lastAutoQueueCount,

    loadTrack,
    play,
    pause,
    togglePlay,
    seek,
    playTrack,
    playNext: useCallback(() => {

      if (queue.length < 2) return null;

      const [currentTrack, nextTrack, ...remainingQueue] = queue;

      setHistory((prev) => [...prev, currentTrack!]);

      setQueuedTracks((prev) => prev.slice(1));
      return nextTrack!;
    }, [queue]),
    playPrevious,
    addToQueue,
    addToPlayNext,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    playFromQueue,
    toggleShuffle,
    cycleRepeatMode,
    setVolume: setVolumeWithValidation,
    setIsMuted,
    setPlaybackRate,
    adjustVolume,
    skipForward,
    skipBackward,
    clearFailedTrack,
    clearAllFailedTracks,

    removeDuplicates,
    cleanInvalidTracks,
    cleanQueue,
    clearQueueAndHistory,
    isValidTrack,

    addSmartTracks,
    refreshSmartTracks,
    clearSmartTracks,
    getQueueSections,

    audioRef,
  };
}

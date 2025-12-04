// File: src/contexts/AudioPlayerContext.tsx

"use client";

import { useToast } from "@/contexts/ToastContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { getStreamUrlById } from "@/utils/api";
import { useSession } from "next-auth/react";
import { createContext, useCallback, useContext, type ReactNode } from "react";

interface AudioPlayerContextType {
  // Player state
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";
  playbackRate: number;
  isLoading: boolean;
  isAutoQueueing: boolean;

  // Audio element reference for visualizer and equalizer
  audioElement: HTMLAudioElement | null;

  // Actions
  play: (track: Track) => void;
  togglePlay: () => Promise<void>;
  addToQueue: (track: Track | Track[], checkDuplicates?: boolean) => void;
  addToPlayNext: (track: Track | Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  playFromQueue: (index: number) => void;
  clearQueue: () => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (oldIndex: number, newIndex: number) => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setPlaybackRate: (rate: number) => void;
  skipForward: () => void;
  skipBackward: () => void;

  // Smart Queue
  addSimilarTracks: (trackId: number, count?: number) => Promise<void>;
  generateSmartMix: (seedTrackIds: number[], count?: number) => Promise<void>;
  saveQueueAsPlaylist: () => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined,
);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const addToHistory = api.music.addToHistory.useMutation();
  const createPlaylistMutation = api.music.createPlaylist.useMutation();
  const addToPlaylistMutation = api.music.addToPlaylist.useMutation();

  // Fetch smart queue settings
  const { data: smartQueueSettings } = api.music.getSmartQueueSettings.useQuery(
    undefined,
    { enabled: !!session },
  );

  // TRPC utils for imperative calls
  const utils = api.useUtils();

  // Mutation for fetching recommendations
  const generateSmartMixMutation = api.music.generateSmartMix.useMutation();

  // Mutation for logging recommendations
  const logRecommendationMutation = api.music.logRecommendation.useMutation();

  const hasCompleteTrackData = (track: Track | null | undefined): boolean => {
    if (!track) return false;

    const {
      id,
      readable,
      title,
      title_short,
      title_version,
      duration,
      rank,
      explicit_lyrics,
      explicit_content_lyrics,
      explicit_content_cover,
      preview,
      md5_image,
      artist,
      album,
    } = track as Partial<Track>;

    return (
      typeof id === "number" &&
      typeof readable === "boolean" &&
      typeof title === "string" &&
      typeof title_short === "string" &&
      typeof title_version === "string" &&
      typeof duration === "number" &&
      typeof rank === "number" &&
      typeof explicit_lyrics === "boolean" &&
      typeof explicit_content_lyrics === "number" &&
      typeof explicit_content_cover === "number" &&
      typeof preview === "string" &&
      typeof md5_image === "string" &&
      artist !== undefined &&
      album !== undefined &&
      typeof artist?.id === "number" &&
      typeof artist?.name === "string" &&
      typeof artist?.link === "string" &&
      typeof artist?.picture === "string" &&
      typeof artist?.picture_small === "string" &&
      typeof artist?.picture_medium === "string" &&
      typeof artist?.picture_big === "string" &&
      typeof artist?.picture_xl === "string" &&
      typeof artist?.tracklist === "string" &&
      typeof artist?.type === "string" &&
      typeof album?.id === "number" &&
      typeof album?.title === "string" &&
      typeof album?.cover === "string" &&
      typeof album?.cover_small === "string" &&
      typeof album?.cover_medium === "string" &&
      typeof album?.cover_big === "string" &&
      typeof album?.cover_xl === "string" &&
      typeof album?.md5_image === "string" &&
      typeof album?.tracklist === "string" &&
      typeof album?.type === "string"
    );
  };

  // Auto-queue trigger callback using the intelligent backend API
  const handleAutoQueueTrigger = useCallback(
    async (currentTrack: Track, _queueLength: number) => {
      if (!session || !smartQueueSettings) return [];
      try {
        const startTime = performance.now();
        const artistName = currentTrack.artist?.name ?? "";
        const title = currentTrack.title ?? "";
        const trackName = [artistName, title].filter(Boolean).join(" ").trim();
        const excludeIds = [currentTrack.id]
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id));

        // Calculate how many tracks we need:
        // - Always request at least 10 to have enough for the dynamic calculation
        // - The actual number added will be calculated in useAudioPlayer based on _queueLength
        const requestCount = Math.max(10, Math.ceil((20 - _queueLength) * 1.5));

        // Use the intelligent recommendations API through tRPC (server-side, no CORS)
        const tracks =
          await utils.client.music.getIntelligentRecommendations.query({
            trackNames: trackName ? [trackName] : [String(currentTrack.id)],
            count: requestCount,
            excludeTrackIds: excludeIds,
          });

        const responseTime = Math.round(performance.now() - startTime);

        // Log the recommendation
        if (tracks && tracks.length > 0) {
          const validSeedTracks = hasCompleteTrackData(currentTrack)
            ? [currentTrack]
            : [];
          const validRecommendedTracks = tracks.filter((t): t is Track =>
            hasCompleteTrackData(t),
          );

          if (validSeedTracks.length > 0 && validRecommendedTracks.length > 0) {
            logRecommendationMutation.mutate({
              seedTracks: validSeedTracks,
              recommendedTracks: validRecommendedTracks,
              source: "hexmusic-api",
              requestParams: {
                count: requestCount,
                similarityLevel:
                  smartQueueSettings.similarityPreference || "balanced",
                useAudioFeatures: smartQueueSettings.smartMixEnabled,
              },
              responseTime,
              success: true,
              context: "auto-queue",
            });
          } else {
            console.warn(
              "[AudioPlayerContext] ⚠️ Skipping logRecommendation due to incomplete track data",
              {
                seedTrackValid: validSeedTracks.length > 0,
                recommendedCount: validRecommendedTracks.length,
              },
            );
          }
        }

        return tracks ?? [];
      } catch (error) {
        console.error("Failed to fetch auto-queue recommendations:", error);
        return [];
      }
    },
    [session, smartQueueSettings, utils, logRecommendationMutation],
  );

  const player = useAudioPlayer({
    onTrackChange: (track) => {
      if (track && session) {
        if (hasCompleteTrackData(track)) {
          addToHistory.mutate({
            track,
            duration:
              typeof track.duration === "number" ? track.duration : undefined,
          });
        } else {
          console.warn(
            "[AudioPlayerContext] ⚠️ Skipping addToHistory due to incomplete track data",
            {
              trackId: track.id,
            },
          );
        }
      }
    },
    onAutoQueueTrigger: handleAutoQueueTrigger,
    onError: (error, trackId) => {
      console.error(
        `[AudioPlayerContext] Playback error for track ${trackId}:`,
        error,
      );

      // Check for upstream errors (backend can't reach upstream service)
      if (
        error.includes("upstream error") ||
        error.includes("ServiceUnavailableException")
      ) {
        showToast(
          "Music service temporarily unavailable. The backend cannot reach the music source. Please try again in a moment.",
          "error",
        );
      } else if (
        error.includes("503") ||
        error.includes("Service Unavailable")
      ) {
        showToast(
          "Streaming service unavailable. Please try again later.",
          "error",
        );
      } else {
        showToast("Playback failed. Please try again.", "error");
      }
    },
    smartQueueSettings: smartQueueSettings ?? undefined,
  });

  const play = useCallback(
    (track: Track) => {
      const streamUrl = getStreamUrlById(track.id.toString());
      player.loadTrack(track, streamUrl);
      player.play().catch((error) => {
        // Ignore abort errors - these are normal when switching tracks quickly
        if (
          error instanceof DOMException &&
          (error.name === "AbortError" ||
            error.message?.includes("aborted") ||
            error.message?.includes("fetching process"))
        ) {
          console.debug(
            "[AudioPlayerContext] Playback aborted (normal during rapid track changes)",
          );
          return;
        }
        console.error("Playback failed:", error);
        showToast("Playback failed. Please try again.", "error");
      });
    },
    [player, showToast],
  );

  const playNext = useCallback(() => {
    const nextTrack = player.playNext();
    if (nextTrack) {
      const streamUrl = getStreamUrlById(nextTrack.id.toString());
      player.loadTrack(nextTrack, streamUrl);
      player.play().catch((error) => {
        // Ignore abort errors - these are normal when switching tracks quickly
        if (
          error instanceof DOMException &&
          (error.name === "AbortError" ||
            error.message?.includes("aborted") ||
            error.message?.includes("fetching process"))
        ) {
          console.debug(
            "[AudioPlayerContext] Playback aborted (normal during rapid track changes)",
          );
          return;
        }
        console.error("Playback failed:", error);
        showToast("Playback failed. Please try again.", "error");
      });
    }
  }, [player, showToast]);

  const playPrevious = useCallback(() => {
    const prevTrack = player.playPrevious();
    if (prevTrack) {
      const streamUrl = getStreamUrlById(prevTrack.id.toString());
      player.loadTrack(prevTrack, streamUrl);
      player.play().catch((error) => {
        // Ignore abort errors - these are normal when switching tracks quickly
        if (
          error instanceof DOMException &&
          (error.name === "AbortError" ||
            error.message?.includes("aborted") ||
            error.message?.includes("fetching process"))
        ) {
          console.debug(
            "[AudioPlayerContext] Playback aborted (normal during rapid track changes)",
          );
          return;
        }
        console.error("Playback failed:", error);
        showToast("Playback failed. Please try again.", "error");
      });
    }
  }, [player, showToast]);

  const playFromQueue = useCallback(
    (index: number) => {
      const track = player.playFromQueue(index);
      if (track) {
        const streamUrl = getStreamUrlById(track.id.toString());
        player.loadTrack(track, streamUrl);
        player.play().catch((error) => {
          // Ignore abort errors - these are normal when switching tracks quickly
          if (
            error instanceof DOMException &&
            (error.name === "AbortError" ||
              error.message?.includes("aborted") ||
              error.message?.includes("fetching process"))
          ) {
            console.debug(
              "[AudioPlayerContext] Playback aborted (normal during rapid track changes)",
            );
            return;
          }
          console.error("Playback failed:", error);
          showToast("Playback failed. Please try again.", "error");
        });
      }
    },
    [player, showToast],
  );

  // Smart Queue Functions
  const addSimilarTracks = useCallback(
    async (trackId: number, count = 5) => {
      console.log("[AudioPlayerContext] 🎵 addSimilarTracks called", {
        trackId,
        count,
        hasSession: !!session,
      });

      if (!session) {
        console.log(
          "[AudioPlayerContext] ❌ No session, cannot add similar tracks",
        );
        return;
      }

      try {
        console.log("[AudioPlayerContext] 🚀 Calling tRPC getSimilarTracks...");

        // Find the seed track for logging
        const seedTrack =
          player.currentTrack?.id === trackId
            ? player.currentTrack
            : player.queue.find((t) => t.id === trackId);

        // Use tRPC endpoint directly - goes through Next.js backend, no CORS issues
        const tracks = await utils.client.music.getSimilarTracks.query({
          trackId,
          limit: count,
          excludeTrackIds: [
            ...(player.currentTrack ? [player.currentTrack.id] : []),
            ...player.queue.map((t) => t.id),
          ],
        });

        console.log("[AudioPlayerContext] 📦 Received recommendations:", {
          count: tracks?.length ?? 0,
          tracks:
            tracks
              ?.slice(0, 3)
              .map((t: Track) => `${t.title} - ${t.artist.name}`) ?? [],
        });

        if (tracks && tracks.length > 0) {
          // Log the recommendation
          if (seedTrack) {
            const validSeedTracks = hasCompleteTrackData(seedTrack)
              ? [seedTrack]
              : [];
            const validRecommendedTracks = tracks.filter(
              (t: Track): t is Track => hasCompleteTrackData(t),
            );

            if (
              validSeedTracks.length > 0 &&
              validRecommendedTracks.length > 0
            ) {
              logRecommendationMutation.mutate({
                seedTracks: validSeedTracks,
                recommendedTracks: validRecommendedTracks,
                source: "cached",
                requestParams: { count },
                success: true,
                context: "similar-tracks",
              });
            } else {
              console.warn(
                "[AudioPlayerContext] ⚠️ Skipping logRecommendation for similar tracks due to incomplete data",
                {
                  hasSeedTrack: validSeedTracks.length > 0,
                  recommendedCount: validRecommendedTracks.length,
                },
              );
            }
          }

          console.log("[AudioPlayerContext] ➕ Adding tracks to queue...");
          player.addToQueue(tracks, false);
          console.log("[AudioPlayerContext] ✅ Tracks added successfully");
          showToast(
            `Added ${tracks.length} similar ${tracks.length === 1 ? "track" : "tracks"}`,
            "success",
          );
        } else {
          console.log("[AudioPlayerContext] ⚠️ No recommendations received");
          showToast("No similar tracks found", "info");
        }
      } catch (error) {
        console.error(
          "[AudioPlayerContext] ❌ Error adding similar tracks:",
          error,
        );
        showToast("Failed to add similar tracks", "error");
        throw error;
      }
    },
    [session, player, utils, showToast, logRecommendationMutation],
  );

  const generateSmartMix = useCallback(
    async (seedTrackIds: number[], count = 50) => {
      console.log("[AudioPlayerContext] ⚡ generateSmartMix called", {
        seedTrackIds,
        count,
        hasSession: !!session,
      });

      if (!session) {
        console.log(
          "[AudioPlayerContext] ❌ No session, cannot generate smart mix",
        );
        return;
      }

      if (seedTrackIds.length === 0) {
        console.error("[AudioPlayerContext] ❌ No seed track IDs provided");
        showToast("No tracks to generate mix from", "error");
        return;
      }

      try {
        console.log("[AudioPlayerContext] 🚀 Calling tRPC generateSmartMix...");

        // Find seed tracks for logging
        const seedTracks = seedTrackIds
          .map(
            (id) =>
              player.queue.find((t) => t.id === id) ??
              (player.currentTrack?.id === id ? player.currentTrack : null),
          )
          .filter((t): t is Track => t !== null);

        // Use tRPC mutation - goes through Next.js backend, no CORS issues
        const result = await generateSmartMixMutation.mutateAsync({
          seedTrackIds,
          limit: count,
          diversity: smartQueueSettings?.similarityPreference ?? "balanced",
        });

        console.log("[AudioPlayerContext] 📦 Smart mix received:", {
          count: result.tracks.length,
          targetCount: count,
        });

        if (result.tracks.length > 0) {
          // Log the smart mix generation
          if (seedTracks.length > 0) {
            const validSeedTracks = seedTracks.filter((t): t is Track =>
              hasCompleteTrackData(t),
            );
            const validRecommendedTracks = result.tracks.filter(
              (t): t is Track => hasCompleteTrackData(t),
            );

            if (
              validSeedTracks.length > 0 &&
              validRecommendedTracks.length > 0
            ) {
              logRecommendationMutation.mutate({
                seedTracks: validSeedTracks,
                recommendedTracks: validRecommendedTracks,
                source: "cached",
                requestParams: {
                  count,
                  similarityLevel:
                    smartQueueSettings?.similarityPreference ?? "balanced",
                },
                success: true,
                context: "smart-mix",
              });
            } else {
              console.warn(
                "[AudioPlayerContext] ⚠️ Skipping smart-mix logRecommendation due to incomplete track data",
                {
                  seedCount: validSeedTracks.length,
                  recommendedCount: validRecommendedTracks.length,
                },
              );
            }
          }

          console.log(
            "[AudioPlayerContext] 🔄 Clearing queue and adding new tracks...",
          );
          player.clearQueue();
          player.addToQueue(result.tracks, false);
          console.log("[AudioPlayerContext] ✅ Smart mix applied successfully");
          showToast(
            `Smart mix created with ${result.tracks.length} tracks`,
            "success",
          );
        } else {
          console.log("[AudioPlayerContext] ⚠️ No tracks in smart mix");
          showToast("Could not generate smart mix", "error");
        }
      } catch (error) {
        console.error(
          "[AudioPlayerContext] ❌ Error generating smart mix:",
          error,
        );
        showToast("Failed to generate smart mix", "error");
        throw error;
      }
    },
    [
      session,
      generateSmartMixMutation,
      smartQueueSettings,
      player,
      showToast,
      logRecommendationMutation,
    ],
  );

  const saveQueueAsPlaylist = useCallback(async () => {
    console.log("[AudioPlayerContext] 💾 saveQueueAsPlaylist called", {
      hasSession: !!session,
      currentTrack: player.currentTrack ? player.currentTrack.title : null,
      queueSize: player.queue.length,
    });

    if (!session) {
      showToast("Sign in to save playlists", "info");
      return;
    }

    const tracksToSave: Track[] = [
      ...(player.currentTrack ? [player.currentTrack] : []),
      ...player.queue,
    ];

    if (tracksToSave.length === 0) {
      showToast("Queue is empty", "info");
      return;
    }

    const defaultName = player.currentTrack
      ? `${player.currentTrack.title} Queue`
      : `Queue ${new Date().toLocaleDateString()}`;
    const playlistName = prompt("Name your new playlist", defaultName);

    if (playlistName === null) {
      console.log(
        "[AudioPlayerContext] ⚪ Playlist creation cancelled by user",
      );
      return;
    }

    const trimmedName = playlistName.trim();

    if (!trimmedName) {
      showToast("Playlist name cannot be empty", "error");
      return;
    }

    showToast("Saving queue as playlist...", "info");

    try {
      const playlist = await createPlaylistMutation.mutateAsync({
        name: trimmedName,
        isPublic: false,
      });

      if (!playlist) {
        throw new Error("Playlist creation returned no data");
      }

      for (const track of tracksToSave) {
        await addToPlaylistMutation.mutateAsync({
          playlistId: playlist.id,
          track,
        });
      }

      showToast(
        `Saved ${tracksToSave.length} track${tracksToSave.length === 1 ? "" : "s"} to "${trimmedName}"`,
        "success",
      );
      void utils.music.getPlaylists.invalidate();
    } catch (error) {
      console.error(
        "[AudioPlayerContext] ❌ Failed to save queue as playlist:",
        error,
      );
      showToast("Failed to save playlist", "error");
    }
  }, [
    session,
    player,
    createPlaylistMutation,
    addToPlaylistMutation,
    showToast,
    utils,
  ]);

  const value: AudioPlayerContextType = {
    // State
    currentTrack: player.currentTrack,
    queue: player.queue,
    isPlaying: player.isPlaying,
    currentTime: player.currentTime,
    duration: player.duration,
    volume: player.volume,
    isMuted: player.isMuted,
    isShuffled: player.isShuffled,
    repeatMode: player.repeatMode,
    playbackRate: player.playbackRate,
    isLoading: player.isLoading,
    isAutoQueueing: player.isAutoQueueing,

    // Audio element reference
    audioElement: player.audioRef.current,

    // Actions
    play,
    togglePlay: player.togglePlay,
    addToQueue: player.addToQueue,
    addToPlayNext: player.addToPlayNext,
    playNext,
    playPrevious,
    playFromQueue,
    clearQueue: player.clearQueue,
    removeFromQueue: player.removeFromQueue,
    reorderQueue: player.reorderQueue,
    seek: player.seek,
    setVolume: player.setVolume,
    setIsMuted: player.setIsMuted,
    toggleShuffle: player.toggleShuffle,
    cycleRepeatMode: player.cycleRepeatMode,
    setPlaybackRate: player.setPlaybackRate,
    skipForward: player.skipForward,
    skipBackward: player.skipBackward,

    // Smart Queue
    addSimilarTracks,
    generateSmartMix,
    saveQueueAsPlaylist,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useGlobalPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalPlayer must be used within an AudioPlayerProvider",
    );
  }
  return context;
}

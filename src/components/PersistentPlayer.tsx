// File: src/components/PersistentPlayer.tsx

"use client";

import { STORAGE_KEYS } from "@/config/storage";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useEqualizer } from "@/hooks/useEqualizer";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { api } from "@/trpc/react";

import { useAudioReactiveBackground } from "@/hooks/useAudioReactiveBackground";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { FlowFieldBackground } from "./FlowFieldBackground";
import { LightweightParticleBackground } from "./LightweightParticleBackground";
import PatternControls from "./PatternControls";
import MaturePlayer from "./Player";
import type { FlowFieldRenderer } from "./visualizers/FlowFieldRenderer";

const Equalizer = dynamic(
  () => import("./Equalizer").then((mod) => mod.Equalizer),
  { ssr: false },
);

const EnhancedQueue = dynamic(
  () => import("./EnhancedQueue").then((mod) => mod.EnhancedQueue),
  { ssr: false },
);

const MobilePlayer = dynamic(() => import("./MobilePlayer"), { ssr: false });
const MiniPlayer = dynamic(() => import("./MiniPlayer"), { ssr: false });

export default function PersistentPlayer() {
  const player = useGlobalPlayer();
  const isMobile = useIsMobile();

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const { data: preferences } = api.music.getUserPreferences.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    },
  );

  const updatePreferences = api.music.updatePreferences.useMutation();

  const equalizer = useEqualizer(player.audioElement);

  const [showQueue, setShowQueue] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);
  const [showPatternControls, setShowPatternControls] = useState(false);
  const [renderer, setRenderer] = useState<FlowFieldRenderer | null>(null);

  useEffect(() => {
    if (preferences) {
      setShowQueue(preferences.queuePanelOpen ?? false);
      setShowEqualizer(preferences.equalizerPanelOpen ?? false);
      setVisualizerEnabled(preferences.visualizerEnabled ?? true);
    }
  }, [preferences]);

  useEffect(() => {
    if (isAuthenticated) return;
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(STORAGE_KEYS.VISUALIZER_ENABLED);
    if (stored !== null) {
      try {
        const parsed: unknown = JSON.parse(stored);
        setVisualizerEnabled(parsed === true);
      } catch {

        setVisualizerEnabled(stored === "true");
      }
    }
  }, [isAuthenticated]);

  useAudioReactiveBackground(
    player.audioElement,
    player.isPlaying,
    visualizerEnabled,
  );

  useEffect(() => {
    if (
      isAuthenticated &&
      preferences &&
      showQueue !== preferences.queuePanelOpen
    ) {
      updatePreferences.mutate({ queuePanelOpen: showQueue });
    }

  }, [showQueue]);

  useEffect(() => {
    if (
      isAuthenticated &&
      preferences &&
      showEqualizer !== preferences.equalizerPanelOpen
    ) {
      updatePreferences.mutate({ equalizerPanelOpen: showEqualizer });
    }

  }, [showEqualizer]);

  const persistVisualizerPreference = useCallback(
    (next: boolean) => {
      setVisualizerEnabled(next);
      if (isAuthenticated) {
        updatePreferences.mutate({ visualizerEnabled: next });
      } else if (typeof window !== "undefined") {
        window.localStorage.setItem(
          STORAGE_KEYS.VISUALIZER_ENABLED,
          JSON.stringify(next),
        );
      }
    },
    [isAuthenticated, updatePreferences],
  );

  const handleVisualizerToggle = useCallback(() => {
    const next = !visualizerEnabled;
    persistVisualizerPreference(next);

  }, [persistVisualizerPreference, visualizerEnabled]);

  const playerProps = {
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
    onPlayPause: player.togglePlay,
    onNext: player.playNext,
    onPrevious: player.playPrevious,
    onSeek: player.seek,
    onVolumeChange: player.setVolume,
    onToggleMute: () => player.setIsMuted(!player.isMuted),
    onToggleShuffle: player.toggleShuffle,
    onCycleRepeat: player.cycleRepeatMode,
    onPlaybackRateChange: player.setPlaybackRate,
    onSkipForward: player.skipForward,
    onSkipBackward: player.skipBackward,
    onToggleQueue: () => setShowQueue(!showQueue),
    onToggleEqualizer: () => setShowEqualizer(!showEqualizer),
    onToggleVisualizer: !isMobile ? handleVisualizerToggle : undefined,
    visualizerEnabled,
    onTogglePatternControls: !isMobile
      ? () => setShowPatternControls(!showPatternControls)
      : undefined,
  };

  return (
    <>
      {}
      {!isMobile && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-50">
            <div className="player-backdrop">
              <div className="player-backdrop-inner">
                <MaturePlayer {...playerProps} />
              </div>
            </div>
          </div>

          {}
          {showQueue && (
            <EnhancedQueue
              queue={player.queue}
              queuedTracks={player.queuedTracks}
              smartQueueState={player.smartQueueState}
              currentTrack={player.currentTrack}
              onClose={() => setShowQueue(false)}
              onRemove={player.removeFromQueue}
              onClear={player.clearQueue}
              onReorder={player.reorderQueue}
              onPlayFrom={player.playFromQueue}
              onSaveAsPlaylist={player.saveQueueAsPlaylist}
              onAddSmartTracks={player.addSmartTracks}
              onRefreshSmartTracks={player.refreshSmartTracks}
              onClearSmartTracks={player.clearSmartTracks}
            />
          )}
        </>
      )}

      {}
      {isMobile && player.currentTrack && (
        <>
          {}
          <MiniPlayer
            currentTrack={player.currentTrack}
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
            queue={player.queue}
            lastAutoQueueCount={player.lastAutoQueueCount}
            onPlayPause={player.togglePlay}
            onNext={player.playNext}
            onSeek={player.seek}
            onTap={() => player.setShowMobilePlayer(true)}
          />

          {}
          {player.showMobilePlayer && (
            <MobilePlayer
              currentTrack={player.currentTrack}
              queue={player.queue}
              isPlaying={player.isPlaying}
              currentTime={player.currentTime}
              duration={player.duration}
              volume={player.volume}
              isMuted={player.isMuted}
              isShuffled={player.isShuffled}
              repeatMode={player.repeatMode}
              playbackRate={player.playbackRate}
              isLoading={player.isLoading}
              onPlayPause={player.togglePlay}
              onNext={player.playNext}
              onPrevious={player.playPrevious}
              onSeek={player.seek}
              onVolumeChange={player.setVolume}
              onToggleMute={() => player.setIsMuted(!player.isMuted)}
              onToggleShuffle={player.toggleShuffle}
              onCycleRepeat={player.cycleRepeatMode}
              onPlaybackRateChange={player.setPlaybackRate}
              onSkipForward={player.skipForward}
              onSkipBackward={player.skipBackward}
              onToggleQueue={() => setShowQueue(!showQueue)}
              onToggleEqualizer={() => setShowEqualizer(!showEqualizer)}
              onClose={() => player.setShowMobilePlayer(false)}
            />
          )}

          {}
          {showQueue && (
            <EnhancedQueue
              queue={player.queue}
              queuedTracks={player.queuedTracks}
              smartQueueState={player.smartQueueState}
              currentTrack={player.currentTrack}
              onClose={() => setShowQueue(false)}
              onRemove={player.removeFromQueue}
              onClear={player.clearQueue}
              onReorder={player.reorderQueue}
              onPlayFrom={player.playFromQueue}
              onSaveAsPlaylist={player.saveQueueAsPlaylist}
              onAddSmartTracks={player.addSmartTracks}
              onRefreshSmartTracks={player.refreshSmartTracks}
              onClearSmartTracks={player.clearSmartTracks}
            />
          )}
        </>
      )}

      {}
      {showEqualizer && (
        <Equalizer
          equalizer={equalizer}
          onClose={() => setShowEqualizer(false)}
        />
      )}

      {}
      {player.currentTrack && visualizerEnabled && (
        <FlowFieldBackground
          audioElement={player.audioElement}
          onRendererReady={setRenderer}
        />
      )}

      {}
      {!isMobile && showPatternControls && (
        <PatternControls
          renderer={renderer}
          onClose={() => setShowPatternControls(false)}
        />
      )}

      {}
      {!visualizerEnabled && <LightweightParticleBackground />}
    </>
  );
}

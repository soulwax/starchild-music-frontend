// File: src/components/EnhancedPlayer.tsx

"use client";

import type { Track } from "@/types";
import { formatTime } from "@/utils/time";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface PlayerProps {
  currentTrack: Track | null;
  queue: Track[];
  onNext: () => void;
  onPrevious: () => void;
  onTrackEnd: () => void;
  streamUrl: string | null;
}

export default function EnhancedPlayer({
  currentTrack,
  queue,
  onNext,
  onPrevious,
  onTrackEnd,
  streamUrl,
}: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!audioRef.current || !streamUrl) return;

    audioRef.current.load();
    audioRef.current.volume = volume;

    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [streamUrl, isPlaying, volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);

    const clampedVol = Math.max(0, Math.min(1, vol));
    setVolume(clampedVol);
    if (audioRef.current) {
      audioRef.current.volume = clampedVol;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onTrackEnd();
  };

  if (!currentTrack || !streamUrl) {
    return null;
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-800 bg-black/95 backdrop-blur-lg">
      <audio
        ref={audioRef}
        src={streamUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {}
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        className="accent-accent h-1 w-full cursor-pointer appearance-none bg-gray-700"
        style={{
          background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`,
        }}
      />

      <div className="flex items-center justify-between gap-4 px-4 py-3">
        {}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Image
            src={currentTrack.album.cover_small}
            alt={currentTrack.title}
            width={56}
            height={56}
            className="flex-shrink-0 rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium text-white">
              {currentTrack.title}
            </h4>
            <p className="truncate text-sm text-gray-400">
              {currentTrack.artist.name}
            </p>
          </div>
        </div>

        {}
        <div className="flex flex-shrink-0 items-center gap-4">
          <button
            onClick={onPrevious}
            className="text-gray-400 transition hover:text-white"
            disabled={queue.length === 0}
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
          >
            {isPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="ml-0.5 h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          <button
            onClick={onNext}
            className="text-gray-400 transition hover:text-white"
            disabled={queue.length === 0}
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
            </svg>
          </button>
        </div>

        {}
        <div className="hidden flex-shrink-0 text-sm text-gray-400 sm:block">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {}
        <div className="flex hidden flex-shrink-0 items-center gap-2 md:flex">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-400 transition hover:text-white"
          >
            {isMuted || volume === 0 ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : volume < 0.5 ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            className="accent-accent h-1 w-20 cursor-pointer appearance-none bg-gray-700"
          />
        </div>

        {}
        {queue.length > 0 && (
          <div className="hidden flex-shrink-0 text-sm text-gray-400 lg:block">
            {queue.length} in queue
          </div>
        )}
      </div>
    </div>
  );
}

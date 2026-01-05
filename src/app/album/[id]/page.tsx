// File: src/app/album/[id]/page.tsx

"use client";

import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { LoadingState } from "@/components/LoadingSpinner";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { getAlbumTracks } from "@/utils/api";
import type { Track } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { useState, useEffect } from "react";
import { Play, Shuffle } from "lucide-react";
import { hapticLight } from "@/utils/haptics";

export default function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const albumId = parseInt(id, 10);
  const player = useGlobalPlayer();
  const [album, setAlbum] = useState<{
    id: number;
    title: string;
    cover_medium?: string;
    cover_big?: string;
    cover_xl?: string;
    artist?: { id: number; name: string };
    nb_tracks?: number;
    release_date?: string;
  } | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(albumId)) {
      setError("Invalid album ID");
      setIsLoading(false);
      return;
    }

    const fetchAlbumData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [albumResponse, tracksResponse] = await Promise.all([
          fetch(`/api/album/${albumId}`),
          getAlbumTracks(albumId),
        ]);

        if (!albumResponse.ok) {
          throw new Error(`Failed to fetch album: ${albumResponse.status}`);
        }

        const albumData = (await albumResponse.json()) as {
          id: number;
          title: string;
          cover_medium?: string;
          cover_big?: string;
          cover_xl?: string;
          artist?: { id: number; name: string };
          nb_tracks?: number;
          release_date?: string;
        };

        setAlbum(albumData);
        setTracks(tracksResponse.data);
      } catch (err) {
        console.error("Failed to fetch album:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load album",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAlbumData();
  }, [albumId]);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    hapticLight();
    const [first, ...rest] = tracks;
    if (first) {
      player.clearQueue();
      player.play(first);
      if (rest.length > 0) {
        player.addToQueue(rest);
      }
    }
  };

  const handleShufflePlay = () => {
    if (tracks.length === 0) return;
    hapticLight();
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const [first, ...rest] = shuffled;
    if (first) {
      player.clearQueue();
      player.play(first);
      if (rest.length > 0) {
        player.addToQueue(rest);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-3 py-4 md:px-6 md:py-8">
        <LoadingState message="Loading album..." />
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="container mx-auto px-3 py-4 md:px-6 md:py-8">
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <h1 className="mb-4 text-2xl font-bold text-[var(--color-text)]">
            Album Not Found
          </h1>
          <p className="mb-6 text-[var(--color-subtext)]">
            {error ?? "The album you're looking for doesn't exist."}
          </p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const coverUrl = album.cover_xl || album.cover_big || album.cover_medium || "/placeholder.png";

  return (
    <div className="container mx-auto px-3 py-4 md:px-6 md:py-8">
      {}
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:gap-6">
        <div className="flex-shrink-0">
          <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-xl md:max-w-[300px]">
            <Image
              src={coverUrl}
              alt={album.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 200px, 300px"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end">
          <div className="mb-2 text-sm font-medium text-[var(--color-subtext)]">
            Album
          </div>
          <h1 className="mb-2 text-3xl font-bold text-[var(--color-text)] md:text-4xl">
            {album.title}
          </h1>
          {album.artist && (
            <Link
              href={`/artist/${album.artist.id}`}
              className="mb-4 text-lg text-[var(--color-subtext)] transition-colors hover:text-[var(--color-text)]"
            >
              {album.artist.name}
            </Link>
          )}
          <div className="mb-4 flex flex-wrap gap-2 text-sm text-[var(--color-muted)]">
            {album.nb_tracks && (
              <span>{album.nb_tracks} track{album.nb_tracks !== 1 ? "s" : ""}</span>
            )}
            {album.release_date && (
              <>
                <span>•</span>
                <span>{new Date(album.release_date).getFullYear()}</span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="btn-primary touch-target-lg flex items-center gap-2"
            >
              <Play className="h-5 w-5" />
              <span>Play</span>
            </button>
            <button
              onClick={handleShufflePlay}
              disabled={tracks.length === 0}
              className="btn-secondary touch-target-lg flex items-center gap-2"
            >
              <Shuffle className="h-5 w-5" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>
      </div>

      {}
      {tracks.length > 0 ? (
        <div className="space-y-2">
          {tracks.map((track) => (
            <EnhancedTrackCard
              key={track.id}
              track={track}
              onPlay={player.play}
              onAddToQueue={player.addToQueue}
              showActions={true}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-[var(--color-subtext)]">
          No tracks available for this album.
        </div>
      )}
    </div>
  );
}

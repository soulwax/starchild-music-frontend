// File: src/app/artist/[id]/page.tsx

"use client";

import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { LoadingState } from "@/components/LoadingSpinner";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import type { Track } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { useState, useEffect } from "react";
import { Play, Shuffle } from "lucide-react";
import { hapticLight } from "@/utils/haptics";

export default function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const artistId = parseInt(id, 10);
  const player = useGlobalPlayer();
  const [artist, setArtist] = useState<{
    id: number;
    name: string;
    picture_medium?: string;
    picture_big?: string;
    picture_xl?: string;
    nb_album?: number;
    nb_fan?: number;
  } | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(artistId)) {
      setError("Invalid artist ID");
      setIsLoading(false);
      return;
    }

    const fetchArtistData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [artistResponse, tracksResponse] = await Promise.all([
          fetch(`/api/artist/${artistId}`),
          fetch(`/api/artist/${artistId}/tracks`),
        ]);

        if (!artistResponse.ok) {
          throw new Error(`Failed to fetch artist: ${artistResponse.status}`);
        }

        if (!tracksResponse.ok) {
          throw new Error(`Failed to fetch tracks: ${tracksResponse.status}`);
        }

        const artistData = (await artistResponse.json()) as {
          id: number;
          name: string;
          picture_medium?: string;
          picture_big?: string;
          picture_xl?: string;
          nb_album?: number;
          nb_fan?: number;
        };

        const tracksData = (await tracksResponse.json()) as {
          data: unknown[];
          total?: number;
        };

        const validTracks = (tracksData.data || [])
          .map((track): Track | null => {
            if (typeof track !== "object" || track === null) {
              return null;
            }

            const trackObj = track as Partial<Track> & Record<string, unknown>;

            if (
              typeof trackObj.id !== "number" ||
              typeof trackObj.title !== "string" ||
              !trackObj.artist ||
              !trackObj.album
            ) {
              return null;
            }

            return trackObj as Track;
          })
          .filter((track): track is Track => track !== null);

        setArtist(artistData);
        setTracks(validTracks);
      } catch (err) {
        console.error("Failed to fetch artist:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load artist",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchArtistData();
  }, [artistId]);

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
        <LoadingState message="Loading artist..." />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="container mx-auto px-3 py-4 md:py-8">
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <h1 className="mb-4 text-2xl font-bold text-[var(--color-text)]">
            Artist Not Found
          </h1>
          <p className="mb-6 text-[var(--color-subtext)]">
            {error ?? "The artist you're looking for doesn't exist."}
          </p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const pictureUrl = artist.picture_xl || artist.picture_big || artist.picture_medium || "/placeholder.png";

  return (
    <div className="container mx-auto px-3 py-4 md:px-6 md:py-8">
      {}
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:gap-6">
        <div className="flex-shrink-0">
          <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-full md:max-w-[300px]">
            <Image
              src={pictureUrl}
              alt={artist.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 200px, 300px"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end">
          <div className="mb-2 text-sm font-medium text-[var(--color-subtext)]">
            Artist
          </div>
          <h1 className="mb-4 text-3xl font-bold text-[var(--color-text)] md:text-4xl">
            {artist.name}
          </h1>
          <div className="mb-4 flex flex-wrap gap-2 text-sm text-[var(--color-muted)]">
            {artist.nb_album !== undefined && (
              <span>{artist.nb_album} album{artist.nb_album !== 1 ? "s" : ""}</span>
            )}
            {artist.nb_fan !== undefined && (
              <>
                <span>•</span>
                <span>{artist.nb_fan.toLocaleString()} fans</span>
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
        <div>
          <h2 className="mb-4 text-xl font-semibold text-[var(--color-text)]">
            Popular Tracks
          </h2>
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
        </div>
      ) : (
        <div className="py-12 text-center text-[var(--color-subtext)]">
          No tracks available for this artist.
        </div>
      )}
    </div>
  );
}

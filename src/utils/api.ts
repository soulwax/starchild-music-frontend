// File: src/utils/api.ts

import { env } from "@/env";
import type { SearchResponse, Track } from "@/types";

export async function searchTracks(
  query: string,
  offset = 0,
): Promise<SearchResponse> {

  const url = new URL("/api/music/search", window.location.origin);
  url.searchParams.set("q", query);
  if (offset > 0) {
    url.searchParams.set("offset", offset.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return (await res.json()) as SearchResponse;
}

export async function searchTracksByArtist(
  artistName: string,
  offset = 0,
): Promise<SearchResponse> {

  const url = new URL("/api/music/search", window.location.origin);
  url.searchParams.set("q", artistName);
  if (offset > 0) {
    url.searchParams.set("offset", offset.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const response = (await res.json()) as SearchResponse;

  const filtered = response.data
    .filter(
      (track) => track.artist.name.toLowerCase() === artistName.toLowerCase(),
    )
    .sort((a, b) => b.rank - a.rank);

  const hasMore =
    response.next && (filtered.length > 0 || response.data.length > 0);

  return {
    data: filtered,

    total: response.total,

    next: hasMore ? response.next : undefined,
  };
}

export async function getAlbumTracks(albumId: number): Promise<SearchResponse> {

  const url = `/api/album/${albumId}/tracks`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch album tracks (${res.status})`);
  const data = (await res.json()) as { data: unknown[] };

  const tracks = (data.data || [])
    .map((track): Track | null => {

      if (typeof track !== "object" || track === null) {
        console.warn("Invalid track data received from API:", track);
        return null;
      }

      const trackObj = track as Partial<Track> & Record<string, unknown>;

      if (
        typeof trackObj.id !== "number" ||
        typeof trackObj.title !== "string" ||
        !trackObj.artist
      ) {
        console.warn(
          `Track ${trackObj.id ?? "unknown"} is missing required properties:`,
          trackObj,
        );
        return null;
      }

      if (!trackObj.album) {
        console.warn(
          `Track ${trackObj.id} is missing album property - this may cause UI issues`,
        );

        return null;
      }

      return trackObj as Track;
    })
    .filter((track): track is Track => track !== null);

  return {
    data: tracks,
    total: tracks.length,
  };
}

export function getStreamUrl(query: string): string {
  const url = new URL("/api/stream", window.location.origin);
  url.searchParams.set("q", query);
  return url.toString();
}

export function getStreamUrlById(id: string): string {
  const url = new URL("/api/stream", window.location.origin);
  url.searchParams.set("id", id);
  return url.toString();
}

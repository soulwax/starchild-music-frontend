// File: src/utils/api.ts

import { env } from "@/env";
import type { SearchResponse, Track } from "@/types";

/**
 * Search for tracks using the backend API.
 * @param query Search query string.
 * @param offset Optional result offset for pagination (default: 0).
 * @returns SearchResponse with tracks, total count, and next page info.
 */
export async function searchTracks(query: string, offset = 0): Promise<SearchResponse> {
  const url = new URL(`${env.NEXT_PUBLIC_API_URL}music/search`);
  url.searchParams.set("q", query);
  if (offset > 0) {
    url.searchParams.set("offset", offset.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return await res.json() as SearchResponse;
}

/**
 * Search for tracks by artist name, sorted by popularity (descending).
 * @param artistName Artist name to search for.
 * @param offset Optional result offset for pagination (default: 0).
 * @returns SearchResponse with tracks sorted by popularity.
 */
export async function searchTracksByArtist(artistName: string, offset = 0): Promise<SearchResponse> {
  // Search for tracks by artist name and sort by rank (popularity) descending
  const url = new URL(`${env.NEXT_PUBLIC_API_URL}music/search`);
  url.searchParams.set("q", artistName);
  if (offset > 0) {
    url.searchParams.set("offset", offset.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const response = await res.json() as SearchResponse;
  
  // Filter to only tracks by this artist and sort by rank (popularity) descending
  const filtered = response.data
    .filter(track => track.artist.name.toLowerCase() === artistName.toLowerCase())
    .sort((a, b) => b.rank - a.rank);
  
  return {
    data: filtered,
    total: filtered.length,
    next: response.next,
  };
}

/**
 * Get tracks from an album, sorted by album track order.
 * @param albumId Album ID.
 * @returns SearchResponse with tracks in album order.
 */
export async function getAlbumTracks(albumId: number): Promise<SearchResponse> {
  // Use our backend proxy to avoid CORS issues
  const url = `/api/album/${albumId}/tracks`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch album tracks (${res.status})`);
  const data = await res.json() as { data: Track[] };
  
  // Tracks from Deezer album API are already in album order (by track position)
  // Note: Some tracks may not have the album property populated
  const tracks = (data.data || []).map((track) => {
    // Ensure album property exists - if missing, we'll handle it in the UI
    if (!track.album && track.id) {
      // Track exists but album info is missing - this is expected for some Deezer responses
      return track;
    }
    return track;
  });
  
  return {
    data: tracks,
    total: tracks.length,
  };
}

/**
 * Build a streaming URL using the Next.js API route (server-side proxied).
 * This keeps the STREAMING_KEY secure on the server.
 */
export function getStreamUrl(query: string): string {
  const url = new URL("/api/stream", window.location.origin);
  url.searchParams.set("q", query);
  return url.toString();
}

/**
 * Stream by ID using the Next.js API route (server-side proxied).
 */
export function getStreamUrlById(id: string): string {
  const url = new URL("/api/stream", window.location.origin);
  url.searchParams.set("id", id);
  return url.toString();
}

// File: src/utils/api.ts

import { env } from "@/env";
import type { SearchResponse, Track } from "@/types";

/**
 * Search for tracks using the backend API.
 * @param query Search query string.
 * @param offset Optional result offset for pagination (default: 0).
 * @returns SearchResponse with tracks, total count, and next page info.
 */
export async function searchTracks(
  query: string,
  offset = 0,
): Promise<SearchResponse> {
  const url = new URL(`${env.NEXT_PUBLIC_API_URL}music/search`);
  url.searchParams.set("q", query);
  if (offset > 0) {
    url.searchParams.set("offset", offset.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return (await res.json()) as SearchResponse;
}

/**
 * Search for tracks by artist name, sorted by popularity (descending).
 * Note: This function filters results client-side, so pagination is approximate.
 * The offset parameter refers to the API offset, not the filtered result offset.
 *
 * @param artistName Artist name to search for.
 * @param offset Optional result offset for pagination (default: 0). This is the API offset, not filtered offset.
 * @returns SearchResponse with tracks sorted by popularity.
 */
export async function searchTracksByArtist(
  artistName: string,
  offset = 0,
): Promise<SearchResponse> {
  // Search for tracks by artist name and sort by rank (popularity) descending
  const url = new URL(`${env.NEXT_PUBLIC_API_URL}music/search`);
  url.searchParams.set("q", artistName);
  if (offset > 0) {
    url.searchParams.set("offset", offset.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const response = (await res.json()) as SearchResponse;

  // Filter to only tracks by this artist and sort by rank (popularity) descending
  const filtered = response.data
    .filter(
      (track) => track.artist.name.toLowerCase() === artistName.toLowerCase(),
    )
    .sort((a, b) => b.rank - a.rank);

  // For pagination: Since we're filtering client-side, we can't know the true total
  // without fetching all pages. We return the filtered results from this page.
  // The caller should accumulate results and handle pagination accordingly.
  // We include 'next' if the API has more results AND we got some filtered results
  // (indicating there might be more matches in subsequent pages).
  const hasMore =
    response.next && (filtered.length > 0 || response.data.length > 0);

  return {
    data: filtered,
    // Return the API's total (not filtered total) so caller knows there might be more pages to fetch
    // The actual filtered total will be discovered as we paginate
    total: response.total,
    // Include next if there are more API results to check
    next: hasMore ? response.next : undefined,
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
  const data = (await res.json()) as { data: unknown[] };

  // Tracks from Deezer album API are already in album order (by track position)
  // The backend endpoint tries to enrich tracks with album info, but may fail
  // We handle missing album gracefully by filtering out invalid tracks
  const tracks = (data.data || [])
    .map((track): Track | null => {
      // Type guard to ensure we have a valid track object
      if (typeof track !== "object" || track === null) {
        console.warn("Invalid track data received from API:", track);
        return null;
      }

      const trackObj = track as Partial<Track> & Record<string, unknown>;

      // Validate that all required Track properties are present
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

      // If album is missing, log a warning but don't throw - the UI can handle this
      if (!trackObj.album) {
        console.warn(
          `Track ${trackObj.id} is missing album property - this may cause UI issues`,
        );
        // Return null to filter out tracks without album (they'll break the UI)
        // Alternatively, we could create a minimal album object, but that's risky
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

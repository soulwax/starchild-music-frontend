// File: src/server/services/recommendations.ts

import {
  ENABLE_AUDIO_FEATURES,
  RECOMMENDATION_CACHE_HOURS,
} from "@/config/features";
import type { Track } from "@/types";

/**
 * Deezer API Response Types
 */
interface DeezerArtist {
  id: number;
  name: string;
  picture?: string;
  picture_small?: string;
  picture_medium?: string;
  picture_big?: string;
  picture_xl?: string;
}

interface DeezerGenre {
  id: number;
  name: string;
  picture?: string;
}

interface DeezerTrackResponse {
  data: Track[];
}

interface DeezerArtistsResponse {
  data: DeezerArtist[];
}

interface DeezerGenresResponse {
  data: DeezerGenre[];
}

interface DeezerTrackDetails {
  id: number;
  title: string;
  bpm?: number;
  gain?: number;
  artist: DeezerArtist;
  album: {
    id: number;
    title: string;
    genre_id?: number;
    genres?: DeezerGenresResponse;
  };
}

/**
 * Fetch recommendations from Deezer API
 *
 * Deezer API Endpoints:
 * 1. Track Radio: GET https://api.deezer.com/track/{id}/radio
 *    - Returns tracks similar to the seed track
 *    - Up to 40 tracks
 *
 * 2. Artist Radio: GET https://api.deezer.com/artist/{id}/radio
 *    - Returns tracks from similar artists
 *    - Up to 40 tracks
 *
 * 3. Related Artists: GET https://api.deezer.com/artist/{id}/related
 *    - Returns similar artists
 *
 * Usage:
 * ```typescript
 * const recommendations = await fetchDeezerRecommendations(trackId, 10);
 * ```
 */
export async function fetchDeezerRecommendations(
  seedTrackId: number,
  limit = 20,
): Promise<Track[]> {
  try {
    // Fetch track radio (similar tracks)
    const response = await fetch(
      `https://api.deezer.com/track/${seedTrackId}/radio?limit=${Math.min(limit, 40)}`,
    );

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data = (await response.json()) as DeezerTrackResponse;

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.slice(0, limit);
  } catch (error) {
    console.error("Error fetching Deezer recommendations:", error);
    return [];
  }
}

/**
 * Fetch artist-based recommendations from Deezer
 *
 * Gets tracks from the same artist and similar artists
 */
export async function fetchArtistRecommendations(
  artistId: number,
  limit = 20,
): Promise<Track[]> {
  try {
    const response = await fetch(
      `https://api.deezer.com/artist/${artistId}/radio?limit=${Math.min(limit, 40)}`,
    );

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data = (await response.json()) as DeezerTrackResponse;

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.slice(0, limit);
  } catch (error) {
    console.error("Error fetching artist recommendations:", error);
    return [];
  }
}

/**
 * Fetch related artists from Deezer
 */
export async function fetchRelatedArtists(
  artistId: number,
  limit = 10,
): Promise<DeezerArtist[]> {
  try {
    const response = await fetch(
      `https://api.deezer.com/artist/${artistId}/related?limit=${limit}`,
    );

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data = (await response.json()) as DeezerArtistsResponse;

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching related artists:", error);
    return [];
  }
}

/**
 * Fetch artist's top tracks from Deezer
 */
export async function fetchArtistTopTracks(
  artistId: number,
  limit = 10,
): Promise<Track[]> {
  try {
    const response = await fetch(
      `https://api.deezer.com/artist/${artistId}/top?limit=${limit}`,
    );

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data = (await response.json()) as DeezerTrackResponse;

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching artist top tracks:", error);
    return [];
  }
}

/**
 * Fetch track details including BPM and genre
 */
export async function fetchTrackDetails(
  trackId: number,
): Promise<DeezerTrackDetails | null> {
  try {
    const response = await fetch(`https://api.deezer.com/track/${trackId}`);

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    return (await response.json()) as DeezerTrackDetails;
  } catch (error) {
    console.error("Error fetching track details:", error);
    return null;
  }
}

/**
 * Fetch genre chart tracks
 */
export async function fetchGenreChart(
  genreId: number,
  limit = 20,
): Promise<Track[]> {
  try {
    const response = await fetch(
      `https://api.deezer.com/chart/${genreId}/tracks?limit=${limit}`,
    );

    if (!response.ok) {
      // Try editorial/genre endpoint as fallback
      const editorialResponse = await fetch(
        `https://api.deezer.com/editorial/${genreId}/charts?limit=${limit}`,
      );

      if (!editorialResponse.ok) {
        return [];
      }

      const editorialData = (await editorialResponse.json()) as {
        tracks?: DeezerTrackResponse;
      };
      return editorialData.tracks?.data ?? [];
    }

    const data = (await response.json()) as DeezerTrackResponse;

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching genre chart:", error);
    return [];
  }
}

/**
 * Fetch album tracks (for same-album recommendations)
 */
export async function fetchAlbumTracks(albumId: number): Promise<Track[]> {
  try {
    const response = await fetch(
      `https://api.deezer.com/album/${albumId}/tracks`,
    );

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data = (await response.json()) as DeezerTrackResponse;

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching album tracks:", error);
    return [];
  }
}

/**
 * Calculate cache expiry date
 */
export function getCacheExpiryDate(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + RECOMMENDATION_CACHE_HOURS);
  return expiry;
}

/**
 * Enhanced Smart Queue Recommendations
 *
 * Uses multiple strategies for better relevance:
 * 1. Track radio (core similar tracks)
 * 2. Related artist exploration
 * 3. Genre-based discovery
 * 4. Artist deep-dive (more from liked artists)
 *
 * Returns more diverse and relevant recommendations
 */
export async function fetchEnhancedRecommendations(
  seedTrack: Track,
  options: {
    userFavoriteArtistIds?: number[];
    recentlyPlayedTrackIds?: number[];
    similarityLevel?: "strict" | "balanced" | "diverse";
    limit?: number;
  } = {},
): Promise<Track[]> {
  const {
    userFavoriteArtistIds = [],
    recentlyPlayedTrackIds = [],
    similarityLevel = "balanced",
    limit = 20,
  } = options;

  const recommendations: Track[] = [];
  const seenTrackIds = new Set<number>([
    seedTrack.id,
    ...recentlyPlayedTrackIds,
  ]);
  const seenArtistCount = new Map<number, number>();

  // Helper to add tracks while maintaining diversity
  const addTracks = (tracks: Track[], maxPerArtist = 3) => {
    for (const track of tracks) {
      if (seenTrackIds.has(track.id)) continue;

      const artistCount = seenArtistCount.get(track.artist.id) ?? 0;
      if (artistCount >= maxPerArtist) continue;

      recommendations.push(track);
      seenTrackIds.add(track.id);
      seenArtistCount.set(track.artist.id, artistCount + 1);

      if (recommendations.length >= limit) break;
    }
  };

  // Calculate allocation based on similarity level
  const allocation = getSimilarityAllocation(similarityLevel, limit);

  try {
    // 1. CORE: Track Radio (most similar tracks)
    console.log(`[SmartQueue] Fetching track radio for ${seedTrack.title}...`);
    const trackRadio = await fetchDeezerRecommendations(
      seedTrack.id,
      allocation.trackRadio,
    );
    addTracks(trackRadio, 2);
    console.log(
      `[SmartQueue] Track radio: ${trackRadio.length} tracks, added ${recommendations.length}`,
    );

    // 2. ARTIST NETWORK: Related artists' top tracks
    if (recommendations.length < limit && allocation.relatedArtists > 0) {
      console.log(`[SmartQueue] Fetching related artists...`);
      const relatedArtists = await fetchRelatedArtists(seedTrack.artist.id, 5);

      for (const artist of relatedArtists) {
        if (recommendations.length >= limit) break;

        const artistTracks = await fetchArtistTopTracks(artist.id, 3);
        // Prefer tracks from artists user already likes
        const isLikedArtist = userFavoriteArtistIds.includes(artist.id);
        addTracks(artistTracks, isLikedArtist ? 3 : 2);
      }
      console.log(
        `[SmartQueue] After related artists: ${recommendations.length} tracks`,
      );
    }

    // 3. ARTIST DEEP-DIVE: More from the current artist (if user likes them)
    if (
      recommendations.length < limit &&
      userFavoriteArtistIds.includes(seedTrack.artist.id)
    ) {
      console.log(
        `[SmartQueue] User likes ${seedTrack.artist.name}, adding more tracks...`,
      );
      const artistTracks = await fetchArtistTopTracks(
        seedTrack.artist.id,
        allocation.sameArtist,
      );
      addTracks(artistTracks, 4); // Allow more from liked artist
      console.log(
        `[SmartQueue] After artist deep-dive: ${recommendations.length} tracks`,
      );
    }

    // 4. GENRE EXPLORATION: Tracks from the same genre
    if (recommendations.length < limit && allocation.genre > 0) {
      const trackDetails = await fetchTrackDetails(seedTrack.id);
      const genreId = trackDetails?.album?.genre_id;

      if (genreId) {
        console.log(`[SmartQueue] Fetching genre ${genreId} tracks...`);
        const genreTracks = await fetchGenreChart(genreId, allocation.genre);
        // Filter to avoid very popular/overplayed tracks
        // In Deezer, lower rank = more popular (like chart position), so we want higher rank values
        // Exception: include tracks from artists the user already likes
        const filteredGenreTracks = genreTracks.filter(
          (t) => t.rank > 500000 || userFavoriteArtistIds.includes(t.artist.id),
        );
        addTracks(filteredGenreTracks, 1); // Limit per artist for diversity
        console.log(
          `[SmartQueue] After genre exploration: ${recommendations.length} tracks`,
        );
      }
    }

    // 5. FALLBACK: Artist radio if still not enough
    if (recommendations.length < limit) {
      console.log(`[SmartQueue] Fallback: artist radio...`);
      const artistRadio = await fetchArtistRecommendations(
        seedTrack.artist.id,
        limit,
      );
      addTracks(artistRadio, 2);
      console.log(`[SmartQueue] Final count: ${recommendations.length} tracks`);
    }
  } catch (error) {
    console.error("[SmartQueue] Error in enhanced recommendations:", error);
  }

  // Apply final shuffle with diversity
  return shuffleWithDiversity(recommendations.slice(0, limit));
}

/**
 * Get allocation of tracks per source based on similarity level
 */
function getSimilarityAllocation(
  level: "strict" | "balanced" | "diverse",
  total: number,
): {
  trackRadio: number;
  relatedArtists: number;
  sameArtist: number;
  genre: number;
} {
  switch (level) {
    case "strict":
      // 80% from track radio, 20% from same artist, no genre exploration
      return {
        trackRadio: Math.ceil(total * 0.8),
        relatedArtists: 0,
        sameArtist: Math.ceil(total * 0.2),
        genre: 0,
      };
    case "diverse":
      // 40% track radio, 30% related artists, 10% same artist, 20% genre
      return {
        trackRadio: Math.ceil(total * 0.4),
        relatedArtists: Math.ceil(total * 0.3),
        sameArtist: Math.ceil(total * 0.1),
        genre: Math.ceil(total * 0.2),
      };
    case "balanced":
    default:
      // 60% track radio, 20% related artists, 10% same artist, 10% genre
      return {
        trackRadio: Math.ceil(total * 0.6),
        relatedArtists: Math.ceil(total * 0.2),
        sameArtist: Math.ceil(total * 0.1),
        genre: Math.ceil(total * 0.1),
      };
  }
}

/**
 * Hybrid recommendation strategy (legacy - for backward compatibility)
 *
 * Combines multiple sources:
 * 1. Track radio (Deezer similar tracks)
 * 2. Same artist tracks (if user likes the artist)
 * 3. User's listening history patterns
 * 4. Audio features matching (if enabled)
 *
 * Returns a diverse mix of recommendations
 */
export async function fetchHybridRecommendations(
  seedTrack: Track,
  userTopArtistIds: number[],
  limit = 20,
): Promise<Track[]> {
  // Use the new enhanced recommendations
  return fetchEnhancedRecommendations(seedTrack, {
    userFavoriteArtistIds: userTopArtistIds,
    similarityLevel: "balanced",
    limit,
  });
}

/**
 * Multi-seed recommendations result with metadata
 */
export interface MultiSeedRecommendationsResult {
  tracks: Track[];
  totalCandidates: number;
}

/**
 * Multi-seed recommendations
 *
 * Uses multiple seed tracks for more diverse recommendations
 * Great for "smart mix" features
 */
export async function fetchMultiSeedRecommendations(
  seedTracks: Track[],
  options: {
    userFavoriteArtistIds?: number[];
    limit?: number;
    diversityWeight?: number; // 0-1, higher = more diverse
  } = {},
): Promise<MultiSeedRecommendationsResult> {
  const { limit = 30, diversityWeight = 0.5 } = options;

  // Store tracks with their sorting scores separately to preserve original rank values
  const scoredTracks: Array<{ track: Track; score: number }> = [];
  const seenTrackIds = new Set<number>(seedTracks.map((t) => t.id));
  const artistScores = new Map<number, number>();

  // Score artists based on seed tracks
  for (const track of seedTracks) {
    artistScores.set(
      track.artist.id,
      (artistScores.get(track.artist.id) ?? 0) + 1,
    );
  }

  // Get recommendations for each seed
  const perSeedLimit = Math.ceil((limit * 1.5) / seedTracks.length);

  for (const seedTrack of seedTracks) {
    const recs = await fetchDeezerRecommendations(seedTrack.id, perSeedLimit);

    for (const track of recs) {
      if (!seenTrackIds.has(track.id)) {
        // Calculate sorting score based on artist familiarity and diversity
        const artistFamiliarity = artistScores.get(track.artist.id) ?? 0;
        const diversityBonus = artistFamiliarity === 0 ? diversityWeight : 0;
        const score =
          (track.rank ?? 0) + artistFamiliarity * 10000 + diversityBonus * 5000;

        // Store track and score separately - don't modify the original Track object
        scoredTracks.push({ track, score });
        seenTrackIds.add(track.id);
      }
    }
  }

  // Track total candidates before limiting
  const totalCandidates = scoredTracks.length;

  // Sort by calculated score (higher = better match)
  scoredTracks.sort((a, b) => b.score - a.score);

  // Extract original Track objects (with authentic rank values preserved)
  const sortedTracks = scoredTracks.slice(0, limit).map(({ track }) => track);

  // Apply diversity shuffle
  return {
    tracks: shuffleWithDiversity(sortedTracks),
    totalCandidates,
  };
}

/**
 * Filter recommendations based on user preferences
 */
export function filterRecommendations(
  tracks: Track[],
  options: {
    excludeTrackIds?: number[];
    excludeArtistIds?: number[];
    minRank?: number;
    maxExplicit?: boolean;
  },
): Track[] {
  return tracks.filter((track) => {
    // Exclude specific tracks
    if (options.excludeTrackIds?.includes(track.id)) {
      return false;
    }

    // Exclude specific artists
    if (options.excludeArtistIds?.includes(track.artist.id)) {
      return false;
    }

    // Filter by rank (popularity)
    if (options.minRank && track.rank < options.minRank) {
      return false;
    }

    // Filter explicit content
    if (options.maxExplicit === false && track.explicit_lyrics) {
      return false;
    }

    return true;
  });
}

/**
 * Shuffle recommendations with diversity in mind
 * Ensures no consecutive tracks from the same artist
 */
export function shuffleWithDiversity(tracks: Track[]): Track[] {
  if (tracks.length <= 1) return tracks;

  const result: Track[] = [];
  const pool = [...tracks];
  let lastArtistId: number | null = null;

  while (pool.length > 0) {
    let foundDifferent = false;

    // Try to find a track from a different artist
    for (let i = 0; i < pool.length; i++) {
      const track = pool[i];
      if (!track) continue;

      if (!lastArtistId || track.artist.id !== lastArtistId) {
        result.push(track);
        lastArtistId = track.artist.id;
        pool.splice(i, 1);
        foundDifferent = true;
        break;
      }
    }

    // If all remaining tracks are from the same artist, just add them
    if (!foundDifferent && pool.length > 0) {
      const track = pool.shift();
      if (track) {
        result.push(track);
        lastArtistId = track.artist.id;
      }
    }
  }

  return result;
}

/**
 * Audio Features Recommendations (Future - when Essentia is integrated)
 *
 * This function will be used when ENABLE_AUDIO_FEATURES is true
 * It will fetch recommendations based on audio similarity (BPM, key, energy, etc.)
 *
 * Requirements:
 * - Essentia microservice must be running
 * - Audio features must be pre-computed for tracks
 *
 * Implementation:
 * ```typescript
 * const essentiaUrl = process.env.ESSENTIA_API_URL;
 * const response = await fetch(`${essentiaUrl}/similar`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     trackId: seedTrackId,
 *     limit: limit,
 *     features: ['bpm', 'key', 'energy', 'danceability']
 *   })
 * });
 * ```
 */
export async function fetchAudioFeatureRecommendations(
  seedTrackId: number,
  limit = 20,
): Promise<Track[]> {
  if (!ENABLE_AUDIO_FEATURES) {
    console.log(
      "Audio features not enabled, falling back to Deezer recommendations",
    );
    return fetchDeezerRecommendations(seedTrackId, limit);
  }

  // TODO: Implement when Essentia is ready
  // For now, fall back to Deezer
  console.log("Essentia integration pending, using Deezer recommendations");
  return fetchDeezerRecommendations(seedTrackId, limit);
}

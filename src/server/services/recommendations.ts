// File: src/server/services/recommendations.ts

import {
  ENABLE_AUDIO_FEATURES,
  RECOMMENDATION_CACHE_HOURS,
} from "@/config/features";
import type { Track } from "@/types";

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

export async function fetchDeezerRecommendations(
  seedTrackId: number,
  limit = 20,
): Promise<Track[]> {
  try {

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

export async function fetchGenreChart(
  genreId: number,
  limit = 20,
): Promise<Track[]> {
  try {
    const response = await fetch(
      `https://api.deezer.com/chart/${genreId}/tracks?limit=${limit}`,
    );

    if (!response.ok) {

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

export function getCacheExpiryDate(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + RECOMMENDATION_CACHE_HOURS);
  return expiry;
}

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

  const allocation = getSimilarityAllocation(similarityLevel, limit);

  try {

    console.log(`[SmartQueue] Fetching track radio for ${seedTrack.title}...`);
    const trackRadio = await fetchDeezerRecommendations(
      seedTrack.id,
      allocation.trackRadio,
    );
    addTracks(trackRadio, 2);
    console.log(
      `[SmartQueue] Track radio: ${trackRadio.length} tracks, added ${recommendations.length}`,
    );

    if (recommendations.length < limit && allocation.relatedArtists > 0) {
      console.log(`[SmartQueue] Fetching related artists...`);
      const relatedArtists = await fetchRelatedArtists(seedTrack.artist.id, 5);

      for (const artist of relatedArtists) {
        if (recommendations.length >= limit) break;

        const artistTracks = await fetchArtistTopTracks(artist.id, 3);

        const isLikedArtist = userFavoriteArtistIds.includes(artist.id);
        addTracks(artistTracks, isLikedArtist ? 3 : 2);
      }
      console.log(
        `[SmartQueue] After related artists: ${recommendations.length} tracks`,
      );
    }

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
      addTracks(artistTracks, 4);
      console.log(
        `[SmartQueue] After artist deep-dive: ${recommendations.length} tracks`,
      );
    }

    if (recommendations.length < limit && allocation.genre > 0) {
      const trackDetails = await fetchTrackDetails(seedTrack.id);
      const genreId = trackDetails?.album?.genre_id;

      if (genreId) {
        console.log(`[SmartQueue] Fetching genre ${genreId} tracks...`);
        const genreTracks = await fetchGenreChart(genreId, allocation.genre);

        const filteredGenreTracks = genreTracks.filter(
          (t) => t.rank > 500000 || userFavoriteArtistIds.includes(t.artist.id),
        );
        addTracks(filteredGenreTracks, 1);
        console.log(
          `[SmartQueue] After genre exploration: ${recommendations.length} tracks`,
        );
      }
    }

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

  return shuffleWithDiversity(recommendations.slice(0, limit));
}

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

      return {
        trackRadio: Math.ceil(total * 0.8),
        relatedArtists: 0,
        sameArtist: Math.ceil(total * 0.2),
        genre: 0,
      };
    case "diverse":

      return {
        trackRadio: Math.ceil(total * 0.4),
        relatedArtists: Math.ceil(total * 0.3),
        sameArtist: Math.ceil(total * 0.1),
        genre: Math.ceil(total * 0.2),
      };
    case "balanced":
    default:

      return {
        trackRadio: Math.ceil(total * 0.6),
        relatedArtists: Math.ceil(total * 0.2),
        sameArtist: Math.ceil(total * 0.1),
        genre: Math.ceil(total * 0.1),
      };
  }
}

export async function fetchHybridRecommendations(
  seedTrack: Track,
  userTopArtistIds: number[],
  limit = 20,
): Promise<Track[]> {

  return fetchEnhancedRecommendations(seedTrack, {
    userFavoriteArtistIds: userTopArtistIds,
    similarityLevel: "balanced",
    limit,
  });
}

export interface MultiSeedRecommendationsResult {
  tracks: Track[];
  totalCandidates: number;
}

export async function fetchMultiSeedRecommendations(
  seedTracks: Track[],
  options: {
    userFavoriteArtistIds?: number[];
    limit?: number;
    diversityWeight?: number;
  } = {},
): Promise<MultiSeedRecommendationsResult> {
  const { limit = 30, diversityWeight = 0.5 } = options;

  const scoredTracks: Array<{ track: Track; score: number }> = [];
  const seenTrackIds = new Set<number>(seedTracks.map((t) => t.id));
  const artistScores = new Map<number, number>();

  for (const track of seedTracks) {
    artistScores.set(
      track.artist.id,
      (artistScores.get(track.artist.id) ?? 0) + 1,
    );
  }

  const perSeedLimit = Math.ceil((limit * 1.5) / seedTracks.length);

  for (const seedTrack of seedTracks) {
    const recs = await fetchDeezerRecommendations(seedTrack.id, perSeedLimit);

    for (const track of recs) {
      if (!seenTrackIds.has(track.id)) {

        const artistFamiliarity = artistScores.get(track.artist.id) ?? 0;
        const diversityBonus = artistFamiliarity === 0 ? diversityWeight : 0;
        const score =
          (track.rank ?? 0) + artistFamiliarity * 10000 + diversityBonus * 5000;

        scoredTracks.push({ track, score });
        seenTrackIds.add(track.id);
      }
    }
  }

  const totalCandidates = scoredTracks.length;

  scoredTracks.sort((a, b) => b.score - a.score);

  const sortedTracks = scoredTracks.slice(0, limit).map(({ track }) => track);

  return {
    tracks: shuffleWithDiversity(sortedTracks),
    totalCandidates,
  };
}

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

    if (options.excludeTrackIds?.includes(track.id)) {
      return false;
    }

    if (options.excludeArtistIds?.includes(track.artist.id)) {
      return false;
    }

    if (options.minRank && track.rank < options.minRank) {
      return false;
    }

    if (options.maxExplicit === false && track.explicit_lyrics) {
      return false;
    }

    return true;
  });
}

export function shuffleWithDiversity(tracks: Track[]): Track[] {
  if (tracks.length <= 1) return tracks;

  const result: Track[] = [];
  const pool = [...tracks];
  let lastArtistId: number | null = null;

  while (pool.length > 0) {
    let foundDifferent = false;

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

  console.log("Essentia integration pending, using Deezer recommendations");
  return fetchDeezerRecommendations(seedTrackId, limit);
}

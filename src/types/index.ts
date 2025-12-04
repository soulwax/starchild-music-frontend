// File: src/types/index.ts

export interface Artist {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  tracklist: string;
  type: "artist";
}

export interface Album {
  id: number;
  title: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  md5_image: string;
  tracklist: string;
  type: "album";
}

export interface Track {
  id: number;
  readable: boolean;
  title: string;
  title_short: string;
  title_version: string;
  link: string;
  duration: number;
  rank: number;
  explicit_lyrics: boolean;
  explicit_content_lyrics: number;
  explicit_content_cover: number;
  preview: string;
  md5_image: string;
  artist: Artist;
  album: Album;
  type: "track";
}

// API Response types

export interface SearchResponse {
  data: Track[];
  total: number;
  next?: string;
}

export interface StreamUrlParams {
  query?: string;
  id?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  error?: string;
}

// Player state types

export type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";

export interface PlayerTrack {
  track: Track;
  streamUrl: string;
}

export interface QueueItem {
  id: string;
  track: Track;
  addedAt: Date;
}

// Playlist types

export type Playlist = {
  id: number;
  ownerId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type PlaylistTrack = {
  id: number;
  playlistId: number;
  trackId: string;
  position: number;
  addedAt: string;
};

export type ReorderPayload = {
  playlistId: number;
  order: { trackId: string; position: number }[];
};

// Smart Queue & Recommendations types

export interface RecommendationContext {
  source: "deezer" | "custom" | "ml" | "audio-features";
  seedTrackId: number;
  reason?: string; // Why this track was recommended
  similarity?: number; // 0-1 similarity score (if available)
}

export interface RecommendedTrack extends Track {
  recommendationContext?: RecommendationContext;
}

export interface SmartQueueSettings {
  autoQueueEnabled: boolean;
  autoQueueThreshold: number; // Add tracks when queue has <= N tracks
  autoQueueCount: number; // Number of tracks to add
  smartMixEnabled: boolean;
  similarityPreference: "strict" | "balanced" | "diverse";
}

export interface AudioFeatures {
  trackId: number;
  bpm?: number;
  key?: string;
  energy?: number;
  danceability?: number;
  valence?: number;
  acousticness?: number;
  instrumentalness?: number;
  liveness?: number;
  speechiness?: number;
  loudness?: number;
  spectralCentroid?: number;
  analyzedAt: Date;
  source: "essentia" | "spotify" | "manual";
}

export interface RecommendationCacheEntry {
  id: number;
  seedTrackId: number;
  recommendedTrackIds: number[];
  recommendedTracksData: Track[];
  source: "deezer" | "custom" | "ml";
  createdAt: Date;
  expiresAt: Date;
}

export type SimilarityMethod =
  | "same-artist"
  | "same-album"
  | "genre-match"
  | "bpm-match"
  | "key-match"
  | "energy-match"
  | "collaborative-filtering"
  | "audio-similarity";

export interface SimilarTrackOptions {
  limit?: number;
  excludeTrackIds?: number[];
  preferredMethods?: SimilarityMethod[];
  useAudioFeatures?: boolean;
}

export type EqualizerType =
  | "Flat"
  | "Rock"
  | "Pop"
  | "Jazz"
  | "Classical"
  | "Bass Boost"
  | "Treble Boost"
  | "Vocal"
  | "Electronic"
  | "Custom";

export interface EqualizerSettings {
  preset: string;
  bands: number[];
  enabled: boolean;
}

export interface EQPreferences {
  enabled: boolean;
  preset: string;
  bands: number[];
}

// Utility type guards
export function isTrack(obj: unknown): obj is Track {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "title" in obj &&
    "artist" in obj &&
    "album" in obj
  );
}

export function isSearchResponse(obj: unknown): obj is SearchResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "data" in obj &&
    Array.isArray((obj as SearchResponse).data)
  );
}

export function isRecommendedTrack(obj: unknown): obj is RecommendedTrack {
  return isTrack(obj) && "recommendationContext" in obj;
}

// tRPC API Response Types

export interface ListeningHistoryItem {
  id: number;
  track: Track;
  playedAt: Date;
  duration: number | null;
}

export interface FavoriteItem {
  id: number;
  track: Track;
  createdAt: Date;
}

export interface TopTrackItem {
  track: Track;
  playCount: number;
  totalDuration: number | null;
}

export interface TopArtistItem {
  artist: Artist;
  playCount: number;
}

export interface PlaylistWithTracks {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  trackCount?: number;
  tracks?: Array<{
    id: number;
    track: Track;
    position: number;
    addedAt: Date;
  }>;
}

export interface UserProfile {
  userHash: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  stats: {
    favorites: number;
    playlists: number;
    tracksPlayed: number;
  };
}

// File: src/types/index.ts

export interface Artist {
  id: number;
  name: string;
  link?: string;
  picture?: string;
  picture_small?: string;
  picture_medium?: string;
  picture_big?: string;
  picture_xl?: string;
  tracklist?: string;
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
  release_date?: string;
  genres?: Array<{ id: number; name: string }>;
  artist?: Artist;
}

export interface Track {
  id: number;
  readable: boolean;
  title: string;
  title_short: string;
  title_version?: string;
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
  bpm?: number;
  gain?: number;
  release_date?: string;
}

export type QueueSource =
  | 'user'
  | 'smart'
  | 'playlist'
  | 'album'
  | 'artist'
  | 'radio'
  | 'recommendation';

export interface QueuedTrack {
  track: Track;
  queueSource: QueueSource;
  addedAt: Date;
  queueId: string;
  addedBy?: string;
  smartQueueMetadata?: SmartQueueMetadata;
}

export interface SmartQueueMetadata {
  seedTrackId: number;
  similarity: number;
  reason: string;
  method: SimilarityMethod;
}

export interface QueueState {
  queuedTracks: QueuedTrack[];
  history: Track[];
  originalQueue?: QueuedTrack[];
  isShuffled: boolean;
  repeatMode: RepeatMode;
  currentTime: number;
  smartQueueState: SmartQueueState;
}

export type RepeatMode = 'none' | 'one' | 'all';

export interface SmartQueueState {
  isActive: boolean;
  lastRefreshedAt: Date | null;
  seedTrackId: number | null;
  trackCount: number;
}

export interface SmartQueueSettings {
  autoQueueEnabled: boolean;
  autoQueueThreshold: number;
  autoQueueCount: number;
  smartMixEnabled: boolean;
  similarityPreference: SimilarityPreference;
  diversityFactor: number;
  excludeExplicit: boolean;
  preferLiveVersions: boolean;
}

export type SimilarityPreference =
  | 'strict'
  | 'balanced'
  | 'diverse';

export interface QueueSections {
  nowPlaying: QueuedTrack | null;
  userQueue: QueuedTrack[];
  smartQueue: QueuedTrack[];
}

export type PlaylistVisibility = 'public' | 'private' | 'unlisted';

export interface Playlist {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  visibility: PlaylistVisibility;
  isPublic: boolean;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  trackCount: number;
  totalDuration: number;
  isCollaborative: boolean;
  collaborators?: string[];
  tags?: string[];
  mood?: PlaylistMood;
}

export type PlaylistMood =
  | 'energetic'
  | 'chill'
  | 'happy'
  | 'sad'
  | 'focused'
  | 'party'
  | 'workout'
  | 'sleep'
  | 'romantic'
  | 'melancholic';

export interface PlaylistTrack {
  id: number;
  playlistId: number;
  track: Track;
  position: number;
  addedAt: Date;
  addedBy: string;
  note?: string;
}

export interface PlaylistWithTracks extends Playlist {
  tracks: PlaylistTrack[];
}

export interface PlaylistWithTrackStatus extends Playlist {
  hasTrack: boolean;
}

export interface PlaylistReorderPayload {
  playlistId: number;
  order: Array<{ trackId: number; position: number }>;
}

export interface PlaylistMergePayload {
  sourcePlaylistId: number;
  targetPlaylistId: number;
  removeSource: boolean;
}

export interface PlaylistStats {
  playlistId: number;
  totalPlays: number;
  uniqueListeners: number;
  averageRating: number | null;
  topGenres: Array<{ genre: string; count: number }>;
  topArtists: Array<{ artist: Artist; count: number }>;
  createdAt: Date;
  lastPlayedAt: Date | null;
}

export type ProfileVisibility = 'public' | 'friends' | 'private';

export interface UserProfile {
  userId: string;
  userHash: string;
  name: string | null;
  displayName: string;
  username: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  visibility: ProfileVisibility;
  isVerified: boolean;
  isPro: boolean;
  createdAt: Date;
  lastActiveAt: Date | null;
  stats: UserStats;
  preferences: UserPreferences;
  socialLinks?: SocialLinks;
}

export interface UserStats {
  favorites: number;
  playlists: number;
  publicPlaylists: number;
  tracksPlayed: number;
  totalListeningTime: number;
  followers: number;
  following: number;
  topGenres: string[];
  joinedAt: Date;
  listeningStreak: number;
}

export interface DetailedUserStats extends UserStats {
  thisWeek: {
    tracksPlayed: number;
    uniqueArtists: number;
    listeningTime: number;
  };
  thisMonth: {
    tracksPlayed: number;
    uniqueArtists: number;
    listeningTime: number;
  };
  allTime: {
    topTrack: Track | null;
    topArtist: Artist | null;
    topAlbum: Album | null;
    mostPlayedHour: number;
    averageSessionDuration: number;
  };
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  spotify?: string;
  soundcloud?: string;
  youtube?: string;
}

export interface UserPreferences {
  theme: ThemePreference;
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  playback: PlaybackPreferences;
  visualizer: VisualizerPreferences;
  smartQueue: SmartQueueSettings;
  equalizerPanelOpen: boolean;
  queuePanelOpen: boolean;
  visualizerEnabled: boolean;
}

export type ThemePreference = 'dark' | 'light' | 'auto';

export interface NotificationPreferences {
  newFollowers: boolean;
  playlistUpdates: boolean;
  recommendations: boolean;
  friendActivity: boolean;
  email: boolean;
  push: boolean;
}

export interface PrivacyPreferences {
  showListeningActivity: boolean;
  showPlaylists: boolean;
  showFavorites: boolean;
  showFollowers: boolean;
  allowMessages: boolean;
  shareHistory: boolean;
}

export interface PlaybackPreferences {
  crossfade: number;
  gaplessPlayback: boolean;
  normalizeVolume: boolean;
  defaultVolume: number;
  defaultQuality: AudioQuality;
  autoplay: boolean;
  downloadQuality: AudioQuality;
}

export type AudioQuality = 'low' | 'normal' | 'high' | 'lossless';

export interface VisualizerPreferences {
  enabled: boolean;
  pattern: string;
  colorScheme: 'track' | 'album' | 'custom';
  customColors?: string[];
  sensitivity: number;
  particleCount: number;
  animationSpeed: number;
}

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error' | 'buffering';

export interface AudioPlayerState {
  currentTrack: Track | null;
  queue: QueueState;
  playbackState: PlayerState;
  isPlaying: boolean;
  isMuted: boolean;
  isLoading: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  buffered: number;
  playbackRate: number;
  error: PlayerError | null;
  streamUrl: string | null;
}

export interface PlayerError {
  code: PlayerErrorCode;
  message: string;
  timestamp: Date;
  trackId?: number;
  recoverable: boolean;
}

export type PlayerErrorCode =
  | 'NETWORK_ERROR'
  | 'DECODE_ERROR'
  | 'SRC_NOT_SUPPORTED'
  | 'ABORTED'
  | 'STREAM_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'UNKNOWN';

export interface AudioFeatures {
  trackId: number;

  bpm: number | null;
  timeSignature: string | null;
  rhythm: number | null;

  key: string | null;
  mode: 'major' | 'minor' | null;
  harmonicComplexity: number | null;

  energy: number | null;
  danceability: number | null;
  valence: number | null;
  acousticness: number | null;
  instrumentalness: number | null;
  liveness: number | null;
  speechiness: number | null;
  loudness: number | null;
  spectralCentroid: number | null;
  spectralRolloff: number | null;

  analyzedAt: Date;
  source: AudioAnalysisSource;
  confidence: number;
}

export type AudioAnalysisSource = 'essentia' | 'spotify' | 'librosa' | 'manual';

export interface EqualizerSettings {
  enabled: boolean;
  preset: EqualizerPreset;
  bands: EqualizerBand[];
}

export type EqualizerPreset =
  | 'Flat'
  | 'Rock'
  | 'Pop'
  | 'Jazz'
  | 'Classical'
  | 'Bass Boost'
  | 'Treble Boost'
  | 'Vocal'
  | 'Electronic'
  | 'Hip Hop'
  | 'Acoustic'
  | 'Custom';

export interface EqualizerBand {
  frequency: number;
  gain: number;
  Q: number;
}

export interface ListeningHistoryItem {
  id: number;
  userId: string;
  track: Track;
  playedAt: Date;
  duration: number | null;
  completionRate: number | null;
  source: PlaybackSource;
  context?: PlaybackContext;
  skipped: boolean;
  device?: DeviceInfo;
}

export type PlaybackSource =
  | 'queue'
  | 'playlist'
  | 'album'
  | 'artist'
  | 'search'
  | 'radio'
  | 'recommendation'
  | 'history'
  | 'favorite';

export interface PlaybackContext {
  type: 'playlist' | 'album' | 'artist' | 'radio' | 'queue';
  id?: number | string;
  name?: string;
}

export interface DeviceInfo {
  type: 'browser' | 'desktop' | 'mobile' | 'tablet';
  name: string;
  os?: string;
  browser?: string;
}

export interface ListeningStats {
  period: TimePeriod;
  totalTracks: number;
  totalTime: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  topTracks: TopTrackItem[];
  topArtists: TopArtistItem[];
  topAlbums: TopAlbumItem[];
  topGenres: GenreStats[];
  listeningByHour: number[];
  listeningByDay: number[];
}

export type TimePeriod = 'week' | 'month' | 'year' | 'all-time';

export interface TopTrackItem {
  track: Track;
  playCount: number;
  totalDuration: number | null;
  lastPlayed: Date;
}

export interface TopArtistItem {
  artist: Artist;
  playCount: number;
  uniqueTracks: number;
  totalDuration: number | null;
  lastPlayed: Date;
}

export interface TopAlbumItem {
  album: Album;
  playCount: number;
  tracksPlayed: number;
  totalDuration: number | null;
  lastPlayed: Date;
}

export interface GenreStats {
  genre: string;
  playCount: number;
  percentage: number;
  tracks: number;
  artists: number;
}

export interface FavoriteItem {
  id: number;
  userId: string;
  track: Track;
  createdAt: Date;
  note?: string;
  playlistIds?: number[];
}

export interface FavoriteCollection {
  userId: string;
  totalFavorites: number;
  totalDuration: number;
  lastAdded: Date | null;
  topGenres: string[];
  topArtists: Artist[];
}

export interface RecommendationContext {
  source: RecommendationSource;
  seedTrackId: number;
  reason: string;
  similarity: number;
  method: SimilarityMethod;
  confidence: number;
}

export type RecommendationSource =
  | 'deezer'
  | 'custom'
  | 'ml'
  | 'audio-features'
  | 'collaborative'
  | 'content-based';

export interface RecommendedTrack extends Track {
  recommendationContext: RecommendationContext;
}

export type SimilarityMethod =
  | 'same-artist'
  | 'same-album'
  | 'same-genre'
  | 'bpm-match'
  | 'key-match'
  | 'energy-match'
  | 'mood-match'
  | 'collaborative-filtering'
  | 'audio-similarity'
  | 'lyric-similarity'
  | 'user-taste-profile';

export interface SimilarTrackOptions {
  limit: number;
  excludeTrackIds: number[];
  excludeArtistIds?: number[];
  preferredMethods: SimilarityMethod[];
  useAudioFeatures: boolean;
  diversityFactor: number;
  minSimilarity: number;
}

export interface RecommendationCacheEntry {
  id: number;
  seedTrackId: number;
  recommendedTrackIds: number[];
  recommendedTracksData: Track[];
  source: RecommendationSource;
  metadata: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
}

export interface SearchResponse {
  data: Track[];
  total: number;
  next?: string;
  prev?: string;
}

export interface StreamUrlParams {
  query?: string;
  id?: number;
  quality?: AudioQuality;
}

export interface ApiError {
  message: string;
  status: number;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FollowRelationship {
  id: number;
  followerId: string;
  followingId: string;
  createdAt: Date;
  followerProfile?: UserProfile;
  followingProfile?: UserProfile;
}

export interface ActivityItem {
  id: number;
  userId: string;
  activityType: ActivityType;
  data: ActivityData;
  createdAt: Date;
  isPublic: boolean;
}

export type ActivityType =
  | 'track_played'
  | 'playlist_created'
  | 'playlist_updated'
  | 'track_favorited'
  | 'user_followed'
  | 'achievement_unlocked';

export type ActivityData =
  | { type: 'track_played'; track: Track }
  | { type: 'playlist_created'; playlist: Playlist }
  | { type: 'playlist_updated'; playlist: Playlist }
  | { type: 'track_favorited'; track: Track }
  | { type: 'user_followed'; user: UserProfile }
  | { type: 'achievement_unlocked'; achievement: Achievement };

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  progress?: number;
}

export interface ShareLink {
  id: string;
  type: 'track' | 'playlist' | 'album' | 'artist' | 'profile';
  entityId: number | string;
  shortUrl: string;
  fullUrl: string;
  createdAt: Date;
  expiresAt?: Date;
  views: number;
}

export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data?: unknown;
}

export type ModalType =
  | 'add-to-playlist'
  | 'create-playlist'
  | 'edit-playlist'
  | 'share'
  | 'equalizer'
  | 'queue'
  | 'settings'
  | 'user-profile';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface KeyboardShortcut {
  key: string;
  modifiers: Array<'ctrl' | 'shift' | 'alt' | 'meta'>;
  action: string;
  description: string;
  handler: () => void;
}

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

export function isQueuedTrack(obj: unknown): obj is QueuedTrack {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "track" in obj &&
    "queueSource" in obj &&
    "addedAt" in obj &&
    "queueId" in obj &&
    isTrack((obj as QueuedTrack).track)
  );
}

export function isPlaylist(obj: unknown): obj is Playlist {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "name" in obj &&
    "userId" in obj
  );
}

export function isUserProfile(obj: unknown): obj is UserProfile {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "userId" in obj &&
    "userHash" in obj &&
    "stats" in obj
  );
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type ValueOf<T> = T[keyof T];

export type Nullable<T> = T | null;

export type Maybe<T> = T | null | undefined;

export type PlaylistType = Playlist;

export interface QueueItem {
  id: string;
  track: Track;
  addedAt: Date;
}

export interface EQPreferences {
  enabled: boolean;
  preset: string;
  bands: number[];
}

export type EqualizerType = EqualizerPreset;

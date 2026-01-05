// File: src/config/features.ts

export const ENABLE_AUDIO_FEATURES = false;

export const ENABLE_SMART_QUEUE = true;

export const RECOMMENDATION_CACHE_HOURS = 24;

export const MAX_RECOMMENDATION_TRACKS = 50;

export const DEFAULT_SIMILAR_TRACKS_COUNT = 5;

export const isFeatureEnabled = (feature: keyof typeof features) => {
  return features[feature] ?? false;
};

export const features = {
  audioFeatures: ENABLE_AUDIO_FEATURES,
  smartQueue: ENABLE_SMART_QUEUE,
} as const;

export type FeatureFlags = typeof features;

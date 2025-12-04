// File: src/utils/images.ts

/**
 * Image utility functions for album covers and artist pictures
 */

import type { Album, Artist, Track } from "@/types";

/**
 * Gets the best available cover image for a track's album with fallback chain
 * Priority: cover_medium > cover_small > cover > placeholder
 * @param track - The track object containing album information
 * @param size - Optional preferred size ('small' | 'medium' | 'big' | 'xl')
 * @returns URL string for the cover image
 * @example
 * getCoverImage(track) // returns medium cover or fallback
 * getCoverImage(track, 'big') // returns big cover or fallback
 */
export function getCoverImage(
  track: Track,
  size: "small" | "medium" | "big" | "xl" = "medium",
): string {
  const album = track.album;

  // If album is missing, return placeholder
  if (!album) {
    return "/images/placeholder-cover.svg";
  }

  // Try to get the requested size
  const normalize = (value?: string | null) =>
    value && value.trim().length > 0 ? value : undefined;

  const sizeMap = {
    small: normalize(album.cover_small),
    medium: normalize(album.cover_medium),
    big: normalize(album.cover_big),
    xl: normalize(album.cover_xl),
  };

  // Fallback chain
  return (
    sizeMap[size] ??
    normalize(album.cover_medium) ??
    normalize(album.cover_small) ??
    normalize(album.cover) ??
    "/images/placeholder-cover.svg"
  );
}

/**
 * Gets the best available cover image directly from an Album object
 * @param album - The album object
 * @param size - Optional preferred size ('small' | 'medium' | 'big' | 'xl')
 * @returns URL string for the cover image
 */
export function getAlbumCover(
  album: Album,
  size: "small" | "medium" | "big" | "xl" = "medium",
): string {
  const normalize = (value?: string | null) =>
    value && value.trim().length > 0 ? value : undefined;

  const sizeMap = {
    small: normalize(album.cover_small),
    medium: normalize(album.cover_medium),
    big: normalize(album.cover_big),
    xl: normalize(album.cover_xl),
  };

  return (
    sizeMap[size] ??
    normalize(album.cover_medium) ??
    normalize(album.cover_small) ??
    normalize(album.cover) ??
    "/images/placeholder-cover.svg"
  );
}

/**
 * Gets the best available artist picture with fallback chain
 * @param artist - The artist object
 * @param size - Optional preferred size ('small' | 'medium' | 'big' | 'xl')
 * @returns URL string for the artist picture
 */
export function getArtistPicture(
  artist: Artist,
  size: "small" | "medium" | "big" | "xl" = "medium",
): string {
  const normalize = (value?: string | null) =>
    value && value.trim().length > 0 ? value : undefined;

  const sizeMap = {
    small: normalize(artist.picture_small),
    medium: normalize(artist.picture_medium),
    big: normalize(artist.picture_big),
    xl: normalize(artist.picture_xl),
  };

  return (
    sizeMap[size] ??
    normalize(artist.picture_medium) ??
    normalize(artist.picture_small) ??
    normalize(artist.picture) ??
    "/images/placeholder-cover.svg"
  );
}

/**
 * Generates a srcSet string for responsive images
 * @param album - The album object containing cover URLs
 * @returns srcSet string for use in img elements
 * @example
 * <img src={getCoverImage(track)} srcSet={getImageSrcSet(track.album)} />
 */
export function getImageSrcSet(album: Album): string {
  const sizes = [];

  if (album.cover_small) {
    sizes.push(`${album.cover_small} 56w`);
  }
  if (album.cover_medium) {
    sizes.push(`${album.cover_medium} 250w`);
  }
  if (album.cover_big) {
    sizes.push(`${album.cover_big} 500w`);
  }
  if (album.cover_xl) {
    sizes.push(`${album.cover_xl} 1000w`);
  }

  return sizes.join(", ");
}

// File: src/utils/images.ts

import type { Album, Artist, Track } from "@/types";

export function getCoverImage(
  track: Track,
  size: "small" | "medium" | "big" | "xl" = "medium",
): string {
  const album = track.album;

  if (!album) {
    return "/images/placeholder-cover.svg";
  }

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

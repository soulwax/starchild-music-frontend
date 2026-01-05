// File: src/app/page.tsx

import { env } from "@/env";
import type { SearchResponse, Track } from "@/types";
import { getBaseUrl } from "@/utils/getBaseUrl";
import { type Metadata } from "next";
import { Suspense } from "react";
import HomePageClient from "./HomePageClient";

const baseUrl = getBaseUrl();

async function getFirstTrackFromSearch(query: string): Promise<Track | null> {
  try {

    const baseUrl = getBaseUrl();
    const url = new URL("/api/music/search", baseUrl);
    url.searchParams.set("q", query);
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const response = (await res.json()) as SearchResponse;
    return response.data?.[0] ?? null;
  } catch (error) {
    console.error("Failed to fetch track for metadata:", error);
    return null;
  }
}

function getAlbumCoverImage(track: Track | null): string {
  if (!track?.album) {
    return "";
  }

  const coverImage =
    track.album.cover_xl ||
    track.album.cover_big ||
    track.album.cover_medium ||
    track.album.cover_small ||
    track.album.cover;

  if (coverImage && coverImage.trim().length > 0) {
    return coverImage;
  }

  return "";
}

function buildOgImageUrl(track: Track | null, baseUrl: string): string {
  if (!track) {

    return `${baseUrl}/api/og`;
  }

  const params = new URLSearchParams();
  params.set("title", track.title);
  params.set("artist", track.artist.name);
  if (track.album?.title) {
    params.set("album", track.album.title);
  }
  const coverImage = getAlbumCoverImage(track);
  if (coverImage) {
    params.set("cover", coverImage);
  }

  return `${baseUrl}/api/og?${params.toString()}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = params?.q;

  const defaultOgImage = buildOgImageUrl(null, baseUrl);
  const defaultMetadata: Metadata = {
    title: "darkfloor.art",
    description:
      "Modern music streaming and discovery platform with advanced audio features and visual patterns",
    openGraph: {
      title: "darkfloor.art",
      description:
        "Modern music streaming and discovery platform with advanced audio features and visual patterns",
      type: "website",
      url: baseUrl,
      siteName: "darkfloor.art",
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: "darkfloor.art - Modern music streaming platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "darkfloor.art",
      description:
        "Modern music streaming and discovery platform with advanced audio features and visual patterns",
      images: [defaultOgImage],
    },
  };

  if (!query || query.trim().length === 0) {
    return defaultMetadata;
  }

  const firstTrack = await getFirstTrackFromSearch(query);
  const ogImage = buildOgImageUrl(firstTrack, baseUrl);

  const trackTitle = firstTrack
    ? `${firstTrack.title} by ${firstTrack.artist.name}`
    : `Search: ${query}`;
  const description = firstTrack
    ? `Listen to ${firstTrack.title} by ${firstTrack.artist.name}${firstTrack.album?.title ? ` from ${firstTrack.album.title}` : ""} on darkfloor.art`
    : `Search results for "${query}" on darkfloor.art`;

  return {
    title: trackTitle,
    description,
    openGraph: {
      title: trackTitle,
      description,
      type: "music.song",
      url: `${baseUrl}/?q=${encodeURIComponent(query)}`,
      siteName: "darkfloor.art",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: firstTrack
            ? `${firstTrack.title} by ${firstTrack.artist.name}`
            : "darkfloor.art",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: trackTitle,
      description,
      images: [ogImage],
    },
  };
}

export default function HomePage({
  _searchParams,
}: {
  _searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <HomePageClient />
    </Suspense>
  );
}

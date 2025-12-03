// File: src/app/library/page.tsx

"use client";

import { EmptyState } from "@/components/EmptyState";
import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { LoadingState } from "@/components/LoadingSpinner";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { api } from "@/trpc/react";
import type { FavoriteItem, ListeningHistoryItem } from "@/types";
import { Heart, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TabType = "favorites" | "history";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("favorites");

  // Use global player instead of local state
  const player = useGlobalPlayer();

  const { data: favorites, isLoading: favoritesLoading } =
    api.music.getFavorites.useQuery(
      { limit: 100, offset: 0 },
      { enabled: activeTab === "favorites" },
    );

  const { data: history, isLoading: historyLoading } =
    api.music.getHistory.useQuery(
      { limit: 100, offset: 0 },
      { enabled: activeTab === "history" },
    );

  return (
    <div className="container mx-auto flex min-h-screen flex-col px-3 py-4 md:px-6 md:py-8">
      {/* Page Title */}
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)] md:mb-8 md:text-3xl">
        Your Library
      </h1>

      {/* Mobile-Optimized Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[rgba(244,178,102,0.14)] md:mb-8 md:gap-4">
        <button
          onClick={() => setActiveTab("favorites")}
          className={`touch-target relative flex flex-1 items-center justify-center gap-2 px-3 pb-3 font-medium transition md:flex-initial md:px-4 md:pb-4 ${
            activeTab === "favorites"
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
          }`}
        >
          <Heart className="h-4 w-4 md:h-5 md:w-5" />
          <span className="text-sm md:text-base">Favorites</span>
          {activeTab === "favorites" && (
            <div className="accent-gradient absolute right-0 bottom-0 left-0 h-0.5" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`touch-target relative flex flex-1 items-center justify-center gap-2 px-3 pb-3 font-medium transition md:flex-initial md:px-4 md:pb-4 ${
            activeTab === "history"
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
          }`}
        >
          <Clock className="h-4 w-4 md:h-5 md:w-5" />
          <span className="text-sm md:text-base">History</span>
          {activeTab === "history" && (
            <div className="accent-gradient absolute right-0 bottom-0 left-0 h-0.5" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === "favorites" && (
        <div className="fade-in">
          {favoritesLoading ? (
            <LoadingState message="Loading your favorites..." />
          ) : favorites && favorites.length > 0 ? (
            <div className="grid gap-2 md:gap-3">
              {favorites.map((fav: FavoriteItem) => (
                <EnhancedTrackCard
                  key={fav.id}
                  track={fav.track}
                  onPlay={player.play}
                  onAddToQueue={player.addToQueue}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Heart className="h-12 w-12 md:h-16 md:w-16" />}
              title="No favorites yet"
              description="Tracks you favorite will appear here"
              action={
                <Link href="/" className="btn-primary touch-target-lg">
                  Search for music
                </Link>
              }
            />
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="fade-in">
          {historyLoading ? (
            <LoadingState message="Loading your history..." />
          ) : history && history.length > 0 ? (
            <div className="grid gap-2 md:gap-3">
              {history.map((item: ListeningHistoryItem) => (
                <EnhancedTrackCard
                  key={item.id}
                  track={item.track}
                  onPlay={player.play}
                  onAddToQueue={player.addToQueue}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Clock className="h-12 w-12 md:h-16 md:w-16" />}
              title="No listening history yet"
              description="Your recently played tracks will appear here"
              action={
                <Link href="/" className="btn-primary touch-target-lg">
                  Start listening to music
                </Link>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

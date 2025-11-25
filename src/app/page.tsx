// File: src/app/page.tsx

"use client";

import MobileSearchBar from "@/components/MobileSearchBar";
import { PullToRefreshWrapper } from "@/components/PullToRefreshWrapper";
import SwipeableTrackCard from "@/components/SwipeableTrackCard";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { hapticLight } from "@/utils/haptics";
import { springPresets, staggerContainer, staggerItem } from "@/utils/spring-animations";
import { searchTracks } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, Search, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function SearchPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mounted, setMounted] = useState(false);

  const player = useGlobalPlayer();

  useEffect(() => {
    setMounted(true);
  }, []);

  const addSearchQuery = api.music.addSearchQuery.useMutation();
  const { data: recentSearches } = api.music.getRecentSearches.useQuery(
    { limit: 5 },
    { enabled: !!session },
  );

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setLoading(true);
      setCurrentQuery(searchQuery);

      try {
        const response = await searchTracks(searchQuery, 0);
        setResults(response.data);
        setTotal(response.total);

        if (session) {
          addSearchQuery.mutate({ query: searchQuery });
        }
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [session, addSearchQuery],
  );

  useEffect(() => {
    try {
      const urlQuery = searchParams.get("q");
      if (urlQuery && !isInitialized) {
        setQuery(urlQuery);
        setIsInitialized(true);
        void performSearch(urlQuery);
      } else if (!isInitialized) {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error initializing from URL:", error);
      setIsInitialized(true);
    }
  }, [searchParams, isInitialized, performSearch]);

  const updateURL = (searchQuery: string) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery);
      router.push(`?${params.toString()}`, { scroll: false });
    } else {
      router.push("/", { scroll: false });
    }
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;

    updateURL(q);
    await performSearch(q);
  };

  const handleLoadMore = async () => {
    if (!currentQuery.trim() || loadingMore) return;

    const nextOffset = results.length;
    if (nextOffset >= total) return;

    setLoadingMore(true);

    try {
      const response = await searchTracks(currentQuery, nextOffset);
      setResults((prev) => [...prev, ...response.data]);
    } catch (error) {
      console.error("Load more failed:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    if (currentQuery) {
      await performSearch(currentQuery);
    }
  };

  const hasMore = results.length < total;

  if (!mounted) {
    return null;
  }

  const searchContent = (
    <div className="flex min-h-screen flex-col">
      <main className="container mx-auto w-full flex-1 py-6 md:py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springPresets.gentle}
          className="mb-6 text-center md:mb-10"
        >
          <h1 className="accent-gradient mb-3 text-2xl font-bold md:text-4xl">
            Discover Your Next Favorite Track
          </h1>
          <p className="text-sm text-[var(--color-subtext)] md:text-base">
            Search 50 million+ tracks. Log in for playlists and more.
          </p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPresets.gentle, delay: 0.1 }}
          className="card mb-6 w-full p-4 shadow-xl md:mb-8 md:p-7"
        >
          {isMobile ? (
            <MobileSearchBar
              value={query}
              onChange={setQuery}
              onSearch={handleSearch}
              onClear={() => {
                setQuery("");
                setResults([]);
                setTotal(0);
              }}
              isLoading={loading}
              recentSearches={recentSearches ?? []}
              onRecentSearchClick={(search) => {
                setQuery(search);
                void handleSearch(search);
              }}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 md:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-xl border border-[rgba(244,178,102,0.15)] bg-[rgba(18,26,38,0.9)] px-4 py-3 transition-all focus-within:border-[rgba(244,178,102,0.4)] focus-within:shadow-[0_0_0_4px_rgba(244,178,102,0.1)]">
                  <Search className="h-5 w-5 flex-shrink-0 text-[var(--color-muted)]" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-base text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none"
                    placeholder="Search for songs, artists, or albums..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
                  />
                </div>
                <button
                  className="btn-primary touch-target-lg flex items-center justify-center gap-2 px-8"
                  onClick={() => void handleSearch()}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner spinner-sm" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {session && recentSearches && recentSearches.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-subtext)]">
                    Recent:
                  </span>
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => {
                        hapticLight();
                        void handleSearch(search);
                      }}
                      className="touch-active rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-sm text-[var(--color-text)] ring-1 ring-white/5 transition-all hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent-light)] hover:ring-[var(--color-accent)]/30"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Results Section */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {results.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4 flex items-center justify-between md:mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text)] md:text-2xl">
                      Search Results
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--color-subtext)] md:mt-1 md:text-sm">
                      {results.length.toLocaleString()}
                      {total > results.length
                        ? ` of ${total.toLocaleString()}`
                        : ""}{" "}
                      tracks found
                    </p>
                  </div>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid gap-2 md:gap-3"
                >
                  {results.map((track, index) => (
                    <motion.div key={track.id} variants={staggerItem}>
                      <SwipeableTrackCard
                        track={track}
                        onPlay={player.play}
                        onAddToQueue={player.addToQueue}
                        showActions={!!session}
                        index={index}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex justify-center md:mt-8"
                  >
                    <button
                      onClick={() => void handleLoadMore()}
                      disabled={loadingMore}
                      className="btn-primary touch-target-lg flex w-full items-center justify-center gap-2 md:w-auto md:px-12"
                    >
                      {loadingMore ? (
                        <>
                          <div className="spinner spinner-sm" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        `Load More (${(total - results.length).toLocaleString()} remaining)`
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={springPresets.gentle}
                className="card flex flex-col items-center justify-center py-16 text-center md:py-20"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(244,178,102,0.15)] to-[rgba(88,198,177,0.15)] ring-2 ring-[var(--color-accent)]/20 md:h-24 md:w-24"
                >
                  <Music2 className="h-10 w-10 text-[var(--color-accent)] md:h-12 md:w-12" />
                </motion.div>
                <h3 className="mb-2 text-lg font-bold text-[var(--color-text)] md:text-xl">
                  Explore Starchild Music
                </h3>
                <p className="max-w-md px-4 text-sm text-[var(--color-subtext)] md:text-base">
                  Search for songs, artists, albums - anything you want to listen to.
                </p>
                
                {/* Quick Search Suggestions */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {["Daft Punk", "Lofi Beats", "Jazz", "Electronic"].map((suggestion) => (
                    <motion.button
                      key={suggestion}
                      onClick={() => {
                        hapticLight();
                        setQuery(suggestion);
                        void handleSearch(suggestion);
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 rounded-full bg-[rgba(244,178,102,0.1)] px-4 py-2 text-sm text-[var(--color-accent)] transition-colors hover:bg-[rgba(244,178,102,0.2)]"
                    >
                      <Sparkles className="h-3 w-3" />
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );

  // Wrap with pull-to-refresh on mobile
  if (isMobile) {
    return (
      <PullToRefreshWrapper onRefresh={handleRefresh} enabled={!!currentQuery}>
        {searchContent}
      </PullToRefreshWrapper>
    );
  }

  return searchContent;
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}

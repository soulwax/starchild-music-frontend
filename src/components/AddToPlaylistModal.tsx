// File: src/components/AddToPlaylistModal.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Globe, Music, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { useToast } from "@/contexts/ToastContext";
import { api } from "@/trpc/react";
import type { PlaylistWithTrackStatus, Track } from "@/types";
import { hapticLight, hapticSuccess } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  excludePlaylistId?: number; // Optional: hide current playlist if on detail page
}

export function AddToPlaylistModal({
  isOpen,
  onClose,
  track,
  excludePlaylistId,
}: AddToPlaylistModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittingPlaylistId, setSubmittingPlaylistId] = useState<
    number | null
  >(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const utils = api.useUtils();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  // Fetch playlists with track status (only when modal is open and user is authenticated)
  const { data: playlists, isLoading } =
    api.music.getPlaylistsWithTrackStatus.useQuery(
      { trackId: track.id, excludePlaylistId },
      { enabled: isOpen && isAuthenticated },
    );

  // Add to playlist mutation
  const addToPlaylist = api.music.addToPlaylist.useMutation({
    onSuccess: async (data, variables) => {
      if (data.alreadyExists) {
        showToast(`"${track.title}" is already in this playlist`, "info");
      } else {
        const playlistName =
          playlists?.find((p) => p.id === variables.playlistId)?.name ??
          "playlist";
        showToast(`Added to "${playlistName}"`, "success");
        hapticSuccess();

        // Invalidate queries to refresh playlist data
        await utils.music.getPlaylistsWithTrackStatus.invalidate({
          trackId: track.id,
        });
        await utils.music.getPlaylists.invalidate();
      }
      setSubmittingPlaylistId(null);
    },
    onError: (error) => {
      showToast(`Failed: ${error.message}`, "error");
      setSubmittingPlaylistId(null);
    },
  });

  // Client-side search filtering
  const filteredPlaylists = useMemo(() => {
    if (!playlists) return [];
    if (!searchQuery.trim()) return playlists;

    const query = searchQuery.toLowerCase();
    return playlists.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query),
    );
  }, [playlists, searchQuery]);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        hapticLight();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle adding track to playlist
  const handleAddToPlaylist = (playlistId: number) => {
    setSubmittingPlaylistId(playlistId);
    addToPlaylist.mutate({ playlistId, track });
  };

  // Animation variants for list items
  const listItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.03,
        duration: 0.2,
      },
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springPresets.gentle}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
            onClick={() => {
              hapticLight();
              onClose();
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springPresets.gentle}
            className="fixed inset-x-4 top-1/2 z-[201] max-h-[80vh] -translate-y-1/2 md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="surface-panel flex max-h-[80vh] flex-col overflow-hidden">
              {/* Header with track info */}
              <div className="flex items-start gap-3 border-b border-[rgba(245,241,232,0.08)] px-4 py-4">
                <div className="flex-1">
                  <h2 className="mb-1 text-lg font-bold text-[var(--color-text)]">
                    Add to Playlist
                  </h2>
                  <p className="text-sm text-[var(--color-subtext)]">
                    {track.title} • {track.artist.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    hapticLight();
                    onClose();
                  }}
                  className="rounded-lg p-2 text-[var(--color-subtext)] transition-all hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)] active:scale-95"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search bar */}
              <div className="border-b border-[rgba(245,241,232,0.08)] px-4 py-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search playlists..."
                    className="w-full rounded-lg border border-[rgba(244,178,102,0.18)] bg-[rgba(18,26,38,0.92)] py-2 pl-10 pr-4 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] backdrop-blur-sm transition-all hover:border-[rgba(244,178,102,0.35)] focus:border-[rgba(244,178,102,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(244,178,102,0.25)]"
                  />
                </div>
              </div>

              {/* Scrollable playlist list */}
              <div className="flex-1 overflow-y-auto px-2 py-2">
                {!isAuthenticated ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Music className="mb-4 h-16 w-16 text-[var(--color-muted)]" />
                    <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
                      Sign in to create playlists
                    </p>
                    <p className="mb-4 text-xs text-[var(--color-subtext)]">
                      Create an account to organize your music
                    </p>
                    <Link
                      href="/api/auth/signin"
                      onClick={() => {
                        hapticLight();
                        onClose();
                      }}
                      className="rounded-lg bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[rgba(244,178,102,0.3)] transition-all hover:scale-105 active:scale-95"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgba(244,178,102,0.2)] border-t-[var(--color-accent)]" />
                  </div>
                ) : filteredPlaylists.length === 0 ? (
                  <EmptyState
                    hasSearchQuery={!!searchQuery.trim()}
                    onClose={onClose}
                  />
                ) : (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    className="space-y-1"
                  >
                    {filteredPlaylists.map((playlist, index) => (
                      <PlaylistItem
                        key={playlist.id}
                        playlist={playlist}
                        track={track}
                        onAdd={() => handleAddToPlaylist(playlist.id)}
                        isSubmitting={submittingPlaylistId === playlist.id}
                        index={index}
                        variants={listItemVariants}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Footer with create playlist link */}
              {isAuthenticated && !isLoading && playlists && playlists.length > 0 && (
                <div className="border-t border-[rgba(245,241,232,0.08)] px-4 py-3">
                  <Link
                    href="/playlists"
                    onClick={() => {
                      hapticLight();
                      onClose();
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[rgba(244,178,102,0.1)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent)] transition-all hover:bg-[rgba(244,178,102,0.18)] active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Playlist
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Playlist item component
interface PlaylistItemProps {
  playlist: PlaylistWithTrackStatus;
  track: Track;
  onAdd: () => void;
  isSubmitting: boolean;
  index: number;
  variants: {
    hidden: { opacity: number; y: number };
    visible: (i: number) => { opacity: number; y: number; transition: object };
  };
}

function PlaylistItem({
  playlist,
  track,
  onAdd,
  isSubmitting,
  index,
  variants,
}: PlaylistItemProps) {
  return (
    <motion.button
      custom={index}
      variants={variants}
      onClick={() => {
        if (!playlist.hasTrack && !isSubmitting) {
          hapticLight();
          onAdd();
        }
      }}
      disabled={playlist.hasTrack || isSubmitting}
      className={`group relative w-full rounded-lg px-3 py-3 text-left transition-all ${
        playlist.hasTrack
          ? "cursor-default opacity-50"
          : "hover:bg-[rgba(244,178,102,0.08)] active:scale-[0.98]"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Playlist icon */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[rgba(244,178,102,0.1)]">
          <Music className="h-6 w-6 text-[var(--color-accent)]" />
        </div>

        {/* Playlist info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">
              {playlist.name}
            </h3>
            {playlist.isPublic && (
              <Globe className="h-3 w-3 flex-shrink-0 text-[var(--color-muted)]" />
            )}
          </div>
          <p className="text-xs text-[var(--color-subtext)]">
            {playlist.trackCount} track{playlist.trackCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex-shrink-0">
          {isSubmitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[rgba(244,178,102,0.2)] border-t-[var(--color-accent)]" />
          ) : playlist.hasTrack ? (
            <Check className="h-5 w-5 text-[var(--color-success)]" />
          ) : (
            <Plus className="h-5 w-5 text-[var(--color-muted)] group-hover:text-[var(--color-accent)]" />
          )}
        </div>
      </div>
    </motion.button>
  );
}

// Empty state component
interface EmptyStateProps {
  hasSearchQuery: boolean;
  onClose: () => void;
}

function EmptyState({ hasSearchQuery, onClose }: EmptyStateProps) {
  if (hasSearchQuery) {
    return (
      <div className="flex flex-col items-center py-12">
        <Search className="mb-3 h-12 w-12 text-[var(--color-muted)]" />
        <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
          No playlists found
        </p>
        <p className="text-xs text-[var(--color-subtext)]">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-12">
      <Music className="mb-3 h-12 w-12 text-[var(--color-muted)]" />
      <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
        No playlists yet
      </p>
      <p className="mb-4 text-xs text-[var(--color-subtext)]">
        Create your first playlist to get started
      </p>
      <Link
        href="/playlists"
        onClick={() => {
          hapticLight();
          onClose();
        }}
        className="rounded-lg bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[rgba(244,178,102,0.3)] transition-all hover:scale-105 active:scale-95"
      >
        Create Playlist
      </Link>
    </div>
  );
}

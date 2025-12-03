// File: src/app/playlists/page.tsx

"use client";

import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingSpinner";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/trpc/react";
import type { PlaylistWithTracks } from "@/types";
import { Music, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PlaylistsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const { data: playlists, isLoading } = api.music.getPlaylists.useQuery(
    undefined,
    { enabled: !!session },
  );

  const utils = api.useUtils();
  const createPlaylist = api.music.createPlaylist.useMutation({
    onSuccess: async (playlist) => {
      await utils.music.getPlaylists.invalidate();
      if (playlist) {
        showToast(`Created playlist "${playlist.name}"`, "success");
        setShowCreateModal(false);
        setNewPlaylistName("");
        setNewPlaylistDescription("");
        setIsPublic(false);
        router.push(`/playlists/${playlist.id}`);
      }
    },
    onError: (error) => {
      showToast(`Failed to create playlist: ${error.message}`, "error");
    },
  });

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      showToast("Please enter a playlist name", "error");
      return;
    }

    createPlaylist.mutate({
      name: newPlaylistName.trim(),
      description: newPlaylistDescription.trim() || undefined,
      isPublic,
    });
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-[var(--color-subtext)]">
            Please sign in to view your playlists
          </p>
          <Link href="/api/auth/signin" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col px-3 py-4 md:px-6 md:py-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)] md:text-3xl">
          Your Playlists
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary touch-target-lg flex w-full items-center justify-center gap-2 md:w-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Playlists Grid */}
      {isLoading ? (
        <LoadingState message="Loading your playlists..." />
      ) : playlists && playlists.length > 0 ? (
        <div className="fade-in grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {playlists.map((playlist: PlaylistWithTracks) => (
            <Link
              key={playlist.id}
              href={`/playlists/${playlist.id}`}
              className="surface-panel touch-active group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-[linear-gradient(135deg,rgba(244,178,102,0.28),rgba(88,198,177,0.22))]">
                {playlist.tracks && playlist.tracks.length > 0 ? (
                  <div className="grid h-full grid-cols-2 grid-rows-2 gap-0.5">
                    {playlist.tracks.slice(0, 4).map((playlistTrack, idx) => (
                      <div
                        key={idx}
                        className="relative h-full w-full overflow-hidden rounded-[0.65rem] bg-[rgba(12,18,27,0.9)]"
                      >
                        <Image
                          src={
                            playlistTrack.track?.album?.cover_medium ?? "/placeholder.png"
                          }
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--color-text)]/60">
                    <Music className="h-12 w-12 md:h-16 md:w-16" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/35 opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="p-3 md:p-4">
                <h3 className="mb-1 truncate text-base font-semibold text-[var(--color-text)] md:text-lg">
                  {playlist.name}
                </h3>
                {playlist.description && (
                  <p className="mb-2 line-clamp-2 text-xs text-[var(--color-subtext)] md:text-sm">
                    {playlist.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                  <span>
                    {playlist.tracks?.length ?? 0} track
                    {(playlist.tracks?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                  <span
                    className={
                      playlist.isPublic
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-subtext)]"
                    }
                  >
                    • {playlist.isPublic ? "Public" : "Private"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Music className="h-12 w-12 md:h-16 md:w-16" />}
          title="No playlists yet"
          description="Create your first playlist to organize your favorite tracks"
          action={
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary touch-target-lg flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Playlist</span>
            </button>
          }
        />
      )}

      {/* Create Playlist Modal - Mobile Optimized */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowCreateModal(false);
              setNewPlaylistName("");
              setNewPlaylistDescription("");
              setIsPublic(false);
            }}
          />
          <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 md:left-1/2 md:right-auto md:-translate-x-1/2">
            <div className="surface-panel slide-in-up w-full max-w-md p-4 md:p-6">
              <h2 className="mb-4 text-xl font-bold text-[var(--color-text)] md:text-2xl">
                Create Playlist
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="form-label">
                    Playlist Name *
                  </label>
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="My Awesome Playlist"
                    className="input-text"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="form-label">
                    Description (optional)
                  </label>
                  <textarea
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows={3}
                    className="input-text resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="touch-target h-5 w-5 rounded border-[rgba(244,178,102,0.25)] bg-[rgba(16,22,31,0.85)] text-[var(--color-accent)] focus:ring-2 focus:ring-[rgba(244,178,102,0.25)]"
                  />
                  <label htmlFor="isPublic" className="text-sm text-[var(--color-subtext)]">
                    Make this playlist public
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 md:flex-row md:gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPlaylistName("");
                    setNewPlaylistDescription("");
                    setIsPublic(false);
                  }}
                  className="btn-secondary touch-target-lg flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlaylist}
                  disabled={createPlaylist.isPending || !newPlaylistName.trim()}
                  className="btn-primary touch-target-lg flex-1"
                >
                  {createPlaylist.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

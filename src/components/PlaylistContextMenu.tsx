// File: src/components/PlaylistContextMenu.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Plus,
  Share2,
  Edit3,
  Trash2,
  Copy,
  Lock,
  Unlock,
  ListPlus,
  GitMerge,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { usePlaylistContextMenu } from "@/contexts/PlaylistContextMenuContext";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/contexts/ToastContext";
import { useWebShare } from "@/hooks/useWebShare";
import { api } from "@/trpc/react";
import type { PlaylistWithTracks } from "@/types";
import { hapticLight, hapticMedium, hapticSuccess } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";

export function PlaylistContextMenu() {
  const { playlist, position, closeMenu } = usePlaylistContextMenu();
  const player = useGlobalPlayer();
  const { showToast } = useToast();
  const { share, isSupported: isShareSupported } = useWebShare();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const utils = api.useUtils();

  const deletePlaylist = api.music.deletePlaylist.useMutation({
    onSuccess: async () => {
      showToast(`Deleted playlist "${playlist?.name}"`, "success");
      await utils.music.getPlaylists.invalidate();
      closeMenu();
    },
    onError: (error) => {
      showToast(`Failed to delete playlist: ${error.message}`, "error");
    },
  });

  const updateVisibility = api.music.updatePlaylistVisibility.useMutation({
    onSuccess: async (data) => {
      showToast(
        `Playlist is now ${data.isPublic ? "public" : "private"}`,
        "success",
      );
      await utils.music.getPlaylists.invalidate();
      closeMenu();
    },
    onError: (error) => {
      showToast(`Failed to update visibility: ${error.message}`, "error");
    },
  });

  const duplicatePlaylist = api.music.createPlaylist.useMutation({
    onSuccess: async (newPlaylist) => {
      if (!playlist) return;

      if (playlist.tracks && playlist.tracks.length > 0) {
        await Promise.all(
          playlist.tracks.map((pt) =>
            utils.music.addToPlaylist.mutate({
              playlistId: newPlaylist.id,
              track: pt.track,
            }),
          ),
        );
      }

      showToast(`Duplicated "${playlist.name}" successfully`, "success");
      await utils.music.getPlaylists.invalidate();
      closeMenu();
    },
    onError: (error) => {
      showToast(`Failed to duplicate playlist: ${error.message}`, "error");
    },
  });

  useEffect(() => {
    if (!playlist) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [playlist, closeMenu]);

  useEffect(() => {
    if (!menuRef.current || !position) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let { x, y } = position;

    if (x + rect.width > viewport.width) {
      x = viewport.width - rect.width - 16;
    }
    if (x < 16) x = 16;

    if (y + rect.height > viewport.height) {
      y = viewport.height - rect.height - 16;
    }
    if (y < 16) y = 16;

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }, [position]);

  const handlePlayAll = async () => {
    if (!playlist) return;

    hapticMedium();

    try {
      const fullPlaylist = await utils.music.getPlaylist.fetch({ id: playlist.id });

      if (!fullPlaylist.tracks || fullPlaylist.tracks.length === 0) {
        showToast("This playlist has no tracks", "info");
        closeMenu();
        return;
      }

      const sortedTracks = [...fullPlaylist.tracks].sort((a, b) => a.position - b.position);
      const [first, ...rest] = sortedTracks.map((pt) => pt.track);

      if (first) {
        player.clearQueue();
        player.play(first);
        if (rest.length > 0) {
          player.addToQueue(rest);
        }
        showToast(`Playing "${fullPlaylist.name}" (${sortedTracks.length} tracks)`, "success");
      }
    } catch (error) {
      console.error("Failed to fetch full playlist:", error);
      showToast("Failed to load playlist tracks", "error");
    }

    closeMenu();
  };

  const handleAddAllToQueue = async () => {
    if (!playlist) return;

    hapticLight();

    try {
      const fullPlaylist = await utils.music.getPlaylist.fetch({ id: playlist.id });

      if (!fullPlaylist.tracks || fullPlaylist.tracks.length === 0) {
        showToast("This playlist has no tracks", "info");
        closeMenu();
        return;
      }

      const sortedTracks = [...fullPlaylist.tracks]
        .sort((a, b) => a.position - b.position)
        .map((pt) => pt.track);

      player.addToQueue(sortedTracks);
      showToast(`Added ${sortedTracks.length} tracks to queue`, "success");
    } catch (error) {
      console.error("Failed to fetch full playlist:", error);
      showToast("Failed to load playlist tracks", "error");
    }

    closeMenu();
  };

  const handleMergePlaylist = () => {
    hapticLight();
    setShowMergeModal(true);

  };

  const handleShare = async () => {
    if (!playlist) return;

    if (!playlist.isPublic) {
      showToast("Only public playlists can be shared", "info");
      closeMenu();
      return;
    }

    hapticLight();
    const url = `${window.location.origin}/playlists/${playlist.id}`;

    const success = await share({
      title: `${playlist.name} - darkfloor.art`,
      text: `Check out this playlist: ${playlist.name}${playlist.description ? ` - ${playlist.description}` : ""}`,
      url,
    });

    if (success) {
      showToast("Playlist shared successfully!", "success");
    } else {

      try {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard!", "success");
      } catch {
        showToast("Failed to share playlist", "error");
      }
    }
    closeMenu();
  };

  const handleEdit = () => {
    if (!playlist) return;
    hapticLight();
    router.push(`/playlists/${playlist.id}`);
    closeMenu();
  };

  const handleToggleVisibility = () => {
    if (!playlist) return;
    hapticMedium();
    updateVisibility.mutate({
      id: playlist.id,
      isPublic: !playlist.isPublic,
    });
  };

  const handleDelete = () => {
    if (!playlist) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${playlist.name}"? This cannot be undone.`,
    );

    if (confirmed) {
      hapticMedium();
      deletePlaylist.mutate({ id: playlist.id });
    } else {
      closeMenu();
    }
  };

  const handleDuplicate = () => {
    if (!playlist) return;

    hapticLight();
    duplicatePlaylist.mutate({
      name: `${playlist.name} (Copy)`,
      description: playlist.description ?? undefined,
      isPublic: false,
    });
  };

  if (!playlist || !position) return null;

  return (
    <>
      <AnimatePresence>
        {playlist && position && (
          <>
            {}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={springPresets.gentle}
              className="fixed inset-0 z-[70] bg-black/20"
              onClick={closeMenu}
            />

            {}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={springPresets.snappy}
              className="fixed z-[71] flex items-center gap-1 rounded-xl border border-[rgba(244,178,102,0.2)] bg-[rgba(10,16,24,0.98)] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl"
              style={{
                left: position.x,
                top: position.y,
              }}
            >
              {}
              <button
                onClick={handlePlayAll}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title="Play all tracks"
                disabled={!playlist.tracks || playlist.tracks.length === 0}
              >
                <Play className="h-5 w-5 text-[var(--color-accent)] transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  Play
                </span>
              </button>

              {}
              <button
                onClick={handleAddAllToQueue}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title="Add all to queue"
                disabled={!playlist.tracks || playlist.tracks.length === 0}
              >
                <Plus className="h-5 w-5 text-[var(--color-subtext)] transition-all group-hover:scale-110 group-hover:text-[var(--color-accent)]" />
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  Queue
                </span>
              </button>

              {}
              <div className="h-10 w-px bg-[rgba(244,178,102,0.15)]" />

              {}
              <button
                onClick={handleMergePlaylist}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title="Merge with another playlist"
              >
                <GitMerge className="h-5 w-5 text-[var(--color-subtext)] transition-all group-hover:scale-110 group-hover:text-[var(--color-accent)]" />
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  Merge
                </span>
              </button>

              {}
              <button
                onClick={handleShare}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title={playlist.isPublic ? "Share playlist" : "Only public playlists can be shared"}
                disabled={!playlist.isPublic && !isShareSupported}
              >
                <Share2 className={`h-5 w-5 transition-all group-hover:scale-110 ${
                  playlist.isPublic
                    ? "text-[var(--color-subtext)] group-hover:text-[var(--color-accent)]"
                    : "text-[var(--color-muted)]"
                }`} />
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  Share
                </span>
              </button>

              {}
              <div className="h-10 w-px bg-[rgba(244,178,102,0.15)]" />

              {}
              <button
                onClick={handleEdit}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title="Edit playlist"
              >
                <Edit3 className="h-5 w-5 text-[var(--color-subtext)] transition-all group-hover:scale-110 group-hover:text-[var(--color-accent)]" />
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  Edit
                </span>
              </button>

              {}
              <button
                onClick={handleToggleVisibility}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title={playlist.isPublic ? "Make private" : "Make public"}
                disabled={updateVisibility.isPending}
              >
                {playlist.isPublic ? (
                  <Unlock className="h-5 w-5 text-[var(--color-accent)] transition-all group-hover:scale-110" />
                ) : (
                  <Lock className="h-5 w-5 text-[var(--color-subtext)] transition-all group-hover:scale-110 group-hover:text-[var(--color-accent)]" />
                )}
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  {playlist.isPublic ? "Public" : "Private"}
                </span>
              </button>

              {}
              <button
                onClick={handleDuplicate}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title="Duplicate playlist"
                disabled={duplicatePlaylist.isPending}
              >
                <Copy className="h-5 w-5 text-[var(--color-subtext)] transition-all group-hover:scale-110 group-hover:text-[var(--color-accent)]" />
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  Copy
                </span>
              </button>

              {}
              <div className="h-10 w-px bg-[rgba(244,178,102,0.15)]" />

              {}
              <button
                onClick={handleDelete}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] hover:bg-red-500/10 active:scale-95"
                title="Delete playlist"
                disabled={deletePlaylist.isPending}
              >
                <Trash2 className="h-5 w-5 text-[var(--color-danger)] transition-all group-hover:scale-110" />
                <span className="text-[10px] font-medium text-[var(--color-danger)] group-hover:text-red-400">
                  Delete
                </span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {}
      {showMergeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="surface-panel max-w-md p-6">
            <h3 className="mb-4 text-xl font-bold text-[var(--color-text)]">
              Merge Playlists
            </h3>
            <p className="mb-4 text-sm text-[var(--color-subtext)]">
              Merge functionality coming soon! This will allow you to combine tracks from
              multiple playlists.
            </p>
            <button
              onClick={() => {
                setShowMergeModal(false);
                closeMenu();
              }}
              className="btn-primary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// File: src/components/TrackContextMenu.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  ListPlus,
  Play,
  Plus,
  Share2,
  User,
  Disc3,
  SkipForward,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { useTrackContextMenu } from "@/contexts/TrackContextMenuContext";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/contexts/ToastContext";
import { useWebShare } from "@/hooks/useWebShare";
import { api } from "@/trpc/react";
import { hapticLight, hapticMedium, hapticSuccess } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import { AddToPlaylistModal } from "./AddToPlaylistModal";

export function TrackContextMenu() {
  const { track, position, excludePlaylistId, closeMenu } =
    useTrackContextMenu();
  const player = useGlobalPlayer();
  const { showToast } = useToast();
  const { share, isSupported: isShareSupported } = useWebShare();
  const { data: session } = useSession();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const utils = api.useUtils();

  const { data: favoriteData } = api.music.isFavorite.useQuery(
    { trackId: track?.id ?? 0 },
    { enabled: !!track && !!session },
  );

  const addFavorite = api.music.addFavorite.useMutation({
    onSuccess: async () => {
      if (!track) return;
      await utils.music.isFavorite.invalidate({ trackId: track.id });
      await utils.music.getFavorites.invalidate();
      showToast(`Added "${track.title}" to favorites`, "success");
    },
    onError: (error) => {
      showToast(`Failed to add to favorites: ${error.message}`, "error");
    },
  });

  const removeFavorite = api.music.removeFavorite.useMutation({
    onSuccess: async () => {
      if (!track) return;
      await utils.music.isFavorite.invalidate({ trackId: track.id });
      await utils.music.getFavorites.invalidate();
      showToast(`Removed "${track.title}" from favorites`, "info");
    },
    onError: (error) => {
      showToast(`Failed to remove from favorites: ${error.message}`, "error");
    },
  });

  useEffect(() => {
    if (!track) return;

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
  }, [track, closeMenu]);

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

    if (y + rect.height > viewport.height) {
      y = viewport.height - rect.height - 16;
    }

    if (x < 16) {
      x = 16;
    }

    if (y < 16) {
      y = 16;
    }

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }, [position]);

  const handlePlay = () => {
    if (!track) return;
    hapticMedium();
    player.play(track);
    closeMenu();
  };

  const handleAddToQueue = () => {
    if (!track) return;
    hapticLight();
    player.addToQueue(track);
    showToast(`Added "${track.title}" to queue`, "success");
    closeMenu();
  };

  const handleAddToPlayNext = () => {
    if (!track) return;
    hapticLight();
    player.addToPlayNext(track);
    showToast(`"${track.title}" will play next`, "success");
    closeMenu();
  };

  const handleToggleFavorite = () => {
    if (!track) return;

    if (favoriteData?.isFavorite) {
      hapticLight();
      removeFavorite.mutate({ trackId: track.id });
    } else {
      hapticSuccess();
      addFavorite.mutate({ track });
    }
    closeMenu();
  };

  const handleAddToPlaylist = () => {
    hapticLight();
    setShowAddToPlaylistModal(true);
    closeMenu();
  };

  const handleShare = async () => {
    if (!track) return;
    hapticLight();

    const success = await share({
      title: `${track.title} - ${track.artist.name}`,
      text: `Check out "${track.title}" by ${track.artist.name} on darkfloor.art!`,
      url: window.location.href,
    });

    if (success) {
      showToast("Track shared successfully!", "success");
    }
    closeMenu();
  };

  const handleGoToArtist = () => {
    if (!track) return;
    hapticLight();
    window.location.href = `/artist/${track.artist.id}`;
    closeMenu();
  };

  const handleGoToAlbum = () => {
    if (!track) return;
    hapticLight();
    window.location.href = `/album/${track.album.id}`;
    closeMenu();
  };

  if (!track || !position) return null;

  return (
    <>
      <AnimatePresence>
        {track && position && (
          <>
            {}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={springPresets.gentle}
              className="fixed inset-0 z-[102] bg-black/20"
              onClick={closeMenu}
            />

            {}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={springPresets.snappy}
              className="fixed z-[103] flex items-center gap-1 rounded-xl border border-[rgba(244,178,102,0.2)] bg-[rgba(10,16,24,0.98)] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl"
              style={{
                left: position.x,
                top: position.y,
              }}
            >
              {}
              <button
                onClick={handlePlay}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title="Play now"
              >
                <Play className="h-5 w-5 text-[var(--color-accent)] transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  Play
                </span>
              </button>

              {}
              <div className="h-10 w-px bg-[rgba(244,178,102,0.15)]" />

              {}
              <button
                onClick={handleAddToQueue}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title="Add to queue"
              >
                <Plus className="h-5 w-5 text-[var(--color-subtext)] transition-all group-hover:scale-110 group-hover:text-[var(--color-accent)]" />
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  Queue
                </span>
              </button>

              {}
              <button
                onClick={handleAddToPlayNext}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title="Play next"
              >
                <SkipForward className="h-5 w-5 text-[var(--color-subtext)] transition-all group-hover:scale-110 group-hover:text-[var(--color-accent)]" />
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  Next
                </span>
              </button>

              {}
              <div className="h-10 w-px bg-[rgba(244,178,102,0.15)]" />

              {}
              {session && (
                <button
                  onClick={handleToggleFavorite}
                  className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                  title={
                    favoriteData?.isFavorite
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                  disabled={addFavorite.isPending || removeFavorite.isPending}
                >
                  <Heart
                    className={`h-5 w-5 transition-all group-hover:scale-110 ${
                      favoriteData?.isFavorite
                        ? "fill-[var(--color-danger)] text-[var(--color-danger)]"
                        : "text-[var(--color-subtext)] group-hover:text-[var(--color-accent)]"
                    }`}
                  />
                  <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                    {favoriteData?.isFavorite ? "Saved" : "Save"}
                  </span>
                </button>
              )}

              {}
              {session && (
                <button
                  onClick={handleAddToPlaylist}
                  className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                  title="Add to playlist"
                >
                  <ListPlus className="h-5 w-5 text-[var(--color-subtext)] transition-all group-hover:scale-110 group-hover:text-[var(--color-accent)]" />
                  <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                    Playlist
                  </span>
                </button>
              )}

              {}
              {(session ?? isShareSupported) && (
                <div className="h-10 w-px bg-[rgba(244,178,102,0.15)]" />
              )}

              {}
              {isShareSupported && (
                <button
                  onClick={handleShare}
                  className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                  title="Share track"
                >
                  <Share2 className="h-5 w-5 text-[var(--color-subtext)] transition-all group-hover:scale-110 group-hover:text-[var(--color-accent)]" />
                  <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                    Share
                  </span>
                </button>
              )}

              {}
              <div className="h-10 w-px bg-[rgba(244,178,102,0.15)]" />

              {}
              <button
                onClick={handleGoToArtist}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title="Go to artist"
              >
                <User className="h-5 w-5 text-[var(--color-subtext)] transition-all group-hover:scale-110 group-hover:text-[var(--color-accent)]" />
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  Artist
                </span>
              </button>

              {}
              <button
                onClick={handleGoToAlbum}
                className="group flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-[rgba(244,178,102,0.15)] active:scale-95"
                title="Go to album"
              >
                <Disc3 className="h-5 w-5 text-[var(--color-subtext)] transition-all group-hover:scale-110 group-hover:text-[var(--color-accent)]" />
                <span className="text-[10px] font-medium text-[var(--color-subtext)] group-hover:text-[var(--color-text)]">
                  Album
                </span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {}
      {track && (
        <AddToPlaylistModal
          isOpen={showAddToPlaylistModal}
          onClose={() => setShowAddToPlaylistModal(false)}
          track={track}
          excludePlaylistId={excludePlaylistId}
        />
      )}
    </>
  );
}

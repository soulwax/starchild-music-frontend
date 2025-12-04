// File: src/components/Queue.tsx

import type { QueueItem } from "@/types";
import { Trash2, X } from "lucide-react";
import Image from "next/image";

// Helper function to format duration in seconds to mm:ss
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

interface QueueProps {
  queue: QueueItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function Queue({ queue, onClose, onRemove, onClear }: QueueProps) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 p-4">
        <h2 className="text-xl font-bold text-white">Queue ({queue.length})</h2>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={onClear}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              aria-label="Clear queue"
              title="Clear queue"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-800"
            aria-label="Close queue"
          >
            <X className="h-6 w-6 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-500">
            <div className="mb-4 text-6xl">🎵</div>
            <p className="mb-2 text-lg font-medium">Queue is empty</p>
            <p className="text-sm">Add tracks to start building your queue</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {queue.map((item, index) => {
              const coverImage =
                item.track.album.cover_small ?? item.track.album.cover;

              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 p-3 transition-colors hover:bg-gray-800"
                >
                  {/* Position */}
                  <div className="w-6 flex-shrink-0 text-center text-sm text-gray-500">
                    {index + 1}
                  </div>

                  {/* Album Cover */}
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-800">
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={item.track.album.title}
                        fill
                        sizes="(max-width: 768px) 48px, 64px"
                        className="object-cover"
                        quality={75}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-500">
                        🎵
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-white">
                      {item.track.title}
                    </h4>
                    <p className="truncate text-xs text-gray-400">
                      {item.track.artist.name}
                    </p>
                  </div>

                  {/* Duration */}
                  <span className="flex-shrink-0 text-xs text-gray-500 tabular-nums">
                    {formatDuration(item.track.duration)}
                  </span>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemove(item.id)}
                    className="flex-shrink-0 rounded p-1.5 opacity-0 transition-colors group-hover:opacity-100 hover:bg-gray-700"
                    aria-label="Remove from queue"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with total duration */}
      {queue.length > 0 && (
        <div className="border-t border-gray-800 p-4 text-sm text-gray-400">
          Total duration:{" "}
          {formatDuration(
            queue.reduce((acc, item) => acc + item.track.duration, 0),
          )}
        </div>
      )}
    </div>
  );
}

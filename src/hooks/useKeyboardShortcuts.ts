// File: src/hooks/useKeyboardShortcuts.ts

"use client";

import { useEffect } from "react";

interface KeyboardShortcutHandlers {
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMute?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
  onToggleVisualizer?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    // Handle Electron media keys
    if (typeof window !== "undefined" && window.electron) {
      const handleMediaKey = (key: string) => {
        switch (key) {
          case "play-pause":
            handlers.onPlayPause?.();
            break;
          case "next":
            handlers.onNext?.();
            break;
          case "previous":
            handlers.onPrevious?.();
            break;
        }
      };

      window.electron.onMediaKey(handleMediaKey);

      return () => {
        window.electron?.removeMediaKeyListener();
      };
    }
  }, [handlers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Space - Play/Pause
      if (e.code === "Space") {
        e.preventDefault();
        handlers.onPlayPause?.();
        return;
      }

      // Arrow Right - Next track or seek forward
      if (e.code === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onNext?.();
        } else {
          handlers.onSeekForward?.();
        }
        return;
      }

      // Arrow Left - Previous track or seek backward
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onPrevious?.();
        } else {
          handlers.onSeekBackward?.();
        }
        return;
      }

      // Arrow Up - Volume up
      if (e.code === "ArrowUp") {
        e.preventDefault();
        handlers.onVolumeUp?.();
        return;
      }

      // Arrow Down - Volume down
      if (e.code === "ArrowDown") {
        e.preventDefault();
        handlers.onVolumeDown?.();
        return;
      }

      // M - Mute/Unmute
      if (e.code === "KeyM") {
        e.preventDefault();
        handlers.onMute?.();
        return;
      }

      // S - Toggle shuffle
      if (e.code === "KeyS") {
        e.preventDefault();
        handlers.onToggleShuffle?.();
        return;
      }

      // R - Toggle repeat
      if (e.code === "KeyR") {
        e.preventDefault();
        handlers.onToggleRepeat?.();
        return;
      }

      // V - Toggle visualizer
      if (e.code === "KeyV") {
        e.preventDefault();
        handlers.onToggleVisualizer?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}

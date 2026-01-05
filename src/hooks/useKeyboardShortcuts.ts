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

      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handlers.onPlayPause?.();
        return;
      }

      if (e.code === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onNext?.();
        } else {
          handlers.onSeekForward?.();
        }
        return;
      }

      if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onPrevious?.();
        } else {
          handlers.onSeekBackward?.();
        }
        return;
      }

      if (e.code === "ArrowUp") {
        e.preventDefault();
        handlers.onVolumeUp?.();
        return;
      }

      if (e.code === "ArrowDown") {
        e.preventDefault();
        handlers.onVolumeDown?.();
        return;
      }

      if (e.code === "KeyM") {
        e.preventDefault();
        handlers.onMute?.();
        return;
      }

      if (e.code === "KeyS") {
        e.preventDefault();
        handlers.onToggleShuffle?.();
        return;
      }

      if (e.code === "KeyR") {
        e.preventDefault();
        handlers.onToggleRepeat?.();
        return;
      }

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

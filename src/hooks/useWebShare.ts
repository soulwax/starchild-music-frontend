// File: src/hooks/useWebShare.ts

import { useState, useCallback } from "react";

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

interface UseWebShareResult {
  share: (data: ShareData) => Promise<boolean>;
  isSupported: boolean;
  isSharing: boolean;
  error: string | null;
}

export function useWebShare(): UseWebShareResult {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Web Share API is supported
  const isSupported = typeof navigator !== "undefined" && "share" in navigator;

  const share = useCallback(
    async (data: ShareData): Promise<boolean> => {
      // Reset error state
      setError(null);

      if (!isSupported) {
        setError("Web Share API is not supported in this browser");
        return false;
      }

      try {
        setIsSharing(true);

        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });

        setIsSharing(false);
        return true;
      } catch (err) {
        setIsSharing(false);

        // User cancelled the share - not really an error
        if (err instanceof Error && err.name === "AbortError") {
          return false;
        }

        // Actual error
        const errorMessage =
          err instanceof Error ? err.message : "Failed to share";
        setError(errorMessage);
        console.error("Error sharing:", err);
        return false;
      }
    },
    [isSupported],
  );

  return {
    share,
    isSupported,
    isSharing,
    error,
  };
}

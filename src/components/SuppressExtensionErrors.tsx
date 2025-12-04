// File: src/components/SuppressExtensionErrors.tsx

"use client";

import { useEffect } from "react";

/**
 * Suppresses harmless Chrome extension errors that occur when extensions
 * try to communicate with the page but the page context is destroyed
 * before the promise resolves (e.g., during track switching).
 *
 * This is a known issue with Chrome extensions and doesn't affect functionality.
 */
export default function SuppressExtensionErrors() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalError = console.error;
    console.error = function (...args: unknown[]) {
      // Suppress Chrome extension message errors
      const firstArg = args[0];
      if (
        typeof firstArg === "string" &&
        firstArg.includes(
          "Promised response from onMessage listener went out of scope",
        )
      ) {
        return; // Suppress this specific error
      }
      originalError.apply(console, args);
    };

    // Cleanup on unmount
    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}

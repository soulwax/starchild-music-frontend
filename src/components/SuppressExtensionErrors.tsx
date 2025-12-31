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

    // Store the original console.error function
    const originalError = console.error;
    
    // Ensure originalError is actually a function
    if (typeof originalError !== "function") {
      return;
    }

    // Create a bound version of the original function to preserve context
    const boundOriginalError = originalError.bind(console);

    console.error = function (...args: unknown[]) {
      try {
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
        
        // Call original error handler with proper context
        // Use bound function to ensure 'this' context is correct
        boundOriginalError(...args);
      } catch (error) {
        // If our wrapper fails, try to call the original directly
        // This should never happen, but provides a safety net
        try {
          // Use Function.prototype.apply with console as context
          Function.prototype.apply.call(originalError, console, args);
        } catch {
          // If all else fails, silently ignore to prevent infinite loops
          // This should be extremely rare
        }
      }
    };

    // Cleanup on unmount
    return () => {
      // Restore original console.error
      if (typeof originalError === "function") {
        console.error = originalError;
      }
    };
  }, []);

  return null;
}

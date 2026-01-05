// File: src/components/SuppressExtensionErrors.tsx

"use client";

import { useEffect } from "react";

export default function SuppressExtensionErrors() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalError = console.error;

    if (typeof originalError !== "function") {
      return;
    }

    const boundOriginalError = originalError.bind(console);

    console.error = function (...args: unknown[]) {
      try {

        const firstArg = args[0];
        if (
          typeof firstArg === "string" &&
          firstArg.includes(
            "Promised response from onMessage listener went out of scope",
          )
        ) {
          return;
        }

        boundOriginalError(...args);
      } catch (error) {

        try {

          Function.prototype.apply.call(originalError, console, args);
        } catch {

        }
      }
    };

    return () => {

      if (typeof originalError === "function") {
        console.error = originalError;
      }
    };
  }, []);

  return null;
}

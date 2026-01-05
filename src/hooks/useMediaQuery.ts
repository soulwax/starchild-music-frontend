// File: src/hooks/useMediaQuery.ts

"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {

    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {

      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1025px)");
}

export function useIsMobileOrTablet(): boolean {
  return useMediaQuery("(max-width: 1024px)");
}

export function useIsLandscape(): boolean {
  return useMediaQuery("(orientation: landscape)");
}

export function useIsPortrait(): boolean {
  return useMediaQuery("(orientation: portrait)");
}

export function useBreakpoint(): "mobile" | "tablet" | "desktop" {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
}

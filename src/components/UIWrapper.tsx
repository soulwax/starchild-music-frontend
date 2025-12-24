// File: src/components/UIWrapper.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { type ReactNode } from "react";

interface UIWrapperProps {
  children: ReactNode;
}

export function UIWrapper({ children }: UIWrapperProps) {
  const { hideUI } = useGlobalPlayer();
  const isMobile = useIsMobile();

  // Only hide UI on desktop when hideUI is true
  if (!isMobile && hideUI) {
    return null;
  }

  return <>{children}</>;
}

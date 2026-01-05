// File: src/components/DynamicTitle.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useEffect, useState } from "react";

export function DynamicTitle() {
  const { currentTrack, isPlaying } = useGlobalPlayer();
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(!!window.electron?.isElectron);
  }, []);

  useEffect(() => {
    if (currentTrack && isPlaying && typeof currentTrack === 'object' && 'artist' in currentTrack && 'title' in currentTrack) {

      const track = currentTrack as { artist: unknown; title: unknown };
      const artistObj = track.artist;
      const artist = typeof artistObj === 'object' && artistObj !== null && 'name' in artistObj
        ? String((artistObj as { name: unknown }).name)
        : "Unknown Artist";
      const title = typeof track.title === 'string' ? track.title : "Unknown Track";
      document.title = `${artist} - ${title}`;
    } else {

      document.title = isElectron ? "Starchild" : "darkfloor.art";
    }
  }, [currentTrack, isPlaying, isElectron]);

  return null;
}

// File: src/hooks/useEqualizer.ts

"use client";

import { STORAGE_KEYS } from "@/config/storage";
import { localStorage as storage } from "@/services/storage";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface EqualizerBand {
  frequency: number;
  gain: number;
  type: BiquadFilterType;
  Q?: number;
}

export interface EqualizerPreset {
  name: string;
  bands: number[];
}

const DEFAULT_BANDS: EqualizerBand[] = [
  { frequency: 60, gain: 0, type: "lowshelf" },
  { frequency: 170, gain: 0, type: "peaking", Q: 1 },
  { frequency: 310, gain: 0, type: "peaking", Q: 1 },
  { frequency: 600, gain: 0, type: "peaking", Q: 1 },
  { frequency: 1000, gain: 0, type: "peaking", Q: 1 },
  { frequency: 3000, gain: 0, type: "peaking", Q: 1 },
  { frequency: 6000, gain: 0, type: "peaking", Q: 1 },
  { frequency: 12000, gain: 0, type: "peaking", Q: 1 },
  { frequency: 14000, gain: 0, type: "highshelf" },
];

const PRESETS: EqualizerPreset[] = [
  { name: "Flat", bands: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "Rock", bands: [5, 3, -2, -3, -1, 2, 4, 5, 5] },
  { name: "Pop", bands: [-1, -1, 0, 2, 4, 4, 2, 0, -1] },
  { name: "Jazz", bands: [4, 3, 1, 2, -1, -1, 0, 2, 3] },
  { name: "Classical", bands: [5, 4, 3, 0, -1, -1, 0, 3, 4] },
  { name: "Bass Boost", bands: [8, 6, 4, 2, 0, 0, 0, 0, 0] },
  { name: "Treble Boost", bands: [0, 0, 0, 0, 0, 2, 4, 6, 8] },
  { name: "Vocal", bands: [-2, -3, -2, 1, 3, 3, 2, 1, 0] },
  { name: "Electronic", bands: [5, 4, 1, 0, -2, 2, 1, 2, 5] },
];

export function useEqualizer(audioElement: HTMLAudioElement | null) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const debounceTimerRef = useRef<number | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [bands, setBands] = useState<EqualizerBand[]>(DEFAULT_BANDS);
  const [currentPreset, setCurrentPreset] = useState("Flat");

  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const persistLocalPreferences = useCallback(
    (
      bandsToPersist: EqualizerBand[],
      presetName: string,
      enabledValue: boolean,
    ) => {
      const gains = bandsToPersist.map((band) => band.gain);
      void storage.set(STORAGE_KEYS.EQUALIZER_BANDS, gains);
      void storage.set(STORAGE_KEYS.EQUALIZER_PRESET, presetName);
      void storage.set(STORAGE_KEYS.EQUALIZER_ENABLED, enabledValue);
    },
    [],
  );

  const loadLocalPreferences = useCallback(() => {
    const storedPreset = storage.getOrDefault<string>(
      STORAGE_KEYS.EQUALIZER_PRESET,
      "Flat",
    );
    const preset = PRESETS.find((p) => p.name === storedPreset) ?? PRESETS[0]!;
    const storedBands = storage.getOrDefault<number[]>(
      STORAGE_KEYS.EQUALIZER_BANDS,
      preset.bands,
    );
    const storedEnabled = storage.getOrDefault<boolean>(
      STORAGE_KEYS.EQUALIZER_ENABLED,
      true,
    );

    const mergedBands = DEFAULT_BANDS.map((band, index) => ({
      ...band,
      gain: storedBands[index] ?? preset.bands[index] ?? 0,
    }));

    setBands(mergedBands);
    setCurrentPreset(preset.name);
    setIsEnabled(storedEnabled);
    persistLocalPreferences(mergedBands, preset.name, storedEnabled);
  }, [persistLocalPreferences]);

  // Fetch preferences from server
  const { data: preferences, error: preferencesError } =
    api.equalizer.getPreferences.useQuery(undefined, {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      enabled: isAuthenticated,
    });

  // Mutations for persisting to database
  const updatePreferencesMutation = api.equalizer.updatePreferences.useMutation(
    {
      onError: (error) => {
        console.error("Failed to update equalizer preferences:", error.message);
      },
    },
  );

  const applyPresetMutation = api.equalizer.applyPreset.useMutation({
    onError: (error) => {
      console.error("Failed to apply preset:", error.message);
    },
  });

  // Load saved EQ settings from server
  useEffect(() => {
    if (preferences && isAuthenticated) {
      const nextBands = DEFAULT_BANDS.map((band, index) => ({
        ...band,
        gain: preferences.bands[index] ?? 0,
      }));

      setBands(nextBands);
      setCurrentPreset(preferences.preset);
      setIsEnabled(preferences.enabled);
      persistLocalPreferences(
        nextBands,
        preferences.preset,
        preferences.enabled,
      );
    } else if (preferencesError && isAuthenticated) {
      console.error(
        "Failed to load preferences from server:",
        preferencesError.message,
      );
    }
  }, [preferences, preferencesError, isAuthenticated, persistLocalPreferences]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated && status !== "loading") {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      loadLocalPreferences();
    }
  }, [isAuthenticated, status, loadLocalPreferences]);

  // Initialize equalizer
  const initialize = useCallback(() => {
    if (!audioElement || isInitialized || audioContextRef.current) return;

    try {
      const AudioContext =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof window.AudioContext })
          .webkitAudioContext;

      if (!AudioContext) {
        console.error("Web Audio API is not supported");
        return;
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaElementSource(audioElement);
      sourceRef.current = source;

      // Create filter nodes for each band
      const filters = bands.map((band) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = band.type;
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        if (band.Q) filter.Q.value = band.Q;
        return filter;
      });

      filtersRef.current = filters;

      // Connect nodes: source -> filters -> destination
      source.connect(filters[0]!);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i]!.connect(filters[i + 1]!);
      }
      filters[filters.length - 1]!.connect(audioContext.destination);

      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize equalizer:", error);
    }
  }, [audioElement, isInitialized, bands]);

  // Update a single band (debounced database save)
  const updateBand = useCallback(
    (index: number, gain: number) => {
      if (index < 0 || index >= bands.length) return;

      const updatedBands = bands.map((band, idx) =>
        idx === index ? { ...band, gain } : band,
      );

      // Update state for immediate UI feedback
      setBands(updatedBands);

      // Update filter node immediately
      const filter = filtersRef.current[index];
      if (filter) {
        filter.gain.value = gain;
      }

      // Mark as custom preset
      setCurrentPreset("Custom");
      persistLocalPreferences(updatedBands, "Custom", isEnabled);

      // Debounce the database save (1 second after user stops dragging)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (isAuthenticated) {
        debounceTimerRef.current = window.setTimeout(() => {
          updatePreferencesMutation.mutate({
            bands: updatedBands.map((b) => b.gain),
            preset: "Custom",
            enabled: isEnabled,
          });
        }, 1000);
      } else {
        debounceTimerRef.current = null;
      }
    },
    [
      bands,
      updatePreferencesMutation,
      isEnabled,
      isAuthenticated,
      persistLocalPreferences,
    ],
  );

  // Apply preset and save to database
  const applyPreset = useCallback(
    (presetName: string) => {
      const preset = PRESETS.find((p) => p.name === presetName);
      if (!preset) return;

      const newBands = bands.map((band, index) => ({
        ...band,
        gain: preset.bands[index] ?? 0,
      }));

      setBands(newBands);
      setCurrentPreset(presetName);

      // Update filter nodes immediately
      filtersRef.current.forEach((filter, index) => {
        filter.gain.value = preset.bands[index] ?? 0;
      });

      // Save preset to database
      persistLocalPreferences(newBands, presetName, isEnabled);

      if (isAuthenticated) {
        applyPresetMutation.mutate({
          preset: presetName,
          bands: preset.bands,
        });
        updatePreferencesMutation.mutate({
          bands: newBands.map((b) => b.gain),
          preset: presetName,
          enabled: isEnabled,
        });
      }
    },
    [
      applyPresetMutation,
      bands,
      isEnabled,
      isAuthenticated,
      persistLocalPreferences,
      updatePreferencesMutation,
    ],
  );

  // Reset all bands to 0
  const reset = useCallback(() => {
    applyPreset("Flat");
  }, [applyPreset]);

  // Toggle equalizer on/off and persist to database
  const toggle = useCallback(() => {
    setIsEnabled((prev) => {
      const newState = !prev;

      // Disconnect/reconnect nodes
      if (sourceRef.current && filtersRef.current.length > 0) {
        if (newState) {
          // Re-enable: source -> filters -> destination
          sourceRef.current.disconnect();
          sourceRef.current.connect(filtersRef.current[0]!);
        } else {
          // Disable: source -> destination (bypass filters)
          sourceRef.current.disconnect();
          if (audioContextRef.current) {
            sourceRef.current.connect(audioContextRef.current.destination);
          }
        }
      }

      persistLocalPreferences(bands, currentPreset, newState);

      if (isAuthenticated) {
        updatePreferencesMutation.mutate({
          enabled: newState,
          bands: bands.map((b) => b.gain),
          preset: currentPreset,
        });
      }

      return newState;
    });
  }, [
    updatePreferencesMutation,
    bands,
    currentPreset,
    persistLocalPreferences,
    isAuthenticated,
  ]);

  // Initialize when audio element is available
  useEffect(() => {
    if (audioElement && !isInitialized) {
      const handleInteraction = () => {
        initialize();
        document.removeEventListener("click", handleInteraction);
      };

      document.addEventListener("click", handleInteraction);

      return () => {
        document.removeEventListener("click", handleInteraction);
      };
    }
  }, [audioElement, isInitialized, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      filtersRef.current = [];
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      sourceRef.current = null;
      setIsInitialized(false);
    };
  }, []);

  return {
    isInitialized,
    isEnabled,
    bands,
    currentPreset,
    presets: PRESETS,
    updateBand,
    applyPreset,
    reset,
    toggle,
    initialize,
  };
}

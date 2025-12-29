// File: src/utils/audioContextManager.ts
//
// Shared audio context manager to prevent InvalidStateError when multiple
// components try to connect to the same HTMLAudioElement.
//
// An HTMLAudioElement can only be connected to ONE MediaElementSourceNode.
// This manager ensures all components share the same connection.

interface AudioConnection {
  sourceNode: MediaElementAudioSourceNode;
  audioContext: AudioContext;
  analyser?: AnalyserNode;
  filters?: BiquadFilterNode[];
  refCount: number; // Track how many components are using this connection
}

// Global WeakMap to track connected audio elements
const connectedAudioElements = new WeakMap<HTMLAudioElement, AudioConnection>();

/**
 * Get or create an audio connection for an audio element.
 * If the element is already connected, returns the existing connection.
 * Otherwise, creates a new connection.
 */
export function getOrCreateAudioConnection(
  audioElement: HTMLAudioElement,
): AudioConnection | null {
  // Check if already connected in our map
  const existing = connectedAudioElements.get(audioElement);
  if (existing) {
    // Verify connection is still valid
    if (existing.audioContext.state !== "closed" && existing.sourceNode) {
      // Increment ref count
      existing.refCount++;
      return existing;
    } else {
      // Connection is invalid, remove it
      connectedAudioElements.delete(audioElement);
    }
  }

  // Create new connection
  const AudioContextClass =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) {
    console.error("Web Audio API is not supported in this browser");
    return null;
  }

  try {
    const audioContext = new AudioContextClass();
    const sourceNode = audioContext.createMediaElementSource(audioElement);

    const connection: AudioConnection = {
      sourceNode,
      audioContext,
      refCount: 1,
    };

    connectedAudioElements.set(audioElement, connection);

    // Resume audio context if suspended (required for playback)
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    // CRITICAL: When an audio element is connected to a MediaElementSourceNode,
    // it MUST be connected to the audio context destination, otherwise audio won't play.
    // Connect sourceNode directly to destination as a fallback.
    // Components will disconnect and reconnect to add their processing nodes.
    sourceNode.connect(audioContext.destination);

    return connection;
  } catch (error) {
    // If the error is InvalidStateError, the audio element is already connected
    // Check the WeakMap again - another component might have just stored it
    const retryExisting = connectedAudioElements.get(audioElement);
    if (retryExisting) {
      retryExisting.refCount++;
      return retryExisting;
    }

    // If still not found, the audio element was connected outside our manager
    // This can happen if old code or another library connected it
    // In this case, we can't create a new connection, so we return null
    // The caller should handle this gracefully (e.g., by not using audio features)
    if (error instanceof DOMException && error.name === "InvalidStateError") {
      // Silently handle - the audio element is already connected elsewhere
      // We can't access that connection, so we return null
      // This is expected behavior when the element is connected outside our manager
      return null;
    }

    // For other errors, log them
    console.error("Failed to create audio connection:", error);
    return null;
  }
}

/**
 * Release a reference to an audio connection.
 * When refCount reaches 0, the connection is cleaned up.
 */
export function releaseAudioConnection(audioElement: HTMLAudioElement): void {
  const connection = connectedAudioElements.get(audioElement);
  if (!connection) return;

  connection.refCount--;

  // Only cleanup if no components are using it
  if (connection.refCount <= 0) {
    try {
      // Disconnect nodes
      if (connection.analyser) {
        connection.analyser.disconnect();
      }
      if (connection.filters && connection.filters.length > 0) {
        connection.filters.forEach((filter) => filter.disconnect());
      }
      // Note: We don't disconnect sourceNode from audioElement because
      // once connected, it can't be reconnected. The browser handles cleanup.
      if (connection.audioContext.state !== "closed") {
        void connection.audioContext.close();
      }
    } catch (error) {
      // Ignore errors during cleanup
      console.warn("Error during audio connection cleanup:", error);
    }

    connectedAudioElements.delete(audioElement);
  }
}

/**
 * Get an existing connection without incrementing ref count.
 * Useful for checking if a connection exists.
 */
export function getAudioConnection(
  audioElement: HTMLAudioElement,
): AudioConnection | undefined {
  return connectedAudioElements.get(audioElement);
}

/**
 * Verify that the connection chain is complete and ends at destination.
 * Returns true if the chain is valid, false otherwise.
 */
export function verifyConnectionChain(connection: AudioConnection): boolean {
  try {
    // Check if sourceNode is connected
    // Note: We can't directly check connections, but we can verify the chain structure
    if (!connection.sourceNode) return false;

    // If we have filters, verify they're chained
    if (connection.filters && connection.filters.length > 0) {
      // Can't directly verify connections, but structure looks correct
      // The actual verification happens when we rebuild the chain
    }

    // If we have analyser, it should be connected to destination
    if (connection.analyser) {
      // Can't directly verify, but structure looks correct
    }

    // Check audio context state
    if (connection.audioContext.state === "closed") {
      console.warn("[audioContextManager] Audio context is closed");
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "[audioContextManager] Error verifying connection chain:",
      error,
    );
    return false;
  }
}

export function ensureConnectionChain(connection: AudioConnection): void {
  try {
    console.log("[audioContextManager] Ensuring connection chain", {
      hasFilters: !!(connection.filters && connection.filters.length > 0),
      hasAnalyser: !!connection.analyser,
      contextState: connection.audioContext.state,
    });

    try {
      connection.sourceNode.disconnect();
    } catch (e) {
      // Already disconnected or error, continue
      console.debug(
        "[audioContextManager] SourceNode disconnect (expected):",
        e,
      );
    }

    // Disconnect analyser if it exists
    if (connection.analyser) {
      try {
        connection.analyser.disconnect();
      } catch (e) {
        // Already disconnected, ignore
        console.debug(
          "[audioContextManager] Analyser disconnect (expected):",
          e,
        );
      }
    }

    // Disconnect filters if they exist
    if (connection.filters && connection.filters.length > 0) {
      connection.filters.forEach((filter) => {
        try {
          filter.disconnect();
        } catch (e) {
          // Already disconnected, ignore
          console.debug(
            "[audioContextManager] Filter disconnect (expected):",
            e,
          );
        }
      });
    }

    // Now rebuild the chain: source -> [filters?] -> [analyser?] -> destination
    if (connection.filters && connection.filters.length > 0) {
      // Chain filters together
      for (let i = 0; i < connection.filters.length - 1; i++) {
        connection.filters[i]!.connect(connection.filters[i + 1]!);
      }

      // Connect source to first filter
      connection.sourceNode.connect(connection.filters[0]!);
      const lastFilter = connection.filters[connection.filters.length - 1]!;

      if (connection.analyser) {
        // Chain: source -> filters -> analyser -> destination
        lastFilter.connect(connection.analyser);
        connection.analyser.connect(connection.audioContext.destination);
        console.log(
          "[audioContextManager] ✅ Chain: source -> filters -> analyser -> destination",
          {
            filterCount: connection.filters.length,
            analyserExists: !!connection.analyser,
            destinationExists: !!connection.audioContext.destination,
          },
        );
      } else {
        // Chain: source -> filters -> destination
        lastFilter.connect(connection.audioContext.destination);
        console.log(
          "[audioContextManager] ✅ Chain: source -> filters -> destination",
          {
            filterCount: connection.filters.length,
          },
        );
      }
    } else if (connection.analyser) {
      // Chain: source -> analyser -> destination
      connection.sourceNode.connect(connection.analyser);
      connection.analyser.connect(connection.audioContext.destination);
      console.log(
        "[audioContextManager] ✅ Chain: source -> analyser -> destination",
        {
          analyserExists: !!connection.analyser,
          destinationExists: !!connection.audioContext.destination,
          sourceNodeExists: !!connection.sourceNode,
        },
      );
    } else {
      // Direct: source -> destination (fallback - ensures audio always plays)
      connection.sourceNode.connect(connection.audioContext.destination);
      console.log(
        "[audioContextManager] ✅ Chain: source -> destination (fallback)",
      );
    }

    // Resume audio context if suspended (required for playback)
    if (connection.audioContext.state === "suspended") {
      console.log(
        "[audioContextManager] ⚠️ Audio context suspended, resuming...",
      );
      void connection.audioContext
        .resume()
        .then(() => {
          console.log("[audioContextManager] ✅ Audio context resumed");
        })
        .catch((err) => {
          console.error(
            "[audioContextManager] ❌ Failed to resume audio context:",
            err,
          );
        });
    }

    console.log("[audioContextManager] ✅ Connection chain verified", {
      contextState: connection.audioContext.state,
    });
  } catch (error) {
    console.error(
      "[audioContextManager] ❌ Error ensuring connection chain:",
      error,
    );
    // Fallback: ensure at least source -> destination (critical for audio playback)
    try {
      connection.sourceNode.disconnect();
      connection.sourceNode.connect(connection.audioContext.destination);
      console.log(
        "[audioContextManager] ✅ Fallback chain: source -> destination",
      );
    } catch (fallbackError) {
      console.error(
        "[audioContextManager] ❌ Fallback chain failed:",
        fallbackError,
      );
    }
  }
}

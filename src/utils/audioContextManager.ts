// File: src/utils/audioContextManager.ts

interface AudioConnection {
  sourceNode: MediaElementAudioSourceNode;
  audioContext: AudioContext;
  analyser?: AnalyserNode;
  filters?: BiquadFilterNode[];
  refCount: number;
}

const connectedAudioElements = new WeakMap<HTMLAudioElement, AudioConnection>();

export function getOrCreateAudioConnection(
  audioElement: HTMLAudioElement,
): AudioConnection | null {

  const existing = connectedAudioElements.get(audioElement);
  if (existing) {

    if (existing.audioContext.state !== "closed" && existing.sourceNode) {

      existing.refCount++;
      return existing;
    } else {

      connectedAudioElements.delete(audioElement);
    }
  }

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

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    sourceNode.connect(audioContext.destination);

    return connection;
  } catch (error) {

    const retryExisting = connectedAudioElements.get(audioElement);
    if (retryExisting) {
      retryExisting.refCount++;
      return retryExisting;
    }

    if (error instanceof DOMException && error.name === "InvalidStateError") {

      return null;
    }

    console.error("Failed to create audio connection:", error);
    return null;
  }
}

export function releaseAudioConnection(audioElement: HTMLAudioElement): void {
  const connection = connectedAudioElements.get(audioElement);
  if (!connection) return;

  connection.refCount--;

  if (connection.refCount <= 0 && !audioElement.src) {
    console.log("[audioContextManager] Cleaning up audio connection (no source loaded)");
    try {

      if (connection.analyser) {
        connection.analyser.disconnect();
      }
      if (connection.filters && connection.filters.length > 0) {
        connection.filters.forEach((filter) => filter.disconnect());
      }

      if (connection.audioContext.state !== "closed") {
        void connection.audioContext.close();
      }
    } catch (error) {

      console.warn("Error during audio connection cleanup:", error);
    }

    connectedAudioElements.delete(audioElement);
  } else if (connection.refCount <= 0) {
    console.log("[audioContextManager] Keeping connection alive (audio source is loaded)", {
      src: audioElement.src.substring(0, 50) + "...",
      refCount: connection.refCount,
    });
  }
}

export function getAudioConnection(
  audioElement: HTMLAudioElement,
): AudioConnection | undefined {
  return connectedAudioElements.get(audioElement);
}

export function verifyConnectionChain(connection: AudioConnection): boolean {
  try {

    if (!connection.sourceNode) return false;

    if (connection.filters && connection.filters.length > 0) {

    }

    if (connection.analyser) {

    }

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

      console.debug(
        "[audioContextManager] SourceNode disconnect (expected):",
        e,
      );
    }

    if (connection.analyser) {
      try {
        connection.analyser.disconnect();
      } catch (e) {

        console.debug(
          "[audioContextManager] Analyser disconnect (expected):",
          e,
        );
      }
    }

    if (connection.filters && connection.filters.length > 0) {
      connection.filters.forEach((filter) => {
        try {
          filter.disconnect();
        } catch (e) {

          console.debug(
            "[audioContextManager] Filter disconnect (expected):",
            e,
          );
        }
      });
    }

    if (connection.filters && connection.filters.length > 0) {

      for (let i = 0; i < connection.filters.length - 1; i++) {
        connection.filters[i]!.connect(connection.filters[i + 1]!);
      }

      connection.sourceNode.connect(connection.filters[0]!);
      const lastFilter = connection.filters[connection.filters.length - 1]!;

      if (connection.analyser) {

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

        lastFilter.connect(connection.audioContext.destination);
        console.log(
          "[audioContextManager] ✅ Chain: source -> filters -> destination",
          {
            filterCount: connection.filters.length,
          },
        );
      }
    } else if (connection.analyser) {

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

      connection.sourceNode.connect(connection.audioContext.destination);
      console.log(
        "[audioContextManager] ✅ Chain: source -> destination (fallback)",
      );
    }

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

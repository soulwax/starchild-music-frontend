// File: src/utils/visualizerState.ts

import { STORAGE_KEYS } from "@/config/storage";
import {
  DEFAULT_VISUALIZER_STATE,
  type VisualizerSerializedState,
  type VisualizerLayoutState,
} from "@/constants/visualizer";

const isBrowser = typeof window !== "undefined";

const parseState = (raw: string | null): VisualizerSerializedState => {
  if (!raw) {
    return DEFAULT_VISUALIZER_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<VisualizerSerializedState>;
    return { ...DEFAULT_VISUALIZER_STATE, ...parsed };
  } catch {
    return DEFAULT_VISUALIZER_STATE;
  }
};

export const readVisualizerStateFromStorage = (): VisualizerSerializedState => {
  if (!isBrowser) {
    return DEFAULT_VISUALIZER_STATE;
  }
  const raw = window.localStorage.getItem(STORAGE_KEYS.VISUALIZER_STATE);
  return parseState(raw);
};

export const persistVisualizerStateToStorage = (
  patch: Partial<VisualizerSerializedState>,
  base?: VisualizerSerializedState,
): VisualizerSerializedState => {
  if (!isBrowser) {
    return { ...DEFAULT_VISUALIZER_STATE, ...patch };
  }

  const previous = base ?? readVisualizerStateFromStorage();
  const next = { ...previous, ...patch };

  window.localStorage.setItem(
    STORAGE_KEYS.VISUALIZER_STATE,
    JSON.stringify(next),
  );
  if (patch.enabled !== undefined) {
    window.localStorage.setItem(
      STORAGE_KEYS.VISUALIZER_ENABLED,
      JSON.stringify(patch.enabled),
    );
  }

  return next;
};

export const extractLayoutState = (
  state: VisualizerSerializedState,
): VisualizerLayoutState => ({
  width: state.width,
  height: state.height,
  collapsedWidth: state.collapsedWidth,
  collapsedHeight: state.collapsedHeight,
  x: state.x,
  y: state.y,
  isExpanded: state.isExpanded,
  type: state.type,
});

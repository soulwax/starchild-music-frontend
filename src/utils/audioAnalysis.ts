// File: src/utils/audioAnalysis.ts

export interface FrequencyBands {
  bass: number; // 20-250 Hz
  lowMid: number; // 250-500 Hz
  mid: number; // 500-2000 Hz
  highMid: number; // 2000-4000 Hz
  treble: number; // 4000-20000 Hz
}

export interface AudioAnalysis {
  frequencyBands: FrequencyBands;
  overallVolume: number;
  peakFrequency: number;
  rms: number; // Root Mean Square for energy
}

/**
 * Analyze frequency data and extract frequency bands
 */
export function analyzeFrequencyBands(
  frequencyData: Uint8Array,
  sampleRate = 44100,
  fftSize = 2048,
): FrequencyBands {
  const nyquist = sampleRate / 2;
  const binSize = nyquist / (fftSize / 2);

  // Define frequency ranges
  const bassRange = { start: 20, end: 250 };
  const lowMidRange = { start: 250, end: 500 };
  const midRange = { start: 500, end: 2000 };
  const highMidRange = { start: 2000, end: 4000 };
  const trebleRange = { start: 4000, end: 20000 };

  // Calculate average amplitude for each band
  const getBandAverage = (startHz: number, endHz: number): number => {
    const startBin = Math.floor(startHz / binSize);
    const endBin = Math.min(
      Math.floor(endHz / binSize),
      frequencyData.length - 1,
    );

    if (startBin >= endBin) return 0;

    let sum = 0;
    let count = 0;
    for (const value of frequencyData.slice(startBin, endBin + 1)) {
      sum += value ?? 0;
      count++;
    }

    return count > 0 ? sum / count / 255 : 0;
  };

  return {
    bass: getBandAverage(bassRange.start, bassRange.end),
    lowMid: getBandAverage(lowMidRange.start, lowMidRange.end),
    mid: getBandAverage(midRange.start, midRange.end),
    highMid: getBandAverage(highMidRange.start, highMidRange.end),
    treble: getBandAverage(trebleRange.start, trebleRange.end),
  };
}

/**
 * Calculate overall volume (RMS)
 */
export function calculateRMS(frequencyData: Uint8Array): number {
  let sum = 0;
  for (const value of frequencyData) {
    const normalized = (value ?? 0) / 255;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / frequencyData.length);
}

/**
 * Find peak frequency
 */
export function findPeakFrequency(
  frequencyData: Uint8Array,
  sampleRate = 44100,
  fftSize = 2048,
): number {
  let maxValue = 0;
  let maxIndex = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    if ((frequencyData[i] ?? 0) > maxValue) {
      maxValue = frequencyData[i] ?? 0;
      maxIndex = i;
    }
  }

  const nyquist = sampleRate / 2;
  const binSize = nyquist / (fftSize / 2);
  return maxIndex * binSize;
}

/**
 * Comprehensive audio analysis
 */
export function analyzeAudio(
  frequencyData: Uint8Array,
  sampleRate = 44100,
  fftSize = 2048,
): AudioAnalysis {
  const frequencyBands = analyzeFrequencyBands(
    frequencyData,
    sampleRate,
    fftSize,
  );
  const rms = calculateRMS(frequencyData);
  const peakFrequency = findPeakFrequency(frequencyData, sampleRate, fftSize);

  // Overall volume is the average of all frequency data
  const overallVolume =
    frequencyData.reduce((sum, val) => sum + (val ?? 0), 0) /
    frequencyData.length /
    255;

  return {
    frequencyBands,
    overallVolume,
    peakFrequency,
    rms,
  };
}

/**
 * Apply smoothing to frequency data to reduce jitter
 */
export function smoothFrequencyData(
  data: Uint8Array,
  previousData: Uint8Array | null,
  smoothingFactor = 0.7,
): Uint8Array {
  if (!previousData || previousData.length !== data.length) {
    return data;
  }

  const smoothed = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    smoothed[i] = Math.round(
      (data[i] ?? 0) * (1 - smoothingFactor) +
        (previousData[i] ?? 0) * smoothingFactor,
    );
  }

  return smoothed;
}

/**
 * Detect beats using energy-based algorithm
 */
export function detectBeat(
  currentEnergy: number,
  previousEnergies: number[],
  threshold = 1.5,
): boolean {
  if (previousEnergies.length < 2) return false;

  const averageEnergy =
    previousEnergies.reduce((a, b) => a + b, 0) / previousEnergies.length;
  const variance =
    previousEnergies.reduce(
      (sum, e) => sum + Math.pow(e - averageEnergy, 2),
      0,
    ) / previousEnergies.length;
  const constant = -0.0025714 * variance + 1.5142857;

  return currentEnergy > averageEnergy * constant * threshold;
}

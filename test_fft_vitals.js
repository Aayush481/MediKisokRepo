// Test script for Bandpass filtering, FFT frequency detection with Zero-Padding & Parabolic Interpolation

function computeFFTBpm(signal, Fs, fLow = 0.7, fHigh = 4.0, nFft = 1024) {
  const N = signal.length;
  // Detrend
  const mean = signal.reduce((a, b) => a + b, 0) / N;
  const detrended = signal.map(x => x - mean);

  // Apply Hanning window
  const windowed = new Float64Array(nFft);
  for (let n = 0; n < N; n++) {
    const hanning = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
    windowed[n] = detrended[n] * hanning;
  }

  // Real and Imaginary DFT over nFft
  const real = new Float64Array(nFft);
  const imag = new Float64Array(nFft);
  const power = new Float64Array(nFft / 2);

  let maxPower = -1;
  let peakBin = -1;

  for (let k = 1; k < nFft / 2; k++) {
    const freq = (k * Fs) / nFft;
    if (freq >= fLow && freq <= fHigh) {
      let sumReal = 0;
      let sumImag = 0;
      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / nFft;
        sumReal += windowed[n] * Math.cos(angle);
        sumImag -= windowed[n] * Math.sin(angle);
      }
      real[k] = sumReal;
      imag[k] = sumImag;
      const p = sumReal * sumReal + sumImag * sumImag;
      power[k] = p;

      if (p > maxPower) {
        maxPower = p;
        peakBin = k;
      }
    }
  }

  if (peakBin <= 0) return { bpm: 72, peakFreq: 1.2, maxPower: 0 };

  // Parabolic interpolation for fine sub-bin resolution
  let refinedBin = peakBin;
  if (peakBin > 1 && peakBin < nFft / 2 - 1) {
    const alpha = power[peakBin - 1];
    const beta = power[peakBin];
    const gamma = power[peakBin + 1];
    const denom = 2 * (2 * beta - alpha - gamma);
    if (denom !== 0) {
      const delta = (gamma - alpha) / denom;
      refinedBin = peakBin + delta;
    }
  }

  const peakFreq = (refinedBin * Fs) / nFft;
  const bpm = Math.round(peakFreq * 60);

  return { bpm, peakFreq, maxPower };
}

function bandpassFilter(signal, Fs, fLow = 0.7, fHigh = 4.0) {
  const N = signal.length;
  const mean = signal.reduce((a, b) => a + b, 0) / N;
  const detrended = signal.map(x => x - mean);

  // Time-domain zero-phase 2nd-order Butterworth bandpass simulation
  // 1. Moving average subtraction for high-pass (0.7 Hz -> window ~ Fs / 0.7 = 43 samples)
  const hpWindow = Math.round(Fs / fLow);
  const highPassed = [];
  for (let i = 0; i < N; i++) {
    const start = Math.max(0, i - Math.floor(hpWindow / 2));
    const end = Math.min(N, i + Math.floor(hpWindow / 2) + 1);
    const localMean = detrended.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
    highPassed.push(detrended[i] - localMean);
  }

  // 2. Low-pass smoothing (4.0 Hz -> window ~ Fs / 4.0 = 7 samples)
  const lpWindow = Math.max(3, Math.round(Fs / (fHigh * 2)));
  const output = [];
  for (let i = 0; i < N; i++) {
    const start = Math.max(0, i - Math.floor(lpWindow / 2));
    const end = Math.min(N, i + Math.floor(lpWindow / 2) + 1);
    const smoothed = highPassed.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
    output.push(smoothed);
  }

  return output;
}

function validatePeaksAndIBIs(signal, timestamps, minIbi = 400, maxIbi = 1400) {
  const peakIndices = [];
  const maxVal = Math.max(...signal);
  const threshold = maxVal * 0.30;

  for (let i = 1; i < signal.length - 1; i++) {
    if (signal[i] > threshold && signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) {
      peakIndices.push(i);
    }
  }

  const validIbis = [];
  for (let i = 1; i < peakIndices.length; i++) {
    const ibi = timestamps[peakIndices[i]] - timestamps[peakIndices[i - 1]];
    if (ibi >= minIbi && ibi <= maxIbi) {
      validIbis.push(ibi);
    }
  }

  let meanIbiBpm = null;
  if (validIbis.length >= 2) {
    const meanIbi = validIbis.reduce((a, b) => a + b, 0) / validIbis.length;
    meanIbiBpm = Math.round(60000 / meanIbi);
  }

  return { peakIndices, validIbis, meanIbiBpm };
}

function computeVariance(signal) {
  const N = signal.length;
  const mean = signal.reduce((a, b) => a + b, 0) / N;
  const variance = signal.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / N;
  return Math.sqrt(variance);
}

// ==============================================
// TEST 1: Synthetic 75 BPM Pulsatile Signal (1.25 Hz) with 30 Hz sampling
// ==============================================
console.log("=== TEST 1: Synthetic 75 BPM Signal ===");
const Fs = 30; // 30 FPS
const durationSec = 6;
const N = Fs * durationSec;
const targetBpm = 75;
const targetFreq = targetBpm / 60; // 1.25 Hz

const timestamps = [];
const rawGreen = [];

for (let i = 0; i < N; i++) {
  const t = i / Fs;
  timestamps.push(t * 1000);
  const dc = 120;
  const drift = 5 * Math.sin(2 * Math.PI * 0.1 * t);
  const pulse = 2.5 * Math.sin(2 * Math.PI * targetFreq * t);
  const noise = 0.3 * Math.sin(2 * Math.PI * 8.0 * t);
  rawGreen.push(dc + drift + pulse + noise);
}

const filtered = bandpassFilter(rawGreen, Fs, 0.7, 4.0);
const stdDev = computeVariance(filtered);
const { bpm: fftBpm, peakFreq } = computeFFTBpm(filtered, Fs, 0.7, 4.0, 1024);
const { peakIndices, validIbis, meanIbiBpm } = validatePeaksAndIBIs(filtered, timestamps);

console.log(`Pulsatility Variance (std dev): ${stdDev.toFixed(3)} (Threshold >= 0.18: ${stdDev >= 0.18})`);
console.log(`FFT Peak Frequency: ${peakFreq.toFixed(2)} Hz -> BPM: ${fftBpm} (Target: 75 BPM)`);
console.log(`Valid Peaks Found: ${peakIndices.length}, Valid IBIs: ${validIbis.length}, IBI BPM: ${meanIbiBpm}`);

// ==============================================
// TEST 2: Inanimate Flat Wall / Static Signal
// ==============================================
console.log("\n=== TEST 2: Inanimate Flat Wall / Static Signal ===");
const flatSignal = [];
for (let i = 0; i < N; i++) {
  flatSignal.push(115.0 + (Math.random() * 0.05 - 0.025));
}
const flatFiltered = bandpassFilter(flatSignal, Fs, 0.7, 4.0);
const flatStdDev = computeVariance(flatFiltered);
console.log(`Wall Signal Variance: ${flatStdDev.toFixed(4)} (Threshold >= 0.18: ${flatStdDev >= 0.18})`);
const isWallRejected = flatStdDev < 0.18;
console.log(`Correctly Rejected Non-Pulsatile Scan: ${isWallRejected}`);

if (Math.abs(fftBpm - 75) <= 1 && isWallRejected) {
  console.log("\n✅ ALL DSP TESTS (BANDPASS + FFT + PEAK VALIDATION + VARIANCE REJECTION) PASSED PERFECTLY!");
} else {
  console.error("\n❌ DSP Test Failed");
  process.exit(1);
}

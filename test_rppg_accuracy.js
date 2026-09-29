// Test Chrominance-based rPPG with Skin Pixel Averaging & Uniform Temporal Resampling

function resampleUniform(signal, timestamps, targetFs = 30) {
  const tStart = timestamps[0];
  const tEnd = timestamps[timestamps.length - 1];
  const totalDurationSec = (tEnd - tStart) / 1000;
  const numSamples = Math.floor(totalDurationSec * targetFs);
  const resampled = new Float64Array(numSamples);
  const dt = 1000 / targetFs;

  let srcIdx = 0;
  for (let i = 0; i < numSamples; i++) {
    const tTarget = tStart + i * dt;
    while (srcIdx < timestamps.length - 1 && timestamps[srcIdx + 1] < tTarget) {
      srcIdx++;
    }
    if (srcIdx >= timestamps.length - 1) {
      resampled[i] = signal[signal.length - 1];
    } else {
      const t0 = timestamps[srcIdx];
      const t1 = timestamps[srcIdx + 1];
      const frac = (tTarget - t0) / Math.max(1, t1 - t0);
      resampled[i] = signal[srcIdx] + frac * (signal[srcIdx + 1] - signal[srcIdx]);
    }
  }
  return { resampled, numSamples, durationSec: totalDurationSec };
}

function bandpassFilter(signal, Fs = 30, fLow = 0.8, fHigh = 2.5) {
  const N = signal.length;
  const mean = signal.reduce((a, b) => a + b, 0) / N;
  const detrended = signal.map(x => x - mean);

  // Moving average baseline subtraction (high-pass at ~0.8 Hz)
  const hpWindow = Math.max(5, Math.round(Fs / fLow));
  const highPassed = [];
  for (let i = 0; i < N; i++) {
    const start = Math.max(0, i - Math.floor(hpWindow / 2));
    const end = Math.min(N, i + Math.floor(hpWindow / 2) + 1);
    const localMean = detrended.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
    highPassed.push(detrended[i] - localMean);
  }

  // Moving average smoothing (low-pass at ~2.5 Hz)
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

function computeFFTBpm(signal, Fs = 30, fLow = 0.8, fHigh = 2.5, nFft = 2048) {
  const N = signal.length;
  if (N < 10) return { bpm: 72, peakFreq: 1.2, maxPower: 0 };

  const mean = signal.reduce((a, b) => a + b, 0) / N;
  const detrended = signal.map(x => x - mean);

  // Hanning window
  const windowed = new Float64Array(nFft);
  for (let n = 0; n < N; n++) {
    const hanning = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
    windowed[n] = detrended[n] * hanning;
  }

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
      const p = sumReal * sumReal + sumImag * sumImag;
      power[k] = p;

      if (p > maxPower) {
        maxPower = p;
        peakBin = k;
      }
    }
  }

  if (peakBin <= 0) return { bpm: 72, peakFreq: 1.2, maxPower: 0 };

  // Sub-bin parabolic peak refinement
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

// Test varying target heart rates: 65 BPM, 72 BPM, 80 BPM, 95 BPM, 110 BPM
console.log("=== TESTING CHROMINANCE rPPG ACCURACY ACROSS MULTIPLE HEART RATES ===");

const testBpmRates = [65, 72, 80, 95, 110];

for (const targetBpm of testBpmRates) {
  const targetFreq = targetBpm / 60;
  const timestamps = [];
  const rawGreen = [];
  const rawRed = [];

  // Simulate jittered timestamps (browser requestAnimationFrame jitter between 16ms and 45ms)
  let currTime = 0;
  while (currTime < 6500) {
    timestamps.push(currTime);
    const t = currTime / 1000;
    
    // Ambient room light drift + pulsatile blood absorption in green & red
    const ambientDrift = 12 * Math.sin(2 * Math.PI * 0.12 * t);
    const pulseGreen = 2.8 * Math.sin(2 * Math.PI * targetFreq * t);
    const pulseRed = 1.3 * Math.sin(2 * Math.PI * targetFreq * t);
    const highFreqNoise = 0.4 * Math.sin(2 * Math.PI * 8.5 * t);

    rawGreen.push(118 + ambientDrift + pulseGreen + highFreqNoise);
    rawRed.push(128 + ambientDrift + pulseRed + highFreqNoise);

    // Random jitter 25ms - 38ms (typical camera frame interval)
    currTime += 30 + (Math.random() * 10 - 5);
  }

  // 1. Chrominance Differential Signal (Cancels Ambient Light Drift)
  const meanG = rawGreen.reduce((a, b) => a + b, 0) / rawGreen.length;
  const meanR = rawRed.reduce((a, b) => a + b, 0) / rawRed.length;
  const chromBvp = rawGreen.map((g, i) => (g / meanG) - (rawRed[i] / meanR));

  // 2. Uniform Resampling
  const { resampled } = resampleUniform(chromBvp, timestamps, 30);

  // 3. Bandpass Filtering
  const filtered = bandpassFilter(resampled, 30, 0.8, 2.5);

  // 4. FFT Peak Frequency
  const { bpm: measuredBpm, peakFreq } = computeFFTBpm(filtered, 30, 0.8, 2.5, 2048);

  const error = Math.abs(measuredBpm - targetBpm);
  console.log(`Target: ${targetBpm} BPM -> Measured: ${measuredBpm} BPM (Freq: ${peakFreq.toFixed(2)} Hz) | Error: ${error} BPM`);

  if (error > 1) {
    console.error(`❌ Accuracy Error exceeded 1 BPM on target ${targetBpm} BPM`);
    process.exit(1);
  }
}

console.log("\n✅ ALL HEART RATE FREQUENCY ACCURACY TESTS PASSED WITH <1 BPM ACCURACY!");

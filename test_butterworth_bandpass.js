// Test Butterworth FiltFilt Bandpass against Moving Average Filter
function butterworthLowpass(fc, fs) {
  const k = Math.tan((Math.PI * fc) / fs);
  const norm = 1 / (1 + Math.SQRT2 * k + k * k);
  const b0 = k * k * norm;
  return {
    b0: b0,
    b1: 2 * b0,
    b2: b0,
    a1: 2 * (k * k - 1) * norm,
    a2: (1 - Math.SQRT2 * k + k * k) * norm
  };
}

function butterworthHighpass(fc, fs) {
  const k = Math.tan((Math.PI * fc) / fs);
  const norm = 1 / (1 + Math.SQRT2 * k + k * k);
  const b0 = 1 * norm;
  return {
    b0: b0,
    b1: -2 * b0,
    b2: b0,
    a1: 2 * (k * k - 1) * norm,
    a2: (1 - Math.SQRT2 * k + k * k) * norm
  };
}

function applyBiquad(signal, coeffs) {
  const N = signal.length;
  const out = new Float64Array(N);
  const { b0, b1, b2, a1, a2 } = coeffs;
  let x1 = signal[0], x2 = signal[0];
  let y1 = signal[0], y2 = signal[0];

  for (let i = 0; i < N; i++) {
    const x0 = signal[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    out[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return Array.from(out);
}

function filtfilt(signal, coeffs) {
  const fwd = applyBiquad(signal, coeffs);
  fwd.reverse();
  const bwd = applyBiquad(fwd, coeffs);
  bwd.reverse();
  return bwd;
}

function butterworthBandpassFiltFilt(signal, fs = 30, fLow = 0.72, fHigh = 2.80) {
  const hpCoeffs = butterworthHighpass(fLow, fs);
  const lpCoeffs = butterworthLowpass(fHigh, fs);
  
  const highPassed = filtfilt(signal, hpCoeffs);
  const bandPassed = filtfilt(highPassed, lpCoeffs);
  return bandPassed;
}

// Test with heart rates: 60, 72, 85, 100, 120, 140 BPM with heavy baseline drift & respiration
const testBPMs = [60, 72, 85, 100, 120, 140];
const fs = 30.0;
const duration = 12.0;
const N = Math.floor(duration * fs);

console.log("=== Testing 4th-Order Zero-Phase Butterworth Bandpass Filter ===");
for (const targetBpm of testBPMs) {
  const targetFreq = targetBpm / 60;
  const signal = [];
  for (let i = 0; i < N; i++) {
    const t = i / fs;
    // Heart pulse (fundamental + harmonic)
    const pulse = Math.sin(2 * Math.PI * targetFreq * t) + 0.35 * Math.sin(4 * Math.PI * targetFreq * t);
    // Heavy respiration (15 RPM = 0.25 Hz)
    const resp = 5.0 * Math.sin(2 * Math.PI * 0.25 * t);
    // Baseline wander / motion drift (0.08 Hz)
    const wander = 8.0 * Math.sin(2 * Math.PI * 0.08 * t) + 2.0 * t;
    // Noise
    const noise = 0.2 * (Math.random() - 0.5);

    signal.push(100 + wander + resp + pulse + noise);
  }

  const filtered = butterworthBandpassFiltFilt(signal, fs, 0.72, 2.80);

  // FFT peak finding
  const nFft = 2048;
  const power = new Float64Array(nFft / 2);
  let maxP = -1, peakBin = -1;
  for (let k = 1; k < nFft / 2; k++) {
    const freq = (k * fs) / nFft;
    if (freq >= 0.72 && freq <= 2.80) {
      let r = 0, im = 0;
      for (let n = 0; n < N; n++) {
        const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
        const angle = (2 * Math.PI * k * n) / nFft;
        r += filtered[n] * w * Math.cos(angle);
        im -= filtered[n] * w * Math.sin(angle);
      }
      const p = r * r + im * im;
      power[k] = p;
      if (p > maxP) {
        maxP = p;
        peakBin = k;
      }
    }
  }

  let refinedBin = peakBin;
  if (peakBin > 1 && peakBin < nFft / 2 - 1) {
    const alpha = Math.max(1e-9, power[peakBin - 1]);
    const beta = Math.max(1e-9, power[peakBin]);
    const gamma = Math.max(1e-9, power[peakBin + 1]);
    const denom = 2 * (2 * Math.log(beta) - Math.log(alpha) - Math.log(gamma));
    if (Math.abs(denom) > 1e-6) {
      refinedBin = peakBin + (Math.log(gamma) - Math.log(alpha)) / denom;
    }
  }

  const measuredBpm = Math.round((refinedBin * fs * 60) / nFft);
  console.log(`Target: ${targetBpm} BPM -> Filtered Peak: ${measuredBpm} BPM (Error: ${Math.abs(measuredBpm - targetBpm)} BPM)`);
}

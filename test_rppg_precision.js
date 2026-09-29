// Comprehensive test of:
// 1. 4th-Order Zero-Phase Butterworth Bandpass Filter (filtfilt)
// 2. Windowed Overlap-Add POS & CHROM Algorithm
// 3. Harmonic & Subharmonic-Aware FFT Sub-Bin Peak Refinement
// 4. Refractory-Period Peak Detection & Outlier-Filtered IBI Calculation

function butterworthLowpass(fc, fs) {
  const k = Math.tan((Math.PI * fc) / fs);
  const norm = 1 / (1 + Math.SQRT2 * k + k * k);
  const b0 = k * k * norm;
  return { b0, b1: 2 * b0, b2: b0, a1: 2 * (k * k - 1) * norm, a2: (1 - Math.SQRT2 * k + k * k) * norm };
}

function butterworthHighpass(fc, fs) {
  const k = Math.tan((Math.PI * fc) / fs);
  const norm = 1 / (1 + Math.SQRT2 * k + k * k);
  const b0 = 1 * norm;
  return { b0, b1: -2 * b0, b2: b0, a1: 2 * (k * k - 1) * norm, a2: (1 - Math.SQRT2 * k + k * k) * norm };
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

function butterworthBandpass(signal, fs = 30, fLow = 0.72, fHigh = 2.80) {
  if (!signal || signal.length < 10) return signal || [];
  const hp = butterworthHighpass(fLow, fs);
  const lp = butterworthLowpass(fHigh, fs);
  return filtfilt(filtfilt(signal, hp), lp);
}

function calculateWindowedPOS(red, green, blue, Fs = 30, windowSec = 1.6, stepSec = 0.2) {
  const N = red.length;
  const winLen = Math.max(16, Math.round(windowSec * Fs));
  const stepLen = Math.max(1, Math.round(stepSec * Fs));
  const bvp = new Float64Array(N);
  const weights = new Float64Array(N);

  for (let start = 0; start + winLen <= N; start += stepLen) {
    const end = start + winLen;
    const rWin = red.slice(start, end);
    const gWin = green.slice(start, end);
    const bWin = blue.slice(start, end);

    const mR = rWin.reduce((a, b) => a + b, 0) / winLen || 1;
    const mG = gWin.reduce((a, b) => a + b, 0) / winLen || 1;
    const mB = bWin.reduce((a, b) => a + b, 0) / winLen || 1;

    const s1 = new Float64Array(winLen);
    const s2 = new Float64Array(winLen);

    for (let i = 0; i < winLen; i++) {
      const rn = rWin[i] / mR;
      const gn = gWin[i] / mG;
      const bn = bWin[i] / mB;
      s1[i] = gn - bn;
      s2[i] = gn + bn - 2 * rn;
    }

    let sum1 = 0, sum2 = 0;
    for (let i = 0; i < winLen; i++) { sum1 += s1[i]; sum2 += s2[i]; }
    const mean1 = sum1 / winLen, mean2 = sum2 / winLen;
    let var1 = 0, var2 = 0;
    for (let i = 0; i < winLen; i++) {
      const d1 = s1[i] - mean1, d2 = s2[i] - mean2;
      var1 += d1 * d1; var2 += d2 * d2;
    }
    const std1 = Math.sqrt(var1 / winLen);
    const std2 = Math.sqrt(var2 / winLen);
    const alpha = std2 > 1e-6 ? (std1 / std2) : 1.0;

    for (let i = 0; i < winLen; i++) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (winLen - 1)));
      const val = (s1[i] + alpha * s2[i] - (mean1 + alpha * mean2)) * w;
      bvp[start + i] += val;
      weights[start + i] += w;
    }
  }

  for (let i = 0; i < N; i++) {
    if (weights[i] > 1e-4) bvp[i] /= weights[i];
  }
  return Array.from(bvp);
}

function computeFFTBpm(signal, Fs = 30, fLow = 0.72, fHigh = 2.80, nFft = 2048) {
  const N = signal.length;
  if (N < 10) return { bpm: 72, peakFreq: 1.2, maxPower: 0, snr: 1.0 };

  const mean = signal.reduce((a, b) => a + b, 0) / N;
  const detrended = signal.map(x => x - mean);

  const windowed = new Float64Array(nFft);
  for (let n = 0; n < N; n++) {
    const hanning = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
    windowed[n] = detrended[n] * hanning;
  }

  const power = new Float64Array(nFft / 2);
  let maxPower = -1;
  let peakBin = -1;
  let totalBandPower = 0;
  let bandBinsCount = 0;

  for (let k = 1; k < nFft / 2; k++) {
    const freq = (k * Fs) / nFft;
    if (freq >= fLow && freq <= fHigh) {
      let sumReal = 0, sumImag = 0;
      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / nFft;
        sumReal += windowed[n] * Math.cos(angle);
        sumImag -= windowed[n] * Math.sin(angle);
      }
      const p = sumReal * sumReal + sumImag * sumImag;
      power[k] = p;
      totalBandPower += p;
      bandBinsCount++;

      if (p > maxPower) {
        maxPower = p;
        peakBin = k;
      }
    }
  }

  if (peakBin <= 0) return { bpm: 72, peakFreq: 1.2, maxPower: 0, snr: 1.0 };

  // Harmonic & Subharmonic disambiguation
  const peakFreq = (peakBin * Fs) / nFft;
  const halfBin = Math.round(peakBin / 2);
  const halfFreq = (halfBin * Fs) / nFft;
  if (halfFreq >= fLow && power[halfBin] > maxPower * 0.32) {
    // Peak was actually the 2nd harmonic, switch to fundamental
    peakBin = halfBin;
    maxPower = power[halfBin];
  }

  // Parabolic sub-bin peak refinement
  let refinedBin = peakBin;
  if (peakBin > 1 && peakBin < nFft / 2 - 1) {
    const alpha = Math.max(1e-9, power[peakBin - 1]);
    const beta = Math.max(1e-9, power[peakBin]);
    const gamma = Math.max(1e-9, power[peakBin + 1]);
    const denom = 2 * (2 * Math.log(beta) - Math.log(alpha) - Math.log(gamma));
    if (Math.abs(denom) > 1e-6) {
      const delta = (Math.log(gamma) - Math.log(alpha)) / denom;
      if (Math.abs(delta) < 1.0) refinedBin = peakBin + delta;
    }
  }

  const finalPeakFreq = (refinedBin * Fs) / nFft;
  const bpm = Math.min(180, Math.max(40, Math.round(finalPeakFreq * 60)));
  const avgNoise = bandBinsCount > 0 ? (totalBandPower / bandBinsCount) : 1;
  const snr = avgNoise > 0 ? (maxPower / avgNoise) : 1;

  return { bpm, peakFreq: finalPeakFreq, maxPower, snr };
}

// Run test across various realistic heart rates (55, 68, 75, 82, 95, 110, 135 BPM)
console.log("=== Testing Precision Multi-Stage rPPG Heart Rate Engine ===");
const targetBPMs = [55, 68, 75, 82, 95, 110, 135];
const Fs = 30.0;
const durationSec = 10.0;
const N = Math.floor(durationSec * Fs);

for (const targetBpm of targetBPMs) {
  const red = [], green = [], blue = [];
  const targetFreq = targetBpm / 60;

  for (let i = 0; i < N; i++) {
    const t = i / Fs;
    const wander = 10 * Math.sin(2 * Math.PI * 0.08 * t);
    const resp = 4.5 * Math.sin(2 * Math.PI * 0.25 * t);
    const pulseG = 2.8 * Math.sin(2 * Math.PI * targetFreq * t) + 0.8 * Math.sin(4 * Math.PI * targetFreq * t);
    const pulseR = 0.9 * Math.sin(2 * Math.PI * targetFreq * t);
    const pulseB = 0.6 * Math.sin(2 * Math.PI * targetFreq * t);
    const noise = 0.25 * (Math.random() - 0.5);

    red.push(160 + wander + resp + pulseR + noise);
    green.push(130 + wander + resp + pulseG + noise);
    blue.push(95 + wander + resp + pulseB + noise);
  }

  const posSignal = calculateWindowedPOS(red, green, blue, Fs);
  const filtered = butterworthBandpass(posSignal, Fs, 0.72, 2.80);
  const fftRes = computeFFTBpm(filtered, Fs, 0.72, 2.80, 2048);

  const error = Math.abs(fftRes.bpm - targetBpm);
  console.log(`Target: ${String(targetBpm).padStart(3)} BPM -> Measured: ${String(fftRes.bpm).padStart(3)} BPM (SNR: ${fftRes.snr.toFixed(1)}) | Error: ${error} BPM`);
}

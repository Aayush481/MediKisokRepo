// Test Overlap-Add POS and CHROM algorithm vs simple global POS
import { rppgService } from "./src/services/rppgVitalsService.js";

function calculateWindowedPOS(red, green, blue, Fs = 30, windowDurationSec = 1.6, stepDurationSec = 0.2) {
  const N = red.length;
  const windowLen = Math.max(16, Math.round(windowDurationSec * Fs));
  const stepLen = Math.max(1, Math.round(stepDurationSec * Fs));
  const bvp = new Float64Array(N);
  const weights = new Float64Array(N);

  for (let start = 0; start + windowLen <= N; start += stepLen) {
    const end = start + windowLen;
    const rWin = red.slice(start, end);
    const gWin = green.slice(start, end);
    const bWin = blue.slice(start, end);

    const mR = rWin.reduce((a, b) => a + b, 0) / windowLen || 1;
    const mG = gWin.reduce((a, b) => a + b, 0) / windowLen || 1;
    const mB = bWin.reduce((a, b) => a + b, 0) / windowLen || 1;

    const s1 = new Float64Array(windowLen);
    const s2 = new Float64Array(windowLen);

    for (let i = 0; i < windowLen; i++) {
      const rn = rWin[i] / mR;
      const gn = gWin[i] / mG;
      const bn = bWin[i] / mB;
      s1[i] = gn - bn;
      s2[i] = gn + bn - 2 * rn;
    }

    let sum1 = 0, sum2 = 0;
    for (let i = 0; i < windowLen; i++) { sum1 += s1[i]; sum2 += s2[i]; }
    const mean1 = sum1 / windowLen, mean2 = sum2 / windowLen;
    let var1 = 0, var2 = 0;
    for (let i = 0; i < windowLen; i++) {
      const d1 = s1[i] - mean1, d2 = s2[i] - mean2;
      var1 += d1 * d1; var2 += d2 * d2;
    }
    const std1 = Math.sqrt(var1 / windowLen);
    const std2 = Math.sqrt(var2 / windowLen);
    const alpha = std2 > 1e-6 ? (std1 / std2) : 1.0;

    // Hanning taper for smooth overlap-add
    for (let i = 0; i < windowLen; i++) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowLen - 1)));
      const val = (s1[i] + alpha * s2[i] - (mean1 + alpha * mean2)) * w;
      bvp[start + i] += val;
      weights[start + i] += w;
    }
  }

  for (let i = 0; i < N; i++) {
    if (weights[i] > 1e-4) {
      bvp[i] /= weights[i];
    }
  }
  return Array.from(bvp);
}

console.log("=== Windowed Overlap-Add POS Loaded ===");

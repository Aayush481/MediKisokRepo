// Comprehensive evaluation across various heart rates with strong ambient noise & 1Hz monitor flicker

import { rppgService } from "./src/services/rppgVitalsService.js";

const rates = [68, 74, 82, 88, 94, 102];
console.log("=== MULTI-RATE TEST (Testing Real-World Noise) ===");

for (const targetBpm of rates) {
  const targetFreq = targetBpm / 60;
  const Fs = 30;
  const N = Fs * 7;
  const timestamps = [];
  const gArr = [];
  const rArr = [];

  for (let i = 0; i < N; i++) {
    const t = i / Fs;
    timestamps.push(t * 1000);
    // Ambient noise + 1 Hz flicker + real cardiac pulse
    const flicker = 2.5 * Math.sin(2 * Math.PI * 1.0 * t); // 60 BPM ambient flicker
    const drift = 5.0 * Math.sin(2 * Math.PI * 0.15 * t);
    const pulse = 2.0 * Math.sin(2 * Math.PI * targetFreq * t);
    gArr.push(120 + drift + flicker + pulse + (Math.random() * 0.4 - 0.2));
    rArr.push(130 + drift + flicker + 0.8 * pulse + (Math.random() * 0.4 - 0.2));
  }

  const meanG = gArr.reduce((a, b) => a + b, 0) / N;
  const meanR = rArr.reduce((a, b) => a + b, 0) / N;
  const chrom = gArr.map((g, i) => (g / meanG) - (rArr[i] / meanR));
  const filtered = rppgService.bandpassFilter(chrom, Fs, 0.8, 2.5);
  const { bpm: measured, peakFreq } = rppgService.computeFFTBpm(filtered, Fs, 0.8, 2.5, 2048);

  console.log(`Target: ${targetBpm} BPM -> Old Service Measured: ${measured} BPM (Freq: ${peakFreq.toFixed(2)} Hz)`);
}

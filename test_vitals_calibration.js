import { rppgService } from "./src/services/rppgVitalsService.js";

console.log("=== COMPREHENSIVE rPPG DSP & VITALS CALIBRATION TEST ===");

// 1. Test Bandpass Filtering (0.7 - 4.0 Hz)
const Fs = 30;
const N = 180;
const targetBpm = 75;
const targetFreq = targetBpm / 60; // 1.25 Hz

const rawGreenSignal = [];
const rawRedSignal = [];
const timestamps = [];

for (let i = 0; i < N; i++) {
  const t = i / Fs;
  timestamps.push(t * 1000);
  const dcGreen = 115;
  const dcRed = 125;
  const drift = 6 * Math.sin(2 * Math.PI * 0.1 * t); // 0.1 Hz illumination drift
  const pulseGreen = 2.4 * Math.sin(2 * Math.PI * targetFreq * t); // 1.25 Hz cardiac pulsatility
  const pulseRed = 1.2 * Math.sin(2 * Math.PI * targetFreq * t); // Red channel pulsatility is ~50% of green in facial skin
  const noise = 0.3 * Math.sin(2 * Math.PI * 9.0 * t); // 9 Hz high freq noise

  rawGreenSignal.push(dcGreen + drift + pulseGreen + noise);
  rawRedSignal.push(dcRed + drift + pulseRed + noise);
}

const bandpassed = rppgService.bandpassFilter(rawGreenSignal, Fs, 0.7, 4.0);
console.log(`1. Bandpass Filtering: Processed ${bandpassed.length} frames.`);

// 2. Test Pulsatility Variance Cross-Check
const variance = rppgService.computePulsatilityVariance(bandpassed);
console.log(`2. Pulsatility Variance: ${variance.toFixed(3)} (Threshold >= 0.18: ${variance >= 0.18})`);

// 3. Test Inanimate Wall / Static Surface Signal (Variance < 0.18)
const flatSignal = new Array(N).fill(115.0).map(v => v + (Math.random() * 0.04 - 0.02));
const flatBandpassed = rppgService.bandpassFilter(flatSignal, Fs, 0.7, 4.0);
const flatVariance = rppgService.computePulsatilityVariance(flatBandpassed);
console.log(`3. Static Wall Variance: ${flatVariance.toFixed(4)} (Threshold < 0.18 -> Rejected: ${flatVariance < 0.18})`);

// 4. Test FFT Dominant Frequency (BPM = f_peak * 60)
const { bpm: fftBpm, peakFreq } = rppgService.computeFFTBpm(bandpassed, Fs, 0.7, 4.0, 1024);
console.log(`4. FFT Dominant Frequency: ${peakFreq.toFixed(2)} Hz -> BPM: ${fftBpm} (Target: 75 BPM)`);

// 5. Test Peak Validation & Inter-Beat Intervals (400 - 1400 ms)
const { peakIndices, validIbis, ibiBpm } = rppgService.validatePeaksAndIBIs(bandpassed, timestamps, 400, 1400);
console.log(`5. Valid Peaks: ${peakIndices.length}, Valid IBIs: ${validIbis.length}, IBI BPM: ${ibiBpm}`);

// 6. Test Dual-Wavelength SpO2 (Ratio-of-Ratios)
const normalSpO2 = rppgService.calculateMedicalSpO2(rawRedSignal, rawGreenSignal, Fs);
console.log(`6. Medical Dual-Wavelength SpO2: ${normalSpO2}% (Normal Range: 96-99%)`);

// 7. Test Autonomic Stress Index & HRV (RMSSD)
const stressData = rppgService.calculateStressAndHRV(validIbis, fftBpm);
console.log(`7. Autonomic Stress Score: ${stressData.stressScore}/100 [${stressData.stressCategory}], HRV RMSSD: ${stressData.hrv} ms`);

const allPassed = 
  Math.abs(fftBpm - 75) <= 1 &&
  variance >= 0.18 &&
  flatVariance < 0.18 &&
  validIbis.length >= 6 &&
  normalSpO2 >= 96 &&
  normalSpO2 <= 99;

if (allPassed) {
  console.log("\n✅ ALL rPPG DSP & CLINICAL CALIBRATION SUITES PASSED PERFECTLY!");
} else {
  console.error("\n❌ DSP Test Failed");
  process.exit(1);
}

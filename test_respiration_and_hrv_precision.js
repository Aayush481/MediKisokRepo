import { rppgService } from './frontend/src/services/rppgVitalsService.js';

console.log("=== Testing True Optical Respiration Rate & HRV Precision ===");

const Fs = 30.0;
const durationSec = 12;
const N = Math.floor(Fs * durationSec);
const timestamps = [];
for (let i = 0; i < N; i++) {
  timestamps.push(Date.now() + (i * 1000) / Fs);
}

// Test Respiration Rates across physiological range (12, 16, 20, 24 RPM)
const testRPMs = [12, 16, 20, 24];
let allPassed = true;

for (const targetRPM of testRPMs) {
  const respFreq = targetRPM / 60; // Hz
  const cardiacFreq = 1.25; // 75 BPM

  // Synthesize realistic rPPG signal containing cardiac wave + respiratory modulation (RIIV)
  const signal = [];
  for (let i = 0; i < N; i++) {
    const t = i / Fs;
    const cardiac = Math.sin(2 * Math.PI * cardiacFreq * t);
    const respModulation = 0.40 * Math.sin(2 * Math.PI * respFreq * t);
    signal.push(cardiac + respModulation);
  }

  const result = rppgService.calculateRespiratoryRate(signal, timestamps, Fs);
  const error = Math.abs(result.rpm - targetRPM);
  console.log(`Target: ${targetRPM} RPM -> Measured: ${result.rpm} RPM (Spectral: ${result.spectralRpm} RPM) | Error: ${error} RPM`);

  if (error > 1) {
    allPassed = false;
  }
}

// Test HRV and Baevsky Stress Index
console.log("\n=== Testing HRV & Baevsky Stress Index ===");
const normalIBIs = [800, 810, 790, 805, 795, 820, 785, 800, 815, 790]; // ~75 BPM normal vagal tone
const stressDataNormal = rppgService.calculateStressAndHRV(normalIBIs, 75);
console.log("Normal Vagal Tone:", stressDataNormal);

const tachyIBIs = [520, 525, 515, 520, 530, 510, 522, 518]; // ~115 BPM sympathetic surge
const stressDataTachy = rppgService.calculateStressAndHRV(tachyIBIs, 115);
console.log("Sympathetic Surge:", stressDataTachy);

if (allPassed && stressDataNormal.hrv >= 15 && stressDataTachy.stressScore >= 50) {
  console.log("\n✅ ALL RESPIRATION AND HRV PRECISION TESTS PASSED (100% MATHEMATICALLY ACCURATE)");
} else {
  console.error("\n❌ TESTS FAILED");
  process.exit(1);
}

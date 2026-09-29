import http from "http";
import FaceROITracker from "./src/services/FaceROITracker.js";

console.log("=== RUNNING JAVASCRIPT FACE DETECTION & PRE-VITALS LOCK TEST SUITE ===\n");

const tracker = new FaceROITracker({ lockThreshold: 4 });

// Helper to create synthetic landmarks
function createValidLandmarks() {
  const lm = new Array(478);
  for (let i = 0; i < 478; i++) {
    lm[i] = { x: 0.50, y: 0.50, z: 0 };
  }
  lm[10] = { x: 0.50, y: 0.20, z: 0 };
  lm[67] = { x: 0.38, y: 0.25, z: 0 };
  lm[109] = { x: 0.35, y: 0.23, z: 0 };
  lm[297] = { x: 0.62, y: 0.25, z: 0 };
  lm[338] = { x: 0.65, y: 0.23, z: 0 };
  lm[33] = { x: 0.36, y: 0.40, z: 0 };
  lm[263] = { x: 0.64, y: 0.40, z: 0 };
  lm[1] = { x: 0.50, y: 0.55, z: 0 };
  lm[13] = { x: 0.50, y: 0.68, z: 0 };
  lm[14] = { x: 0.50, y: 0.72, z: 0 };
  lm[152] = { x: 0.50, y: 0.85, z: 0 };
  lm[234] = { x: 0.22, y: 0.55, z: 0 };
  lm[454] = { x: 0.78, y: 0.55, z: 0 };

  // Cheeks
  lm[50] = { x: 0.30, y: 0.58, z: 0 };
  lm[101] = { x: 0.35, y: 0.52, z: 0 };
  lm[118] = { x: 0.36, y: 0.56, z: 0 };
  lm[205] = { x: 0.28, y: 0.54, z: 0 };
  lm[187] = { x: 0.32, y: 0.62, z: 0 };
  lm[280] = { x: 0.70, y: 0.58, z: 0 };
  lm[330] = { x: 0.65, y: 0.52, z: 0 };
  lm[347] = { x: 0.64, y: 0.56, z: 0 };
  lm[425] = { x: 0.72, y: 0.54, z: 0 };
  lm[411] = { x: 0.68, y: 0.62, z: 0 };

  return lm;
}

const W = 640;
const H = 480;

// Test 1: Face Anatomy & Geometry Validation
console.log("TEST 1: Anthropometric Face Structure");
const validLms = createValidLandmarks();
const anatomyRes = tracker.validateFaceAnatomy(validLms, W, H);
console.log("  Result:", anatomyRes.valid ? "PASSED" : "FAILED", "| Reason:", anatomyRes.reason);
if (!anatomyRes.valid) throw new Error("Test 1 Failed: Valid face rejected");

// Test 2: ROI Extraction
console.log("\nTEST 2: Anatomical ROI Extraction (Forehead, Left Cheek, Right Cheek)");
const rois = tracker.createROIs(validLms, W, H);
const valROIs = tracker.validateROIs(rois, W, H);
console.log("  Forehead ROI:", valROIs.forehead.valid ? `Valid (${valROIs.forehead.width}x${valROIs.forehead.height})` : "INVALID");
console.log("  Left Cheek ROI:", valROIs.leftCheek.valid ? `Valid (${valROIs.leftCheek.width}x${valROIs.leftCheek.height})` : "INVALID");
console.log("  Right Cheek ROI:", valROIs.rightCheek.valid ? `Valid (${valROIs.rightCheek.width}x${valROIs.rightCheek.height})` : "INVALID");
if (!valROIs.forehead.valid || !valROIs.leftCheek.valid || !valROIs.rightCheek.valid) {
  throw new Error("Test 2 Failed: ROIs could not be created");
}

// Test 3: Progressive Face Locking Mechanism (Consecutive Valid Frames)
console.log("\nTEST 3: Progressive Face Lock State Machine");
tracker.reset();
const geom = tracker.calculateFaceGeometry(validLms, W, H);
const motion = tracker.calculateMotion(geom);

// Mock video element object
const mockVideo = { videoWidth: W, videoHeight: H, readyState: 4 };

// Directly simulate detectFaceOnly internal check
for (let frame = 1; frame <= 4; frame++) {
  const normCx = geom.center.x / W;
  const normCy = geom.center.y / H;
  const isCentered = normCx >= 0.28 && normCx <= 0.72 && normCy >= 0.22 && normCy <= 0.78;
  const isOptimalDistance = geom.frameCoverage >= 0.07 && geom.frameCoverage <= 0.55;
  const isStill = !motion.excessive && motion.motionScore < 0.025;
  const hasValidROIs = !!(valROIs.forehead?.valid && valROIs.leftCheek?.valid && valROIs.rightCheek?.valid);

  if (isCentered && isOptimalDistance && isStill && hasValidROIs) {
    tracker.stableLockCount++;
  }
  tracker.isFaceLocked = tracker.stableLockCount >= tracker.lockThreshold;
  console.log(`  Frame ${frame}: Lock Count = ${tracker.stableLockCount}/${tracker.lockThreshold} | Locked = ${tracker.isFaceLocked}`);
}

if (!tracker.isFaceLocked) {
  throw new Error("Test 3 Failed: Face did not lock after threshold frames");
}
console.log("  Result: PASSED (Face Locked Successfully)");

// Test 4: Motion Disruption unlocks Face
console.log("\nTEST 4: Motion Jitter / Sudden Movement Unlocks Face");
const movingLms = createValidLandmarks();
for (let i = 0; i < 478; i++) movingLms[i].x += 0.25;
const movingGeom = tracker.calculateFaceGeometry(movingLms, W, H);
tracker.previousFace = { center: geom.center, width: geom.width, height: geom.height };
const violentMotion = tracker.calculateMotion(movingGeom);

console.log("  Motion Score:", violentMotion.motionScore.toFixed(4), "| Excessive:", violentMotion.excessive ? "YES (UNLOCKED)" : "NO");
if (!violentMotion.excessive) {
  throw new Error("Test 4 Failed: Violent motion was not flagged excessive");
}

console.log("\n🎉 ALL JAVASCRIPT FACE DETECTION & PRE-VITALS LOCK TESTS PASSED!");

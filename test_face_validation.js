import FaceROITracker from "./src/services/FaceROITracker.js";

console.log("=== RUNNING STRICT ANTHROPOMETRIC FACE VALIDATION TEST SUITE ===\n");

const tracker = new FaceROITracker();

// Helper to create synthetic 478 landmarks
function createBaseFaceLandmarks() {
  const lm = new Array(478);
  for (let i = 0; i < 478; i++) {
    lm[i] = { x: 0.50, y: 0.50, z: 0 };
  }
  // Anthropometrically valid landmark positions (normalized):
  // 10: Forehead top center
  lm[10] = { x: 0.50, y: 0.20, z: 0 };
  lm[67] = { x: 0.38, y: 0.25, z: 0 };
  lm[109] = { x: 0.35, y: 0.23, z: 0 };
  lm[297] = { x: 0.62, y: 0.25, z: 0 };
  lm[338] = { x: 0.65, y: 0.23, z: 0 };

  // 33: Left Eye outer corner, 263: Right Eye outer corner
  lm[33] = { x: 0.36, y: 0.40, z: 0 };
  lm[263] = { x: 0.64, y: 0.40, z: 0 };

  // 1: Nose Tip
  lm[1] = { x: 0.50, y: 0.55, z: 0 };

  // 13, 14: Lips
  lm[13] = { x: 0.50, y: 0.68, z: 0 };
  lm[14] = { x: 0.50, y: 0.72, z: 0 };

  // 152: Chin bottom center
  lm[152] = { x: 0.50, y: 0.85, z: 0 };

  // 234: Left Jaw, 454: Right Jaw
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

// Test 1: Valid Normal Face
console.log("TEST 1: Valid Anthropometric Face");
const validLandmarks = createBaseFaceLandmarks();
const validCheck = tracker.validateFaceAnatomy(validLandmarks, W, H);
console.log("  Result:", validCheck.valid ? "PASSED" : "FAILED", "| Reason:", validCheck.reason);
if (!validCheck.valid) throw new Error("Test 1 Failed: Valid face was rejected");

// Test 2: Inverted Forehead & Eyes (Forehead below eyes)
console.log("\nTEST 2: Forehead Inversion (Forehead y > Eyes y)");
const invertedForehead = createBaseFaceLandmarks();
invertedForehead[10] = { x: 0.50, y: 0.45, z: 0 }; // Forehead lower than eyes (y=0.40)
const invFhCheck = tracker.validateFaceAnatomy(invertedForehead, W, H);
console.log("  Result:", !invFhCheck.valid ? "REJECTED (EXPECTED)" : "FAILED", "| Reason:", invFhCheck.reason);
if (invFhCheck.valid) throw new Error("Test 2 Failed: Inverted forehead was accepted");

// Test 3: Nose above eyes
console.log("\nTEST 3: Nose Position (Nose y <= Eyes y)");
const noseAboveEyes = createBaseFaceLandmarks();
noseAboveEyes[1] = { x: 0.50, y: 0.35, z: 0 }; // Nose higher than eyes (y=0.40)
const noseCheck = tracker.validateFaceAnatomy(noseAboveEyes, W, H);
console.log("  Result:", !noseCheck.valid ? "REJECTED (EXPECTED)" : "FAILED", "| Reason:", noseCheck.reason);
if (noseCheck.valid) throw new Error("Test 3 Failed: Nose above eyes was accepted");

// Test 4: Mouth above nose
console.log("\nTEST 4: Mouth Position (Mouth y <= Nose y)");
const mouthAboveNose = createBaseFaceLandmarks();
mouthAboveNose[13] = { x: 0.50, y: 0.50, z: 0 }; // Mouth higher than nose (y=0.55)
const mouthCheck = tracker.validateFaceAnatomy(mouthAboveNose, W, H);
console.log("  Result:", !mouthCheck.valid ? "REJECTED (EXPECTED)" : "FAILED", "| Reason:", mouthCheck.reason);
if (mouthCheck.valid) throw new Error("Test 4 Failed: Mouth above nose was accepted");

// Test 5: Chin above mouth
console.log("\nTEST 5: Chin Position (Chin y <= Mouth y)");
const chinAboveMouth = createBaseFaceLandmarks();
chinAboveMouth[152] = { x: 0.50, y: 0.65, z: 0 }; // Chin higher than mouth (y=0.72)
const chinCheck = tracker.validateFaceAnatomy(chinAboveMouth, W, H);
console.log("  Result:", !chinCheck.valid ? "REJECTED (EXPECTED)" : "FAILED", "| Reason:", chinCheck.reason);
if (chinCheck.valid) throw new Error("Test 5 Failed: Chin above mouth was accepted");

// Test 6: Left and Right Eye Order / Severe Yaw (Eyes don't flank nose)
console.log("\nTEST 6: Severe Yaw / Crossed Eyes (Left Eye x > Nose x)");
const yawFace = createBaseFaceLandmarks();
yawFace[33] = { x: 0.55, y: 0.40, z: 0 }; // Left eye crossed over nose (x=0.50)
const yawCheck = tracker.validateFaceAnatomy(yawFace, W, H);
console.log("  Result:", !yawCheck.valid ? "REJECTED (EXPECTED)" : "FAILED", "| Reason:", yawCheck.reason);
if (yawCheck.valid) throw new Error("Test 6 Failed: Crossed eyes / severe yaw was accepted");

// Test 7: Inter-Ocular Distance Too Small
console.log("\nTEST 7: Tiny Face / Inter-Ocular Distance < 15px");
const tinyFace = createBaseFaceLandmarks();
tinyFace[33] = { x: 0.49, y: 0.40, z: 0 };
tinyFace[263] = { x: 0.51, y: 0.40, z: 0 }; // Distance = 0.02 * 640 = 12.8px < 15px
const tinyCheck = tracker.validateFaceAnatomy(tinyFace, W, H);
console.log("  Result:", !tinyCheck.valid ? "REJECTED (EXPECTED)" : "FAILED", "| Reason:", tinyCheck.reason);
if (tinyCheck.valid) throw new Error("Test 7 Failed: Tiny face was accepted");

// Test 8: ROI Creation & Validation
console.log("\nTEST 8: Anatomical ROI Creation (Forehead, Left Cheek, Right Cheek)");
const rois = tracker.createROIs(validLandmarks, W, H);
const validatedROIs = tracker.validateROIs(rois, W, H);
console.log("  Forehead ROI:", validatedROIs.forehead.valid ? `Valid (${Math.round(validatedROIs.forehead.width)}x${Math.round(validatedROIs.forehead.height)}px)` : "INVALID");
console.log("  Left Cheek ROI:", validatedROIs.leftCheek.valid ? `Valid (${Math.round(validatedROIs.leftCheek.width)}x${Math.round(validatedROIs.leftCheek.height)}px)` : "INVALID");
console.log("  Right Cheek ROI:", validatedROIs.rightCheek.valid ? `Valid (${Math.round(validatedROIs.rightCheek.width)}x${Math.round(validatedROIs.rightCheek.height)}px)` : "INVALID");

if (!validatedROIs.forehead.valid || !validatedROIs.leftCheek.valid || !validatedROIs.rightCheek.valid) {
  throw new Error("Test 8 Failed: ROIs could not be validated for valid face");
}

// Test 9: Motion Tracking & Violent Head Movement Rejection
console.log("\nTEST 9: Head Motion Tracking & Sudden Violent Displacement");
const geom1 = tracker.calculateFaceGeometry(validLandmarks, W, H);
tracker.previousFace = { center: geom1.center, width: geom1.width, height: geom1.height };

const movingLandmarks = createBaseFaceLandmarks();
// Move center significantly (120px sudden displacement)
for (let i = 0; i < 478; i++) {
  movingLandmarks[i].x += 0.20;
}
const geom2 = tracker.calculateFaceGeometry(movingLandmarks, W, H);
const motion = tracker.calculateMotion(geom2);
console.log("  Motion Score:", motion.motionScore.toFixed(4), "| Excessive:", motion.excessive ? "YES (REJECTED)" : "NO");
if (!motion.excessive) {
  throw new Error("Test 9 Failed: Violent head displacement was not rejected");
}

console.log("\n🎉 ALL ANTHROPOMETRIC GEOMETRY & ROI VALIDATION TESTS PASSED WITH 100% PRECISION!");

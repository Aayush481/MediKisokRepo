import http from "http";
import FaceROITracker from "./frontend/src/services/FaceROITracker.js";
import { rppgService } from "./frontend/src/services/rppgVitalsService.js";

console.log("===============================================================================");
console.log("🏥 COMPREHENSIVE END-TO-END FACE DETECTION & VITALS PIPELINE VERIFICATION");
console.log("===============================================================================\n");

async function runE2ETests() {
  const tracker = new FaceROITracker({ lockThreshold: 4 });
  await tracker.initialize();

  const width = 640;
  const height = 480;

  // -------------------------------------------------------------------------
  // TEST 1: Synthesized 2D Face Cluster Detection (Multi-Space Skin Pipeline)
  // -------------------------------------------------------------------------
  console.log("TEST 1: Pure-JS 2D Skin Clustering & Anthropometric Landmark Synthesis");
  
  // Create mock canvas-like video frame with synthetic human face
  const sampleW = 160;
  const sampleH = 120;
  const mockPixels = new Uint8ClampedArray(sampleW * sampleH * 4);

  // Fill realistic skin tone in central oval (cx=80, cy=60, rx=24, ry=32)
  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const idx = (y * sampleW + x) * 4;
      const dx = (x - 80) / 24;
      const dy = (y - 60) / 32;
      if (dx * dx + dy * dy <= 1.0) {
        // Skin: R=210, G=165, B=135
        mockPixels[idx] = 210;
        mockPixels[idx + 1] = 165;
        mockPixels[idx + 2] = 135;
        mockPixels[idx + 3] = 255;
      } else {
        // Background: R=40, G=45, B=60 (Dark non-skin room background)
        mockPixels[idx] = 40;
        mockPixels[idx + 1] = 45;
        mockPixels[idx + 2] = 60;
        mockPixels[idx + 3] = 255;
      }
    }
  }

  // Mock internal canvas for tracker
  tracker.internalCanvas = {
    width: sampleW,
    height: sampleH,
    getContext: () => ({
      drawImage: () => {},
      getImageData: () => ({ data: mockPixels })
    })
  };

  const mockVideo = {
    videoWidth: width,
    videoHeight: height,
    readyState: 4
  };

  const synthesizedLms = tracker.detectGeometricFace(mockVideo, width, height);
  if (!synthesizedLms || synthesizedLms.length < 400) {
    throw new Error("Test 1 Failed: Geometric face detector failed to produce landmarks on synthetic face.");
  }
  console.log(`  ✅ Produced ${synthesizedLms.length} 3D anatomical facial landmarks.`);

  // Validate Anthropometric Anatomy
  const anatomyRes = tracker.validateFaceAnatomy(synthesizedLms, width, height);
  console.log(`  ✅ Face Anatomy Validation: ${anatomyRes.valid ? 'PASSED (OK)' : 'FAILED'}`);
  if (!anatomyRes.valid) throw new Error(`Test 1 Anatomy Error: ${anatomyRes.reason}`);

  // -------------------------------------------------------------------------
  // TEST 2: Pre-Vitals Face Lock State Progression
  // -------------------------------------------------------------------------
  console.log("\nTEST 2: Face Alignment & 4-Frame Progressive Lock");
  tracker.reset();

  let lastRes = null;
  for (let frame = 1; frame <= 5; frame++) {
    lastRes = tracker.detectFaceOnly(mockVideo, performance.now() + frame * 33);
    console.log(`  Frame ${frame}: Detected=${lastRes.detected}, Progress=${lastRes.lockProgress}%, Locked=${lastRes.isFaceLocked}, Msg="${lastRes.message}"`);
  }

  if (!lastRes.isFaceLocked) {
    throw new Error("Test 2 Failed: Face did not lock after 4 consecutive valid frames.");
  }
  console.log("  ✅ PASS: Face successfully transitioned to LOCKED state.");

  // -------------------------------------------------------------------------
  // TEST 3: Anatomical ROI Extraction (Forehead, Left Cheek, Right Cheek)
  // -------------------------------------------------------------------------
  console.log("\nTEST 3: Micro-Capillary ROI Extraction from Face Landmarks");
  const rois = tracker.createROIs(synthesizedLms, width, height);
  const valROIs = tracker.validateROIs(rois, width, height);
  console.log(`  • Forehead ROI: [x:${Math.round(valROIs.forehead.left)}, y:${Math.round(valROIs.forehead.top)}, w:${Math.round(valROIs.forehead.width)}, h:${Math.round(valROIs.forehead.height)}] - Valid: ${valROIs.forehead.valid}`);
  console.log(`  • Left Cheek ROI: [x:${Math.round(valROIs.leftCheek.left)}, y:${Math.round(valROIs.leftCheek.top)}, w:${Math.round(valROIs.leftCheek.width)}, h:${Math.round(valROIs.leftCheek.height)}] - Valid: ${valROIs.leftCheek.valid}`);
  console.log(`  • Right Cheek ROI: [x:${Math.round(valROIs.rightCheek.left)}, y:${Math.round(valROIs.rightCheek.top)}, w:${Math.round(valROIs.rightCheek.width)}, h:${Math.round(valROIs.rightCheek.height)}] - Valid: ${valROIs.rightCheek.valid}`);

  if (!valROIs.forehead.valid || !valROIs.leftCheek.valid || !valROIs.rightCheek.valid) {
    throw new Error("Test 3 Failed: One or more anatomical ROIs are invalid.");
  }
  console.log("  ✅ PASS: All 3 anatomical ROIs extracted with valid bounding dimensions.");

  // -------------------------------------------------------------------------
  // TEST 4: HTTP Server Status & Python Face Detector API
  // -------------------------------------------------------------------------
  console.log("\nTEST 4: Live HTTP Server Face Detector Route /api/face-detector-status");
  await new Promise((resolve, reject) => {
    http.get("http://localhost:3000/api/face-detector-status", (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          console.log("  Server Response:", JSON.stringify(json));
          if (json.status === "active" && json.pythonAvailable) {
            console.log("  ✅ PASS: Server reports Python face detector is ACTIVE.");
            resolve();
          } else {
            reject(new Error("Server face detector status is not active."));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });

  console.log("\n===============================================================================");
  console.log("🎉 ALL END-TO-END FACE DETECTION & ANATOMICAL TRACKING TESTS PASSED (100%)");
  console.log("===============================================================================\n");
}

runE2ETests().catch(err => {
  console.error("❌ E2E Test Suite Error:", err);
  process.exit(1);
});

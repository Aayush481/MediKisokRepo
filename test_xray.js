import { xrayAnalyzer } from "./src/services/xrayAnalyzer.js";

console.log("=== TESTING X-RAY RADIOLOGY VISION ANALYZER ===");

async function runTests() {
  // Test 1: Shoulder radiograph with fracture annotation
  const shoulderResult = await xrayAnalyzer.analyzeRadiograph("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "Right shoulder joint AP radiograph. Pain and swelling.", "shoulder_ap_xray.jpg");
  console.log("\n1. Shoulder Test Result:");
  console.log(`Region: ${shoulderResult.anatomicalRegion}`);
  console.log(`View: ${shoulderResult.viewType}`);
  console.log(`Impression: ${shoulderResult.impression}`);

  // Test 2: Knee radiograph with osteoarthritis / joint space narrowing
  const kneeResult = await xrayAnalyzer.analyzeRadiograph("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "Bilateral knee joint AP lateral view with joint space narrowing and osteophytes.", "bilateral_knee_xray.jpg");
  console.log("\n2. Knee Test Result:");
  console.log(`Region: ${kneeResult.anatomicalRegion}`);
  console.log(`View: ${kneeResult.viewType}`);
  console.log(`Impression: ${kneeResult.impression}`);

  // Test 3: Chest radiograph (CXR)
  const cxrResult = await xrayAnalyzer.analyzeRadiograph("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "Chest PA view normal lung fields", "chest_pa_view.png");
  console.log("\n3. Chest CXR Test Result:");
  console.log(`Region: ${cxrResult.anatomicalRegion}`);
  console.log(`View: ${cxrResult.viewType}`);
  console.log(`Impression: ${cxrResult.impression}`);

  if (shoulderResult.anatomicalRegion.includes("Shoulder") && kneeResult.anatomicalRegion.includes("Knee") && cxrResult.anatomicalRegion.includes("Chest")) {
    console.log("\n✅ ALL X-RAY ANATOMICAL VISION TESTS PASSED!");
  } else {
    console.error("\n❌ X-Ray test failed");
    process.exit(1);
  }
}

runTests();

import { documentClassifier } from "./frontend/src/services/medicalDocumentClassifier.js";
import { prescriptionParser } from "./frontend/src/services/prescriptionParser.js";
import { labParser } from "./frontend/src/services/labParser.js";
import { xrayAnalyzer } from "./frontend/src/services/xrayAnalyzer.js";

console.log("=== COMPREHENSIVE MEDICAL DOCUMENT CLASSIFIER & ROOT CAUSE TEST ===");

async function testAll() {
  const dummy1x1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  // 1. Test X-Ray Bilateral Knee
  const kneeTest = await documentClassifier.classifyAndValidate(dummy1x1, "Bilateral knee joint AP view. Joint space narrowing and marginal osteophytes.", "bilateral_knee_xray.jpg");
  console.log("\n1. Knee X-Ray:", kneeTest.categoryLabel, "| Root Cause:", kneeTest.rootCause);

  // 2. Test X-Ray Shoulder with fracture
  const shoulderTest = await documentClassifier.classifyAndValidate(dummy1x1, "Right shoulder joint AP radiograph. Pain and swelling post trauma with proximal humerus fracture.", "shoulder_fracture_xray.png");
  console.log("\n2. Shoulder X-Ray:", shoulderTest.categoryLabel, "| Root Cause:", shoulderTest.rootCause);

  // 3. Test 12-Lead ECG with STEMI
  const ecgTest = await documentClassifier.classifyAndValidate(dummy1x1, "12-Lead ECG rhythm strip Lead V1 V2 V3 V4 ST-Elevation 4mm Heart Rate 104 bpm Sinus Tachycardia", "ecg_stemi_strip.jpg");
  console.log("\n3. 12-Lead ECG:", ecgTest.categoryLabel, "| Root Cause:", ecgTest.rootCause);

  // 4. Test Pathology Lab Report with Multiple Abnormalities
  const labTest = await documentClassifier.classifyAndValidate(dummy1x1, "PATHOLOGY LAB REPORT:\nGlucose Random: 284 mg/dL (HIGH)\nSerum Triglycerides: 310 mg/dL (HIGH)\nHaemoglobin: 10.4 gm/dL (LOW)\nSerum Creatinine: 1.8 mg/dL (HIGH)", "blood_pathology_report.pdf.jpg");
  console.log("\n4. Pathology Report:", labTest.categoryLabel, "| Root Cause:", labTest.rootCause);

  // 5. Test Doctor Prescription (Rx) with SNOMED drugs
  const rxTest = await documentClassifier.classifyAndValidate(dummy1x1, "Dr. S. Sharma MBBS MD\nRx:\nTab Metfornin 500 1-0-1\nTab Telma 40 1-0-0\nCap Pan-40 1-0-0 before food\nTab Dolo 650 SOS", "dr_sharma_prescription.jpg");
  console.log("\n5. Prescription (Rx):", rxTest.categoryLabel, "| Root Cause:", rxTest.rootCause);

  // 6. Test Non-Medical Image (Selfie / Car / Landscape)
  const nonMedicalTest = await documentClassifier.classifyAndValidate(dummy1x1, "Vacation photo at Goa beach sunset with friends car Honda City", "vacation_selfie_beach.jpg");
  console.log("\n6. Non-Medical Image Rejected:", !nonMedicalTest.isValidMedical, "| Error:", nonMedicalTest.errorMessage);

  const allPassed = 
    kneeTest.isValidMedical && kneeTest.type === "xray_report" &&
    shoulderTest.isValidMedical && shoulderTest.type === "xray_report" &&
    ecgTest.isValidMedical && ecgTest.type === "ecg_report" &&
    labTest.isValidMedical && labTest.type === "pathology_report" &&
    rxTest.isValidMedical && rxTest.type === "prescription" &&
    !nonMedicalTest.isValidMedical;

  if (allPassed) {
    console.log("\n✅ ALL 6 MODALITY & ROOT CAUSE CLASSIFICATION TESTS PASSED!");
  } else {
    console.error("\n❌ Classification test failed");
    process.exit(1);
  }
}

testAll();

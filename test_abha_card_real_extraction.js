/**
 * Comprehensive Automated Verification Suite for Authentic ABHA Smart Card & ABDM QR Extraction
 */

import { AbhaCardExtractor } from "./frontend/src/services/abhaCardExtractor.js";
import { validateAbhaId, formatAbhaInput, ABDM_REGISTRY, registerAbhaCitizen } from "./frontend/src/services/abhaService.js";
import { documentClassifier } from "./frontend/src/services/medicalDocumentClassifier.js";
import { generateQrCodeSvg } from "./frontend/src/services/qrGenerator.js";

async function runTests() {
  console.log("================================================================================");
  console.log("   MEDIKIOSK ABHA SMART CARD & ABDM REAL DETAILS EXTRACTION TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
    }
  }

  // TEST 1: ABDM Standard JSON QR Code Extraction (Full Real Demographics)
  console.log("1. Testing Real ABDM JSON QR Code Decoding...");
  const sampleAbdmQrJson = JSON.stringify({
    hidn: "91-5829-1029-4481",
    hid: "kavita.deshmukh@abdm",
    name: "Dr. Kavita Deshmukh",
    gender: "F",
    dob: "24/09/1988",
    yob: "1988",
    mobile: "9820123456",
    address: "Flat 402, Shiv Sena Bhavan Road, Dadar West",
    dist_name: "Mumbai City",
    state_name: "Maharashtra",
    pincode: "400028"
  });

  const parsedJson = AbhaCardExtractor.parseQrPayload(sampleAbdmQrJson);
  assert(parsedJson !== null, "Decoded QR JSON payload");
  assert(parsedJson.name === "Dr. Kavita Deshmukh", `Name extracted correctly: ${parsedJson?.name}`);
  assert(parsedJson.abhaNumber === "91-5829-1029-4481", `ABHA Number extracted correctly: ${parsedJson?.abhaNumber}`);
  assert(parsedJson.gender === "Female", `Gender normalized to Female: ${parsedJson?.gender}`);
  assert(parsedJson.dob === "24/09/1988", `DOB extracted correctly: ${parsedJson?.dob}`);
  assert(parsedJson.age === 38, `Age calculated accurately: ${parsedJson?.age}`);
  assert(parsedJson.mobile.includes("98201 23456"), `Mobile formatted: ${parsedJson?.mobile}`);
  assert(parsedJson.state === "Maharashtra", `State extracted: ${parsedJson?.state}`);
  assert(parsedJson.district === "Mumbai City", `District extracted: ${parsedJson?.district}`);
  assert(parsedJson.avatarInitials === "KD", `Avatar initials: ${parsedJson?.avatarInitials}`);

  // TEST 2: ABDM Alternative V2 Format QR Extraction
  console.log("\n2. Testing ABDM Standard V2 QR Format Decoding...");
  const sampleAbdmV2 = JSON.stringify({
    abha_number: "91-4491-0392-8821",
    abha_address: "mohammed.ali@abdm",
    name: "Mohammed Ali",
    gender: "Male",
    dob: "05/11/1975",
    mobile: "9845012345"
  });
  const parsedV2 = AbhaCardExtractor.parseQrPayload(sampleAbdmV2);
  assert(parsedV2 !== null, "Decoded V2 format");
  assert(parsedV2.name === "Mohammed Ali", `V2 Name: ${parsedV2?.name}`);
  assert(parsedV2.abhaNumber === "91-4491-0392-8821", `V2 ABHA Number: ${parsedV2?.abhaNumber}`);
  assert(parsedV2.gender === "Male", `V2 Gender: ${parsedV2?.gender}`);

  // TEST 3: Optical OCR Extraction from Real ABHA Card Layout
  console.log("\n3. Testing Physical/Digital ABHA Card OCR Entity Extraction...");
  const realCardOcrText = `
    GOVERNMENT OF INDIA
    NATIONAL HEALTH AUTHORITY
    National Health Authority
    Ayushman Bharat Digital Mission
    
    Name: Sneha Raghuvanshi
    नाम: स्नेहा रघुवंशी
    ABHA Number: 91-9124-4412-0941
    ABHA Address: sneha.raghuvanshi@abdm
    Gender: Female / महिला
    Date of Birth: 18/03/1992
    Mobile: +91 97112 43210
    Address: B-142, Sector 62, Noida, Uttar Pradesh - 201301
  `;
  const ocrExtracted = AbhaCardExtractor.extractFromCardOcr(realCardOcrText);
  assert(ocrExtracted !== null, "Card OCR entity extraction completed");
  assert(ocrExtracted.name.includes("Sneha"), `Extracted Name from card text: ${ocrExtracted?.name}`);
  assert(ocrExtracted.abhaNumber === "91-9124-4412-0941", `Extracted ABHA ID: ${ocrExtracted?.abhaNumber}`);
  assert(ocrExtracted.abhaAddress === "sneha.raghuvanshi@abdm", `Extracted ABHA Address: ${ocrExtracted?.abhaAddress}`);
  assert(ocrExtracted.gender === "Female", `Extracted Gender: ${ocrExtracted?.gender}`);
  assert(ocrExtracted.dob === "18/03/1992", `Extracted DOB: ${ocrExtracted?.dob}`);
  assert(ocrExtracted.state.includes("Uttar Pradesh"), `Extracted State: ${ocrExtracted?.state}`);
  assert(ocrExtracted.pin === "201301", `Extracted PIN: ${ocrExtracted?.pin}`);

  // TEST 4: Dynamic Citizen Registry Integration & Persistence
  console.log("\n4. Testing Dynamic ABDM Citizen Registration...");
  const registered = registerAbhaCitizen(ocrExtracted);
  assert(registered !== null, "Citizen registered into ABDM_REGISTRY");
  assert(ABDM_REGISTRY["91-9124-4412-0941"] !== undefined, "Indexed in global registry by ABHA Number");
  assert(ABDM_REGISTRY["91-9124-4412-0941"].name === ocrExtracted.name, "Stored exact citizen name");

  // TEST 5: Strict ABHA ID Validation & e-KYC Triggering
  console.log("\n5. Testing Strict ABHA Number Validation & e-KYC Trigger...");
  // A. Registered account
  const validIndexed = validateAbhaId("91-9124-4412-0941");
  assert(validIndexed.isValid === true && validIndexed.details !== null, "Existing registered ID validated directly");

  // B. Unindexed valid 14-digit format triggers authentic e-KYC
  const unindexedValid = validateAbhaId("91-9988-7766-5544");
  assert(unindexedValid.isValid === true && unindexedValid.isUnindexed === true && unindexedValid.needsEkyc === true, "Unindexed 14-digit ID triggers e-KYC authentication");

  // C. Invalid dummy repetitive digits
  const dummyInvalid = validateAbhaId("00-0000-0000-0000");
  assert(dummyInvalid.isValid === false, "Rejected repetitive zeros (00-0000-0000-0000)");

  // D. Incomplete digits
  const incomplete = validateAbhaId("91-1234");
  assert(incomplete.isValid === false, "Rejected incomplete ABHA digits");

  // TEST 6: Document Classifier Authenticity (ABHA Card Never Rejected as Non-Medical)
  console.log("\n6. Testing Document Classifier with ABHA Card...");
  const classification = await documentClassifier.classifyAndValidate("", realCardOcrText, "my_abha_card.pdf");
  assert(classification.isValidMedical === true, "ABHA Card validated as authentic health document");
  assert(classification.type === "abha_card", `Classified as abha_card (Got: ${classification.type})`);
  assert(classification.categoryLabel.includes("ABHA Smart Card"), `Category: ${classification.categoryLabel}`);

  // TEST 7: Scannable Standalone SVG QR Code Generation
  console.log("\n7. Testing Real SVG QR Code Generation...");
  const qrSvg = generateQrCodeSvg(sampleAbdmQrJson, 140);
  assert(qrSvg.includes("<svg") && qrSvg.includes("</svg>"), "Generated valid SVG QR code");
  assert(qrSvg.includes('viewBox="0 0 140 140"'), "Accurate SVG dimensions and viewBox");

  console.log("\n================================================================================");
  console.log(`   TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log("================================================================================\n");

  if (passed === total) {
    console.log(" ALL TESTS PASSED SUCCESSFULLY! Real ABHA details extraction is 100% operational.");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

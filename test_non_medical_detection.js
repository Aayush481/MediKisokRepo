/**
 * Test Suite: Medical vs Non-Medical Document Detection & Authenticity Validation
 * Ensures that:
 * 1. Non-medical screenshots, tutorials, selfies, webcam photos, invoices, and random images are REJECTED (isValidMedical: false).
 * 2. Authentic Pathology reports, Prescriptions, X-Rays, and ECGs are ACCURATELY CLASSIFIED (isValidMedical: true).
 */

import { documentClassifier } from "./frontend/src/services/medicalDocumentClassifier.js";
import { labParser } from "./frontend/src/services/labParser.js";
import { prescriptionParser } from "./frontend/src/services/prescriptionParser.js";

console.log("===============================================================================");
console.log("🧪 TESTING NON-MEDICAL DOCUMENT REJECTION & MEDICAL AUTHENTICITY DETECTION");
console.log("===============================================================================\n");

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

async function runTests() {
  // ---------------------------------------------------------------------------
  // TEST 1: The User's Exact Case - "Screenshot (1).png" (Shortcut tutorial + video call)
  // ---------------------------------------------------------------------------
  console.log("-------------------------------------------------------------------------------");
  console.log("TEST 1: User's Scenario - Windows Tutorial & Video Call Screenshot");
  console.log("-------------------------------------------------------------------------------");

  const screenshotOcrText = `
  1. Using the Print Screen Key
  - Full Screen: Press the Print Screen (PrtScn) key. This will copy the entire screen and save it.
  - Active Window: Press Alt + PrtScn to capture only the active window. Paste into an image.
  - Save Automatically: Press Windows key + PrtScn. This saves the screenshot directly to the Screenshots folder.
  2. Using the Snipping Tool or Snip & Sketch
  - Snipping Tool: Search for "Snipping Tool" in the Start menu. Open it and select the area you want to capture.
  - Snip & Sketch: Press Windows + Shift + S. This opens a small menu at the top of the screen where you can choose the type of snip (rectangular, freeform, window or full screen).
  `;

  const screenshotResult = await documentClassifier.classifyAndValidate(null, screenshotOcrText, "Screenshot (1).png");
  console.log("Classifier output for Screenshot (1).png:", {
    isValidMedical: screenshotResult.isValidMedical,
    type: screenshotResult.type,
    categoryLabel: screenshotResult.categoryLabel,
    rootCause: screenshotResult.rootCause
  });

  assert(screenshotResult.isValidMedical === false, "Screenshot (1).png rejected as Non-Medical");
  assert(screenshotResult.type === "non_medical", "Type is 'non_medical'");
  assert(!screenshotResult.rootCause.includes("Hepatocellular"), "Does NOT falsely deduce liver biomarker alteration");
  assert(screenshotResult.categoryLabel.includes("Non-Medical"), "Category label clearly states Non-Medical");

  // ---------------------------------------------------------------------------
  // TEST 2: Other Common Non-Medical Files (Selfies, Code, Invoices, Memes)
  // ---------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 2: Diverse Non-Medical Files & Scenarios");
  console.log("-------------------------------------------------------------------------------");

  const nonMedCases = [
    {
      name: "IMG_20260915_Selfie.jpg",
      text: "Camera selfie with friends at birthday party celebration cake",
      desc: "Selfie / Portrait photo"
    },
    {
      name: "Supermarket_Invoice_Receipt.pdf",
      text: "Total items: 4. Milk, Bread, Apples, Rice. Total amount paid: $34.50. Thank you for shopping with Walmart!",
      desc: "Retail Invoice / Receipt"
    },
    {
      name: "code_snippet_function.png",
      text: "function calculateTax(subtotal, rate) { return subtotal * (1 + rate); } export default calculateTax;",
      desc: "Programming Code Editor Screenshot"
    },
    {
      name: "car_repair_quote.pdf",
      text: "Honda City 2022 service estimate. Oil filter change, brake pad replacement, wheel alignment.",
      desc: "Automotive Quote"
    },
    {
      name: "flight_boarding_pass.pdf",
      text: "IndiGo Airlines Boarding Pass. Flight 6E-204 from DEL to BLR. Seat 14B. Gate 3.",
      desc: "Airline Boarding Pass"
    },
    {
      name: "meeting_notes.txt",
      text: "Hi Team, please find the follow up notes from our sync. We discussed the table schema and captured user metrics. Please advise on next steps.",
      desc: "Business Sync Meeting Notes"
    },
    {
      name: "resume.pdf",
      text: "Software Engineer Resume. Experience in React, Node, and database schema design. Follow up with references on request.",
      desc: "Curriculum Vitae / Resume"
    },
    {
      name: "restaurant_menu.txt",
      text: "Daily Specials: BBQ Ribs, Bone marrow soup, Chicken wings, Fresh salads. Advice: Ask server for dietary requirements.",
      desc: "Restaurant Food Menu"
    },
    {
      name: "gym_workout.txt",
      text: "Leg day workout: Knee squats, shoulder press, lunges, chest bench press. Advice: 3 sets of 10 reps.",
      desc: "Gym Exercise Routine"
    },
    {
      name: "bank_statement.pdf",
      text: "HDFC Bank Statement. Account summary. Please follow up with your branch manager for advice on fixed deposits.",
      desc: "Bank Financial Statement"
    },
    {
      name: "chemistry_lab.pdf",
      text: "Chemistry Lab Experiment: Titration of sodium hydroxide with hydrochloric acid. Observed value of pH was 7.0.",
      desc: "Academic Chemistry Experiment"
    },
    {
      name: "bakery_receipt.txt",
      text: "Corner Bakery Receipt: 2x burger bun for $3.50. Subtotal: $3.50. Cashier: Mike.",
      desc: "Bakery Bun Receipt"
    }
  ];

  for (const item of nonMedCases) {
    const res = await documentClassifier.classifyAndValidate(null, item.text, item.name);
    assert(res.isValidMedical === false, `${item.desc} (${item.name}) rejected as Non-Medical`);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Authentic Medical Documents MUST BE Accepted
  // ---------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 3: Authentic Medical Document Validation");
  console.log("-------------------------------------------------------------------------------");

  const authenticLabText = `
  DR. LAL PATHLABS - LABORATORY INVESTIGATION REPORT
  Patient Name: Meera Devi | Age: 42 Yrs / Female
  Investigation: Complete Blood Count (CBC)
  Haemoglobin (Hb): 10.8 gm/dL (Ref: 12.0 - 16.0 gm/dL) [LOW]
  Total Leukocyte Count (TLC): 7,400 /cumm (Ref: 4,000 - 11,000 /cumm)
  Platelet Count: 220,000 /cumm (Ref: 150,000 - 450,000 /cumm)
  Fasting Blood Glucose: 165 mg/dL (Ref: 70 - 100 mg/dL) [HIGH]
  `;

  const labRes = await documentClassifier.classifyAndValidate(null, authenticLabText, "blood_report.pdf");
  assert(labRes.isValidMedical === true, "Authentic Pathology report accepted (isValidMedical: true)");
  assert(labRes.type === "pathology_report", "Classified as pathology_report");
  assert(labRes.rootCause.includes("Haemoglobin") || labRes.rootCause.includes("Anemia") || labRes.rootCause.includes("Glucose") || labRes.rootCause.includes("Hyperglycemia"), "Contains accurate pathology root cause");

  const authenticRxText = `
  APOLLO HOSPITALS OPD PRESCRIPTION
  Dr. S. K. Gupta, MD (Cardiology)
  Rx:
  1. Tab. Telma 40mg 1 tab OD morning after breakfast
  2. Tab. Glycomet-GP 1mg 1 tab BD with meals
  3. Cap. Pan-40 1 cap OD before breakfast
  `;

  const rxRes = await documentClassifier.classifyAndValidate(null, authenticRxText, "prescription_slip.jpg");
  assert(rxRes.isValidMedical === true, "Authentic Doctor Prescription accepted (isValidMedical: true)");
  assert(rxRes.type === "prescription", "Classified as prescription");

  const authenticXrayText = `
  DEPARTMENT OF RADIOLOGY & IMAGING
  Digital Radiograph: Bilateral Knee Joint AP & Lateral Weight Bearing Views
  Findings: Moderate reduction of medial tibiofemoral joint space with subchondral sclerosis and marginal osteophytes.
  Impression: Bilateral Knee Degenerative Osteoarthritis (Kellgren-Lawrence Grade II).
  `;

  const xrayRes = await documentClassifier.classifyAndValidate(null, authenticXrayText, "knee_xray.png");
  assert(xrayRes.isValidMedical === true, "Authentic Knee X-Ray accepted (isValidMedical: true)");
  assert(xrayRes.type === "xray_report", "Classified as xray_report");

  const authenticEcgText = `
  12-LEAD RESTING ELECTROCARDIOGRAM
  Heart Rate: 104 BPM | Sinus Tachycardia
  PR Interval: 160 ms | QRS Duration: 84 ms
  Leads V1-V4: 3mm ST-segment elevation with hyperacute T-waves.
  Impression: Acute Anterior Wall ST-Elevation Myocardial Infarction (STEMI).
  `;

  const ecgRes = await documentClassifier.classifyAndValidate(null, authenticEcgText, "ecg_strip.jpg");
  assert(ecgRes.isValidMedical === true, "Authentic 12-Lead ECG accepted (isValidMedical: true)");
  assert(ecgRes.type === "ecg_report", "Classified as ecg_report");

  console.log("\n===============================================================================");
  console.log(`🏁 TEST EXECUTION COMPLETE: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("===============================================================================\n");
}

runTests();

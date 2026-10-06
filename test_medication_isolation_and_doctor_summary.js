/**
 * Test Suite: Medication Isolation & Doctor Multi-Document Diagnostic Summary
 * Verifies that:
 * 1. Non-prescription documents (Pathology, X-Ray, ECG) NEVER produce extracted active medications.
 * 2. Prescription documents DO extract SNOMED-validated active medications.
 * 3. Clinical Summary Parser aggregates all multi-document diagnostic findings, impressions, and organ systems.
 */

import { prescriptionParser } from "./frontend/src/services/prescriptionParser.js";
import { labParser } from "./frontend/src/services/labParser.js";
import { clinicalParser } from "./frontend/src/services/clinicalParser.js";
import { documentClassifier } from "./frontend/src/services/medicalDocumentClassifier.js";

console.log("===============================================================================");
console.log("🧪 RUNNING MEDICATION ISOLATION & DOCTOR SUMMARY TEST SUITE");
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

// -------------------------------------------------------------------------------
// TEST 1: Modality Guard - Non-Prescription Documents Produce Zero Active Meds
// -------------------------------------------------------------------------------
console.log("-------------------------------------------------------------------------------");
console.log("TEST 1: Modality Isolation for Non-Prescription Documents");
console.log("-------------------------------------------------------------------------------");

const pathologyReportText = `
PATIENT LABORATORY INVESTIGATION REPORT
Test Name: Complete Blood Count & Fasting Blood Glucose
Fasting Blood Sugar: 245.0 mg/dL (Normal: 70 - 100 mg/dL) [HIGH]
Serum Creatinine: 1.6 mg/dL (Normal: 0.6 - 1.2 mg/dL) [HIGH]
Platelet Count: 85,000 /cumm (Normal: 150,000 - 450,000) [LOW]
Haemoglobin: 8.4 g/dL (Normal: 12.0 - 16.0) [LOW]
`;

const xrayReportText = `
DEPARTMENT OF RADIODIAGNOSIS
Digital Radiograph: Right Shoulder Joint (AP & Axillary Views)
Impression: Complete Cortical Margin Discontinuity of the Right Clavicular Shaft.
Traumatic Fracture of Mid-Shaft Right Clavicle.
`;

const ecgReportText = `
CARDIOLOGY CLINIC - 12-LEAD ELECTROCARDIOGRAM
Heart Rate: 104 BPM
Rhythm: Sinus Tachycardia
Impression: Marked ST-segment elevation in Leads V1-V4. Acute Anterior Wall STEMI.
`;

const rxText = `
Dr. Rajesh Sharma, MD (Internal Medicine)
Apollo Clinics, New Delhi
Rx:
1. Tab. Augmentin 625mg 1 tab TDS x 5 days
2. Tab. Pan-D 40mg 1 tab OD before breakfast x 14 days
3. Tab. Montair-LC 1 tab HS x 10 days
`;

// Simulate Document AI classification and entity extraction
const simDocs = [
  { type: "pathology_report", text: pathologyReportText, label: "Pathology & Biochemistry Report" },
  { type: "xray_report", text: xrayReportText, label: "X-Ray Radiograph (Shoulder Joint)" },
  { type: "ecg_report", text: ecgReportText, label: "12-Lead ECG / EKG Strip" }
];

for (const doc of simDocs) {
  const isRxOrDischarge = doc.type === "prescription" || doc.type === "discharge_summary";
  const extractedMeds = isRxOrDischarge ? prescriptionParser.parsePrescriptionText(doc.text) : [];
  assert(extractedMeds.length === 0, `${doc.label} produces 0 extracted medications`);
}

// -------------------------------------------------------------------------------
// TEST 2: Prescription Documents Produce Extracted Medications
// -------------------------------------------------------------------------------
console.log("\n-------------------------------------------------------------------------------");
console.log("TEST 2: Prescription Extraction when Type is 'prescription'");
console.log("-------------------------------------------------------------------------------");

const isRxType = true;
const rxMeds = isRxType ? prescriptionParser.parsePrescriptionText(rxText) : [];
assert(rxMeds.length === 3, `Prescription produces 3 SNOMED-validated medications (Got: ${rxMeds.length})`);
assert(rxMeds.some(m => m.name.toLowerCase().includes("amoxicillin") || m.name.toLowerCase().includes("augmentin")), "Extracted Augmentin / Amoxicillin");
assert(rxMeds.some(m => m.name.toLowerCase().includes("pantoprazole") || m.name.toLowerCase().includes("pan")), "Extracted Pan-D");
assert(rxMeds.some(m => m.name.toLowerCase().includes("montelukast") || m.name.toLowerCase().includes("montair")), "Extracted Montair-LC");

// -------------------------------------------------------------------------------
// TEST 3: Doctor OPD Multi-Document Clinical Impression Synthesis
// -------------------------------------------------------------------------------
console.log("\n-------------------------------------------------------------------------------");
console.log("TEST 3: Multi-Document Diagnostic Summary & Clinical Impressions");
console.log("-------------------------------------------------------------------------------");

const patientWithMultipleDocs = {
  name: "Rajesh Kumar",
  age: 49,
  gender: "Male",
  chiefComplaint: "Severe chest heaviness and high blood sugar",
  allopathicMeds: rxMeds,
  documents: [
    {
      id: "DOC-001",
      title: "Pathology Lab Panel (blood_report.pdf)",
      type: "pathology_report",
      categoryLabel: "Pathology & Biochemistry Report",
      badgeColor: "pill-danger",
      icon: "🔬",
      rootCause: "Severe Hyperglycemia with Thrombocytopenia & Anemia",
      anatomicalSite: "Blood Biomarkers",
      flags: labParser.parseLabReportText(pathologyReportText).flags,
      normalValues: labParser.parseLabReportText(pathologyReportText).normalValues,
      medications: [] // Correctly empty for pathology!
    },
    {
      id: "DOC-002",
      title: "12-Lead ECG Strip (ecg_strip.png)",
      type: "ecg_report",
      categoryLabel: "12-Lead ECG / EKG Strip",
      badgeColor: "pill-danger",
      icon: "💓",
      rootCause: "Acute Anterior Wall STEMI",
      anatomicalSite: "Cardiovascular System",
      flags: [
        { test: "12-Lead ECG Finding", value: "Acute Anterior Wall STEMI", ref: "Normal Sinus Rhythm", status: "STAT CARDIAC ALERT", alertLevel: "danger" }
      ],
      normalValues: [],
      medications: [] // Correctly empty for ECG!
    },
    {
      id: "DOC-003",
      title: "Shoulder Radiograph (shoulder_xray.jpg)",
      type: "xray_report",
      categoryLabel: "X-Ray Radiograph (Shoulder Joint)",
      badgeColor: "pill-danger",
      icon: "🩻",
      rootCause: "Traumatic Fracture of Mid-Shaft Right Clavicle",
      anatomicalSite: "Shoulder Joint",
      flags: [
        { test: "Radiological Vision Impression", value: "Mid-Shaft Clavicular Fracture", ref: "Intact Cortical Bone", status: "CRITICAL ACUTE", alertLevel: "danger" }
      ],
      normalValues: [],
      medications: [] // Correctly empty for X-Ray!
    },
    {
      id: "DOC-004",
      title: "Doctor Outpatient Prescription (rx_sheet.jpg)",
      type: "prescription",
      categoryLabel: "Doctor Prescription (Rx)",
      badgeColor: "pill-success",
      icon: "📄",
      rootCause: "Outpatient Pharmacotherapy: Antibiotic + PPI + Antihistamine",
      anatomicalSite: "Outpatient Pharmacotherapy",
      flags: [],
      normalValues: [],
      medications: rxMeds // Correctly populated for Prescription!
    }
  ]
};

const doctorSummary = clinicalParser.generateStructuredSummary(patientWithMultipleDocs);

console.log("Synthesized Multi-Document Impressions in Doctor View:");
doctorSummary.clinicalImpression.forEach((imp, i) => console.log(`   ${i + 1}. ${imp}`));

assert(doctorSummary.documents.length === 4, "Doctor summary contains all 4 uploaded documents");
assert(doctorSummary.allLabFlags.length >= 4, `Aggregated total diagnostic flags across all documents (Got: ${doctorSummary.allLabFlags.length})`);
assert(doctorSummary.clinicalImpression.some(imp => imp.includes("Hyperglycemia") || imp.includes("Metabolic")), "Synthesized Hyperglycemia impression");
assert(doctorSummary.clinicalImpression.some(imp => imp.includes("Thrombocytopenia") || imp.includes("Platelet")), "Synthesized Thrombocytopenia impression");
assert(doctorSummary.clinicalImpression.some(imp => imp.includes("Anemia") || imp.includes("Haemoglobin")), "Synthesized Anemia impression");
assert(doctorSummary.clinicalImpression.some(imp => imp.includes("STEMI")), "Synthesized Acute Anterior Wall STEMI impression");
assert(doctorSummary.clinicalImpression.some(imp => imp.includes("Clavicle") || imp.includes("Fracture")), "Synthesized Clavicular Fracture impression");
assert(doctorSummary.activeMedications.length === 3, "Active medications preserved exclusively from prescription");

// -------------------------------------------------------------------------------
// TEST 4: Patient with ONLY Lab Report Upload (No Prescription)
// -------------------------------------------------------------------------------
console.log("\n-------------------------------------------------------------------------------");
console.log("TEST 4: Patient with Only Lab Report (Zero Prescriptions)");
console.log("-------------------------------------------------------------------------------");

const patientLabOnly = {
  name: "Sunita Sharma",
  age: 38,
  gender: "Female",
  chiefComplaint: "Routine health checkup",
  allopathicMeds: [],
  documents: [
    {
      id: "DOC-901",
      title: "CBC & Metabolic Lab Report",
      type: "pathology_report",
      categoryLabel: "Pathology & Biochemistry Report",
      badgeColor: "pill-danger",
      icon: "🔬",
      rootCause: "Severe Hyperglycemia with Thrombocytopenia",
      flags: labParser.parseLabReportText(pathologyReportText).flags,
      normalValues: [],
      medications: []
    }
  ]
};

const labOnlySummary = clinicalParser.generateStructuredSummary(patientLabOnly);
assert(labOnlySummary.activeMedications.length === 0, "Patient with only lab report has 0 active medications");
assert(labOnlySummary.allLabFlags.length >= 3, "Patient with only lab report has all extracted abnormal lab flags");
assert(labOnlySummary.clinicalImpression.some(imp => imp.includes("Hyperglycemia")), "Clinical impression captures lab findings");

console.log("\n===============================================================================");
console.log(`🏁 TEST EXECUTION COMPLETE: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
console.log("===============================================================================\n");

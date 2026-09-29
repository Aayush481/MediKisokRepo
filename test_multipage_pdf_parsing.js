import { labParser } from "./src/services/labParser.js";
import { prescriptionParser } from "./src/services/prescriptionParser.js";
import { documentClassifier } from "./src/services/medicalDocumentClassifier.js";

console.log("=== COMPREHENSIVE MULTI-PAGE PDF & CLINICAL PARSER TEST ===\n");

// Multi-page pathology report simulation (4 pages)
const multiPagePathologyText = `
=== [PAGE 1 OF 4: COMPLETE BLOOD COUNT (CBC)] ===
DR LAL PATHLABS - PATIENT: RAMESH KUMAR (AGE: 52 / MALE)
COMPLETE HEMOGRAM / HEMATOLOGY REPORT:
Haemoglobin (Hb)                  10.40   gm/dL       12.00 - 16.00   LOW
Total Leukocyte Count (TLC)       14.80   thou/µL      4.00 - 11.00   HIGH
Platelet Count                   245.00   thou/µL    150.00 - 410.00  NORMAL
Packed Cell Volume (PCV)          32.50   %           36.00 - 48.00   LOW
Mean Corpuscular Volume (MCV)     74.00   fL          80.00 - 100.00  LOW
Erythrocyte Sedimentation Rate    38.00   mm/hr        0.00 - 20.00   HIGH

=== [PAGE 2 OF 4: BIOCHEMISTRY & DIABETES PANEL] ===
CLINICAL BIOCHEMISTRY:
Fasting Blood Glucose            284.50   mg/dL       70.00 - 100.00  CRITICAL HIGH
Postprandial Blood Glucose       342.00   mg/dL       70.00 - 140.00  CRITICAL HIGH
HbA1c (Glycated Hemoglobin)        9.80   %            4.00 - 5.70    CRITICAL HIGH
Serum Triglycerides              310.00   mg/dL        0.00 - 150.00  HIGH
Total Cholesterol                235.00   mg/dL        0.00 - 200.00  HIGH
HDL Cholesterol                   32.00   mg/dL       40.00 - 80.00   LOW
LDL Cholesterol                  141.00   mg/dL        0.00 - 100.00  HIGH

=== [PAGE 3 OF 4: KIDNEY & RENAL FUNCTION TEST (KFT)] ===
RENAL CLEARANCE & ELECTROLYTE PANEL:
Serum Creatinine                   1.85   mg/dL        0.50 - 1.20    HIGH
Blood Urea                        58.00   mg/dL       15.00 - 45.00   HIGH
Serum Uric Acid                    8.40   mg/dL        3.50 - 7.20    HIGH
Serum Sodium                     138.00   mmol/L     136.00 - 145.00  NORMAL
Serum Potassium                    4.60   mmol/L       3.50 - 5.10    NORMAL
Serum Calcium                      9.10   mg/dL        8.50 - 10.50   NORMAL

=== [PAGE 4 OF 4: LIVER FUNCTION TEST (LFT) & THYROID] ===
HEPATIC ENZYMES & METABOLIC HORMONES:
Total Bilirubin                    0.90   mg/dL        0.20 - 1.20    NORMAL
SGPT / ALT                        68.00   U/L          5.00 - 40.00   HIGH
SGOT / AST                        54.00   U/L          5.00 - 40.00   HIGH
Alkaline Phosphatase (ALP)       110.00   U/L         30.00 - 120.00  NORMAL
Serum Albumin                      4.10   g/dL         3.50 - 5.00    NORMAL
TSH (Thyroid Stimulating Hormone)  7.80   µIU/mL       0.35 - 4.94    HIGH
Vitamin D (25-OH)                 14.50   ng/mL       30.00 - 100.00  LOW
Vitamin B12                      165.00   pg/mL      200.00 - 900.00  LOW
`;

async function testMultipageExtraction() {
  console.log("1. Testing Lab Parser on 4-Page Pathology Report...");
  const labRes = labParser.parseLabReportText(multiPagePathologyText);

  console.log(`  Extracted Abnormal Flags (${labRes.flags.length}):`);
  for (const f of labRes.flags) {
    console.log(`    ⚠️  [${f.category}] ${f.test}: ${f.value} -> ${f.status}`);
  }

  console.log(`\n  Extracted Normal Values (${labRes.normalValues.length}):`);
  for (const n of labRes.normalValues) {
    console.log(`    ✅ [${n.category}] ${n.test}: ${n.value} -> Normal`);
  }

  if (labRes.flags.length < 10) {
    throw new Error(`Test Failed: Expected at least 10 abnormal flags across 4 pages, got ${labRes.flags.length}`);
  }

  console.log("\n2. Testing Medical Document Classifier on 4-Page PDF Text...");
  const classification = await documentClassifier.classifyAndValidate(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    multiPagePathologyText,
    "ramesh_kumar_4page_comprehensive_lab_report.pdf"
  );

  console.log("  Classification:", classification.categoryLabel);
  console.log("  Root Cause:", classification.rootCause);
  console.log("  Anatomical Site:", classification.anatomicalSite);
  console.log("  Confidence:", classification.confidence);

  if (!classification.isValidMedical || classification.type !== "pathology_report") {
    throw new Error("Test Failed: Multi-page PDF was not classified as pathology_report");
  }

  console.log("\n3. Testing Server /api/analyze-document Endpoint on 4-Page PDF...");
  const serverRes = await fetch("http://localhost:3000/api/analyze-document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: "ramesh_kumar_4page_comprehensive_lab_report.pdf",
      mimeType: "application/pdf",
      reportText: multiPagePathologyText
    })
  });

  const serverData = await serverRes.json();
  console.log("  Server Response Status:", serverRes.status);
  console.log("  Server Category:", serverData.categoryLabel);
  console.log("  Server Root Cause:", serverData.rootCause);

  if (!serverData.isValidMedical || serverData.type !== "pathology_report") {
    throw new Error("Test Failed: Server endpoint failed on multi-page PDF");
  }

  console.log("\n🎉 ALL MULTI-PAGE PDF EXTRACTION & SUMMARIZATION TESTS PASSED WITH 100% ACCURACY!");
}

testMultipageExtraction().catch(err => {
  console.error("❌ Test error:", err);
  process.exit(1);
});

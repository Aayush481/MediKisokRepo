import { documentClassifier } from "./src/services/medicalDocumentClassifier.js";
import { labParser } from "./src/services/labParser.js";
import { PDFHelper } from "./src/services/pdfHelper.js";
import fs from "fs";

console.log("===============================================================================");
console.log("🧪 TESTING CARE.PDF INGESTION & PATHKIND LABS REPORT ANALYSIS");
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

async function runCarePdfTests() {
  const filePath = "C:/Users/aayus/Downloads/care.pdf";
  if (!fs.existsSync(filePath)) {
    console.error("care.pdf not found at", filePath);
    return;
  }

  const buffer = fs.readFileSync(filePath);
  const streamText = PDFHelper.extractTextFromPdfBuffer(buffer.buffer);

  console.log("-------------------------------------------------------------------------------");
  console.log("TEST 1: care.pdf Scanned PDF Ingestion with Stream Text");
  console.log("-------------------------------------------------------------------------------");

  const streamResult = await documentClassifier.classifyAndValidate(null, streamText, "care.pdf");
  console.log("Classifier output for care.pdf (stream text):", {
    isValidMedical: streamResult.isValidMedical,
    type: streamResult.type,
    categoryLabel: streamResult.categoryLabel,
    rootCause: streamResult.rootCause
  });

  assert(streamResult.isValidMedical === true, "care.pdf is accepted as an authentic medical document (isValidMedical: true)");
  assert(streamResult.type !== "non_medical", "Type is medical, NOT non_medical");

  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 2: care.pdf Complete Blood Count (CBC) Pathology Biomarker Parsing");
  console.log("-------------------------------------------------------------------------------");

  const cbcOcrText = `
  Pathkind Diagnostics Pvt. Ltd.
  Patient: Mrs. SHASHI, Age: 49 Yrs, Gender: Female
  Ref. By: DR KARAN MARWAH
  Report Status: Preliminary
  Complete Blood Count (CBC)
  Haemoglobin (Hb): 10.80 L (Biological Ref. Interval: 12.00 - 15.00 gm/dL)
  Total WBC Count / TLC: 6.70 (Biological Ref. Interval: 4.00 - 10.00 thou/uL)
  Platelet Count: 437.00 H (Biological Ref. Interval: 150.00 - 410.00 thou/uL)
  PCV / Hematocrit: 35.40 L (Biological Ref. Interval: 36.00 - 46.00 %)
  MCV: 82.00 L (Biological Ref. Interval: 83.00 - 101.00 fL)
  MCH: 25.20 L (Biological Ref. Interval: 27.00 - 32.00 pg)
  MCHC: 30.60 L (Biological Ref. Interval: 31.50 - 34.50 gm/dL)
  RDW: 15.50 % (Biological Ref. Interval: 11.90 - 15.50 %)
  care@pathkindlabs.com
  `;

  const cbcResult = await documentClassifier.classifyAndValidate(null, cbcOcrText, "care.pdf");
  console.log("Classifier output with CBC OCR text:", {
    isValidMedical: cbcResult.isValidMedical,
    type: cbcResult.type,
    categoryLabel: cbcResult.categoryLabel,
    rootCause: cbcResult.rootCause
  });

  assert(cbcResult.isValidMedical === true, "care.pdf with CBC text validated as authentic");
  assert(cbcResult.type === "pathology_report", "Classified specifically as pathology_report");
  assert(cbcResult.categoryLabel.includes("Pathology"), "Category label is Pathology & Biochemistry Report");

  const labParsed = labParser.parseLabReportText(cbcOcrText);
  console.log(`\nParsed ${labParsed.flags.length} Abnormal Biomarker Flags from Pathkind Report:`);
  labParsed.flags.forEach(f => {
    console.log(`   ⚠️ [${f.alertLevel.toUpperCase()}] ${f.test}: ${f.value} [Ref: ${f.ref}] — ${f.status}`);
  });

  assert(labParsed.flags.length >= 3, `Extracted all key abnormal CBC flags (Got: ${labParsed.flags.length})`);
  assert(labParsed.flags.some(f => f.test.includes("Haemoglobin") && f.status.includes("LOW")), "Flagged low Hemoglobin 10.80 gm/dL (Anemia)");
  assert(labParsed.flags.some(f => f.test.includes("Platelet") && f.status.includes("Elevated")), "Flagged high Platelets 437.00 thou/µL (Thrombocytosis)");
  assert(labParsed.flags.some(f => f.test.includes("Packed Cell Volume") || f.test.includes("PCV")), "Flagged low PCV 35.40%");

  console.log("\n===============================================================================");
  console.log(`🏁 TEST EXECUTION COMPLETE: ${passed} / ${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log("===============================================================================\n");
}

runCarePdfTests();

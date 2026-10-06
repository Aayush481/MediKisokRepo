import { prescriptionParser } from "./frontend/src/services/prescriptionParser.js";
import { labParser } from "./frontend/src/services/labParser.js";

console.log("=== 1. TESTING HANDWRITTEN DOCTOR PRESCRIPTION OCR PARSER ===");
const sampleHandwrittenRxOcr = `
Dr. R. K. Verma, MD (Med)
Rx:
1. Tab Metfornin 500 - 1 Tab BD x 30 days
2. Tab Telma 40mg - 1 Tab OD morning
3. Cap Pan-40 - 1 Cap OD before breakfast x 14 days
4. Tab Dolo 650mg - 1 Tab SOS during fever
5. Tab Ecosprin 75 - 1 Tab OD after food
`;

const parsedMeds = prescriptionParser.parsePrescriptionText(sampleHandwrittenRxOcr);
console.log(`Extracted ${parsedMeds.length} SNOMED-Validated Medicines:`);
console.log(JSON.stringify(parsedMeds, null, 2));

console.log("\n=== 2. TESTING PATHOLOGY LAB BIOMARKER PARSER ===");
const sampleLabOcr = `
PATHOLOGY REPORT:
Glucose Random: 284.50 mg/dL (HIGH)
Serum Triglycerides: 310.00 mg/dL (HIGH)
Haemoglobin: 11.20 gm/dL (LOW)
Serum Creatinine: 0.90 mg/dL (NORMAL)
`;

const parsedLab = labParser.parseLabReportText(sampleLabOcr);
console.log(`Extracted ${parsedLab.flags.length} Abnormal Lab Flags:`);
console.log(JSON.stringify(parsedLab.flags, null, 2));

if (parsedMeds.length === 5 && parsedLab.flags.length === 3) {
  console.log("\n✅ ALL PRODUCTION PARSER TESTS PASSED PERFECTLY!");
} else {
  console.error("\n❌ Test output count mismatch");
  process.exit(1);
}

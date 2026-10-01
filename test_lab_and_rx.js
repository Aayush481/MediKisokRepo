import { prescriptionParser } from './src/services/prescriptionParser.js';
import { documentClassifier } from './src/services/medicalDocumentClassifier.js';
import { geminiVisionService } from './src/services/geminiVisionService.js';
import { ocrEngine } from './src/services/ocrEngine.js';

async function runTests() {
  console.log("=================================================================");
  console.log("TESTING PATHOLOGY LAB REPORTS vs PRESCRIPTIONS");
  console.log("=================================================================\n");

  const labReports = [
    {
      name: "CBC Report (Dr Lal PathLabs)",
      filename: "cbc_report.pdf",
      text: `DR LAL PATHLABS
CLINICAL LABORATORY & PATHOLOGY REPORT
Patient: Ramesh Kumar, Age: 52 / M
Referred By: Dr. A. K. Sharma
Sample Collected: Whole Blood EDTA
Investigation: COMPLETE BLOOD COUNT (CBC)

Test Name              Result      Units          Reference Interval
Hemoglobin             11.2        gm/dL          13.0 - 17.0 (LOW)
Total Leukocyte Count  9500        cells/cumm     4000 - 11000
Platelet Count         180000      /cumm          150000 - 450000
Packed Cell Volume     34.5        %              40.0 - 50.0 (LOW)
RBC Count              3.8         mil/cumm       4.5 - 5.5
MCV                    82.0        fL             80.0 - 100.0

Bio-Reference Intervals Verified By Pathologist.`
    },
    {
      name: "Kidney Function Test & Biochemistry (Metropolis)",
      filename: "biochemistry_kft.pdf",
      text: `METROPOLIS HEALTHCARE LIMITED
DEPARTMENT OF BIOCHEMISTRY & CLINICAL PATHOLOGY
Patient: Sunita Sharma, Age: 46 / F
Referred By: Dr. S. K. Gupta

BIOCHEMISTRY INVESTIGATION REPORT
Test Name              Observed Value    Units      Biological Reference Range
Blood Urea             28.4              mg/dL      15.0 - 45.0
Serum Creatinine       1.45              mg/dL      0.6 - 1.2 (HIGH)
Uric Acid              6.8               mg/dL      3.5 - 7.2
Serum Calcium          9.1               mg/dL      8.8 - 10.2
Fasting Blood Sugar    142.0             mg/dL      70.0 - 100.0 (HIGH)

End of Report.`
    },
    {
      name: "Lipid Profile & Cholesterol Panel",
      filename: "lipid_profile.jpg",
      text: `APOLLO DIAGNOSTICS
LABORATORY REPORT - CLINICAL BIOCHEMISTRY
Patient: Rajesh Patel, 58 Y / Male
Ref Doctor: Self / OPD

LIPID PROFILE
Total Cholesterol: 245 mg/dL (Desirable: < 200 mg/dL) [HIGH]
Triglycerides: 280 mg/dL (Normal: < 150 mg/dL) [HIGH]
HDL Cholesterol: 38 mg/dL (Low: < 40 mg/dL) [LOW]
LDL Cholesterol: 151 mg/dL (Optimal: < 100 mg/dL) [HIGH]
VLDL Cholesterol: 56 mg/dL (Normal: 10 - 30 mg/dL)

Authorized Signatory, Pathologist.`
    }
  ];

  let labPassed = 0;

  for (const lab of labReports) {
    console.log(`\n--- [LAB TEST] ${lab.name} ---`);
    const classification = await documentClassifier.classifyAndValidate(null, lab.text, lab.filename);
    console.log(`  Classification: [${classification.categoryLabel}] (type: ${classification.type})`);
    
    const meds = prescriptionParser.parsePrescriptionText(lab.text);
    console.log(`  prescriptionParser Extracted Meds: ${meds.length}`);
    
    const structuredJSON = prescriptionParser.parseToStructuredJSON(lab.text);
    console.log(`  prescriptionParser Structured JSON: ${structuredJSON ? JSON.stringify(structuredJSON) : 'null'}`);

    const geminiParsed = geminiVisionService.parseGeminiMarkdown(lab.text, lab.filename);
    console.log(`  Gemini Parsed Type: ${geminiParsed.type}, Meds: ${geminiParsed.extractedMedications.length}`);

    // Verification conditions:
    // 1. Must be classified as pathology_report
    // 2. Extracted medications must be ZERO ([])
    // 3. Structured JSON must be NULL
    const isLab = classification.type === "pathology_report";
    const noMeds = meds.length === 0;
    const noJson = structuredJSON === null;
    const geminiNoMeds = geminiParsed.extractedMedications.length === 0;

    if (isLab && noMeds && noJson && geminiNoMeds) {
      console.log(`  ✅ PASSED: Correctly identified as Pathology Report with 0 extracted prescriptions!`);
      labPassed++;
    } else {
      console.error(`  ❌ FAILED: isLab=${isLab}, noMeds=${noMeds}, noJson=${noJson}, geminiNoMeds=${geminiNoMeds}`);
    }
  }

  console.log(`\n=================================================================`);
  console.log(`Pathology Lab Tests: ${labPassed} / ${labReports.length} Passed`);
  console.log(`=================================================================\n`);
}

runTests();

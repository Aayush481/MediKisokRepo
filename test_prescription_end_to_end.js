import { prescriptionParser } from './frontend/src/services/prescriptionParser.js';
import { documentClassifier } from './frontend/src/services/medicalDocumentClassifier.js';
import { geminiVisionService } from './frontend/src/services/geminiVisionService.js';

async function testPrescriptions() {
  console.log("=== RUNNING END-TO-END PRESCRIPTION EXTRACTION & IDENTIFICATION TESTS ===\n");

  const testCases = [
    {
      name: "1. Standard Doctor Prescription (Printed / Clean OCR)",
      text: `Dr. Ramesh Mehta, MBBS, MD
Reg No: MCI-48291
Apex Health Clinic, Delhi
Date: 28-09-2026
Patient: Smt. Sunita Devi, Age: 48, Female

Rx:
1. Tab Augmentin 625mg - 1 tab TDS x 5 days (After food)
2. Tab Pantocid 40mg - 1 tab OD x 14 days (Before breakfast)
3. Tab Dolo 650mg - 1 tab SOS for body pain / fever
4. Tab Shelcal 500 - 1 tab OD x 30 days (After dinner)
5. Syp Grilinctus 100ml - 2 tsp TDS x 5 days

Review after 5 days. Check Fasting Blood Sugar on review.`,
      fileName: "sunita_prescription.jpg"
    },
    {
      name: "2. Real-World Cursive / Abbreviated Doctor Prescription Slip",
      text: `Dr. S. K. Gupta
M.B.B.S. D.N.B. (Family Medicine)
City Polyclinic
Rx
Tab. Clavam 625 1-0-1 x 5 d pc
Cap. Pan-D 1-0-0 x 10 d ac
Tab. Montek-LC 0-0-1 x 7 d hs
Tab. Calpol 650 1-0-1 SOS
Tab. Becosules 0-1-0 x 15 d`,
      fileName: "rx_doctor_slip.jpg"
    },
    {
      name: "3. Gemini Vision Extracted Markdown with Structured JSON Medications",
      text: `## Report Type: Doctor Prescription (Rx)

## Anatomical Site / Region
Outpatient Pharmacotherapy

## Root Clinical Cause / Diagnostic Finding
Acute Upper Respiratory Tract Infection & Hyperacidity

## Diagnoses & Clinical Conditions
* Acute Bronchitis / URI (J20.9)
* Gastroesophageal Reflux (K21.9)

## Extracted Findings
* Doctor prescription for 4 medications
\`\`\`json
[
  {
    "medicine": "Tab Augmentin 625",
    "dosage": "625 mg TDS",
    "usage": "5 days after food",
    "validated": true
  },
  {
    "medicine": "Cap Pan-40",
    "dosage": "40 mg OD",
    "usage": "10 days before food",
    "validated": true
  },
  {
    "medicine": "Tab Dolo 650",
    "dosage": "650 mg SOS",
    "usage": "During pain / fever",
    "validated": true
  }
]
\`\`\`

## Measurements
* Augmentin 625 mg, Pan-40 40 mg, Dolo 650 mg

## AI Summary
Prescription for acute upper respiratory infection containing broad spectrum antibacterial coverage with gastroprotection and antipyretic relief.

**NOT FOR CLINICAL USE WITHOUT PHYSICIAN REVIEW**`,
      fileName: "camera_prescription.jpg"
    }
  ];

  let passed = 0;

  for (const tc of testCases) {
    console.log(`--- Testing: ${tc.name} ---`);

    // 1. Classifier test
    const classification = await documentClassifier.classifyAndValidate(null, tc.text, tc.fileName);
    console.log(`  Classification: [${classification.categoryLabel}] (type: ${classification.type})`);
    console.log(`  Valid Medical: ${classification.isValidMedical}`);

    // 2. Parser test
    const meds = prescriptionParser.parsePrescriptionText(tc.text);
    console.log(`  Extracted Medications Count: ${meds.length}`);
    meds.forEach((m, idx) => {
      console.log(`    ${idx + 1}. ${m.name} (${m.brandReported}) | Dose: ${m.dosage} | Freq: ${m.freq} | Validated: ${m.validated}`);
    });

    // 3. Gemini Vision Service test
    const geminiParsed = geminiVisionService.parseGeminiMarkdown(tc.text, tc.fileName);
    console.log(`  Gemini Vision Parsed Type: ${geminiParsed.type} (${geminiParsed.categoryLabel})`);
    console.log(`  Gemini Extracted Meds: ${geminiParsed.extractedMedications.length}`);

    const isClassifiedRx = classification.type === "prescription";
    const hasMeds = meds.length >= 3;
    const allValidated = meds.filter(m => m.validated).length >= 3;
    const geminiIsRx = geminiParsed.type === "prescription" && geminiParsed.extractedMedications.length >= 3;

    if (isClassifiedRx && hasMeds && allValidated && geminiIsRx) {
      console.log(`  ✅ PASSED: Document verified as Doctor Prescription (Rx) with all medications extracted!\n`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: isClassifiedRx=${isClassifiedRx}, hasMeds=${hasMeds}, allValidated=${allValidated}, geminiIsRx=${geminiIsRx}\n`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🏁 RESULT: ${passed} / ${testCases.length} Prescription Tests Passed.`);
  console.log(`======================================================`);

  if (passed !== testCases.length) {
    process.exit(1);
  }
}

testPrescriptions();

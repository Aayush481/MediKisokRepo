async function runDocumentDetectionSuite() {
  console.log("=== COMPREHENSIVE DOCUMENT DETECTION & SUMMARIZATION SUITE ===\n");

  const testCases = [
    {
      name: "1. Pathology Lab Report PDF / Table",
      payload: {
        fileName: "pathology_blood_test.pdf",
        mimeType: "application/pdf",
        reportText: "DR LAL PATHLABS CLINICAL BIOCHEMISTRY:\nFast Blood Glucose: 298 mg/dL (Ref: 70-100)\nSerum Triglycerides: 327 mg/dL (Ref: <150)\nSerum Cholesterol: 248 mg/dL (Ref: <200)\nHaemoglobin: 10.2 gm/dL (Ref: 12-16)\nSerum Creatinine: 1.9 mg/dL (Ref: 0.5-1.2)"
      },
      expectedType: "pathology_report",
      mustBeValid: true
    },
    {
      name: "2. Doctor Prescription (Rx)",
      payload: {
        fileName: "prescription_scan.jpg",
        mimeType: "image/jpeg",
        reportText: "Dr. A. Verma MBBS MD\nRx:\nTab Metformin 500mg BD\nTab Telmisartan 40mg OD\nCap Pan-40 OD before breakfast\nTab Dolo 650 SOS"
      },
      expectedType: "prescription",
      mustBeValid: true
    },
    {
      name: "3. Bilateral Knee Radiograph",
      payload: {
        fileName: "bilateral_knee_xray.png",
        mimeType: "image/png",
        reportText: "X-Ray Bilateral Knee Joint AP & Lateral views: Medial compartment joint space reduction with subchondral sclerosis and marginal osteophyte formation."
      },
      expectedType: "xray_report",
      mustBeValid: true
    },
    {
      name: "4. Acute Shoulder Dislocation / Fracture X-Ray",
      payload: {
        fileName: "shoulder_trauma_xray.jpg",
        mimeType: "image/jpeg",
        reportText: "Left Shoulder AP Radiograph: Cortical bone fracture at proximal humerus surgical neck with glenohumeral articulation alignment disruption."
      },
      expectedType: "xray_report",
      mustBeValid: true
    },
    {
      name: "5. 12-Lead ECG STEMI Strip",
      payload: {
        fileName: "ecg_acute_stemi.jpg",
        mimeType: "image/jpeg",
        reportText: "12-Lead ECG: Precordial leads V1 V2 V3 V4 demonstrate 4.5mm ST-elevation with reciprocal ST-depression in II, III, aVF. HR 108 bpm Sinus Tachycardia."
      },
      expectedType: "ecg_report",
      mustBeValid: true
    },
    {
      name: "6. Non-Medical Image (Vacation / Car / Selfie)",
      payload: {
        fileName: "vacation_beach_sunset.jpg",
        mimeType: "image/jpeg",
        reportText: "My vacation trip to Goa beach with friends driving Honda City car at sunset."
      },
      expectedType: "non_medical",
      mustBeValid: false
    },
    {
      name: "7. Head & Cranial Vault Radiograph (Skull AP & Lateral)",
      payload: {
        fileName: "skull_calvarium_ap_lat.jpg",
        mimeType: "image/jpeg",
        reportText: "Digital Radiograph of Skull AP & Lateral Projections: Cortical margins of cranial vault and calvarium tables intact. No linear or depressed skull fracture. Sella turcica normal."
      },
      expectedType: "xray_report",
      mustBeValid: true
    },
    {
      name: "8. Paranasal Sinus (PNS) Radiograph (Water's View Sinusitis)",
      payload: {
        fileName: "pns_waters_view.jpg",
        mimeType: "image/jpeg",
        reportText: "X-Ray Paranasal Sinuses (Water's Occipitomental View): Bilateral maxillary sinuses demonstrate significant mucosal thickening and antral opacification with fluid level. Deviated nasal septum noted to the left. Frontal sinuses clear."
      },
      expectedType: "xray_report",
      mustBeValid: true
    }
  ];

  let passed = 0;

  for (const tc of testCases) {
    try {
      const res = await fetch("http://localhost:3000/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tc.payload)
      });

      const data = await res.json();
      console.log(`TEST: ${tc.name}`);
      console.log(`  Valid Medical: ${data.isValidMedical} (Expected: ${tc.mustBeValid})`);
      console.log(`  Category: [${data.categoryLabel}]`);
      console.log(`  Root Cause / Finding: ${data.rootCause}`);
      console.log(`  Anatomical Site: ${data.anatomicalSite}`);

      const typeMatches = tc.mustBeValid ? (data.type === tc.expectedType && data.isValidMedical) : (!data.isValidMedical);
      if (typeMatches) {
        console.log(`  ✅ PASSED\n`);
        passed++;
      } else {
        console.error(`  ❌ FAILED: Expected ${tc.expectedType} (${tc.mustBeValid}), got ${data.type} (${data.isValidMedical})\n`);
      }
    } catch (e) {
      console.error(`  ❌ ERROR running ${tc.name}:`, e.message);
    }
  }

  console.log(`RESULTS: ${passed}/${testCases.length} Tests Passed.`);
  if (passed !== testCases.length) {
    process.exit(1);
  }
}

runDocumentDetectionSuite();

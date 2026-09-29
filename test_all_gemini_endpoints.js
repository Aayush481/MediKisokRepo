async function testAllGeminiReports() {
  console.log("=== TESTING ALL MEDICAL DOCUMENT MODALITIES ON GEMINI 3.5-FLASH ENDPOINT ===\n");

  const testCases = [
    {
      name: "12-Lead ECG (STEMI)",
      payload: {
        reportText: "12-Lead ECG: Sinus tachycardia at 110 bpm with 4mm ST-elevation in precordial leads V1, V2, V3, and V4. Pathological Q waves in V1-V2.",
        fileName: "ecg_acute_stemi.png",
        mimeType: "image/png"
      }
    },
    {
      name: "Pathology Lab Report (Diabetes + Lipids)",
      payload: {
        reportText: "BIOCHEMISTRY REPORT:\nFasting Blood Glucose: 284 mg/dL (Ref: 70-100)\nSerum Triglycerides: 310 mg/dL (Ref: < 150)\nTotal Cholesterol: 245 mg/dL (Ref: < 200)\nHaemoglobin: 11.2 gm/dL (Ref: 12-16)\nSerum Creatinine: 1.0 mg/dL (Ref: 0.6-1.2)",
        fileName: "blood_test_report.pdf",
        mimeType: "application/pdf"
      }
    },
    {
      name: "Doctor Handwritten Prescription (Rx)",
      payload: {
        reportText: "Dr. A. K. Gupta, MD (Med)\nRx:\n1. Tab Metformin 500mg - 1 Tab BD x 30 days\n2. Tab Telma 40mg - 1 Tab OD morning\n3. Cap Pan-40 - 1 Cap OD before breakfast\n4. Tab Dolo 650mg - 1 Tab SOS",
        fileName: "doctor_prescription_rx.jpg",
        mimeType: "image/jpeg"
      }
    },
    {
      name: "Non-Medical Vacation Selfie (Rejection)",
      payload: {
        reportText: "Vacation selfie at Goa beach with sunset and friends car Honda City",
        fileName: "beach_vacation_selfie.jpg",
        mimeType: "image/jpeg"
      }
    }
  ];

  for (const tc of testCases) {
    console.log(`--- Testing: ${tc.name} ---`);
    const res = await fetch("http://localhost:3000/api/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tc.payload)
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Type: ${data.categoryLabel}`);
    console.log(`Root Cause: ${data.rootCause}`);
    console.log(`Valid Medical: ${data.isValidMedical}`);
    if (data.errorMessage) console.log(`Error Message: ${data.errorMessage}`);
    console.log("\n");
  }

  console.log("✅ ALL GEMINI MULTIMODAL REPORT MODALITY TESTS COMPLETED!");
}

testAllGeminiReports();

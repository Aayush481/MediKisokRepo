// End-to-end verification of Face, Head, Skull, PNS, Mandible, and Head CT extraction

async function runHeadAndFaceTests() {
  console.log("=== VERIFYING FACE & HEAD RADIOLOGY EXTRACTION ===\n");

  const testCases = [
    {
      name: "1. Skull Radiograph with Calvarial Vault Fracture",
      payload: {
        fileName: "skull_trauma_lateral_xray.jpg",
        mimeType: "image/jpeg",
        reportText: "Department of Radiology - Skull AP & Lateral Radiograph:\nClinical History: Head trauma following road traffic accident.\nFindings: Linear cortical fracture line identified traversing the right parietal calvarium without depressed table displacement. Sella turcica and cranial sutures are normal. No radiopaque foreign body.\nImpression: Linear skull fracture of right parietal calvarium. Urgent NCCT Head advised."
      },
      expectedDocType: "Radiology Report",
      expectedDiseaseKeywords: ["skull", "fracture"],
      expectedSiteKeyword: "skull",
      expectedModalityKeyword: "radiography"
    },
    {
      name: "2. PNS Water's View Radiograph with Acute Sinusitis & DNS",
      payload: {
        fileName: "pns_waters_sinusitis.png",
        mimeType: "image/png",
        reportText: "Digital Radiography PNS (Water's Occipitomental View):\nFindings: Bilateral maxillary sinuses show prominent mucosal thickening with complete haziness and fluid level in right antrum. Deviated nasal septum (DNS) noted towards the left with bony spur. Frontal and ethmoidal sinuses appear normally pneumatized.\nImpression: Acute right maxillary sinusitis with deviated nasal septum."
      },
      expectedDocType: "Radiology Report",
      expectedDiseaseKeywords: ["sinusitis", "septum"],
      expectedSiteKeyword: "sinus",
      expectedModalityKeyword: "radiography"
    },
    {
      name: "3. Mandibular Orthopantomogram (OPG) with Fracture",
      payload: {
        fileName: "mandible_opg_fracture.jpg",
        mimeType: "image/jpeg",
        reportText: "Orthopantomogram (OPG Panoramic Radiograph):\nFindings: Discontinuity in the inferior cortical border of the right mandibular angle. Cortical step-off with displacement. Left mandibular condyle seated within the glenoid fossa. Normal dentition with traumatic malocclusion.\nImpression: Displaced fracture of the right mandibular angle."
      },
      expectedDocType: "Radiology Report",
      expectedDiseaseKeywords: ["mandib", "fracture"],
      expectedSiteKeyword: "mandib",
      expectedModalityKeyword: "opg"
    },
    {
      name: "4. Non-Contrast Head CT Scan (NCCT Head)",
      payload: {
        fileName: "ncct_brain_scan.jpg",
        mimeType: "image/jpeg",
        reportText: "Computed Tomography (NCCT Head / Brain Axial Slices):\nFindings: Normal cerebral attenuation with preserved gray-white matter differentiation. Symmetrical lateral and third ventricles. Basal cisterns are clear. No acute intracranial hemorrhage or midline shift. Calvarial bones intact.\nImpression: Normal non-contrast CT head study."
      },
      expectedDocType: "Radiology Report",
      expectedDiseaseKeywords: [],
      expectedSiteKeyword: "brain",
      expectedModalityKeyword: "computed tomography"
    }
  ];

  let passed = 0;

  for (const tc of testCases) {
    console.log(`--- Running: ${tc.name} ---`);
    const res = await fetch("http://localhost:3000/api/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tc.payload)
    });

    const data = await res.json();
    console.log("  Success:", data.success);
    console.log("  Document Type:", data.document_type);
    console.log("  Validation:", data.validation);
    console.log("  Modality:", data.extracted_data?.modality);
    console.log("  Anatomical Site:", data.extracted_data?.anatomical_site);
    console.log("  Impressions:", data.extracted_data?.impressions || data.rootCause);
    console.log("  Findings count:", (data.extracted_data?.findings || []).length);
    if (data.extracted_data?.findings) {
      console.log("  Sample Findings:", Array.isArray(data.extracted_data.findings) ? data.extracted_data.findings.slice(0, 2) : data.extracted_data.findings);
    }
    console.log("  Diagnoses:", (data.extracted_data?.diagnoses || []).map(d => `${d.name} (${d.icd10 || ''})`));

    const docTypeMatches = data.document_type === tc.expectedDocType;
    const isValid = data.validation === "valid" && data.success === true;
    const hasFindings = data.extracted_data?.findings && (Array.isArray(data.extracted_data.findings) ? data.extracted_data.findings.length > 0 : true);
    const hasImpressions = !!(data.extracted_data?.impressions || data.rootCause);

    if (docTypeMatches && isValid && hasFindings && hasImpressions) {
      console.log("  ✅ PASS\n");
      passed++;
    } else {
      console.error("  ❌ FAIL: Details missing or schema mismatch\n");
    }
  }

  console.log(`\n========================================`);
  console.log(`Head & Face Radiology Results: ${passed}/${testCases.length} Passed`);
  console.log(`========================================\n`);

  if (passed !== testCases.length) process.exit(1);
}

runHeadAndFaceTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

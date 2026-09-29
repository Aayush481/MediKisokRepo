// Test prescription parsing improvements
import { prescriptionParser } from "./src/services/prescriptionParser.js";

const testCases = [
  {
    title: "Standard Indian Handwritten / Printed Rx",
    input: `
Rx:
1. Tab Augmentin 625mg 1 tab TDS after meals x 5 days
2. Tab Pan 40mg 1 tab OD before breakfast x 14 days
3. Tab Dolo 650mg 1 tab SOS when fever occurs
4. Tab Shelcal 500 1 tab OD after food x 30 days
5. Syp Grilinctus 10ml TDS x 7 days
6. Cap Becosules 1 cap OD in morning x 30 days
`
  },
  {
    title: "Gemini JSON Embedded Extraction",
    input: `
## Report Type
Doctor Prescription (Rx)

## Extracted Findings
\`\`\`json
[
  {
    "medicine": "Amoxicillin",
    "dosage": "250 mg TDS",
    "usage": "For 7 days after food",
    "validated": true
  },
  {
    "medicine": "Pantoprazole",
    "dosage": "40 mg OD",
    "usage": "Morning before breakfast for 14 days",
    "validated": true
  },
  {
    "medicine": "Zentoxil-900",
    "dosage": "900 mg BD",
    "usage": "After meals for 5 days",
    "validated": false
  },
  {
    "medicine": null,
    "dosage": null,
    "usage": null,
    "validated": false,
    "reason": "Unclear handwriting"
  }
]
\`\`\`
`
  },
  {
    title: "Direct Unstructured Clinical Text",
    input: `
Chief Complaint: Acute Bronchitis
Rx Advised:
- Azithromycin 500mg OD x 3 days before lunch
- Montair-LC 1 tab HS x 10 days
- Combiflam 1 tab BD after food SOS for pain
`
  }
];

console.log("=== RUNNING PRESCRIPTION EXTRACTION VALIDATION ===");
for (const tc of testCases) {
  console.log(`\n--- Test: ${tc.title} ---`);
  const meds = prescriptionParser.parsePrescriptionText(tc.input);
  console.log(`Extracted ${meds.length} items:`);
  for (const m of meds) {
    console.log(`  • ${m.name || 'NULL'} | Dose: ${m.dosage || '--'} | Usage: ${m.timing || m.usage || '--'} | Validated: ${m.validated !== undefined ? m.validated : true} | Reason: ${m.reason || 'None'}`);
  }
}

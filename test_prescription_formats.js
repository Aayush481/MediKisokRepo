import { prescriptionParser } from "./src/services/prescriptionParser.js";

// Test samples:
const sample1 = `
Rx:
1. Tab Augmentin 625mg 1 tab TDS after meals x 5 days
2. Tab Pan 40mg 1 tab OD before breakfast x 14 days
3. Tab Dolo 650mg 1 tab SOS when fever occurs
4. Tab Shelcal 500 1 tab OD after food x 30 days
`;

const sample2 = `
[JSON block simulation from Gemini Vision]
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
    "medicine": "UnknownMed-900",
    "dosage": "900 mg BD",
    "usage": "After meals",
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
`;

console.log("=== Testing Sample 1 (Plain Text Rx) ===");
const res1 = prescriptionParser.parsePrescriptionText(sample1);
console.log(JSON.stringify(res1, null, 2));

console.log("\n=== Testing Sample 2 (JSON Embedded Rx) ===");
const res2 = prescriptionParser.parsePrescriptionText(sample2);
console.log(JSON.stringify(res2, null, 2));

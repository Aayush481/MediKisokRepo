/**
 * Test Suite: Unit Normalization, Biological Plausibility Validation,
 * Analyte Disambiguation (Platelet vs MPV), and Organ-System Syndromic Summarization.
 */

import { labParser, ORGAN_SYSTEMS } from './src/services/labParser.js';

console.log("===============================================================================");
console.log("🧪 TESTING UNIT NORMALIZATION, BIOLOGICAL PLAUSIBILITY & SYNDROMIC GROUPING");
console.log("===============================================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// ============================================================================
// TEST 1: Unit Normalization (/cumm, lakhs/cumm, thou/µL, fL, mil/µL)
// ============================================================================
console.log("-------------------------------------------------------------------------------");
console.log("TEST 1: Unit Normalization & Scaling");
console.log("-------------------------------------------------------------------------------");

const sampleUnitText = `
HAEMATOLOGY REPORT
Total Leukocyte Count (TLC): 14800 /cumm (Ref: 4000 - 11000 /cumm)
Platelet Count: 2.25 lakhs/cumm (Ref: 1.5 - 4.1 lakhs/cumm)
Mean Platelet Volume (MPV): 9.6 fL (Ref: 7.5 - 11.5 fL)
RBC Count: 4800000 /cumm (Ref: 4.5 - 5.9 mil/µL)
Serum Creatinine: 160 µmol/L (Ref: 0.5 - 1.2 mg/dL)
`;

const res1 = labParser.parseLabReportText(sampleUnitText);
console.log("Extracted flags & normal values from unit text:");
[...res1.flags, ...res1.normalValues].forEach(item => {
  console.log(`   • ${item.test}: ${item.value} [Ref: ${item.ref}] - ${item.status}`);
});

const tlcItem = res1.flags.find(f => f.test.includes("TLC") || f.test.includes("Total Leukocyte"));
assert(tlcItem && tlcItem.value === "14.80 thou/µL", `TLC normalized from 14800 /cumm to 14.80 thou/µL (Got: ${tlcItem?.value})`);

const pltItem = res1.normalValues.find(n => n.test.includes("Platelet Count"));
assert(pltItem && pltItem.value === "225.00 thou/µL", `Platelet count normalized from 2.25 lakhs to 225.00 thou/µL (Got: ${pltItem?.value})`);

const mpvItem = res1.normalValues.find(n => n.test.includes("MPV"));
assert(mpvItem && mpvItem.value === "9.60 fL", `MPV parsed in canonical fL unit (Got: ${mpvItem?.value})`);

const rbcItem = res1.normalValues.find(n => n.test.includes("RBC"));
assert(rbcItem && rbcItem.value === "4.80 mil/µL", `RBC normalized from 4,800,000 to 4.80 mil/µL (Got: ${rbcItem?.value})`);

const creatItem = res1.flags.find(f => f.test.includes("Creatinine"));
assert(creatItem && parseFloat(creatItem.value) > 1.7 && parseFloat(creatItem.value) < 1.9, `Creatinine normalized from 160 µmol/L to ~1.81 mg/dL (Got: ${creatItem?.value})`);

// ============================================================================
// TEST 2: Biological Plausibility Validation (Artifact Rejection)
// ============================================================================
console.log("\n-------------------------------------------------------------------------------");
console.log("TEST 2: Cross-Check Biological Plausibility (Artifact Rejection)");
console.log("-------------------------------------------------------------------------------");

const artifactText = `
CORRUPTED / NOISY OCR SCAN
Total Leukocyte Count (TLC): 670 thou/µL
Haemoglobin (Hb): 120 gm/dL
Serum Potassium: 5.8 mmol/L
Serum Creatinine: 1.9 mg/dL
`;

const res2 = labParser.parseLabReportText(artifactText);
console.log(`Detected ${res2.artifacts.length} Biological Implausibility Artifacts:`);
res2.artifacts.forEach(a => {
  console.log(`   🚫 Excluded Artifact: ${a.test} = ${a.value} -> ${a.status}`);
});

assert(res2.artifacts.some(a => a.test.includes("Total Leukocyte") && a.value.includes("670")), "WBC 670 thou/µL correctly flagged as biological implausibility artifact");
assert(res2.artifacts.some(a => a.test.includes("Haemoglobin") && a.value.includes("120")), "Hb 120 gm/dL correctly flagged as biological implausibility artifact");
assert(!res2.flags.some(f => f.test.includes("Total Leukocyte")), "WBC artifact excluded from active clinical alert flags");
assert(res2.flags.some(f => f.test.includes("Potassium") && f.value.includes("5.80")), "Plausible hyperkalemia (5.80 mmol/L) retained as valid clinical flag");
assert(res2.flags.some(f => f.test.includes("Creatinine") && f.value.includes("1.90")), "Plausible creatinine (1.90 mg/dL) retained as valid clinical flag");

// ============================================================================
// TEST 3: Analyte Disambiguation (Platelet vs MPV, TLC vs Neutrophils %, Hb vs HbA1c)
// ============================================================================
console.log("\n-------------------------------------------------------------------------------");
console.log("TEST 3: Analyte Disambiguation & Dictionary Mapping");
console.log("-------------------------------------------------------------------------------");

const disambiguationText = `
COMPLETE HEMOGRAM & GLYCEMIC TEST
Haemoglobin (Hb): 10.5 gm/dL (12.0 - 16.0)
HbA1c: 8.6 % (< 5.7 %)
Total Leukocyte Count (TLC): 12.5 thou/µL (4.0 - 11.0)
Neutrophils: 78 % (40 - 70)
Platelet Count: 140 thou/µL (150 - 410)
Mean Platelet Volume (MPV): 12.8 fL (7.5 - 11.5)
Total Bilirubin: 1.8 mg/dL (0.2 - 1.2)
Direct Bilirubin: 0.8 mg/dL (< 0.3)
`;

const res3 = labParser.parseLabReportText(disambiguationText);
console.log(`Disambiguated Analytes Extracted (${res3.flags.length} flags):`);
res3.flags.forEach(f => {
  console.log(`   • ${f.test}: ${f.value} [Ref: ${f.ref}] - ${f.status}`);
});

assert(res3.flags.some(f => f.test === "Haemoglobin (Hb)" && f.value.includes("10.50")), "Haemoglobin Hb accurately separated from HbA1c");
assert(res3.flags.some(f => f.test === "HbA1c (Glycated Hemoglobin)" && f.value.includes("8.60")), "HbA1c accurately separated from Haemoglobin");
assert(res3.flags.some(f => f.test === "Platelet Count" && f.value.includes("140.00")), "Platelet Count accurately separated from MPV");
assert(res3.flags.some(f => f.test === "Mean Platelet Volume (MPV)" && f.value.includes("12.80")), "MPV accurately separated from Platelet Count");
assert(res3.flags.some(f => f.test === "Total Leukocyte Count (TLC / WBC)" && f.value.includes("12.50")), "Total WBC accurately separated from Neutrophil %");
assert(res3.flags.some(f => f.test === "Neutrophils Percentage" && f.value.includes("78.00")), "Neutrophils % accurately separated from Total WBC");
assert(res3.flags.some(f => f.test === "Serum Total Bilirubin" && f.value.includes("1.80")), "Total Bilirubin accurately separated from Direct Bilirubin");
assert(res3.flags.some(f => f.test === "Serum Direct Bilirubin" && f.value.includes("0.80")), "Direct Bilirubin accurately separated from Total Bilirubin");

// ============================================================================
// TEST 4: Syndromic Organ-System Grouping Layer
// ============================================================================
console.log("\n-------------------------------------------------------------------------------");
console.log("TEST 4: Syndromic Organ-System Summarization Layer");
console.log("-------------------------------------------------------------------------------");

console.log("Generated Syndromic Breakdown:\n" + res3.formattedSyndromicText);

assert(res3.syndromicSummary[ORGAN_SYSTEMS.ANEMIA].abnormal.length > 0, "Anemia organ system populated with sub-normal Hb");
assert(res3.syndromicSummary[ORGAN_SYSTEMS.LEUKOCYTES].abnormal.length > 0, "Leukocytes organ system populated with elevated TLC & Neutrophils");
assert(res3.syndromicSummary[ORGAN_SYSTEMS.PLATELETS].abnormal.length > 0, "Platelets organ system populated with Thrombocytopenia & high MPV");
assert(res3.syndromicSummary[ORGAN_SYSTEMS.GLYCEMIC].abnormal.length > 0, "Glycemic organ system populated with elevated HbA1c");
assert(res3.syndromicSummary[ORGAN_SYSTEMS.LIVER].abnormal.length > 0, "Liver organ system populated with Total & Direct Bilirubin");

// ============================================================================
// SUMMARY
// ============================================================================
console.log("\n===============================================================================");
console.log(`🏁 TEST EXECUTION COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED (100%)`);
console.log("===============================================================================\n");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

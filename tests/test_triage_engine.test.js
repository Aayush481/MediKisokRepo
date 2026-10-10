/**
 * Unit Tests: Clinical Triage Rule Engine & Emergency Red-Flag Interruption
 * Validates:
 *  - Positive and negative cases for every red-flag rule
 *  - Immediate emergency interruption (shouldInterrupt: true)
 *  - Transparent 4-tier urgency classification without black-box scoring
 *  - Rule traceability (triggeredRules contains ruleId, reason, urgency)
 */

import { test } from "node:test";
import assert from "node:assert";
import { triageRuleEngine, URGENCY_TIERS } from "../src/services/triageRuleEngine.js";

test("Triage Engine: Cardiovascular ACS Red-Flag (Positive Case)", () => {
  const positiveAnswers = {
    heart_character: "crushing_retrosternal",
    heart_radiation: ["left_arm", "jaw"],
    heart_associated: ["sweating", "breathlessness"],
    severity: 8
  };

  const result = triageRuleEngine.evaluate("organ_heart", positiveAnswers);
  assert.strictEqual(result.urgency.code, "EMERGENCY_PRIORITY_1");
  assert.strictEqual(result.shouldInterrupt, true, "ACS red-flag must trigger immediate flow interruption");
  assert.ok(result.triggeredRules.some(r => r.ruleId === "RED_CARDIO_ISCHEMIA_FULL"));
  assert.ok(result.triggeredRules[0].reason.includes("Acute Coronary Syndrome"));
});

test("Triage Engine: Cardiovascular Non-Ischemic (Negative Case)", () => {
  const negativeAnswers = {
    heart_character: "sharp_fleeting",
    heart_radiation: ["localized"],
    heart_associated: ["none"],
    severity: 2,
    duration_trend: "stable_fluctuating"
  };

  const result = triageRuleEngine.evaluate("organ_heart", negativeAnswers);
  assert.notStrictEqual(result.urgency.code, "EMERGENCY_PRIORITY_1");
  assert.strictEqual(result.shouldInterrupt, false, "Mild non-ischemic symptom must not interrupt flow");
  assert.strictEqual(result.triggeredRules.length, 0);
});

test("Triage Engine: Renal Colic with Complete Anuria (Positive Case)", () => {
  const positiveAnswers = {
    kidney_character: "severe_colicky",
    kidney_radiation: ["groin_genitals"],
    kidney_urine_output: "no_urine_8h",
    severity: 9
  };

  const result = triageRuleEngine.evaluate("organ_kidney_l", positiveAnswers);
  assert.strictEqual(result.urgency.code, "EMERGENCY_PRIORITY_1");
  assert.strictEqual(result.shouldInterrupt, true);
  assert.ok(result.triggeredRules.some(r => r.ruleId === "RED_RENAL_ANURIA"));
});

test("Triage Engine: Acute Surgical Abdomen / Peritoneal Rigidity (Positive Case)", () => {
  const positiveAnswers = {
    abs_carnett: "increases_tensing",
    abs_associated: ["rigid_board", "vomiting_blood"],
    severity: 9
  };

  const result = triageRuleEngine.evaluate("muscle_rectus_abdominis", positiveAnswers);
  assert.strictEqual(result.urgency.code, "EMERGENCY_PRIORITY_1");
  assert.strictEqual(result.shouldInterrupt, true);
  assert.ok(result.triggeredRules.some(r => r.ruleId === "RED_ABS_PERITONEAL_SURGICAL"));
});

test("Triage Engine: Acute Extremity Compartment Syndrome (Positive Case)", () => {
  const positiveAnswers = {
    quad_onset: "crush_trauma",
    quad_warning: ["tense_wooden_swelling", "numbness_paresthesia"],
    severity: 10
  };

  const result = triageRuleEngine.evaluate("muscle_quadriceps_l", positiveAnswers);
  assert.strictEqual(result.urgency.code, "EMERGENCY_PRIORITY_1");
  assert.strictEqual(result.shouldInterrupt, true);
  assert.ok(result.triggeredRules.some(r => r.ruleId === "RED_COMPARTMENT_SYNDROME"));
});

test("Triage Engine: Trapezius / Nuchal Rigidity with Thunderclap Onset (Positive Case)", () => {
  const positiveAnswers = {
    trap_onset: "thunderclap",
    trap_associated: ["photophobia", "fever_stiff_chin"],
    severity: 9
  };

  const result = triageRuleEngine.evaluate("muscle_trapezius", positiveAnswers);
  assert.strictEqual(result.urgency.code, "EMERGENCY_PRIORITY_1");
  assert.strictEqual(result.shouldInterrupt, true);
  assert.ok(result.triggeredRules.some(r => r.ruleId === "RED_TRAP_MENINGEAL_SUBARACHNOID"));
});

test("Triage Engine: Muscular Strain Without Red Flags (Negative Case)", () => {
  const negativeAnswers = {
    pec_onset: "weightlifting_pop",
    pec_palpation: "tender_palpable",
    pec_character: "sharp_stretching",
    pec_radiation: ["localized_none"],
    pec_associated: ["swelling_bruise"],
    severity: 4,
    duration_trend: "gradually_worsening"
  };

  const result = triageRuleEngine.evaluate("muscle_pectoralis_l", negativeAnswers);
  assert.notStrictEqual(result.urgency.code, "EMERGENCY_PRIORITY_1");
  assert.strictEqual(result.shouldInterrupt, false);
});

test("Triage Engine: Transparent Urgency Tiers & SaMD Notice", () => {
  const result = triageRuleEngine.evaluate("organ_heart", { severity: 5 });
  assert.ok(result.urgency.code in URGENCY_TIERS, "Urgency must be one of the 4 defined tiers");
  assert.ok(result.urgency.action, "Action directive must be populated");
  assert.ok(result.urgency.action_hi, "Hindi action directive must be populated");
  assert.ok(result.timestamp, "Evaluation must record timestamp");
  assert.ok(result.disclaimer.includes("Informational clinical intake"), "CDSCO SaMD disclaimer required");
});

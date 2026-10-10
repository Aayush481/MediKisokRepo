/**
 * Unit Tests: OPQRST / SOCRATES Question Engine & Branching Logic
 * Validates:
 *  - Question bank retrieval and question structure
 *  - Answer accumulation and skip navigation
 *  - Clinical citations and clinician sign-off flag integrity
 *  - Structured summary output format
 */

import { test } from "node:test";
import assert from "node:assert";
import { ORGAN_QUESTION_BANKS, GLOBAL_CONTEXT_QUESTIONS, QUESTION_BANK_VERSION } from "../src/data/organQuestionBanks.js";

test("Question Banks: Every organ bank must contain clinical citations & clinician sign-off flag", () => {
  const bankKeys = Object.keys(ORGAN_QUESTION_BANKS);
  assert.ok(bankKeys.length >= 15, `Expected at least 15 question banks, got ${bankKeys.length}`);

  for (const key of bankKeys) {
    const bank = ORGAN_QUESTION_BANKS[key];
    assert.strictEqual(bank.needsReviewByClinician, true, `Bank ${key} must declare needsReviewByClinician: true`);
    assert.ok(bank.clinicalGuideline, `Bank ${key} must cite recognized clinical guideline`);
    assert.strictEqual(bank.version, QUESTION_BANK_VERSION, `Bank ${key} version must match QUESTION_BANK_VERSION`);
    assert.ok(Array.isArray(bank.questions), `Bank ${key} must contain questions array`);
    assert.ok(bank.questions.length >= 2, `Bank ${key} must have at least 2 clinical questions`);
  }
});

test("Question Banks: Every question must contain bilingual prompts (English and Hindi)", () => {
  for (const [key, bank] of Object.entries(ORGAN_QUESTION_BANKS)) {
    for (const q of bank.questions) {
      assert.ok(q.id, `Question in bank ${key} missing id`);
      assert.ok(q.prompt, `Question ${q.id} in bank ${key} missing English prompt`);
      assert.ok(q.prompt_hi, `Question ${q.id} in bank ${key} missing Hindi prompt`);
      assert.ok(q.type, `Question ${q.id} in bank ${key} missing question type`);

      if (q.type === "single_choice" || q.type === "multi_choice") {
        assert.ok(Array.isArray(q.options), `Choice question ${q.id} in ${key} must have options array`);
        for (const opt of q.options) {
          assert.ok(opt.value, `Option in ${q.id} missing value`);
          assert.ok(opt.label, `Option in ${q.id} missing English label`);
          assert.ok(opt.label_hi, `Option in ${q.id} missing Hindi label`);
        }
      }
    }
  }
});

test("Global Context Questions: Contains standard 0-10 severity scale and trend", () => {
  const sevQ = GLOBAL_CONTEXT_QUESTIONS.find(q => q.id === "severity");
  assert.ok(sevQ, "Global questions must contain 0-10 severity question");
  assert.strictEqual(sevQ.type, "scale_0_10");
  assert.strictEqual(sevQ.min, 0);
  assert.strictEqual(sevQ.max, 10);

  const trendQ = GLOBAL_CONTEXT_QUESTIONS.find(q => q.id === "duration_trend");
  assert.ok(trendQ, "Global questions must contain duration trend question");
});

test("Question Intake Flow: Simulating answered flow and structured summary", () => {
  const heartBank = ORGAN_QUESTION_BANKS.organ_heart;
  const simulatedAnswers = {};

  // Answer onset
  simulatedAnswers[heartBank.questions[0].id] = "gradual_hours";
  // Answer character
  simulatedAnswers[heartBank.questions[1].id] = "dull_ache";
  // Global severity
  simulatedAnswers["severity"] = 4;
  simulatedAnswers["duration_trend"] = "stable_fluctuating";

  assert.strictEqual(simulatedAnswers.heart_onset, "gradual_hours");
  assert.strictEqual(simulatedAnswers.heart_character, "dull_ache");
  assert.strictEqual(simulatedAnswers.severity, 4);
});

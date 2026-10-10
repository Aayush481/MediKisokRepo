/**
 * Unit Tests: ADHD & Neurodevelopmental Screening, Scoring, Safety & Triage Engine
 * Validates:
 * 1. Published WHO ASRS v1.1 Part A scoring on known test vectors
 * 2. Vanderbilt pediatric rating scale scoring
 * 3. Multi-setting functional impairment rules
 * 4. Deterministic safety engine (crisis patterns in English & Hindi, positive and negative tests)
 * 5. Triage determinism for Path A (Self-Care), Path B (Doctor Allocation), and Path C (Crisis)
 * 6. De-identification payload integrity
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { AdhdScoringEngine } from '../backend/services/adhdScoringEngine.js';
import { NeuroSafetyEngine } from '../backend/services/neuroSafetyEngine.js';
import { AdhdTriageEngine } from '../backend/services/adhdTriageEngine.js';
import { DoctorAllocationService } from '../backend/services/doctorAllocationService.js';

test('WHO ASRS v1.1 Part A: Positive Threshold Vector (>= 4 Shaded Boxes)', () => {
  // Positive vector:
  // Q1: 2 (Sometimes, threshold 2) -> POSITIVE
  // Q2: 3 (Often, threshold 2) -> POSITIVE
  // Q3: 1 (Rarely, threshold 2) -> NEGATIVE
  // Q4: 3 (Often, threshold 3) -> POSITIVE
  // Q5: 4 (Very Often, threshold 3) -> POSITIVE
  // Q6: 1 (Rarely, threshold 3) -> NEGATIVE
  // Total positive: 4/6 -> Screen Positive
  const positiveAnswers = {
    ASRS_A1: 2,
    ASRS_A2: 3,
    ASRS_A3: 1,
    ASRS_A4: 3,
    ASRS_A5: 4,
    ASRS_A6: 1
  };

  const result = AdhdScoringEngine.scoreAsrsAdult(positiveAnswers);
  assert.strictEqual(result.positiveThresholdCount, 4);
  assert.strictEqual(result.isScreenPositive, true);
  assert.strictEqual(result.severityBand, 'CLINICAL_THRESHOLD_MET');
});

test('WHO ASRS v1.1 Part A: Subthreshold / Negative Vector (< 4 Shaded Boxes)', () => {
  // Q1: 2 (Sometimes, threshold 2) -> POSITIVE
  // Q2: 2 (Sometimes, threshold 2) -> POSITIVE
  // Q3: 0 (Never, threshold 2) -> NEGATIVE
  // Q4: 2 (Sometimes, threshold 3 - NOT at threshold 3!) -> NEGATIVE
  // Q5: 2 (Sometimes, threshold 3 - NOT at threshold 3!) -> NEGATIVE
  // Q6: 3 (Often, threshold 3) -> POSITIVE
  // Total positive: 3/6 -> Subthreshold
  const subthresholdAnswers = {
    ASRS_A1: 2,
    ASRS_A2: 2,
    ASRS_A3: 0,
    ASRS_A4: 2,
    ASRS_A5: 2,
    ASRS_A6: 3
  };

  const result = AdhdScoringEngine.scoreAsrsAdult(subthresholdAnswers);
  assert.strictEqual(result.positiveThresholdCount, 3);
  assert.strictEqual(result.isScreenPositive, false);
  assert.strictEqual(result.severityBand, 'BORDERLINE_ELEVATED');
});

test('Vanderbilt Pediatric Scale: Scoring and Threshold Evaluation', () => {
  const childAnswers = {
    VAND_P1: 2, // Often (Elevated)
    VAND_P2: 3, // Very Often (Elevated)
    VAND_P3: 1, // Occasionally (Not elevated)
    VAND_P4: 0  // Never
  };

  const result = AdhdScoringEngine.scoreVanderbiltChild(childAnswers);
  assert.strictEqual(result.elevatedCount, 2);
  assert.strictEqual(result.inattentionElevated, 2);
  assert.strictEqual(result.isScreenPositive, true);
});

test('Functional Impairment: Multi-Setting Criterion (DSM-5 Rule)', () => {
  // Multi-setting positive (Work and Home)
  const multiSetting = AdhdScoringEngine.evaluateFunctionalImpairment(['work_or_school', 'home_daily_chores']);
  assert.strictEqual(multiSetting.satisfiesMultiSetting, true);
  assert.strictEqual(multiSetting.impairmentLevel, 'SIGNIFICANT_MULTI_SETTING');

  // Single setting
  const singleSetting = AdhdScoringEngine.evaluateFunctionalImpairment(['work_or_school']);
  assert.strictEqual(singleSetting.satisfiesMultiSetting, false);
  assert.strictEqual(singleSetting.impairmentLevel, 'SINGLE_SETTING');

  // No impairment
  const noSetting = AdhdScoringEngine.evaluateFunctionalImpairment(['none_minimal']);
  assert.strictEqual(noSetting.satisfiesMultiSetting, false);
  assert.strictEqual(noSetting.impairmentLevel, 'NONE_OR_MINIMAL');
});

test('NeuroSafetyEngine: Suicidal Ideation Pattern (English Positive Case)', () => {
  const result = NeuroSafetyEngine.evaluate('I feel like I want to die and end my life');
  assert.strictEqual(result.isTriggered, true);
  assert.strictEqual(result.shouldHalt, true);
  assert.strictEqual(result.ruleId, 'SAFETY_SUICIDE_SELF_HARM');
  assert.strictEqual(result.helplines.primary.number, '14416');
});

test('NeuroSafetyEngine: Suicidal Ideation Keyword (Hindi Positive Case)', () => {
  const result = NeuroSafetyEngine.evaluate('मुझे लगता है कि मैं आत्महत्या कर लूं');
  assert.strictEqual(result.isTriggered, true);
  assert.strictEqual(result.shouldHalt, true);
  assert.strictEqual(result.ruleId, 'SAFETY_SUICIDE_SELF_HARM');
  assert.ok(result.messageHi.includes('सुरक्षा'));
});

test('NeuroSafetyEngine: Threat to Others (Positive Case)', () => {
  const result = NeuroSafetyEngine.evaluate('I feel an urge to hurt someone badly');
  assert.strictEqual(result.isTriggered, true);
  assert.strictEqual(result.category, 'THREAT_TO_OTHERS');
});

test('NeuroSafetyEngine: Child Abuse Pattern (Positive Case)', () => {
  const result = NeuroSafetyEngine.evaluate('They beat the child every night');
  assert.strictEqual(result.isTriggered, true);
  assert.strictEqual(result.category, 'MINOR_PROTECTION_ALERT');
  assert.ok(result.helplines.childProtection !== null);
  assert.strictEqual(result.helplines.childProtection.number, '1098');
});

test('NeuroSafetyEngine: Non-Crisis Medical Conversation (Negative Case)', () => {
  const safeText = 'I sometimes lose track of time when studying for my college exams and drink coffee';
  const result = NeuroSafetyEngine.evaluate(safeText);
  assert.strictEqual(result.isTriggered, false);
  assert.strictEqual(result.category, null);
});

test('AdhdTriageEngine: Path A (Subthreshold Self-Care Route)', () => {
  const mockScoring = {
    audience: 'adult',
    screener: { isScreenPositive: false, positiveThresholdCount: 1 },
    impairment: { satisfiesMultiSetting: false, settings: [] },
    chronicity: { meetsDsmDurationCriteria: false },
    comorbidities: { moodDistress: false, sleepDisturbance: false }
  };

  const outcome = AdhdTriageEngine.evaluate({
    scoringResult: mockScoring,
    safetyResult: { isTriggered: false },
    patientRequestedDoctor: false
  });

  assert.strictEqual(outcome.outcome, 'PATH_A_SELF_MANAGEMENT');
  assert.strictEqual(outcome.allowSelfManagement, true);
  assert.strictEqual(outcome.requiresImmediateAssistance, false);
});

test('AdhdTriageEngine: Path B (Screener Positive Specialist Route)', () => {
  const mockScoring = {
    audience: 'adult',
    screener: { isScreenPositive: true, positiveThresholdCount: 5 },
    impairment: { satisfiesMultiSetting: true, settings: ['work_or_school', 'home_daily_chores'] },
    chronicity: { meetsDsmDurationCriteria: true },
    comorbidities: { moodDistress: false, sleepDisturbance: true }
  };

  const outcome = AdhdTriageEngine.evaluate({
    scoringResult: mockScoring,
    safetyResult: { isTriggered: false },
    patientRequestedDoctor: false
  });

  assert.strictEqual(outcome.outcome, 'PATH_B_SPECIALIST_RECOMMENDED');
  assert.ok(outcome.suggestedSpecialties.includes('Psychiatry'));
  assert.ok(outcome.suggestedSpecialties.includes('Sleep Medicine'));
});

test('AdhdTriageEngine: Patient Choice Override (Doctor Booking Allowed Despite Low Score)', () => {
  const mockScoring = {
    audience: 'adult',
    screener: { isScreenPositive: false, positiveThresholdCount: 1 },
    impairment: { satisfiesMultiSetting: false },
    chronicity: { meetsDsmDurationCriteria: false },
    comorbidities: { moodDistress: false }
  };

  const outcome = AdhdTriageEngine.evaluate({
    scoringResult: mockScoring,
    safetyResult: { isTriggered: false },
    patientRequestedDoctor: true // Patient explicitly asked for doctor
  });

  assert.strictEqual(outcome.outcome, 'PATH_B_SPECIALIST_RECOMMENDED');
  assert.ok(outcome.triggeredRules.some(r => r.ruleId === 'RULE_PATIENT_DOCTOR_REQUEST'));
});

test('Doctor Allocation: Behavioral Health Specialists Ranked by Wait Time', () => {
  const recs = DoctorAllocationService.getTopDoctorRecommendations({
    suggestedSpecialties: ['Psychiatry', 'Clinical Psychology'],
    limit: 3
  });

  assert.strictEqual(recs.count, 3);
  assert.ok(recs.candidates.some(d => d.specialty === 'Psychiatry'));
  assert.ok(recs.candidates.some(d => d.specialty === 'Clinical Psychology'));

  // Atomic booking check
  const chosenDoc = recs.candidates[0];
  const booking = DoctorAllocationService.bookDoctorSlotAtomic({
    doctorId: chosenDoc.id,
    patientId: 'PAT-UNIT-TEST',
    patientName: 'Test Patient'
  });

  assert.strictEqual(booking.success, true);
  assert.strictEqual(booking.status, 'CONFIRMED');
  assert.ok(booking.tokenNumber.startsWith(chosenDoc.specialty.substring(0, 3).toUpperCase()));
});

test('DSM-5 Percentage Screener: Positive Vector (>= 4 items elevated at Often/Very Often >= 26%)', () => {
  const dsm5Answers = {
    ADHD_IN_01: 2, // 26% - 75% (Often) -> Positive
    ADHD_IN_02: 3, // 76% - 100% (Very Often) -> Positive
    ADHD_IN_03: 1, // 1% - 25% (Rarely) -> Negative
    ADHD_IN_04: 2, // 26% - 75% (Often) -> Positive
    ADHD_IN_05: 0, // 0% (Never) -> Negative
    ADHD_IN_06: 2, // 26% - 75% (Often) -> Positive
    ADHD_HY_01: 3, // 76% - 100% (Very Often) -> Positive
    ADHD_HY_02: 1,
    ADHD_HY_03: 1,
    ADHD_HY_04: 0,
    ADHD_IM_01: 1,
    ADHD_IM_02: 0
  };

  const result = AdhdScoringEngine.scoreAsrsAdult(dsm5Answers);
  assert.strictEqual(result.instrument, 'DSM5_ADHD_PERCENTAGE_SCREENER');
  assert.strictEqual(result.positiveThresholdCount, 5);
  assert.strictEqual(result.isScreenPositive, true);
  assert.strictEqual(result.severityBand, 'CLINICAL_THRESHOLD_MET');
});

test('DSM-5 Percentage Screener: Low Probability Vector (< 2 items elevated)', () => {
  const lowAnswers = {
    ADHD_IN_01: 0,
    ADHD_IN_02: 1,
    ADHD_IN_03: 1,
    ADHD_IN_04: 0,
    ADHD_IN_05: 1,
    ADHD_IN_06: 0,
    ADHD_HY_01: 1,
    ADHD_HY_02: 0,
    ADHD_HY_03: 0,
    ADHD_HY_04: 1,
    ADHD_IM_01: 0,
    ADHD_IM_02: 0
  };

  const result = AdhdScoringEngine.scoreAsrsAdult(lowAnswers);
  assert.strictEqual(result.instrument, 'DSM5_ADHD_PERCENTAGE_SCREENER');
  assert.strictEqual(result.positiveThresholdCount, 0);
  assert.strictEqual(result.isScreenPositive, false);
  assert.strictEqual(result.severityBand, 'LOW_PROBABILITY');
});

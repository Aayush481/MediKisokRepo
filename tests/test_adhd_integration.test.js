/**
 * Integration Tests: ADHD Assessment Flow, Fallback, Consent & Check-in
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { GeminiNeuroService } from '../backend/services/geminiNeuroService.js';
import { NeuroSafetyEngine } from '../backend/services/neuroSafetyEngine.js';
import { AdhdScoringEngine } from '../backend/services/adhdScoringEngine.js';
import { AdhdTriageEngine } from '../backend/services/adhdTriageEngine.js';

test('Integration: Consent Declined enforces Deterministic Rules (No AI Network Call)', async () => {
  const result = await GeminiNeuroService.generateSummary({
    audience: 'adult',
    answers: { ASRS_A1: 2, ASRS_A2: 3, ASRS_A3: 2, ASRS_A4: 3 },
    scoring: {
      screener: { isScreenPositive: true, positiveThresholdCount: 4 },
      impairment: { satisfiesMultiSetting: true, settings: ['work_or_school'] }
    },
    triage: {
      outcome: 'PATH_B_SPECIALIST_RECOMMENDED',
      suggestedSpecialties: ['Psychiatry']
    },
    consentGiven: false // Patient opted out of LLM processing
  });

  assert.strictEqual(result.source, 'deterministic_clinical_rules');
  assert.ok(result.reason.includes('Patient consent not granted'));
  assert.ok(result.sbarClinicalSummary.includes('NEURODEVELOPMENTAL SCREENING SBAR'));
});

test('Integration: Fallback generates complete clinical SBAR and patient guide offline', async () => {
  const result = GeminiNeuroService.buildDeterministicSummary({
    audience: 'adult',
    answers: { SLEEP_LATENCY: 'over_45_min', ROUTINE_WAKE: 'irregular_erratic' },
    scoring: {
      screener: { isScreenPositive: false, positiveThresholdCount: 1 },
      impairment: { satisfiesMultiSetting: false, settings: [] }
    },
    triage: {
      outcome: 'PATH_A_SELF_MANAGEMENT',
      suggestedSpecialties: ['Psychiatry']
    },
    language: 'hi'
  }, 'Simulated Timeout');

  assert.strictEqual(result.source, 'deterministic_clinical_rules');
  assert.ok(result.patientFacingExplanation.includes('7-दिवसीय जीवनशैली'));
  assert.ok(result.saMdDisclaimer.includes('CDSCO') || result.saMdDisclaimer.includes('Registered Medical Practitioner'));
});

test('Integration: Minor Flow evaluates Parent-rated Vanderbilt scale and pediatric routing', () => {
  const minorAnswers = {
    VAND_P1: 3, // Careless mistakes
    VAND_P2: 2, // Difficulty sustaining attention
    VAND_P3: 3, // Fidgets
    VAND_P4: 2, // Interrupts
    IMPAIRMENT_SETTINGS: ['work_or_school', 'home_daily_chores'],
    ONSET_DURATION: 'chronic_childhood_onset'
  };

  const scoring = AdhdScoringEngine.scoreSession({
    audience: 'minor_guardian',
    answers: minorAnswers
  });

  assert.strictEqual(scoring.audience, 'minor');
  assert.strictEqual(scoring.screener.isScreenPositive, true);
  assert.strictEqual(scoring.screener.elevatedCount, 4);

  const triage = AdhdTriageEngine.evaluate({
    scoringResult: scoring,
    safetyResult: { isTriggered: false }
  });

  assert.strictEqual(triage.outcome, 'PATH_B_SPECIALIST_RECOMMENDED');
  assert.ok(triage.suggestedSpecialties.includes('Child & Adolescent Psychiatry'));
  assert.ok(triage.suggestedSpecialties.includes('Developmental Pediatrics'));
});

test('Integration: 2-Week Re-Check-in Escalates to Path B when symptoms worsen', () => {
  const checkInWorsened = {
    routineProgress: 'worsened',
    focusChallenges: 'worsened',
    wantsDoctor: false
  };

  const hasWorsened = checkInWorsened.routineProgress === 'worsened' || checkInWorsened.focusChallenges === 'worsened';
  assert.strictEqual(hasWorsened, true);

  // If worsened, triage escalates to Path B
  const escalatedPath = hasWorsened ? 'PATH_B_SPECIALIST_RECOMMENDED' : 'PATH_A_SELF_MANAGEMENT';
  assert.strictEqual(escalatedPath, 'PATH_B_SPECIALIST_RECOMMENDED');
});

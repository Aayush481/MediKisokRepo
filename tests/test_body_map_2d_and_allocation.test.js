/**
 * Comprehensive Integration & Unit Test Suite:
 * 2D Human Skeleton & Visceral Anatomy Engine, Cross-Region Synergy, and Doctor Allocation Service
 */

process.env.NODE_ENV = 'test';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { ANATOMY_REGISTRY } from '../src/data/anatomyRegistry.js';
import { ORGAN_QUESTION_BANKS } from '../src/data/organQuestionBanks.js';
import { BodyMap2D, BodyMap2DFallback } from '../src/components/BodyMap2D.js';
import { triageRuleEngine } from '../src/services/triageRuleEngine.js';
import { GeminiIntakeService, ANATOMICAL_SPECIALTY_MAP } from '../backend/services/geminiIntakeService.js';
import { DoctorAllocationService } from '../backend/services/doctorAllocationService.js';

describe('1. 2D Human Skeleton & Anatomy SVG Verification', () => {
  let mockContainer;
  let bodyMapInstance;

  before(() => {
    // Lightweight mock DOM environment for SVG testing
    mockContainer = {
      innerHTML: '',
      querySelector: () => null,
      querySelectorAll: () => []
    };
    bodyMapInstance = new BodyMap2D(mockContainer);
  });

  test('Component exports BodyMap2D and backward compatible BodyMap2DFallback', () => {
    assert.ok(typeof BodyMap2D === 'function', 'BodyMap2D must be exported');
    assert.strictEqual(BodyMap2D, BodyMap2DFallback, 'BodyMap2DFallback must alias BodyMap2D');
  });

  test('Anterior (Front) SVG contains full skeleton and visceral organs', () => {
    const frontSvg = bodyMapInstance._renderFrontViewSVG(['organ_heart']);
    
    // Skeleton bones
    assert.ok(frontSvg.includes('id="skel_skull"'), 'Skull must be in front view');
    assert.ok(frontSvg.includes('id="skel_spine_cervical"'), 'Cervical spine must be in front view');
    assert.ok(frontSvg.includes('id="skel_ribcage"'), 'Rib cage & Sternum must be in front view');
    assert.ok(frontSvg.includes('id="skel_spine_lumbar"'), 'Lumbar spine must be in front view');
    assert.ok(frontSvg.includes('id="skel_pelvis"'), 'Pelvis must be in front view');
    assert.ok(frontSvg.includes('id="skel_spine_sacrum"'), 'Sacrum must be in front view');

    // Articular Joints
    assert.ok(frontSvg.includes('id="joint_shoulder_r"'), 'Right shoulder must be present');
    assert.ok(frontSvg.includes('id="joint_shoulder_l"'), 'Left shoulder must be present');
    assert.ok(frontSvg.includes('id="joint_elbow_r"'), 'Right elbow must be present');
    assert.ok(frontSvg.includes('id="joint_wrist_r"'), 'Right wrist must be present');
    assert.ok(frontSvg.includes('id="joint_hip_r"'), 'Right hip must be present');
    assert.ok(frontSvg.includes('id="joint_knee_r"'), 'Right knee must be present');
    assert.ok(frontSvg.includes('id="joint_ankle_r"'), 'Right ankle must be present');

    // Superficial & Deep Organs
    assert.ok(frontSvg.includes('id="organ_brain"'), 'Brain must be in front view');
    assert.ok(frontSvg.includes('id="organ_thyroid"'), 'Thyroid must be in front view');
    assert.ok(frontSvg.includes('id="organ_lungs"'), 'Lungs must be in front view');
    assert.ok(frontSvg.includes('id="organ_heart"'), 'Heart must be in front view');
    assert.ok(frontSvg.includes('id="organ_liver"'), 'Liver must be in front view');
    assert.ok(frontSvg.includes('id="organ_gallbladder"'), 'Gallbladder must be in front view');
    assert.ok(frontSvg.includes('id="organ_stomach"'), 'Stomach must be in front view');
    assert.ok(frontSvg.includes('id="organ_pancreas"'), 'Pancreas must be in front view');
    assert.ok(frontSvg.includes('id="organ_spleen"'), 'Spleen must be in front view');
    assert.ok(frontSvg.includes('id="organ_bladder"'), 'Bladder must be in front view');
    assert.ok(frontSvg.includes('id="organ_small_intestine"'), 'Small intestine must be in front view');
    assert.ok(frontSvg.includes('id="organ_large_intestine"'), 'Large intestine must be in front view');
    assert.ok(frontSvg.includes('id="organ_reproductive"'), 'Reproductive organs must be in front view');
  });

  test('Posterior (Back) SVG provides dorsal spine and retroperitoneal renal access', () => {
    const backSvg = bodyMapInstance._renderBackViewSVG([]);
    
    assert.ok(backSvg.includes('id="organ_kidney_l"'), 'Left kidney must be prominent in posterior view');
    assert.ok(backSvg.includes('id="organ_kidney_r"'), 'Right kidney must be prominent in posterior view');
    assert.ok(backSvg.includes('id="organ_ureter_l"'), 'Left ureter must be in posterior view');
    assert.ok(backSvg.includes('id="organ_ureter_r"'), 'Right ureter must be in posterior view');
    assert.ok(backSvg.includes('id="skel_spine_thoracic"'), 'Thoracic spine must be in posterior view');
    assert.ok(backSvg.includes('id="skel_spine_lumbar"'), 'Lumbar spine must be in posterior view');
    assert.ok(backSvg.includes('id="skel_spine_sacrum"'), 'Sacrum & coccyx must be in posterior view');
  });
});

describe('2. Question Banks & Clinical Red-Flags Completeness', () => {
  test('All newly added organs have formal clinical question banks', () => {
    const requiredOrgans = [
      'organ_gallbladder',
      'organ_pancreas',
      'organ_spleen',
      'organ_ureter_l',
      'organ_ureter_r',
      'organ_bladder',
      'organ_small_intestine',
      'organ_large_intestine',
      'organ_thyroid',
      'organ_reproductive',
      'skel_skull',
      'skel_ribcage',
      'skel_pelvis',
      'skel_spine_sacrum',
      'joint_shoulder_l',
      'joint_elbow_l',
      'joint_wrist_l',
      'joint_hip_l',
      'joint_ankle_l'
    ];

    for (const orgId of requiredOrgans) {
      const bank = ORGAN_QUESTION_BANKS[orgId];
      assert.ok(bank, `Question bank must exist for ${orgId}`);
      assert.ok(Array.isArray(bank.questions), `Questions array must exist for ${orgId}`);
      assert.ok(bank.questions.length > 0, `Must have at least 1 question for ${orgId}`);
      assert.ok(bank.clinicalGuideline, `Clinical guideline citation required for ${orgId}`);
    }
  });

  test('Gallbladder Charcot Triad triggers EMERGENCY_PRIORITY_1', () => {
    const gbAnswers = {
      gb_symptoms: ['jaundice_yellowing', 'high_fever_chills'],
      severity: 9
    };
    const triage = triageRuleEngine.evaluate('organ_gallbladder', gbAnswers);
    assert.strictEqual(triage.urgencyTier, 'EMERGENCY_PRIORITY_1');
    assert.strictEqual(triage.shouldInterrupt, true);
    assert.ok(triage.triggeredRules.some(r => r.ruleId === 'RED_BILIARY_CHARCOT_TRIAD'));
  });

  test('Cross-region synergy rule: Chest (Heart) + Left Arm triggers Emergency Triage', () => {
    // Multi-select contains heart and left shoulder joint
    const triage = triageRuleEngine.evaluate('organ_heart', {}, ['organ_heart', 'joint_shoulder_l']);
    assert.strictEqual(triage.urgencyTier, 'EMERGENCY_PRIORITY_1', 'Cross-region cardio + left arm must be EMERGENCY_PRIORITY_1');
    assert.strictEqual(triage.shouldInterrupt, true);
    assert.ok(triage.triggeredRules.some(r => r.ruleId === 'RED_CROSS_REGION_CARDIO_ARM'));
  });
});

describe('3. Server-Side Clinical Summarization & Doctor Allocation', () => {
  test('GeminiIntakeService produces deterministic summary on missing key or timeout', async () => {
    const summary = await GeminiIntakeService.summarizeIntake({
      selectedParts: ['organ_heart'],
      answers: { severity: 7, duration_trend: 'rapidly_worsening' },
      language: 'en',
      triageResult: { urgencyTier: 'URGENT_PRIORITY_2', isEmergency: false },
      consentGiven: true
    });

    assert.ok(summary.clinicalSummary, 'Must contain clinical SBAR summary');
    assert.ok(summary.patientSummary, 'Must contain patient explanation');
    assert.ok(summary.suggestedSpecialties.includes('Cardiology'), 'Must suggest Cardiology for heart');
    assert.ok(summary.saMdDisclaimer, 'Must include CDSCO SaMD disclaimer');
  });

  test('GeminiIntakeService respects DPDP 2023 consent refusal', async () => {
    const summary = await GeminiIntakeService.summarizeIntake({
      selectedParts: ['organ_liver'],
      answers: { severity: 4 },
      language: 'en',
      consentGiven: false
    });

    assert.strictEqual(summary.source, 'deterministic_clinical_rules');
    assert.ok(summary.reason.includes('consent not granted'));
    assert.ok(summary.suggestedSpecialties.includes('Gastroenterology / Hepatology'));
  });

  test('DoctorAllocationService routes Emergency Priority 1 directly to ER Bay 1', () => {
    const allocation = DoctorAllocationService.allocateDoctor({
      suggestedSpecialties: ['Cardiology'],
      urgencyTier: 'EMERGENCY_PRIORITY_1',
      patientId: 'P-9999'
    });

    assert.strictEqual(allocation.specialtyMatched, 'Emergency Medicine');
    assert.strictEqual(allocation.queuePosition, 0);
    assert.strictEqual(allocation.estimatedWaitMinutes, 0);
    assert.ok(allocation.tokenNumber.startsWith('EMG-'));
  });

  test('DoctorAllocationService scores and routes Orthopedic routine patient to shortest queue', () => {
    const allocation = DoctorAllocationService.allocateDoctor({
      suggestedSpecialties: ['Orthopedics'],
      urgencyTier: 'ROUTINE_PRIORITY_3',
      patientId: 'P-1234'
    });

    assert.strictEqual(allocation.allocatedDoctor.specialty, 'Orthopedics');
    assert.ok(allocation.queuePosition >= 1);
    assert.ok(allocation.estimatedWaitMinutes >= 0);
    assert.ok(allocation.tokenNumber.startsWith('ORT-'));
  });
});

describe('4. REST API Endpoint: POST /api/intake/summarize-and-allocate', () => {
  let server;
  let app;
  const PORT = 3846;
  const baseUrl = `http://localhost:${PORT}`;

  before(async () => {
    const serverModule = await import('../backend/server.js');
    app = serverModule.default;
    server = app.listen(PORT);
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  after(async () => {
    if (server) server.close();
  });

  test('POST /api/intake/summarize-and-allocate executes end-to-end clinical workflow', async () => {
    const res = await fetch(`${baseUrl}/api/intake/summarize-and-allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedParts: ['organ_kidney_l', 'organ_ureter_l'],
        answers: { severity: 6, ureter_pain_character: 'waves_agonizing' },
        language: 'hi',
        triageResult: { urgencyTier: 'ROUTINE_PRIORITY_3', isEmergency: false },
        consentGiven: true,
        patientId: 'PAT-4819'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'success');
    assert.ok(body.summary.clinicalSummary);
    assert.ok(body.summary.suggestedSpecialties.some(s => s.includes('Urology') || s.includes('Nephrology')));
    assert.ok(body.allocation.allocatedDoctor);
    assert.ok(body.allocation.tokenNumber);
  });
});

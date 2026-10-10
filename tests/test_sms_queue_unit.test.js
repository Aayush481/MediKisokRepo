/**
 * Unit Test Suite: Queue ETA, DLT Template Validation, Deduplication & Rules Engine
 * Uses Node's built-in test runner (node:test, node:assert)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { QueueDomainService } from '../backend/services/queueDomainService.js';
import { DltTemplateValidator } from '../backend/services/sms/dltTemplateValidator.js';
import { NotificationRulesEngine } from '../backend/services/notificationRulesEngine.js';

describe('1. ETA Calculation & Rolling Average Metrics', () => {
  let queueService;

  beforeEach(() => {
    queueService = new QueueDomainService();
  });

  test('Calculates baseline duration when no consultation history exists', () => {
    const metrics = queueService.getDoctorDurationMetrics('DOC_TEST');
    assert.equal(metrics.average, 8.5);
    assert.equal(metrics.min, 6);
    assert.equal(metrics.max, 11);
  });

  test('Updates rolling average based on recorded consultation durations', () => {
    queueService.recordDoctorConsultationDuration('DOC_TEST', 10);
    queueService.recordDoctorConsultationDuration('DOC_TEST', 12);
    queueService.recordDoctorConsultationDuration('DOC_TEST', 8);

    const metrics = queueService.getDoctorDurationMetrics('DOC_TEST');
    assert.equal(metrics.average, 10.0);
    assert.ok(metrics.min <= 10.0);
    assert.ok(metrics.max >= 10.0);
  });

  test('Computes honest ETA ranges for varying positions', () => {
    queueService.recordDoctorConsultationDuration('DOC_TEST', 10);
    // 0 positions ahead => immediate
    const eta0 = queueService.calculateEtaRange('DOC_TEST', 0);
    assert.equal(eta0.timeRangeStr, 'Immediate (Now)');

    // 3 positions ahead => honest range
    const eta3 = queueService.calculateEtaRange('DOC_TEST', 3);
    assert.ok(eta3.minWaitMins > 0);
    assert.ok(eta3.maxWaitMins > eta3.minWaitMins);
    assert.match(eta3.timeRangeStr, /\d{1,2}:\d{2}\s?(AM|PM)\s-\s\d{1,2}:\d{2}\s?(AM|PM)/i);
  });
});

describe('2. TRAI DLT Template & Variable Validation', () => {
  test('Validates and renders English TOKEN_BOOKED template correctly', () => {
    const result = DltTemplateValidator.validateAndRender('TOKEN_BOOKED', [
      'Priya',
      'A-12',
      'Dr. Sharma',
      '15-20 mins',
      'https://medikiosk.gov.in/q/tk1'
    ], 'en');

    assert.equal(result.valid, true);
    assert.equal(result.templateId, '1407168000000000001');
    assert.equal(result.isUnicode, false);
    assert.match(result.renderedText, /Namaste Priya, your Token #A-12 is confirmed for Dr. Sharma/);
  });

  test('Validates and renders Hindi TOKEN_CALLED template (UCS-2 Unicode)', () => {
    const result = DltTemplateValidator.validateAndRender('TOKEN_CALLED', [
      'A-12',
      'Dr. Sharma',
      'OPD Cabin 3'
    ], 'hi');

    assert.equal(result.valid, true);
    assert.equal(result.templateId, '1407168000000000003');
    assert.equal(result.isUnicode, true);
    assert.match(result.renderedText, /आवश्यक: टोकन #A-12, अब आपकी बारी है/);
  });

  test('Rejects template if variable count does not match registration', () => {
    const result = DltTemplateValidator.validateAndRender('TOKEN_CALLED', ['A-12'], 'en');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('requires exactly 3 variables')));
  });

  test('Blocks variable containing newline injection attempts', () => {
    const result = DltTemplateValidator.validateAndRender('TOKEN_CALLED', [
      'A-12\nINJECTION',
      'Cabin 3',
      'Dr. Sharma'
    ], 'en');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('newline characters')));
  });

  test('Blocks variable exceeding maximum DLT character length', () => {
    const overlyLongName = 'A'.repeat(50);
    const result = DltTemplateValidator.validateAndRender('TOKEN_BOOKED', [
      overlyLongName,
      'A-12',
      'Dr. Sharma',
      '15m',
      'https://url'
    ], 'en');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('exceeds maximum DLT limit')));
  });
});

describe('3. Notification Rules Engine & Deduplication Keys', () => {
  let rulesEngine;

  beforeEach(() => {
    rulesEngine = new NotificationRulesEngine({
      quietHoursStartHour: 21,
      quietHoursEndHour: 7
    });
  });

  test('Generates deterministic deduplication keys: tokenId + eventType + version', () => {
    const key1 = rulesEngine.getDedupKey('TK-901', 'TOKEN_BOOKED', 1);
    const key2 = rulesEngine.getDedupKey('TK-901', 'TOKEN_BOOKED', 1);
    const key3 = rulesEngine.getDedupKey('TK-901', 'TOKEN_BOOKED', 2);

    assert.equal(key1, 'TK-901_TOKEN_BOOKED_v1');
    assert.equal(key1, key2);
    assert.notEqual(key1, key3);
  });

  test('Suppresses notifications if patient has not given consent', () => {
    const token = {
      tokenId: 'TK-101',
      tokenNumber: 'A-01',
      consentGiven: false,
      patientMobile: '+919876543210'
    };
    const evalResult = rulesEngine.evaluate('TOKEN_BOOKED', token);
    assert.equal(evalResult.shouldSend, false);
    assert.match(evalResult.reason, /consent/);
  });

  test('Suppresses notifications if patient has opted out', () => {
    const token = {
      tokenId: 'TK-101',
      tokenNumber: 'A-01',
      consentGiven: true,
      optedOut: true,
      patientMobile: '+919876543210'
    };
    const evalResult = rulesEngine.evaluate('TOKEN_BOOKED', token);
    assert.equal(evalResult.shouldSend, false);
    assert.match(evalResult.reason, /opted out/);
  });

  test('Allows TOKEN_CALLED emergency alerts even during quiet hours', () => {
    // Force quiet hours simulation
    rulesEngine.isQuietHours = () => true;

    const token = {
      tokenId: 'TK-101',
      tokenNumber: 'A-01',
      consentGiven: true,
      optedOut: false,
      patientMobile: '+919876543210',
      patientName: 'Priya Patel',
      cabin: 'Cabin 3',
      doctorName: 'Dr. Sharma'
    };

    const evalResult = rulesEngine.evaluate('TOKEN_CALLED', token);
    assert.equal(evalResult.shouldSend, true);
  });

  test('Suppresses minor delay notification below 15-minute threshold', () => {
    // Mock daylight hours
    rulesEngine.isQuietHours = () => false;

    const token = {
      tokenId: 'TK-101',
      tokenNumber: 'A-01',
      consentGiven: true,
      optedOut: false,
      patientMobile: '+919876543210'
    };
    const evalResult = rulesEngine.evaluate('QUEUE_DELAYED', token, { delayMinutes: 5 });
    assert.equal(evalResult.shouldSend, false);
    assert.match(evalResult.reason, /below notification threshold/);
  });

  test('Generates and verifies HMAC-signed tracking URLs', () => {
    const signedUrl = rulesEngine.generateSignedTrackingUrl('TK-555', 2);
    const tokenPart = signedUrl.split('/').pop();
    const verification = rulesEngine.verifySignedTrackingToken(tokenPart);

    assert.equal(verification.valid, true);
    assert.equal(verification.tokenId, 'TK-555');

    // Tampered token check
    const tamperedVerification = rulesEngine.verifySignedTrackingToken(tokenPart + 'tampered');
    assert.equal(tamperedVerification.valid, false);
  });
});

/**
 * Chaos Test Suite: Telecom Failures, Stale Jobs, Concurrency & Inbound 2-Way SMS
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { queueDomainService } from '../backend/services/queueDomainService.js';
import { QueueTokenModel, TOKEN_STATUS, DELIVERY_FLAG } from '../backend/models/QueueToken.js';
import { SmsDeliveryAttemptModel, ATTEMPT_STATUS } from '../backend/models/SmsDeliveryAttempt.js';
import { smsProviderManager } from '../backend/services/sms/smsProviderManager.js';
import { MockProviderAdapter } from '../backend/services/sms/MockProviderAdapter.js';
import { setupQueueNotificationBridge } from '../backend/services/queueNotificationBridge.js';
import { smsNotificationQueue } from '../backend/queues/smsQueue.js';
import { SmsWebhookController } from '../backend/controllers/smsWebhookController.js';
import { notificationRulesEngine } from '../backend/services/notificationRulesEngine.js';
import { processSmsJob } from '../backend/workers/smsWorker.js';

describe('Chaos & Fault Tolerance Test Suite', () => {
  let mockProvider;

  beforeEach(async () => {
    await QueueTokenModel.clear();
    await SmsDeliveryAttemptModel.clear();
    smsNotificationQueue.inMemoryQueue.clear();

    mockProvider = new MockProviderAdapter({ simulateLatencyMs: 5 });
    smsProviderManager.setPrimary(mockProvider);

    notificationRulesEngine.isQuietHours = () => false;
    queueDomainService.removeAllListeners();
    setupQueueNotificationBridge();
  });

  test('Chaos 1: Provider 5xx error exhausts retries and flags token for Reception Manual Outreach', async () => {
    // Inject 503 Service Unavailable into provider
    mockProvider.config.forceError = 'Telecom Gateway 503 Service Unavailable';

    const token = await queueDomainService.addToken({
      tokenNumber: 'ERR-01',
      patientName: 'Vikas Gupta',
      patientMobile: '+919877788899',
      doctorId: 'DOC_SHARMA'
    });

    const dedupKey = `ERR_JOB_${Date.now()}`;
    const jobData = {
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      eventType: 'TOKEN_BOOKED',
      variables: ['Vikas', 'ERR-01', 'Dr. Sharma', '15m', 'https://medikiosk.gov.in/q/err'],
      preferredLanguage: 'en',
      mobile: '+919877788899',
      dedupKey
    };

    // Processing the job directly should catch the error and flag token
    await assert.rejects(
      async () => { await processSmsJob({ id: dedupKey, data: jobData }); },
      /503 Service Unavailable/
    );

    // Verify token was flagged for reception outreach
    const updatedToken = await QueueTokenModel.findById(token.tokenId);
    assert.equal(updatedToken.deliveryFlag, DELIVERY_FLAG.FLAGGED_FOR_RECEPTION);
    assert.ok(updatedToken.failedAttemptsCount >= 1);

    // Verify attempt recorded as FAILED
    const attempt = await SmsDeliveryAttemptModel.findByDedupKey(dedupKey);
    assert.equal(attempt.status, ATTEMPT_STATUS.FAILED);
  });

  test('Chaos 2: Stale Job Protection - Drops outdated alert when patient is cancelled before dispatch', async () => {
    const token = await queueDomainService.addToken({
      tokenNumber: 'STALE-01',
      patientName: 'Anita Desai',
      patientMobile: '+919866655544',
      doctorId: 'DOC_SHARMA'
    });

    // Patient cancels while job was queued
    await queueDomainService.cancelToken(token.tokenId, 'Patient emergency elsewhere');

    const dedupKey = `STALE_JOB_${Date.now()}`;
    const jobData = {
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      eventType: 'ALMOST_TURN',
      variables: ['STALE-01', '1', 'Dr. Sharma', '5 mins', 'Cabin 3'],
      preferredLanguage: 'en',
      mobile: '+919866655544',
      dedupKey
    };

    // Worker must inspect live DB state and drop the job
    const result = await processSmsJob({ id: dedupKey, data: jobData });
    assert.equal(result.dropped, true);
    assert.equal(result.reason, 'TOKEN_ALREADY_INACTIVE');

    // Ensure zero SMS dispatched to carrier
    assert.equal(mockProvider.sentMessages.length, 0);

    // Ensure logged as DROPPED_STALE
    const attempt = await SmsDeliveryAttemptModel.findByDedupKey(dedupKey);
    assert.equal(attempt.status, ATTEMPT_STATUS.DROPPED_STALE);
  });

  test('Chaos 3: Stale Job Protection - Drops ALMOST_TURN when patient is already CALLED', async () => {
    const token = await queueDomainService.addToken({
      tokenNumber: 'STALE-02',
      patientName: 'Rohan Joshi',
      patientMobile: '+919855544433',
      doctorId: 'DOC_SHARMA'
    });

    // Doctor calls patient into cabin before background "almost your turn" job runs
    await QueueTokenModel.updateById(token.tokenId, { status: TOKEN_STATUS.CALLED });

    const dedupKey = `STALE_ALMOST_${Date.now()}`;
    const jobData = {
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      eventType: 'ALMOST_TURN',
      variables: ['STALE-02', '1', 'Dr. Sharma', '5 mins', 'Cabin 3'],
      preferredLanguage: 'en',
      mobile: '+919855544433',
      dedupKey
    };

    const result = await processSmsJob({ id: dedupKey, data: jobData });
    assert.equal(result.dropped, true);
    assert.equal(result.reason, 'ALREADY_CALLED');
    assert.equal(mockProvider.sentMessages.length, 0);
  });

  test('Chaos 4: Duplicate Webhook arrival does not regress finalized DELIVERED state', async () => {
    const attempt = await SmsDeliveryAttemptModel.create({
      dedupKey: 'DEDUP_HOOK_01',
      providerMessageId: 'MSG_WEBHOOK_DUP_101',
      status: ATTEMPT_STATUS.DELIVERED,
      tokenNumber: 'A-99'
    });

    // Incoming duplicate webhook with status SENT
    const req = {
      params: { provider: 'mock' },
      headers: { 'x-webhook-signature': 'valid_sandbox_secret' },
      body: {
        messageId: 'MSG_WEBHOOK_DUP_101',
        status: 'SENT'
      }
    };
    let jsonResult;
    const res = {
      status: () => ({
        json: (data) => { jsonResult = data; }
      })
    };

    await SmsWebhookController.handleDeliveryReceipt(req, res);
    assert.equal(jsonResult.success, true);
    assert.equal(jsonResult.status, 'IGNORED_SUPERSEDED');

    // DB status must remain DELIVERED
    const dbRecord = await SmsDeliveryAttemptModel.findByProviderMessageId('MSG_WEBHOOK_DUP_101');
    assert.equal(dbRecord.status, ATTEMPT_STATUS.DELIVERED);
  });

  test('Chaos 5: Inbound 2-Way SMS "STOP" opts patient out of notifications', async () => {
    const token = await queueDomainService.addToken({
      tokenNumber: 'OPT-01',
      patientName: 'Meera Nair',
      patientMobile: '+919899900011',
      doctorId: 'DOC_SHARMA'
    });

    const req = {
      body: {
        From: '+919899900011',
        Body: 'STOP'
      }
    };
    let jsonResult;
    const res = {
      status: () => ({
        json: (data) => { jsonResult = data; }
      })
    };

    await SmsWebhookController.handleInboundSms(req, res);
    assert.equal(jsonResult.action, 'OPT_OUT_CONFIRMED');

    const updated = await QueueTokenModel.findById(token.tokenId);
    assert.equal(updated.optedOut, true);
  });

  test('Chaos 6: Inbound 2-Way SMS "STATUS" returns current live queue info', async () => {
    await queueDomainService.addToken({
      tokenNumber: 'STAT-01',
      patientName: 'Ramesh Sen',
      patientMobile: '+919877711122',
      doctorId: 'DOC_SHARMA'
    });

    const req = {
      body: {
        From: '+919877711122',
        Body: 'STATUS'
      }
    };
    let jsonResult;
    const res = {
      status: () => ({
        json: (data) => { jsonResult = data; }
      })
    };

    await SmsWebhookController.handleInboundSms(req, res);
    assert.equal(jsonResult.action, 'STATUS_REPORT');
    assert.match(jsonResult.reply, /Token #STAT-01: Position 1/);
  });
});

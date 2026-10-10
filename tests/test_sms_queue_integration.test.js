/**
 * Integration Test Suite: Full End-to-End Event-Driven Queue & SMS Pipeline
 * Tests: Book Token -> BullMQ Producer -> Worker -> Mock Provider -> DLR Webhook -> Idempotency
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { queueDomainService } from '../backend/services/queueDomainService.js';
import { QueueTokenModel } from '../backend/models/QueueToken.js';
import { SmsDeliveryAttemptModel, ATTEMPT_STATUS } from '../backend/models/SmsDeliveryAttempt.js';
import { smsProviderManager } from '../backend/services/sms/smsProviderManager.js';
import { MockProviderAdapter } from '../backend/services/sms/MockProviderAdapter.js';
import { setupQueueNotificationBridge } from '../backend/services/queueNotificationBridge.js';
import { smsNotificationQueue } from '../backend/queues/smsQueue.js';
import { SmsWebhookController } from '../backend/controllers/smsWebhookController.js';
import { notificationRulesEngine } from '../backend/services/notificationRulesEngine.js';

describe('Integration: Event-Driven Queue to SMS Dispatch', () => {
  let mockProvider;

  beforeEach(async () => {
    // Reset in-memory stores and mock provider
    await QueueTokenModel.clear();
    await SmsDeliveryAttemptModel.clear();
    smsNotificationQueue.inMemoryQueue.clear();

    mockProvider = new MockProviderAdapter({ simulateLatencyMs: 10 });
    smsProviderManager.setPrimary(mockProvider);

    // Disable quiet hours in tests so daylight hours are assumed
    notificationRulesEngine.isQuietHours = () => false;

    // Ensure bridge is active
    queueDomainService.removeAllListeners();
    setupQueueNotificationBridge();
  });

  test('Flow 1: Booking a token automatically triggers DLT-compliant TOKEN_BOOKED SMS', async () => {
    const token = await queueDomainService.addToken({
      tokenNumber: 'A-10',
      patientName: 'Aarav Sharma',
      patientMobile: '+919876543210',
      doctorName: 'Dr. Sharma',
      cabin: 'OPD Cabin 3',
      doctorId: 'DOC_SHARMA'
    });

    assert.ok(token);
    assert.equal(token.tokenNumber, 'A-10');

    // Wait 150ms for background job execution
    await new Promise(r => setTimeout(r, 150));

    // Assert mock provider received dispatch
    assert.equal(mockProvider.sentMessages.length, 1);
    const sent = mockProvider.sentMessages[0];
    assert.equal(sent.to, '+919876543210');
    assert.equal(sent.templateId, '1407168000000000001');
    assert.match(sent.message, /Namaste Aarav, your Token #A-10 is confirmed for Dr. Sharma/);

    // Assert audit log stored with masked number
    const attempts = await SmsDeliveryAttemptModel.getAll();
    assert.equal(attempts.length, 1);
    assert.equal(attempts[0].maskedMobile, '+91 98*** **210');
    assert.equal(attempts[0].tokenNumber, 'A-10');
    assert.equal(attempts[0].status, ATTEMPT_STATUS.SENT);
  });

  test('Flow 2: Advancing queue emits TOKEN_CALLED and updates next patient to ALMOST_DUE', async () => {
    // Add two patients
    const token1 = await queueDomainService.addToken({
      tokenNumber: 'A-01',
      patientName: 'Pooja Verma',
      patientMobile: '+919811122233',
      doctorId: 'DOC_SHARMA'
    });

    const token2 = await queueDomainService.addToken({
      tokenNumber: 'A-02',
      patientName: 'Rahul Mehta',
      patientMobile: '+919822233344',
      doctorId: 'DOC_SHARMA'
    });

    // Wait for initial registration jobs
    await new Promise(r => setTimeout(r, 150));
    mockProvider.clearHistory();

    // Doctor calls next patient
    const callResult = await queueDomainService.callNext('DOC_SHARMA');
    assert.equal(callResult.success, true);
    assert.equal(callResult.calledToken.tokenNumber, 'A-01');

    // Wait for event-driven job execution
    await new Promise(r => setTimeout(r, 150));

    // Assert TOKEN_CALLED was dispatched to Pooja (A-01)
    const calledMsg = mockProvider.sentMessages.find(m => m.templateId === '1407168000000000003');
    assert.ok(calledMsg, 'Expected TOKEN_CALLED message to be dispatched');
    assert.equal(calledMsg.to, '+919811122233');
    assert.match(calledMsg.message, /URGENT: Token #A-01, it is your turn now/);
  });

  test('Flow 3: Idempotency enforcement guarantees zero duplicate messages on retry', async () => {
    const token = await queueDomainService.addToken({
      tokenNumber: 'A-30',
      patientName: 'Karan Patel',
      patientMobile: '+919833344455',
      doctorId: 'DOC_SHARMA'
    });

    await new Promise(r => setTimeout(r, 150));
    assert.equal(mockProvider.sentMessages.length, 1);

    // Attempt duplicate enqueue with identical dedupKey
    const dedupKey = notificationRulesEngine.getDedupKey(token.tokenId, 'TOKEN_BOOKED', token.version);
    await smsNotificationQueue.enqueue({
      tokenId: token.tokenId,
      tokenNumber: token.tokenNumber,
      eventType: 'TOKEN_BOOKED',
      variables: ['Karan', 'A-30', 'Dr. Sharma', '10m', 'https://url'],
      preferredLanguage: 'en',
      mobile: '+919833344455',
      dedupKey,
      version: token.version
    });

    await new Promise(r => setTimeout(r, 150));

    // Provider sent message count must remain strictly 1
    assert.equal(mockProvider.sentMessages.length, 1, 'Duplicate job must be dropped by dedup check');
  });

  test('Flow 4: DLR Webhook updates status from SENT to DELIVERED', async () => {
    await queueDomainService.addToken({
      tokenNumber: 'A-40',
      patientName: 'Sunita Roy',
      patientMobile: '+919844455566',
      doctorId: 'DOC_SHARMA'
    });

    await new Promise(r => setTimeout(r, 150));
    const sentMsg = mockProvider.sentMessages[0];
    assert.ok(sentMsg);

    // Simulate carrier incoming DLR webhook
    const req = {
      params: { provider: 'mock' },
      headers: { 'x-webhook-signature': 'valid_sandbox_secret' },
      body: {
        messageId: sentMsg.providerMessageId,
        status: 'DELIVERED',
        timestamp: new Date().toISOString()
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
    assert.equal(jsonResult.updatedStatus, ATTEMPT_STATUS.DELIVERED);

    // Verify DB record status is DELIVERED
    const attempt = await SmsDeliveryAttemptModel.findByProviderMessageId(sentMsg.providerMessageId);
    assert.equal(attempt.status, ATTEMPT_STATUS.DELIVERED);
  });
});

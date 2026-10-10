/**
 * Load Test Suite: Concurrent Queues & High-Throughput Notification Stress Testing
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { queueDomainService } from '../backend/services/queueDomainService.js';
import { QueueTokenModel } from '../backend/models/QueueToken.js';
import { SmsDeliveryAttemptModel } from '../backend/models/SmsDeliveryAttempt.js';
import { smsProviderManager } from '../backend/services/sms/smsProviderManager.js';
import { MockProviderAdapter } from '../backend/services/sms/MockProviderAdapter.js';
import { setupQueueNotificationBridge } from '../backend/services/queueNotificationBridge.js';
import { smsNotificationQueue } from '../backend/queues/smsQueue.js';
import { notificationRulesEngine } from '../backend/services/notificationRulesEngine.js';

describe('Load & Concurrency Stress Test', () => {
  test('Simulates 30 rapid concurrent token registrations across 3 doctor queues', async () => {
    await QueueTokenModel.clear();
    await SmsDeliveryAttemptModel.clear();
    smsNotificationQueue.inMemoryQueue.clear();

    const mockProvider = new MockProviderAdapter({ simulateLatencyMs: 2 });
    smsProviderManager.setPrimary(mockProvider);
    notificationRulesEngine.isQuietHours = () => false;

    queueDomainService.removeAllListeners();
    setupQueueNotificationBridge();

    const doctors = ['DOC_SHARMA', 'DOC_VERMA', 'DOC_SINGH'];
    const promises = [];

    const startTime = Date.now();
    for (let i = 1; i <= 30; i++) {
      const doc = doctors[i % doctors.length];
      promises.push(
        queueDomainService.addToken({
          tokenNumber: `LOAD-${i}`,
          patientName: `Patient ${i}`,
          patientMobile: `+9198000000${String(i).padStart(2, '0')}`,
          doctorId: doc,
          doctorName: doc === 'DOC_SHARMA' ? 'Dr. Sharma' : (doc === 'DOC_VERMA' ? 'Dr. Verma' : 'Dr. Singh')
        })
      );
    }

    const createdTokens = await Promise.all(promises);
    assert.equal(createdTokens.length, 30);

    // Wait for all 30 background jobs to complete processing
    let attempts = 0;
    while (attempts < 40) {
      await new Promise(r => setTimeout(r, 50));
      if (mockProvider.sentMessages.length >= 30) break;
      attempts++;
    }

    const duration = Date.now() - startTime;
    console.log(`[LoadTest] 30 concurrent tokens & notifications processed in ${duration}ms (${Math.round((30 / duration) * 1000)} msg/sec)`);

    assert.equal(mockProvider.sentMessages.length, 30, 'All 30 SMS dispatches must complete');

    const metrics = await SmsDeliveryAttemptModel.getMetrics();
    assert.equal(metrics.total, 30);
    assert.equal(metrics.sent, 30);
    assert.equal(metrics.failed, 0);
  });
});

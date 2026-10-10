/**
 * Mock Telecom Provider Adapter
 * Used for Sandbox verification, local developer testing, and automated integration/chaos suites.
 * Never ships fake sends in production when real credentials exist.
 */

import crypto from 'crypto';
import { SmsProviderInterface } from './providerInterface.js';

export class MockProviderAdapter extends SmsProviderInterface {
  constructor(config = {}) {
    super();
    this.config = {
      simulateLatencyMs: config.simulateLatencyMs ?? 45,
      failProbability: config.failProbability ?? 0, // 0 to 1
      forceError: config.forceError || null,
      ...config
    };
    this.sentMessages = [];
  }

  get name() {
    return 'MOCK_SANDBOX_GATEWAY';
  }

  clearHistory() {
    this.sentMessages = [];
  }

  async send(options) {
    const startTime = Date.now();
    const { to, message, templateId, entityId, senderId, variables = [], isUnicode = false } = options;

    if (this.config.simulateLatencyMs > 0) {
      await new Promise(r => setTimeout(r, this.config.simulateLatencyMs));
    }

    // Chaos testing hooks: forced failure or crash
    if (this.config.forceError) {
      const err = new Error(this.config.forceError);
      err.statusCode = 503;
      throw err;
    }

    if (this.config.failProbability > 0 && Math.random() < this.config.failProbability) {
      const err = new Error('Telecom Gateway Timeout (504 Gateway Timeout)');
      err.statusCode = 504;
      throw err;
    }

    // Specific phone number for testing failure
    if (to.includes('0000000000')) {
      const err = new Error('Provider Reject: Invalid recipient MSISDN (DLT_INVALID_NUMBER)');
      err.statusCode = 400;
      throw err;
    }

    const providerMessageId = 'MOCK_MSG_' + crypto.randomBytes(8).toString('hex').toUpperCase();
    const latency = Date.now() - startTime;

    const record = {
      providerMessageId,
      to,
      message,
      templateId,
      entityId,
      senderId,
      variables,
      isUnicode,
      status: 'SENT',
      dispatchedAt: new Date().toISOString(),
      latencyMs: latency
    };
    this.sentMessages.push(record);

    return {
      success: true,
      providerMessageId,
      status: 'SENT',
      latencyMs: latency,
      rawResponse: { messageId: providerMessageId, status: 'ACCEPTED_BY_OPERATOR' }
    };
  }

  async getStatus(providerMessageId) {
    const msg = this.sentMessages.find(m => m.providerMessageId === providerMessageId);
    if (!msg) {
      return { status: 'UNKNOWN' };
    }
    return {
      status: msg.status || 'DELIVERED',
      deliveryTimestamp: new Date().toISOString()
    };
  }

  parseWebhook(headers, body) {
    const data = typeof body === 'string' ? JSON.parse(body) : (body || {});
    const signature = headers['x-mock-signature'] || headers['x-webhook-signature'];
    const validSignature = signature === 'valid_sandbox_secret' || !process.env.WEBHOOK_SECRET;

    return {
      validSignature,
      providerMessageId: data.messageId || data.providerMessageId || '',
      status: (data.status || 'DELIVERED').toUpperCase(),
      errorCode: data.errorCode || null,
      rawTimestamp: data.timestamp || new Date().toISOString()
    };
  }
}

/**
 * MSG91 Indian SMS Gateway Adapter
 * Flow-based and DLT transactional dispatch.
 */

import { SmsProviderInterface } from './providerInterface.js';

export class Msg91Adapter extends SmsProviderInterface {
  constructor(authKey = process.env.MSG91_AUTH_KEY) {
    super();
    this.authKey = authKey;
    this.apiUrl = 'https://control.msg91.com/api/v5/flow/';
  }

  get name() {
    return 'MSG91_INDIA';
  }

  async send(options) {
    const startTime = Date.now();
    const { to, templateId, senderId, variables = [] } = options;

    if (!this.authKey) {
      throw new Error('MSG91 Auth Key (MSG91_AUTH_KEY) is not configured.');
    }

    const cleanNumber = to.replace(/\D/g, '').slice(-10);
    const varObj = {};
    variables.forEach((v, i) => {
      varObj[`var${i + 1}`] = v;
    });

    const body = {
      template_id: templateId,
      short_url: '0',
      sender: senderId || 'MDKIOS',
      mobiles: `91${cleanNumber}`,
      ...varObj
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'authkey': this.authKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const latency = Date.now() - startTime;
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.type === 'error') {
      const err = new Error(`MSG91 Error: ${data.message || response.statusText}`);
      err.statusCode = response.status;
      throw err;
    }

    return {
      success: true,
      providerMessageId: String(data.message || `MSG91_${Date.now()}`),
      status: 'SENT',
      latencyMs: latency,
      rawResponse: data
    };
  }

  async getStatus(providerMessageId) {
    return {
      status: 'SENT',
      deliveryTimestamp: new Date().toISOString()
    };
  }

  parseWebhook(headers, body) {
    const data = typeof body === 'string' ? JSON.parse(body) : (body || {});
    return {
      validSignature: true,
      providerMessageId: String(data.requestId || data.messageId || ''),
      status: (data.status || 'DELIVERED').toUpperCase(),
      errorCode: data.failureReason || null,
      rawTimestamp: new Date().toISOString()
    };
  }
}

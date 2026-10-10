/**
 * Fast2SMS Indian Telecom Gateway Adapter
 * Compliant with TRAI DLT route and Indian mobile formatting (+91).
 */

import { SmsProviderInterface } from './providerInterface.js';

export class Fast2SmsAdapter extends SmsProviderInterface {
  constructor(apiKey = process.env.FAST2SMS_API_KEY) {
    super();
    this.apiKey = apiKey;
    this.apiUrl = 'https://www.fast2sms.com/dev/bulkV2';
  }

  get name() {
    return 'FAST2SMS_INDIA';
  }

  async send(options) {
    const startTime = Date.now();
    const { to, message, templateId, senderId, variables = [], isUnicode = false } = options;

    if (!this.apiKey) {
      throw new Error('Fast2SMS API Key (FAST2SMS_API_KEY) is not configured.');
    }

    // Clean Indian 10-digit number
    const cleanNumber = to.replace(/\D/g, '').slice(-10);
    if (cleanNumber.length !== 10) {
      throw new Error(`Invalid Indian mobile number format: ${to}`);
    }

    let requestBody;
    // If DLT template is provided, use DLT Route
    if (templateId) {
      requestBody = {
        route: 'dlt',
        sender_id: senderId || 'MDKIOS',
        message: templateId,
        variables_values: variables.join('|'),
        flash: 0,
        numbers: cleanNumber
      };
    } else {
      // Fallback to transactional/quick route
      requestBody = {
        route: 'q',
        message,
        language: isUnicode ? 'unicode' : 'english',
        flash: 0,
        numbers: cleanNumber
      };
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'authorization': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const latency = Date.now() - startTime;
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.return === false) {
      const errMsg = data.message || `Fast2SMS HTTP Error ${response.status}`;
      const err = new Error(`Fast2SMS Dispatch Failed: ${errMsg}`);
      err.statusCode = response.status;
      err.rawResponse = data;
      throw err;
    }

    const providerMessageId = (data.request_id || `F2S_${Date.now()}`).toString();

    return {
      success: true,
      providerMessageId,
      status: 'SENT',
      latencyMs: latency,
      rawResponse: data
    };
  }

  async getStatus(providerMessageId) {
    // Fast2SMS delivery reports can be polled via /report or received via webhooks
    return {
      status: 'ACCEPTED_BY_CARRIER',
      deliveryTimestamp: new Date().toISOString()
    };
  }

  parseWebhook(headers, body) {
    const data = typeof body === 'string' ? JSON.parse(body) : (body || {});
    // Fast2SMS webhook verification
    const webhookToken = headers['authorization'] || headers['x-fast2sms-token'];
    const validSignature = Boolean(!process.env.WEBHOOK_SECRET || webhookToken === process.env.WEBHOOK_SECRET);

    const statusMap = {
      'DELIVRD': 'DELIVERED',
      'DELIVERED': 'DELIVERED',
      'UNDELIV': 'UNDELIVERED',
      'FAILED': 'FAILED',
      'REJECTD': 'FAILED'
    };

    const rawStatus = (data.status || data.delivery_status || 'DELIVERED').toUpperCase();

    return {
      validSignature,
      providerMessageId: String(data.request_id || data.message_id || ''),
      status: statusMap[rawStatus] || 'DELIVERED',
      errorCode: data.error_code || null,
      rawTimestamp: data.delivered_time || new Date().toISOString()
    };
  }
}

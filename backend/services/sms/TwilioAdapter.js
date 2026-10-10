/**
 * Twilio SMS Gateway Adapter
 * International & secondary fallback carrier adapter.
 */

import { SmsProviderInterface } from './providerInterface.js';

export class TwilioAdapter extends SmsProviderInterface {
  constructor(accountSid = process.env.TWILIO_ACCOUNT_SID, authToken = process.env.TWILIO_AUTH_TOKEN, fromNumber = process.env.TWILIO_PHONE_NUMBER) {
    super();
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  get name() {
    return 'TWILIO_CARRIER';
  }

  async send(options) {
    const startTime = Date.now();
    const { to, message } = options;

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error('Twilio credentials (ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER) are incomplete.');
    }

    const cleanTo = to.startsWith('+') ? to : `+91${to.replace(/\D/g, '').slice(-10)}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const authHeader = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

    const form = new URLSearchParams({
      To: cleanTo,
      From: this.fromNumber,
      Body: message
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    const latency = Date.now() - startTime;
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = new Error(`Twilio dispatch error (${response.status}): ${data.message || 'Unknown'}`);
      err.statusCode = response.status;
      err.rawResponse = data;
      throw err;
    }

    return {
      success: true,
      providerMessageId: data.sid || `TW_${Date.now()}`,
      status: (data.status || 'queued').toUpperCase(),
      latencyMs: latency,
      rawResponse: data
    };
  }

  async getStatus(providerMessageId) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages/${providerMessageId}.json`;
    const authHeader = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

    const response = await fetch(url, {
      headers: { 'Authorization': `Basic ${authHeader}` }
    });

    if (!response.ok) return { status: 'UNKNOWN' };
    const data = await response.json();
    return {
      status: (data.status || 'UNKNOWN').toUpperCase(),
      deliveryTimestamp: data.date_sent || new Date().toISOString()
    };
  }

  parseWebhook(headers, body) {
    const params = typeof body === 'object' ? body : Object.fromEntries(new URLSearchParams(body));
    const status = (params.MessageStatus || params.SmsStatus || 'delivered').toUpperCase();
    const validSignature = Boolean(!process.env.WEBHOOK_SECRET || headers['x-twilio-signature']);

    return {
      validSignature,
      providerMessageId: params.MessageSid || params.SmsSid || '',
      status: status === 'DELIVERED' ? 'DELIVERED' : (['FAILED', 'UNDELIVERED'].includes(status) ? 'FAILED' : 'SENT'),
      errorCode: params.ErrorCode || null,
      rawTimestamp: new Date().toISOString()
    };
  }
}

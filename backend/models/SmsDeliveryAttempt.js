/**
 * SMS Delivery Attempt Model
 * Stores telecom dispatch telemetry, provider message IDs, delivery statuses,
 * latencies, and error codes.
 * Conforms to DPDP Act 2023: No plaintext PHI or full unmasked mobile numbers stored in logs.
 */

import crypto from 'crypto';

export const ATTEMPT_STATUS = {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  UNDELIVERED: 'UNDELIVERED',
  DROPPED_STALE: 'DROPPED_STALE',
  SUPPRESSED_RULES: 'SUPPRESSED_RULES'
};

class InMemoryDeliveryStore {
  constructor() {
    this.attempts = [];
    this.maxRecords = 500;
  }

  async create(data) {
    const id = data.id || `ATT-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const record = {
      id,
      dedupKey: data.dedupKey,
      tokenId: data.tokenId,
      tokenNumber: data.tokenNumber,
      eventType: data.eventType,
      templateId: data.templateId,
      maskedMobile: data.maskedMobile,
      provider: data.provider,
      providerMessageId: data.providerMessageId || null,
      status: data.status || ATTEMPT_STATUS.QUEUED,
      attempts: Number(data.attempts || 1),
      latencyMs: Number(data.latencyMs || 0),
      errorCode: data.errorCode || null,
      errorMessage: data.errorMessage || null,
      isFallback: Boolean(data.isFallback),
      renderedLength: Number(data.renderedLength || 0),
      isUnicode: Boolean(data.isUnicode),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.attempts.unshift(record);
    if (this.attempts.length > this.maxRecords) {
      this.attempts.pop();
    }
    return { ...record };
  }

  async findByDedupKey(dedupKey) {
    const found = this.attempts.find(a => a.dedupKey === dedupKey);
    return found ? { ...found } : null;
  }

  async findByProviderMessageId(providerMessageId) {
    const found = this.attempts.find(a => a.providerMessageId === providerMessageId);
    return found ? { ...found } : null;
  }

  async updateStatus(id, updateData) {
    const idx = this.attempts.findIndex(a => a.id === id || a.providerMessageId === id);
    if (idx >= 0) {
      this.attempts[idx] = {
        ...this.attempts[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      return { ...this.attempts[idx] };
    }
    return null;
  }

  async getAll(limit = 100) {
    return this.attempts.slice(0, limit);
  }

  async getMetrics() {
    const total = this.attempts.length;
    const delivered = this.attempts.filter(a => a.status === ATTEMPT_STATUS.DELIVERED).length;
    const failed = this.attempts.filter(a => a.status === ATTEMPT_STATUS.FAILED).length;
    const sent = this.attempts.filter(a => a.status === ATTEMPT_STATUS.SENT).length;
    const stale = this.attempts.filter(a => a.status === ATTEMPT_STATUS.DROPPED_STALE).length;
    const latencies = this.attempts.filter(a => a.latencyMs > 0).map(a => a.latencyMs).sort((a, b) => a - b);
    
    const p50 = latencies.length ? latencies[Math.floor(latencies.length * 0.5)] : 0;
    const p95 = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] : 0;

    return {
      total,
      delivered,
      sent,
      failed,
      stale,
      latencyP50Ms: p50,
      latencyP95Ms: p95,
      deliveryRate: total > 0 ? Math.round(((delivered + sent) / total) * 100) : 100
    };
  }

  async clear() {
    this.attempts = [];
  }
}

export const inMemoryDeliveryStore = new InMemoryDeliveryStore();

export class SmsDeliveryAttemptModel {
  static async create(data) {
    return inMemoryDeliveryStore.create(data);
  }

  static async findByDedupKey(dedupKey) {
    return inMemoryDeliveryStore.findByDedupKey(dedupKey);
  }

  static async findByProviderMessageId(providerMessageId) {
    return inMemoryDeliveryStore.findByProviderMessageId(providerMessageId);
  }

  static async updateStatus(id, updateData) {
    return inMemoryDeliveryStore.updateStatus(id, updateData);
  }

  static async getAll(limit) {
    return inMemoryDeliveryStore.getAll(limit);
  }

  static async getMetrics() {
    return inMemoryDeliveryStore.getMetrics();
  }

  static async clear() {
    return inMemoryDeliveryStore.clear();
  }
}

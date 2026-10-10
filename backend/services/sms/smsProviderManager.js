/**
 * SMS Provider Manager
 * Manages primary and fallback carrier adapters with automatic failover,
 * sandbox isolation, and metrics collection.
 */

import { MockProviderAdapter } from './MockProviderAdapter.js';
import { Fast2SmsAdapter } from './Fast2SmsAdapter.js';
import { TwilioAdapter } from './TwilioAdapter.js';
import { Msg91Adapter } from './Msg91Adapter.js';

class SmsProviderManager {
  constructor() {
    this.primaryProvider = null;
    this.fallbackProvider = null;
    this.mockProvider = new MockProviderAdapter();
    this.initProviders();
  }

  initProviders() {
    const providerName = (process.env.SMS_PROVIDER || '').toUpperCase();

    if (process.env.NODE_ENV === 'test' || providerName === 'MOCK' || providerName === 'SANDBOX') {
      this.primaryProvider = this.mockProvider;
      this.fallbackProvider = null;
      return;
    }

    if (process.env.FAST2SMS_API_KEY) {
      this.primaryProvider = new Fast2SmsAdapter();
    } else if (process.env.MSG91_AUTH_KEY) {
      this.primaryProvider = new Msg91Adapter();
    } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.primaryProvider = new TwilioAdapter();
    } else {
      // Default sandbox/mock provider when no external keys provided
      this.primaryProvider = this.mockProvider;
    }

    // Set secondary/fallback if multiple credentials exist
    if (this.primaryProvider.name !== 'TWILIO_CARRIER' && process.env.TWILIO_ACCOUNT_SID) {
      this.fallbackProvider = new TwilioAdapter();
    }
  }

  getPrimary() {
    return this.primaryProvider || this.mockProvider;
  }

  getFallback() {
    return this.fallbackProvider;
  }

  getMock() {
    return this.mockProvider;
  }

  /**
   * Set custom adapter (useful for testing)
   */
  setPrimary(adapter) {
    this.primaryProvider = adapter;
  }

  /**
   * Dispatch message with primary provider and automatic fallback on failure
   */
  async sendWithFailover(options) {
    const primary = this.getPrimary();
    try {
      const result = await primary.send(options);
      return {
        ...result,
        providerUsed: primary.name,
        isFallback: false
      };
    } catch (primaryErr) {
      console.warn(`[SmsProviderManager] Primary provider (${primary.name}) failed: ${primaryErr.message}`);
      const fallback = this.getFallback();
      if (fallback) {
        console.log(`[SmsProviderManager] Engaging fallback provider: ${fallback.name}`);
        const fallbackResult = await fallback.send(options);
        return {
          ...fallbackResult,
          providerUsed: fallback.name,
          isFallback: true,
          primaryError: primaryErr.message
        };
      }
      throw primaryErr;
    }
  }
}

export const smsProviderManager = new SmsProviderManager();

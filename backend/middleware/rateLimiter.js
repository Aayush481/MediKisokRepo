/**
 * MediKiosk Sliding-Window Rate Limiter & Abuse Prevention Middleware
 * Guards against SMS OTP bombing and brute-force verification attempts.
 */

import { safeLog } from '../utils/masking.js';

class RateLimiterStore {
  constructor() {
    this.hits = new Map();
    // Periodic garbage collection every 5 minutes
    this.gcTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    if (this.gcTimer.unref) this.gcTimer.unref();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, records] of this.hits.entries()) {
      const valid = records.filter(timestamp => timestamp > now - 3600000);
      if (valid.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, valid);
      }
    }
  }

  recordHit(key, windowMs) {
    const now = Date.now();
    const cutoff = now - windowMs;
    const timestamps = (this.hits.get(key) || []).filter(t => t > cutoff);
    timestamps.push(now);
    this.hits.set(key, timestamps);
    return timestamps.length;
  }

  getHits(key, windowMs) {
    const now = Date.now();
    const cutoff = now - windowMs;
    return (this.hits.get(key) || []).filter(t => t > cutoff).length;
  }

  reset(key) {
    this.hits.delete(key);
  }
}

const store = new RateLimiterStore();

/**
 * Factory to create rate-limiting middleware
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max permitted hits per window
 * @param {string} options.message - Error message when exceeded
 * @param {function} options.keyGenerator - Custom key generator function (e.g. by IP or by ABHA)
 */
export function createRateLimiter(options) {
  const {
    windowMs = 60 * 1000,
    max = 10,
    message = 'Too many requests. Please slow down and try again later.',
    keyGenerator = (req) => req.ip || req.connection?.remoteAddress || 'unknown'
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const count = store.recordHit(key, windowMs);
    const remaining = Math.max(0, max - count);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (count > max) {
      safeLog('warn', 'Rate limit exceeded', { key, count, max, path: req.path });
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfterSec: Math.ceil(windowMs / 1000)
        }
      });
    }

    next();
  };
}

/**
 * Specialized Rate Limiter for OTP Generation:
 * Max 3 OTP requests per 10 minutes per IP/ABHA to prevent SMS bombing
 */
export const otpRequestLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: 'Exceeded maximum OTP requests (3 allowed per 10 minutes). Please wait before requesting again.',
  keyGenerator: (req) => {
    const abha = (req.body?.abhaNumber || '').replace(/\D/g, '');
    const ip = req.ip || 'ip';
    return `otp-req:${ip}:${abha || 'none'}`;
  }
});

/**
 * Specialized Rate Limiter for OTP Verification:
 * Max 5 attempts per transaction ID to block brute-force attacks
 */
export const otpVerifyLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: 'Maximum verification attempts exceeded for this session. Please request a fresh OTP.',
  keyGenerator: (req) => {
    const txnId = req.body?.txnId || 'notxn';
    return `otp-verify:${txnId}`;
  }
});

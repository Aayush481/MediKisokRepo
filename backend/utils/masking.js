/**
 * MediKiosk ABDM PII Masking & Data Sanitization Utilities
 * Compliant with India DPDP Act 2023 & ABDM Health Data Management Policy
 */

/**
 * Mask a 14-digit ABHA number (e.g., "12-3456-7890-1234" -> "**-****-****-1234")
 * @param {string} abha
 * @returns {string}
 */
export function maskAbha(abha) {
  if (!abha || typeof abha !== 'string') return '';
  const clean = abha.replace(/\D/g, '');
  if (clean.length === 14) {
    return `**-****-****-${clean.slice(10)}`;
  }
  if (abha.length > 4) {
    return `${'*'.repeat(abha.length - 4)}${abha.slice(-4)}`;
  }
  return '****';
}

/**
 * Mask a mobile number (e.g., "9876543210" -> "******3210")
 * @param {string} mobile
 * @returns {string}
 */
export function maskMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') return '';
  const clean = mobile.replace(/\D/g, '');
  if (clean.length >= 10) {
    return `******${clean.slice(-4)}`;
  }
  return '******';
}

/**
 * Mask Aadhaar number (e.g., "123456789012" -> "********9012")
 * @param {string} aadhaar
 * @returns {string}
 */
export function maskAadhaar(aadhaar) {
  if (!aadhaar || typeof aadhaar !== 'string') return '';
  const clean = aadhaar.replace(/\D/g, '');
  if (clean.length === 12) {
    return `********${clean.slice(-4)}`;
  }
  return '********';
}

/**
 * List of sensitive key names that should always be redacted from logs and debug traces
 */
const REDACTED_KEYS = new Set([
  'otp',
  'authcode',
  'clientsecret',
  'client_secret',
  'password',
  'accesstoken',
  'access_token',
  'usertoken',
  'user_token',
  'token',
  'jwttoken',
  'privatekey',
  'certificate'
]);

/**
 * Recursively sanitize an object or array for safe logging
 * @param {any} data
 * @returns {any}
 */
export function sanitizeForLogs(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogs(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (REDACTED_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (lowerKey.includes('abha') && typeof value === 'string') {
      sanitized[key] = maskAbha(value);
    } else if ((lowerKey.includes('mobile') || lowerKey.includes('phone')) && typeof value === 'string') {
      sanitized[key] = maskMobile(value);
    } else if (lowerKey.includes('aadhaar') && typeof value === 'string') {
      sanitized[key] = maskAadhaar(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogs(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Audit-safe structured log function
 * @param {string} level - 'info' | 'warn' | 'error'
 * @param {string} message - Description of the event
 * @param {object} meta - Context metadata
 */
export function safeLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const cleanMeta = sanitizeForLogs(meta);
  const logPayload = {
    timestamp,
    service: 'ABDM-M1-ABHA',
    level,
    message,
    ...cleanMeta
  };

  if (level === 'error') {
    console.error(JSON.stringify(logPayload));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logPayload));
  } else {
    console.log(JSON.stringify(logPayload));
  }
}

/**
 * Notification Rules Engine
 * Evaluates patient consent, DND/opt-out preferences, quiet hours,
 * ETA change thresholds, deduplication keys, and DLT variable construction.
 */

import crypto from 'crypto';

export class NotificationRulesEngine {
  constructor(config = {}) {
    this.quietHoursStartHour = config.quietHoursStartHour ?? 21; // 9:00 PM
    this.quietHoursEndHour = config.quietHoursEndHour ?? 7;      // 7:00 AM
    this.nameMaskingMode = config.nameMaskingMode || process.env.PATIENT_NAME_MASKING || 'FIRST_NAME'; // 'FIRST_NAME' | 'FULL_NAME' | 'GENERIC'
    this.trackingBaseUrl = config.trackingBaseUrl || process.env.TRACKING_BASE_URL || 'https://medikiosk.gov.in/q';
    this.signingSecret = process.env.PATIENT_ENCRYPTION_KEY || 'medikiosk_default_secret_key_32chars!';
  }

  /**
   * Format patient name based on clinical privacy preference (DPDP Act 2023)
   */
  formatPatientName(fullName) {
    if (!fullName || typeof fullName !== 'string') return 'Patient';
    const trimmed = fullName.trim();
    if (this.nameMaskingMode === 'GENERIC') return 'Patient';
    if (this.nameMaskingMode === 'FULL_NAME') return trimmed.slice(0, 25);
    // FIRST_NAME (Default)
    const firstName = trimmed.split(' ')[0];
    return firstName.slice(0, 20);
  }

  /**
   * Normalize mobile number to Indian standard (+91)
   */
  normalizeMobile(mobile) {
    if (!mobile) return '+919876543210';
    const clean = String(mobile).replace(/[\s\-\(\)]/g, '');
    if (clean.startsWith('+91') && clean.length === 13) return clean;
    if (clean.length === 10) return `+91${clean}`;
    if (clean.startsWith('91') && clean.length === 12) return `+${clean}`;
    return clean.startsWith('+') ? clean : `+91${clean}`;
  }

  /**
   * Mask mobile number for logs and UI display (no PHI in plaintext logs)
   */
  maskMobile(mobile) {
    const norm = this.normalizeMobile(mobile);
    const digits = norm.replace(/\D/g, '');
    if (digits.length >= 10) {
      const start = digits.slice(2, 4);
      const end = digits.slice(-3);
      return `+91 ${start}*** **${end}`;
    }
    return '+91 98*** **345';
  }

  /**
   * Generate short HMAC-signed, expiring tracking token for patient tracker URL
   */
  generateSignedTrackingUrl(tokenId, expiresHours = 12) {
    const exp = Math.floor(Date.now() / 1000) + expiresHours * 3600;
    const dataToSign = `${tokenId}:${exp}`;
    const hmac = crypto.createHmac('sha256', this.signingSecret).update(dataToSign).digest('hex').slice(0, 10);
    const signedToken = Buffer.from(`${tokenId}:${exp}:${hmac}`).toString('base64url');
    return `${this.trackingBaseUrl}/${signedToken}`;
  }

  /**
   * Verify signed tracking token from patient link
   */
  verifySignedTrackingToken(signedToken) {
    try {
      const decoded = Buffer.from(signedToken, 'base64url').toString('utf8');
      const [tokenId, expStr, signature] = decoded.split(':');
      const exp = Number(expStr);

      if (!tokenId || !exp || !signature) {
        return { valid: false, reason: 'Malformed tracking token' };
      }

      if (Date.now() / 1000 > exp) {
        return { valid: false, reason: 'Tracking link has expired' };
      }

      const expectedHmac = crypto.createHmac('sha256', this.signingSecret)
        .update(`${tokenId}:${exp}`)
        .digest('hex')
        .slice(0, 10);

      if (signature !== expectedHmac) {
        return { valid: false, reason: 'Invalid tracking signature' };
      }

      return { valid: true, tokenId };
    } catch {
      return { valid: false, reason: 'Token verification exception' };
    }
  }

  /**
   * Check whether current time falls within clinic quiet hours
   */
  isQuietHours(date = new Date()) {
    const currentHour = date.getHours();
    if (this.quietHoursStartHour > this.quietHoursEndHour) {
      // Overnight (e.g. 21:00 to 07:00)
      return currentHour >= this.quietHoursStartHour || currentHour < this.quietHoursEndHour;
    }
    return currentHour >= this.quietHoursStartHour && currentHour < this.quietHoursEndHour;
  }

  /**
   * Generate single deduplication key: tokenId + eventType + version
   */
  getDedupKey(tokenId, eventType, version = 1) {
    return `${tokenId}_${eventType}_v${version}`;
  }

  /**
   * Evaluate whether a notification should be dispatched
   * @param {string} eventType 
   * @param {Object} token - Token entity
   * @param {Object} context - Optional context (delayMinutes, etc.)
   * @returns {{ shouldSend: boolean, reason?: string, dedupKey: string, variables: Array<string|number> }}
   */
  evaluate(eventType, token, context = {}) {
    const dedupKey = this.getDedupKey(token.tokenId, eventType, token.version || 1);

    // Rule 1: Check patient consent
    if (token.consentGiven === false) {
      return { shouldSend: false, reason: 'Patient did not provide notification consent', dedupKey };
    }

    // Rule 2: Check opt-out
    if (token.optedOut === true) {
      return { shouldSend: false, reason: 'Patient has opted out of SMS notifications', dedupKey };
    }

    // Rule 3: Quiet Hours check
    // URGENT exemption: 'TOKEN_CALLED' is an immediate clinical summons and bypasses quiet hours
    if (eventType !== 'TOKEN_CALLED' && this.isQuietHours()) {
      return { shouldSend: false, reason: 'Suppressed by clinic quiet hours policy', dedupKey };
    }

    // Rule 4: Delay notification threshold check (prevent spamming on minor 2-3 min drifts)
    if (eventType === 'QUEUE_DELAYED') {
      const delayMins = Number(context.delayMinutes || 0);
      if (delayMins < 15) {
        return { shouldSend: false, reason: `Delay of ${delayMins}m is below notification threshold (15m)`, dedupKey };
      }
    }

    const patientName = this.formatPatientName(token.patientName);
    const trackingUrl = this.generateSignedTrackingUrl(token.tokenId);
    const cabin = token.cabin || 'OPD Cabin 3';
    const doctorName = token.doctorName || 'Dr. Sharma';
    const tokenNumber = token.tokenNumber || 'TK-101';

    let variables = [];

    switch (eventType) {
      case 'TOKEN_BOOKED':
        variables = [
          patientName,
          tokenNumber,
          doctorName,
          context.etaRange || `${token.estimatedWaitMinutes || 15}m wait`,
          trackingUrl
        ];
        break;

      case 'ALMOST_TURN':
        variables = [
          tokenNumber,
          String(context.positionsAhead ?? token.position ?? 1),
          doctorName,
          context.etaRange || `${token.estimatedWaitMinutes || 10} mins`,
          cabin
        ];
        break;

      case 'TOKEN_CALLED':
        variables = [
          tokenNumber,
          cabin,
          doctorName
        ];
        break;

      case 'QUEUE_DELAYED':
        variables = [
          doctorName,
          `${context.delayMinutes || 20} mins`,
          tokenNumber,
          context.newEtaRange || 'Updated shortly',
          trackingUrl
        ];
        break;

      case 'TOKEN_SKIPPED':
        variables = [
          tokenNumber,
          cabin,
          String(context.rejoinMinutes || 15)
        ];
        break;

      case 'TOKEN_COMPLETED':
      case 'TOKEN_CANCELLED':
        variables = [
          tokenNumber,
          doctorName
        ];
        break;

      default:
        return { shouldSend: false, reason: `Unknown event type: ${eventType}`, dedupKey };
    }

    return {
      shouldSend: true,
      dedupKey,
      variables,
      preferredLanguage: token.preferredLanguage || 'en',
      mobile: this.normalizeMobile(token.patientMobile)
    };
  }
}

export const notificationRulesEngine = new NotificationRulesEngine();

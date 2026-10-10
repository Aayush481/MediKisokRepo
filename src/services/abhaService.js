/**
 * MediKiosk Frontend ABHA Client Service
 * Interacts with backend /api/abha/* endpoints.
 * Never handles client secrets or ABDM tokens in browser.
 */

export class AbhaClientService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Request OTP for ABHA Patient Lookup
   * @param {string} abhaNumber - 14-digit ABHA number
   * @param {'aadhaar' | 'abdm'} otpSystem - 'aadhaar' (UIDAI) or 'abdm' (Registered Mobile)
   * @returns {Promise<{ success: boolean, txnId?: string, message?: string, error?: string }>}
   */
  async requestOtp(abhaNumber, otpSystem = 'aadhaar') {
    try {
      const res = await fetch(`${this.baseUrl}/api/abha/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-role': 'receptionist'
        },
        body: JSON.stringify({ abhaNumber, otpSystem })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `Failed to request OTP (${res.status})`);
      }

      return {
        success: true,
        txnId: data.txnId,
        message: data.message || 'OTP dispatched successfully.'
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Network error communicating with ABDM service.'
      };
    }
  }

  /**
   * Verify OTP and retrieve official sanitized profile
   * @param {string} txnId - Transaction ID
   * @param {string} otp - 6-digit numeric OTP
   * @param {string} abhaNumber - Context ABHA number
   * @returns {Promise<{ success: boolean, profile?: object, error?: string }>}
   */
  async verifyOtp(txnId, otp, abhaNumber) {
    try {
      const res = await fetch(`${this.baseUrl}/api/abha/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-role': 'receptionist'
        },
        body: JSON.stringify({ txnId, otp, abhaNumber })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `Failed to verify OTP (${res.status})`);
      }

      return {
        success: true,
        txnId: data.txnId,
        profile: data.profile
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to verify OTP.'
      };
    }
  }

  /**
   * Link patient into clinical database with explicit DPDP consent
   * @param {object} patient - Verified demographic profile
   * @param {object} consent - DPDP consent object
   */
  async linkPatient(patient, consent) {
    try {
      const res = await fetch(`${this.baseUrl}/api/abha/link-patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-role': 'receptionist'
        },
        body: JSON.stringify({ patient, consent })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to link patient record.');
      }

      return {
        success: true,
        message: data.message,
        patient: data.patient
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to save patient record.'
      };
    }
  }
}

export const abhaClientService = new AbhaClientService();

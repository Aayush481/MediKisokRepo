/**
 * MediKiosk Centralized ABDM Error Handling & Code Mapper
 * Converts ABDM Gateway & ABHA error codes into clear, safe, non-leaking client messages.
 */

export class AbdmError extends Error {
  constructor(message, statusCode = 500, abdmCode = 'ABDM_UNKNOWN_ERROR', originalDetails = null) {
    super(message);
    this.name = 'AbdmError';
    this.statusCode = statusCode;
    this.abdmCode = abdmCode;
    this.originalDetails = originalDetails;
  }
}

/**
 * Standard ABDM Gateway Error Codes and User-Safe Translations
 */
const ABDM_ERROR_MAP = {
  // Authentication & Session
  'HIS-1001': { status: 401, message: 'ABDM Gateway authorization failed. Please check facility credentials.' },
  'HIS-1002': { status: 401, message: 'ABDM Gateway session expired. Refreshed automatically.' },

  // ABHA / Health ID Lookup
  'ABDM-1001': { status: 404, message: 'ABHA number not found in ABDM registry.' },
  'ABDM-1002': { status: 400, message: 'Invalid ABHA number format. Must be a valid 14-digit identifier.' },
  'ABDM-1003': { status: 400, message: 'ABHA address format is invalid.' },
  'ABDM-1004': { status: 400, message: 'ABHA account is deactivated or suspended.' },

  // OTP Request & Generation
  'ABDM-1010': { status: 429, message: 'OTP request rate limit reached. Please wait a few minutes before trying again.' },
  'ABDM-1011': { status: 400, message: 'No mobile number linked with this ABHA / Aadhaar.' },
  'ABDM-1012': { status: 503, message: 'Aadhaar / UIDAI OTP service is temporarily unavailable. Please retry later.' },

  // OTP Verification
  'ABDM-1020': { status: 400, message: 'Invalid OTP entered. Please verify and try again.' },
  'ABDM-1021': { status: 400, message: 'The OTP has expired. Please request a new OTP.' },
  'ABDM-1022': { status: 429, message: 'Maximum OTP verification attempts exceeded. Please generate a new OTP.' },
  'ABDM-1023': { status: 400, message: 'Transaction session expired. Please restart verification.' },

  // Network & Gateway
  'ABDM-5000': { status: 503, message: 'ABDM Gateway is currently undergoing maintenance. Please retry in a few moments.' }
};

/**
 * Maps raw ABDM Gateway / ABHA responses or network errors into an AbdmError
 * @param {any} error
 * @returns {AbdmError}
 */
export function mapAbdmError(error) {
  // If already an AbdmError instance, pass through
  if (error instanceof AbdmError) {
    return error;
  }

  // Handle Fetch/Network Abort or Timeout
  if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
    return new AbdmError(
      'Connection to ABDM Gateway timed out. Please check network connectivity and try again.',
      504,
      'GATEWAY_TIMEOUT'
    );
  }

  // Handle Connection Refused / DNS Failure
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new AbdmError(
      'Unable to reach ABDM Gateway server. Service may be offline.',
      503,
      'GATEWAY_UNAVAILABLE'
    );
  }

  // If ABDM returned an error JSON payload
  if (error.response && error.response.error) {
    const rawError = error.response.error;
    const code = String(rawError.code || rawError.errorCode || '').trim();
    const rawMsg = rawError.message || rawError.description || '';

    if (ABDM_ERROR_MAP[code]) {
      const mapped = ABDM_ERROR_MAP[code];
      return new AbdmError(mapped.message, mapped.status, code, rawMsg);
    }

    // Heuristic matching based on error message substrings if code not recognized
    const lowerMsg = rawMsg.toLowerCase();
    if (lowerMsg.includes('otp expired') || lowerMsg.includes('token expired')) {
      return new AbdmError('OTP has expired. Please request a new OTP.', 400, 'OTP_EXPIRED', rawMsg);
    }
    if (lowerMsg.includes('invalid otp') || lowerMsg.includes('incorrect otp')) {
      return new AbdmError('Incorrect OTP entered. Please check the code received on your mobile.', 400, 'INVALID_OTP', rawMsg);
    }
    if (lowerMsg.includes('max attempt') || lowerMsg.includes('limit reached')) {
      return new AbdmError('Maximum verification attempts exceeded. Please request a fresh OTP.', 429, 'MAX_ATTEMPTS', rawMsg);
    }
    if (lowerMsg.includes('not found') || lowerMsg.includes('does not exist')) {
      return new AbdmError('The specified ABHA number was not found in the ABDM registry.', 404, 'ABHA_NOT_FOUND', rawMsg);
    }

    return new AbdmError(
      rawMsg || 'ABDM operation failed. Please verify the input details.',
      error.status || 400,
      code || 'ABDM_API_ERROR',
      rawMsg
    );
  }

  // Generic fallback
  return new AbdmError(
    error.message || 'An unexpected error occurred while communicating with ABDM.',
    500,
    'INTERNAL_ABDM_ERROR',
    error.toString()
  );
}

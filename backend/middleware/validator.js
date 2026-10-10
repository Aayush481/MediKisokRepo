/**
 * MediKiosk Request Validation Middleware
 * Strict schema and format checks before contacting external ABDM servers.
 */

export function validateRequestOtp(req, res, next) {
  const { abhaNumber, otpSystem } = req.body || {};

  if (!abhaNumber || typeof abhaNumber !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'ABHA number or ABHA address is required.'
      }
    });
  }

  const trimmed = abhaNumber.trim();
  const isAbhaAddress = trimmed.includes('@');

  if (isAbhaAddress) {
    // Validate ABHA address (e.g. name@abdm, name@sbx)
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(trimmed)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ABHA_ADDRESS',
          message: 'Invalid ABHA address format. Must be in the format username@abdm or username@sbx.'
        }
      });
    }
    req.body.abhaNumber = trimmed;
    req.body.isAbhaAddress = true;
  } else {
    // Validate 14-digit ABHA number
    const cleanAbha = trimmed.replace(/\D/g, '');
    if (cleanAbha.length !== 14) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ABHA_LENGTH',
          message: 'ABHA number must contain exactly 14 digits (e.g., 91-0000-0000-0001) or a valid ABHA address (e.g., user@abdm).'
        }
      });
    }
    req.body.abhaNumber = cleanAbha;
    req.body.isAbhaAddress = false;
  }

  if (otpSystem && !['aadhaar', 'abdm'].includes(otpSystem.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_OTP_SYSTEM',
        message: 'otpSystem must be either "aadhaar" or "abdm".'
      }
    });
  }

  next();
}

export function validateVerifyOtp(req, res, next) {
  const { txnId, otp } = req.body || {};

  if (!txnId || typeof txnId !== 'string' || txnId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Transaction ID (txnId) is required.'
      }
    });
  }

  if (!otp || typeof otp !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '6-digit OTP code is required.'
      }
    });
  }

  const cleanOtp = otp.trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_OTP_FORMAT',
        message: 'OTP must be exactly 6 numeric digits.'
      }
    });
  }

  req.body.otp = cleanOtp;
  next();
}

export function validateLinkPatient(req, res, next) {
  const { patient, consent } = req.body || {};

  if (!patient || typeof patient !== 'object') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Patient demographic data is required.'
      }
    });
  }

  if (!consent || consent.consentGiven !== true) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'CONSENT_REQUIRED',
        message: 'Explicit patient consent (DPDP Act 2023) is mandatory before linking records.'
      }
    });
  }

  next();
}

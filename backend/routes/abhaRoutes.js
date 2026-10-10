/**
 * MediKiosk ABHA API Routes
 * Endpoints for ABDM M1 Patient Verification & Profile Retrieval
 */

import express from 'express';
import { AbhaController } from '../controllers/abhaController.js';
import { authenticateStaff, requireRole } from '../middleware/auth.js';
import { otpRequestLimiter, otpVerifyLimiter } from '../middleware/rateLimiter.js';
import { validateRequestOtp, validateVerifyOtp, validateLinkPatient } from '../middleware/validator.js';

const router = express.Router();

// Apply staff authentication to all ABHA operations
router.use(authenticateStaff);

// Step 1: Request OTP for ABHA Patient Lookup
router.post(
  '/request-otp',
  otpRequestLimiter,
  validateRequestOtp,
  AbhaController.requestOtp
);

// Step 2 & 3: Verify OTP and Fetch Profile (sanitized server-side)
router.post(
  '/verify-otp',
  otpVerifyLimiter,
  validateVerifyOtp,
  AbhaController.verifyOtp
);

// Step 4: Link Patient with explicit DPDP consent
router.post(
  '/link-patient',
  validateLinkPatient,
  AbhaController.linkPatient
);

// Compliance: Query audit logs
router.get(
  '/audit-logs',
  requireRole(['admin', 'doctor', 'staff']),
  AbhaController.getAuditLogs
);

export default router;

/**
 * MediKiosk ABHA Controller
 * Handles HTTP requests for ABHA lookup, OTP verification, demographic retrieval, and record linking.
 */

import { abdmService } from '../services/abdmService.js';
import { PatientModel } from '../models/Patient.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { maskAbha, safeLog } from '../utils/masking.js';
import { mapAbdmError } from '../utils/errors.js';

export class AbhaController {
  /**
   * POST /api/abha/request-otp
   * Step 1: Request OTP from ABDM Gateway
   */
  static async requestOtp(req, res) {
    const { abhaNumber, otpSystem = 'aadhaar' } = req.body;
    const staff = req.staff || { id: 'KIOSK-STAFF', role: 'receptionist' };
    const masked = maskAbha(abhaNumber);

    try {
      const result = await abdmService.requestOtp({ abhaNumber, otpSystem });

      await AuditLogModel.record({
        action: 'OTP_REQUESTED',
        staffId: staff.id,
        staffRole: staff.role,
        maskedAbha: masked,
        status: 'SUCCESS',
        ip: req.ip,
        details: { otpSystem, txnId: result.txnId }
      });

      return res.status(200).json({
        success: true,
        txnId: result.txnId,
        message: result.message
      });
    } catch (err) {
      const mapped = mapAbdmError(err);
      safeLog('error', 'Failed to request OTP from ABDM', { error: mapped.message, abha: masked });

      await AuditLogModel.record({
        action: 'OTP_REQUESTED',
        staffId: staff.id,
        staffRole: staff.role,
        maskedAbha: masked,
        status: 'FAILURE',
        ip: req.ip,
        details: { code: mapped.abdmCode, error: mapped.message }
      });

      return res.status(mapped.statusCode || 500).json({
        success: false,
        error: {
          code: mapped.abdmCode,
          message: mapped.message
        }
      });
    }
  }

  /**
   * POST /api/abha/verify-otp
   * Step 2 & 3: Verify OTP with ABDM, retrieve official profile server-side,
   * and return sanitized demographics to client (user tokens NEVER reach browser).
   */
  static async verifyOtp(req, res) {
    const { txnId, otp, abhaNumber } = req.body;
    const staff = req.staff || { id: 'KIOSK-STAFF', role: 'receptionist' };
    const masked = maskAbha(abhaNumber || '');

    try {
      // 1. Verify OTP with ABDM Gateway -> obtain user token
      const verifyResult = await abdmService.verifyOtp({ txnId, otp });
      const userToken = verifyResult.userToken;

      // 2. Immediately fetch official demographic profile server-side
      const profile = await abdmService.getProfile(userToken);

      await AuditLogModel.record({
        action: 'OTP_VERIFIED_AND_PROFILE_FETCHED',
        staffId: staff.id,
        staffRole: staff.role,
        maskedAbha: maskAbha(profile.abhaNumber || abhaNumber),
        status: 'SUCCESS',
        ip: req.ip,
        details: { txnId }
      });

      // 3. Return ONLY sanitized demographic profile (zero internal tokens returned)
      return res.status(200).json({
        success: true,
        txnId,
        profile
      });
    } catch (err) {
      const mapped = mapAbdmError(err);
      safeLog('error', 'Failed to verify OTP or fetch profile', { error: mapped.message, txnId });

      await AuditLogModel.record({
        action: 'OTP_VERIFY',
        staffId: staff.id,
        staffRole: staff.role,
        maskedAbha: masked,
        status: 'FAILURE',
        ip: req.ip,
        details: { txnId, code: mapped.abdmCode, error: mapped.message }
      });

      return res.status(mapped.statusCode || 500).json({
        success: false,
        error: {
          code: mapped.abdmCode,
          message: mapped.message
        }
      });
    }
  }

  /**
   * POST /api/abha/link-patient
   * Step 4: Link/save verified ABHA patient with explicit DPDP Act 2023 consent
   */
  static async linkPatient(req, res) {
    const { patient, consent } = req.body;
    const staff = req.staff || { id: 'KIOSK-STAFF', role: 'receptionist' };
    const masked = maskAbha(patient?.abhaNumber);

    try {
      const savedPatient = await PatientModel.savePatient(patient, consent, staff.id);

      await AuditLogModel.record({
        action: 'PATIENT_LINKED',
        staffId: staff.id,
        staffRole: staff.role,
        maskedAbha: masked,
        status: 'SUCCESS',
        ip: req.ip,
        details: { patientId: savedPatient.id, purpose: consent.purpose }
      });

      return res.status(200).json({
        success: true,
        message: 'Patient demographic profile linked successfully with recorded consent.',
        patient: savedPatient
      });
    } catch (err) {
      safeLog('error', 'Failed to save/link ABHA patient', { error: err.message });
      return res.status(500).json({
        success: false,
        error: {
          code: 'PERSISTENCE_ERROR',
          message: 'Unable to save patient profile into clinical database.'
        }
      });
    }
  }

  /**
   * GET /api/abha/audit-logs
   * View compliance audit logs (staff/admin)
   */
  static async getAuditLogs(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const logs = await AuditLogModel.getRecent(limit);
      return res.status(200).json({
        success: true,
        count: logs.length,
        logs
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'AUDIT_ERROR', message: 'Unable to retrieve audit logs.' }
      });
    }
  }
}

/**
 * ABDM Intake Assistant Controller
 * Provides ABDM sandbox API gateway integrations strictly adhering to:
 * 1. ABHA ID format validation (Rule 1)
 * 2. Patient consent verification via ABDM Consent Manager (Rule 2)
 * 3. HL7 FHIR R4 mapping (Patient, Encounter, Observation, DiagnosticReport) (Rule 3 & 5)
 * 4. Consent-scope filtering (hiTypes) (Rule 4)
 * 5. Structured JSON FHIR R4 bundles (Rule 5)
 * 6. "Consent required to fetch records." on missing/invalid consent (Rule 6)
 * 7. Zero-hallucination / zero dummy data policy (Rule 7)
 * 8. Audit logging of every fetch attempt with timestamp & consent artifact ID (Rule 8)
 */

import { 
  AbdmSandboxService, 
  ABDM_FETCH_AUDIT_LOGS, 
  ABDM_CONSENT_REGISTRY 
} from '../../frontend/src/services/abdmSandboxService.js';
import { validateAbhaId } from '../../frontend/src/services/abhaService.js';

export class AbdmController {
  /**
   * Validate ABHA ID format before making requests (Rule 1)
   */
  static validateAbha(req, res) {
    try {
      const { abhaId } = req.body || {};
      const validation = validateAbhaId(abhaId);
      return res.json({
        isValid: validation.isValid,
        formattedId: validation.formattedId,
        error: validation.error || null,
        needsEkyc: Boolean(validation.needsEkyc)
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Request / register patient consent via ABDM Consent Manager (Rule 2)
   */
  static requestConsent(req, res) {
    try {
      const { abhaId, patientName, hiTypes } = req.body || {};
      if (!abhaId) {
        return res.status(400).json({ error: 'abhaId is required' });
      }

      const artifact = AbdmSandboxService.requestConsent(
        abhaId, 
        patientName, 
        hiTypes || ["Patient", "Encounter", "Observation", "DiagnosticReport"]
      );

      return res.status(201).json({
        success: true,
        consentArtifact: artifact
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * Fetch patient demographics resource from ABHA ID (Rules 1-8)
   */
  static async fetchPatient(req, res) {
    try {
      const { abhaId, consentArtifactId } = req.body || {};

      const result = await AbdmSandboxService.fetchPatient({
        abhaId,
        consentArtifactId
      });

      if (result.error === "Invalid ABHA ID") {
        return res.status(400).json({ error: "Invalid ABHA ID" });
      }

      if (result.error === "Consent required") {
        return res.status(403).json({ error: "Consent required" });
      }

      if (result.error) {
        return res.status(404).json(result);
      }

      // Return FHIR R4 Patient Resource
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Fetch patient records from ABHA ID using ABDM sandbox APIs (Rules 1-8)
   */
  static async fetchPatientRecords(req, res) {
    try {
      const { abhaId, consentArtifactId } = req.body || {};

      // Execute ABDM sandbox fetch workflow
      const result = await AbdmSandboxService.fetchPatientRecords({
        abhaId,
        consentArtifactId
      });

      if (result.error === "Invalid ABHA ID") {
        return res.status(400).json({ error: "Invalid ABHA ID" });
      }

      if (result.error === "Consent required") {
        return res.status(403).json({ error: "Consent required" });
      }

      // Return FHIR R4 Compliant Bundle (Rules 3, 4, 5, 7)
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Initialize ABDM authentication session (Gateway OTP)
   */
  static initAuth(req, res) {
    try {
      const { abhaId, authMode } = req.body || {};
      const result = AbdmSandboxService.initAuth(abhaId, authMode || "OTP");
      if (result.error === "Invalid ABHA ID") {
        return res.status(400).json({ error: "Invalid ABHA ID" });
      }
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Confirm OTP and fetch genuine ABDM profile
   */
  static async confirmAuth(req, res) {
    try {
      const { abhaId, otp } = req.body || {};
      const result = await AbdmSandboxService.confirmOtpAndFetchProfile(abhaId, otp);
      if (result.error === "Invalid ABHA ID") {
        return res.status(400).json({ error: "Invalid ABHA ID" });
      }
      if (result.error) {
        return res.status(401).json(result);
      }
      return res.json({
        success: true,
        patient: result
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get append-only audit log entries (Rule 8)
   */
  static getAuditLogs(req, res) {
    return res.json({
      totalLogs: ABDM_FETCH_AUDIT_LOGS.length,
      logs: ABDM_FETCH_AUDIT_LOGS
    });
  }
}

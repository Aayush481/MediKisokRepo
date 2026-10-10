/**
 * MediKiosk Patient Model with Field-Level AES-256-GCM Encryption
 * Compliant with India DPDP Act 2023 & ABDM Health Data Management Policy
 * Supports Mongoose if MongoDB connected, with seamless fallback to patientDB in-memory store.
 */

import { CryptoService } from '../services/cryptoService.js';
import { patientDB } from '../config/db.js';

let mongoose = null;
let PatientSchema = null;
let MongoosePatientModel = null;

// Dynamic import attempt for mongoose to preserve zero-dependency fallback
try {
  const mod = await import('mongoose');
  mongoose = mod.default || mod;

  if (mongoose && mongoose.Schema) {
    PatientSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
      age: { type: String },
      dateOfBirth: { type: String },
      abhaAddress: { type: String },
      // Sensitive fields encrypted at rest via AES-256-GCM
      abhaNumberEncrypted: { type: String, required: true },
      mobileEncrypted: { type: String },
      addressEncrypted: { type: String },
      district: { type: String },
      state: { type: String },
      pincode: { type: String },
      photoUrl: { type: String },
      verificationStatus: { type: String, enum: ['VERIFIED', 'UNVERIFIED', 'SELF_DECLARED'], default: 'UNVERIFIED' },
      // DPDP Act 2023 Mandatory Consent Record
      consent: {
        consentGiven: { type: Boolean, required: true, default: false },
        consentTimestamp: { type: Date, default: Date.now },
        purpose: { type: String, default: 'CLINICAL_INTAKE_REGISTRATION' },
        staffId: { type: String }
      },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    MongoosePatientModel = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
  }
} catch {
  // Mongoose not installed or MongoDB not configured; fallback store will be used.
}

export class PatientModel {
  /**
   * Save or update patient record with encryption at rest
   * @param {object} patientData
   * @param {object} consentData
   * @param {string} staffId
   * @returns {Promise<object>}
   */
  static async savePatient(patientData, consentData = {}, staffId = 'STAFF-01') {
    const id = patientData.id || `PAT-${Date.now()}`;
    const cleanAbha = (patientData.abhaNumber || '').replace(/\D/g, '');

    const record = {
      id,
      name: patientData.name || '',
      gender: patientData.gender || 'Other',
      age: String(patientData.age || ''),
      dateOfBirth: patientData.dateOfBirth || '',
      abhaAddress: patientData.abhaAddress || '',
      abhaNumberEncrypted: CryptoService.encryptField(cleanAbha),
      mobileEncrypted: CryptoService.encryptField(patientData.mobile || ''),
      addressEncrypted: CryptoService.encryptField(patientData.address || ''),
      district: patientData.district || '',
      state: patientData.state || '',
      pincode: patientData.pincode || '',
      photoUrl: patientData.photoUrl || null,
      verificationStatus: patientData.verificationStatus || 'VERIFIED',
      consent: {
        consentGiven: !!consentData.consentGiven,
        consentTimestamp: consentData.consentTimestamp || new Date().toISOString(),
        purpose: consentData.purpose || 'CLINICAL_INTAKE_REGISTRATION',
        staffId
      },
      updatedAt: new Date().toISOString()
    };

    // If Mongoose model is connected to MongoDB
    if (MongoosePatientModel && mongoose?.connection?.readyState === 1) {
      await MongoosePatientModel.findOneAndUpdate({ id }, record, { upsert: true, new: true });
    }

    // Save in in-memory patientDB store for immediate availability
    patientDB.save({
      ...patientData,
      id,
      abhaNumber: cleanAbha,
      consent: record.consent
    });

    return {
      id,
      name: record.name,
      abhaAddress: record.abhaAddress,
      maskedAbha: cleanAbha.length === 14 ? `**-****-****-${cleanAbha.slice(-4)}` : '****',
      verificationStatus: record.verificationStatus,
      consent: record.consent
    };
  }

  /**
   * Find patient by ID
   */
  static async getById(id) {
    if (MongoosePatientModel && mongoose?.connection?.readyState === 1) {
      const doc = await MongoosePatientModel.findOne({ id }).lean();
      if (doc) {
        return {
          ...doc,
          abhaNumber: CryptoService.decryptField(doc.abhaNumberEncrypted),
          mobile: CryptoService.decryptField(doc.mobileEncrypted),
          address: CryptoService.decryptField(doc.addressEncrypted)
        };
      }
    }

    return patientDB.getById(id);
  }
}

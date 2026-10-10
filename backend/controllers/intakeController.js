/**
 * MediKiosk Intake Controller
 * Handles anatomy registry serving, versioned question bank retrieval,
 * and clinical intake session persistence with DPDP Act 2023 compliance.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

import { GeminiIntakeService } from '../services/geminiIntakeService.js';
import { DoctorAllocationService } from '../services/doctorAllocationService.js';

// In-memory persistent session store (ephemeral or DB backed)
const intakeSessionsStore = new Map();

export class IntakeController {
  static async summarizeAndAllocate(req, res) {
    try {
      const { selectedParts, answers, language = 'en', triageResult, consentGiven = true, patientId } = req.body;

      if (!selectedParts || selectedParts.length === 0) {
        return res.status(400).json({ status: 'error', message: 'selectedParts array is required' });
      }

      const summary = await GeminiIntakeService.summarizeIntake({
        selectedParts,
        answers,
        language,
        triageResult,
        consentGiven
      });

      const allocation = DoctorAllocationService.allocateDoctor({
        suggestedSpecialties: summary.suggestedSpecialties,
        urgencyTier: triageResult?.urgencyTier || (triageResult?.isEmergency ? 'EMERGENCY_PRIORITY_1' : 'ROUTINE_PRIORITY_3'),
        patientId
      });

      res.json({
        status: 'success',
        summary,
        allocation,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[IntakeController] summarizeAndAllocate error:', err);
      res.status(500).json({ status: 'error', message: 'Internal server error during clinical intake summarization' });
    }
  }

  static getRegistry(req, res) {
    try {
      const regPath = path.join(rootDir, 'backend', 'data', 'anatomyRegistry.json');
      const data = fs.readFileSync(regPath, 'utf8');
      res.json({
        status: 'success',
        count: JSON.parse(data).length,
        registry: JSON.parse(data)
      });
    } catch (err) {
      console.error('[IntakeController] getRegistry error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to load anatomy registry' });
    }
  }

  static getQuestionBank(req, res) {
    try {
      const { organId } = req.params;
      const qbPath = path.join(rootDir, 'backend', 'data', 'questionBanks.json');
      const qbData = JSON.parse(fs.readFileSync(qbPath, 'utf8'));

      const banks = qbData.banks || qbData.organs || {};

      if (organId) {
        const found = banks[organId];
        if (!found) {
          return res.status(404).json({ status: 'error', message: `No question bank for organ: ${organId}` });
        }
        return res.json({ status: 'success', organId, questionBank: found });
      }

      res.json({ status: 'success', version: qbData.version, questionBanks: banks, globalQuestions: qbData.globalQuestions || [] });
    } catch (err) {
      console.error('[IntakeController] getQuestionBank error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to load question banks' });
    }
  }

  static saveSession(req, res) {
    try {
      const { patientId, patientName, selectedOrgans, answers, triageResult, consentGiven } = req.body;

      if (!patientId || !selectedOrgans || !answers) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing mandatory intake fields: patientId, selectedOrgans, and answers are required.'
        });
      }

      const sessionId = `INTAKE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // DPDP Act 2023 Compliance: Anonymize or hash sensitive references, store minimal necessary data
      const sessionRecord = {
        sessionId,
        patientId,
        patientNameMasked: patientName ? `${patientName.charAt(0)}***` : 'Anonymous',
        selectedOrgans,
        answers,
        triageResult: triageResult || { urgencyTier: 'ROUTINE_PRIORITY_3' },
        dpdpConsent: consentGiven !== false,
        engineVersion: '2.1.0-SIH2026',
        createdAt: new Date().toISOString()
      };

      intakeSessionsStore.set(sessionId, sessionRecord);

      res.status(201).json({
        status: 'success',
        sessionId,
        urgencyTier: sessionRecord.triageResult.urgencyTier,
        message: 'Clinical intake session stored and linked to patient encounter.'
      });
    } catch (err) {
      console.error('[IntakeController] saveSession error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to save intake session' });
    }
  }

  static getSessionById(req, res) {
    const { id } = req.params;
    const session = intakeSessionsStore.get(id);
    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Intake session not found' });
    }
    res.json({ status: 'success', session });
  }

  static getAllSessions(req, res) {
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);

    const allSessions = Array.from(intakeSessionsStore.values()).reverse();
    const startIndex = (page - 1) * limit;
    const paginated = allSessions.slice(startIndex, startIndex + limit);

    res.json({
      status: 'success',
      total: allSessions.length,
      page,
      limit,
      sessions: paginated
    });
  }
}

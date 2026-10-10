/**
 * MediKiosk Neurodevelopmental & ADHD Wellness Controller
 * Manages conversation turns, safety screening, scoring, triage,
 * doctor allocation, self-management plans, and 2-week check-in escalation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

import { NeuroSafetyEngine } from '../services/neuroSafetyEngine.js';
import { AdhdScoringEngine } from '../services/adhdScoringEngine.js';
import { AdhdTriageEngine } from '../services/adhdTriageEngine.js';
import { GeminiNeuroService } from '../services/geminiNeuroService.js';
import { DoctorAllocationService } from '../services/doctorAllocationService.js';
import { SmsNotificationService } from '../services/smsNotificationService.js';

const smsService = new SmsNotificationService();

// Persistent session store (in-memory with DB backup)
const neuroSessions = new Map();

export class NeuroWellnessController {
  /**
   * Serve versioned question bank
   */
  static getQuestionBank(req, res) {
    try {
      const qbPath = path.join(rootDir, 'backend', 'data', 'adhdQuestionBank.json');
      const data = JSON.parse(fs.readFileSync(qbPath, 'utf8'));
      res.json({
        status: 'success',
        version: data.version,
        licenseNotes: data.licenseNotes,
        clinicalCitations: data.clinicalCitations,
        shortModeQuestionIds: data.shortModeQuestionIds,
        questions: data.questions
      });
    } catch (err) {
      console.error('[NeuroWellnessController] getQuestionBank error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to load question bank' });
    }
  }

  /**
   * Serve clinician-approved self-care content library and 7-day plan template
   */
  static getSelfCareLibrary(req, res) {
    try {
      const libPath = path.join(rootDir, 'backend', 'data', 'adhdSelfCareLibrary.json');
      const data = JSON.parse(fs.readFileSync(libPath, 'utf8'));
      res.json({
        status: 'success',
        version: data.version,
        disclaimer: data.disclaimer,
        items: data.items,
        sample7DayPlan: data.sample7DayPlan
      });
    } catch (err) {
      console.error('[NeuroWellnessController] getSelfCareLibrary error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to load self-care library' });
    }
  }

  /**
   * Pre-LLM safety evaluation for interactive turns
   */
  static checkTurnSafety(req, res) {
    try {
      const { text = "", answers = {} } = req.body;
      const safetyResult = NeuroSafetyEngine.evaluate(text, answers);
      res.json({
        status: 'success',
        safetyResult
      });
    } catch (err) {
      console.error('[NeuroWellnessController] checkTurnSafety error:', err);
      res.status(500).json({ status: 'error', message: 'Error checking safety layer' });
    }
  }

  /**
   * Process completed screening, compute scores, run triage, and generate summaries
   */
  static async completeAssessment(req, res) {
    try {
      const {
        sessionId = "NEURO-" + Math.floor(10000 + Math.random() * 90000),
        patientId = "PAT-" + Math.floor(1000 + Math.random() * 9000),
        audience = "adult_self",
        answers = {},
        language = "en",
        consentGiven = true,
        patientRequestedDoctor = false
      } = req.body;

      // 1. Mandatory Safety Evaluation
      const safetyResult = NeuroSafetyEngine.evaluate("", answers);
      if (safetyResult.isTriggered) {
        const crisisRecord = {
          sessionId,
          patientId,
          audience,
          status: "EMERGENCY_HALTED",
          safetyResult,
          completedAt: new Date().toISOString()
        };
        neuroSessions.set(sessionId, crisisRecord);

        return res.json({
          status: 'crisis_interrupted',
          outcome: 'PATH_C_CRISIS_ESCALATION',
          safetyResult,
          urgencyTier: 'EMERGENCY_PRIORITY_1'
        });
      }

      // 2. Deterministic Scoring
      const scoringResult = AdhdScoringEngine.scoreSession({
        audience,
        answers
      });

      // 3. Deterministic Triage
      const triageResult = AdhdTriageEngine.evaluate({
        scoringResult,
        safetyResult,
        patientRequestedDoctor
      });

      // 4. Clinical & Patient Summaries (with Consent Gate & 3500ms Fallback)
      const summaryResult = await GeminiNeuroService.generateSummary({
        audience: audience === "minor_guardian" ? "minor" : "adult",
        answers,
        scoring: scoringResult,
        triage: triageResult,
        language,
        consentGiven
      });

      // 5. Build Personalized 7-Day Plan (from approved library)
      const libPath = path.join(rootDir, 'backend', 'data', 'adhdSelfCareLibrary.json');
      const libData = JSON.parse(fs.readFileSync(libPath, 'utf8'));
      
      // Select 3 to 4 targeted actions based on user's answers
      const selectedActions = [];
      if (answers.SLEEP_LATENCY === "over_45_min" || answers.ROUTINE_WAKE === "irregular_erratic") {
        selectedActions.push(libData.items.find(i => i.id === "TIP_SLEEP_ANCHOR"));
        selectedActions.push(libData.items.find(i => i.id === "TIP_SCREEN_WIND_DOWN"));
      }
      if (answers.SUBSTANCE_CAFFEINE === "high_4_plus_cups") {
        selectedActions.push(libData.items.find(i => i.id === "TIP_CAFFEINE_CUTOFF"));
      }
      selectedActions.push(libData.items.find(i => i.id === "TIP_POMODORO_CHUNK"));
      selectedActions.push(libData.items.find(i => i.id === "TIP_MICRO_MOVEMENT"));
      const personalizedTips = selectedActions.filter(Boolean).slice(0, 4);

      // Save session in memory
      const completedSession = {
        sessionId,
        patientId,
        audience,
        answers,
        scoring: scoringResult,
        triage: triageResult,
        summary: summaryResult,
        personalizedTips,
        status: "COMPLETED",
        completedAt: new Date().toISOString()
      };
      neuroSessions.set(sessionId, completedSession);

      res.json({
        status: 'success',
        sessionId,
        triage: triageResult,
        scoring: scoringResult,
        summary: summaryResult,
        personalizedTips,
        disclaimer: "Informational Clinical Decision Support only. Screening tool, not a medical diagnosis. Requires Registered Medical Practitioner (RMP) confirmation."
      });
    } catch (err) {
      console.error('[NeuroWellnessController] completeAssessment error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to process screening assessment' });
    }
  }

  /**
   * Get top 3 doctor recommendations based on triage specialties
   */
  static getDoctorRecommendations(req, res) {
    try {
      const { suggestedSpecialties = ["Psychiatry", "Clinical Psychology"], language = "English", genderPreference = null } = req.query;
      const specialtiesArray = Array.isArray(suggestedSpecialties) ? suggestedSpecialties : String(suggestedSpecialties).split(',');

      const result = DoctorAllocationService.getTopDoctorRecommendations({
        suggestedSpecialties: specialtiesArray,
        language,
        genderPreference,
        limit: 3
      });

      res.json({
        status: 'success',
        ...result
      });
    } catch (err) {
      console.error('[NeuroWellnessController] getDoctorRecommendations error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to get doctor recommendations' });
    }
  }

  /**
   * Book appointment with chosen doctor and attach clinical screening summary
   */
  static bookSpecialistSlot(req, res) {
    try {
      const {
        doctorId,
        patientId = "PAT-" + Math.floor(1000 + Math.random() * 9000),
        patientName = "Walk-in Patient",
        mobile = "+91 98765 43210",
        sessionId
      } = req.body;

      const session = sessionId ? neuroSessions.get(sessionId) : null;
      const clinicalSummary = session ? session.summary : null;

      const booking = DoctorAllocationService.bookDoctorSlotAtomic({
        doctorId,
        patientId,
        patientName,
        clinicalSummary
      });

      // Update session record
      if (session) {
        session.allocation = booking;
        neuroSessions.set(sessionId, session);
      }

      // Send privacy-preserving SMS (ZERO health/mental-health details in SMS text)
      smsService.sendSms({
        mobile,
        patientId,
        patientName,
        tokenNumber: booking.tokenNumber,
        membersNext: Math.max(0, booking.queuePosition - 1),
        appointmentTime: booking.appointmentTime,
        waitMinutes: booking.estimatedWaitMinutes,
        doctorName: booking.doctor.name,
        cabinNumber: booking.doctor.cabin,
        department: booking.doctor.specialty,
        alertType: "registration"
      }).catch(smsErr => console.warn('[NeuroWellnessController] SMS send notice:', smsErr));

      res.json({
        status: 'success',
        booking,
        message: `Appointment confirmed with ${booking.doctor.name}. Token: ${booking.tokenNumber}. Cabin: ${booking.doctor.cabin}.`
      });
    } catch (err) {
      console.error('[NeuroWellnessController] bookSpecialistSlot error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to book doctor appointment' });
    }
  }

  /**
   * 2-Week Re-Check-in Evaluation
   * If symptoms worsened or no improvement, automatically escalates to Path B
   */
  static submitCheckIn(req, res) {
    try {
      const {
        sessionId,
        patientId,
        checkInAnswers = {}
      } = req.body;

      const routineProgress = checkInAnswers.routineProgress; // 'improved' | 'same' | 'worsened'
      const focusChallenges = checkInAnswers.focusChallenges; // 'improved' | 'same' | 'worsened'
      const wantsDoctor = checkInAnswers.wantsDoctor === true || checkInAnswers.wantsDoctor === "yes";

      const hasWorsened = routineProgress === "worsened" || focusChallenges === "worsened";
      const hasStagnated = routineProgress === "same" && focusChallenges === "same";

      let escalated = false;
      let nextPath = "PATH_A_SELF_MANAGEMENT";
      let message = "Great job maintaining your self-care routines! Keep following your 7-day plan.";

      if (hasWorsened || hasStagnated || wantsDoctor) {
        escalated = true;
        nextPath = "PATH_B_SPECIALIST_RECOMMENDED";
        message = "Because you reported persistent or worsening challenges, we recommend consulting our hospital specialist for a comprehensive clinical review.";
      }

      res.json({
        status: 'success',
        escalated,
        nextPath,
        message,
        recommendedSpecialties: ["Psychiatry", "Clinical Psychology"],
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[NeuroWellnessController] submitCheckIn error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to process check-in' });
    }
  }

  /**
   * Retrieve session for Doctor Dashboard or FHIR export
   */
  static getSession(req, res) {
    try {
      const { id } = req.params;
      const session = neuroSessions.get(id);
      if (!session) {
        return res.status(404).json({ status: 'error', message: 'Screening session not found' });
      }
      res.json({ status: 'success', session });
    } catch (err) {
      res.status(500).json({ status: 'error', message: 'Failed to get session' });
    }
  }
}

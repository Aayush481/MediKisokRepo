/**
 * MediKiosk ADHD & Neuro-Wellness Client Service
 * Orchestrates communication with backend API, offline local fallback,
 * and localStorage pause/resume session persistence.
 */

import { ADHD_QUESTION_BANK, SELF_CARE_TIPS } from '../data/adhdContentLibrary.js';

class AdhdClientService {
  constructor() {
    this.sessionStorageKey = 'medikiosk_adhd_active_session';
  }

  /**
   * Load question bank (server first, then offline fallback)
   */
  async loadQuestionBank() {
    try {
      const resp = await fetch('/api/neuro-wellness/questions');
      if (resp.ok) {
        const data = await resp.json();
        return data.questions || ADHD_QUESTION_BANK.questions;
      }
    } catch (e) {
      console.warn('[AdhdClientService] Using offline question bank:', e);
    }
    return ADHD_QUESTION_BANK.questions;
  }

  /**
   * Pre-LLM safety evaluation for free-text input
   */
  async checkSafety(text, answers = {}) {
    try {
      const resp = await fetch('/api/neuro-wellness/check-turn-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, answers })
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.safetyResult;
      }
    } catch (e) {
      // Local fallback crisis keyword check
    }

    const lower = String(text || '').toLowerCase();
    const crisisWords = ['suicide', 'kill myself', 'want to die', 'आत्महत्या', 'मरना चाहता'];
    for (const kw of crisisWords) {
      if (lower.includes(kw)) {
        return {
          isTriggered: true,
          category: 'SUICIDAL_IDEATION_OR_SELF_HARM',
          helplines: {
            primary: { number: '14416', nameEn: 'Tele-MANAS' }
          }
        };
      }
    }
    return { isTriggered: false };
  }

  /**
   * Submit completed assessment
   */
  async submitAssessment(payload) {
    try {
      const resp = await fetch('/api/neuro-wellness/complete-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('[AdhdClientService] Assessment API notice, generating local fallback:', e);
    }

    // Local deterministic fallback
    const answers = payload.answers || {};
    const asrsAnswers = [answers.ASRS_A1, answers.ASRS_A2, answers.ASRS_A3, answers.ASRS_A4, answers.ASRS_A5, answers.ASRS_A6];
    const positiveCount = asrsAnswers.filter((v, idx) => {
      const thresh = idx < 3 ? 2 : 3;
      return (Number(v) || 0) >= thresh;
    }).length;
    const isScreenPositive = positiveCount >= 4;

    return {
      status: 'success',
      sessionId: payload.sessionId || 'NEURO-OFFLINE-' + Date.now(),
      triage: {
        outcome: isScreenPositive ? 'PATH_B_SPECIALIST_RECOMMENDED' : 'PATH_A_SELF_MANAGEMENT',
        suggestedSpecialties: ['Psychiatry', 'Clinical Psychology']
      },
      scoring: {
        screener: { isScreenPositive, positiveThresholdCount: positiveCount }
      },
      summary: {
        sbarClinicalSummary: `Offline SBAR: ADHD screening completed. Positive items: ${positiveCount}/6. Outcome: ${isScreenPositive ? 'Specialist Recommended' : 'Self-Care'}.`,
        patientFacingExplanation: isScreenPositive 
          ? 'Your responses indicate focus patterns that would benefit from consultation with our hospital specialist.'
          : 'Your responses are manageable with evidence-based lifestyle and executive function routines.',
        source: 'deterministic_client_rules'
      },
      personalizedTips: SELF_CARE_TIPS.slice(0, 4)
    };
  }

  /**
   * Get doctor recommendations for Path B
   */
  async getDoctorRecommendations(specialties = ['Psychiatry', 'Clinical Psychology']) {
    try {
      const resp = await fetch(`/api/neuro-wellness/doctor-recommendations?suggestedSpecialties=${encodeURIComponent(specialties.join(','))}`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('[AdhdClientService] Doctor recommendations API notice:', e);
    }

    // Fallback hospital doctor list
    return {
      status: 'success',
      candidates: [
        {
          id: 'doc_psych_1',
          name: 'Dr. Radhika Nair',
          specialty: 'Psychiatry',
          cabin: 'Cabin 304',
          floor: '3rd Floor',
          estimatedWaitMinutes: 15,
          nextAvailableSlot: 'In 15 mins',
          languages: ['English', 'Hindi'],
          rankReason: 'Primary Behavioral Health Consultant'
        },
        {
          id: 'doc_psych_2',
          name: 'Dr. Alok Sen',
          specialty: 'Clinical Psychology',
          cabin: 'Cabin 305',
          floor: '3rd Floor',
          estimatedWaitMinutes: 0,
          nextAvailableSlot: 'Available Now',
          languages: ['English', 'Hindi', 'Bengali'],
          rankReason: 'Immediate slot available'
        }
      ]
    };
  }

  /**
   * Confirm atomic doctor booking
   */
  async bookDoctorSlot(bookingPayload) {
    try {
      const resp = await fetch('/api/neuro-wellness/book-specialist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('[AdhdClientService] Booking API notice:', e);
    }

    const tokenNum = 'PSY-' + Math.floor(10 + Math.random() * 89);
    return {
      status: 'success',
      booking: {
        tokenNumber: tokenNum,
        queuePosition: 2,
        estimatedWaitMinutes: 15,
        doctor: {
          name: 'Dr. Radhika Nair',
          specialty: 'Psychiatry',
          cabin: 'Cabin 304',
          floor: '3rd Floor'
        }
      }
    };
  }

  /**
   * Submit 2-week check-in
   */
  async submitCheckIn(sessionId, checkInAnswers) {
    try {
      const resp = await fetch('/api/neuro-wellness/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, checkInAnswers })
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('[AdhdClientService] Check-in API notice:', e);
    }

    const worsened = checkInAnswers.routineProgress === 'worsened' || checkInAnswers.focusChallenges === 'worsened';
    return {
      status: 'success',
      escalated: worsened,
      nextPath: worsened ? 'PATH_B_SPECIALIST_RECOMMENDED' : 'PATH_A_SELF_MANAGEMENT',
      message: worsened 
        ? 'Based on persistent challenges, we recommend consulting our hospital specialist.' 
        : 'Keep following your daily 7-day routine!'
    };
  }

  /**
   * Pause & Resume Local Storage Helpers
   */
  saveSessionProgress(state) {
    try {
      localStorage.setItem(this.sessionStorageKey, JSON.stringify(state));
    } catch (e) {}
  }

  loadSessionProgress() {
    try {
      const saved = localStorage.getItem(this.sessionStorageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  clearSessionProgress() {
    try {
      localStorage.removeItem(this.sessionStorageKey);
    } catch (e) {}
  }
}

export const adhdClientService = new AdhdClientService();

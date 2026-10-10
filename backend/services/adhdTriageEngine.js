/**
 * MediKiosk Deterministic ADHD & Neuro-Wellness Triage Engine
 * Maps validated screener scores, impairment, onset, and comorbidity flags
 * directly into reproducible clinical routing paths:
 *   - PATH_A_SELF_MANAGEMENT
 *   - PATH_B_SPECIALIST_RECOMMENDED
 *   - PATH_C_CRISIS_ESCALATION
 */

export class AdhdTriageEngine {
  static RULESET_VERSION = "1.0.0";

  /**
   * Evaluates triage path based on scoring result and patient preferences
   *
   * @param {object} params
   * @param {object} params.scoringResult - Output of AdhdScoringEngine.scoreSession()
   * @param {object} params.safetyResult - Output of NeuroSafetyEngine.evaluate()
   * @param {boolean} params.patientRequestedDoctor - Explicit patient wish to consult a doctor
   * @returns {object} Deterministic triage outcome
   */
  static evaluate(params = {}) {
    const {
      scoringResult = {},
      safetyResult = { isTriggered: false },
      patientRequestedDoctor = false
    } = params;

    const triggeredRules = [];
    const isAdult = scoringResult.audience !== "minor";

    // 1. Path C: Crisis / Emergency
    if (safetyResult.isTriggered) {
      triggeredRules.push({
        ruleId: safetyResult.ruleId || "RULE_CRISIS_TRIGGER",
        reason: safetyResult.reason || "Safety layer triggered immediate clinical crisis protocol.",
        severity: "EMERGENCY_PRIORITY_1"
      });

      return {
        outcome: "PATH_C_CRISIS_ESCALATION",
        urgencyTier: "EMERGENCY_PRIORITY_1",
        rulesetVersion: this.RULESET_VERSION,
        triggeredRules,
        primarySpecialty: "Emergency Medicine",
        suggestedSpecialties: ["Emergency Medicine", "Psychiatry"],
        allowSelfManagement: false,
        allowOnlineBooking: false,
        requiresImmediateAssistance: true,
        reason: "Patient safety concern triggered immediate crisis response."
      };
    }

    // 2. Check specialist criteria
    const screener = scoringResult.screener || {};
    const impairment = scoringResult.impairment || {};
    const chronicity = scoringResult.chronicity || {};
    const comorbidities = scoringResult.comorbidities || {};

    let warrantsSpecialist = false;

    // Rule: Screener at or above threshold
    if (screener.isScreenPositive) {
      warrantsSpecialist = true;
      triggeredRules.push({
        ruleId: isAdult ? "RULE_ASRS_PART_A_THRESHOLD" : "RULE_VANDERBILT_THRESHOLD",
        reason: isAdult 
          ? `WHO ASRS v1.1 Part A positive: ${screener.positiveThresholdCount}/6 items at/above threshold.`
          : `Vanderbilt pediatric scale elevated: ${screener.elevatedCount} items rated clinically elevated.`
      });
    }

    // Rule: Significant multi-setting functional impairment
    if (impairment.satisfiesMultiSetting) {
      warrantsSpecialist = true;
      triggeredRules.push({
        ruleId: "RULE_MULTI_SETTING_IMPAIRMENT",
        reason: `Functional impairment reported across ${impairment.affectedSettingsCount} settings (${impairment.settings.join(", ")}).`
      });
    }

    // Rule: Comorbid mood distress
    if (comorbidities.moodDistress) {
      warrantsSpecialist = true;
      triggeredRules.push({
        ruleId: "RULE_COMORBID_MOOD_DISTRESS",
        reason: "Significant persistent low mood or anxiety reported."
      });
    }

    // Rule: Patient explicitly requests a doctor
    if (patientRequestedDoctor) {
      warrantsSpecialist = true;
      triggeredRules.push({
        ruleId: "RULE_PATIENT_DOCTOR_REQUEST",
        reason: "Patient or guardian explicitly requested a specialist physician consultation."
      });
    }

    // Determine targeted hospital specialties
    const suggestedSpecialties = [];
    if (isAdult) {
      suggestedSpecialties.push("Psychiatry");
      suggestedSpecialties.push("Clinical Psychology");
    } else {
      suggestedSpecialties.push("Child & Adolescent Psychiatry");
      suggestedSpecialties.push("Developmental Pediatrics");
      suggestedSpecialties.push("Pediatrics");
    }

    if (comorbidities.sleepDisturbance) {
      suggestedSpecialties.push("Sleep Medicine");
    }

    // If specialist criteria met -> PATH B
    if (warrantsSpecialist) {
      return {
        outcome: "PATH_B_SPECIALIST_RECOMMENDED",
        urgencyTier: "ROUTINE_PRIORITY_3",
        rulesetVersion: this.RULESET_VERSION,
        triggeredRules,
        primarySpecialty: suggestedSpecialties[0],
        suggestedSpecialties,
        allowSelfManagement: true, // Patient can also view supportive tips while waiting for doctor
        allowOnlineBooking: true,
        requiresImmediateAssistance: false,
        reason: "Symptom score, functional impairment, or patient preference indicates specialist clinical evaluation."
      };
    }

    // Otherwise -> PATH A (Self-Management Guidance)
    triggeredRules.push({
      ruleId: "RULE_SUBTHRESHOLD_SELF_CARE",
      reason: "Screener scores below clinical threshold and no severe multi-setting impairment detected."
    });

    return {
      outcome: "PATH_A_SELF_MANAGEMENT",
      urgencyTier: "ROUTINE_PRIORITY_3",
      rulesetVersion: this.RULESET_VERSION,
      triggeredRules,
      primarySpecialty: suggestedSpecialties[0],
      suggestedSpecialties,
      allowSelfManagement: true,
      allowOnlineBooking: true, // Always allowed if patient still wants to talk to a doctor
      requiresImmediateAssistance: false,
      reason: "Subthreshold responses suitable for evidence-based self-care, lifestyle routines, and 2-week check-in."
    };
  }
}

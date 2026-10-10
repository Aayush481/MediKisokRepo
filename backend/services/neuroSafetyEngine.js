/**
 * MediKiosk Deterministic Neuro-Psychiatric Safety Engine
 * Executes BEFORE any LLM invocation on every patient turn.
 * Evaluates free text and structured responses against clinician-approved safety rules.
 * English & Hindi pattern support with verified Indian national crisis helplines.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// Load versioned safety rules
let SAFETY_CONFIG = {
  helplines: {
    teleManas: { number: "14416", tollFree: "1800-891-4416", nameEn: "Tele-MANAS", nameHi: "टेली-मानस" },
    nationalEmergency: { number: "112", nameEn: "National Emergency Response 112", nameHi: "राष्ट्रीय आपातकाल 112" },
    childline: { number: "1098", nameEn: "Childline 1098", nameHi: "चाइल्डलाइन 1098" },
    hospitalEmergencyBay: { number: "Ext. 102", nameEn: "Hospital Resuscitation & Emergency Bay", nameHi: "अस्पताल आपातकालीन वार्ड" }
  },
  rules: []
};

try {
  const rulesPath = path.join(rootDir, 'backend', 'data', 'neuroSafetyRules.json');
  if (fs.existsSync(rulesPath)) {
    SAFETY_CONFIG = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  }
} catch (e) {
  console.warn('[NeuroSafetyEngine] Error loading safety rules, using embedded fallback:', e);
}

export class NeuroSafetyEngine {
  /**
   * Evaluate raw patient input or session answers for crisis triggers
   *
   * @param {string} text - User's free-text input (if any)
   * @param {object} answers - Map of current session answers
   * @returns {object} Safety evaluation outcome
   */
  static evaluate(text = "", answers = {}) {
    const rawText = String(text || "").toLowerCase().trim();

    // 1. Check structured question triggers
    for (const rule of SAFETY_CONFIG.rules) {
      if (Array.isArray(rule.structuredTriggers)) {
        for (const trigger of rule.structuredTriggers) {
          if (answers[trigger.questionId] === trigger.value) {
            return this.buildCrisisResponse(rule, "Structured clinical question response triggered crisis protocol.");
          }
        }
      }
    }

    // If no text provided, safe
    if (!rawText) {
      return { isTriggered: false, category: null };
    }

    // 2. Scan text against keywords and regex patterns (EN & HI)
    for (const rule of SAFETY_CONFIG.rules) {
      // English keywords check
      if (Array.isArray(rule.keywordsEn)) {
        for (const kw of rule.keywordsEn) {
          if (rawText.includes(kw.toLowerCase())) {
            return this.buildCrisisResponse(rule, `Matched safety keyword: "${kw}"`);
          }
        }
      }

      // Hindi keywords check
      if (Array.isArray(rule.keywordsHi)) {
        for (const kw of rule.keywordsHi) {
          if (rawText.includes(kw)) {
            return this.buildCrisisResponse(rule, `Matched Hindi crisis keyword: "${kw}"`);
          }
        }
      }

      // Regex pattern check
      if (Array.isArray(rule.regexPatterns)) {
        for (const pattern of rule.regexPatterns) {
          try {
            const re = new RegExp(pattern, 'i');
            if (re.test(rawText)) {
              return this.buildCrisisResponse(rule, `Matched clinical safety regex pattern: ${pattern}`);
            }
          } catch (reErr) {
            // invalid regex safeguard
          }
        }
      }
    }

    return { isTriggered: false, category: null };
  }

  static buildCrisisResponse(rule, reason = "") {
    const helplines = SAFETY_CONFIG.helplines;
    const isMinorRule = rule.id === "SAFETY_CHILD_ABUSE_NEGLECT";

    return {
      isTriggered: true,
      shouldHalt: true,
      urgencyTier: "EMERGENCY_PRIORITY_1",
      ruleId: rule.id,
      category: rule.category,
      severity: rule.severity,
      reason,
      emergencyBayAlert: rule.alertClinicalDesk || true,
      helplines: {
        primary: helplines.teleManas,
        emergency: helplines.nationalEmergency,
        childProtection: isMinorRule ? helplines.childline : null,
        hospitalEmergency: helplines.hospitalEmergencyBay
      },
      messageEn: "We want you to be safe. Because you mentioned feeling in crisis or unsafe, we have paused this questionnaire. You do not have to carry this alone. Please reach out to immediate support right now:",
      messageHi: "आपकी सुरक्षा हमारी सर्वोच्च प्राथमिकता है। चूंकि आपने संकट या असुरक्षा का उल्लेख किया है, हमने इस प्रश्नावली को रोक दिया है। आप अकेले नहीं हैं। कृपया अभी तत्काल सहायता प्राप्त करें:",
      triggeredAt: new Date().toISOString()
    };
  }

  static getHelplines() {
    return SAFETY_CONFIG.helplines;
  }
}

/**
 * MediKiosk Clinical Safety & Triage Rule Engine
 * Evaluates red-flag criteria on every intake answer.
 * Transparent rule execution with 4-tier urgency classification and CDSCO SaMD compliance.
 */

import { ORGAN_QUESTION_BANKS } from "../data/organQuestionBanks.js";

export const URGENCY_TIERS = {
  EMERGENCY_PRIORITY_1: {
    code: "EMERGENCY_PRIORITY_1",
    label: "Emergency Care Required (Priority 1)",
    label_hi: "आपातकालीन चिकित्सा आवश्यक (प्राथमिकता 1)",
    color: "#EF4444",
    badgeClass: "pill-3d-crimson",
    action: "Immediate Emergency Department evaluation. Call 112 / 108 or proceed to nearest hospital resuscitation bay immediately.",
    action_hi: "तत्काल आपातकालीन चिकित्सालय जाएं। 112 / 108 पर संपर्क करें अथवा नजदीकी अस्पताल की आपातकालीन इकाई में तुरंत पहुंचें।"
  },
  URGENT_PRIORITY_2: {
    code: "URGENT_PRIORITY_2",
    label: "See a Doctor Soon (Within 24-48 Hours)",
    label_hi: "शीघ्र डॉक्टर से परामर्श लें (24-48 घंटे के भीतर)",
    color: "#F59E0B",
    badgeClass: "pill-3d-amber",
    action: "Same-day or next-day medical evaluation recommended. Monitor vitals and seek immediate care if condition deteriorates.",
    action_hi: "उसी दिन या अगले दिन डॉक्टर से मिलें। लक्षणों पर नजर रखें और बिगड़ने पर तुरंत अस्पताल जाएं।"
  },
  ROUTINE_PRIORITY_3: {
    code: "ROUTINE_PRIORITY_3",
    label: "Routine OPD Consultation",
    label_hi: "नियमित ओपीडी परामर्श",
    color: "#0284C7",
    badgeClass: "pill-3d-blue",
    action: "Standard outpatient consultation with clinician. Bring previous prescriptions and diagnostic records.",
    action_hi: "सामान्य ओपीडी परामर्श लें। पिछली दवाइयां और जांच रिपोर्ट साथ लाएं।"
  },
  SELF_CARE_PRIORITY_4: {
    code: "SELF_CARE_PRIORITY_4",
    label: "Self-Care & Informational",
    label_hi: "घरेलू देखभाल व जानकारी",
    color: "#10B981",
    badgeClass: "pill-3d-emerald",
    action: "Supportive hydration, rest, and home monitoring. Follow up with physician if symptoms persist beyond 72 hours.",
    action_hi: "पर्याप्त पानी पिएं, आराम करें। यदि 3 दिन बाद भी समस्या बनी रहे तो डॉक्टर से परामर्श लें।"
  }
};

class TriageRuleEngine {
  constructor() {
    this.version = "2.1.0-SIH2026";
  }

  /**
   * Evaluates answers against organ-specific red flags and global severity rules.
   * Runs synchronously on every user answer selection.
   *
   * @param {string} organId - Selected organ identifier
   * @param {object} answers - Accumulated answers dictionary
   * @returns {object} Triage result with urgency, triggeredRules, and interruption flag
   */
  evaluate(organId, answers = {}, multiOrgans = []) {
    const triggeredRules = [];
    let highestUrgency = "SELF_CARE_PRIORITY_4";

    const allOrgans = Array.isArray(multiOrgans) && multiOrgans.length > 0 ? Array.from(new Set([organId, ...multiOrgans])) : [organId];

    // Cross-Region Synergy Rule: Chest (Heart) + Left Arm / Shoulder
    const hasHeart = allOrgans.includes("organ_heart");
    const hasLeftArm = allOrgans.some(o => ["joint_shoulder_l", "joint_elbow_l", "joint_wrist_l", "muscle_biceps_l"].includes(o));
    if (hasHeart && hasLeftArm) {
      triggeredRules.push({
        ruleId: "RED_CROSS_REGION_CARDIO_ARM",
        organId: "cross_region",
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Cross-region synergy detected: Concurrent Precordial / Cardiac and Left Upper Extremity involvement. Strong clinical marker for Acute Myocardial Infarction / ACS. Immediate emergency 12-lead ECG triage required.",
        isEmergency: true
      });
      highestUrgency = "EMERGENCY_PRIORITY_1";
    }

    // Evaluate organ-specific red flags for all selected organs
    for (const curOrgan of allOrgans) {
      const organBank = ORGAN_QUESTION_BANKS[curOrgan];
      if (organBank && organBank.redFlags) {
        for (const rule of organBank.redFlags) {
          try {
            if (typeof rule.criteria === "function" && rule.criteria(answers)) {
              triggeredRules.push({
                ruleId: rule.ruleId,
                organId: curOrgan,
                urgency: rule.urgency,
                reason: rule.reason,
                isEmergency: rule.urgency === "EMERGENCY_PRIORITY_1"
              });
              if (rule.urgency === "EMERGENCY_PRIORITY_1") {
                highestUrgency = "EMERGENCY_PRIORITY_1";
              }
            }
          } catch (err) {
            console.warn(`[TriageEngine] Error evaluating rule ${rule.ruleId}:`, err);
          }
        }
      }
    }

    // Global Severity Scoring
    const severity = parseInt(answers.severity || 0, 10);
    const durationTrend = answers.duration_trend || "";

    if (severity >= 8 && durationTrend === "rapidly_worsening") {
      triggeredRules.push({
        ruleId: "RULE_SEV_EXTREME_PROGRESSIVE",
        organId: "global",
        urgency: "URGENT_PRIORITY_2",
        reason: "Severe progressive distress (Pain scale >= 8/10 rapidly worsening). Urgent clinical review warranted."
      });
      if (highestUrgency !== "EMERGENCY_PRIORITY_1") {
        highestUrgency = "URGENT_PRIORITY_2";
      }
    } else if (severity >= 5) {
      if (highestUrgency === "SELF_CARE_PRIORITY_4") {
        highestUrgency = "ROUTINE_PRIORITY_3";
      }
    }

    const isEmergency = highestUrgency === "EMERGENCY_PRIORITY_1";

    return {
      isEmergency,
      shouldInterrupt: isEmergency,
      urgencyTier: highestUrgency,
      tierDetails: URGENCY_TIERS[highestUrgency],
      urgency: URGENCY_TIERS[highestUrgency],
      triggeredRules,
      evaluatedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      engineVersion: this.version,
      disclaimer: "Informational clinical intake assistance only. Not a definitive diagnosis. Must be reviewed by a Registered Medical Practitioner (RMP) under CDSCO SaMD regulations."
    };
  }
}

export const triageRuleEngine = new TriageRuleEngine();

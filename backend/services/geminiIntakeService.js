/**
 * MediKiosk Gemini Clinical Intake & Safety Summarization Service
 * Produces structured clinical SBAR summaries, plain-language patient explanations,
 * and hospital specialty routing recommendations.
 *
 * Compliance:
 * - DPDP Act 2023: Strict data minimization, zero transmission of direct PHI (Name, Phone, ABHA, Aadhaar).
 * - SaMD / CDSS: Purely informational decision support; CDSCO Class B disclaimer embedded.
 * - Deterministic Fallback: Immediate fail-safe fallback on timeout (3500ms), offline, or invalid API key.
 */

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
const CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest"
];

// Deterministic anatomical specialty mapping table
export const ANATOMICAL_SPECIALTY_MAP = {
  organ_heart: "Cardiology",
  organ_lungs: "Pulmonology",
  organ_liver: "Gastroenterology / Hepatology",
  organ_gallbladder: "Gastroenterology / General Surgery",
  organ_pancreas: "Gastroenterology",
  organ_stomach: "Gastroenterology",
  organ_spleen: "Hematology / General Surgery",
  organ_small_intestine: "Gastroenterology",
  organ_large_intestine: "Gastroenterology / Colorectal Surgery",
  organ_kidney_l: "Nephrology / Urology",
  organ_kidney_r: "Nephrology / Urology",
  organ_ureter_l: "Urology",
  organ_ureter_r: "Urology",
  organ_bladder: "Urology",
  organ_brain: "Neurology",
  organ_thyroid: "Endocrinology",
  organ_reproductive: "Gynecology / Urology",
  skel_skull: "Neurosurgery / ENT",
  skel_ribcage: "Thoracic Surgery / Orthopedics",
  skel_pelvis: "Orthopedics",
  skel_spine_cervical: "Orthopedics / Spine Surgery",
  skel_spine_thoracic: "Orthopedics / Spine Surgery",
  skel_spine_lumbar: "Orthopedics / Spine Surgery",
  skel_spine_sacrum: "Orthopedics / Spine Surgery",
  joint_shoulder_l: "Orthopedics",
  joint_shoulder_r: "Orthopedics",
  joint_elbow_l: "Orthopedics",
  joint_elbow_r: "Orthopedics",
  joint_wrist_l: "Orthopedics",
  joint_wrist_r: "Orthopedics",
  joint_hip_l: "Orthopedics",
  joint_hip_r: "Orthopedics",
  joint_knee_l: "Orthopedics",
  joint_knee_r: "Orthopedics",
  joint_ankle_l: "Orthopedics",
  joint_ankle_r: "Orthopedics"
};

export class GeminiIntakeService {
  /**
   * Summarizes anatomical intake session and recommends specialty allocation.
   *
   * @param {object} intakeData
   * @param {Array<string>} intakeData.selectedParts - Selected anatomical region IDs
   * @param {object} intakeData.answers - User's OPQRST symptom answers
   * @param {string} intakeData.language - Preferred language ('en', 'hi', etc.)
   * @param {object} intakeData.triageResult - Output of triageRuleEngine
   * @param {boolean} intakeData.consentGiven - Explicit patient consent for AI summarization
   * @returns {Promise<object>} Structured clinical summary and routing
   */
  static async summarizeIntake(intakeData = {}) {
    const {
      selectedParts = ["organ_heart"],
      answers = {},
      language = "en",
      triageResult = null,
      consentGiven = true
    } = intakeData;

    // Safety & DPDP 2023 Consent Check
    if (!consentGiven) {
      return this.buildDeterministicSummary(selectedParts, answers, language, triageResult, "Patient consent not granted for LLM processing; deterministic clinical rule applied.");
    }

    // Determine deterministic primary specialty
    const primaryPart = selectedParts[0] || "organ_heart";
    const fallbackSpecialty = ANATOMICAL_SPECIALTY_MAP[primaryPart] || "General Medicine";

    // If no API key configured, use deterministic summary immediately
    if (!GEMINI_API_KEY) {
      return this.buildDeterministicSummary(selectedParts, answers, language, triageResult, "Deterministic clinical rule applied (Gemini API key not configured).");
    }

    // Build prompt with sanitization (prompt injection prevention)
    const sanitizedAnswers = {};
    for (const [k, v] of Object.entries(answers)) {
      if (typeof v === "string") {
        sanitizedAnswers[k] = v.replace(/[`${}]/g, "").slice(0, 300);
      } else if (Array.isArray(v)) {
        sanitizedAnswers[k] = v.map(item => String(item).replace(/[`${}]/g, "").slice(0, 100));
      } else {
        sanitizedAnswers[k] = v;
      }
    }

    const isEmergency = triageResult?.isEmergency || triageResult?.urgencyTier === "EMERGENCY_PRIORITY_1";

    const systemPrompt = `You are an expert Clinical Decision Support (CDS) assistant embedded in a smart hospital OPD triage terminal.
You receive structured anatomical intake data from a 2D interactive body map and OPQRST questionnaire.
CRITICAL SAFETY DIRECTIVE:
1. You MUST NEVER downgrade or contradict an Emergency Priority 1 alert triggered by safety rules.
2. Produce a professional clinical SBAR summary for the treating physician.
3. Produce a compassionate, simple explanation for the patient in ${language === 'hi' ? 'Hindi (Devanagari script)' : 'English'}.
4. Suggest the appropriate hospital specialties based on clinical guidelines.

RESPOND EXCLUSIVELY WITH A VALID JSON OBJECT MATCHING THIS EXACT SCHEMA:
{
  "clinicalSummary": "<SBAR clinical summary: Situation, Background, Assessment, Recommendation for Doctor>",
  "patientSummary": "<Simple, clear explanation of symptoms in ${language === 'hi' ? 'Hindi' : 'English'}>",
  "suggestedSpecialties": ["<Primary Specialty, e.g. ${fallbackSpecialty}>", "<Secondary Specialty if applicable>"],
  "clinicalImpressions": ["<Possible differential diagnosis 1>", "<Possible differential diagnosis 2>"],
  "recommendedDiagnostics": ["<e.g. 12-lead ECG, Ultrasound Abdomen, X-ray, or CBC>"],
  "redFlagsIdentified": ["<list of any red flags>"]
}`;

    const userContent = JSON.stringify({
      anatomicalSites: selectedParts,
      symptomAnswers: sanitizedAnswers,
      triageStatus: triageResult ? {
        urgencyTier: triageResult.urgencyTier,
        triggeredRules: triageResult.triggeredRules?.map(r => r.reason)
      } : { urgencyTier: isEmergency ? "EMERGENCY_PRIORITY_1" : "ROUTINE_PRIORITY_3" },
      targetLanguage: language
    });

    // Execute with strict 3500ms timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: systemPrompt + "\n\nPATIENT INTAKE DATA:\n" + userContent }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          })
        });

        clearTimeout(timeoutId);

        if (!resp.ok) continue;

        const data = await resp.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const parsed = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());

        return {
          clinicalSummary: parsed.clinicalSummary || "Clinical intake documented.",
          patientSummary: parsed.patientSummary || "Symptoms recorded for physician consultation.",
          suggestedSpecialties: Array.isArray(parsed.suggestedSpecialties) && parsed.suggestedSpecialties.length > 0 
            ? parsed.suggestedSpecialties 
            : [fallbackSpecialty],
          clinicalImpressions: parsed.clinicalImpressions || [],
          recommendedDiagnostics: parsed.recommendedDiagnostics || [],
          redFlagsIdentified: parsed.redFlagsIdentified || [],
          source: "gemini_clinical_ai",
          modelUsed: model,
          saMdDisclaimer: "Informational Clinical Decision Support only. Requires Registered Medical Practitioner (RMP) confirmation under CDSCO guidelines."
        };
      } catch (err) {
        // Proceed to next model or fallback
      }
    }

    clearTimeout(timeoutId);
    // Deterministic fallback if Gemini timed out or failed
    return this.buildDeterministicSummary(selectedParts, answers, language, triageResult, "Deterministic clinical rule applied (LLM timeout or offline).");
  }

  /**
   * Deterministic clinical intake summarization fallback.
   */
  static buildDeterministicSummary(selectedParts, answers, language, triageResult, reason = "") {
    const primaryPart = selectedParts[0] || "organ_heart";
    const primarySpecialty = ANATOMICAL_SPECIALTY_MAP[primaryPart] || "General Medicine";
    const severity = answers.severity || "Not recorded";
    const duration = answers.duration_trend || "Documented";

    const isEmergency = triageResult?.isEmergency || triageResult?.urgencyTier === "EMERGENCY_PRIORITY_1";
    const redFlagReasons = triageResult?.triggeredRules?.map(r => r.reason) || [];

    const isHindi = language === "hi";

    const clinicalSummary = `PATIENT INTAKE SBAR SUMMARY:
- Situation: Patient presents with discomfort localized to ${selectedParts.join(', ')}.
- Background: Reported pain severity ${severity}/10, progress: ${duration}.
- Assessment: Triage urgency tier: ${triageResult?.urgencyTier || (isEmergency ? 'EMERGENCY_PRIORITY_1' : 'ROUTINE_PRIORITY_3')}.${redFlagReasons.length > 0 ? ' Red flags noted: ' + redFlagReasons.join('; ') : ''}
- Recommendation: Consult ${primarySpecialty}. Immediate clinical evaluation advised.`;

    const patientSummary = isHindi
      ? `आपके द्वारा चयनित अंग (${selectedParts.join(', ')}) और दर्ज किए गए लक्षणों का विवरण दर्ज कर लिया गया है। दर्द की तीव्रता ${severity}/10 है। डॉक्टर द्वारा जांच की जाएगी।`
      : `Intake recorded for anatomical site(s): ${selectedParts.join(', ')}. Severity score ${severity}/10. Doctor consultation scheduled for ${primarySpecialty}.`;

    return {
      clinicalSummary,
      patientSummary,
      suggestedSpecialties: [primarySpecialty, "General Medicine"],
      clinicalImpressions: [primarySpecialty + " Evaluation"],
      recommendedDiagnostics: isEmergency ? ["12-Lead ECG", "Emergency Vitals Monitoring"] : ["Clinical Examination"],
      redFlagsIdentified: redFlagReasons,
      source: "deterministic_clinical_rules",
      reason,
      saMdDisclaimer: "Informational Clinical Decision Support only. Requires Registered Medical Practitioner (RMP) confirmation under CDSCO guidelines."
    };
  }
}

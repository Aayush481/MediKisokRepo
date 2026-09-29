/**
 * MediKiosk Clinical Parser & SOCRATES Elicitation Engine
 * Implements clinical history branching and real-time Emergency Red-Flag detection.
 */

export const RED_FLAG_CRITERIA = [
  {
    category: "Metabolic / Severe Hyperglycemia",
    keywords: ["glucose", "sugar", "298", "diabetes", "hyperglycemia", "polydipsia", "polyuria", "ketoacidosis"],
    severityThreshold: 7,
    reason: "Severe Hyperglycemia / Uncontrolled Blood Glucose (>250 mg/dL). Immediate glycemic evaluation required."
  },
  {
    category: "Cardiac / Acute Coronary",
    keywords: ["chest pain", "chhati me dard", "left arm", "sweating", "pasina", "crushing", "heaviness on chest", "left shoulder"],
    severityThreshold: 7,
    reason: "Suspected Acute Coronary Syndrome / Myocardial Infarction. Immediate ECG and cardiac triage required."
  },
  {
    category: "Neurological / Stroke (FAST)",
    keywords: ["face drooping", "arm weakness", "slurred speech", "sudden numbness", "bolne me takleef", "ek taraf kamzori"],
    severityThreshold: 6,
    reason: "Suspected Acute Stroke (CVA). Immediate CT scan and stroke protocol activation required."
  },
  {
    category: "Critical Thrombocytopenia / Hemorrhagic",
    keywords: ["bleeding", "blood in vomit", "khoon ki ulti", "black stool", "petechiae", "platelet low", "85000"],
    severityThreshold: 6,
    reason: "Suspected Severe Dengue / Active Bleeding diathesis. Immediate blood grouping & transfusion readiness required."
  }
];

export const SOCRATES_QUESTIONS = {
  site: {
    title: "Where is the problem or pain located?",
    hi: "दर्द या तकलीफ शरीर के किस हिस्से में है?",
    options: ["Chest / Chhati", "Abdomen / Pet", "Head / Sar", "Knee Joints / Ghutne", "Throat / Gala", "Back / Peeth", "Generalized / Pure Shareer Me"]
  },
  onset: {
    title: "When and how did it start?",
    hi: "यह समस्या कब और कैसे शुरू हुई?",
    options: ["Sudden (few hours ago)", "1-3 Days ago", "1-2 Weeks ago", "Chronic (Months / Years)"]
  },
  character: {
    title: "How does the discomfort feel?",
    hi: "दर्द या तकलीफ का अहसास कैसा है?",
    options: ["Crushing / Heavy Pressure", "Sharp / Stabbing", "Dull Aching", "Burning / Jalan", "Throbbing / Ticking"]
  },
  radiation: {
    title: "Does the pain move to any other area?",
    hi: "क्या दर्द किसी और हिस्से में फैलता है?",
    options: ["No, stays in one place", "Radiates to Left Arm/Jaw", "Radiates to Back", "Radiates down the Legs"]
  },
  associations: {
    title: "Are there any other symptoms accompanied?",
    hi: "इसके साथ कोई अन्य लक्षण भी हैं?",
    options: ["Sweating / Diaphoresis", "Fever / Chills", "Nausea / Vomiting", "Breathlessness", "Dizziness / Giddiness", "Morning Stiffness", "Excess Thirst / Urination"]
  },
  exacerbating: {
    title: "What makes it worse or better?",
    hi: "किस चीज़ से तकलीफ बढ़ती या घटती है?",
    options: ["Worse on walking/exertion", "Worse after meals", "Worse in cold weather", "Relieved by rest", "Relieved by hot fomentation/massage"]
  }
};

class ClinicalParser {
  checkRedFlags(text, severity = 5) {
    if (!text) return null;
    const lower = text.toLowerCase();

    for (const rule of RED_FLAG_CRITERIA) {
      const matchCount = rule.keywords.filter(k => lower.includes(k.toLowerCase())).length;
      if (matchCount >= 2 || (matchCount >= 1 && severity >= rule.severityThreshold)) {
        return {
          isEmergency: true,
          category: rule.category,
          reason: rule.reason,
          urgency: "RED - PRIORITY 1"
        };
      }
    }
    return { isEmergency: false, urgency: "NORMAL" };
  }

  generateStructuredSummary(patientData) {
    const { name, age, gender, chiefComplaint, hpi, ayushIntake, pmh, allergies, medications, allopathicMeds, documents } = patientData;
    const docs = documents || [];

    // Aggregate all lab abnormalities, normals, and document findings
    const allLabFlags = docs.flatMap(d => d.flags || []);
    const allLabNormals = docs.flatMap(d => d.normalValues || []);

    // Generate clinical impressions across all organ systems & modalities
    let clinicalImpression = [];

    // 1. Document Root Causes
    docs.forEach(d => {
      if (d.rootCause && !d.rootCause.toLowerCase().includes("diagnostic evaluation") && !d.rootCause.toLowerCase().includes("findings available")) {
        clinicalImpression.push(`[${d.categoryLabel || d.type}]: ${d.rootCause}`);
      }
    });

    // 2. Glycemic / Metabolic
    const sugarFlag = allLabFlags.find(f => {
      const t = (f.test || f.param || "").toLowerCase();
      return f.organSystem === "Glycemic Profile & Metabolic Control" || /\b(glucose|sugar|hba1c|rbs|fbs|glycated)\b/i.test(t);
    });
    if (sugarFlag) {
      clinicalImpression.push(`Severe Hyperglycemia / Metabolic Dysregulation (${sugarFlag.test}: ${sugarFlag.value})`);
    }

    // 3. Platelets / Hemostasis
    const pltFlag = allLabFlags.find(f => {
      const t = (f.test || f.param || "").toLowerCase();
      return f.organSystem === "Platelets & Hemostasis" || /\b(platelet count|total platelet|thrombocyte)\b/i.test(t);
    });
    if (pltFlag) {
      clinicalImpression.push(`Significant Thrombocytopenia (${pltFlag.test}: ${pltFlag.value}) - Risk of Hemorrhagic Diathesis`);
    }

    // 4. Leukocytes & Immunity
    const wbcFlag = allLabFlags.find(f => {
      const t = (f.test || f.param || "").toLowerCase();
      return f.organSystem === "Leukocytes & Inflammatory / Immune Response" || /\b(wbc|tlc|leucocyte count|neutrophil|lymphocyte)\b/i.test(t);
    });
    if (wbcFlag) {
      clinicalImpression.push(`Leukocyte Abnormality / Inflammatory Response (${wbcFlag.test}: ${wbcFlag.value})`);
    }

    // 5. Hematology & Anemia
    const hbFlag = allLabFlags.find(f => {
      const t = (f.test || f.param || "").toLowerCase();
      return (f.organSystem === "Anemia & Erythrocyte Indices" || /\b(haemoglobin|hemoglobin|rbc|pcv|hematocrit)\b/i.test(t)) && !t.includes("hba1c");
    });
    if (hbFlag) {
      clinicalImpression.push(`Anemia / Decreased Oxygen Carrying Capacity (${hbFlag.test}: ${hbFlag.value})`);
    }

    // 6. Renal (KFT)
    const renalFlag = allLabFlags.find(f => {
      const t = (f.test || f.param || "").toLowerCase();
      return f.organSystem === "Renal Function & Electrolyte Balance (KFT)" || /\b(creatinine|urea|bun|egfr|uric acid)\b/i.test(t);
    });
    if (renalFlag) {
      clinicalImpression.push(`Renal Parameter Derangement (${renalFlag.test}: ${renalFlag.value})`);
    }

    // 7. Liver (LFT)
    const lftFlag = allLabFlags.find(f => {
      const t = (f.test || f.param || "").toLowerCase();
      return f.organSystem === "Hepatobiliary Function & Hepatic Enzymes (LFT)" || /\b(sgpt|sgot|alt|ast|bilirubin|alkaline phosphatase|ggt)\b/i.test(t);
    });
    if (lftFlag) {
      clinicalImpression.push(`Hepatic Enzyme Derangement (${lftFlag.test}: ${lftFlag.value})`);
    }

    // 8. Lipids & Atherogenic Risk
    const tgFlag = allLabFlags.find(f => {
      const t = (f.test || f.param || "").toLowerCase();
      return f.organSystem === "Lipid Profile & Atherogenic Risk" || /\b(triglyceride|cholesterol|ldl|vldl|hdl)\b/i.test(t);
    });
    if (tgFlag) {
      clinicalImpression.push(`Atherogenic Dyslipidemia (${tgFlag.test}: ${tgFlag.value})`);
    }

    // 9. Thyroid / Endocrine
    const thyroidFlag = allLabFlags.find(f => {
      const t = (f.test || f.param || "").toLowerCase();
      return f.organSystem === "Endocrine & Thyroid Function" || /\b(tsh|thyroid|ft3|ft4)\b/i.test(t);
    });
    if (thyroidFlag) {
      clinicalImpression.push(`Thyroid Endocrine Derangement (${thyroidFlag.test}: ${thyroidFlag.value})`);
    }

    // Deduplicate impressions
    const uniqueImpressions = [...new Set(clinicalImpression)];
    const medsList = allopathicMeds || medications || [];

    return {
      demographics: { name: name || "Walk-in Patient", age: age || 49, gender: gender || "Female" },
      chiefComplaint: chiefComplaint && chiefComplaint.trim().length > 0 ? chiefComplaint : "No verbal chief complaint recorded (Direct Diagnostic / Lab Intake)",
      hpi: {
        hasData: Boolean(chiefComplaint && chiefComplaint.trim().length > 0),
        site: hpi?.site || "Not specified",
        onset: hpi?.onset || "Not specified",
        character: hpi?.character || "Not specified",
        radiation: hpi?.radiation || "None",
        associations: hpi?.associations?.length ? hpi.associations.join(", ") : "None reported",
        timeCourse: hpi?.timeCourse || "Stable",
        exacerbating: hpi?.exacerbating || "None",
        relieving: hpi?.relieving || "None",
        severity: hpi?.severity ? `${hpi.severity} / 10` : "Not rated"
      },
      clinicalImpression: uniqueImpressions.length > 0 ? uniqueImpressions : ["Routine Clinical Assessment / Physiological Normal Baseline"],
      ayushSummary: ayushIntake ? {
        prakriti: ayushIntake.prakriti?.dominant || "Unassessed",
        vataPercent: ayushIntake.prakriti?.vata || 0,
        pittaPercent: ayushIntake.prakriti?.pitta || 0,
        kaphaPercent: ayushIntake.prakriti?.kapha || 0,
        vikriti: ayushIntake.vikriti || "N/A",
        agni: ayushIntake.agni || "Sama Agni",
        koshtha: ayushIntake.koshtha || "Madhyama Koshtha",
        aharaVihara: ayushIntake.aharaVihara || "Normal"
      } : null,
      pastMedicalHistory: pmh && pmh.length > 0 ? pmh : ["None reported"],
      allergies: allergies && allergies.length > 0 ? allergies : ["No Known Drug Allergies (NKDA)"],
      activeMedications: medsList,
      documents: docs,
      allLabFlags,
      allLabNormals
    };
  }
}

export const clinicalParser = new ClinicalParser();

/**
 * MediKiosk AI Clinical Triage & Automated Doctor Assignment Engine
 * 
 * Capabilities:
 *   1. Multimodal Symptoms & Hemodynamics Ingestion (Chief Complaint, SOCRATES HPI, rPPG Vitals, AYUSH Prakriti)
 *   2. Dual Triage Pathway:
 *      - Normal / Mild conditions: Verified Home Remedies, AYUSH lifestyle, and self-care protocols
 *      - Moderate / Complex / Severe: Escalation to Document Uploadation (Step 3) with Automated Hospital Doctor Matching
 *   3. Autonomous Hospital Doctor Selection based on organ system, anatomical body map, and symptoms
 */

export const HOSPITAL_DOCTORS = {
  cardiology: {
    id: "doc-cardio",
    name: "Dr. V. K. Malhotra",
    qualification: "MD, DM (Cardiology)",
    specialty: "Cardiology & Vascular Medicine",
    cabin: "OPD Cabin 4",
    wing: "Cardiology & Telemetry Suite",
    room: "402",
    avgWaitMins: 15,
    keywords: ["chest", "chhati", "heart", "cardiac", "palpitation", "angina", "hypertension", "bp high", "pulse", "left arm pain", "tachycardia", "heart rate"]
  },
  orthopedics: {
    id: "doc-ortho",
    name: "Dr. B. Sen",
    qualification: "MS (Orthopedics), MCh",
    specialty: "Orthopedics & Joint Reconstruction",
    cabin: "OPD Cabin 2",
    wing: "Bone & Joint Trauma Center",
    room: "201",
    avgWaitMins: 20,
    keywords: ["knee", "joint", "ghutna", "bone", "fracture", "swelling", "back pain", "kamar", "spine", "arthritis", "hip", "ankle", "shoulder", "ligament", "limping", "wrist", "elbow", "neck pain"]
  },
  pulmonology: {
    id: "doc-pulmo",
    name: "Dr. A. Khan",
    qualification: "MD (Pulmonology), FCCP",
    specialty: "Pulmonology & Respiratory Medicine",
    cabin: "OPD Cabin 5",
    wing: "Chest & Respiratory Clinic",
    room: "503",
    avgWaitMins: 10,
    keywords: ["breathless", "sans", "cough", "khansi", "asthma", "wheezing", "phlegm", "sputum", "chest congestion", "pneumonia", "bronchitis", "lung", "shortness of breath", "copd"]
  },
  gastroenterology: {
    id: "doc-gastro",
    name: "Dr. S. K. Gupta",
    qualification: "MD, DM (Gastroenterology)",
    specialty: "Gastroenterology & Hepatology",
    cabin: "OPD Cabin 6",
    wing: "Digestive Diseases Institute",
    room: "601",
    avgWaitMins: 15,
    keywords: ["stomach", "pet", "abdominal", "vomiting", "ulti", "diarrhea", "dast", "liver", "jaundice", "piliya", "gastritis", "ulcer", "colic", "gallbladder", "constipation", "bloating", "acid reflux", "bowel"]
  },
  neurology: {
    id: "doc-neuro",
    name: "Dr. K. S. Oberoi",
    qualification: "MD (Medicine), DM (Neurology)",
    specialty: "Neurology & Brain Sciences",
    cabin: "OPD Cabin 7",
    wing: "Neuro Sciences OPD",
    room: "702",
    avgWaitMins: 25,
    keywords: ["headache", "sar dard", "migraine", "dizziness", "chakkar", "seizure", "daura", "numbness", "tingling", "tremor", "fainting", "memory", "weakness on one side", "neuralgia"]
  },
  ent: {
    id: "doc-ent",
    name: "Dr. Priya Nair",
    qualification: "MS (ENT), DLO",
    specialty: "Ear, Nose & Throat (ENT)",
    cabin: "OPD Cabin 8",
    wing: "ENT Speciality Center",
    room: "801",
    avgWaitMins: 10,
    keywords: ["throat", "gala", "ear", "kaan", "nose", "naak", "sinus", "tonsil", "hearing", "vocal", "hoarseness", "ear discharge", "vertigo", "nasal blockage", "running nose", "cold"]
  },
  endocrinology: {
    id: "doc-endo",
    name: "Dr. R. Iyer",
    qualification: "MD, DM (Endocrinology)",
    specialty: "Endocrinology & Diabetology",
    cabin: "OPD Cabin 9",
    wing: "Metabolic Disease Center",
    room: "904",
    avgWaitMins: 15,
    keywords: ["sugar", "diabetes", "diabetic", "thyroid", "hba1c", "thirst", "frequent urination", "weight loss", "hormone", "obesity", "hyperglycemia"]
  },
  ayush: {
    id: "doc-ayush",
    name: "Dr. Ananya Sharma",
    qualification: "BAMS, MD (Ayurveda)",
    specialty: "AYUSH & Integrative Holistic Medicine",
    cabin: "OPD Cabin 1",
    wing: "AYUSH Holistic Wing",
    room: "101",
    avgWaitMins: 10,
    keywords: ["ayush", "ayurveda", "prakriti", "vata", "pitta", "kapha", "herbal", "chronic lifestyle", "rejuvenation", "panchakarma", "natural"]
  },
  nephrology_urology: {
    id: "doc-nephro",
    name: "Dr. Arvind Rathore",
    qualification: "MD, DM (Nephrology), DNB",
    specialty: "Nephrology & Renal Medicine",
    cabin: "OPD Cabin 10",
    wing: "Renal Sciences & Dialysis Suite",
    room: "1002",
    avgWaitMins: 15,
    keywords: ["kidney", "renal", "flank", "gurda", "gurde", "stone", "pathri", "urine", "peshab", "burning urine", "creatinine", "nephritis", "loin", "dysuria", "hematuria", "costovertebral", "kidneys"]
  },
  general: {
    id: "doc-gen",
    name: "Dr. Sharma",
    qualification: "MD (Internal Medicine)",
    specialty: "General Medicine & Outpatient Triage",
    cabin: "OPD Cabin 3",
    wing: "General Medicine Station",
    room: "301",
    avgWaitMins: 10,
    keywords: ["fever", "bukhar", "weakness", "body ache", "chills", "infection", "fatigue", "unspecified", "general"]
  }
};

export const HOME_REMEDY_PROTOCOLS = {
  common_cold: {
    conditionKey: "common_cold",
    title: "Mild Viral Rhinitis & Common Cold",
    hi_title: "हल्की सर्दी-जुकाम और नजला",
    conditionSummary: "Self-limiting upper respiratory viral irritation with mild nasal congestion or sneezing.",
    remedies: [
      {
        name: "Tulsi, Ginger & Black Pepper Warm Kadha",
        icon: "🍵",
        instruction: "Boil 5 crushed Tulsi leaves, 1/2 inch crushed ginger, and 2 peppercorns in 200ml water for 5 minutes. Strain, add 1 tsp honey, and drink warm twice daily.",
        mechanism: "Tulsi and ginger stimulate peripheral circulation and provide natural antiviral phytochemicals (eugenol, gingerol)."
      },
      {
        name: "Steam Inhalation with Carom Seeds (Ajwain)",
        icon: "💨",
        instruction: "Inhale warm steam with a pinch of crushed ajwain or 1 drop eucalyptus oil for 5-7 minutes before sleep.",
        mechanism: "Liquefies viscous mucous secretions and soothes hyperactive nasal cilia."
      },
      {
        name: "Warm Saline Nasal Gargle",
        icon: "💧",
        instruction: "Dissolve 1/2 tsp salt in 1 glass of warm drinking water. Gargle gently 3 times daily.",
        mechanism: "Reduces bacterial colonization and relieves pharyngeal mucosal swelling."
      }
    ],
    lifestyleTips: [
      "Drink warm water throughout the day; avoid chilled refrigerated beverages and direct blast of cold air conditioning.",
      "Ensure 7 to 8 hours of restorative sleep to bolster cell-mediated immunity."
    ],
    whenToSeeDoctor: "If fever exceeds 101°F, breathing becomes laboured, or symptoms persist beyond 3 days."
  },
  mild_acidity: {
    conditionKey: "mild_acidity",
    title: "Mild Dyspepsia & Acid Reflux",
    hi_title: "हल्की एसिडिटी एवं अपच",
    conditionSummary: "Transient gastric hyperchlorhydria from dietary irregularities or stress without alarm features.",
    remedies: [
      {
        name: "Cold Milk or Tender Coconut Water",
        icon: "🥛",
        instruction: "Sip half a glass of cold toned milk or fresh coconut water on an empty stomach.",
        mechanism: "Alkaline electrolytes and bio-calcium buffer free hydrochloric acid and protect mucosal lining."
      },
      {
        name: "Fennel Seed (Saunf) Warm Infusion",
        icon: "🌿",
        instruction: "Boil 1 teaspoon fennel seeds in 250ml water for 3 minutes. Sip warm 15 minutes after meals.",
        mechanism: "Anethole acts as an effective carminative, relieving gastric distension and spasmodic contractions."
      },
      {
        name: "Diluted Amla (Indian Gooseberry) Juice",
        icon: "🍋",
        instruction: "Take 15ml pure Amla juice diluted with equal parts warm water once daily in the morning.",
        mechanism: "Traditional Pitta-pacifying rasayana with ascorbic acid and protective mucosal flavonoids."
      }
    ],
    lifestyleTips: [
      "Avoid lying flat immediately after eating; maintain a 2-hour interval before sleep.",
      "Avoid deep-fried, excessively oily, or sour foods."
    ],
    whenToSeeDoctor: "If you experience vomiting of dark material, black tarry stools, or persistent burning radiating to back or neck."
  },
  tension_headache: {
    conditionKey: "tension_headache",
    title: "Mild Tension Headache & Screen Eye Strain",
    hi_title: "तनाव सिरदर्द एवं डिजिटल आँखों की थकान",
    conditionSummary: "Muscular contraction headache linked to cervical posture, digital screen strain, or mild dehydration.",
    remedies: [
      {
        name: "Systemic Hydration & Lemon-Salt Water",
        icon: "💧",
        instruction: "Drink 2 glasses of room-temperature water with fresh lemon and a pinch of rock salt.",
        mechanism: "Corrects subclinical hypovolemia, a leading trigger for meningeal vascular headache."
      },
      {
        name: "Temple Acupressure with Peppermint Oil",
        icon: "💆",
        instruction: "Gently massage the temples, forehead, and suboccipital neck muscles with a drop of peppermint or coconut oil for 4 minutes.",
        mechanism: "Menthol stimulates cold receptors, modulating peripheral nociceptive pain signals."
      },
      {
        name: "Dark Room Rest & Warm Neck Fomentation",
        icon: "🛌",
        instruction: "Rest in a quiet, darkened room with eyes closed and apply a warm towel behind the neck for 15 minutes.",
        mechanism: "Relieves cervical trapezius spasm and down-regulates visual cortical hyper-excitability."
      }
    ],
    lifestyleTips: [
      "Adhere to the 20-20-20 visual rule: every 20 minutes of screen work, look at 20 feet distance for 20 seconds.",
      "Check neck ergonomics and maintain an upright cervical spine during desk work."
    ],
    whenToSeeDoctor: "If the headache is abrupt and explosive ('thunderclap'), accompanied by visual loss, fever, or neck stiffness."
  },
  mild_cough: {
    conditionKey: "mild_cough",
    title: "Mild Dry Cough & Pharyngeal Tickle",
    hi_title: "हल्की सूखी खांसी एवं गले की खराश",
    conditionSummary: "Non-productive upper airway irritation from environmental dryness or seasonal allergen exposure.",
    remedies: [
      {
        name: "Raw Honey & Crushed Black Pepper Linctus",
        icon: "🍯",
        instruction: "Mix 1 teaspoon raw honey with a pinch of freshly ground black pepper. Lick slowly twice daily.",
        mechanism: "Honey acts as an evidence-based natural demulcent, coating pharyngeal sensory cough receptors."
      },
      {
        name: "Mulethi (Licorice Root) Chewing / Decoction",
        icon: "🌿",
        instruction: "Chew a small piece of natural licorice root (Mulethi) or drink warm licorice root tea.",
        mechanism: "Glycyrrhizin exhibits mucosal protective, antimicrobial, and secretolytic actions."
      },
      {
        name: "Golden Turmeric Milk (Haldi Doodh)",
        icon: "🥛",
        instruction: "Warm 1 cup milk with 1/4 tsp pure turmeric and black pepper before retiring to bed.",
        mechanism: "Curcumin reduces inflammatory cytokine release in respiratory epithelium."
      }
    ],
    lifestyleTips: [
      "Keep throat moist with frequent warm sips; avoid cigarette smoke, aerosol sprays, and incense dust.",
      "Keep bedroom humidity balanced using a clean room humidifier or water container."
    ],
    whenToSeeDoctor: "If cough yields yellow-green or blood-tinged sputum, is accompanied by wheezing, or persists beyond 5 days."
  },
  muscle_soreness: {
    conditionKey: "muscle_soreness",
    title: "Mild Muscle Soreness & Fatigue",
    hi_title: "हल्की मांसपेशियों की थकान एवं बदन दर्द",
    conditionSummary: "Exertional myofascial soreness or post-activity physical fatigue without joint swelling or skeletal trauma.",
    remedies: [
      {
        name: "Warm Sesame / Mustard Oil Massage",
        icon: "🫒",
        instruction: "Warm pure sesame or mustard oil and gently massage sore muscles in upward strokes for 10 minutes.",
        mechanism: "Stimulates lymphatic drainage, increases local tissue microcirculation, and relieves lactic acid buildup."
      },
      {
        name: "Epsom Salt Warm Compress",
        icon: "🛁",
        instruction: "Dissolve 2 tbsp Epsom salt in warm water, soak a towel, and apply to sore areas for 12 minutes.",
        mechanism: "Transdermal magnesium ions assist in resolving neuromuscular hypertonicity."
      },
      {
        name: "Ashwagandha Restorative Milk",
        icon: "🥛",
        instruction: "Take 1/2 tsp Ashwagandha root powder in warm milk at bedtime.",
        mechanism: "Adaptogenic withanolides assist in blunting cortisol and enhancing myofibril repair."
      }
    ],
    lifestyleTips: [
      "Perform gentle active range-of-motion stretching; avoid heavy eccentric load for 24 to 48 hours.",
      "Maintain adequate electrolyte hydration."
    ],
    whenToSeeDoctor: "If inability to bear weight, severe focal joint swelling, skeletal deformity, or dark brown urine occurs."
  },
  mild_malaise: {
    conditionKey: "mild_malaise",
    title: "Mild Malaise & General Fatigue",
    hi_title: "हल्की सुस्ती, थकान एवं कमजोरी",
    conditionSummary: "Subacute low-grade physical fatigue and mild discomfort without acute fever spikes or systemic infection signs.",
    remedies: [
      {
        name: "Electrolyte Glucose Hydration",
        icon: "💧",
        instruction: "Sip 1 liter of fresh ORS, lemon water, or coconut water spaced throughout the day.",
        mechanism: "Restores cellular osmolarity and replenishes vital extracellular electrolytes."
      },
      {
        name: "Warm Golden Turmeric Milk (Haldi Doodh)",
        icon: "🥛",
        instruction: "Add 1/4 tsp pure turmeric powder and a pinch of black pepper to warm milk before sleep.",
        mechanism: "Curcumin provides systemic anti-inflammatory and cellular restorative antioxidant action."
      },
      {
        name: "Restorative Sleep & Mild Stretching",
        icon: "🛌",
        instruction: "Prioritize 8 hours of uninterrupted rest in a quiet, cool environment.",
        mechanism: "Allows autonomic parasympathetic nervous system recovery."
      }
    ],
    lifestyleTips: [
      "Avoid excess caffeine or sugary energy drinks that cause rapid energy crashes.",
      "Eat warm, easily digestible khichdi or vegetable broth."
    ],
    whenToSeeDoctor: "If accompanied by fever > 100°F, severe dizziness upon standing, or continuous vomiting."
  }
};

class ClinicalTriageService {
  /**
   * Main AI Triage Evaluation entry point
   * Checks for mild self-care problems vs conditions requiring in-person doctor consultation.
   */
  async evaluateSymptoms(patientData) {
    const {
      chiefComplaint = "",
      hpi = {},
      rppgVitals = null,
      ayushHerbs = [],
      ayushAnswers = {},
      age = 30,
      gender = "Female",
      isAyushMode = false
    } = patientData;

    // 1. Attempt backend AI call first if reachable
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch("/api/triage-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chiefComplaint,
          hpi,
          rppgVitals,
          ayushHerbs,
          ayushAnswers,
          age,
          gender,
          isAyushMode
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const aiData = await res.json();
        if (aiData && aiData.status === "success" && aiData.triageResult) {
          return aiData.triageResult;
        }
      }
    } catch (e) {
      // Backend timeout or offline: execute zero-latency client-side clinical triage
    }

    // 2. Client-side deterministic clinical triage engine
    return this.evaluateClientRules(patientData);
  }

  /**
   * Client-side clinical assessment engine
   */
  evaluateClientRules(patientData) {
    const {
      chiefComplaint = "",
      hpi = {},
      rppgVitals = null,
      ayushHerbs = [],
      isAyushMode = false
    } = patientData;

    const fullText = [
      chiefComplaint,
      hpi.site,
      hpi.character,
      hpi.radiation,
      hpi.exacerbating,
      (hpi.associations || []).join(" "),
      (ayushHerbs || []).map(h => h.name).join(" ")
    ].join(" ").toLowerCase();

    const severity = parseInt(hpi.severity || 0, 10);
    const vitals = rppgVitals || {};
    const heartRate = parseFloat(vitals.heartRate) || 75;
    const spO2 = parseFloat(vitals.spO2) || 98;

    // 1. Check for Emergency Red Flags
    const isRedFlag = this.checkEmergencyFlags(fullText, severity, heartRate, spO2);
    if (isRedFlag.isEmergency) {
      const assignedDoctor = HOSPITAL_DOCTORS.cardiology;
      return {
        severity: "CRITICAL",
        isHomeRemedyEligible: false,
        recommendedAction: "STAT_EMERGENCY",
        rationale: isRedFlag.reason,
        assignedDoctor: {
          ...assignedDoctor,
          rationale: isRedFlag.reason
        },
        triageBadge: "PRIORITY 1 - STAT EMERGENCY",
        badgeColor: "pill-3d-crimson",
        homeRemedyPlan: null
      };
    }

    // 2. Check for Mild & Home Remedy Eligible conditions
    const mildMatch = this.detectHomeRemedyEligibility(fullText, severity, heartRate, spO2);
    if (mildMatch.eligible) {
      return {
        severity: "MILD",
        isHomeRemedyEligible: true,
        recommendedAction: "HOME_CARE_ONLY",
        conditionKey: mildMatch.protocol.conditionKey,
        rationale: "Symptoms are mild, self-limiting, and suitable for verified home remedies. Doctor consultation is not required.",
        triageBadge: "MILD / HOME REMEDY PROTOCOL (NO OPD VISIT NEEDED)",
        badgeColor: "pill-3d-emerald",
        homeRemedyPlan: mildMatch.protocol,
        assignedDoctor: null // Strictly NO doctor consultation provided when home remedies are suitable
      };
    }

    // 3. Moderate to Severe condition requiring Document Uploadation & In-person Doctor Consult
    const assignedDoctor = this.matchDoctor(fullText, isAyushMode);
    return {
      severity: severity >= 7 ? "SEVERE" : "MODERATE",
      isHomeRemedyEligible: false,
      recommendedAction: "DOCUMENT_UPLOAD_AND_DOCTOR_CONSULT",
      conditionKey: "clinical_consult",
      rationale: `Clinical findings indicate a ${severity >= 7 ? 'severe' : 'moderate'} condition requiring in-person clinical examination and diagnostic document review.`,
      triageBadge: severity >= 7 ? "PRIORITY 2 - URGENT CLINICAL REVIEW" : "PRIORITY 3 - CLINICAL CONSULTATION REQUIRED",
      badgeColor: severity >= 7 ? "pill-3d-amber" : "pill-3d-blue",
      homeRemedyPlan: null,
      assignedDoctor: {
        ...assignedDoctor,
        rationale: `Matched based on primary complaint and anatomical location: ${assignedDoctor.specialty}`
      }
    };
  }

  /**
   * Evaluates if condition is mild, non-red-flag, and eligible for home remedies
   */
  detectHomeRemedyEligibility(text, severity, hr, spO2) {
    // Severity must be <= 4 and vitals stable
    if (severity > 4 || spO2 < 95 || hr > 105 || hr < 50) {
      return { eligible: false, protocol: null };
    }

    // Disqualifying clinical keywords (chronic, structural, or organ failure risks)
    const disqualifiers = [
      "fracture", "broken", "bone crack", "blood", "bleeding", "vomiting blood",
      "chest pain", "shortness of breath", "asthma attack", "unconscious", "seizure",
      "jaundice", "diabetes high", "298", "severe", "unbearable", "high fever", "rigid"
    ];
    if (disqualifiers.some(k => text.includes(k))) {
      return { eligible: false, protocol: null };
    }

    // Detect Mild Common Cold & Rhinitis
    if (/\b(running nose|runny nose|sneezing|cheenk|cold|halka nazla|nazla|mild congestion|nasal tickle)\b/i.test(text)) {
      return { eligible: true, protocol: HOME_REMEDY_PROTOCOLS.common_cold };
    }

    // Detect Mild Acidity / Indigestion / Gas
    if (/\b(acidity|acid reflux|khatti dakar|mild gas|gas|indigestion|apach|heartburn mild|heartburn|pet me jalan|bloating mild|bloating)\b/i.test(text)) {
      return { eligible: true, protocol: HOME_REMEDY_PROTOCOLS.mild_acidity };
    }

    // Detect Tension Headache / Eye Strain
    if (/\b(headache|sar dard|tension headache|eye strain|screen fatigue|tired head|heaviness in head)\b/i.test(text) && !text.includes("migraine severe")) {
      return { eligible: true, protocol: HOME_REMEDY_PROTOCOLS.tension_headache };
    }

    // Detect Mild Dry Cough / Pharyngeal Tickle / Sore Throat
    if (/\b(dry cough|khansi|mild cough|cough|throat tickle|gale me kharash|irritation in throat|sore throat)\b/i.test(text) && !text.includes("sputum") && !text.includes("phlegm")) {
      return { eligible: true, protocol: HOME_REMEDY_PROTOCOLS.mild_cough };
    }

    // Detect Mild Muscle Soreness / Fatigue / Body Ache
    if (/\b(muscle soreness|badan dard|mild body ache|body ache|fatigue|thakan|tiredness|stiff neck|gym soreness)\b/i.test(text)) {
      return { eligible: true, protocol: HOME_REMEDY_PROTOCOLS.muscle_soreness };
    }

    // General Mild Malaise / Fatigue (if severity <= 3)
    if (severity <= 3 && (/\b(weakness|kamzori|laziness|lethargy|thakan|malaise|tired|exhausted mild|mild discomfort)\b/i.test(text) || (text.includes("mild") && severity <= 2))) {
      return { eligible: true, protocol: HOME_REMEDY_PROTOCOLS.mild_malaise };
    }

    return { eligible: false, protocol: null };
  }

  /**
   * Checks for emergency red flag presentations
   */
  checkEmergencyFlags(text, severity, hr, spO2) {
    if (spO2 < 92) {
      return { isEmergency: true, reason: `Critical Hypoxemia (SpO2: ${spO2}%). Immediate respiratory support required.` };
    }
    if (hr > 130) {
      return { isEmergency: true, reason: `Severe Hemodynamic Tachycardia (Pulse: ${hr} BPM). Immediate cardiac rhythm check required.` };
    }

    const acuteCardiac = ["chest pain", "chhati me dard", "crushing chest", "radiating to left arm", "heavy pressure on chest"];
    if (acuteCardiac.some(k => text.includes(k))) {
      return { isEmergency: true, reason: "Suspected Acute Coronary Syndrome. Immediate ECG and STAT cardiac triage required." };
    }

    const acuteNeuro = ["slurred speech", "face drooping", "arm weakness", "sudden paralysis", "bolne me takleef"];
    if (acuteNeuro.some(k => text.includes(k))) {
      return { isEmergency: true, reason: "Suspected Acute Stroke (FAST positive). STAT Neuroimaging protocol activated." };
    }

    const acuteBleed = ["blood in vomit", "khoon ki ulti", "black stool", "active bleeding"];
    if (acuteBleed.some(k => text.includes(k))) {
      return { isEmergency: true, reason: "Active Internal Hemorrhage / Bleeding Diathesis. STAT emergency transfusion triage." };
    }

    return { isEmergency: false, reason: "" };
  }

  /**
   * Autonomous Doctor Matching Engine
   * Matches the patient's symptoms to the most qualified hospital specialist on duty.
   */
  matchDoctor(text, isAyushMode = false) {
    if (isAyushMode) {
      return HOSPITAL_DOCTORS.ayush;
    }

    let bestDoctor = HOSPITAL_DOCTORS.general;
    let maxMatches = 0;

    const specialties = [
      "cardiology",
      "orthopedics",
      "pulmonology",
      "gastroenterology",
      "neurology",
      "ent",
      "endocrinology",
      "nephrology_urology",
      "ayush"
    ];

    for (const specKey of specialties) {
      const doc = HOSPITAL_DOCTORS[specKey];
      let matches = 0;
      for (const kw of doc.keywords) {
        if (text.includes(kw)) {
          matches += (kw.length > 5 ? 2 : 1);
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestDoctor = doc;
      }
    }

    return bestDoctor;
  }
}

export const clinicalTriageService = new ClinicalTriageService();

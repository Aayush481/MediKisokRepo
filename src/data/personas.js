/**
 * MediKiosk 2.0 Sample Personas for Smart India Hackathon (SIH) Live Demo
 * Includes rPPG Contactless Vitals, Allopathy + AYUSH Herb-Drug Interactions (HDI), and Multi-Document OCR
 */

export const SAMPLE_PERSONAS = [
  {
    id: "persona-shashi",
    name: "Mrs. Shashi",
    age: 49,
    gender: "Female",
    abhaId: "91-1108-2508-171A",
    mobile: "+91 80571 88237",
    language: "hi",
    languageName: "Hindi",
    mode: "allopathic",
    chiefComplaint: "Excessive thirst, severe fatigue, frequent urination, and dizziness for 3 weeks.",
    isEmergency: true,
    tokenNumber: "EM-01",
    triageCategory: "LEVEL 2 - URGENT GLYCEMIC & METABOLIC TRIAGE",
    rppgVitals: {
      heartRate: 88,
      hrv: 32,
      spO2: 97,
      respiratoryRate: 19,
      stressScore: 65,
      objectivePainIndex: 68,
      signalQuality: "Optimal (99%)",
      statusText: "Metabolic Stress Detected"
    },
    hpi: {
      site: "Generalized / Metabolic",
      onset: "Subacute onset (3 weeks)",
      character: "Severe fatigue, polydipsia (excess thirst), polyuria",
      radiation: "None",
      associations: ["Dizziness on standing", "Mild bilateral knee aching", "Blurred vision"],
      timeCourse: "Progressively worsening",
      exacerbating: "High carbohydrate meals, physical exertion",
      relieving: "Rest, frequent water intake",
      severity: 7
    },
    pmh: ["Uncontrolled Type 2 Diabetes Mellitus", "Severe Hypertriglyceridemia", "Mild Microcytic Anemia"],
    allergies: ["No Known Drug Allergies (NKDA)"],
    allopathicMeds: [
      { name: "Tab. Aspirin", dosage: "75 mg", freq: "OD (Morning)", duration: "Ongoing" },
      { name: "Tab. Metformin", dosage: "500 mg", freq: "BD", duration: "Advised" },
      { name: "Tab. Atorvastatin", dosage: "10 mg", freq: "HS", duration: "Advised" }
    ],
    ayushHerbs: [
      { name: "Guggulu (Yograj Guggulu)", botanical: "Commiphora mukul", dosage: "2 Tablets BD for joint stiffness", source: "Self-Medicated Ayurvedic Store" },
      { name: "Karela Juice (Bitter Gourd)", botanical: "Momordica charantia", dosage: "50ml Daily (Morning Fasting)", source: "Home Herbal Remedy" }
    ],
    documents: [
      {
        id: "doc-shashi-pathkind",
        title: "Pathkind Diagnostics (Marwah Hospital) - 17/08/2025",
        type: "lab_report",
        date: "2025-08-17",
        extractedText: "Glucose Random: 298.00 mg/dL (CRITICAL HIGH)\nTriglycerides: 327.10 mg/dL (HIGH)\nTotal Cholesterol: 231.00 mg/dL (HIGH)\nHb: 10.80 gm/dL (LOW - Mild Anemia)\nSodium: 130.70 mmol/L (LOW - Hyponatremia)\nCreatinine: 0.58 mg/dL (NORMAL - eGFR 117.44)",
        flags: [
          { test: "Random Blood Glucose", value: "298.00 mg/dL", ref: "70.00 - 140.00 mg/dL", status: "CRITICAL HIGH (Severe Hyperglycemia)", alertLevel: "danger" },
          { test: "Serum Triglycerides", value: "327.10 mg/dL", ref: "< 150.00 mg/dL", status: "HIGH (Hypertriglyceridemia)", alertLevel: "danger" },
          { test: "Total Cholesterol", value: "231.00 mg/dL", ref: "< 200.00 mg/dL", status: "HIGH (Hypercholesterolemia)", alertLevel: "warning" },
          { test: "Haemoglobin (Hb)", value: "10.80 gm/dL", ref: "12.00 - 15.00 gm/dL", status: "LOW (Mild Microcytic Anemia)", alertLevel: "warning" },
          { test: "Serum Sodium", value: "130.70 mmol/L", ref: "136.00 - 145.00 mmol/L", status: "LOW (Pseudohyponatremia)", alertLevel: "warning" }
        ]
      }
    ]
  },
  {
    id: "persona-1",
    name: "Rajesh Kumar",
    age: 54,
    gender: "Male",
    abhaId: "91-4523-8890-1234",
    mobile: "+91 98765 43210",
    language: "hi",
    languageName: "Hindi",
    mode: "allopathic",
    chiefComplaint: "Crushing chest discomfort radiating to left shoulder with shortness of breath and diaphoresis for 2 hours.",
    isEmergency: true,
    tokenNumber: "EM-02 (Fast-Track STEMI)",
    triageCategory: "LEVEL 1 - IMMEDIATE RESUSCITATION & ECG",
    rppgVitals: {
      heartRate: 114,
      hrv: 18,
      spO2: 93,
      respiratoryRate: 26,
      stressScore: 88,
      objectivePainIndex: 82,
      signalQuality: "High (96%)",
      statusText: "Critical Tachycardia & Hypoxia"
    },
    hpi: {
      site: "Substernal Chest & Left Shoulder",
      onset: "Sudden onset (2 hours ago)",
      character: "Crushing, heavy pressure (like a weight on chest)",
      radiation: "Radiates down the left inner arm to little finger",
      associations: ["Profuse sweating (Diaphoresis)", "Mild nausea", "Shortness of breath"],
      timeCourse: "Continuous, progressively worsening",
      exacerbating: "Walking or minimal exertion",
      relieving: "Rest (partial only)",
      severity: 8
    },
    pmh: ["Type 2 Diabetes Mellitus (10 yrs)", "Essential Hypertension (6 yrs)"],
    allergies: ["Penicillin (Skin Rash)"],
    allopathicMeds: [
      { name: "Tab. Metformin", dosage: "500 mg", freq: "BD", duration: "Ongoing" },
      { name: "Tab. Telmisartan", dosage: "40 mg", freq: "OD", duration: "Ongoing" }
    ],
    ayushHerbs: [
      { name: "Ashwagandha Powder", botanical: "Withania somnifera", dosage: "1 Teaspoon with milk at night", source: "Self-Prescribed for Stress" }
    ],
    documents: [
      {
        id: "doc-1",
        title: "Previous Prescription - Max Heart Centre (02/08/2026)",
        type: "prescription",
        date: "2026-08-02",
        extractedText: "Rx: Tab Metformin 500mg BD, Tab Telmisartan 40mg OD. Advised HbA1c & 12-Lead ECG.",
        flags: [
          { test: "Cardiovascular Red-Flag", value: "High Acute Coronary Suspicion", ref: "Normal Vitals", status: "STAT ECG REQUIRED", alertLevel: "danger" }
        ]
      }
    ]
  },
  {
    id: "persona-2",
    name: "Sunita Devi",
    age: 48,
    gender: "Female",
    abhaId: "91-8890-3341-9988",
    mobile: "+91 94567 89012",
    language: "en",
    languageName: "English",
    mode: "ayush",
    chiefComplaint: "Bilateral knee joint pain with morning stiffness for 45 mins, sluggish digestion, and chronic constipation.",
    isEmergency: false,
    tokenNumber: "A-42 (Routine)",
    triageCategory: "LEVEL 4 - ROUTINE INTEGRATIVE OUTPATIENT",
    rppgVitals: {
      heartRate: 72,
      hrv: 48,
      spO2: 98,
      respiratoryRate: 15,
      stressScore: 35,
      objectivePainIndex: 52,
      signalQuality: "Optimal (98%)",
      statusText: "Hemodynamically Stable"
    },
    hpi: {
      site: "Bilateral Knee Joints & Lower Back",
      onset: "Insidious onset (6 months duration)",
      character: "Dull aching with crepitus (cracking sounds) and swelling",
      radiation: "None",
      associations: ["Morning stiffness for 45 mins", "Sluggish digestion", "Severe bloating after meals"],
      timeCourse: "Worse in cold weather and early mornings",
      exacerbating: "Climbing stairs, cold water exposure",
      relieving: "Warm oil massage (Abhyanga) and hot fomentation",
      severity: 5
    },
    ayushIntake: {
      prakriti: {
        vata: 65,
        pitta: 20,
        kapha: 15,
        dominant: "Vata-Pitta (Vataja predominant)"
      },
      vikriti: "Vata-Kaphaja Imbalance (Sandhigata Vata with Amadosha)",
      agni: "Mandaagni / Vishamagni (Sluggish & Irregular digestion)",
      koshtha: "Krura Koshtha (Hard bowels / Chronic constipation)",
      aharaShakti: "Madhyama (Moderate appetite, heavy after eating)",
      vyayamaShakti: "Avara (Low physical endurance / easily fatigued)",
      aharaVihara: "High intake of dry/cold foods (Rooksha Ahara), irregular sleeping hours (Ratri Jagarana)"
    },
    pmh: ["Osteoarthritis (Bilateral Knees)", "Dyspepsia (Amlapitta)"],
    allergies: ["No known drug allergies (NKDA)"],
    allopathicMeds: [
      { name: "Tab. Paracetamol", dosage: "650 mg", freq: "SOS (as needed for pain)", duration: "PRN" }
    ],
    ayushHerbs: [
      { name: "Yograj Guggulu", botanical: "Commiphora mukul", dosage: "2 Tablets BD", source: "Prescribed Ayurvedic Clinic" },
      { name: "Dashamoolarishta", botanical: "Polyherbal Ferment", dosage: "20 ml BD after food", source: "Prescribed Ayurvedic Clinic" }
    ],
    documents: []
  }
];

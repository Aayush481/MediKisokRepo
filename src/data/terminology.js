/**
 * Standard Clinical Terminology Mappings: SNOMED-CT, ICD-11, and NAMASTE (Ayurveda)
 */

export const TERMINOLOGY_MAP = {
  // Allopathic Chief Complaints & Diagnoses
  "Chest pain": { snomed: "29857009", icd11: "MD81", category: "Cardiovascular" },
  "Acute Myocardial Infarction": { snomed: "22298006", icd11: "BA41", category: "Emergency" },
  "Type 2 Diabetes Mellitus": { snomed: "44054006", icd11: "5A11", category: "Endocrine" },
  "Essential Hypertension": { snomed: "59621000", icd11: "BA00", category: "Cardiovascular" },
  "Knee Joint Pain": { snomed: "30989003", icd11: "FA31.0", category: "Musculoskeletal" },
  "Osteoarthritis of Knee": { snomed: "239873007", icd11: "FA01", category: "Musculoskeletal" },
  "Acute Febrile Illness": { snomed: "386661006", icd11: "MG26", category: "Infectious" },
  "Dengue Fever": { snomed: "38362002", icd11: "1D20", category: "Infectious" },
  
  // AYUSH / NAMASTE Morbidity Codes
  "Sandhigata Vata": { namaste: "AYU-MS-0412", sanskrit: "सन्धिगत वात", english: "Osteoarthritis / Degenerative Arthritis", icd11_tm: "TM1-0412" },
  "Amlapitta": { namaste: "AYU-GI-0128", sanskrit: "अम्लपित्त", english: "Hyperacidity / Acid Peptic Disorder", icd11_tm: "TM1-0128" },
  "Vishamagni": { namaste: "AYU-PHY-0044", sanskrit: "विषमाग्नि", english: "Irregular Digestive Fire (Vataja)", icd11_tm: "TM1-0044" },
  "Mandaagni": { namaste: "AYU-PHY-0045", sanskrit: "मन्दाग्नि", english: "Sluggish Digestive Fire (Kaphaja)", icd11_tm: "TM1-0045" },
  "Krura Koshtha": { namaste: "AYU-PHY-0091", sanskrit: "क्रूर कोष्ठ", english: "Hard Bowels / Constipation Tendency", icd11_tm: "TM1-0091" },
  "Amadosha": { namaste: "AYU-PAT-0019", sanskrit: "आमदोष", english: "Endogenous Metabolic Toxins", icd11_tm: "TM1-0019" }
};

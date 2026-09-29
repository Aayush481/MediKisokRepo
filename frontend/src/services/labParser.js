/**
 * MediKiosk Production Comprehensive Pathology Lab Parser
 * 
 * Features:
 * 1. Unit Normalization: Automatically converts & standardizes thou/µL, /cumm, cells/µL, fL, mg/dL, mmol/L, µmol/L, g/dL, pg, %, etc.
 * 2. Cross-Check Biological Plausibility: Validates values against physiological plausibility bounds; flags artifacts (e.g. WBC 670 thou/µL or Hb 120 gm/dL).
 * 3. Exact Analyte Disambiguation: Distinguishes Platelet Count vs MPV, TLC vs Neutrophils %, Hb vs HbA1c vs MCH, Total vs Direct Bilirubin, TSH vs FT3/FT4.
 * 4. Syndromic Organ-System Grouping: Organizes findings under Anemia, Leukocytes, Platelets, Glycemic, Lipids, Renal (KFT), Liver (LFT), Thyroid, Vitamins.
 */

export const ORGAN_SYSTEMS = {
  ANEMIA: "Anemia & Erythrocyte Indices",
  LEUKOCYTES: "Leukocytes & Inflammatory / Immune Response",
  PLATELETS: "Platelets & Hemostasis",
  GLYCEMIC: "Glycemic Profile & Metabolic Control",
  LIPID: "Lipid Profile & Atherogenic Risk",
  RENAL: "Renal Function & Electrolyte Balance (KFT)",
  LIVER: "Hepatobiliary Function & Hepatic Enzymes (LFT)",
  THYROID: "Endocrine & Thyroid Function",
  VITAMINS: "Vitamins & Essential Micronutrients",
  OTHER: "Specialized Laboratory Biomarkers"
};

export const LAB_TEST_RULES = [
  // =========================================================================
  // 1. ANEMIA & ERYTHROCYTE INDICES
  // =========================================================================
  {
    param: "Haemoglobin (Hb)",
    organSystem: ORGAN_SYSTEMS.ANEMIA,
    category: "Hematology / CBC",
    aliases: ["haemoglobin", "hemoglobin", "s. hemoglobin", "hemoglobin hb", "hb count", "blood hb", "total hb"],
    excludedAliases: ["hba1c", "glycated", "a1c", "mean corpuscular"],
    unit: "gm/dL",
    refMin: 12.0,
    refMax: 16.0,
    refString: "12.00 - 16.00 gm/dL",
    criticalHigh: 20.0,
    criticalLow: 7.5,
    plausibleMin: 2.0,
    plausibleMax: 26.0,
    highMessage: "Polycythemia (Elevated Hemoglobin)",
    criticalHighMessage: "CRITICAL HIGH HB",
    lowMessage: "LOW (Anemia / Reduced Oxygen Carrying Capacity)"
  },
  {
    param: "Packed Cell Volume (PCV / Hematocrit)",
    organSystem: ORGAN_SYSTEMS.ANEMIA,
    category: "Hematology / CBC",
    aliases: ["pcv", "packed cell volume", "hematocrit", "haematocrit", "hct"],
    excludedAliases: [],
    unit: "%",
    refMin: 36.0,
    refMax: 48.0,
    refString: "36.00 - 48.00 %",
    criticalHigh: 58.0,
    criticalLow: 22.0,
    plausibleMin: 10.0,
    plausibleMax: 75.0,
    highMessage: "Elevated PCV (Hemoconcentration)",
    criticalHighMessage: "CRITICAL HIGH PCV",
    lowMessage: "Low PCV (Anemia)"
  },
  {
    param: "RBC Count",
    organSystem: ORGAN_SYSTEMS.ANEMIA,
    category: "Hematology / CBC",
    aliases: ["rbc count", "total rbc", "red blood cell count", "erythrocyte count", "rbc"],
    excludedAliases: [],
    unit: "mil/µL",
    refMin: 4.5,
    refMax: 5.9,
    refString: "4.50 - 5.90 mil/µL",
    criticalHigh: 7.5,
    criticalLow: 2.5,
    plausibleMin: 1.0,
    plausibleMax: 10.0,
    highMessage: "Erythrocytosis",
    criticalHighMessage: "HIGH RBC COUNT",
    lowMessage: "Low RBC Count (Anemia)"
  },
  {
    param: "MCV (Mean Corpuscular Volume)",
    organSystem: ORGAN_SYSTEMS.ANEMIA,
    category: "Hematology / CBC",
    aliases: ["mcv", "mean corpuscular volume"],
    excludedAliases: ["mch", "mchc", "mpv"],
    unit: "fL",
    refMin: 80.0,
    refMax: 100.0,
    refString: "80.00 - 100.00 fL",
    criticalHigh: 115.0,
    criticalLow: 65.0,
    plausibleMin: 45.0,
    plausibleMax: 140.0,
    highMessage: "Macrocytosis (Vitamin B12 / Folate Deficient Pattern)",
    criticalHighMessage: "CRITICAL HIGH MCV (Severe Macrocytosis)",
    lowMessage: "Microcytosis (Iron Deficiency / Thalassemia Pattern)"
  },
  {
    param: "MCH (Mean Corpuscular Hemoglobin)",
    organSystem: ORGAN_SYSTEMS.ANEMIA,
    category: "Hematology / CBC",
    aliases: ["mch", "mean corpuscular hemoglobin"],
    excludedAliases: ["mchc", "mcv"],
    unit: "pg",
    refMin: 27.0,
    refMax: 33.0,
    refString: "27.00 - 33.00 pg",
    criticalHigh: 38.0,
    criticalLow: 20.0,
    plausibleMin: 12.0,
    plausibleMax: 50.0,
    highMessage: "Elevated MCH",
    criticalHighMessage: "High MCH",
    lowMessage: "Hypochromia (Reduced Hemoglobin Content)"
  },
  {
    param: "MCHC",
    organSystem: ORGAN_SYSTEMS.ANEMIA,
    category: "Hematology / CBC",
    aliases: ["mchc", "mean corpuscular hemoglobin concentration"],
    excludedAliases: [],
    unit: "g/dL",
    refMin: 32.0,
    refMax: 36.0,
    refString: "32.00 - 36.00 g/dL",
    criticalHigh: 40.0,
    criticalLow: 28.0,
    plausibleMin: 20.0,
    plausibleMax: 45.0,
    highMessage: "Elevated MCHC (Spherocytosis Pattern)",
    criticalHighMessage: "High MCHC",
    lowMessage: "Hypochromic Microcytosis"
  },
  {
    param: "RDW-CV (Red Cell Distribution Width)",
    organSystem: ORGAN_SYSTEMS.ANEMIA,
    category: "Hematology / CBC",
    aliases: ["rdw-cv", "rdw cv", "rdw", "red cell distribution width"],
    excludedAliases: [],
    unit: "%",
    refMin: 11.5,
    refMax: 14.5,
    refString: "11.50 - 14.50 %",
    criticalHigh: 18.0,
    criticalLow: 10.0,
    plausibleMin: 8.0,
    plausibleMax: 30.0,
    highMessage: "Anisocytosis (High RDW - Mixed / Evolving Anemia)",
    criticalHighMessage: "MARKED ANISOCYTOSIS",
    lowMessage: "Normal"
  },
  {
    param: "Serum Ferritin",
    organSystem: ORGAN_SYSTEMS.ANEMIA,
    category: "Hematology / Iron Studies",
    aliases: ["ferritin", "serum ferritin", "s. ferritin"],
    excludedAliases: [],
    unit: "ng/mL",
    refMin: 20.0,
    refMax: 250.0,
    refString: "20.00 - 250.00 ng/mL",
    criticalHigh: 500.0,
    criticalLow: 10.0,
    plausibleMin: 1.0,
    plausibleMax: 5000.0,
    highMessage: "Hyperferritinemia (Systemic Inflammation / Acute Phase / Iron Overload)",
    criticalHighMessage: "CRITICAL HIGH FERRITIN",
    lowMessage: "Iron Deficiency Alert (< 15 ng/mL Depleted Iron Stores)"
  },
  {
    param: "Serum Iron",
    organSystem: ORGAN_SYSTEMS.ANEMIA,
    category: "Hematology / Iron Studies",
    aliases: ["serum iron", "s. iron", "iron total"],
    excludedAliases: ["ferritin", "tibc"],
    unit: "µg/dL",
    refMin: 60.0,
    refMax: 170.0,
    refString: "60.00 - 170.00 µg/dL",
    criticalHigh: 250.0,
    criticalLow: 30.0,
    plausibleMin: 5.0,
    plausibleMax: 500.0,
    highMessage: "Elevated Serum Iron",
    criticalHighMessage: "High Serum Iron",
    lowMessage: "Low Serum Iron (Hypoferremia / Iron Deficiency)"
  },

  // =========================================================================
  // 2. LEUKOCYTES & INFLAMMATORY / IMMUNE RESPONSE
  // =========================================================================
  {
    param: "Total Leukocyte Count (TLC / WBC)",
    organSystem: ORGAN_SYSTEMS.LEUKOCYTES,
    category: "Hematology / CBC",
    aliases: ["total leukocyte count", "total leucocyte count", "tlc", "total wbc", "wbc count", "white blood cells", "leukocyte count"],
    excludedAliases: ["neutrophil", "lymphocyte", "eosinophil", "monocyte", "basophil"],
    unit: "thou/µL",
    refMin: 4.0,
    refMax: 11.0,
    refString: "4.00 - 11.00 thou/µL",
    criticalHigh: 18.0,
    criticalLow: 2.5,
    plausibleMin: 0.2,
    plausibleMax: 250.0, // Values like 670 thou/µL are parsing artifacts!
    highMessage: "Leukocytosis (Infection / Inflammation Marker)",
    criticalHighMessage: "CRITICAL HIGH LEUKOCYTOSIS (> 18 thou/µL)",
    lowMessage: "Leukopenia (Immunosuppression Risk)"
  },
  {
    param: "Neutrophils Percentage",
    organSystem: ORGAN_SYSTEMS.LEUKOCYTES,
    category: "Hematology / CBC",
    aliases: ["neutrophil percentage", "neutrophils %", "neutrophils", "polymorphs", "neut"],
    excludedAliases: ["total leukocyte", "absolute neutrophil"],
    unit: "%",
    refMin: 40.0,
    refMax: 70.0,
    refString: "40.00 - 70.00 %",
    criticalHigh: 85.0,
    criticalLow: 25.0,
    plausibleMin: 1.0,
    plausibleMax: 99.0,
    highMessage: "Neutrophilia (Acute Bacterial Infection / Inflammatory Response)",
    criticalHighMessage: "CRITICAL HIGH NEUTROPHILIA",
    lowMessage: "Neutropenia (Infection Risk Alert)"
  },
  {
    param: "Lymphocytes Percentage",
    organSystem: ORGAN_SYSTEMS.LEUKOCYTES,
    category: "Hematology / CBC",
    aliases: ["lymphocyte percentage", "lymphocytes %", "lymphocytes", "lymph"],
    excludedAliases: ["total leukocyte", "absolute lymphocyte"],
    unit: "%",
    refMin: 20.0,
    refMax: 40.0,
    refString: "20.00 - 40.00 %",
    criticalHigh: 60.0,
    criticalLow: 10.0,
    plausibleMin: 1.0,
    plausibleMax: 99.0,
    highMessage: "Lymphocytosis (Viral Infection / Immune Activation Marker)",
    criticalHighMessage: "HIGH LYMPHOCYTOSIS",
    lowMessage: "Lymphopenia"
  },
  {
    param: "Eosinophils Percentage",
    organSystem: ORGAN_SYSTEMS.LEUKOCYTES,
    category: "Hematology / CBC",
    aliases: ["eosinophil percentage", "eosinophils %", "eosinophils", "eos"],
    excludedAliases: [],
    unit: "%",
    refMin: 1.0,
    refMax: 6.0,
    refString: "1.00 - 6.00 %",
    criticalHigh: 15.0,
    criticalLow: 0.0,
    plausibleMin: 0.0,
    plausibleMax: 60.0,
    highMessage: "Eosinophilia (Allergic Diathesis / Parasitic Reaction)",
    criticalHighMessage: "MARKED EOSINOPHILIA (> 15%)",
    lowMessage: "Normal"
  },
  {
    param: "Monocytes Percentage",
    organSystem: ORGAN_SYSTEMS.LEUKOCYTES,
    category: "Hematology / CBC",
    aliases: ["monocyte percentage", "monocytes %", "monocytes", "mono"],
    excludedAliases: [],
    unit: "%",
    refMin: 2.0,
    refMax: 8.0,
    refString: "2.00 - 8.00 %",
    criticalHigh: 14.0,
    criticalLow: 0.0,
    plausibleMin: 0.0,
    plausibleMax: 40.0,
    highMessage: "Monocytosis (Chronic Inflammation / Recovery Phase)",
    criticalHighMessage: "HIGH MONOCYTOSIS",
    lowMessage: "Normal"
  },
  {
    param: "Erythrocyte Sedimentation Rate (ESR)",
    organSystem: ORGAN_SYSTEMS.LEUKOCYTES,
    category: "Hematology / CBC",
    aliases: ["esr", "erythrocyte sedimentation rate", "esr westergren"],
    excludedAliases: [],
    unit: "mm/hr",
    refMin: 0,
    refMax: 20,
    refString: "0 - 20 mm/hr",
    criticalHigh: 60,
    criticalLow: 0,
    plausibleMin: 0,
    plausibleMax: 150,
    highMessage: "Elevated ESR (Systemic Inflammation / Infection Marker)",
    criticalHighMessage: "MARKEDLY ELEVATED ESR (> 60 mm/hr)",
    lowMessage: "Normal"
  },
  {
    param: "C-Reactive Protein (CRP)",
    organSystem: ORGAN_SYSTEMS.LEUKOCYTES,
    category: "Inflammatory Biomarkers",
    aliases: ["crp", "c-reactive protein", "serum crp", "hs-crp"],
    excludedAliases: [],
    unit: "mg/L",
    refMin: 0.0,
    refMax: 5.0,
    refString: "< 5.00 mg/L",
    criticalHigh: 25.0,
    criticalLow: 0.0,
    plausibleMin: 0.0,
    plausibleMax: 400.0,
    highMessage: "Elevated CRP (Active Acute Systemic Inflammation)",
    criticalHighMessage: "MARKEDLY ELEVATED CRP (> 25 mg/L)",
    lowMessage: "Normal"
  },

  // =========================================================================
  // 3. PLATELETS & HEMOSTASIS (Disambiguated Platelets vs MPV)
  // =========================================================================
  {
    param: "Platelet Count",
    organSystem: ORGAN_SYSTEMS.PLATELETS,
    category: "Hematology / CBC",
    aliases: ["platelet count", "platelets", "total platelet", "total platelets", "plt count", "plt"],
    excludedAliases: ["mean platelet volume", "mpv", "pdw", "pct"],
    unit: "thou/µL",
    refMin: 150,
    refMax: 410,
    refString: "150.00 - 410.00 thou/µL",
    criticalHigh: 600,
    criticalLow: 50,
    plausibleMin: 3.0,
    plausibleMax: 2500.0,
    highMessage: "Thrombocytosis (Elevated Platelets)",
    criticalHighMessage: "CRITICAL THROMBOCYTOSIS (> 600 thou/µL)",
    lowMessage: "CRITICAL LOW (Thrombocytopenia / Hemorrhagic & Bleeding Risk)"
  },
  {
    param: "Mean Platelet Volume (MPV)",
    organSystem: ORGAN_SYSTEMS.PLATELETS,
    category: "Hematology / CBC",
    aliases: ["mean platelet volume", "mpv"],
    excludedAliases: ["platelet count", "total platelet", "plt"],
    unit: "fL",
    refMin: 7.5,
    refMax: 11.5,
    refString: "7.50 - 11.50 fL",
    criticalHigh: 14.0,
    criticalLow: 6.0,
    plausibleMin: 4.0,
    plausibleMax: 25.0,
    highMessage: "High MPV (Active Platelet Turnover / Megakaryocytic Hyperplasia)",
    criticalHighMessage: "High MPV",
    lowMessage: "Low MPV (Impaired Bone Marrow Platelet Production)"
  },

  // =========================================================================
  // 4. GLYCEMIC PROFILE & METABOLIC CONTROL
  // =========================================================================
  {
    param: "Fasting Blood Glucose",
    organSystem: ORGAN_SYSTEMS.GLYCEMIC,
    category: "Glycemic Profile",
    aliases: ["glucose fasting", "fasting glucose", "fbs", "fasting blood sugar", "glucose (f)", "blood glucose fasting"],
    excludedAliases: ["post prandial", "ppbs", "random"],
    unit: "mg/dL",
    refMin: 70,
    refMax: 100,
    refString: "70.00 - 100.00 mg/dL",
    criticalHigh: 200,
    criticalLow: 50,
    plausibleMin: 15,
    plausibleMax: 1200,
    highMessage: "Impaired Fasting Glucose / Diabetes Mellitus",
    criticalHighMessage: "CRITICAL FASTING HYPERGLYCEMIA (> 200 mg/dL)",
    lowMessage: "Fasting Hypoglycemia Alert"
  },
  {
    param: "Postprandial Blood Glucose",
    organSystem: ORGAN_SYSTEMS.GLYCEMIC,
    category: "Glycemic Profile",
    aliases: ["post prandial", "ppbs", "glucose pp", "glucose post", "postprandial glucose", "blood glucose pp"],
    excludedAliases: ["fasting", "fbs", "random"],
    unit: "mg/dL",
    refMin: 70,
    refMax: 140,
    refString: "70.00 - 140.00 mg/dL",
    criticalHigh: 250,
    criticalLow: 50,
    plausibleMin: 15,
    plausibleMax: 1200,
    highMessage: "Postprandial Hyperglycemia (Elevated After Meals)",
    criticalHighMessage: "CRITICAL PP HYPERGLYCEMIA (> 250 mg/dL)",
    lowMessage: "Postprandial Hypoglycemia"
  },
  {
    param: "Random Blood Glucose",
    organSystem: ORGAN_SYSTEMS.GLYCEMIC,
    category: "Glycemic Profile",
    aliases: ["glucose random", "random glucose", "blood glucose r", "rbs", "random blood sugar", "blood sugar random"],
    excludedAliases: ["fasting", "post prandial"],
    unit: "mg/dL",
    refMin: 70,
    refMax: 140,
    refString: "70.00 - 140.00 mg/dL",
    criticalHigh: 250,
    criticalLow: 50,
    plausibleMin: 15,
    plausibleMax: 1200,
    highMessage: "Hyperglycemia (Elevated Blood Sugar)",
    criticalHighMessage: "CRITICAL HIGH (Severe Hyperglycemia)",
    lowMessage: "Hypoglycemia (Low Blood Sugar Alert)"
  },
  {
    param: "HbA1c (Glycated Hemoglobin)",
    organSystem: ORGAN_SYSTEMS.GLYCEMIC,
    category: "Glycemic Profile",
    aliases: ["hba1c", "glycated hemoglobin", "glycohemoglobin", "a1c", "glycosylated hemoglobin"],
    excludedAliases: ["haemoglobin", "hemoglobin hb", "total hb"],
    unit: "%",
    refMin: 4.0,
    refMax: 5.7,
    refString: "< 5.70 % (Normal)",
    criticalHigh: 9.0,
    criticalLow: 3.5,
    plausibleMin: 3.0,
    plausibleMax: 22.0,
    highMessage: "Elevated HbA1c (Diabetic Range >= 6.5%)",
    criticalHighMessage: "CRITICAL POOR GLYCEMIC CONTROL (HbA1c > 9%)",
    lowMessage: "Low HbA1c"
  },
  {
    param: "Estimated Average Glucose (eAG)",
    organSystem: ORGAN_SYSTEMS.GLYCEMIC,
    category: "Glycemic Profile",
    aliases: ["estimated average glucose", "eag", "average blood glucose"],
    excludedAliases: [],
    unit: "mg/dL",
    refMin: 70,
    refMax: 126,
    refString: "70.00 - 126.00 mg/dL",
    criticalHigh: 212,
    criticalLow: 60,
    plausibleMin: 40,
    plausibleMax: 500,
    highMessage: "Elevated Estimated Average Glucose",
    criticalHighMessage: "CRITICAL HIGH AVERAGE GLUCOSE",
    lowMessage: "Low Average Glucose"
  },

  // =========================================================================
  // 5. LIPID PROFILE & ATHEROGENIC RISK
  // =========================================================================
  {
    param: "Serum Triglycerides",
    organSystem: ORGAN_SYSTEMS.LIPID,
    category: "Lipid Profile",
    aliases: ["triglyceride", "triglycerides", "tg", "s. triglycerides", "serum tg"],
    excludedAliases: [],
    unit: "mg/dL",
    refMin: 0,
    refMax: 150,
    refString: "< 150.00 mg/dL",
    criticalHigh: 300,
    criticalLow: 0,
    plausibleMin: 10,
    plausibleMax: 3000,
    highMessage: "Hypertriglyceridemia (High Triglycerides)",
    criticalHighMessage: "CRITICAL HIGH (Severe Hypertriglyceridemia > 300 mg/dL)",
    lowMessage: "Low Triglycerides"
  },
  {
    param: "Total Cholesterol",
    organSystem: ORGAN_SYSTEMS.LIPID,
    category: "Lipid Profile",
    aliases: ["total cholesterol", "cholesterol total", "serum cholesterol", "s. cholesterol"],
    excludedAliases: ["hdl", "ldl", "vldl", "non-hdl"],
    unit: "mg/dL",
    refMin: 0,
    refMax: 200,
    refString: "< 200.00 mg/dL",
    criticalHigh: 260,
    criticalLow: 0,
    plausibleMin: 30,
    plausibleMax: 1000,
    highMessage: "Hypercholesterolemia (High Cholesterol)",
    criticalHighMessage: "CRITICAL HIGH CHOLESTEROL (> 260 mg/dL)",
    lowMessage: "Normal / Low"
  },
  {
    param: "HDL Cholesterol",
    organSystem: ORGAN_SYSTEMS.LIPID,
    category: "Lipid Profile",
    aliases: ["hdl cholesterol", "hdl - cholesterol", "hdl", "good cholesterol", "serum hdl"],
    excludedAliases: ["non-hdl", "vldl", "ldl"],
    unit: "mg/dL",
    refMin: 40,
    refMax: 80,
    refString: "> 40.00 mg/dL",
    criticalHigh: 120,
    criticalLow: 25,
    plausibleMin: 5,
    plausibleMax: 200,
    highMessage: "High HDL (Cardioprotective)",
    criticalHighMessage: "High HDL",
    lowMessage: "LOW HDL (Atherogenic Cardiovascular Risk < 40 mg/dL)"
  },
  {
    param: "LDL Cholesterol",
    organSystem: ORGAN_SYSTEMS.LIPID,
    category: "Lipid Profile",
    aliases: ["ldl cholesterol", "ldl - cholesterol", "ldl", "bad cholesterol", "serum ldl"],
    excludedAliases: ["vldl", "hdl"],
    unit: "mg/dL",
    refMin: 0,
    refMax: 100,
    refString: "< 100.00 mg/dL",
    criticalHigh: 160,
    criticalLow: 0,
    plausibleMin: 10,
    plausibleMax: 600,
    highMessage: "Elevated LDL (Atherogenic Cardiovascular Risk)",
    criticalHighMessage: "CRITICAL HIGH LDL CHOLESTEROL",
    lowMessage: "Optimal LDL"
  },
  {
    param: "VLDL Cholesterol",
    organSystem: ORGAN_SYSTEMS.LIPID,
    category: "Lipid Profile",
    aliases: ["vldl cholesterol", "vldl", "vldl - cholesterol", "serum vldl"],
    excludedAliases: [],
    unit: "mg/dL",
    refMin: 5,
    refMax: 30,
    refString: "5.00 - 30.00 mg/dL",
    criticalHigh: 50,
    criticalLow: 0,
    plausibleMin: 1,
    plausibleMax: 300,
    highMessage: "Elevated VLDL Cholesterol",
    criticalHighMessage: "HIGH VLDL",
    lowMessage: "Normal"
  },
  {
    param: "Non-HDL Cholesterol",
    organSystem: ORGAN_SYSTEMS.LIPID,
    category: "Lipid Profile",
    aliases: ["non-hdl cholesterol", "non hdl", "non-hdl"],
    excludedAliases: [],
    unit: "mg/dL",
    refMin: 0,
    refMax: 130,
    refString: "< 130.00 mg/dL",
    criticalHigh: 190,
    criticalLow: 0,
    plausibleMin: 20,
    plausibleMax: 800,
    highMessage: "Elevated Non-HDL Cholesterol",
    criticalHighMessage: "HIGH NON-HDL",
    lowMessage: "Normal"
  },

  // =========================================================================
  // 6. RENAL FUNCTION & ELECTROLYTE BALANCE (KFT)
  // =========================================================================
  {
    param: "Serum Creatinine",
    organSystem: ORGAN_SYSTEMS.RENAL,
    category: "Kidney Function (KFT)",
    aliases: ["serum creatinine", "creatinine", "s. creatinine", "creat", "s creatinine"],
    excludedAliases: ["urine creatinine", "clearance"],
    unit: "mg/dL",
    refMin: 0.5,
    refMax: 1.2,
    refString: "0.50 - 1.20 mg/dL",
    criticalHigh: 2.2,
    criticalLow: 0.3,
    plausibleMin: 0.1,
    plausibleMax: 35.0,
    highMessage: "Elevated Creatinine (Renal Clearance Impairment)",
    criticalHighMessage: "CRITICAL HIGH CREATININE (Acute Kidney Injury Alert)",
    lowMessage: "Low Creatinine"
  },
  {
    param: "Blood Urea",
    organSystem: ORGAN_SYSTEMS.RENAL,
    category: "Kidney Function (KFT)",
    aliases: ["blood urea", "urea", "s. urea", "serum urea"],
    excludedAliases: ["bun", "uric acid"],
    unit: "mg/dL",
    refMin: 15,
    refMax: 45,
    refString: "15.00 - 45.00 mg/dL",
    criticalHigh: 80,
    criticalLow: 8,
    plausibleMin: 3,
    plausibleMax: 450,
    highMessage: "Elevated Blood Urea (Azotemia)",
    criticalHighMessage: "CRITICAL UREMIA (High Renal Azotemia)",
    lowMessage: "Low Urea"
  },
  {
    param: "Blood Urea Nitrogen (BUN)",
    organSystem: ORGAN_SYSTEMS.RENAL,
    category: "Kidney Function (KFT)",
    aliases: ["bun", "blood urea nitrogen", "s. bun"],
    excludedAliases: [],
    unit: "mg/dL",
    refMin: 7.0,
    refMax: 20.0,
    refString: "7.00 - 20.00 mg/dL",
    criticalHigh: 40.0,
    criticalLow: 4.0,
    plausibleMin: 1.5,
    plausibleMax: 200.0,
    highMessage: "Elevated BUN (Azotemia / Renal Strain)",
    criticalHighMessage: "CRITICAL HIGH BUN",
    lowMessage: "Low BUN"
  },
  {
    param: "Serum Uric Acid",
    organSystem: ORGAN_SYSTEMS.RENAL,
    category: "Kidney Function (KFT)",
    aliases: ["uric acid", "serum uric acid", "s. uric acid"],
    excludedAliases: [],
    unit: "mg/dL",
    refMin: 3.5,
    refMax: 7.2,
    refString: "3.50 - 7.20 mg/dL",
    criticalHigh: 10.0,
    criticalLow: 2.0,
    plausibleMin: 0.5,
    plausibleMax: 30.0,
    highMessage: "Hyperuricemia (Gout / Nephrolithiasis Risk)",
    criticalHighMessage: "CRITICAL HIGH URIC ACID",
    lowMessage: "Low Uric Acid"
  },
  {
    param: "Estimated GFR (eGFR)",
    organSystem: ORGAN_SYSTEMS.RENAL,
    category: "Kidney Function (KFT)",
    aliases: ["egfr", "estimated gfr", "gfr"],
    excludedAliases: [],
    unit: "mL/min/1.73m²",
    refMin: 90.0,
    refMax: 150.0,
    refString: "> 90.00 mL/min/1.73m²",
    criticalHigh: 180.0,
    criticalLow: 30.0,
    plausibleMin: 2.0,
    plausibleMax: 250.0,
    highMessage: "Hyperfiltration",
    criticalHighMessage: "Elevated GFR",
    lowMessage: "REDUCED eGFR (Renal Functional Impairment)"
  },
  {
    param: "Serum Sodium (Na+)",
    organSystem: ORGAN_SYSTEMS.RENAL,
    category: "Electrolytes",
    aliases: ["serum sodium", "sodium", "s. sodium", "na+", "s sodium"],
    excludedAliases: ["urine sodium"],
    unit: "mmol/L",
    refMin: 135.0,
    refMax: 145.0,
    refString: "135.00 - 145.00 mmol/L",
    criticalHigh: 155.0,
    criticalLow: 125.0,
    plausibleMin: 95.0,
    plausibleMax: 185.0,
    highMessage: "Hypernatremia",
    criticalHighMessage: "CRITICAL HIGH HYPERNATREMIA (> 155 mmol/L)",
    lowMessage: "LOW (Hyponatremia Alert < 135 mmol/L)"
  },
  {
    param: "Serum Potassium (K+)",
    organSystem: ORGAN_SYSTEMS.RENAL,
    category: "Electrolytes",
    aliases: ["serum potassium", "potassium", "s. potassium", "k+", "s potassium"],
    excludedAliases: ["urine potassium"],
    unit: "mmol/L",
    refMin: 3.5,
    refMax: 5.1,
    refString: "3.50 - 5.10 mmol/L",
    criticalHigh: 6.0,
    criticalLow: 2.8,
    plausibleMin: 1.2,
    plausibleMax: 10.5,
    highMessage: "Hyperkalemia (Cardiotoxicity & Arrhythmia Risk)",
    criticalHighMessage: "CRITICAL HIGH HYPERKALEMIA (Cardiotoxicity Alert > 6.0)",
    lowMessage: "Hypokalemia (Cardiac Arrhythmia Alert < 3.5)"
  },
  {
    param: "Serum Chloride (Cl-)",
    organSystem: ORGAN_SYSTEMS.RENAL,
    category: "Electrolytes",
    aliases: ["serum chloride", "chloride", "s. chloride", "cl-"],
    excludedAliases: [],
    unit: "mmol/L",
    refMin: 98.0,
    refMax: 107.0,
    refString: "98.00 - 107.00 mmol/L",
    criticalHigh: 118.0,
    criticalLow: 85.0,
    plausibleMin: 60.0,
    plausibleMax: 145.0,
    highMessage: "Hyperchloremia",
    criticalHighMessage: "High Chloride",
    lowMessage: "Hypochloremia"
  },
  {
    param: "Serum Calcium",
    organSystem: ORGAN_SYSTEMS.RENAL,
    category: "Electrolytes & Minerals",
    aliases: ["serum calcium", "calcium", "s. calcium", "ca++"],
    excludedAliases: ["ionized calcium", "urine calcium"],
    unit: "mg/dL",
    refMin: 8.5,
    refMax: 10.5,
    refString: "8.50 - 10.50 mg/dL",
    criticalHigh: 12.5,
    criticalLow: 6.5,
    plausibleMin: 3.0,
    plausibleMax: 20.0,
    highMessage: "Hypercalcemia",
    criticalHighMessage: "CRITICAL HIGH HYPERCALCEMIA",
    lowMessage: "Hypocalcemia (Tetany / Neuromuscular Excitability Risk)"
  },

  // =========================================================================
  // 7. HEPATOBILIARY FUNCTION & HEPATIC ENZYMES (LFT)
  // =========================================================================
  {
    param: "SGPT / ALT (Alanine Aminotransferase)",
    organSystem: ORGAN_SYSTEMS.LIVER,
    category: "Liver Function (LFT)",
    aliases: ["sgpt", "alt", "alanine aminotransferase", "sgpt/alt", "alanine transaminase"],
    excludedAliases: ["sgot", "ast"],
    unit: "U/L",
    refMin: 0,
    refMax: 45,
    refString: "< 45.00 U/L",
    criticalHigh: 150,
    criticalLow: 0,
    plausibleMin: 1,
    plausibleMax: 6000,
    highMessage: "Elevated SGPT (Hepatocellular Injury / Transaminitis)",
    criticalHighMessage: "CRITICAL HIGH HEPATIC TRANSAMINITIS (SGPT > 150 U/L)",
    lowMessage: "Normal"
  },
  {
    param: "SGOT / AST (Aspartate Aminotransferase)",
    organSystem: ORGAN_SYSTEMS.LIVER,
    category: "Liver Function (LFT)",
    aliases: ["sgot", "ast", "aspartate aminotransferase", "sgot/ast", "aspartate transaminase"],
    excludedAliases: ["sgpt", "alt"],
    unit: "U/L",
    refMin: 0,
    refMax: 40,
    refString: "< 40.00 U/L",
    criticalHigh: 140,
    criticalLow: 0,
    plausibleMin: 1,
    plausibleMax: 6000,
    highMessage: "Elevated SGOT (Hepatic / Myocardial Strain)",
    criticalHighMessage: "CRITICAL HIGH SGOT (> 140 U/L)",
    lowMessage: "Normal"
  },
  {
    param: "Serum Total Bilirubin",
    organSystem: ORGAN_SYSTEMS.LIVER,
    category: "Liver Function (LFT)",
    aliases: ["total bilirubin", "serum bilirubin", "bilirubin total", "s. bilirubin total", "t. bilirubin"],
    excludedAliases: ["direct bilirubin", "indirect bilirubin"],
    unit: "mg/dL",
    refMin: 0.2,
    refMax: 1.2,
    refString: "0.20 - 1.20 mg/dL",
    criticalHigh: 3.0,
    criticalLow: 0.0,
    plausibleMin: 0.05,
    plausibleMax: 50.0,
    highMessage: "Hyperbilirubinemia (Jaundice Alert)",
    criticalHighMessage: "CRITICAL HIGH BILIRUBIN (Severe Clinical Jaundice)",
    lowMessage: "Normal"
  },
  {
    param: "Serum Direct Bilirubin",
    organSystem: ORGAN_SYSTEMS.LIVER,
    category: "Liver Function (LFT)",
    aliases: ["direct bilirubin", "conjugated bilirubin", "bilirubin direct", "s. direct bilirubin", "d. bilirubin"],
    excludedAliases: ["indirect bilirubin"],
    unit: "mg/dL",
    refMin: 0.0,
    refMax: 0.3,
    refString: "< 0.30 mg/dL",
    criticalHigh: 1.5,
    criticalLow: 0.0,
    plausibleMin: 0.0,
    plausibleMax: 30.0,
    highMessage: "Elevated Direct Bilirubin (Biliary / Hepatic Cholestasis)",
    criticalHighMessage: "HIGH DIRECT BILIRUBIN",
    lowMessage: "Normal"
  },
  {
    param: "Alkaline Phosphatase (ALP)",
    organSystem: ORGAN_SYSTEMS.LIVER,
    category: "Liver Function (LFT)",
    aliases: ["alkaline phosphatase", "alp", "s. alp", "serum alp"],
    excludedAliases: [],
    unit: "U/L",
    refMin: 40,
    refMax: 130,
    refString: "40.00 - 130.00 U/L",
    criticalHigh: 300,
    criticalLow: 20,
    plausibleMin: 5,
    plausibleMax: 2500,
    highMessage: "Elevated ALP (Cholestatic Hepatobiliary / Bone Turnover Marker)",
    criticalHighMessage: "CRITICAL HIGH ALP (> 300 U/L)",
    lowMessage: "Low ALP"
  },
  {
    param: "Total Protein",
    organSystem: ORGAN_SYSTEMS.LIVER,
    category: "Liver Function (LFT)",
    aliases: ["total protein", "serum total protein", "protein total"],
    excludedAliases: ["albumin", "globulin"],
    unit: "g/dL",
    refMin: 6.4,
    refMax: 8.3,
    refString: "6.40 - 8.30 g/dL",
    criticalHigh: 10.0,
    criticalLow: 5.0,
    plausibleMin: 2.0,
    plausibleMax: 15.0,
    highMessage: "Hyperproteinemia (Paraproteinemia / Dehydration)",
    criticalHighMessage: "High Total Protein",
    lowMessage: "Hypoproteinemia (Nutritional / Hepatic / Nephrotic Deficit)"
  },
  {
    param: "Serum Albumin",
    organSystem: ORGAN_SYSTEMS.LIVER,
    category: "Liver Function (LFT)",
    aliases: ["serum albumin", "albumin", "s. albumin"],
    excludedAliases: ["microalbumin", "urine albumin", "total protein"],
    unit: "g/dL",
    refMin: 3.5,
    refMax: 5.2,
    refString: "3.50 - 5.20 g/dL",
    criticalHigh: 6.0,
    criticalLow: 2.2,
    plausibleMin: 1.0,
    plausibleMax: 8.0,
    highMessage: "High Albumin",
    criticalHighMessage: "High Albumin",
    lowMessage: "Hypoalbuminemia (Hepatic Impairment / Nutritional Deficit < 3.5 g/dL)"
  },

  // =========================================================================
  // 8. ENDOCRINE & THYROID FUNCTION
  // =========================================================================
  {
    param: "TSH (Thyroid Stimulating Hormone)",
    organSystem: ORGAN_SYSTEMS.THYROID,
    category: "Thyroid Profile",
    aliases: ["tsh", "thyroid stimulating hormone", "s. tsh", "ultra tsh"],
    excludedAliases: ["total t3", "total t4", "free t3", "free t4"],
    unit: "µIU/mL",
    refMin: 0.35,
    refMax: 4.94,
    refString: "0.35 - 4.94 µIU/mL",
    criticalHigh: 10.0,
    criticalLow: 0.1,
    plausibleMin: 0.001,
    plausibleMax: 200.0,
    highMessage: "Elevated TSH (Primary Hypothyroidism)",
    criticalHighMessage: "CRITICAL HIGH TSH (Severe Hypothyroidism > 10 µIU/mL)",
    lowMessage: "Suppressed TSH (Hyperthyroidism / Thyrotoxicosis)"
  },
  {
    param: "Total T3",
    organSystem: ORGAN_SYSTEMS.THYROID,
    category: "Thyroid Profile",
    aliases: ["total t3", "triiodothyronine", "t3"],
    excludedAliases: ["free t3", "ft3", "tsh", "t4"],
    unit: "ng/mL",
    refMin: 0.8,
    refMax: 2.0,
    refString: "0.80 - 2.00 ng/mL",
    criticalHigh: 3.5,
    criticalLow: 0.4,
    plausibleMin: 0.1,
    plausibleMax: 15.0,
    highMessage: "Elevated T3",
    criticalHighMessage: "High T3",
    lowMessage: "Low T3"
  },
  {
    param: "Total T4",
    organSystem: ORGAN_SYSTEMS.THYROID,
    category: "Thyroid Profile",
    aliases: ["total t4", "thyroxine", "t4"],
    excludedAliases: ["free t4", "ft4", "tsh", "t3"],
    unit: "µg/dL",
    refMin: 4.8,
    refMax: 11.6,
    refString: "4.80 - 11.60 µg/dL",
    criticalHigh: 18.0,
    criticalLow: 2.0,
    plausibleMin: 0.5,
    plausibleMax: 35.0,
    highMessage: "Elevated T4",
    criticalHighMessage: "High T4",
    lowMessage: "Low T4"
  },

  // =========================================================================
  // 9. VITAMINS & ESSENTIAL MICRONUTRIENTS
  // =========================================================================
  {
    param: "Vitamin D (25-OH)",
    organSystem: ORGAN_SYSTEMS.VITAMINS,
    category: "Vitamins & Minerals",
    aliases: ["vitamin d", "25-oh vitamin d", "vit d3", "25 hydroxy vitamin d", "vitamin d3"],
    excludedAliases: [],
    unit: "ng/mL",
    refMin: 30.0,
    refMax: 100.0,
    refString: "30.00 - 100.00 ng/mL",
    criticalHigh: 150.0,
    criticalLow: 10.0,
    plausibleMin: 2.0,
    plausibleMax: 300.0,
    highMessage: "Hypervitaminosis D",
    criticalHighMessage: "Elevated Vitamin D",
    lowMessage: "Vitamin D Deficiency (< 20 ng/mL Deficient)"
  },
  {
    param: "Vitamin B12",
    organSystem: ORGAN_SYSTEMS.VITAMINS,
    category: "Vitamins & Minerals",
    aliases: ["vitamin b12", "vit b12", "cobalamin", "b12"],
    excludedAliases: [],
    unit: "pg/mL",
    refMin: 200,
    refMax: 900,
    refString: "200.00 - 900.00 pg/mL",
    criticalHigh: 1500,
    criticalLow: 120,
    plausibleMin: 20,
    plausibleMax: 3500,
    highMessage: "Elevated Vitamin B12",
    criticalHighMessage: "High B12",
    lowMessage: "Vitamin B12 Deficiency (Peripheral Neuropathy / Megaloblastic Anemia Risk)"
  }
];

class LabParser {
  /**
   * Unit Normalizer: Converts raw unit & value strings into canonical standardized units.
   * Handles thou/µL, /cumm, cells/µL, fL, mg/dL, mmol/L, µmol/L, g/dL, pg, %, etc.
   */
  normalizeUnitAndValue(valRaw, unitRaw, testParam) {
    let val = parseFloat(valRaw);
    let unit = (unitRaw || "").toLowerCase().trim();
    if (isNaN(val)) return { val: null, unit: "" };

    // --- 1. TLC / WBC Unit Normalization (Standard: thou/µL) ---
    if (testParam === "Total Leukocyte Count (TLC / WBC)") {
      if (!unit.includes("thou") && !unit.includes("10^3") && !unit.includes("10*3") && !unit.includes("k/") && !unit.includes("k/ul") && !unit.includes("k/µl")) {
        if (unit.includes("/cumm") || unit.includes("cells") || unit.includes("/mm3") || unit.includes("/µl") || unit.includes("/ul")) {
          // If reported as raw count e.g. 14800 /cumm -> convert to 14.80 thou/µL
          if (val >= 100) {
            val = val / 1000;
          }
        }
      }
      return { val, unit: "thou/µL" };
    }

    // --- 2. Platelet Count Unit Normalization (Standard: thou/µL) ---
    if (testParam === "Platelet Count") {
      if (unit.includes("lakh") || unit.includes("lakhs")) {
        // E.g. 2.25 lakhs/cumm -> 225.00 thou/µL
        val = val * 100;
      } else if (!unit.includes("thou") && !unit.includes("10^3") && !unit.includes("10*3") && !unit.includes("k/") && !unit.includes("k/ul") && !unit.includes("k/µl")) {
        if (unit.includes("/cumm") || unit.includes("cells") || unit.includes("/mm3") || unit.includes("/µl") || unit.includes("/ul")) {
          // E.g. 225000 /cumm -> 225.00 thou/µL
          if (val >= 1000) {
            val = val / 1000;
          }
        }
      }
      return { val, unit: "thou/µL" };
    }

    // --- 3. MPV vs Platelets (Standard MPV: fL) ---
    if (testParam === "Mean Platelet Volume (MPV)") {
      return { val, unit: "fL" };
    }

    // --- 4. RBC Count (Standard: mil/µL) ---
    if (testParam === "RBC Count") {
      if (val >= 100000) {
        val = val / 1000000;
      }
      return { val, unit: "mil/µL" };
    }

    // --- 5. Creatinine / Bilirubin (µmol/L to mg/dL) ---
    if (testParam === "Serum Creatinine" && (unit.includes("µmol") || unit.includes("umol"))) {
      val = val / 88.4;
      return { val, unit: "mg/dL" };
    }
    if (testParam === "Serum Total Bilirubin" && (unit.includes("µmol") || unit.includes("umol"))) {
      val = val / 17.1;
      return { val, unit: "mg/dL" };
    }

    return { val, unit: unitRaw || "" };
  }

  /**
   * Cross-Check Biological Plausibility Validation:
   * Rejects out-of-bounds optical character artifacts (e.g., WBC 670 thou/µL or Hb 120 gm/dL)
   */
  validateBiologicalPlausibility(valNum, rule) {
    if (rule.plausibleMin !== undefined && valNum < rule.plausibleMin) {
      return {
        isPlausible: false,
        reason: `Value ${valNum} is below physiological plausibility limit (${rule.plausibleMin} ${rule.unit})`
      };
    }
    if (rule.plausibleMax !== undefined && valNum > rule.plausibleMax) {
      return {
        isPlausible: false,
        reason: `Value ${valNum} is above physiological plausibility limit (${rule.plausibleMax} ${rule.unit})`
      };
    }
    return { isPlausible: true };
  }

  /**
   * Dynamic Tabular Line Parser:
   * Parses arbitrary custom lab rows formatted as: `<Test Name> <Value> <Unit> <RefMin> - <RefMax>`
   */
  parseGenericTabularLine(line) {
    if (!line || line.length < 10) return null;
    if (/^(?:page|department|test name|investigation|observed value|biological reference|status|dr\.|patient|age|sample|status|remarks)/i.test(line)) return null;

    const match = line.match(/^([A-Za-z0-9\(\)\-\s\/]+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z\/µ%]+)\s+(\d+(?:\.\d+)?)\s*[\-\–]\s*(\d+(?:\.\d+)?)/i);
    if (!match) return null;

    const testName = match[1].trim();
    const valNum = parseFloat(match[2]);
    const unit = match[3].trim();
    const refMin = parseFloat(match[4]);
    const refMax = parseFloat(match[5]);

    if (isNaN(valNum) || isNaN(refMin) || isNaN(refMax)) return null;
    if (/^(patient|sample|status|doctor|date|time)/i.test(testName)) return null;

    const isHigh = valNum > refMax;
    const isLow = valNum < refMin;

    return {
      test: testName,
      organSystem: ORGAN_SYSTEMS.OTHER,
      category: "Specialized Laboratory Biomarker",
      value: `${valNum.toFixed(2)} ${unit}`,
      ref: `${refMin.toFixed(2)} - ${refMax.toFixed(2)} ${unit}`,
      status: isHigh ? `Elevated (${valNum.toFixed(2)} > ${refMax})` : isLow ? `Low (${valNum.toFixed(2)} < ${refMin})` : "Normal",
      alertLevel: isHigh || isLow ? "warning" : "normal",
      isAbnormal: isHigh || isLow,
      isPlausible: true
    };
  }

  /**
   * Parse full raw OCR / multi-page PDF text with complete unit normalization,
   * biological plausibility cross-checks, exact analyte disambiguation, and syndromic organ grouping.
   */
  parseLabReportText(rawOcrText) {
    if (!rawOcrText) return { flags: [], normalValues: [], artifacts: [], syndromicSummary: {}, summary: "" };

    const flags = [];
    const normalValues = [];
    const artifacts = [];
    const lines = rawOcrText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const seenParams = new Set();
    const matchedLineIndices = new Set();

    // Check if entire document contains confirmed laboratory/pathology headers
    const hasLabContext = /\b(pathology|biochemistry|hematology|haematology|microbiology|serology|clinical pathology|laboratory|lab report|blood test|diagnostic|dr lal|srl|metropolis|thyrocare|agilus|pathkind|apollo diagnostics|max lab|test name|investigation|observed value|reference interval|ref range)\b/i.test(rawOcrText);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Skip lines with commercial pricing, receipts, currencies, keyboard shortcuts, or dev code
      if (/[\$€£₹]|(?:rs\.?\s*\d+)|(?:\b(?:subtotal|total items|cashier|invoice|receipt|tax|vat|qty|price|amount paid|prtscn|snipping|screenshot|alt\s*\+|ctrl\s*\+|shift\s*\+|burger\s*bun|hair\s*bun)\b)/i.test(lowerLine)) {
        continue;
      }

      for (const rule of LAB_TEST_RULES) {
        if (seenParams.has(rule.param)) continue;

        // Check if any excluded alias appears on this line (e.g. "mpv" must not match "platelets")
        if (rule.excludedAliases && rule.excludedAliases.some(ea => lowerLine.includes(ea))) {
          continue;
        }

        const matchesAlias = rule.aliases.some(alias => {
          const idx = lowerLine.indexOf(alias);
          if (idx === -1) return false;
          // Exact word boundary checks
          const charBefore = idx > 0 ? lowerLine[idx - 1] : " ";
          const charAfter = idx + alias.length < lowerLine.length ? lowerLine[idx + alias.length] : " ";
          const hasBoundary = /[\s:,(\/_\-]/.test(charBefore) && /[\s:,)\/_\-]/.test(charAfter);
          if (!hasBoundary) return false;

          // For short 2-3 char aliases (e.g. alt, ast, bun, pt, inr, hb, tlc, dlc), require clinical context
          if (alias.length <= 3) {
            if (/\b(?:alt\s*\+|alt\s*key|ctrl|shift|prtscn|press\s*alt|burger\s*bun|bun\s*for|font\s*pt|\d+\s*pt\b|inr\s*\d+|\d+\s*inr)\b/i.test(lowerLine)) {
              return false;
            }
            const hasClinicalUnit = /\b(u\/l|iu\/l|mg\/dl|g\/dl|gm\/dl|mmol\/l|µmol\/l|umol\/l|\/cumm|cells|thou\/µl|fl|pg|mm\/hr|ui[uU]\/ml|ng\/ml|pg\/ml|%)\b/i.test(line);
            const hasRefSyntax = /\b(ref|range|interval|normal|\d+\s*[\-\–]\s*\d+)\b/i.test(line);
            if (!hasLabContext && !hasClinicalUnit && !hasRefSyntax) {
              return false;
            }
          }

          return true;
        });

        if (matchesAlias) {
          let matchedAliasStr = "";
          for (const alias of rule.aliases) {
            if (lowerLine.includes(alias)) {
              matchedAliasStr = alias;
              break;
            }
          }

          // Extract text portion following test name
          let textAfterAlias = line;
          if (matchedAliasStr) {
            const escaped = matchedAliasStr.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            const pos = line.search(new RegExp(escaped, 'i'));
            if (pos !== -1) {
              textAfterAlias = line.slice(pos + matchedAliasStr.length);
            }
          }

          // Strip brackets like "(25-OH)", "(Hb)", "(eAG)", etc.
          textAfterAlias = textAfterAlias.replace(/^\s*[\(\[][^\)\]]*[\)\]]/, "").replace(/^[\s:\-\=]+/, "");

          // Find observed numeric value and unit
          const numMatch = textAfterAlias.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z\/µ%]+)?/);
          const lineNumMatch = line.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z\/µ%]+)?/);
          const rawVal = numMatch ? numMatch[1] : (lineNumMatch ? lineNumMatch[1] : null);
          const rawUnit = numMatch && numMatch[2] ? numMatch[2] : (lineNumMatch && lineNumMatch[2] ? lineNumMatch[2] : rule.unit);

          if (rawVal !== null) {
            // 1. Unit Normalization
            const norm = this.normalizeUnitAndValue(rawVal, rawUnit, rule.param);
            const valNum = norm.val;

            if (valNum !== null && !isNaN(valNum) && valNum > 0) {
              seenParams.add(rule.param);
              matchedLineIndices.add(i);

              // 2. Biological Plausibility Cross-Check
              const plausibility = this.validateBiologicalPlausibility(valNum, rule);

              if (!plausibility.isPlausible) {
                artifacts.push({
                  test: rule.param,
                  organSystem: rule.organSystem,
                  category: rule.category,
                  value: `${valNum.toFixed(2)} ${rule.unit}`,
                  ref: rule.refString,
                  status: `[PARSING ARTIFACT / OUTSIDE BIOLOGICAL PLAUSIBILITY] ${plausibility.reason}`,
                  alertLevel: "artifact"
                });
                continue;
              }

              // 3. Clinical Evaluation
              const isHigh = valNum > rule.refMax;
              const isLow = valNum < rule.refMin;

              if (isHigh) {
                const isCritical = valNum >= rule.criticalHigh;
                flags.push({
                  test: rule.param,
                  organSystem: rule.organSystem,
                  category: rule.category,
                  value: `${valNum.toFixed(2)} ${rule.unit}`,
                  ref: rule.refString,
                  status: isCritical ? rule.criticalHighMessage : rule.highMessage,
                  alertLevel: isCritical ? "danger" : "warning"
                });
              } else if (isLow) {
                const isCritical = valNum <= rule.criticalLow;
                flags.push({
                  test: rule.param,
                  organSystem: rule.organSystem,
                  category: rule.category,
                  value: `${valNum.toFixed(2)} ${rule.unit}`,
                  ref: rule.refString,
                  status: isCritical ? `CRITICAL LOW` : rule.lowMessage,
                  alertLevel: isCritical ? "danger" : "warning"
                });
              } else {
                normalValues.push({
                  test: rule.param,
                  organSystem: rule.organSystem,
                  category: rule.category,
                  value: `${valNum.toFixed(2)} ${rule.unit}`,
                  ref: rule.refString,
                  status: "Normal (Within Reference Interval)"
                });
              }
            }
          }
        }
      }

      // Dynamic Tabular Fallback for custom lab tests
      if (!matchedLineIndices.has(i)) {
        const dynamicResult = this.parseGenericTabularLine(line);
        if (dynamicResult && !seenParams.has(dynamicResult.test)) {
          seenParams.add(dynamicResult.test);
          if (dynamicResult.isAbnormal) {
            flags.push(dynamicResult);
          } else {
            normalValues.push(dynamicResult);
          }
        }
      }
    }

    // 4. Syndromic Organ-System Grouping Layer
    const syndromicSummary = {};
    Object.values(ORGAN_SYSTEMS).forEach(sys => {
      syndromicSummary[sys] = {
        abnormal: flags.filter(f => f.organSystem === sys),
        normal: normalValues.filter(n => n.organSystem === sys),
        artifacts: artifacts.filter(a => a.organSystem === sys)
      };
    });

    // Build synthesized clinical text breakdown
    const summarySections = [];
    Object.entries(syndromicSummary).forEach(([systemName, group]) => {
      if (group.abnormal.length > 0 || group.normal.length > 0 || group.artifacts.length > 0) {
        summarySections.push(`\n### ${systemName}:`);
        if (group.abnormal.length > 0) {
          group.abnormal.forEach(f => {
            summarySections.push(`  ⚠️ **${f.test}**: ${f.value} [Ref: ${f.ref}] — *${f.status}*`);
          });
        }
        if (group.normal.length > 0) {
          const normalNames = group.normal.map(n => `${n.test} (${n.value})`).join(", ");
          summarySections.push(`  ✅ *Normal*: ${normalNames}`);
        }
        if (group.artifacts.length > 0) {
          group.artifacts.forEach(a => {
            summarySections.push(`  🚫 *Excluded Artifact*: ${a.test} = ${a.value} (${a.status})`);
          });
        }
      }
    });

    let clinicalImpression = "";
    if (flags.length > 0) {
      const topFlagNames = flags.map(f => `${f.test} (${f.value})`);
      clinicalImpression = `Abnormal Biomarkers Detected across ${Object.values(syndromicSummary).filter(s => s.abnormal.length > 0).length} Organ Systems:\n• ` + topFlagNames.join("\n• ");
    } else {
      clinicalImpression = `All ${normalValues.length} extracted clinical biomarkers are within physiological reference intervals.`;
    }

    return {
      flags,
      normalValues,
      artifacts,
      syndromicSummary,
      formattedSyndromicText: summarySections.join("\n"),
      summary: clinicalImpression
    };
  }
}

export const labParser = new LabParser();

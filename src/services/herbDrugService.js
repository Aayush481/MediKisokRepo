/**
 * India's 1st Dual Allopathy + AYUSH Herb-Drug Interaction (HDI) Engine
 * MediKiosk 2.0 Innovation: Detects hidden contraindications between Allopathic drugs & Ayurvedic remedies
 */

export const HERB_DRUG_DATABASE = [
  {
    drug: "Aspirin",
    drugClass: "Antiplatelet / NSAID",
    herb: "Guggulu",
    herbBotanical: "Commiphora mukul",
    severity: "CRITICAL",
    category: "Coagulation Conflict",
    mechanism: "Synergistic inhibition of platelet aggregation and thromboxane synthesis.",
    clinicalEffect: "Significant elevation in internal gastrointestinal hemorrhage and spontaneous bleeding risk.",
    recommendation: "Hold Guggulu therapy immediately while patient is on antiplatelet therapy. Monitor INR/bleeding parameters."
  },
  {
    drug: "Aspirin",
    drugClass: "Antiplatelet / NSAID",
    herb: "Lashuna (Garlic Extract)",
    herbBotanical: "Allium sativum",
    severity: "CRITICAL",
    category: "Coagulation Conflict",
    mechanism: "Allicin compounds inhibit platelet cyclooxygenase and prolong bleeding time.",
    clinicalEffect: "Potentiates antiplatelet effect of Aspirin, increasing risk of surgical bleeding and petechiae.",
    recommendation: "Limit concentrated garlic extract supplements; advise dietary quantities only."
  },
  {
    drug: "Metformin",
    drugClass: "Oral Hypoglycemic (Biguanide)",
    herb: "Karela (Bitter Gourd)",
    herbBotanical: "Momordica charantia",
    severity: "MAJOR",
    category: "Metabolic Synergism",
    mechanism: "Charantin and polypeptide-p mimic insulin action additively with Metformin.",
    clinicalEffect: "High risk of sudden, severe hypoglycemia and diaphoresis, especially in elderly fasting patients.",
    recommendation: "Adjust Metformin dosage or space Karela juice consumption; mandate continuous blood glucose logging."
  },
  {
    drug: "Atorvastatin",
    drugClass: "HMG-CoA Reductase Inhibitor",
    herb: "Yashtimadhu (Licorice)",
    herbBotanical: "Glycyrrhiza glabra",
    severity: "MODERATE",
    category: "Hepatic & Electrolyte Conflict",
    mechanism: "Glycyrrhizin inhibits 11-beta-HSD2 enzyme, promoting sodium retention and potassium wasting.",
    clinicalEffect: "Blunts antihypertensive response and exacerbates statin-induced myopathy / muscle soreness.",
    recommendation: "Check serum potassium; avoid high-dose licorice decoctions with statins."
  },
  {
    drug: "Telmisartan",
    drugClass: "Angiotensin II Receptor Blocker (ARB)",
    herb: "Ashwagandha",
    herbBotanical: "Withania somnifera",
    severity: "MODERATE",
    category: "Hemodynamic Synergism",
    mechanism: "Withanolides exert central GABAergic sedation and mild peripheral vasodilation.",
    clinicalEffect: "Additive hypotensive effect leading to orthostatic dizziness upon standing.",
    recommendation: "Advise patient to take Ashwagandha at bedtime; monitor seated vs. standing blood pressure."
  },
  {
    drug: "Warfarin",
    drugClass: "Vitamin K Antagonist",
    herb: "Giloy (Guduchi)",
    herbBotanical: "Tinospora cordifolia",
    severity: "MAJOR",
    category: "Immuno-Metabolic Conflict",
    mechanism: "Immunomodulatory diterpenes alter hepatic cytochrome P450 CYP2C9 clearance.",
    clinicalEffect: "Fluctuating INR levels, increasing thromboembolism or bleeding episodes.",
    recommendation: "Frequent PT/INR testing required; maintain consistent herbal intake without sudden spikes."
  }
];

class HerbDrugService {
  /**
   * Analyze active medications against reported herbs
   */
  evaluateInteractions(allopathicMeds = [], ayushHerbs = []) {
    const conflicts = [];

    // Normalize drug and herb names
    const drugNames = allopathicMeds.map(m => (typeof m === "string" ? m : m.name || "").toLowerCase());
    const herbNames = ayushHerbs.map(h => (typeof h === "string" ? h : h.name || "").toLowerCase());

    for (const rule of HERB_DRUG_DATABASE) {
      const ruleDrug = rule.drug.toLowerCase();
      const ruleHerbFull = rule.herb.toLowerCase();
      const ruleHerbRoot = rule.herb.split(/[\s(]/)[0].toLowerCase();
      const ruleBotanical = (rule.herbBotanical || "").toLowerCase();

      const matchDrug = drugNames.some(d => d.includes(ruleDrug) || ruleDrug.includes(d));
      const matchHerb = herbNames.some(h => 
        h.includes(ruleHerbFull) ||
        h.includes(ruleHerbRoot) ||
        ruleHerbFull.includes(h) ||
        (ruleBotanical && (h.includes(ruleBotanical) || ruleBotanical.includes(h)))
      );

      if (matchDrug && matchHerb) {
        conflicts.push({
          ...rule,
          timestamp: new Date().toISOString()
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      count: conflicts.length,
      criticalCount: conflicts.filter(c => c.severity === "CRITICAL").length,
      conflicts
    };
  }
}

export const herbDrugService = new HerbDrugService();

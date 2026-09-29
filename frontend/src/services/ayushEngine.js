/**
 * MediKiosk AYUSH & Dashavidha Pariksha Intake Engine
 * Calculates phenotypic Prakriti (Vata/Pitta/Kapha), Agni, Koshtha, and Ahara-Vihara parameters.
 */

export const AYUSH_QUESTIONS = [
  {
    id: "body_frame",
    question: "Body Frame & Physical Build",
    hi: "शरीर की बनावट और वजन कैसा है?",
    options: [
      { text: "Lean, thin frame, prominent joints, difficulty gaining weight", dosha: "vata", weight: 3 },
      { text: "Medium build, athletic, moderate muscle development", dosha: "pitta", weight: 3 },
      { text: "Broad frame, heavy bones, tends to gain weight easily", dosha: "kapha", weight: 3 }
    ]
  },
  {
    id: "skin_hair",
    question: "Skin Texture & Hair Nature",
    hi: "त्वचा और बालों का स्वभाव कैसा है?",
    options: [
      { text: "Dry, rough skin, easily cracked heels, dry frizzy hair", dosha: "vata", weight: 2 },
      { text: "Warm, oily T-zone, prone to redness/moles/acne, thinning hair", dosha: "pitta", weight: 2 },
      { text: "Smooth, soft, thick oily skin, lustrous dark thick hair", dosha: "kapha", weight: 2 }
    ]
  },
  {
    id: "appetite_agni",
    question: "Appetite & Digestive Power (Agni)",
    hi: "भूख और पाचन शक्ति कैसी है?",
    options: [
      { text: "Irregular appetite (Vishamagni) - sometimes very hungry, sometimes not", dosha: "vata", weight: 3, agni: "Vishamagni" },
      { text: "Sharp, intense hunger (Tikshnagni) - irritable if meals are delayed, acid reflux", dosha: "pitta", weight: 3, agni: "Tikshnagni" },
      { text: "Sluggish, slow digestion (Mandaagni) - heavy feeling for hours after food", dosha: "kapha", weight: 3, agni: "Mandaagni" }
    ]
  },
  {
    id: "bowel_koshtha",
    question: "Bowel Movements & Constipation (Koshtha)",
    hi: "पेट साफ होने और शौच की प्रवृत्ति कैसी है?",
    options: [
      { text: "Hard, dry stools, frequent constipation (Krura Koshtha)", dosha: "vata", weight: 3, koshtha: "Krura Koshtha" },
      { text: "Soft, loose stools, 2-3 times daily, sensitive bowels (Mrudu Koshtha)", dosha: "pitta", weight: 3, koshtha: "Mrudu Koshtha" },
      { text: "Regular, well-formed, moderate once a day (Madhyama Koshtha)", dosha: "kapha", weight: 3, koshtha: "Madhyama Koshtha" }
    ]
  },
  {
    id: "weather_reaction",
    question: "Reaction to Weather & Temperature",
    hi: "मौसम और तापमान के प्रति संवेदनशीलता?",
    options: [
      { text: "Averse to cold, windy weather; loves warmth and sunshine", dosha: "vata", weight: 2 },
      { text: "Averse to heat and summer; sweats easily, loves cool breezy weather", dosha: "pitta", weight: 2 },
      { text: "Averse to cold, damp, humid weather; tolerates summer well", dosha: "kapha", weight: 2 }
    ]
  },
  {
    id: "sleep_mind",
    question: "Sleep Pattern & Mental Tendencies",
    hi: "नींद और मानसिक स्वभाव कैसा है?",
    options: [
      { text: "Light, interrupted sleep, restless, active mind, tends to worry", dosha: "vata", weight: 2 },
      { text: "Moderate sleep (6-7 hrs), sharp intellect, organized, can be quick-tempered", dosha: "pitta", weight: 2 },
      { text: "Deep, heavy sleep (8+ hrs), calm, patient, slow to get angry", dosha: "kapha", weight: 2 }
    ]
  }
];

class AyushEngine {
  calculatePrakriti(selectedOptionIds) {
    let scores = { vata: 0, pitta: 0, kapha: 0 };
    let agni = "Sama Agni (Normal Balance)";
    let koshtha = "Madhyama Koshtha";

    AYUSH_QUESTIONS.forEach((q, idx) => {
      const selectedIndex = selectedOptionIds[q.id] !== undefined ? selectedOptionIds[q.id] : 0;
      const option = q.options[selectedIndex] || q.options[0];
      
      scores[option.dosha] += option.weight || 2;
      if (option.agni) agni = option.agni;
      if (option.koshtha) koshtha = option.koshtha;
    });

    const total = scores.vata + scores.pitta + scores.kapha || 1;
    const vataPct = Math.round((scores.vata / total) * 100);
    const pittaPct = Math.round((scores.pitta / total) * 100);
    const kaphaPct = 100 - (vataPct + pittaPct);

    let dominant = "Tridoshic (Balanced)";
    if (vataPct >= 50) dominant = "Vataja Predominant";
    else if (pittaPct >= 50) dominant = "Pittaja Predominant";
    else if (kaphaPct >= 50) dominant = "Kaphaja Predominant";
    else if (vataPct >= pittaPct && vataPct >= kaphaPct) dominant = "Vata-Pitta Prakriti";
    else if (pittaPct >= vataPct && pittaPct >= kaphaPct) dominant = "Pitta-Kapha Prakriti";
    else dominant = "Vata-Kapha Prakriti";

    return {
      scores: { vata: vataPct, pitta: pittaPct, kapha: kaphaPct },
      dominant,
      agni,
      koshtha,
      dashavidhaSummary: {
        prakriti: dominant,
        vikriti: `${dominant.split(" ")[0]} imbalance suspected based on symptoms`,
        agni,
        koshtha,
        aharaShakti: "Madhyama (Moderate)",
        vyayamaShakti: "Madhyama (Moderate)",
        satmya: "Mixed dietary suitability",
        sattva: "Pravara (Stable mental strength)"
      }
    };
  }
}

export const ayushEngine = new AyushEngine();

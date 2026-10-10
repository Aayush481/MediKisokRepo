/**
 * MediKiosk Versioned Clinical Question Banks
 * Structured upon OPQRST / SOCRATES clinical history methodology.
 * Each organ bank references formal medical society guidelines and is flagged for clinician validation.
 */

export const QUESTION_BANK_VERSION = "2.1.0-SIH2026";

export const ORGAN_QUESTION_BANKS = {
  // ========================================================
  // 1. HEART / CHEST (Cardiovascular)
  // ========================================================
  organ_heart: {
    organId: "organ_heart",
    title: "Cardiovascular / Heart History",
    clinicalGuideline: "2021 AHA/ACC/ASE/CHEST Guideline for the Evaluation and Diagnosis of Chest Pain",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_CARDIO_ISCHEMIA_FULL",
        criteria: (answers) => {
          const char = answers.heart_character || "";
          const rad = answers.heart_radiation || [];
          const assoc = answers.heart_associated || [];
          const sev = answers.severity || 0;
          return (
            (char.includes("crushing") || char.includes("pressure")) &&
            (rad.includes("left_arm") || rad.includes("jaw")) &&
            (assoc.includes("sweating") || assoc.includes("breathlessness") || sev >= 7)
          );
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Acute Coronary Syndrome (ACS) / Acute Myocardial Infarction. Immediate 12-lead ECG and emergency cardiac triage required."
      },
      {
        ruleId: "RED_CARDIO_SYNCOPE",
        criteria: (answers) => (answers.heart_associated || []).includes("fainting"),
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Chest discomfort accompanied by syncope/loss of consciousness. High risk for malignant cardiac arrhythmia or aortic dissection."
      }
    ],
    questions: [
      {
        id: "heart_onset",
        type: "single_choice",
        prompt: "When did the chest discomfort begin, and how fast did it develop?",
        prompt_hi: "छाती में यह तकलीफ कब शुरू हुई और कैसे बढ़ी?",
        options: [
          { value: "sudden_severe", label: "Sudden onset - reached peak intensity within minutes", label_hi: "अचानक - कुछ ही मिनटों में तीव्र हो गई" },
          { value: "gradual_hours", label: "Gradual onset over several hours", label_hi: "धीरे-धीरे - कुछ घंटों में बढ़ी" },
          { value: "recurrent_exertion", label: "Recurrent episodes triggered by physical exertion or stress", label_hi: "चलने-फिरने या तनाव में बार-बार होने वाला दर्द" },
          { value: "chronic_weeks", label: "Long-standing or chronic mild ache (>2 weeks)", label_hi: "हफ्तों से बना हुआ हल्का दर्द" }
        ],
        required: true
      },
      {
        id: "heart_character",
        type: "single_choice",
        prompt: "How does the chest sensation feel?",
        prompt_hi: "छाती में दर्द या असहजता किस तरह की महसूस होती है?",
        options: [
          { value: "crushing_heaviness", label: "Crushing heaviness, tight constriction or elephant on chest", label_hi: "भारी दबाव, जकड़न या भारीपन" },
          { value: "burning_substernal", label: "Burning retrosternal discomfort (like severe heartburn)", label_hi: "छाती के बीच में तेज जलन" },
          { value: "sharp_pleuritic", label: "Sharp stabbing pain worsening with deep inhalation or coughing", label_hi: "सांस लेने या खांसने पर तेज चुभन" },
          { value: "dull_diffuse", label: "Dull, non-descript ache", label_hi: "हल्का फैला हुआ दर्द" }
        ],
        required: true
      },
      {
        id: "heart_radiation",
        type: "multi_choice",
        prompt: "Does the discomfort radiate or spread anywhere else?",
        prompt_hi: "क्या यह दर्द शरीर के किसी अन्य हिस्से में फैलता है?",
        options: [
          { value: "left_arm", label: "Radiates down the left arm or shoulder", label_hi: "बाएं हाथ या कंधे में फैलता है" },
          { value: "jaw_neck", label: "Radiates up to neck, jaw, or teeth", label_hi: "गर्दन, जबड़े या दांतों तक फैलता है" },
          { value: "back_interscapular", label: "Radiates straight through to the back (between shoulder blades)", label_hi: "पीठ के बीच दोनों कंधों के बीच" },
          { value: "none_localized", label: "No radiation - stays in one fixed area", label_hi: "कहीं नहीं फैलता, एक ही जगह रहता है" }
        ],
        required: true
      },
      {
        id: "heart_provocation",
        type: "single_choice",
        prompt: "What changes the severity of the sensation?",
        prompt_hi: "किस चीज़ से तकलीफ घटती या बढ़ती है?",
        options: [
          { value: "worse_walking", label: "Worsens with walking/climbing stairs, eases with rest", label_hi: "चलने पर बढ़ता है, आराम करने पर घटता है" },
          { value: "worse_lying_flat", label: "Worse lying flat, relieved by sitting forward", label_hi: "सीधे लेटने पर बढ़ता है, आगे झुककर बैठने पर आराम" },
          { value: "worse_after_meals", label: "Worse after spicy/heavy meals or bending over", label_hi: "भारी या तीखा खाना खाने के बाद बढ़ता है" },
          { value: "no_change", label: "Constant - posture or walking makes no difference", label_hi: "लगातार एक जैसा रहता है" }
        ],
        required: false
      },
      {
        id: "heart_associated",
        type: "multi_choice",
        prompt: "Are you currently experiencing any of these associated symptoms?",
        prompt_hi: "क्या साथ में इनमें से कोई अन्य लक्षण भी हैं?",
        options: [
          { value: "sweating", label: "Profuse cold sweating / clamminess (Diaphoresis)", label_hi: "ठंडा पसीना छूटना" },
          { value: "breathlessness", label: "Sudden breathlessness or difficulty breathing", label_hi: "सांस फूलना या सांस लेने में भारीपन" },
          { value: "palpitations", label: "Rapid, fluttering or irregular heartbeat", label_hi: "दिल की तेज धड़कन / घबराहट" },
          { value: "nausea", label: "Nausea or feeling faint", label_hi: "उल्टी का मन या चक्कर आना" },
          { value: "fainting", label: "Blackout / loss of consciousness", label_hi: "बेहोशी या आंखों के आगे अंधेरा" }
        ],
        required: true
      }
    ]
  },

  // ========================================================
  // 2. KIDNEY / FLANK (Urinary & Renal)
  // ========================================================
  organ_kidney_l: {
    organId: "organ_kidney_l",
    title: "Left Kidney / Flank History",
    clinicalGuideline: "KDIGO Clinical Practice Guideline for Acute Kidney Injury & EAU Urolithiasis Guidelines",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_RENAL_ANURIA",
        criteria: (answers) => answers.kidney_urine_output === "no_urine_8h",
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Acute Anuria (inability to pass urine for >8 hours). Urgent risk of Acute Renal Failure / obstructive uropathy."
      },
      {
        ruleId: "RED_RENAL_PYELONEPHRITIS_SEPSIS",
        criteria: (answers) => {
          const sys = answers.kidney_systemic || [];
          return sys.includes("high_fever_rigors") && (sys.includes("altered_sensorium") || sys.includes("vomiting_intractable"));
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Acute Pyelonephritis with Urosepsis risk. Urgent IV antibiotics and inpatient renal stabilization needed."
      },
      {
        ruleId: "RED_RENAL_GROSS_HEMATURIA",
        criteria: (answers) => answers.kidney_urine_color === "gross_blood",
        urgency: "URGENT_PRIORITY_2",
        reason: "Gross hematuria (visible blood/clots in urine). Prompt clinical investigation for calculus, glomerulonephritis, or mass lesion required."
      }
    ],
    questions: [
      {
        id: "kidney_pain_side",
        type: "single_choice",
        prompt: "Where is the flank or back discomfort centered?",
        prompt_hi: "पीठ या कमर के किस हिस्से में दर्द अधिक है?",
        options: [
          { value: "left_flank", label: "Left flank / lower back below left ribcage", label_hi: "बाएं हिस्से में, पसलियों के नीचे कमर में" },
          { value: "bilateral_flanks", label: "Both left and right flanks equally", label_hi: "दोनों तरफ कमर में बराबर" },
          { value: "lower_pelvic", label: "Lower abdomen above pubic bone", label_hi: "नाभि के नीचे पेड़ू में" }
        ],
        required: true
      },
      {
        id: "kidney_character",
        type: "single_choice",
        prompt: "How does the pain behave?",
        prompt_hi: "दर्द का रूप कैसा है?",
        options: [
          { value: "colicky_spasms", label: "Colicky: Severe wave-like spasms that peak and ease (Renal colic)", label_hi: "मरोड़ जैसा तेज दर्द जो लहरों में बढ़ता और घटता है" },
          { value: "dull_continuous", label: "Constant, heavy dull ache deep in the flank", label_hi: "लगातार बना रहने वाला भारी दर्द" },
          { value: "sharp_movement", label: "Sharp pain primarily on twisting or bending spine", label_hi: "झुकने या मुड़ने पर तेज चुभन" }
        ],
        required: true
      },
      {
        id: "kidney_radiation",
        type: "single_choice",
        prompt: "Does the pain travel downwards towards your groin?",
        prompt_hi: "क्या दर्द नीचे की ओर जांघ या जननांगों की तरफ बढ़ता है?",
        options: [
          { value: "radiates_groin", label: "Yes - shoots downward to groin / testicle / labia", label_hi: "हाँ - नीचे जांघ व जननांगों की ओर फैलता है" },
          { value: "localized_back", label: "No - stays strictly in the flank/back area", label_hi: "नहीं - केवल कमर में रहता है" }
        ],
        required: true
      },
      {
        id: "kidney_urine_color",
        type: "single_choice",
        prompt: "Have you observed any changes in your urine appearance?",
        prompt_hi: "पेशाब के रंग में कोई बदलाव देखा है?",
        options: [
          { value: "gross_blood", label: "Red or cola-colored with visible blood (Gross Hematuria)", label_hi: "लाल या कोला जैसा रंग / खून आना" },
          { value: "cloudy_foul", label: "Cloudy, turbid with strong foul odor", label_hi: "धुंधला और बदबूदार पेशाब" },
          { value: "dark_concentrated", label: "Dark amber / concentrated", label_hi: "गहरा पीला पेशाब" },
          { value: "normal_clear", label: "Normal clear pale yellow", label_hi: "सामान्य साफ पेशाब" }
        ],
        required: true
      },
      {
        id: "kidney_urine_output",
        type: "single_choice",
        prompt: "How is your urine flow and volume?",
        prompt_hi: "पेशाब की मात्रा और बहाव कैसा है?",
        options: [
          { value: "no_urine_8h", label: "Inability to pass any urine for more than 8 hours (Anuria)", label_hi: "8 घंटे से अधिक समय से पेशाब बिल्कुल नहीं उतरा" },
          { value: "burning_frequency", label: "Intense burning (dysuria) and passing drops frequently", label_hi: "पेशाब में तेज जलन और बार-बार थोड़ा-थोड़ा आना" },
          { value: "reduced_amount", label: "Noticeably reduced total daily volume", label_hi: "पेशाब की कुल मात्रा में कमी" },
          { value: "normal_flow", label: "Normal volume and painless flow", label_hi: "सामान्य मात्रा और बिना जलन" }
        ],
        required: true
      },
      {
        id: "kidney_systemic",
        type: "multi_choice",
        prompt: "Are you having any of these general symptoms?",
        prompt_hi: "क्या इनमें से कोई अन्य लक्षण भी हैं?",
        options: [
          { value: "high_fever_rigors", label: "High fever with shaking chills / shivering", label_hi: "कंपाकंपी के साथ तेज बुखार" },
          { value: "vomiting_intractable", label: "Persistent vomiting and inability to keep fluids down", label_hi: "लगातार उल्टियां होना" },
          { value: "facial_puffiness", label: "Morning facial / eye puffiness or swollen ankles", label_hi: "सुबह चेहरे या पैरों में सूजन" },
          { value: "none", label: "None of these", label_hi: "इनमें से कोई नहीं" }
        ],
        required: false
      }
    ]
  },

  organ_kidney_r: {
    // Mirror of kidney_l with right flank laterality focus
    organId: "organ_kidney_r",
    title: "Right Kidney / Flank History",
    clinicalGuideline: "KDIGO Clinical Practice Guideline for Acute Kidney Injury & EAU Urolithiasis Guidelines",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_RENAL_ANURIA",
        criteria: (answers) => answers.kidney_urine_output === "no_urine_8h",
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Acute Anuria (>8 hours). Urgent clinical risk of obstructive nephropathy or renal shutdown."
      },
      {
        ruleId: "RED_RENAL_PYELONEPHRITIS_SEPSIS",
        criteria: (answers) => {
          const sys = answers.kidney_systemic || [];
          return sys.includes("high_fever_rigors") && sys.includes("vomiting_intractable");
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Right Pyelonephritis / Urosepsis. Urgent hospital evaluation needed."
      }
    ],
    questions: [
      {
        id: "kidney_pain_side",
        type: "single_choice",
        prompt: "Where is the right flank discomfort centered?",
        prompt_hi: "दाहिनी पीठ या कमर में दर्द कहाँ केंद्रित है?",
        options: [
          { value: "right_flank", label: "Right flank below right ribcage (must differentiate from liver/gallbladder)", label_hi: "दाहिनी कमर में, पसलियों के नीचे" },
          { value: "radiates_groin", label: "Shooting downward into right groin", label_hi: "दाहिनी जांघ की ओर फैलता हुआ" }
        ],
        required: true
      },
      {
        id: "kidney_character",
        type: "single_choice",
        prompt: "How does the pain behave?",
        prompt_hi: "दर्द का रूप कैसा है?",
        options: [
          { value: "colicky_spasms", label: "Colicky: Severe wave-like spasms (Renal colic)", label_hi: "मरोड़ जैसा तेज दर्द जो लहरों में बढ़ता और घटता है" },
          { value: "dull_continuous", label: "Constant, heavy dull ache", label_hi: "लगातार भारी दर्द" }
        ],
        required: true
      },
      {
        id: "kidney_urine_color",
        type: "single_choice",
        prompt: "Have you observed any changes in urine color?",
        prompt_hi: "पेशाब के रंग में बदलाव?",
        options: [
          { value: "gross_blood", label: "Red or cola-colored blood in urine", label_hi: "खून जैसा लाल या कोला रंग" },
          { value: "cloudy_foul", label: "Cloudy or burning", label_hi: "धुंधला या जलनयुक्त" },
          { value: "normal_clear", label: "Normal clear pale yellow", label_hi: "सामान्य" }
        ],
        required: true
      },
      {
        id: "kidney_urine_output",
        type: "single_choice",
        prompt: "How is your urine flow and volume?",
        prompt_hi: "पेशाब की मात्रा और बहाव?",
        options: [
          { value: "no_urine_8h", label: "No urine passed for >8 hours", label_hi: "8 घंटे से पेशाब नहीं हुआ" },
          { value: "burning_frequency", label: "Burning and high frequency", label_hi: "तेज जलन और बार-बार" },
          { value: "normal_flow", label: "Normal volume", label_hi: "सामान्य" }
        ],
        required: true
      },
      {
        id: "kidney_systemic",
        type: "multi_choice",
        prompt: "Are you having any chills or high fever?",
        prompt_hi: "तेज बुखार या कंपकंपी?",
        options: [
          { value: "high_fever_rigors", label: "High fever with shaking chills", label_hi: "कंपाकंपी के साथ तेज बुखार" },
          { value: "vomiting_intractable", label: "Persistent vomiting", label_hi: "लगातार उल्टियां" },
          { value: "none", label: "None", label_hi: "कोई नहीं" }
        ],
        required: false
      }
    ]
  },

  // ========================================================
  // 3. LIVER / RUQ (Gastroenterology & Hepatology)
  // ========================================================
  organ_liver: {
    organId: "organ_liver",
    title: "Hepatobiliary / Liver History",
    clinicalGuideline: "ACG Clinical Guideline: Evaluation of Abnormal Liver Chemistries & AASLD Cirrhosis Management",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_HEPATIC_GI_BLEED",
        criteria: (answers) => {
          const bleed = answers.liver_bleeding_signs || [];
          return bleed.includes("vomited_blood") || bleed.includes("black_tarry_stool");
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Acute Upper Gastrointestinal Bleed (Hematemesis / Melena) - Suspected Esophageal Variceal Bleed or bleeding peptic ulcer. Immediate ER resuscitation required."
      },
      {
        ruleId: "RED_HEPATIC_ENCEPHALOPATHY",
        criteria: (answers) => {
          const neuro = answers.liver_neuro || [];
          return neuro.includes("confusion_drowsiness") || neuro.includes("inverted_sleep_pattern");
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Hepatic Encephalopathy (Acute liver failure or decompensated cirrhosis). Immediate hospital admission needed."
      },
      {
        ruleId: "RED_HEPATIC_ACUTE_JAUNDICE_FEVER",
        criteria: (answers) => answers.liver_jaundice === "deep_yellow" && (answers.liver_associated || []).includes("high_fever_rigors"),
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Charcot's Triad (Jaundice + Fever/Chills + RUQ Pain) - Suspected Acute Ascending Cholangitis. Emergency ERCP/biliary drainage required."
      }
    ],
    questions: [
      {
        id: "liver_jaundice",
        type: "single_choice",
        prompt: "Have you or family members noticed yellow discoloration of your eyes or skin?",
        prompt_hi: "क्या आपकी आंखों या त्वचा में पीलापन (पीलिया) दिखाई दिया है?",
        options: [
          { value: "deep_yellow", label: "Noticeable yellowish eyes (sclera) and yellow skin (Jaundice)", label_hi: "हाँ - आंखें और त्वचा साफ पीली दिख रही हैं (पीलिया)" },
          { value: "dark_urine_pale_stool", label: "Dark mustard urine and unusually pale / clay-colored stool", label_hi: "सरसों जैसा गहरा पेशाब और मिट्टी जैसे हल्के रंग का मल" },
          { value: "mild_yellow_tint", label: "Mild tint only noticed recently", label_hi: "हल्का पीलापन जो हाल ही में शुरू हुआ" },
          { value: "no_jaundice", label: "No yellow discoloration", label_hi: "कोई पीलापन नहीं है" }
        ],
        required: true
      },
      {
        id: "liver_pain_character",
        type: "single_choice",
        prompt: "How does the upper right abdominal area feel?",
        prompt_hi: "पेट के ऊपरी दाहिने हिस्से (पसलियों के नीचे) में कैसा महसूस होता है?",
        options: [
          { value: "dull_heavy_fullness", label: "Dull, heavy aching fullness under right ribs", label_hi: "दाहिनी पसलियों के नीचे भारीपन और हल्का दर्द" },
          { value: "severe_post_fatty_meal", label: "Sudden intense colic 30-60 min after eating oily/fatty food", label_hi: "तैलीय खाना खाने के बाद तेज मरोड़दार दर्द" },
          { value: "swelling_distension", label: "Rapid abdominal swelling with fluid tightness (Ascites)", label_hi: "पेट का तेजी से फूलना / पानी भरना" },
          { value: "painless", label: "No local pain - constitutional symptoms only", label_hi: "दर्द नहीं है, केवल कमजोरी या थकान" }
        ],
        required: true
      },
      {
        id: "liver_bleeding_signs",
        type: "multi_choice",
        prompt: "Have you noticed any bleeding signs recently?",
        prompt_hi: "क्या हाल में खून बहने का कोई लक्षण देखा है?",
        options: [
          { value: "vomited_blood", label: "Vomited red blood or dark coffee-ground material (Hematemesis)", label_hi: "खून की उल्टी या काले रंग की उल्टी" },
          { value: "black_tarry_stool", label: "Passed black, sticky, tar-like foul stool (Melena)", label_hi: "काला, चिपचिपा व बदबूदार मल" },
          { value: "easy_bruising", label: "Easy bruising on skin or gum bleeding when brushing", label_hi: "त्वचा पर नीले निशान पड़ना या मसूड़ों से खून आना" },
          { value: "none", label: "None of these", label_hi: "इनमें से कोई नहीं" }
        ],
        required: true
      },
      {
        id: "liver_neuro",
        type: "multi_choice",
        prompt: "Have there been any mental or sleep changes?",
        prompt_hi: "क्या मानसिक स्थिति या नींद में कोई बदलाव आया है?",
        options: [
          { value: "confusion_drowsiness", label: "New confusion, slurred responses, or extreme drowsiness", label_hi: "उलझन, बहकी बातें या अत्यधिक सुस्ती" },
          { value: "inverted_sleep_pattern", label: "Awake all night and sleeping all day", label_hi: "रात भर जागना और दिन में सोना" },
          { value: "hand_tremor", label: "Flapping tremor of hands when outstretched (Asterixis)", label_hi: "हाथ आगे करने पर हाथों का कांपना" },
          { value: "alert_normal", label: "Completely alert and normal mental clarity", label_hi: "मानसिक रूप से पूरी तरह सजग व सामान्य" }
        ],
        required: false
      },
      {
        id: "liver_medication_exposures",
        type: "multi_choice",
        prompt: "Any relevant medication, alcohol, or herbal exposures?",
        prompt_hi: "क्या इनमें से किसी का सेवन करते हैं?",
        options: [
          { value: "alcohol_regular", label: "Regular or heavy alcohol consumption", label_hi: "नियमित या अधिक शराब का सेवन" },
          { value: "high_paracetamol", label: "Frequent/high doses of Paracetamol or pain relievers", label_hi: "पैरासिटामोल या दर्द निवारक दवाओं का अधिक सेवन" },
          { value: "unverified_herbs", label: "Unlabeled powders, heavy metal bhasmas, or indigenous herbs", label_hi: "अनजानी जड़ी-बूटियाँ या भस्म" },
          { value: "none", label: "None of these", label_hi: "कोई नहीं" }
        ],
        required: false
      }
    ]
  },

  // ========================================================
  // 4. LUNGS / RESPIRATORY
  // ========================================================
  organ_lungs: {
    organId: "organ_lungs",
    title: "Respiratory / Pulmonary History",
    clinicalGuideline: "British Thoracic Society (BTS) & GINA Guidelines",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_RESP_STRIDOR_CYANOSIS",
        criteria: (answers) => (answers.lungs_severity_signs || []).includes("blue_lips_cyanosis"),
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Cyanosis / Acute Hypoxia. Immediate supplemental oxygen and airway resuscitation required."
      },
      {
        ruleId: "RED_RESP_HEMOPTYSIS",
        criteria: (answers) => answers.lungs_cough_character === "hemoptysis",
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Active Hemoptysis (coughing up fresh blood). Risk of pulmonary embolism, tuberculosis, or vascular rupture."
      }
    ],
    questions: [
      {
        id: "lungs_dyspnea_onset",
        type: "single_choice",
        prompt: "When does the breathlessness occur?",
        prompt_hi: "सांस की तकलीफ कब होती है?",
        options: [
          { value: "at_rest", label: "Severe breathlessness even while sitting resting", label_hi: "बैठे-बैठे भी तेज सांस फूलना" },
          { value: "on_minimal_walking", label: "Breathless walking on flat ground <100 meters", label_hi: "थोड़ा सा चलने पर ही सांस फूलना" },
          { value: "during_night", label: "Waking up gasping for air 2 hours after sleeping (PND)", label_hi: "रात को सोते समय अचानक सांस घुटने से आंख खुलना" },
          { value: "only_strenuous", label: "Only during vigorous climbing or running", label_hi: "केवल भारी मेहनत या दौड़ने पर" }
        ],
        required: true
      },
      {
        id: "lungs_cough_character",
        type: "single_choice",
        prompt: "Is there an associated cough or sputum?",
        prompt_hi: "क्या खांसी या बलगम की समस्या है?",
        options: [
          { value: "hemoptysis", label: "Coughing up fresh blood or blood-streaked sputum", label_hi: "खांसी में खून या खून से सना बलगम आना" },
          { value: "purulent_sputum", label: "Thick yellow-green foul sputum", label_hi: "गाढ़ा पीला या हरा बलगम" },
          { value: "dry_wheezy", label: "Dry persistent cough with audible wheezing/whistling", label_hi: "सूखी खांसी और सीटी जैसी आवाज" },
          { value: "no_cough", label: "No cough", label_hi: "खांसी नहीं है" }
        ],
        required: true
      },
      {
        id: "lungs_severity_signs",
        type: "multi_choice",
        prompt: "Any of these severe respiratory warning signs?",
        prompt_hi: "क्या इनमें से कोई गंभीर लक्षण हैं?",
        options: [
          { value: "blue_lips_cyanosis", label: "Bluish discoloration of lips, tongue, or fingertips (Cyanosis)", label_hi: "होंठों या नाखूनों का नीला पड़ना" },
          { value: "unable_complete_sentences", label: "Unable to speak full sentences in one breath", label_hi: "एक सांस में पूरी बात न बोल पाना" },
          { value: "chest_tightness", label: "Chest feeling squeezed tight", label_hi: "छाती में तेज जकड़न" },
          { value: "none", label: "None", label_hi: "कोई नहीं" }
        ],
        required: false
      }
    ]
  },

  // ========================================================
  // 5. STOMACH / UPPER GI
  // ========================================================
  organ_stomach: {
    organId: "organ_stomach",
    title: "Gastric / Upper GI History",
    clinicalGuideline: "ACG Dyspepsia & Peptic Ulcer Disease Guidelines",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_GASTRIC_PERFORATION",
        criteria: (answers) => answers.stomach_onset === "sudden_board_rigid" && (answers.severity || 0) >= 8,
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Sudden excruciating epigastric pain with board-like abdomen (Suspected Perforated Peptic Ulcer). Immediate surgical consult."
      }
    ],
    questions: [
      {
        id: "stomach_onset",
        type: "single_choice",
        prompt: "How did the stomach pain start?",
        prompt_hi: "पेट दर्द कैसे शुरू हुआ?",
        options: [
          { value: "sudden_board_rigid", label: "Sudden explosive pain like being stabbed, belly turned rigid", label_hi: "अचानक तेज चुभन जैसा असहनीय दर्द, पेट एकदम सख्त" },
          { value: "burning_after_meals", label: "Burning pain 1-2 hours after food intake", label_hi: "खाना खाने के 1-2 घंटे बाद जलनदार दर्द" },
          { value: "empty_stomach_worse", label: "Gnawing pain relieved by food or antacids", label_hi: "खाली पेट दर्द बढ़ना, खाने पर आराम" },
          { value: "bloating_gas", label: "Mild bloating and acid reflux", label_hi: "हल्की गैस और खट्टी डकारें" }
        ],
        required: true
      },
      {
        id: "stomach_alarm_signs",
        type: "multi_choice",
        prompt: "Have you experienced any of these alarm symptoms?",
        prompt_hi: "क्या इनमें से कोई चेतावनी लक्षण हैं?",
        options: [
          { value: "dysphagia", label: "Difficulty swallowing food / food sticking in chest", label_hi: "खाना निगलने में रुकावट या दर्द" },
          { value: "unexplained_weight_loss", label: "Unintentional significant weight loss", label_hi: "बिना कारण वजन घटना" },
          { value: "recurrent_vomiting", label: "Daily vomiting of food eaten hours prior", label_hi: "बार-बार खाया हुआ खाना उल्टी में निकलना" },
          { value: "none", label: "None of these", label_hi: "कोई नहीं" }
        ],
        required: true
      }
    ]
  },

  // ========================================================
  // 6. BRAIN / NEUROLOGICAL
  // ========================================================
  organ_brain: {
    organId: "organ_brain",
    title: "Brain & Neurological History",
    clinicalGuideline: "AHA/ASA Stroke Guidelines & ICHD-3 Headache Classification",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_STROKE_FAST",
        criteria: (answers) => {
          const fast = answers.brain_fast_signs || [];
          return fast.includes("facial_droop") || fast.includes("arm_weakness") || fast.includes("speech_slurred");
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Acute FAST Stroke Warning Signs detected (Face Droop / Arm Weakness / Slurred Speech). Immediate Stroke Code / Emergency CT brain within golden hour!"
      },
      {
        ruleId: "RED_THUNDERCLAP_HEADACHE",
        criteria: (answers) => answers.brain_headache_type === "thunderclap_peak_instant",
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Thunderclap Headache (Worst headache of life peaking within seconds). Rule out Subarachnoid Hemorrhage (SAH)."
      }
    ],
    questions: [
      {
        id: "brain_fast_signs",
        type: "multi_choice",
        prompt: "Have you or anyone noticed sudden FAST neurological signs?",
        prompt_hi: "क्या इनमें से कोई अचानक शुरू हुए न्यूरो लक्षण हैं?",
        options: [
          { value: "facial_droop", label: "Facial asymmetry / one side of mouth drooping", label_hi: "मुंह का एक तरफ टेढ़ा होना" },
          { value: "arm_weakness", label: "Sudden arm or leg weakness / inability to lift arm", label_hi: "एक हाथ या पैर में अचानक कमजोरी या सुन्नपन" },
          { value: "speech_slurred", label: "Slurred speech or difficulty finding words", label_hi: "बोली में लड़खड़ाहट या बोलने में असमर्थता" },
          { value: "vision_loss", label: "Sudden loss of vision in one or both eyes", label_hi: "अचानक एक या दोनों आंखों की रोशनी जाना" },
          { value: "none", label: "None of these", label_hi: "इनमें से कोई नहीं" }
        ],
        required: true
      },
      {
        id: "brain_headache_type",
        type: "single_choice",
        prompt: "If you have a headache, what was the onset pattern?",
        prompt_hi: "यदि सिरदर्द है तो वह कैसे शुरू हुआ?",
        options: [
          { value: "thunderclap_peak_instant", label: "Thunderclap: 'Worst headache of my life', peak in <60 seconds", label_hi: "बिजली कड़कने जैसा असहनीय सिरदर्द - एक मिनट में चरम पर" },
          { value: "throbbing_migraine", label: "Unilateral pulsating ache with nausea and sensitivity to light", label_hi: "आधे सिर में धड़कने जैसा दर्द, रोशनी से चिढ़" },
          { value: "band_tension", label: "Tight constricting band around whole head", label_hi: "सिर के चारों तरफ कसने जैसा दर्द" },
          { value: "no_headache", label: "No headache", label_hi: "सिरदर्द नहीं है" }
        ],
        required: false
      }
    ]
  },

  // ========================================================
  // 7. SPINE / MUSCULOSKELETAL
  // ========================================================
  skel_spine_lumbar: {
    organId: "skel_spine_lumbar",
    title: "Lumbar Spine / Lower Back History",
    clinicalGuideline: "NASS Clinical Guidelines for Lumbar Disc Herniation & Cauda Equina Syndrome",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_CAUDA_EQUINA",
        criteria: (answers) => {
          const signs = answers.spine_red_flags || [];
          return signs.includes("bowel_bladder_incontinence") || signs.includes("saddle_anesthesia");
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Cauda Equina Syndrome (Bowel/Bladder sphincter loss or Saddle Anesthesia). Emergency MRI and surgical decompression required within 24-48h."
      }
    ],
    questions: [
      {
        id: "spine_red_flags",
        type: "multi_choice",
        prompt: "Are you having any of these critical spinal warning signs?",
        prompt_hi: "क्या इनमें से कोई गंभीर लक्षण महसूस हो रहे हैं?",
        options: [
          { value: "bowel_bladder_incontinence", label: "Loss of bowel or bladder control / involuntary leakage", label_hi: "पेशाब या शौच पर नियंत्रण न रहना / अपने आप निकल जाना" },
          { value: "saddle_anesthesia", label: "Numbness around groin, buttocks, or inner thighs (saddle area)", label_hi: "गुप्तांगों व कूल्हों के आसपास सुन्नपन" },
          { value: "progressive_foot_drop", label: "Sudden foot drop / dragging toes while walking", label_hi: "चलते समय पैर का पंजा लटकना" },
          { value: "none", label: "None of these", label_hi: "इनमें से कोई नहीं" }
        ],
        required: true
      },
      {
        id: "spine_radiculopathy",
        type: "single_choice",
        prompt: "Does the pain shoot down into either leg?",
        prompt_hi: "क्या दर्द कमर से होकर पैर में नीचे तक जाता है (सायटिका)?",
        options: [
          { value: "shoots_below_knee", label: "Shoots below knee into foot with tingling/pins (Sciatica)", label_hi: "घुटने से नीचे पंजे तक झनझनाहट के साथ जाता है (सायटिका)" },
          { value: "buttock_only", label: "Radiates only into buttock or posterior thigh", label_hi: "केवल कूल्हे या जांघ तक जाता है" },
          { value: "localized_back", label: "Localized purely in lower back", label_hi: "केवल कमर के निचले हिस्से में रहता है" }
        ],
        required: true
      }
    ]
  },

  // ========================================================
  // 8. JOINTS / KNEE
  // ========================================================
  joint_knee_l: {
    organId: "joint_knee_l",
    title: "Left Knee Joint History",
    clinicalGuideline: "OARSI Guidelines for the Management of Knee Osteoarthritis & Septic Arthritis protocols",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_SEPTIC_ARTHRITIS",
        criteria: (answers) => answers.knee_acute_hot === "hot_swollen_fever" && answers.knee_weight_bearing === "unable_bear_weight",
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Septic Arthritis (Hot, swollen joint with fever and complete inability to bear weight). Urgent joint aspiration required."
      }
    ],
    questions: [
      {
        id: "knee_acute_hot",
        type: "single_choice",
        prompt: "Is the left knee hot, red, and swollen?",
        prompt_hi: "क्या बायाँ घुटना लाल, गर्म और सूजा हुआ है?",
        options: [
          { value: "hot_swollen_fever", label: "Extremely hot, bright red, swollen, with fever", label_hi: "बहुत गर्म, लाल, अत्यधिक सूजन और साथ में बुखार" },
          { value: "swollen_crepitus", label: "Mild-moderate swelling with creaking / grinding sounds (Crepitus)", label_hi: "हल्की सूजन और चलने पर कट-कट की आवाज (क्रेपिटस)" },
          { value: "no_swelling", label: "No swelling or heat", label_hi: "कोई सूजन या गर्माहट नहीं" }
        ],
        required: true
      },
      {
        id: "knee_weight_bearing",
        type: "single_choice",
        prompt: "Can you bear weight or walk on the left leg?",
        prompt_hi: "क्या आप बाएं पैर पर वजन देकर चल पा रहे हैं?",
        options: [
          { value: "unable_bear_weight", label: "Completely unable to put any weight on it", label_hi: "पैर पर बिल्कुल वजन नहीं रख पा रहे" },
          { value: "limping_pain", label: "Can limp with significant pain", label_hi: "दर्द के साथ लंगड़ा कर चल सकते हैं" },
          { value: "morning_stiffness_eases", label: "Stiff in morning (<30 min), eases after moving around", label_hi: "सुबह 20-30 मिनट जकड़न रहती है, चलने पर खुलती है" }
        ],
        required: true
      }
    ]
  }
};

// Aliases for bilateral joints / mirrored items
ORGAN_QUESTION_BANKS.joint_knee_r = {
  ...ORGAN_QUESTION_BANKS.joint_knee_l,
  organId: "joint_knee_r",
  title: "Right Knee Joint History"
};

ORGAN_QUESTION_BANKS.skel_spine_cervical = {
  ...ORGAN_QUESTION_BANKS.skel_spine_lumbar,
  organId: "skel_spine_cervical",
  title: "Cervical Spine / Neck History"
};

ORGAN_QUESTION_BANKS.skel_spine_thoracic = {
  ...ORGAN_QUESTION_BANKS.skel_spine_lumbar,
  organId: "skel_spine_thoracic",
  title: "Thoracic Spine History"
};

// ========================================================
// 10. PECTORALIS MAJOR (Anterior Chest Wall Musculature)
// ========================================================
ORGAN_QUESTION_BANKS.muscle_pectoralis_l = {
  organId: "muscle_pectoralis_l",
  title: "Left Pectoral / Chest Wall History",
  clinicalGuideline: "2021 AHA/ACC Guidelines for Chest Pain & ACSM Musculoskeletal Guidelines",
  needsReviewByClinician: true,
  version: QUESTION_BANK_VERSION,
  redFlags: [
    {
      ruleId: "RED_PECTORAL_ACS_CROSSOVER",
      criteria: (answers) => {
        const rad = answers.pec_radiation || [];
        const assoc = answers.pec_associated || [];
        const char = answers.pec_character || "";
        return (
          (char.includes("pressure") || char.includes("crushing")) &&
          (rad.includes("left_arm") || rad.includes("jaw")) &&
          (assoc.includes("sweating") || assoc.includes("breathlessness"))
        );
      },
      urgency: "EMERGENCY_PRIORITY_1",
      reason: "Suspected Acute Coronary Syndrome (ACS) presenting as anterior chest wall pain. Immediate 12-lead ECG and emergency cardiac triage required."
    }
  ],
  questions: [
    {
      id: "pec_onset",
      type: "single_choice",
      prompt: "How did the pectoral chest pain begin?",
      prompt_hi: "छाती की मांसपेशी में दर्द कैसे शुरू हुआ?",
      options: [
        { value: "weightlifting_pop", label: "Sudden tear or pop during heavy lifting / bench press", label_hi: "वजन उठाने या व्यायाम के दौरान अचानक झटका लगा" },
        { value: "gradual_soreness", label: "Gradual soreness following strenuous physical activity", label_hi: "शारीरिक मेहनत के बाद धीरे-धीरे दर्द बढ़ा" },
        { value: "unprovoked_rest", label: "Spontaneous onset at rest with no physical trauma", label_hi: "बिना किसी चोट या व्यायाम के बैठे-बैठे अचानक शुरू हुआ" }
      ],
      required: true
    },
    {
      id: "pec_palpation",
      type: "single_choice",
      prompt: "Is the pain sharply reproduced by pressing directly on the chest muscle with your finger?",
      prompt_hi: "क्या उंगली से सीने की मांसपेशी को दबाने पर वही तेज दर्द होता है?",
      options: [
        { value: "tender_palpable", label: "Yes - very tender and reproducible on palpation (Typical Muscular / Costochondritis)", label_hi: "हाँ - दबाने पर वही तेज दर्द महसूस होता है" },
        { value: "deep_nonreproducible", label: "No - deep sensation, pressing externally does not change it (Visceral / Cardiac risk)", label_hi: "नहीं - दर्द अंदर गहरा है, दबाने से असर नहीं पड़ता" }
      ],
      required: true
    },
    {
      id: "pec_character",
      type: "single_choice",
      prompt: "What is the quality of the sensation?",
      prompt_hi: "दर्द का स्वभाव कैसा है?",
      options: [
        { value: "sharp_stretching", label: "Sharp ache provoked by stretching or moving arm", label_hi: "हाथ हिलाने या खिंचाव पर तेज दर्द" },
        { value: "dull_soreness", label: "Dull muscle soreness / stiffness", label_hi: "मांसपेशियों में जकड़न व हल्का दर्द" },
        { value: "crushing_pressure", label: "Heavy crushing tightness / pressure", label_hi: "भारी दबाव या सीने में जकड़न" }
      ],
      required: true
    },
    {
      id: "pec_radiation",
      type: "multi_choice",
      prompt: "Does the pain radiate anywhere?",
      prompt_hi: "क्या दर्द कहीं और फैल रहा है?",
      options: [
        { value: "shoulder_arm", label: "Down the left arm or shoulder", label_hi: "बाएं कंधे या बांह की ओर" },
        { value: "neck_jaw", label: "Upwards to the jaw or throat", label_hi: "जबड़े या गले की ओर" },
        { value: "localized_none", label: "No - strictly localized to the chest muscle", label_hi: "नहीं - केवल सीने की मांसपेशी तक सीमित है" }
      ],
      required: false
    },
    {
      id: "pec_associated",
      type: "multi_choice",
      prompt: "Are you experiencing any of these associated symptoms?",
      prompt_hi: "क्या आपको इनमें से कोई अन्य लक्षण भी हैं?",
      options: [
        { value: "sweating", label: "Profuse cold sweat (diaphoresis)", label_hi: "अचानक ठंडा पसीना आना" },
        { value: "breathlessness", label: "Shortness of breath / dyspnea", label_hi: "सांस फूलना" },
        { value: "swelling_bruise", label: "Visible chest bruising or muscle bulge", label_hi: "नील पड़ना या मांसपेशी में उभार" },
        { value: "none", label: "None of the above", label_hi: "इनमें से कोई नहीं" }
      ],
      required: false
    }
  ]
};

ORGAN_QUESTION_BANKS.muscle_pectoralis_r = {
  ...ORGAN_QUESTION_BANKS.muscle_pectoralis_l,
  organId: "muscle_pectoralis_r",
  title: "Right Pectoral / Chest Wall History"
};

// ========================================================
// 11. RECTUS ABDOMINIS (Abdominal Core Musculature)
// ========================================================
ORGAN_QUESTION_BANKS.muscle_rectus_abdominis = {
  organId: "muscle_rectus_abdominis",
  title: "Abdominal Core / Rectus Muscle History",
  clinicalGuideline: "Carnett's Sign Assessment & World Journal of Emergency Surgery Acute Abdomen Guidelines",
  needsReviewByClinician: true,
  version: QUESTION_BANK_VERSION,
  redFlags: [
    {
      ruleId: "RED_ABS_PERITONEAL_SURGICAL",
      criteria: (answers) => {
        const assoc = answers.abs_associated || [];
        return assoc.includes("rigid_board") || assoc.includes("vomiting_blood") || assoc.includes("black_stools");
      },
      urgency: "EMERGENCY_PRIORITY_1",
      reason: "Suspected Peritonitis / Acute Surgical Abdomen / GI Bleeding. Involuntary rigidity or hemorrhage requires immediate emergency surgical evaluation."
    }
  ],
  questions: [
    {
      id: "abs_carnett",
      type: "single_choice",
      prompt: "Does the pain increase when you tense your abdominal muscles or attempt a partial sit-up?",
      prompt_hi: "क्या पेट की मांसपेशियों को सख्त करने या उठने की कोशिश करने पर दर्द बढ़ता है?",
      options: [
        { value: "increases_tensing", label: "Yes - pain worsens when tensing abdominal wall (Carnett's Positive - Muscular)", label_hi: "हाँ - पेट सख्त करने पर दर्द और बढ़ जाता है (मांसपेशी खिंचाव)" },
        { value: "decreases_unaffected", label: "No - deep pain unaffected by tensing (Visceral organ origin)", label_hi: "नहीं - गहरा आंतरिक दर्द है (आंतरिक अंग की समस्या)" }
      ],
      required: true
    },
    {
      id: "abs_onset",
      type: "single_choice",
      prompt: "How did this abdominal pain begin?",
      prompt_hi: "पेट में यह दर्द कैसे शुरू हुआ?",
      options: [
        { value: "core_workout", label: "During or after core exercises, heavy coughing, or athletic strain", label_hi: "व्यायाम, तेज खांसी या वजन उठाने के बाद" },
        { value: "spontaneous_progressive", label: "Spontaneous onset, gradually worsening with nausea/fever", label_hi: "अचानक बिना किसी खिंचाव के, उल्टी या बुखार के साथ" }
      ],
      required: true
    },
    {
      id: "abs_associated",
      type: "multi_choice",
      prompt: "Do you have any of the following warning signs?",
      prompt_hi: "क्या आपको इनमें से कोई गंभीर लक्षण हैं?",
      options: [
        { value: "rigid_board", label: "Stomach is rock hard and rigid like a board", label_hi: "पेट पत्थर की तरह सख्त व कड़ा हो गया है" },
        { value: "vomiting_blood", label: "Vomiting blood or coffee-ground material", label_hi: "उल्टी में खून आना" },
        { value: "black_stools", label: "Black tarry or maroon stools", label_hi: "काले रंग का मल आना" },
        { value: "high_fever", label: "High fever (>101°F) with shivering", label_hi: "तेज बुखार व कंपकंपी" },
        { value: "none", label: "None of these warning signs", label_hi: "इनमें से कोई नहीं" }
      ],
      required: false
    }
  ]
};

// Aliases for Flanks & Limb Musculature
ORGAN_QUESTION_BANKS.muscle_obliques_l = {
  ...ORGAN_QUESTION_BANKS.muscle_rectus_abdominis,
  organId: "muscle_obliques_l",
  title: "Left Oblique / Flank Muscular History"
};
ORGAN_QUESTION_BANKS.muscle_obliques_r = {
  ...ORGAN_QUESTION_BANKS.muscle_rectus_abdominis,
  organId: "muscle_obliques_r",
  title: "Right Oblique / Flank Muscular History"
};
ORGAN_QUESTION_BANKS.muscle_deltoid_l = {
  ...ORGAN_QUESTION_BANKS.muscle_pectoralis_l,
  organId: "muscle_deltoid_l",
  title: "Left Deltoid / Shoulder Muscular History"
};
ORGAN_QUESTION_BANKS.muscle_deltoid_r = {
  ...ORGAN_QUESTION_BANKS.muscle_pectoralis_l,
  organId: "muscle_deltoid_r",
  title: "Right Deltoid / Shoulder Muscular History"
};
ORGAN_QUESTION_BANKS.muscle_biceps_l = {
  ...ORGAN_QUESTION_BANKS.muscle_pectoralis_l,
  organId: "muscle_biceps_l",
  title: "Left Biceps Brachii Muscular History"
};
ORGAN_QUESTION_BANKS.muscle_biceps_r = {
  ...ORGAN_QUESTION_BANKS.muscle_pectoralis_l,
  organId: "muscle_biceps_r",
  title: "Right Biceps Brachii Muscular History"
};

// ========================================================
// 12. QUADRICEPS (Anterior Thigh Musculature)
// ========================================================
ORGAN_QUESTION_BANKS.muscle_quadriceps_l = {
  organId: "muscle_quadriceps_l",
  title: "Left Quadriceps / Thigh Muscular History",
  clinicalGuideline: "AAOS Guidelines for Lower Extremity Muscle Strain & Acute Compartment Syndrome",
  needsReviewByClinician: true,
  version: QUESTION_BANK_VERSION,
  redFlags: [
    {
      ruleId: "RED_COMPARTMENT_SYNDROME",
      criteria: (answers) => {
        const flags = answers.quad_warning || [];
        const sev = answers.severity || 0;
        return (flags.includes("tense_wooden_swelling") && flags.includes("numbness_paresthesia")) || sev >= 9;
      },
      urgency: "EMERGENCY_PRIORITY_1",
      reason: "Suspected Acute Compartment Syndrome of the extremity. High risk of irreversible neurovascular necrosis; immediate surgical fasciotomy consultation required."
    }
  ],
  questions: [
    {
      id: "quad_onset",
      type: "single_choice",
      prompt: "How did the thigh pain begin?",
      prompt_hi: "जांघ में दर्द कैसे शुरू हुआ?",
      options: [
        { value: "sprint_pop", label: "Sudden sharp pop or pull while sprinting or kicking", label_hi: "दौड़ते या लात मारते समय अचानक झटका लगा" },
        { value: "gradual_post_exercise", label: "Gradual soreness following strenuous workout", label_hi: "मेहनत के बाद धीरे-धीरे दर्द बढ़ा" },
        { value: "crush_trauma", label: "Direct impact / blunt trauma / crush injury", label_hi: "सीधी चोट या भारी टक्कर लगी" }
      ],
      required: true
    },
    {
      id: "quad_warning",
      type: "multi_choice",
      prompt: "Are you experiencing any of these high-risk limb symptoms?",
      prompt_hi: "क्या आपको इनमें से कोई गंभीर लक्षण महसूस हो रहा है?",
      options: [
        { value: "tense_wooden_swelling", label: "Severe rock-hard swelling with shiny skin (Compartment sign)", label_hi: "जांघ बहुत सख्त व तनी हुई सूज गई है" },
        { value: "numbness_paresthesia", label: "Numbness, tingling, or loss of sensation in foot", label_hi: "पैर या पंजे में सुन्नपन या झनझनाहट" },
        { value: "unilateral_calf_heat", label: "Hot swollen calf with tenderness (DVT warning)", label_hi: "पिंडली में तेज गर्मी, सूजन व दर्द" },
        { value: "none", label: "None of these warning signs", label_hi: "इनमें से कोई नहीं" }
      ],
      required: false
    }
  ]
};

ORGAN_QUESTION_BANKS.muscle_quadriceps_r = {
  ...ORGAN_QUESTION_BANKS.muscle_quadriceps_l,
  organId: "muscle_quadriceps_r",
  title: "Right Quadriceps / Thigh Muscular History"
};

// ========================================================
// 13. TRAPEZIUS (Neck & Upper Back Musculature)
// ========================================================
ORGAN_QUESTION_BANKS.muscle_trapezius = {
  organId: "muscle_trapezius",
  title: "Trapezius & Cervical Muscular History",
  clinicalGuideline: "ICHD-3 Headache Classification & BMJ Best Practice Neck Pain Guidelines",
  needsReviewByClinician: true,
  version: QUESTION_BANK_VERSION,
  redFlags: [
    {
      ruleId: "RED_TRAP_MENINGEAL_SUBARACHNOID",
      criteria: (answers) => {
        const assoc = answers.trap_associated || [];
        const onset = answers.trap_onset || "";
        return assoc.includes("fever_stiff_chin") || (onset === "thunderclap" && assoc.includes("photophobia"));
      },
      urgency: "EMERGENCY_PRIORITY_1",
      reason: "Suspected Meningitis or Subarachnoid Hemorrhage (SAH) presenting with severe nuchal rigidity. Urgent emergency brain CT and lumbar puncture evaluation indicated."
    }
  ],
  questions: [
    {
      id: "trap_onset",
      type: "single_choice",
      prompt: "How did the neck/shoulder discomfort start?",
      prompt_hi: "गर्दन व कंधे में यह तकलीफ कैसे शुरू हुई?",
      options: [
        { value: "gradual_posture", label: "Gradual stiffness from computer/desk posture or sleeping awkwardly", label_hi: "गलत तरीके से सोने या स्क्रीन पर काम करने से धीरे-धीरे जकड़न हुई" },
        { value: "sudden_strain", label: "Sudden pull while lifting or turning head quickly", label_hi: "सिर अचानक घुमाने या वजन उठाने से खिंचाव हुआ" },
        { value: "thunderclap", label: "Instantaneous, explosive onset reaching peak in seconds ('Thunderclap')", label_hi: "बिजली की तरह अचानक असहनीय दर्द शुरू हुआ" }
      ],
      required: true
    },
    {
      id: "trap_associated",
      type: "multi_choice",
      prompt: "Are you experiencing any of these associated signs?",
      prompt_hi: "क्या आपको इनमें से कोई अन्य लक्षण हैं?",
      options: [
        { value: "fever_stiff_chin", label: "High fever and completely unable to touch chin to chest", label_hi: "तेज बुखार और ठोड़ी को छाती से छूने में पूरी तरह असमर्थ" },
        { value: "photophobia", label: "Extreme intolerance to bright light, nausea, confusion", label_hi: "रोशनी बर्दाश्त न होना, चक्कर या भ्रम" },
        { value: "shooting_radicular", label: "Electric shock-like tingling radiating down into the hand", label_hi: "हाथ में नीचे तक करंट जैसा दर्द या झनझनाहट" },
        { value: "none", label: "None of the above", label_hi: "इनमें से कोई नहीं" }
      ],
      required: false
    }
  ]
};

Object.assign(ORGAN_QUESTION_BANKS, {
  // ========================================================
  // 9. GALLBLADDER / BILIARY TREE
  // ========================================================
  organ_gallbladder: {
    organId: "organ_gallbladder",
    title: "Gallbladder / Biliary History",
    clinicalGuideline: "Tokyo Guidelines 2018 (TG18) for Acute Cholecystitis & Cholangitis",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_BILIARY_CHARCOT_TRIAD",
        criteria: (answers) => {
          const sys = answers.gb_symptoms || [];
          return sys.includes("jaundice_yellowing") && sys.includes("high_fever_chills");
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Charcot's Triad (RUQ pain + Jaundice + Fever/Chills) indicating Acute Ascending Cholangitis. Immediate emergency biliary decompression & IV antibiotics required."
      }
    ],
    questions: [
      {
        id: "gb_onset",
        type: "single_choice",
        prompt: "Did this upper right abdominal pain start after eating?",
        prompt_hi: "क्या यह दर्द चिकनाई या भारी भोजन करने के बाद शुरू हुआ?",
        options: [
          { value: "post_fatty_meal", label: "Triggered 30-90 minutes after a fatty or heavy meal", label_hi: "चिकनाई या भारी खाने के 30-90 मिनट बाद" },
          { value: "constant_unrelated", label: "Constant ache unrelated to food intake", label_hi: "लगातार बना रहने वाला दर्द जो खाने से जुड़ा नहीं है" },
          { value: "fasting_night", label: "Woke me up in the middle of the night", label_hi: "रात को अचानक दर्द से नींद खुली" }
        ],
        required: true
      },
      {
        id: "gb_radiation",
        type: "single_choice",
        prompt: "Does the pain radiate to your shoulder or back?",
        prompt_hi: "क्या यह दर्द दाहिने कंधे या पीठ की तरफ फैलता है?",
        options: [
          { value: "right_scapula_shoulder", label: "Radiates to right shoulder or tip of right shoulder blade (Boas sign)", label_hi: "दाहिने कंधे या पीठ के ऊपरी हिस्से में फैलता है" },
          { value: "epigastric_center", label: "Radiates towards center of chest", label_hi: "छाती के बीच की ओर फैलता है" },
          { value: "localized_ruq", label: "Remains strictly under right lower ribs", label_hi: "केवल दाहिनी पसलियों के नीचे ही रहता है" }
        ],
        required: true
      },
      {
        id: "gb_symptoms",
        type: "multi_choice",
        prompt: "Are you experiencing any of these associated signs?",
        prompt_hi: "क्या इनमें से कोई अन्य लक्षण भी हैं?",
        options: [
          { value: "jaundice_yellowing", label: "Yellowish discoloration of eyes or skin (Jaundice)", label_hi: "आंखों या त्वचा का पीला पड़ना (पीलिया)" },
          { value: "high_fever_chills", label: "High fever with shaking chills", label_hi: "कंपाकंपी के साथ तेज बुखार" },
          { value: "dark_urine_pale_stool", label: "Dark cola-colored urine or unusually pale/clay stools", label_hi: "पेशाब का गहरा होना या मल का सफेद/मिट्टी जैसा होना" },
          { value: "nausea_vomiting", label: "Nausea and repeated vomiting", label_hi: "जी मिचलाना और उल्टियां" }
        ],
        required: false
      }
    ]
  },

  // ========================================================
  // 10. PANCREAS
  // ========================================================
  organ_pancreas: {
    organId: "organ_pancreas",
    title: "Pancreas / Epigastric History",
    clinicalGuideline: "Revised Atlanta Classification (2012) & IAP/APA Guidelines for Acute Pancreatitis",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_PANCREATITIS_SHOCK",
        criteria: (answers) => {
          const char = answers.pancreas_character || "";
          const assoc = answers.pancreas_associated || [];
          return char.includes("boring_severe") && (assoc.includes("dizziness_hypotension") || assoc.includes("intractable_vomiting"));
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Severe Acute Pancreatitis with signs of systemic shock / third-space fluid loss. Immediate emergency ICU / fluid resuscitation required."
      }
    ],
    questions: [
      {
        id: "pancreas_character",
        type: "single_choice",
        prompt: "How does the pain in your upper abdomen feel?",
        prompt_hi: "पेट के ऊपरी हिस्से में दर्द किस तरह का महसूस हो रहा है?",
        options: [
          { value: "boring_severe", label: "Intense boring pain piercing straight through to the back", label_hi: "आर-पार छेदने जैसा असहनीय दर्द जो पीठ तक जाता है" },
          { value: "burning_gnawing", label: "Burning or gnawing epigastric sensation", label_hi: "तेज जलन या कुतरने जैसा दर्द" },
          { value: "cramping_intermittent", label: "Cramping pain coming in waves", label_hi: "मरोड़ जैसा दर्द जो रुक-रुक कर आता है" }
        ],
        required: true
      },
      {
        id: "pancreas_position",
        type: "single_choice",
        prompt: "Does body posture change the intensity of your pain?",
        prompt_hi: "क्या शरीर की स्थिति बदलने से दर्द में फर्क पड़ता है?",
        options: [
          { value: "relieved_leaning_forward", label: "Relieved by sitting upright and leaning forward (Mohr's / Pancreatic posture)", label_hi: "आगे झुककर बैठने पर थोड़ा आराम मिलता है" },
          { value: "worse_lying_flat", label: "Significantly worse when lying flat on your back", label_hi: "सीधे पीठ के बल लेटने पर दर्द बहुत बढ़ जाता है" },
          { value: "no_change", label: "No difference with posture", label_hi: "मुद्रा बदलने से कोई फर्क नहीं पड़ता" }
        ],
        required: true
      },
      {
        id: "pancreas_associated",
        type: "multi_choice",
        prompt: "Select any accompanying warning signs:",
        prompt_hi: "साथ में होने वाले अन्य लक्षण चुनें:",
        options: [
          { value: "intractable_vomiting", label: "Continuous severe vomiting without relief", label_hi: "लगातार उल्टियां होना जिससे राहत न मिले" },
          { value: "dizziness_hypotension", label: "Extreme lightheadedness, cold clammy skin or fainting", label_hi: "बहुत तेज चक्कर आना, पसीना या बेहोशी" },
          { value: "abdominal_distension", label: "Severe swollen / tense belly", label_hi: "पेट का बहुत अधिक फूलना या कड़ा होना" }
        ],
        required: false
      }
    ]
  },

  // ========================================================
  // 11. SPLEEN
  // ========================================================
  organ_spleen: {
    organId: "organ_spleen",
    title: "Spleen / Left Upper Quadrant History",
    clinicalGuideline: "WSES Classification and Guidelines for Splenic Trauma & Splenomegaly",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_SPLENIC_RUPTURE",
        criteria: (answers) => {
          const hist = answers.spleen_trauma || "";
          const assoc = answers.spleen_associated || [];
          return (hist === "recent_fall_blunt" || hist === "motor_accident") && (assoc.includes("left_shoulder_kehr") || assoc.includes("fainting_pale"));
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Splenic Rupture with hemoperitoneum (Kehr's sign positive). Immediate emergency surgical evaluation and blood type/crossmatch required."
      }
    ],
    questions: [
      {
        id: "spleen_trauma",
        type: "single_choice",
        prompt: "Did you experience any recent physical impact or injury?",
        prompt_hi: "क्या हाल ही में कोई चोट, गिरना या दुर्घटना हुई है?",
        options: [
          { value: "recent_fall_blunt", label: "Blunt blow or fall impacting left ribs/flank in past 1-7 days", label_hi: "पिछले 1-7 दिनों में बाईं पसलियों पर चोट या गिरना" },
          { value: "motor_accident", label: "Road traffic or sports collision", label_hi: "सड़क दुर्घटना या खेल में तेज टक्कर" },
          { value: "no_trauma", label: "No injury - developed spontaneously", label_hi: "कोई चोट नहीं लगी - अपने आप दर्द शुरू हुआ" }
        ],
        required: true
      },
      {
        id: "spleen_associated",
        type: "multi_choice",
        prompt: "Are you noticing any of these symptoms?",
        prompt_hi: "क्या इनमें से कोई लक्षण हैं?",
        options: [
          { value: "left_shoulder_kehr", label: "Pain radiating up to the tip of left shoulder (Kehr's sign)", label_hi: "बाएं कंधे की नोक तक दर्द उठना" },
          { value: "fainting_pale", label: "Fainting, cold sweats, or sudden paleness", label_hi: "बेहोशी, ठंडा पसीना या अचानक पीलापन" },
          { value: "early_satiety", label: "Feeling full after eating just a few bites (Early satiety)", label_hi: "थोड़ा सा खाते ही पेट भर जाना" }
        ],
        required: false
      }
    ]
  },

  // ========================================================
  // 12. URETERS (Left & Right)
  // ========================================================
  organ_ureter_l: {
    organId: "organ_ureter_l",
    title: "Left Ureter / Renal Colic History",
    clinicalGuideline: "EAU Guidelines on Urolithiasis & Acute Renal Colic",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_URETER_OBSTRUCTED_SEPSIS_L",
        criteria: (answers) => {
          const sys = answers.ureter_signs || [];
          return sys.includes("fever_chills") && (sys.includes("anuria_no_urine") || answers.severity >= 8);
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Obstructed Left Ureteral Calculus with Urosepsis / Impending Septic Shock. Immediate emergency nephrostomy or double-J stenting required."
      }
    ],
    questions: [
      {
        id: "ureter_pain_character",
        type: "single_choice",
        prompt: "How does the pain in your left lower back / flank behave?",
        prompt_hi: "बाईं कमर या पेट में दर्द किस प्रकार का है?",
        options: [
          { value: "waves_agonizing", label: "Comes in agonizing spasms/waves radiating down to left groin/testicle/labia", label_hi: "तेज मरोड़ के साथ आता है और बाईं जांघ/अंडकोष तक फैलता है" },
          { value: "constant_dull", label: "Constant dull ache in flank", label_hi: "कमर में लगातार बना रहने वाला दर्द" }
        ],
        required: true
      },
      {
        id: "ureter_signs",
        type: "multi_choice",
        prompt: "Select any signs present in your urine or body:",
        prompt_hi: "पेशाब या शरीर में दिखने वाले लक्षण चुनें:",
        options: [
          { value: "visible_blood", label: "Red or pink colored urine (Gross Hematuria)", label_hi: "पेशाब में लाल रंग या खून दिखना" },
          { value: "fever_chills", label: "Fever and shivering chills", label_hi: "बुखार और कंपकंपी" },
          { value: "anuria_no_urine", label: "Inability to pass urine despite urge", label_hi: "हाजत होने पर भी पेशाब न उतरना" }
        ],
        required: false
      }
    ]
  },

  organ_ureter_r: {
    organId: "organ_ureter_r",
    title: "Right Ureter / Renal Colic History",
    clinicalGuideline: "EAU Guidelines on Urolithiasis & Acute Renal Colic",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_URETER_OBSTRUCTED_SEPSIS_R",
        criteria: (answers) => {
          const sys = answers.ureter_signs || [];
          return sys.includes("fever_chills") && (sys.includes("anuria_no_urine") || answers.severity >= 8);
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Obstructed Right Ureteral Calculus with Urosepsis. Must differentiate from acute appendicitis; immediate urological decompression needed."
      }
    ],
    questions: [
      {
        id: "ureter_pain_character",
        type: "single_choice",
        prompt: "How does the pain in your right flank behave?",
        prompt_hi: "दाहिनी कमर या पेट में दर्द किस प्रकार का है?",
        options: [
          { value: "waves_agonizing", label: "Agonizing spasmodic waves radiating down to right groin/genitals", label_hi: "तेज मरोड़ के साथ आता है और दाहिनी जांघ/जननांग तक फैलता है" },
          { value: "constant_dull", label: "Constant ache in right lower flank", label_hi: "दाहिनी कमर में लगातार बना रहने वाला दर्द" }
        ],
        required: true
      },
      {
        id: "ureter_signs",
        type: "multi_choice",
        prompt: "Select any urinary or systemic signs:",
        prompt_hi: "पेशाब या शरीर में दिखने वाले लक्षण चुनें:",
        options: [
          { value: "visible_blood", label: "Red/pink colored urine (Gross Hematuria)", label_hi: "पेशाब में खून दिखना" },
          { value: "fever_chills", label: "High fever with chills", label_hi: "तेज बुखार और कंपकंपी" },
          { value: "anuria_no_urine", label: "Cannot pass urine for >6 hours", label_hi: "6 घंटे से पेशाब बिल्कुल न होना" }
        ],
        required: false
      }
    ]
  },

  // ========================================================
  // 13. URINARY BLADDER
  // ========================================================
  organ_bladder: {
    organId: "organ_bladder",
    title: "Urinary Bladder / Lower Urinary Tract History",
    clinicalGuideline: "AUA / EAU Guidelines on Lower Urinary Tract Symptoms & Acute Urinary Retention",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_BLADDER_RETENTION",
        criteria: (answers) => answers.bladder_flow === "complete_retention",
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Acute Urinary Retention. Painful palpable bladder requiring immediate emergency catheterization to prevent bladder rupture / acute renal failure."
      }
    ],
    questions: [
      {
        id: "bladder_flow",
        type: "single_choice",
        prompt: "How is your urinary stream?",
        prompt_hi: "पेशाब का बहाव कैसा है?",
        options: [
          { value: "complete_retention", label: "Unable to pass any urine despite agonizing full sensation (Complete Retention)", label_hi: "पेशाब की तीव्र इच्छा के बावजूद एक बूंद भी न उतरना" },
          { value: "intense_burning", label: "Painful burning scalding stream (Dysuria) with urgency", label_hi: "पेशाब करते समय तेज जलन और बार-बार जाने की इच्छा" },
          { value: "hesitancy_weak", label: "Weak dribbling stream with difficulty starting", label_hi: "कमजोर धार और शुरू करने में कठिनाई" },
          { value: "normal_flow", label: "Normal stream with mild lower pelvic pressure", label_hi: "सामान्य बहाव, केवल नीचे हल्का भारीपन" }
        ],
        required: true
      },
      {
        id: "bladder_urine_signs",
        type: "multi_choice",
        prompt: "What does the urine look like?",
        prompt_hi: "पेशाब का रंग और स्वरूप कैसा है?",
        options: [
          { value: "frank_blood_clots", label: "Visible red blood or blood clots", label_hi: "साफ खून या खून के थक्के दिखना" },
          { value: "cloudy_foul", label: "Cloudy, milky, or strongly foul-smelling urine", label_hi: "धुंधला या बदबूदार पेशाब" },
          { value: "clear_normal", label: "Clear pale yellow", label_hi: "सामान्य साफ हल्का पीला" }
        ],
        required: false
      }
    ]
  },

  // ========================================================
  // 14. SMALL INTESTINE
  // ========================================================
  organ_small_intestine: {
    organId: "organ_small_intestine",
    title: "Small Intestine / Periumbilical History",
    clinicalGuideline: "WSES Guidelines for Diagnosis and Management of Small Bowel Obstruction (SBO)",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_SBO_STRANGULATION",
        criteria: (answers) => {
          const vomit = answers.si_vomit || "";
          const obst = answers.si_bowel_passage || "";
          return (vomit === "feculent_bilious" || vomit === "frequent_vomit") && obst === "no_flatus_no_stool_24h";
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Acute Mechanical Small Bowel Obstruction with risk of bowel strangulation / ischemia. Urgent surgical consultation and abdominal CT required."
      }
    ],
    questions: [
      {
        id: "si_bowel_passage",
        type: "single_choice",
        prompt: "Have you passed any gas (flatus) or stool in the past 24 hours?",
        prompt_hi: "क्या पिछले 24 घंटों में पेट से गैस (अपान वायु) या मल पास हुआ है?",
        options: [
          { value: "no_flatus_no_stool_24h", label: "Neither gas nor stool passed for over 24 hours (Complete Obstipation)", label_hi: "24 घंटे से न तो गैस पास हुई है और न ही शौच (पूरी तरह रुकावट)" },
          { value: "gas_only", label: "Passing gas but no stool", label_hi: "सिर्फ गैस पास हो रही है, शौच नहीं" },
          { value: "normal_passage", label: "Passing both flatus and stool normally", label_hi: "गैस और शौच दोनों सामान्य रूप से आ रहे हैं" },
          { value: "watery_diarrhea", label: "Watery frequent diarrhea", label_hi: "पतले दस्त लग रहे हैं" }
        ],
        required: true
      },
      {
        id: "si_vomit",
        type: "single_choice",
        prompt: "Are you having nausea or vomiting?",
        prompt_hi: "क्या उल्टी या जी मिचलाने की समस्या है?",
        options: [
          { value: "feculent_bilious", label: "Green/dark brown foul-smelling vomit (Feculent/Bilious)", label_hi: "हरे या गहरे भूरे रंग की दुर्गंधयुक्त उल्टी" },
          { value: "frequent_vomit", label: "Vomiting everything consumed (food and water)", label_hi: "खाने-पीने की हर चीज की उल्टी हो जाना" },
          { value: "mild_nausea", label: "Mild nausea without vomiting", label_hi: "सिर्फ जी मिचलाना, उल्टी नहीं" },
          { value: "none", label: "No nausea or vomiting", label_hi: "कोई उल्टी या जी मिचलाना नहीं" }
        ],
        required: true
      }
    ]
  },

  // ========================================================
  // 15. LARGE INTESTINE (Colon)
  // ========================================================
  organ_large_intestine: {
    organId: "organ_large_intestine",
    title: "Large Intestine (Colon & Rectum) History",
    clinicalGuideline: "ACG Clinical Guidelines for Management of Adults with Acute Lower GI Bleeding & Diverticulitis",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_COLON_MASSIVE_HEMORRHAGE",
        criteria: (answers) => {
          const bleed = answers.colon_bleeding || "";
          const sev = answers.severity || 0;
          return bleed === "massive_red_blood" || (bleed === "dark_maroon" && sev >= 7);
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Severe Acute Lower Gastrointestinal Bleeding with hemodynamic instability. Immediate emergency endoscopy / resuscitation required."
      }
    ],
    questions: [
      {
        id: "colon_bleeding",
        type: "single_choice",
        prompt: "Have you noticed any blood in your bowel movements?",
        prompt_hi: "क्या शौच में किसी प्रकार का खून देखा है?",
        options: [
          { value: "massive_red_blood", label: "Large volume of bright red blood filling toilet bowl", label_hi: "काफी मात्रा में ताजा लाल खून आना" },
          { value: "dark_maroon", label: "Dark maroon clots or black tarry stools (Melena)", label_hi: "काले रंग का तारकोल जैसा मल या थक्के" },
          { value: "streaks_paper", label: "Minor streaks on toilet tissue only", label_hi: "मलत्याग के बाद केवल टिशू पर हल्की लकीर" },
          { value: "no_blood", label: "No visible blood in stools", label_hi: "कोई खून नहीं दिखा" }
        ],
        required: true
      },
      {
        id: "colon_habit_change",
        type: "single_choice",
        prompt: "Has there been an acute change in bowel habits?",
        prompt_hi: "क्या शौच की आदत में अचानक कोई बदलाव आया है?",
        options: [
          { value: "bloody_mucus_diarrhea", label: "Frequent diarrhea mixed with mucus and cramping (Tenismus)", label_hi: "मरोड़ और आंव/श्लेष्मा के साथ बार-बार दस्त" },
          { value: "severe_new_constipation", label: "Severe constipation not responsive to laxatives", label_hi: "अचानक गंभीर कब्ज" },
          { value: "alternating", label: "Alternating diarrhea and constipation over weeks", label_hi: "हफ्तों से कभी दस्त कभी कब्ज" },
          { value: "normal", label: "Habits are otherwise normal", label_hi: "आदतें सामान्य हैं" }
        ],
        required: true
      }
    ]
  },

  // ========================================================
  // 16. THYROID GLAND
  // ========================================================
  organ_thyroid: {
    organId: "organ_thyroid",
    title: "Thyroid Gland / Anterior Neck History",
    clinicalGuideline: "American Thyroid Association (ATA) Guidelines for Thyroid Nodules & Differentiated Thyroid Cancer",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_THYROID_AIRWAY_COMPRESSION",
        criteria: (answers) => {
          const comp = answers.thyroid_compressive || [];
          return comp.includes("stridor_breathing") || (comp.includes("severe_swallowing") && comp.includes("rapid_growth"));
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Acute Airway / Esophageal Compression from Thyroid Mass (Stridor / Anaplastic threat). Urgent ENT/surgical airway evaluation required."
      }
    ],
    questions: [
      {
        id: "thyroid_compressive",
        type: "multi_choice",
        prompt: "Are you having any neck compression symptoms?",
        prompt_hi: "क्या गर्दन में दबाव से जुड़े लक्षण हैं?",
        options: [
          { value: "stridor_breathing", label: "Noisy high-pitched breathing or feeling of choking when lying down", label_hi: "सांस लेते समय सीटी जैसी आवाज या लेटने पर दम घुटना" },
          { value: "severe_swallowing", label: "Difficulty swallowing solid food (Dysphagia)", label_hi: "भोजन निगलने में कठिनाई" },
          { value: "hoarseness_voice", label: "New unexplained persistent hoarseness of voice", label_hi: "आवाज का बैठना या बदलना" },
          { value: "rapid_growth", label: "Lump in neck grew noticeably in past few weeks", label_hi: "गर्दन की गांठ कुछ ही हफ्तों में तेजी से बढ़ी है" }
        ],
        required: false
      },
      {
        id: "thyroid_metabolic",
        type: "single_choice",
        prompt: "Do you have any metabolic or constitutional symptoms?",
        prompt_hi: "क्या इनमें से कोई सामान्य शारीरिक लक्षण हैं?",
        options: [
          { value: "hyperthyroid_tremor_palp", label: "Hand tremors, heat intolerance, racing heartbeat, unexplained weight loss", label_hi: "हाथ कांपना, गर्मी बर्दाश्त न होना, दिल की तेज धड़कन, वजन घटना" },
          { value: "hypothyroid_fatigue_cold", label: "Severe sluggishness, extreme cold intolerance, puffiness, weight gain", label_hi: "बहुत ज्यादा थकान, अधिक ठंड लगना, चेहरे पर सूजन, वजन बढ़ना" },
          { value: "none", label: "No constitutional symptoms", label_hi: "इनमें से कोई नहीं" }
        ],
        required: true
      }
    ]
  },

  // ========================================================
  // 17. REPRODUCTIVE ORGANS
  // ========================================================
  organ_reproductive: {
    organId: "organ_reproductive",
    title: "Reproductive & Deep Pelvic History",
    clinicalGuideline: "ACOG Practice Bulletin on Acute Pelvic Pain & AUA Emergency Guidelines",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_REPRODUCTIVE_TORSION_ECTOPIC",
        criteria: (answers) => {
          const char = answers.repro_onset || "";
          const assoc = answers.repro_signs || [];
          return char === "sudden_agonizing" && (assoc.includes("fainting_syncope") || assoc.includes("vomiting") || answers.pregnancy_status === "pregnant_confirmed");
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Ovarian Torsion, Testicular Torsion, or Ruptured Ectopic Pregnancy. Immediate ultrasound and gynecological/surgical exploration required."
      }
    ],
    questions: [
      {
        id: "repro_onset",
        type: "single_choice",
        prompt: "How did this pelvic / groin discomfort begin?",
        prompt_hi: "पेड़ू या जननांग में दर्द कैसे शुरू हुआ?",
        options: [
          { value: "sudden_agonizing", label: "Sudden knife-like onset reaching peak within seconds to minutes", label_hi: "अचानक चाकू घोंपने जैसा तेज दर्द जो कुछ ही मिनटों में तीव्र हो गया" },
          { value: "gradual_days", label: "Gradual dull ache building over several days", label_hi: "कई दिनों में धीरे-धीरे बढ़ा हुआ दर्द" },
          { value: "cyclical_menses", label: "Recurrent ache coinciding with menstrual cycle", label_hi: "माहवारी के समय होने वाला नियमित दर्द" }
        ],
        required: true
      },
      {
        id: "repro_signs",
        type: "multi_choice",
        prompt: "Select any associated warning features:",
        prompt_hi: "साथ में होने वाले अन्य लक्षण चुनें:",
        options: [
          { value: "fainting_syncope", label: "Dizziness, fainting or collapse", label_hi: "चक्कर आना या बेहोश होकर गिरना" },
          { value: "heavy_abnormal_bleeding", label: "Heavy unexpected vaginal bleeding soaking pads rapidly", label_hi: "असामान्य रूप से बहुत अधिक रक्तस्राव" },
          { value: "vomiting", label: "Repeated vomiting with pain", label_hi: "दर्द के साथ उल्टियां" },
          { value: "scrotal_swelling", label: "Tender swollen testicle or red scrotum", label_hi: "अंडकोष में सूजन या तेज दर्द" }
        ],
        required: false
      }
    ]
  },

  // ========================================================
  // 18. SKELETAL: SKULL, RIBCAGE, PELVIS, SACRUM
  // ========================================================
  skel_skull: {
    organId: "skel_skull",
    title: "Cranial & Facial Skeleton History",
    clinicalGuideline: "NICE Clinical Guideline on Head Injury: Triage, Assessment, and Early Management",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_CRANIAL_TRAUMA",
        criteria: (answers) => {
          const signs = answers.skull_signs || [];
          return signs.includes("loss_of_consciousness") || signs.includes("repeated_vomiting") || signs.includes("fluid_ears_nose");
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Intracranial Hemorrhage / Base of Skull Fracture. Immediate non-contrast Head CT and neurotrauma protocol required."
      }
    ],
    questions: [
      {
        id: "skull_signs",
        type: "multi_choice",
        prompt: "Did the head discomfort follow an impact, and are any of these present?",
        prompt_hi: "क्या सिर में चोट लगी थी, और इनमें से कोई लक्षण हैं?",
        options: [
          { value: "loss_of_consciousness", label: "Loss of consciousness (even for a few seconds)", label_hi: "कुछ सेकंड के लिए भी बेहोश होना" },
          { value: "repeated_vomiting", label: "More than two episodes of vomiting", label_hi: "दो या अधिक बार उल्टी होना" },
          { value: "fluid_ears_nose", label: "Clear fluid or blood leaking from nose or ears (CSF leak)", label_hi: "कान या नाक से पानी जैसा तरल या खून बहना" },
          { value: "seizure", label: "Seizure or abnormal twitching fit", label_hi: "दौरा या झटके आना" },
          { value: "none", label: "None of these / No head injury", label_hi: "इनमें से कोई नहीं / चोट नहीं लगी" }
        ],
        required: true
      },
      {
        id: "skull_headache_character",
        type: "single_choice",
        prompt: "How does the head pain or headache feel?",
        prompt_hi: "सिर का दर्द किस प्रकार का महसूस हो रहा है?",
        options: [
          { value: "throbbing_pulsatile", label: "Pulsating or throbbing ache with light/sound sensitivity", label_hi: "धड़कन जैसा तेज दर्द, रोशनी व आवाज से परेशानी" },
          { value: "tight_band", label: "Dull tight squeezing band around forehead (Tension headache)", label_hi: "माथे के चारों ओर पट्टी जैसा कसाव या भारीपन" },
          { value: "sharp_stabbing", label: "Sharp stabbing localized pain", label_hi: "एक जगह तेज चुभने वाला दर्द" }
        ],
        required: true
      }
    ]
  },

  skel_ribcage: {
    organId: "skel_ribcage",
    title: "Rib Cage & Sternum History",
    clinicalGuideline: "Advanced Trauma Life Support (ATLS) Thoracic Trauma Guidelines",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_RIB_FLAIL_PNEUMO",
        criteria: (answers) => {
          const signs = answers.rib_signs || [];
          return signs.includes("paradoxical_breathing") || (signs.includes("coughing_blood") && answers.severity >= 7);
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Flail Chest or Traumatic Tension Pneumothorax / Hemothorax. Immediate emergency thoracic triage required."
      }
    ],
    questions: [
      {
        id: "rib_signs",
        type: "multi_choice",
        prompt: "Select any specific symptoms affecting your chest wall:",
        prompt_hi: "पसलियों या छाती की दीवार से जुड़े लक्षण चुनें:",
        options: [
          { value: "pain_deep_breath", label: "Sharp stabbing pain strictly on deep inhalation or coughing", label_hi: "गहरी सांस लेने या खांसने पर तेज चुभन" },
          { value: "crackling_crunch", label: "Crunching or popping sensation when pressing ribs (Crepitus)", label_hi: "पसलियों पर हाथ लगाने पर कड़कड़ाहट महसूस होना" },
          { value: "paradoxical_breathing", label: "Chest wall moves inward when breathing in (Flail chest segment)", label_hi: "सांस लेते समय छाती का एक हिस्सा अंदर धंसना" },
          { value: "coughing_blood", label: "Coughing up pink frothy or bright red blood", label_hi: "खांसी में खून आना" }
        ],
        required: true
      },
      {
        id: "rib_onset_cause",
        type: "single_choice",
        prompt: "What triggered this rib cage discomfort?",
        prompt_hi: "पसलियों में यह तकलीफ किस कारण शुरू हुई?",
        options: [
          { value: "direct_blow_fall", label: "Direct blow, fall, or blunt trauma to ribs", label_hi: "पसलियों पर सीधा प्रहार, गिरना या चोट" },
          { value: "severe_coughing_fit", label: "Severe repetitive coughing episodes (Costochondritis)", label_hi: "लगातार तेज खांसी आने के बाद खिंचाव" },
          { value: "postural_lifting", label: "Heavy lifting or sudden twisting movement", label_hi: "भारी वजन उठाना या अचानक मुड़ना" }
        ],
        required: true
      }
    ]
  },

  skel_pelvis: {
    organId: "skel_pelvis",
    title: "Pelvic Girdle & Iliac Bone History",
    clinicalGuideline: "OTA / Young-Burgess Pelvic Fracture Classification Guidelines",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_PELVIS_UNSTABLE",
        criteria: (answers) => answers.pelvis_weightbearing === "completely_unable_agony" && (answers.pelvis_trauma || "").includes("high_energy"),
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Unstable Pelvic Ring Fracture with potential retroperitoneal vascular bleeding. Immediate pelvic binder and trauma protocol required."
      }
    ],
    questions: [
      {
        id: "pelvis_weightbearing",
        type: "single_choice",
        prompt: "Can you bear weight and stand on your legs?",
        prompt_hi: "क्या आप पैरों पर वजन डालकर खड़े हो सकते हैं?",
        options: [
          { value: "completely_unable_agony", label: "Completely unable to stand or bear weight due to agonizing pelvic pain", label_hi: "पेड़ू में असहनीय दर्द के कारण खड़े होना बिल्कुल नामुमकिन है" },
          { value: "limping_painful", label: "Can bear some weight but with noticeable limp", label_hi: "लंगड़ा कर थोड़ा चल सकते हैं" },
          { value: "walking_tolerable", label: "Can walk with tolerable mild discomfort", label_hi: "हल्के दर्द के साथ चल सकते हैं" }
        ],
        required: true
      },
      {
        id: "pelvis_trauma",
        type: "single_choice",
        prompt: "How did the pelvic pain originate?",
        prompt_hi: "यह दर्द कैसे शुरू हुआ?",
        options: [
          { value: "high_energy_mva", label: "High-impact fall from height or motor collision", label_hi: "ऊंचाई से गिरना या वाहन दुर्घटना" },
          { value: "low_energy_slip", label: "Simple slip or trip from standing height", label_hi: "सामान्य फिसलना या लड़खड़ाना" },
          { value: "chronic_strain", label: "Overuse strain or pregnancy-related girdle ache", label_hi: "लंबे समय से खिंचाव या गर्भावस्था का दर्द" }
        ],
        required: true
      }
    ]
  },

  skel_spine_sacrum: {
    organId: "skel_spine_sacrum",
    title: "Sacrum & Sacroiliac (SI) Joint History",
    clinicalGuideline: "ASAS Classification Criteria for Axial Spondyloarthritis & Cauda Equina Red-Flags",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_SACRAL_CAUDA_EQUINA",
        criteria: (answers) => {
          const signs = answers.sacrum_signs || [];
          return signs.includes("saddle_anesthesia") || signs.includes("bowel_bladder_incontinence");
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Suspected Cauda Equina Syndrome (Saddle Anesthesia / Sphincter Dysfunction). Emergency MRI Whole Spine and urgent decompressive neurosurgery required."
      }
    ],
    questions: [
      {
        id: "sacrum_signs",
        type: "multi_choice",
        prompt: "Select any symptoms around the tailbone, buttocks or perineum:",
        prompt_hi: "नितंबों, पूंछ की हड्डी या जननांग के आसपास के लक्षण चुनें:",
        options: [
          { value: "saddle_anesthesia", label: "Numbness around groin, buttocks or area touching a bicycle saddle", label_hi: "नितंबों या जननांग के आसपास सुन्नपन (सैडल एनेस्थीसिया)" },
          { value: "bowel_bladder_incontinence", label: "Accidental leaking or loss of control over urine or stool", label_hi: "पेशाब या पाखाने पर नियंत्रण खो जाना" },
          { value: "morning_stiffness_30m", label: "Morning stiffness lasting >30 minutes that improves with walking", label_hi: "सुबह उठने पर 30 मिनट से अधिक जकड़न जो चलने से कम होती है" },
          { value: "tailbone_sitting", label: "Pain strictly when sitting directly on hard surfaces (Coccydynia)", label_hi: "कठोर सतह पर बैठने पर पूंछ की हड्डी में दर्द" }
        ],
        required: true
      },
      {
        id: "sacrum_pain_radiation",
        type: "single_choice",
        prompt: "Does the pain radiate down into the thighs or legs?",
        prompt_hi: "क्या यह दर्द जांघों या पैरों में नीचे तक फैलता है?",
        options: [
          { value: "shooting_sciatica", label: "Electric shooting pain traveling past the knee to the foot (Sciatica)", label_hi: "घुटने के नीचे पैर तक बिजली जैसा तेज दर्द (सायटिका)" },
          { value: "buttock_posterior_thigh", label: "Ache extending to buttock and posterior thigh only", label_hi: "केवल नितंब और जांघ के पिछले हिस्से तक" },
          { value: "localized_sacrum", label: "Strictly localized over the sacrum and tailbone", label_hi: "केवल पूंछ की हड्डी या त्रिक क्षेत्र में ही सीमित" }
        ],
        required: true
      }
    ]
  },

  // ========================================================
  // 19. MAJOR ARTICULAR JOINTS (Shoulders, Elbows, Wrists, Hips, Ankles)
  // ========================================================
  joint_shoulder_l: {
    organId: "joint_shoulder_l",
    title: "Left Shoulder Joint History",
    clinicalGuideline: "AAOS Guidelines for Glenohumeral & Rotator Cuff Disorders & ACS Synergy",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_SHOULDER_ACS_CROSS_REGION",
        criteria: (answers) => {
          const char = answers.shoulder_character || "";
          const assoc = answers.shoulder_associated || [];
          return char.includes("heaviness_pressure") && (assoc.includes("chest_tightness") || assoc.includes("sweating"));
        },
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Left Shoulder Ache with Concomitant Chest Tightness / Diaphoresis. High clinical probability of Acute Myocardial Infarction. Emergency ECG required."
      }
    ],
    questions: [
      {
        id: "shoulder_character",
        type: "single_choice",
        prompt: "How does the shoulder discomfort feel?",
        prompt_hi: "कंधे में दर्द किस प्रकार का है?",
        options: [
          { value: "mechanical_overhead", label: "Sharp catch when lifting arm overhead (Impingement/Rotator cuff)", label_hi: "हाथ ऊपर उठाते समय तेज खिंचाव या अटकन" },
          { value: "heaviness_pressure", label: "Deep heavy dull ache or numbness radiating down the arm", label_hi: "गहरा भारीपन या हाथ में नीचे तक सुन्नपन" },
          { value: "frozen_restricted", label: "Severe stiffness with almost zero movement in all directions (Frozen shoulder)", label_hi: "कंधा पूरी तरह जाम होना" }
        ],
        required: true
      },
      {
        id: "shoulder_associated",
        type: "multi_choice",
        prompt: "Are you having any of these associated signs?",
        prompt_hi: "क्या इनमें से कोई अन्य लक्षण भी हैं?",
        options: [
          { value: "chest_tightness", label: "Concurrent chest pressure or shortness of breath", label_hi: "साथ में छाती में भारीपन या सांस फूलना" },
          { value: "sweating", label: "Unexplained cold sweating or nausea", label_hi: "बिना वजह ठंडा पसीना या जी मिचलाना" },
          { value: "recent_fall_dislocation", label: "Popped out of place or sudden deformity after a fall", label_hi: "गिरने के बाद कंधे की हड्डी खिसकना" }
        ],
        required: false
      }
    ]
  },

  joint_shoulder_r: {
    organId: "joint_shoulder_r",
    title: "Right Shoulder Joint History",
    clinicalGuideline: "AAOS Guidelines for Rotator Cuff Tears & Glenohumeral Instability",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [],
    questions: [
      {
        id: "shoulder_character",
        type: "single_choice",
        prompt: "When does the right shoulder hurt most?",
        prompt_hi: "दाहिने कंधे में दर्द कब सबसे ज्यादा होता है?",
        options: [
          { value: "overhead_reaching", label: "When reaching up or putting on clothes", label_hi: "ऊपर हाथ ले जाने या कपड़े पहनते समय" },
          { value: "night_sleeping", label: "Throbbing ache preventing sleeping on right side", label_hi: "दाहिनी करवट सोने पर दर्द" },
          { value: "constant_stiff", label: "Constant deep stiffness", label_hi: "लगातार गहरी जकड़न" }
        ],
        required: true
      },
      {
        id: "shoulder_movement_limit",
        type: "single_choice",
        prompt: "Is your arm movement restricted?",
        prompt_hi: "क्या हाथ हिलाने-डुलाने में रुकावट है?",
        options: [
          { value: "cannot_lift_overhead", label: "Cannot raise arm above shoulder level without sharp pain", label_hi: "कंधे से ऊपर हाथ उठाना दर्द के कारण असंभव है" },
          { value: "weakness_dropping", label: "Sudden arm weakness or inability to hold objects up", label_hi: "हाथ में अचानक कमजोरी या सामान छूट जाना" },
          { value: "full_range_with_ache", label: "Can move arm fully but with mild soreness", label_hi: "हाथ पूरा हिलता है, सिर्फ हल्का दर्द है" }
        ],
        required: true
      }
    ]
  },

  joint_elbow_l: {
    organId: "joint_elbow_l",
    title: "Left Elbow Joint History",
    clinicalGuideline: "AAOS Clinical Practice Guidelines for Tendinopathy & Cubital Tunnel Syndrome",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [],
    questions: [
      {
        id: "elbow_location",
        type: "single_choice",
        prompt: "Where is the elbow discomfort located?",
        prompt_hi: "कोहनी में दर्द कहाँ स्थित है?",
        options: [
          { value: "outer_lateral", label: "Outer side of elbow when gripping things (Tennis elbow)", label_hi: "चीजें पकड़ने पर कोहनी के बाहरी हिस्से में दर्द" },
          { value: "inner_medial", label: "Inner side of elbow (Golfer elbow)", label_hi: "कोहनी के अंदरूनी हिस्से में दर्द" },
          { value: "tingling_pinky", label: "Numbness / electric shock radiating into pinky & ring finger (Cubital tunnel)", label_hi: "कनिष्ठिका (छोटी उंगली) में झनझनाहट या करंट" }
        ],
        required: true
      },
      {
        id: "elbow_swelling_motion",
        type: "single_choice",
        prompt: "Is there visible swelling or inability to straighten your left arm?",
        prompt_hi: "क्या बाएं हाथ को सीधा करने में परेशानी या सूजन है?",
        options: [
          { value: "cannot_bend_straighten", label: "Locked elbow or unable to bend/straighten fully", label_hi: "कोहनी पूरी तरह मुड़ या सीधी नहीं हो पा रही" },
          { value: "swollen_warm", label: "Visible fluid swelling and warmth over joint", label_hi: "जोड़ पर सूजन और गर्माहट" },
          { value: "mild_strain_no_swelling", label: "Mild stiffness without visible swelling", label_hi: "बिना सूजन के हल्की जकड़न" }
        ],
        required: true
      }
    ]
  },

  joint_elbow_r: {
    organId: "joint_elbow_r",
    title: "Right Elbow Joint History",
    clinicalGuideline: "AAOS Clinical Practice Guidelines for Tendinopathy & Cubital Tunnel Syndrome",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [],
    questions: [
      {
        id: "elbow_location",
        type: "single_choice",
        prompt: "Where is the right elbow discomfort located?",
        prompt_hi: "दाहिनी कोहनी में दर्द कहाँ है?",
        options: [
          { value: "outer_lateral", label: "Outer side of elbow when gripping or lifting (Tennis elbow)", label_hi: "चीजें उठाते समय बाहरी हिस्से में दर्द" },
          { value: "inner_medial", label: "Inner bony bump (Golfer elbow)", label_hi: "अंदरूनी हिस्से में दर्द" },
          { value: "olecranon_swelling", label: "Fluid-filled egg-like swelling on elbow tip (Bursitis)", label_hi: "कोहनी की नोक पर पानी की थैली जैसी सूजन" }
        ],
        required: true
      },
      {
        id: "elbow_swelling_motion",
        type: "single_choice",
        prompt: "Is there visible swelling or restriction in bending your right arm?",
        prompt_hi: "क्या दाहिने हाथ को मोड़ने में परेशानी या सूजन है?",
        options: [
          { value: "cannot_bend_straighten", label: "Cannot bend or straighten right elbow fully", label_hi: "दाहिनी कोहनी पूरी तरह मुड़ या सीधी नहीं हो रही" },
          { value: "swollen_warm", label: "Visible warmth or puffiness over the joint", label_hi: "जोड़ पर गर्माहट या सूजन" },
          { value: "mild_strain_no_swelling", label: "Pain only during specific movements/gripping", label_hi: "सामान पकड़ने या खास हरकतों पर ही दर्द" }
        ],
        required: true
      }
    ]
  },

  joint_wrist_l: {
    organId: "joint_wrist_l",
    title: "Left Wrist Joint History",
    clinicalGuideline: "AAOS Guidelines for Carpal Tunnel Syndrome & Scaphoid Injuries",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [],
    questions: [
      {
        id: "wrist_symptoms",
        type: "single_choice",
        prompt: "What is your main wrist complaint?",
        prompt_hi: "कलाई में मुख्य समस्या क्या है?",
        options: [
          { value: "carpal_tunnel_numbness", label: "Tingling, burning or numbness in thumb, index and middle fingers (worse at night)", label_hi: "अंगूठे और उंगलियों में झनझनाहट/सुन्नपन जो रात में बढ़ता है" },
          { value: "snuffbox_fall", label: "Deep pain at base of thumb following a fall on outstretched hand", label_hi: "हाथ के बल गिरने के बाद अंगूठे की जड़ में गहरा दर्द" },
          { value: "stiff_swelling", label: "Swollen stiff wrist joint in the morning", label_hi: "सुबह कलाई में सूजन और जकड़न" }
        ],
        required: true
      },
      {
        id: "wrist_functional_grip",
        type: "single_choice",
        prompt: "How does this affect your left hand grip and daily tasks?",
        prompt_hi: "बाएं हाथ की पकड़ और दैनिक कार्यों पर क्या असर पड़ रहा है?",
        options: [
          { value: "dropping_objects", label: "Weak grip causing objects or cups to slip and drop", label_hi: "कमजोर पकड़ के कारण हाथ से चीजें या कप छूट जाना" },
          { value: "pain_twisting", label: "Pain strictly when twisting jars or doorknobs", label_hi: "ढक्कन खोलने या दरवाजे का हैंडल घुमाने पर दर्द" },
          { value: "mild_discomfort", label: "Manageable discomfort during desk or phone use", label_hi: "फोन या कंप्यूटर इस्तेमाल के समय हल्का दर्द" }
        ],
        required: true
      }
    ]
  },

  joint_wrist_r: {
    organId: "joint_wrist_r",
    title: "Right Wrist Joint History",
    clinicalGuideline: "AAOS Guidelines for Carpal Tunnel Syndrome & Scaphoid Injuries",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [],
    questions: [
      {
        id: "wrist_symptoms",
        type: "single_choice",
        prompt: "What is your main right wrist complaint?",
        prompt_hi: "दाहिनी कलाई में मुख्य समस्या क्या है?",
        options: [
          { value: "carpal_tunnel_numbness", label: "Numbness and tingling in thumb/fingers with typing or driving", label_hi: "टाइपिंग या काम करते समय उंगलियों में सुन्नपन" },
          { value: "snuffbox_fall", label: "Pain at base of thumb after recent fall (Scaphoid tender)", label_hi: "गिरने के बाद अंगूठे के पास तेज दर्द" },
          { value: "clicking_tendon", label: "Clicking or popping near thumb side when making a fist (De Quervain)", label_hi: "मुट्ठी बांधने पर अंगूठे की तरफ चटकने की आवाज और दर्द" }
        ],
        required: true
      },
      {
        id: "wrist_functional_grip",
        type: "single_choice",
        prompt: "Does the right wrist discomfort impact your grip or writing?",
        prompt_hi: "क्या दाहिनी कलाई के दर्द से लिखने या पकड़ने में परेशानी होती है?",
        options: [
          { value: "dropping_objects", label: "Loss of hand grip strength with frequent dropped items", label_hi: "हाथ की पकड़ ढीली पड़ना और चीजें गिरना" },
          { value: "pain_writing_mouse", label: "Pain while writing, using computer mouse, or driving", label_hi: "लिखते समय, माउस चलाते या गाड़ी चलाते समय दर्द" },
          { value: "mild_discomfort", label: "Mild intermittent stiffness only", label_hi: "सिर्फ हल्की कभी-कभार होने वाली जकड़न" }
        ],
        required: true
      }
    ]
  },

  joint_hip_l: {
    organId: "joint_hip_l",
    title: "Left Hip Joint History",
    clinicalGuideline: "AAOS Clinical Practice Guidelines for Hip Osteoarthritis & Femoroacetabular Impingement",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_HIP_SEPTIC_ARTHRITIS_L",
        criteria: (answers) => answers.hip_weightbearing === "unable_bear_weight" && (answers.hip_signs || []).includes("fever"),
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Inability to Bear Weight + Fever in Hip Joint. High suspicion for Acute Septic Arthritis. Immediate joint aspiration and emergency orthopedics required."
      }
    ],
    questions: [
      {
        id: "hip_location",
        type: "single_choice",
        prompt: "Where is the left hip discomfort felt most?",
        prompt_hi: "बाएं कूल्हे का दर्द मुख्य रूप से कहाँ महसूस होता है?",
        options: [
          { value: "deep_groin", label: "Deep in the groin fold (True hip joint arthritis/labral tear)", label_hi: "जांघ के जोड़ (ग्रोइन) की गहराई में" },
          { value: "outer_buttock", label: "Outer side of hip over bone (Trochanteric bursitis)", label_hi: "कूल्हे की बाहरी हड्डी पर" },
          { value: "radiating_knee", label: "Radiating down front of thigh to the knee", label_hi: "जांघ के आगे से घुटने तक" }
        ],
        required: true
      },
      {
        id: "hip_weightbearing",
        type: "single_choice",
        prompt: "Can you put weight on your left leg?",
        prompt_hi: "क्या आप बाएं पैर पर वजन दे सकते हैं?",
        options: [
          { value: "unable_bear_weight", label: "Completely unable to put foot down or walk", label_hi: "पैर नीचे रखना या चलना बिल्कुल असंभव है" },
          { value: "limp_walk", label: "Can walk with noticeable limp", label_hi: "लंगड़ा कर चल सकते हैं" },
          { value: "normal_weight", label: "Can bear weight with mild discomfort", label_hi: "हल्के दर्द के साथ वजन सह सकते हैं" }
        ],
        required: true
      }
    ]
  },

  joint_hip_r: {
    organId: "joint_hip_r",
    title: "Right Hip Joint History",
    clinicalGuideline: "AAOS Clinical Practice Guidelines for Hip Osteoarthritis",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_HIP_SEPTIC_ARTHRITIS_R",
        criteria: (answers) => answers.hip_weightbearing === "unable_bear_weight" && (answers.hip_signs || []).includes("fever"),
        urgency: "EMERGENCY_PRIORITY_1",
        reason: "Acute Right Septic Hip Arthritis or Femoral Neck Fracture. Emergency orthopedic evaluation required."
      }
    ],
    questions: [
      {
        id: "hip_location",
        type: "single_choice",
        prompt: "Where is the right hip pain concentrated?",
        prompt_hi: "दाहिने कूल्हे का दर्द कहाँ है?",
        options: [
          { value: "deep_groin", label: "Deep groin fold", label_hi: "जांघ के जोड़ में" },
          { value: "outer_bone", label: "Outer lateral hip bone", label_hi: "बाहरी हड्डी पर" }
        ],
        required: true
      },
      {
        id: "hip_weightbearing",
        type: "single_choice",
        prompt: "Can you bear weight on your right leg?",
        prompt_hi: "क्या आप दाहिने पैर पर वजन दे सकते हैं?",
        options: [
          { value: "unable_bear_weight", label: "Completely unable to walk or bear weight", label_hi: "चलना या वजन देना नामुमकिन है" },
          { value: "can_walk", label: "Can walk with stiffness", label_hi: "जकड़न के साथ चल सकते हैं" }
        ],
        required: true
      }
    ]
  },

  joint_ankle_l: {
    organId: "joint_ankle_l",
    title: "Left Ankle Joint History",
    clinicalGuideline: "Ottawa Ankle Rules for Acute Ankle Injury & Ligament Tears",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_ANKLE_OTTAWA_FRACTURE_L",
        criteria: (answers) => answers.ankle_weightbearing === "cannot_take_4_steps" && (answers.ankle_signs || []).includes("bone_tenderness"),
        urgency: "EMERGENCY_PRIORITY_2",
        reason: "Ottawa Ankle Rule Positive: Inability to take 4 weight-bearing steps + Bony malleolar tenderness. Urgent ankle radiographic series (X-ray) required."
      }
    ],
    questions: [
      {
        id: "ankle_weightbearing",
        type: "single_choice",
        prompt: "Can you take 4 steps immediately after the injury and now?",
        prompt_hi: "क्या आप चोट के तुरंत बाद और अभी 4 कदम चल सकते हैं?",
        options: [
          { value: "cannot_take_4_steps", label: "Cannot take 4 steps even with limping (Ottawa positive)", label_hi: "4 कदम भी नहीं चल सकते (ओटावा पॉजिटिव)" },
          { value: "can_walk_limp", label: "Can take steps despite pain and limping", label_hi: "दर्द के बावजूद लंगड़ा कर कदम रख सकते हैं" }
        ],
        required: true
      },
      {
        id: "ankle_signs",
        type: "multi_choice",
        prompt: "Select any signs present in the left ankle:",
        prompt_hi: "टखने में दिखने वाले लक्षण चुनें:",
        options: [
          { value: "bone_tenderness", label: "Tenderness directly over outer or inner ankle bone (Malleolus)", label_hi: "टखने की हड्डी दबाने पर तेज दर्द" },
          { value: "rapid_swelling_bruising", label: "Rapid swelling and purple bruising within 1 hour of sprain", label_hi: "मोच के 1 घंटे के अंदर तेज सूजन और नीला पड़ना" },
          { value: "popping_snap", label: "Felt or heard an audible pop or snap during injury", label_hi: "चोट लगते समय चटकने की आवाज सुनाई देना" }
        ],
        required: false
      }
    ]
  },

  joint_ankle_r: {
    organId: "joint_ankle_r",
    title: "Right Ankle Joint History",
    clinicalGuideline: "Ottawa Ankle Rules for Acute Ankle Injury & Ligament Tears",
    needsReviewByClinician: true,
    version: QUESTION_BANK_VERSION,
    redFlags: [
      {
        ruleId: "RED_ANKLE_OTTAWA_FRACTURE_R",
        criteria: (answers) => answers.ankle_weightbearing === "cannot_take_4_steps" && (answers.ankle_signs || []).includes("bone_tenderness"),
        urgency: "EMERGENCY_PRIORITY_2",
        reason: "Ottawa Ankle Rule Positive: Inability to take 4 steps + Bony malleolar tenderness. Urgent ankle X-ray required."
      }
    ],
    questions: [
      {
        id: "ankle_weightbearing",
        type: "single_choice",
        prompt: "Can you take 4 steps on your right foot?",
        prompt_hi: "क्या आप दाहिने पैर पर 4 कदम चल सकते हैं?",
        options: [
          { value: "cannot_take_4_steps", label: "Cannot take 4 steps (Ottawa positive)", label_hi: "4 कदम भी नहीं चल सकते" },
          { value: "can_walk_limp", label: "Can walk with noticeable limp", label_hi: "लंगड़ा कर चल सकते हैं" }
        ],
        required: true
      },
      {
        id: "ankle_signs",
        type: "multi_choice",
        prompt: "Select signs present in the right ankle:",
        prompt_hi: "दाहिने टखने में दिखने वाले लक्षण चुनें:",
        options: [
          { value: "bone_tenderness", label: "Tenderness directly over ankle bone", label_hi: "हड्डी पर सीधा दर्द" },
          { value: "rapid_swelling_bruising", label: "Rapid swelling and bruising", label_hi: "तेज सूजन और नीला पड़ना" }
        ],
        required: false
      }
    ]
  }
});

// ========================================================
// GLOBAL CONTEXT QUESTIONS (Completed across all organ intakes)
// ========================================================
export const GLOBAL_CONTEXT_QUESTIONS = [
  {
    id: "severity",
    type: "scale_0_10",
    prompt: "Rate your overall discomfort on a scale of 0 (no pain) to 10 (worst imaginable pain):",
    prompt_hi: "अपने दर्द की तीव्रता को 0 (बिल्कुल नहीं) से 10 (असहनीय) के पैमाने पर बताएं:",
    min: 0,
    max: 10,
    required: true
  },
  {
    id: "duration_trend",
    type: "single_choice",
    prompt: "How is the symptom progressing over time?",
    prompt_hi: "समय के साथ यह समस्या किस ओर जा रही है?",
    options: [
      { value: "rapidly_worsening", label: "Rapidly worsening", label_hi: "तेजी से बिगड़ रही है" },
      { value: "gradually_worsening", label: "Gradually getting worse", label_hi: "धीरे-धीरे बढ़ रही है" },
      { value: "stable_fluctuating", label: "Stable / Comes and goes", label_hi: "एक जैसी है / कभी कम कभी ज्यादा" },
      { value: "improving", label: "Gradually improving", label_hi: "धीरे-धीरे सुधर रही है" }
    ],
    required: true
  },
  {
    id: "pregnancy_status",
    type: "single_choice",
    applicableGender: "female",
    prompt: "Is there a possibility of current pregnancy?",
    prompt_hi: "क्या वर्तमान में गर्भावस्था की संभावना है?",
    options: [
      { value: "pregnant_confirmed", label: "Yes - Confirmed pregnant", label_hi: "हाँ - गर्भवती हैं" },
      { value: "possibly_pregnant", label: "Possible / Missed period", label_hi: "संभावना है / माहवारी छूटी है" },
      { value: "not_pregnant", label: "No / Not applicable", label_hi: "नहीं / लागू नहीं" }
    ],
    required: false
  }
];

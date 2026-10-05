/**
 * MediKiosk Comprehensive Internationalization & Multi-Language Engine (i18n)
 * Supports 6 Indic & International Languages:
 *   - English (en)
 *   - Hindi / हिन्दी (hi)
 *   - Bengali / বাংলা (bn)
 *   - Tamil / தமிழ் (ta)
 *   - Telugu / తెలుగు (te)
 *   - Marathi / मराठी (mr)
 */

export const TRANSLATIONS = {
  en: {
    // Header & Quick Toolbar
    app_title: "MediKiosk • Smart Clinical Intake",
    mode_kiosk: "Patient Kiosk Terminal",
    mode_doctor: "Doctor OPD Desk",
    quick_intake_mode: "Clinical Intake Mode (Live OPD Station)",
    quick_new_patient: "New Walk-In Patient",
    quick_optical_scan: "Optical Vitals Scan",
    quick_scan_report: "Scan Prescription / Lab Report",

    // Stepper
    step1_title: "Patient Registration",
    step1_sub: "ABHA ID & Demographics",
    step2_title: "Vitals & Intake",
    step2_sub: "Contactless Vitals & Symptoms",
    step3_title: "Records & Prescriptions",
    step3_sub: "Prescription & Lab OCR",
    step4_title: "Encounter Summary",
    step4_sub: "OPD Token & Consultation",

    // Step 1: Registration
    reg_title: "Patient Registration & ABHA Check-In",
    reg_subtitle: "Enter demographics or scan Ayushman Bharat Health Account (ABHA) Card",
    audio_guide_btn: "Audio Guide",
    full_name_label: "Full Name",
    full_name_ph: "e.g. Smt. Sunita Devi",
    age_label: "Age",
    age_ph: "e.g. 48",
    gender_label: "Gender",
    gender_female: "Female",
    gender_male: "Male",
    gender_other: "Other",
    abha_label: "ABHA Health ID (Ayushman Bharat)",
    abha_ph: "91-XXXX-XXXX-XXXX",
    mobile_label: "Mobile Contact Number",
    mobile_ph: "+91 98765 43210",
    dpdp_title: "Digital Personal Data Protection (DPDP) Act 2023 Compliance",
    dpdp_desc: "Health data is processed ephemerally during this clinical encounter and linked to your ABHA profile under ABDM security standards.",
    btn_proceed_vitals: "Proceed to Vitals & Intake ",

    // Step 2: Vitals & Symptoms
    vitals_title: "Contactless Optical Vitals Scanner",
    vitals_subtitle: "Look directly at the camera to measure pulse, blood oxygen, and respiration",
    rapid_scan_btn: "30s Rapid Scan",
    diagnostic_scan_btn: "60s Diagnostic HRV",
    ayush_mode_btn: "AYUSH Mode",
    vitals_calibrated: "Vitals Calibrated & Locked",
    vitals_calibrated_sub: "Optical hemodynamics verified and saved.",
    camera_req_btn: "Click to Enable Camera",
    btn_scan_vitals: "Scan Vitals",
    btn_scanning_vitals: "Measuring Pulse Wave...",
    auto_scan_msg: "Auto-Scanning in 2s (Click Now)",
    telemetry_hr: "Heart Rate",
    telemetry_hr_unit: "BPM",
    telemetry_spo2: "Blood Oxygen (SpO₂)",
    telemetry_spo2_unit: "%",
    telemetry_stress: "Stress / Energy",
    telemetry_stress_unit: "/100",
    telemetry_hrv: "HRV Stability",
    telemetry_hrv_unit: "ms",
    telemetry_resp: "Breathing Rate",
    telemetry_resp_unit: "RPM",
    status_normal: "Normal",
    status_optimal: "Optimal",
    status_resting: "Resting Normal",
    status_relaxed: "Relaxed",
    vitals_summary_badge: "All measured vitals within clinical observation range",

    // Step 2: Voice & Symptoms
    voice_mic_title: "Tap Microphone to Speak Symptoms",
    voice_mic_sub: "Speak naturally in your preferred language or type your health problem below",
    voice_listening: "Listening... Speak your symptoms clearly now",
    chief_complaint_label: "Chief Health Complaint / Symptoms",
    chief_complaint_ph: "e.g. fever for 3 days, dry cough, severe headache, chest discomfort...",
    quick_symptoms_title: "Common Symptoms (Tap to Add):",
    sym_fever: "Fever",
    sym_cough: "Cough & Cold",
    sym_headache: "Headache",
    sym_chest_pain: "Chest Pain",
    sym_stomach_pain: "Stomach Ache",
    sym_breathless: "Breathlessness",
    sym_joint_pain: "Joint Pain",
    sym_vomiting: "Vomiting",
    sym_fatigue: "Weakness / Fatigue",
    herbs_title: "Home Herbal Remedies (AYUSH Intake)",
    herbs_sub: "Declare any home remedies you take (e.g. Giloy, Ashwagandha, Karela)",
    herbs_add_btn: "+ Add Remedy",
    herbs_empty: "No home remedies declared. Click '+ Add Remedy' if applicable.",
    socrates_title: "Clinical Symptom Evaluation",
    btn_back: "← Back",
    btn_next_records: "Next: Scan Records ",

    // Step 3: Records & Prescriptions
    doc_title: "Diagnostic Records, Diseases & Prescription Digitization",
    doc_subtitle: "Upload doctor prescriptions, lab panels, or clinical reports for automatic extraction of medicines and health findings",
    upload_dropzone_title: "Upload Prescription or Pathology Report",
    upload_dropzone_desc: "Take a photo or choose a JPG, PNG, or PDF file to extract details",
    upload_btn_photo: "Capture Photo",
    upload_btn_file: "Choose File",
    ocr_processing_msg: "Digitizing medical document & extracting medications and findings...",
    files_processed: "Files Processed",
    dx_heading: "Identified Diagnoses & Health Conditions:",
    dx_empty: "Upload clinical documents, lab reports, or prescriptions to extract health conditions automatically.",
    rx_heading: "Prescribed Medications:",
    rx_empty: "No active medications extracted yet. Upload a prescription above.",
    lab_heading: "Diagnostic Biomarkers & Lab Flags:",
    lab_empty: "No abnormal lab flags detected in this document.",
    verified_badge: "Verified",
    active_badge: "Active",
    btn_gen_summary: "Generate Consultation Token ",

    // Step 4: Summary & Token Slip
    summary_congrats: "Clinical Intake Completed Successfully!",
    summary_subtitle: "Your clinical history, vitals, and digitized records have been forwarded to the Doctor OPD Desk.",
    opd_token_header: "OPD Consultation Token",
    patient_info_label: "Patient",
    age_yrs: "Yrs",
    assigned_dept_label: "Assigned OPD Department",
    default_dept: "General Medicine OPD (Room No. 4)",
    est_wait_label: "Estimated Wait Time",
    est_wait_val: "~10-15 minutes (2 patients ahead)",
    btn_print_slip: "Print Consultation Slip",
    btn_view_fhir: "ABDM Health Record (FHIR R4)",
    btn_doctor_desk: "Switch to Doctor OPD Screen ",
    btn_next_patient: "Register Next Walk-In Patient",

    // Spoken Audio Prompts
    audio_step1: "Welcome to MediKiosk. Please enter your name, age, and phone number to begin.",
    audio_step2: "Please look directly at the camera while we check your vitals. You can also tap the microphone to speak your symptoms.",
    audio_step3: "Please place your doctor's prescription or medical lab report onto the scanner or choose your file.",
    audio_step4: "Your clinical intake is complete. Please collect your OPD consultation token."
  },

  hi: {
    // Header & Quick Toolbar
    app_title: "मेडीकियोस्क • स्मार्ट क्लिनिकल इनटेक",
    mode_kiosk: "मरीज कियोस्क टर्मिनल",
    mode_doctor: "डॉक्टर ओपीडी डेस्क",
    quick_intake_mode: "क्लिनिकल इनटेक मोड (लाइव ओपीडी स्टेशन)",
    quick_new_patient: "नया मरीज पंजीकरण",
    quick_optical_scan: "बिना छुए जांच (वाइटल्स)",
    quick_scan_report: "पर्चा या जांच रिपोर्ट स्कैन करें",

    // Stepper
    step1_title: "मरीज पंजीकरण",
    step1_sub: "आभा आईडी और विवरण",
    step2_title: "वाइटल्स और लक्षण",
    step2_sub: "कैमरा जांच और लक्षण",
    step3_title: "दवा पर्चा और रिपोर्ट",
    step3_sub: "पर्चे और रिपोर्ट की डिजिटल जांच",
    step4_title: "परामर्श पर्ची व टोकन",
    step4_sub: "ओपीडी टोकन नंबर",

    // Step 1: Registration
    reg_title: "मरीज पंजीकरण एवं आभा (ABHA) सत्यापन",
    reg_subtitle: "अपना विवरण दर्ज करें या आयुष्मान भारत स्वास्थ्य खाता (ABHA) कार्ड स्कैन करें",
    audio_guide_btn: "बोलकर सुनें",
    full_name_label: "पूरा नाम",
    full_name_ph: "उदा. श्रीमती सुनीता देवी",
    age_label: "उम्र (वर्ष)",
    age_ph: "उदा. 48",
    gender_label: "लिंग",
    gender_female: "महिला",
    gender_male: "पुरुष",
    gender_other: "अन्य",
    abha_label: "आभा स्वास्थ्य आईडी (आयुष्मान भारत)",
    abha_ph: "91-XXXX-XXXX-XXXX",
    mobile_label: "मोबाइल संपर्क नंबर",
    mobile_ph: "+91 98765 43210",
    dpdp_title: "डिजिटल व्यक्तिगत डेटा संरक्षण कानून (DPDP 2023) अनुरूप",
    dpdp_desc: "आपका स्वास्थ्य डेटा इस मुलाकात के दौरान सुरक्षित रूप से प्रोसेस किया जाता है और राष्ट्रीय स्वास्थ्य प्राधिकरण (ABDM) मानकों के तहत सुरक्षित रहता है।",
    btn_proceed_vitals: "आगे बढ़ें (वाइटल्स व लक्षण) ",

    // Step 2: Vitals & Symptoms
    vitals_title: "कैमरा आधारित वाइटल्स स्कैनर",
    vitals_subtitle: "नब्ज, ऑक्सीजन और सांस की गति जांचने के लिए सीधे कैमरे की ओर देखें",
    rapid_scan_btn: "३० सेकंड त्वरित जांच",
    diagnostic_scan_btn: "६० सेकंड विस्तृत जांच",
    ayush_mode_btn: "आयुष मोड",
    vitals_calibrated: "वाइटल्स सफलतापूर्वक दर्ज",
    vitals_calibrated_sub: "स्वास्थ्य संकेतों की जांच पूरी और सुरक्षित रूप से दर्ज कर ली गई है।",
    camera_req_btn: "कैमरा चालू करने के लिए यहाँ क्लिक करें",
    btn_scan_vitals: "वाइटल्स जांच शुरू करें",
    btn_scanning_vitals: "जांच चल रही है...",
    auto_scan_msg: "२ सेकंड में स्वचालित जांच (क्लिक करें)",
    telemetry_hr: "हृदय गति (Heart Rate)",
    telemetry_hr_unit: "BPM",
    telemetry_spo2: "रक्त ऑक्सीजन (SpO₂)",
    telemetry_spo2_unit: "%",
    telemetry_stress: "तनाव स्तर (Stress)",
    telemetry_stress_unit: "/100",
    telemetry_hrv: "हृदय ताल स्थिरता (HRV)",
    telemetry_hrv_unit: "ms",
    telemetry_resp: "श्वसन दर (Breathing)",
    telemetry_resp_unit: "RPM",
    status_normal: "सामान्य",
    status_optimal: "उत्कृष्ट",
    status_resting: "सामान्य स्थिर",
    status_relaxed: "तनावमुक्त",
    vitals_summary_badge: "सभी मापे गए स्वास्थ्य संकेत सामान्य सीमा के भीतर हैं",

    // Step 2: Voice & Symptoms
    voice_mic_title: "लक्षण बोलने के लिए माइक पर टैप करें",
    voice_mic_sub: "अपनी भाषा में बोलें या नीचे अपनी परेशानी टाइप करें",
    voice_listening: "सुन रहे हैं... कृपया अपनी परेशानी साफ-साफ बोलें",
    chief_complaint_label: "मुख्य स्वास्थ्य समस्या / लक्षण",
    chief_complaint_ph: "उदा. ३ दिनों से तेज बुखार, सूखी खाँसी, सिरदर्द, सीने में दर्द...",
    quick_symptoms_title: "सामान्य लक्षण (जोड़ने के लिए टैप करें):",
    sym_fever: "बुखार",
    sym_cough: "खाँसी व जुकाम",
    sym_headache: "सिरदर्द",
    sym_chest_pain: "सीने में दर्द",
    sym_stomach_pain: "पेट दर्द",
    sym_breathless: "सांस फूलना",
    sym_joint_pain: "जोड़ों में दर्द",
    sym_vomiting: "उल्टी या मतली",
    sym_fatigue: "कमजोरी / थकान",
    herbs_title: "घरेलू या आयुर्वेदिक दवाइयां (AYUSH Intake)",
    herbs_sub: "यदि आप कोई घरेलू काढ़ा, गिलोय, अश्वगंधा आदि लेते हैं तो बताएं",
    herbs_add_btn: "+ दवाई जोड़ें",
    herbs_empty: "कोई घरेलू दवाई दर्ज नहीं है। यदि आप कोई काढ़ा या जड़ी-बूटी लेते हैं तो '+ दवाई जोड़ें' पर क्लिक करें।",
    socrates_title: "लक्षण विवरण व तीव्रता",
    btn_back: "← पीछे जाएं",
    btn_next_records: "अगला: पर्चा स्कैन करें ",

    // Step 3: Records & Prescriptions
    doc_title: "दवा पर्चा और जांच रिपोर्ट की डिजिटल जांच",
    doc_subtitle: "डॉक्टर के पर्चे या जांच रिपोर्ट अपलोड करें - दवाइयों और बीमारियों की स्वचालित पहचान के लिए",
    upload_dropzone_title: "दवा पर्चा या लैब रिपोर्ट अपलोड करें",
    upload_dropzone_desc: "कैमरे से फोटो खींचें या JPG, PNG, PDF फ़ाइल चुनें",
    upload_btn_photo: "फोटो खींचें",
    upload_btn_file: "फाइल चुनें",
    ocr_processing_msg: "दस्तावेज़ की जांच हो रही है - दवाइयों और रिपोर्ट का विश्लेषण जारी...",
    files_processed: "दस्तावेज़ जाँचे गए",
    dx_heading: "पहचानी गई बीमारियां व स्वास्थ्य स्थितियां:",
    dx_empty: "बीमारियों की पहचान के लिए कृपया पर्चा या रिपोर्ट अपलोड करें।",
    rx_heading: "सुझाई गई दवाइयां (Prescribed Medications):",
    rx_empty: "दवाइयों के नाम, खुराक और समय जानने के लिए डॉक्टर का पर्चा अपलोड करें।",
    lab_heading: "लैब टेस्ट और असामान्य मान (Biomarkers):",
    lab_empty: "इस रिपोर्ट में कोई असामान्य परिणाम नहीं पाया गया।",
    verified_badge: "सत्यापित",
    active_badge: "सक्रिय",
    btn_gen_summary: "ओपीडी पर्ची और टोकन प्राप्त करें ",

    // Step 4: Summary & Token Slip
    summary_congrats: "पंजीकरण सफलतापूर्वक संपन्न हुआ!",
    summary_subtitle: "आपकी स्वास्थ्य जानकारी, वाइटल्स और रिपोर्ट डॉक्टर के पास भेज दी गई है।",
    opd_token_header: "ओपीडी परामर्श टोकन",
    patient_info_label: "मरीज",
    age_yrs: "वर्ष",
    assigned_dept_label: "संबंधित विभाग",
    default_dept: "सामान्य चिकित्सा ओपीडी (कमरा नं. ४)",
    est_wait_label: "अनुमानित प्रतीक्षा समय",
    est_wait_val: "~१०-१५ मिनट (आगे २ मरीज हैं)",
    btn_print_slip: "टोकन पर्ची प्रिंट करें",
    btn_view_fhir: "डिजिटल स्वास्थ्य रिकॉर्ड (FHIR R4)",
    btn_doctor_desk: "डॉक्टर ओपीडी स्क्रीन पर जाएं ",
    btn_next_patient: "अगले मरीज का पंजीकरण करें",

    // Spoken Audio Prompts
    audio_step1: "मेडीकियोस्क में आपका स्वागत है। कृपया शुरू करने के लिए अपना नाम, उम्र और मोबाइल नंबर दर्ज करें।",
    audio_step2: "कृपया सीधे कैमरे की ओर देखें जब तक हम आपके स्वास्थ्य संकेतों की जांच करते हैं। लक्षण बताने के लिए माइक दबाकर बोलें।",
    audio_step3: "कृपया अपना डॉक्टर का पर्चा या मेडिकल जांच रिपोर्ट स्कैनर पर रखें या अपलोड करें।",
    audio_step4: "आपका पंजीकरण पूरा हो गया है। कृपया अपना ओपीडी परामर्श टोकन प्राप्त करें।"
  },

  bn: {
    // Header & Quick Toolbar
    app_title: "মেডিকিয়স্ক • স্মার্ট ক্লিনিকাল ইনটেক",
    mode_kiosk: "রোগী কিয়স্ক টার্মিনাল",
    mode_doctor: "ডাক্তার ওপিডি ডেস্ক",
    quick_intake_mode: "ক্লিনিকাল ইনটেক মোড (লাইভ ওপিডি)",
    quick_new_patient: "নতুন রোগী নিবন্ধন",
    quick_optical_scan: "অপটিক্যাল ভাইটালস স্ক্যান",
    quick_scan_report: "প্রেসক্রিপশন বা রিপোর্ট স্ক্যান",

    // Stepper
    step1_title: "রোগী নিবন্ধন",
    step1_sub: "আভা আইডি ও সাধারণ তথ্য",
    step2_title: "শারীরিক লক্ষণ ও পরীক্ষা",
    step2_sub: "কন্ট্যাক্টলেস স্ক্যান ও লক্ষণ",
    step3_title: "প্রেসক্রিপশন ও রিপোর্ট",
    step3_sub: "প্রেসক্রিপশন ও ল্যাব স্ক্যান",
    step4_title: "সাক্ষাৎকার সারাংশ ও টোকেন",
    step4_sub: "ওপিডি টোকেন নম্বর",

    // Step 1: Registration
    reg_title: "রোগী নিবন্ধন ও আভা (ABHA) যাচাইকরণ",
    reg_subtitle: "আপনার তথ্য লিখুন বা আয়ুষ্মান ভারত স্বাস্থ্য কার্ড স্ক্যান করুন",
    audio_guide_btn: "অডিও গাইড",
    full_name_label: "পুরো নাম",
    full_name_ph: "যেমন: শ্রীমতী সুনীতা দেবী",
    age_label: "বয়স (বছর)",
    age_ph: "যেমন: ৪৮",
    gender_label: "লিঙ্গ",
    gender_female: "মহিলা",
    gender_male: "পুরুষ",
    gender_other: "অন্যান্য",
    abha_label: "আভা স্বাস্থ্য আইডি (আয়ুষ্মান ভারত)",
    abha_ph: "91-XXXX-XXXX-XXXX",
    mobile_label: "মোবাইল নম্বর",
    mobile_ph: "+91 98765 43210",
    dpdp_title: "ব্যক্তিগত ডেটা সুরক্ষা আইন (DPDP 2023) সুরক্ষিত",
    dpdp_desc: "আপনার স্বাস্থ্য তথ্য নিরাপদে সংরক্ষিত ও জাতীয় স্বাস্থ্য মিশন নীতি অনুযায়ী প্রক্রিয়া করা হয়।",
    btn_proceed_vitals: "পরবর্তী ধাপে যান (পরীক্ষা ও লক্ষণ) ",

    // Step 2: Vitals & Symptoms
    vitals_title: "কন্ট্যাক্টলেস অপটিক্যাল ভাইটালস স্ক্যানার",
    vitals_subtitle: "পালস, অক্সিজেন এবং শ্বাসযন্ত্রের গতি পরিমাপ করতে ক্যামেরার দিকে তাকান",
    rapid_scan_btn: "৩০ সেকেন্ড দ্রুত স্ক্যান",
    diagnostic_scan_btn: "৬০ সেকেন্ড বিস্তারিত স্ক্যান",
    ayush_mode_btn: "আয়ুষ মোড",
    vitals_calibrated: "ভাইটালস সফলভাবে সম্পন্ন",
    vitals_calibrated_sub: "শারীরিক লক্ষণসমূহ নিশ্চিত ও নথিভুক্ত হয়েছে।",
    camera_req_btn: "ক্যামেরা চালু করতে এখানে ক্লিক করুন",
    btn_scan_vitals: "পরীক্ষা শুরু করুন",
    btn_scanning_vitals: "পরিমাপ চলছে...",
    auto_scan_msg: "২ সেকেন্ডে স্বয়ংক্রিয় স্ক্যান",
    telemetry_hr: "হৃদস্পন্দন (Heart Rate)",
    telemetry_hr_unit: "BPM",
    telemetry_spo2: "রক্তে অক্সিজেন (SpO₂)",
    telemetry_spo2_unit: "%",
    telemetry_stress: "মানসিক চাপ / শক্তি",
    telemetry_stress_unit: "/100",
    telemetry_hrv: "এইচআরভি স্থায়িত্ব (HRV)",
    telemetry_hrv_unit: "ms",
    telemetry_resp: "শ্বাসপ্রশ্বাসের গতি",
    telemetry_resp_unit: "RPM",
    status_normal: "স্বাভাবিক",
    status_optimal: "উত্তম",
    status_resting: "বিশ্রামে স্বাভাবিক",
    status_relaxed: "স্বস্তিদায়ক",
    vitals_summary_badge: "পরিমাপকৃত সকল লক্ষণ স্বাভাবিক সীমার মধ্যে আছে",

    // Step 2: Voice & Symptoms
    voice_mic_title: "লক্ষণ বলতে মাইকে চাপ দিন",
    voice_mic_sub: "আপনার ভাষায় স্বাভাবিকভাবে বলুন বা নীচে লিখুন",
    voice_listening: "শুনছি... দয়া করে আপনার সমস্যা স্পষ্টভাবে বলুন",
    chief_complaint_label: "প্রধান স্বাস্থ্য সমস্যা / লক্ষণ",
    chief_complaint_ph: "যেমন: ৩ দিন ধরে তীব্র জ্বর, কাশি, মাথা ব্যথা, বুকে অস্বস্তি...",
    quick_symptoms_title: "সাধারণ লক্ষণসমূহ (যুক্ত করতে চাপুন):",
    sym_fever: "জ্বর",
    sym_cough: "কাশি ও সর্দি",
    sym_headache: "মাথা ব্যথা",
    sym_chest_pain: "বুকে ব্যথা",
    sym_stomach_pain: "পেটে ব্যথা",
    sym_breathless: "শ্বাসকষ্ট",
    sym_joint_pain: "গাঁটে ব্যথা",
    sym_vomiting: "বমি বা বমি ভাব",
    sym_fatigue: "ক্লান্তি / দুর্বলতা",
    herbs_title: "ঘরোয়া ও আয়ুর্বেদিক ওষুধ (AYUSH Intake)",
    herbs_sub: "নিয়মিত কোনো ভেষজ ওষুধ খেলে জানান",
    herbs_add_btn: "+ ওষুধ যোগ করুন",
    herbs_empty: "কোনো ঘরোয়া ওষুধ যুক্ত করা হয়নি।",
    socrates_title: "লক্ষণের গভীরতা ও তীব্রতা",
    btn_back: "← পেছনে",
    btn_next_records: "পরবর্তী: রিপোর্ট স্ক্যান ",

    // Step 3: Records & Prescriptions
    doc_title: "প্রেসক্রিপশন ও মেডিকেল রিপোর্ট ডিজিটাইজেশন",
    doc_subtitle: "ওষুধ এবং স্বাস্থ্য তথ্য নিষ্কাশনের জন্য প্রেসক্রিপশন বা রিপোর্ট আপলোড করুন",
    upload_dropzone_title: "প্রেসক্রিপশন বা প্যাথলজি রিপোর্ট আপলোড করুন",
    upload_dropzone_desc: "ছবি তুলুন বা JPG, PNG, PDF ফাইল নির্বাচন করুন",
    upload_btn_photo: "ছবি তুলুন",
    upload_btn_file: "ফাইল বাছুন",
    ocr_processing_msg: "মেডিকেল ডকুমেন্ট স্ক্যান এবং তথ্য বিশ্লেষণ হচ্ছে...",
    files_processed: "ফাইল প্রক্রিয়াজাত",
    dx_heading: "শনাক্ত রোগ ও স্বাস্থ্য অবস্থা:",
    dx_empty: "রোগ শনাক্ত করতে প্রেসক্রিপশন বা রিপোর্ট আপলোড করুন।",
    rx_heading: "নির্ধারিত ওষুধসমূহ (Prescribed Medications):",
    rx_empty: "ওষুধের নাম ও মাত্রা জানতে প্রেসক্রিপশন আপলোড করুন।",
    lab_heading: "ল্যাব টেস্ট ও অস্বাভাবিক মান:",
    lab_empty: "কোনো অস্বাভাবিক মান পাওয়া যায়নি।",
    verified_badge: "যাচাইকৃত",
    active_badge: "সক্রিয়",
    btn_gen_summary: "ওপিডি টোকেন তৈরি করুন ",

    // Step 4: Summary & Token Slip
    summary_congrats: "নিবন্ধন সফলভাবে সম্পন্ন হয়েছে!",
    summary_subtitle: "আপনার তথ্য ও রিপোর্ট ডাক্তারের কাছে পাঠানো হয়েছে।",
    opd_token_header: "ওপিডি পরামর্শ টোকেন",
    patient_info_label: "রোগী",
    age_yrs: "বছর",
    assigned_dept_label: "বরাদ্দ বিভাগ",
    default_dept: "সাধারণ মেডিসিন ওপিডি (কক্ষ নং ৪)",
    est_wait_label: "আনুমানিক অপেক্ষার সময়",
    est_wait_val: "~১০-১৫ মিনিট (সামনে ২ জন রোগী)",
    btn_print_slip: "টোকেন প্রিন্ট করুন",
    btn_view_fhir: "ডিজিটাল হেলথ রেকর্ড (FHIR R4)",
    btn_doctor_desk: "ডাক্তার স্ক্রিনে যান ",
    btn_next_patient: "পরবর্তী রোগী নিবন্ধন করুন",

    // Spoken Audio Prompts
    audio_step1: "মেডিকিয়স্কে আপনাকে স্বাগতম। শুরু করার জন্য দয়া করে আপনার নাম, বয়স এবং মোবাইল নম্বর লিখুন।",
    audio_step2: "ক্যামেরার দিকে তাকান যখন আমরা আপনার শারীরিক লক্ষণ পরীক্ষা করছি। আপনার লক্ষণ বলতে মাইক চাপুন।",
    audio_step3: "দয়া করে আপনার প্রেসক্রিপশন বা ল্যাব রিপোর্ট স্ক্যানারে রাখুন বা আপলোড করুন।",
    audio_step4: "আপনার নিবন্ধন সম্পন্ন হয়েছে। দয়া করে আপনার ওপিডি টোকেন সংগ্রহ করুন।"
  },

  ta: {
    // Header & Quick Toolbar
    app_title: "மெடிகியோஸ்க் • ஸ்மார்ட் மருத்துவ உட்கொள்ளல்",
    mode_kiosk: "நோயாளி கியோஸ்க் முனையம்",
    mode_doctor: "மருத்துவர் ஓபிடி மேசை",
    quick_intake_mode: "மருத்துவ உட்கொள்ளல் முறை (நேரடி ஓபிடி)",
    quick_new_patient: "புதிய நோயாளி பதிவு",
    quick_optical_scan: "உடல்நலக் குறியீடு ஸ்கேன்",
    quick_scan_report: "மருந்துச் சீட்டு / அறிக்கை ஸ்கேன்",

    // Stepper
    step1_title: "நோயாளி பதிவு",
    step1_sub: "ஆபா ஐடி மற்றும் விவரங்கள்",
    step2_title: "உடல் குறிகள் & அறிகுறிகள்",
    step2_sub: "தொடர்பற்ற ஸ்கேன் & அறிகுறிகள்",
    step3_title: "மருந்துச் சீட்டு மற்றும் அறிக்கைகள்",
    step3_sub: "டிஜிட்டல் ஸ்கேன்",
    step4_title: "டோக்கன் மற்றும் சுருக்கம்",
    step4_sub: "ஓபிடி டோக்கன் எண்",

    // Step 1: Registration
    reg_title: "நோயாளி பதிவு மற்றும் ஆபா (ABHA) சரிபார்ப்பு",
    reg_subtitle: "உங்கள் விவரங்களை உள்ளிடவும் அல்லது ஆயுஷ்மான் பாரத் கார்டை ஸ்கேன் செய்யவும்",
    audio_guide_btn: "ஆடியோ வழிகாட்டி",
    full_name_label: "முழு பெயர்",
    full_name_ph: "எ.கா. திருமதி சுனிதா தேவி",
    age_label: "வயது",
    age_ph: "எ.கா. 48",
    gender_label: "பாலினம்",
    gender_female: "பெண்",
    gender_male: "ஆண்",
    gender_other: "மற்றவை",
    abha_label: "ஆபா சுகாதார ஐடி (ஆயுஷ்மான் பாரத்)",
    abha_ph: "91-XXXX-XXXX-XXXX",
    mobile_label: "கைபேசி எண்",
    mobile_ph: "+91 98765 43210",
    dpdp_title: "டிஜிட்டல் தனிநபர் தரவு பாதுகாப்பு சட்டம் (DPDP 2023) இணக்கம்",
    dpdp_desc: "உங்கள் உடல்நலத் தரவு பாதுகாப்பாகச் செயல்படுத்தப்பட்டு தேசிய தரநிலைகளின்படி பாதுகாக்கப்படுகிறது.",
    btn_proceed_vitals: "அடுத்த படிக்கு செல்லவும் ",

    // Step 2: Vitals & Symptoms
    vitals_title: "தொடர்பற்ற உடல்நலக் குறியீடு ஸ்கேனர்",
    vitals_subtitle: "நாடித் துடிப்பு, ஆக்ஸிஜன் மற்றும் சுவாசத்தை அளவிட கேமராவை நேராகப் பாருங்கள்",
    rapid_scan_btn: "30 வினாடி விரைவு ஸ்கேன்",
    diagnostic_scan_btn: "60 வினாடி முழு ஸ்கேன்",
    ayush_mode_btn: "ஆயுஷ் முறை",
    vitals_calibrated: "குறியீடுகள் பதிவு செய்யப்பட்டன",
    vitals_calibrated_sub: "உடல்நலக் குறியீடுகள் வெற்றிகரமாகச் சரிபார்க்கப்பட்டு சேமிக்கப்பட்டன.",
    camera_req_btn: "கேமராவை இயக்க இங்கே கிளிக் செய்யவும்",
    btn_scan_vitals: "ஸ்கேன் தொடங்கவும்",
    btn_scanning_vitals: "அளவிடப்படுகிறது...",
    auto_scan_msg: "2 வினாடிகளில் தானியங்கி ஸ்கேன்",
    telemetry_hr: "இதய துடிப்பு (Heart Rate)",
    telemetry_hr_unit: "BPM",
    telemetry_spo2: "இரத்த ஆக்ஸிஜன் (SpO₂)",
    telemetry_spo2_unit: "%",
    telemetry_stress: "மன அழுத்தம் / ஆற்றல்",
    telemetry_stress_unit: "/100",
    telemetry_hrv: "இதய துடிப்பு மாறுபாடு (HRV)",
    telemetry_hrv_unit: "ms",
    telemetry_resp: "சுவாச வீதம் (Breathing)",
    telemetry_resp_unit: "RPM",
    status_normal: "இயல்பானது",
    status_optimal: "சிறந்தது",
    status_resting: "ஓய்வில் இயல்பானது",
    status_relaxed: "நிம்மதியான",
    vitals_summary_badge: "அளவிடப்பட்ட அனைத்துக் குறியீடுகளும் இயல்பான வரம்பில் உள்ளன",

    // Step 2: Voice & Symptoms
    voice_mic_title: "அறிகுறிகளைப் பேச மைக்கை அழுத்தவும்",
    voice_mic_sub: "உங்கள் மொழியில் பேசுங்கள் அல்லது கீழே உள்ளிடவும்",
    voice_listening: "கேட்கிறது... தயவுசெய்து உங்கள் பிரச்சனையைத் தெளிவாகப் பேசுங்கள்",
    chief_complaint_label: "முக்கிய உடல்நலப் பிரச்சனை / அறிகுறிகள்",
    chief_complaint_ph: "எ.கா. 3 நாட்களாகக் காய்ச்சல், இருமல், தலைவலி, நெஞ்சு வலி...",
    quick_symptoms_title: "பொதுவான அறிகுறிகள் (சேர்க்க தட்டவும்):",
    sym_fever: "காய்ச்சல்",
    sym_cough: "இருமல் & சளி",
    sym_headache: "தலைவலி",
    sym_chest_pain: "நெஞ்சு வலி",
    sym_stomach_pain: "வயிற்று வலி",
    sym_breathless: "மூச்சுத் திணறல்",
    sym_joint_pain: "மூட்டு வலி",
    sym_vomiting: "வாந்தி / குமட்டல்",
    sym_fatigue: "சோர்வு / பலவீனம்",
    herbs_title: "வீட்டு மூலிகை மருந்துகள் (AYUSH Intake)",
    herbs_sub: "நீங்கள் எடுக்கும் மூலிகை மருந்துகள் ஏதேனும் இருந்தால் தெரிவிக்கவும்",
    herbs_add_btn: "+ மருந்து சேர்க்க",
    herbs_empty: "மூலிகை மருந்துகள் எதுவும் சேர்க்கப்படவில்லை.",
    socrates_title: "அறிகுறி தீவிரத்தன்மை",
    btn_back: "← பின்செல்",
    btn_next_records: "அடுத்து: அறிக்கை ஸ்கேன் ",

    // Step 3: Records & Prescriptions
    doc_title: "மருத்துவ ஆவணங்கள் & மருந்துச் சீட்டு டிஜிட்டல் ஸ்கேன்",
    doc_subtitle: "மருந்துகள் மற்றும் நோய்களை தானாகக் கண்டறிய உங்கள் ஆவணங்களைப் பதிவேற்றவும்",
    upload_dropzone_title: "மருந்துச் சீட்டு அல்லது பரிசோதனை அறிக்கை பதிவேற்றவும்",
    upload_dropzone_desc: "புகைப்படம் எடுக்கவும் அல்லது கோப்பைப் பதிவேற்றவும்",
    upload_btn_photo: "புகைப்படம் எடுக்கவும்",
    upload_btn_file: "கோப்பைத் தேர்ந்தெடுக்கவும்",
    ocr_processing_msg: "ஆவணம் ஸ்கேன் செய்யப்பட்டு தகவல்கள் பிரித்தெடுக்கப்படுகின்றன...",
    files_processed: "ஆவணங்கள் ஆராயப்பட்டன",
    dx_heading: "கண்டறியப்பட்ட நோய்கள் மற்றும் நிலைகள்:",
    dx_empty: "நோய்களைக் கண்டறிய ஆவணங்களைப் பதிவேற்றவும்.",
    rx_heading: "பரிந்துரைக்கப்பட்ட மருந்துகள் (Prescribed Medications):",
    rx_empty: "மருந்துகளின் விவரங்களை அறிய மருந்துச் சீட்டைப் பதிவேற்றவும்.",
    lab_heading: "பரிசோதனை முடிவுகள் & எச்சரிக்கைகள்:",
    lab_empty: "அசாதாரண முடிவுகள் எதுவும் இல்லை.",
    verified_badge: "சரிபார்க்கப்பட்டது",
    active_badge: "செயலில்",
    btn_gen_summary: "ஓபிடி டோக்கன் பெறவும் ",

    // Step 4: Summary & Token Slip
    summary_congrats: "பதிவு வெற்றிகரமாக முடிந்தது!",
    summary_subtitle: "உங்கள் தகவல்கள் மற்றும் அறிக்கைகள் மருத்துவரிடம் சமர்ப்பிக்கப்பட்டன.",
    opd_token_header: "ஓபிடி ஆலோசனை டோக்கன்",
    patient_info_label: "நோயாளி",
    age_yrs: "வயது",
    assigned_dept_label: "ஒதுக்கப்பட்ட துறை",
    default_dept: "பொது மருத்துவ ஓபிடி (அறை எண் 4)",
    est_wait_label: "தோராயமான காத்திருப்பு நேரம்",
    est_wait_val: "~10-15 நிமிடங்கள் (முன்னால் 2 நோயாளிகள்)",
    btn_print_slip: "டோக்கன் அச்சிடவும்",
    btn_view_fhir: "டிஜிட்டல் சுகாதார பதிவு (FHIR R4)",
    btn_doctor_desk: "மருத்துவர் திரைக்குச் செல்லவும் ",
    btn_next_patient: "அடுத்த நோயாளியைப் பதிவு செய்க",

    // Spoken Audio Prompts
    audio_step1: "மெடிகியோஸ்க்கிற்கு வருக. தொடங்க தயவுசெய்து உங்கள் பெயர், வயது மற்றும் கைபேசி எண்ணை உள்ளிடவும்.",
    audio_step2: "உங்கள் உடல் குறிகளை அளவிடும்போது கேமராவைப் பாருங்கள். அறிகுறிகளைப் பேச மைக்கை அழுத்தவும்.",
    audio_step3: "தயவுசெய்து உங்கள் மருந்துச் சீட்டு அல்லது பரிசோதனை அறிக்கையை ஸ்கேனரில் வைக்கவும் அல்லது பதிவேற்றவும்.",
    audio_step4: "உங்கள் பதிவு முடிந்தது. தயவுசெய்து உங்கள் ஓபிடி டோக்கனைப் பெற்றுக்கொள்ளுங்கள்."
  },

  te: {
    // Header & Quick Toolbar
    app_title: "మెడికియోస్క్ • స్మార్ట్ క్లినికల్ ఇన్‌టేక్",
    mode_kiosk: "పేషెంట్ కియోస్క్ టెర్మినల్",
    mode_doctor: "డాక్టర్ ఒపిడి డెస్క్",
    quick_intake_mode: "క్లినికల్ ఇన్‌టేక్ మోడ్ (లైవ్ ఒపిడి)",
    quick_new_patient: "కొత్త రోగి నమోదు",
    quick_optical_scan: "వైటల్స్ స్కాన్",
    quick_scan_report: "ప్రిస్క్రిప్షన్ / ల్యాబ్ నివేదిక స్కాన్",

    // Stepper
    step1_title: "రోగి నమోదు",
    step1_sub: "ఆభా ఐడి మరియు వివరాలు",
    step2_title: "వైటల్స్ మరియు లక్షణాలు",
    step2_sub: "కాంటాక్ట్‌లెస్ స్కాన్ & లక్షణాలు",
    step3_title: "ప్రిస్క్రిప్షన్లు & రికార్డులు",
    step3_sub: "డిజిటల్ స్కాన్",
    step4_title: "టోకెన్ మరియు సారాంశం",
    step4_sub: "ఒపిడి టోకెన్ నంబర్",

    // Step 1: Registration
    reg_title: "రోగి నమోదు మరియు ఆభా (ABHA) ధృవీకరణ",
    reg_subtitle: "మీ వివరాలను నమోదు చేయండి లేదా ఆయుష్మాన్ భారత్ హెల్త్ కార్డ్‌ను స్కాన్ చేయండి",
    audio_guide_btn: "ఆడియో గైడ్",
    full_name_label: "పూర్తి పేరు",
    full_name_ph: "ఉదా. శ్రీమతి సునీత దేవి",
    age_label: "వయస్సు (సంవత్సరాలు)",
    age_ph: "ఉదా. 48",
    gender_label: "లింగం",
    gender_female: "మహిళ",
    gender_male: "పురుషుడు",
    gender_other: "ఇతర",
    abha_label: "ఆభా హెల్త్ ఐడి (ఆయుష్మాన్ భారత్)",
    abha_ph: "91-XXXX-XXXX-XXXX",
    mobile_label: "మొబైల్ సంఖ్య",
    mobile_ph: "+91 98765 43210",
    dpdp_title: "డిజిటల్ వ్యక్తిగత డేటా రక్షణ చట్టం (DPDP 2023) సురక్షితం",
    dpdp_desc: "మీ ఆరోగ్య సమాచారం సురక్షితంగా మరియు జాతీయ ప్రమాణాల ప్రకారం నిర్వహించబడుతుంది.",
    btn_proceed_vitals: "తదుపరి దశకు వెళ్లండి ",

    // Step 2: Vitals & Symptoms
    vitals_title: "కాంటాక్ట్‌లెస్ ఆప్టికల్ వైటల్స్ స్కానర్",
    vitals_subtitle: "నాడి, ఆక్సిజన్ మరియు శ్వాసను కొలవడానికి కెమెరా వైపు నేరుగా చూడండి",
    rapid_scan_btn: "30 సెకన్ల వేగవంతమైన స్కాన్",
    diagnostic_scan_btn: "60 సెకన్ల సమగ్ర స్కాన్",
    ayush_mode_btn: "ఆయుష్ మోడ్",
    vitals_calibrated: "వైటల్స్ విజయవంతంగా రికార్డ్ చేయబడ్డాయి",
    vitals_calibrated_sub: "ఆరోగ్య సంకేతాలు ధృవీకరించబడి సేవ్ చేయబడ్డాయి.",
    camera_req_btn: "కెమెరా ప్రారంభించడానికి ఇక్కడ క్లిక్ చేయండి",
    btn_scan_vitals: "స్కాన్ ప్రారంభించండి",
    btn_scanning_vitals: "కొలవడం జరుగుతోంది...",
    auto_scan_msg: "2 సెకన్లలో ఆటో-స్కాన్",
    telemetry_hr: "గుండె కొట్టుకునే వేగం (Heart Rate)",
    telemetry_hr_unit: "BPM",
    telemetry_spo2: "రక్తంలో ఆక్సిజన్ (SpO₂)",
    telemetry_spo2_unit: "%",
    telemetry_stress: "ఒత్తిడి స్థాయి / శక్తి",
    telemetry_stress_unit: "/100",
    telemetry_hrv: "గుండె స్థిరత్వం (HRV)",
    telemetry_hrv_unit: "ms",
    telemetry_resp: "శ్వాసక్రియ రేటు (Breathing)",
    telemetry_resp_unit: "RPM",
    status_normal: "సాధారణం",
    status_optimal: "అద్భుతం",
    status_resting: "విశ్రాంతి సాధారణం",
    status_relaxed: "ప్రశాంతం",
    vitals_summary_badge: "కొలిచిన అన్ని సంకేతాలు సాధారణ పరిమితుల్లో ఉన్నాయి",

    // Step 2: Voice & Symptoms
    voice_mic_title: "లక్షణాలు చెప్పడానికి మైక్‌ను తాకండి",
    voice_mic_sub: "మీ భాషలో మాట్లాడండి లేదా క్రింద నమోదు చేయండి",
    voice_listening: "వింటున్నాము... దయచేసి మీ సమస్యను స్పష్టంగా చెప్పండి",
    chief_complaint_label: "ప్రధాన ఆరోగ్య సమస్య / లక్షణాలు",
    chief_complaint_ph: "ఉదా. 3 రోజులుగా జ్వరం, దగ్గు, తలనొప్పి, ఛాతీలో అసౌకర్యం...",
    quick_symptoms_title: "సాధారణ లక్షణాలు (జోడించడానికి తాకండి):",
    sym_fever: "జ్వరం",
    sym_cough: "దగ్గు & జలుబు",
    sym_headache: "తలనొప్పి",
    sym_chest_pain: "ఛాతీ నొప్పి",
    sym_stomach_pain: "కడుపు నొప్పి",
    sym_breathless: "శ్వాస ఆడకపోవడం",
    sym_joint_pain: "కీళ్ల నొప్పులు",
    sym_vomiting: "వాంతులు",
    sym_fatigue: "నీరసం / అలసట",
    herbs_title: "గృహ లేదా ఆయుర్వేద మందులు (AYUSH Intake)",
    herbs_sub: "మీరు వాడే మూలికా మందులు ఏమైనా ఉంటే తెలపండి",
    herbs_add_btn: "+ మందు జోడించండి",
    herbs_empty: "గృహ మందులు ఏవీ నమోదు చేయలేదు.",
    socrates_title: "లక్షణ తీవ్రత",
    btn_back: "← వెనుకకు",
    btn_next_records: "తదుపరి: రిపోర్ట్ స్కాన్ ",

    // Step 3: Records & Prescriptions
    doc_title: "వైద్య రికార్డులు & ప్రిస్క్రిప్షన్ల డిజిటలైజేషన్",
    doc_subtitle: "మందులు మరియు ఆరోగ్య వివరాలను స్వయంచాలకంగా పొందడానికి రిపోర్టులను అప్‌లోడ్ చేయండి",
    upload_dropzone_title: "ప్రిస్క్రిప్షన్ లేదా ల్యాబ్ నివేదికను అప్‌లోడ్ చేయండి",
    upload_dropzone_desc: "ఫోటో తీయండి లేదా ఫైల్‌ను అప్‌లోడ్ చేయండి",
    upload_btn_photo: "ఫోటో తీయండి",
    upload_btn_file: "ఫైల్ ఎంచుకోండి",
    ocr_processing_msg: "మెడికల్ డాక్యుమెంట్ స్కాన్ చేయబడుతోంది...",
    files_processed: "పత్రాలు ప్రాసెస్ చేయబడ్డాయి",
    dx_heading: "గుర్తించిన వ్యాధులు & ఆరోగ్య పరిస్థితులు:",
    dx_empty: "వ్యాధులను గుర్తించడానికి పత్రాలను అప్‌లోడ్ చేయండి.",
    rx_heading: "సూచించిన మందులు (Prescribed Medications):",
    rx_empty: "మందుల వివరాలను తెలుసుకోవడానికి ప్రిస్క్రిప్షన్‌ను అప్‌లోడ్ చేయండి.",
    lab_heading: "ల్యాబ్ పరీక్షలు మరియు హెచ్చరికలు:",
    lab_empty: "అసాధారణ ఫలితాలు ఏవీ గుర్తించబడలేదు.",
    verified_badge: "ధృవీకరించబడింది",
    active_badge: "క్రియాశీలం",
    btn_gen_summary: "ఒపిడి టోకెన్ పొందండి ",

    // Step 4: Summary & Token Slip
    summary_congrats: "నమోదు విజయవంతంగా పూర్తయింది!",
    summary_subtitle: "మీ సమాచారం మరియు నివేదికలు వైద్యుడికి పంపబడ్డాయి.",
    opd_token_header: "ఒపిడి కన్సల్టేషన్ టోకెన్",
    patient_info_label: "రోగి",
    age_yrs: "సంవత్సరాలు",
    assigned_dept_label: "కేటాయించిన విభాగం",
    default_dept: "జనరల్ మెడిసిన్ ఒపిడి (గది సంఖ్య 4)",
    est_wait_label: "అంచనా వేసిన నిరీక్షణ సమయం",
    est_wait_val: "~10-15 నిమిషాలు (ముందు 2 రోగులు ఉన్నారు)",
    btn_print_slip: "టోకెన్ ముద్రించండి",
    btn_view_fhir: "డిజిటల్ హెల్త్ రికార్డ్ (FHIR R4)",
    btn_doctor_desk: "డాక్టర్ స్క్రీన్‌కి వెళ్లండి ",
    btn_next_patient: "తదుపరి రోగిని నమోదు చేయండి",

    // Spoken Audio Prompts
    audio_step1: "మెడికియోస్క్‌కి స్వాగతం. ప్రారంభించడానికి దయచేసి మీ పేరు, వయస్సు మరియు మొబైల్ సంఖ్యను నమోదు చేయండి.",
    audio_step2: "వైటల్స్ తనిఖీ చేసే సమయంలో కెమెరా వైపు చూడండి. మీ లక్షణాలు చెప్పడానికి మైక్ ఉపయోగించండి.",
    audio_step3: "దయచేసి మీ ప్రిస్క్రిప్షన్ లేదా ల్యాబ్ నివేదికను స్కానర్‌పై ఉంచండి లేదా అప్‌లోడ్ చేయండి.",
    audio_step4: "మీ నమోదు పూర్తయింది. దయచేసి మీ ఒపిడి టోకెన్ తీసుకోండి."
  },

  mr: {
    // Header & Quick Toolbar
    app_title: "मेडीकिऑस्क • स्मार्ट क्लिनिकल इनटेक",
    mode_kiosk: "रुग्ण किऑस्क टर्मिनल",
    mode_doctor: "डॉक्टर ओपीडी डेस्क",
    quick_intake_mode: "क्लिनिकल इनटेक मोड (थेट ओपीडी)",
    quick_new_patient: "नवीन रुग्ण नोंदणी",
    quick_optical_scan: "वाइटल्स स्कॅन",
    quick_scan_report: "प्रिस्क्रिप्शन किंवा तपासणी अहवाल स्कॅन",

    // Stepper
    step1_title: "रुग्ण नोंदणी",
    step1_sub: "आभा आयडी आणि माहिती",
    step2_title: "वाइटल्स आणि लक्षणे",
    step2_sub: "कॅमेरा स्कॅन आणि लक्षणे",
    step3_title: "प्रिस्क्रिप्शन आणि अहवाल",
    step3_sub: "डिजिटल स्कॅन",
    step4_title: "टोकन आणि सारांश",
    step4_sub: "ओपीडी टोकन नंबर",

    // Step 1: Registration
    reg_title: "रुग्ण नोंदणी आणि आभा (ABHA) पडताळणी",
    reg_subtitle: "आपली माहिती भरा किंवा आयुष्मान भारत कार्ड स्कॅन करा",
    audio_guide_btn: "आवाजात ऐका",
    full_name_label: "पूर्ण नाव",
    full_name_ph: "उदा. सौ. सुनिता देवी",
    age_label: "वय (वर्षे)",
    age_ph: "उदा. ४८",
    gender_label: "लिंग",
    gender_female: "महिला",
    gender_male: "पुरुष",
    gender_other: "इतर",
    abha_label: "आभा आरोग्य आयडी (आयुष्मान भारत)",
    abha_ph: "91-XXXX-XXXX-XXXX",
    mobile_label: "मोबाईल नंबर",
    mobile_ph: "+91 98765 43210",
    dpdp_title: "डिजिटल वैयक्तिक डेटा संरक्षण कायदा (DPDP 2023) सुसंगत",
    dpdp_desc: "आपला आरोग्य डेटा सुरक्षित ठेवला जातो आणि राष्ट्रीय मानकांनुसार हाताळला जातो.",
    btn_proceed_vitals: "पुढे जा (वाइटल्स आणि लक्षणे) ",

    // Step 2: Vitals & Symptoms
    vitals_title: "कॅमेरा आधारित वाइटल्स स्कॅनर",
    vitals_subtitle: "नाडी, ऑक्सिजन आणि श्वसन तपासण्यासाठी कॅमेऱ्याकडे थेट पहा",
    rapid_scan_btn: "३० सेकंद जलद स्कॅन",
    diagnostic_scan_btn: "६० सेकंद सविस्तर स्कॅन",
    ayush_mode_btn: "आयुष मोड",
    vitals_calibrated: "वाइटल्स यशस्वीरित्या नोंदवले",
    vitals_calibrated_sub: "आरोग्य तपासणी पूर्ण झाली असून सुरक्षित नोंदवली आहे.",
    camera_req_btn: "कॅमेरा चालू करण्यासाठी येथे क्लिक करा",
    btn_scan_vitals: "तपासणी सुरू करा",
    btn_scanning_vitals: "तपासणी सुरू आहे...",
    auto_scan_msg: "२ सेकंदात आपोआप स्कॅन",
    telemetry_hr: "हृदयाचे ठोके (Heart Rate)",
    telemetry_hr_unit: "BPM",
    telemetry_spo2: "रक्तातील ऑक्सिजन (SpO₂)",
    telemetry_spo2_unit: "%",
    telemetry_stress: "तणाव पातळी (Stress)",
    telemetry_stress_unit: "/100",
    telemetry_hrv: "हृदय ताल स्थिरता (HRV)",
    telemetry_hrv_unit: "ms",
    telemetry_resp: "श्वसन दर (Breathing)",
    telemetry_resp_unit: "RPM",
    status_normal: "सामान्य",
    status_optimal: "उत्कृष्ट",
    status_resting: "विश्रांती सामान्य",
    status_relaxed: "तणावमुक्त",
    vitals_summary_badge: "सर्व तपासलेले संकेत सामान्य मर्यादेत आहेत",

    // Step 2: Voice & Symptoms
    voice_mic_title: "लक्षणे सांगण्यासाठी माइकवर टॅप करा",
    voice_mic_sub: "आपल्या भाषेत बोला किंवा खाली लिहा",
    voice_listening: "ऐकत आहोत... कृपया आपली लक्षणे स्पष्ट सांगा",
    chief_complaint_label: "मुख्य आरोग्य समस्या / लक्षणे",
    chief_complaint_ph: "उदा. ३ दिवसांपासून ताप, खोकला, डोकेदुखी, छातीत दुखणे...",
    quick_symptoms_title: "सामान्य लक्षणे (जोडण्यासाठी टॅप करा):",
    sym_fever: "ताप",
    sym_cough: "खोकला आणि सर्दी",
    sym_headache: "डोकेदुखी",
    sym_chest_pain: "छातीत दुखणे",
    sym_stomach_pain: "पोटदुखी",
    sym_breathless: "दम लागणे",
    sym_joint_pain: "सांधेदुखी",
    sym_vomiting: "उलटी किंवा मळमळ",
    sym_fatigue: "अशक्तपणा / थकवा",
    herbs_title: "घरगुती किंवा आयुर्वेदिक औषधे (AYUSH Intake)",
    herbs_sub: "नियमित घेत असलेली घरगुती औषधे सांगा",
    herbs_add_btn: "+ औषध जोडा",
    herbs_empty: "कोणतीही घरगुती औषधे नोंदवलेली नाहीत.",
    socrates_title: "लक्षणांची तीव्रता",
    btn_back: "← मागे",
    btn_next_records: "पुढील: अहवाल स्कॅन ",

    // Step 3: Records & Prescriptions
    doc_title: "वैद्यकीय नोंदी आणि प्रिस्क्रिप्शन डिजिटायझेशन",
    doc_subtitle: "औषधे आणि आरोग्याची माहिती मिळवण्यासाठी प्रिस्क्रिप्शन किंवा अहवाल अपलोड करा",
    upload_dropzone_title: "प्रिस्क्रिप्शन किंवा लॅब अहवाल अपलोड करा",
    upload_dropzone_desc: "फोटो काढा किंवा फाईल निवडा",
    upload_btn_photo: "फोटो काढा",
    upload_btn_file: "फाईल निवडा",
    ocr_processing_msg: "दस्तऐवज तपासणी सुरू आहे - औषधे आणि अहवाल तपासत आहे...",
    files_processed: "दस्तऐवज तपासले गेले",
    dx_heading: "ओळखलेले आजार आणि आरोग्य स्थिती:",
    dx_empty: "आजार ओळखण्यासाठी कागदपत्रे अपलोड करा.",
    rx_heading: "लिहून दिलेली औषधे (Prescribed Medications):",
    rx_empty: "औषधांचे नाव आणि डोस जाणून घेण्यासाठी डॉक्टरांचे प्रिस्क्रिप्शन अपलोड करा.",
    lab_heading: "लॅब तपासण्या आणि चाचण्यांचे निकाल:",
    lab_empty: "कोणतेही असामान्य निकाल आढळले नाहीत.",
    verified_badge: "सत्यापित",
    active_badge: "सक्रिय",
    btn_gen_summary: "ओपीडी टोकन मिळवा ",

    // Step 4: Summary & Token Slip
    summary_congrats: "नोंदणी यशस्वीरित्या पूर्ण झाली!",
    summary_subtitle: "आपली माहिती आणि अहवाल डॉक्टरांकडे पाठवले गेले आहेत.",
    opd_token_header: "ओपीडी सल्लामसलत टोकन",
    patient_info_label: "रुग्ण",
    age_yrs: "वर्षे",
    assigned_dept_label: "नेमलेला विभाग",
    default_dept: "सामान्य वैद्यकीय ओपीडी (खोली क्र. ४)",
    est_wait_label: "अंदाजे प्रतीक्षा वेळ",
    est_wait_val: "~१०-१५ मिनिटे (पुढे २ रुग्ण आहेत)",
    btn_print_slip: "टोकन प्रिंट करा",
    btn_view_fhir: "डिजिटल आरोग्य नोंद (FHIR R4)",
    btn_doctor_desk: "डॉक्टर स्क्रीनवर जा ",
    btn_next_patient: "पुढच्या रुग्णाची नोंदणी करा",

    // Spoken Audio Prompts
    audio_step1: "मेडीकिऑस्कमध्ये आपले स्वागत आहे. कृपया सुरू करण्यासाठी आपले नाव, वय आणि मोबाईल नंबर प्रविष्ट करा.",
    audio_step2: "आम्ही आपल्या वाइटल्सची तपासणी करत असताना कॅमेऱ्याकडे पहा. लक्षणे सांगण्यासाठी माइकवर टॅप करा.",
    audio_step3: "कृपया आपले डॉक्टरांचे प्रिस्क्रिप्शन किंवा लॅब अहवाल स्कॅन करा किंवा अपलोड करा.",
    audio_step4: "आपली नोंदणी पूर्ण झाली आहे. कृपया आपले ओपीडी टोकन घ्या."
  }
};

class I18nService {
  constructor() {
    this.currentLanguage = "hi"; // Default Hindi
    try {
      const saved = localStorage.getItem("medikiosk_lang");
      if (saved && TRANSLATIONS[saved]) {
        this.currentLanguage = saved;
      }
    } catch (e) {
      // LocalStorage unavailable
    }
  }

  setLanguage(langCode) {
    if (!TRANSLATIONS[langCode]) {
      console.warn(`[i18n] Language ${langCode} not supported, falling back to en.`);
      langCode = "en";
    }
    this.currentLanguage = langCode;
    try {
      localStorage.setItem("medikiosk_lang", langCode);
    } catch (e) {}
    
    // Update document lang attribute if in browser
    if (typeof document !== "undefined") {
      if (document.documentElement) {
        document.documentElement.lang = langCode;
      }
      const langSelect = document.getElementById("langSelect");
      if (langSelect && langSelect.value !== langCode) {
        langSelect.value = langCode;
      }
    }

    return this.currentLanguage;
  }

  getLanguage() {
    return this.currentLanguage;
  }

  t(key, fallback = "") {
    const dict = TRANSLATIONS[this.currentLanguage] || TRANSLATIONS.en;
    if (dict && dict[key]) {
      return dict[key];
    }
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  }

  getAudioPrompt(key) {
    return this.t(key, "");
  }
}

export const i18n = new I18nService();
export default i18n;

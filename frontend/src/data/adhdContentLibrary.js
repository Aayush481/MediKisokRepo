/**
 * MediKiosk ADHD & Focus Wellness Content Library (Frontend Mirror)
 * Contains DSM-5 clinically validated ADHD screening items with standardized percentage frequency options.
 */

export const ADHD_QUESTION_BANK = {
  version: "2.0.0",
  shortModeQuestionIds: [
    "DEMO_AUDIENCE",
    "ADHD_IN_01",
    "ADHD_IN_02",
    "ADHD_IN_03",
    "ADHD_IN_04",
    "ADHD_IN_05",
    "ADHD_IN_06",
    "ADHD_HY_01",
    "ADHD_HY_02",
    "ADHD_HY_03",
    "ADHD_HY_04",
    "ADHD_IM_01",
    "ADHD_IM_02",
    "IMPAIRMENT_SETTINGS",
    "ONSET_DURATION",
    "CRISIS_SAFETY_CHECK"
  ],
  questions: [
    {
      id: "CONSENT_DPDP",
      domain: "consent",
      promptEn: "Would you like to do a quick, private focus and wellness check?",
      promptHi: "क्या आप एक त्वरित और सुरक्षित फोकस चेक शुरू करना चाहते हैं?",
      helperEn: "Takes about 4 minutes. Your answers are private and secure.",
      helperHi: "इसमें सिर्फ 4 मिनट लगेंगे। आपके उत्तर पूरी तरह सुरक्षित और निजी हैं।",
      type: "single_choice",
      options: [
        { value: "consent_granted_ai", labelEn: "Yes, start check", labelHi: "हाँ, शुरू करें" },
        { value: "consent_granted_rules_only", labelEn: "Yes (Simple mode)", labelHi: "हाँ (साधारण मोड)" },
        { value: "consent_declined", labelEn: "No, go back", labelHi: "नहीं, वापस जाएं" }
      ]
    },
    {
      id: "DEMO_AUDIENCE",
      domain: "demographics",
      promptEn: "Who is this check for today?",
      promptHi: "यह चेक आज किसके लिए है?",
      helperEn: "For children under 18, a parent or guardian should help answer.",
      helperHi: "18 वर्ष से कम उम्र के बच्चों के लिए माता-पिता उत्तर दें।",
      type: "single_choice",
      options: [
        { value: "adult_self", labelEn: "For myself (Adult 18+)", labelHi: "मेरे लिए (वयस्क 18+)" },
        { value: "minor_guardian", labelEn: "For my child or teen", labelHi: "मेरे बच्चे के लिए" }
      ]
    },
    {
      id: "ROUTINE_WAKE",
      domain: "routine",
      promptEn: "Do you wake up around the same time each day?",
      promptHi: "क्या आप रोज लगभग एक ही समय पर उठते हैं?",
      type: "single_choice",
      options: [
        { value: "very_consistent", labelEn: "Yes, around the same time", labelHi: "हाँ, लगभग एक ही समय पर" },
        { value: "moderately_variable", labelEn: "Varies by 1 or 2 hours", labelHi: "1-2 घंटे का अंतर रहता है" },
        { value: "irregular_erratic", labelEn: "Changes a lot / irregular", labelHi: "बहुत अनियमित रहता है" }
      ]
    },
    {
      id: "SLEEP_LATENCY",
      domain: "sleep",
      promptEn: "How long does it usually take you to fall asleep?",
      promptHi: "बिस्तर पर जाने के बाद सोने में कितना समय लगता है?",
      type: "single_choice",
      options: [
        { value: "under_20_min", labelEn: "Under 20 minutes (Quick)", labelHi: "20 मिनट से कम (जल्दी)" },
        { value: "20_to_45_min", labelEn: "20 to 45 minutes", labelHi: "20 से 45 मिनट" },
        { value: "over_45_min", labelEn: "More than 45 minutes", labelHi: "45 मिनट से ज्यादा" }
      ]
    },
    {
      id: "SCREEN_BEDTIME",
      domain: "screentime",
      promptEn: "Do you look at phone or computer screens right before bed?",
      promptHi: "क्या आप सोने से ठीक पहले फोन या स्क्रीन देखते हैं?",
      type: "single_choice",
      options: [
        { value: "rarely_never", labelEn: "Rarely or never", labelHi: "शायद ही कभी या कभी नहीं" },
        { value: "sometimes", labelEn: "Sometimes", labelHi: "कभी-कभी" },
        { value: "almost_every_night", labelEn: "Almost every night", labelHi: "लगभग हर रात" }
      ]
    },
    {
      id: "DIET_MEALS",
      domain: "diet",
      promptEn: "Do you eat your meals at regular times?",
      promptHi: "क्या आप समय पर खाना खाते हैं?",
      type: "single_choice",
      options: [
        { value: "regular_balanced", labelEn: "Yes, regular meal times", labelHi: "हाँ, नियमित समय पर" },
        { value: "often_forget_skip", labelEn: "Often forget to eat when busy", labelHi: "काम में व्यस्त होने पर भूल जाते हैं" },
        { value: "irregular_grazing", labelEn: "Irregular / often skip meals", labelHi: "अक्सर खाना छूट जाता है" }
      ]
    },
    {
      id: "PHYSICAL_ACTIVITY",
      domain: "activity",
      promptEn: "How often do you walk, exercise, or play sports each week?",
      promptHi: "आप हफ्ते में कितनी बार टहलते या कसरत करते हैं?",
      type: "single_choice",
      options: [
        { value: "3_plus_weekly", labelEn: "3 or more days a week", labelHi: "हफ्ते में 3 या अधिक दिन" },
        { value: "1_to_2_weekly", labelEn: "1 or 2 days a week", labelHi: "हफ्ते में 1 या 2 दिन" },
        { value: "rarely_sedentary", labelEn: "Rarely or not at all", labelHi: "शायद ही कभी या कभी नहीं" }
      ]
    },
    {
      id: "ADHD_IN_01",
      domain: "inattention",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time do you make careless mistakes or overlook critical details when executing work, academic, or routine tasks?",
      promptHi: "कितने प्रतिशत समय आप काम, पढ़ाई या रोजमर्रा के कामों में लापरवाही से गलतियां करते हैं या जरूरी बातों पर ध्यान नहीं देते?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "ADHD_IN_02",
      domain: "inattention",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time do you experience difficulty sustaining attention during prolonged tasks, reading, or lengthy lectures?",
      promptHi: "कितने प्रतिशत समय आपको लंबे कामों, पढ़ने या बैठकों के दौरान ध्यान बनाए रखने में कठिनाई होती है?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "ADHD_IN_03",
      domain: "inattention",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time do you struggle to organize multi-step activities, manage deadlines, or maintain an orderly workflow?",
      promptHi: "कितने प्रतिशत समय आपको कई चरणों वाले कामों को व्यवस्थित करने, समय सीमा संभालने या चीजें सही रखने में परेशानी होती है?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "ADHD_IN_04",
      domain: "inattention",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time do you avoid, delay, or resist initiating tasks that require sustained cognitive effort?",
      promptHi: "कितने प्रतिशत समय आप उन कामों को शुरू करने से बचते हैं या टालते हैं जिनमें लगातार मानसिक प्रयास की आवश्यकता होती है?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "ADHD_IN_05",
      domain: "inattention",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time do you misplace or lose items essential for daily functioning and tasks (e.g., keys, documents, devices)?",
      promptHi: "कितने प्रतिशत समय आप रोजमर्रा के जरूरी सामान (जैसे चाबी, कागजात, फोन) खो देते हैं या रखकर भूल जाते हैं?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "ADHD_IN_06",
      domain: "inattention",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time are you sidetracked or distracted by ambient environmental stimuli or unrelated internal thoughts?",
      promptHi: "कितने प्रतिशत समय आपका ध्यान आस-पास की आवाजों या गैर-जरूरी विचारों से भटक जाता है?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "ADHD_HY_01",
      domain: "hyperactivity",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time do you fidget with your hands or feet, tap surfaces, or squirm while seated?",
      promptHi: "कितने प्रतिशत समय बैठते समय आप हाथ या पैर हिलाते रहते हैं या बेचैनी महसूस करते हैं?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "ADHD_HY_02",
      domain: "hyperactivity",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time do you feel compelled to leave your seat in settings where remaining seated is expected?",
      promptHi: "कितने प्रतिशत समय उन जगहों पर जहाँ बैठना जरूरी होता है, आपको उठकर चलने का मन करता है?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "ADHD_HY_03",
      domain: "hyperactivity",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time do you experience persistent inner restlessness or feel uncomfortable remaining still?",
      promptHi: "कितने प्रतिशत समय आप भीतर से बेचैनी महसूस करते हैं या शांत बैठना असहज लगता है?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "ADHD_HY_04",
      domain: "hyperactivity",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time do you find yourself talking excessively or having difficulty engaging in leisure activities quietly?",
      promptHi: "कितने प्रतिशत समय आप बहुत ज्यादा बोलते हैं या शांतिपूर्वक गतिविधियों में भाग लेने में कठिनाई होती है?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "ADHD_IM_01",
      domain: "impulsivity",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time do you blurt out answers before questions are fully stated or complete sentences for others?",
      promptHi: "कितने प्रतिशत समय आप सवाल पूरा होने से पहले ही जवाब दे देते हैं या दूसरों के वाक्य पूरे करने लगते हैं?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "ADHD_IM_02",
      domain: "impulsivity",
      instrument: "DSM5_CRITERIA",
      targetAudience: "all",
      thresholdValue: 2,
      promptEn: "What percentage of the time do you experience difficulty waiting your turn in structured group scenarios, conversations, or queues?",
      promptHi: "कितने प्रतिशत समय आपको कतारों, बातचीत या समूह में अपनी बारी का इंतजार करने में परेशानी होती है?",
      type: "percentage_frequency_scale_0_3",
      options: [
        { value: 0, labelEn: "0% (Never)", labelHi: "0% (कभी नहीं)" },
        { value: 1, labelEn: "1% – 25% (Rarely)", labelHi: "1% – 25% (शायद ही कभी)" },
        { value: 2, labelEn: "26% – 75% (Often)", labelHi: "26% – 75% (अक्सर)", isPositiveThreshold: true },
        { value: 3, labelEn: "76% – 100% (Very Often)", labelHi: "76% – 100% (बहुत बार)", isPositiveThreshold: true }
      ]
    },
    {
      id: "IMPAIRMENT_SETTINGS",
      domain: "impairment",
      promptEn: "Where does this cause the most trouble for you?",
      promptHi: "यह परेशानी सबसे ज्यादा कहाँ असर डालती है?",
      helperEn: "Choose any that apply.",
      helperHi: "जो भी लागू हो, उसे चुनें।",
      type: "multi_choice",
      options: [
        { value: "work_or_school", labelEn: "At work or school", labelHi: "काम या स्कूल में" },
        { value: "home_daily_chores", labelEn: "At home with daily tasks", labelHi: "घर के रोजमर्रा के कामों में" },
        { value: "social_relationships", labelEn: "With friends or family", labelHi: "दोस्तों या परिवार के साथ" },
        { value: "none_minimal", labelEn: "Nowhere / not causing trouble", labelHi: "कहीं नहीं / सब सामान्य है" }
      ]
    },
    {
      id: "ONSET_DURATION",
      domain: "onset_duration",
      promptEn: "Have you noticed this for 6 months or more, including in childhood?",
      promptHi: "क्या यह परेशानी 6 महीने से ज्यादा समय से और बचपन से है?",
      type: "single_choice",
      options: [
        { value: "chronic_childhood_onset", labelEn: "Yes, since childhood (6+ months)", labelHi: "हाँ, बचपन से (6+ महीने)" },
        { value: "recent_onset_only", labelEn: "No, only started recently", labelHi: "नहीं, सिर्फ हाल ही में शुरू हुई" },
        { value: "not_sure", labelEn: "Not sure / hard to remember", labelHi: "पक्का याद नहीं" }
      ]
    },
    {
      id: "MOOD_STRESS",
      domain: "mood_stress",
      promptEn: "Over the past 2 weeks, how often have you felt stressed or down?",
      promptHi: "पिछले 2 हफ्तों में, आप कितनी बार उदास या तनावग्रस्त महसूस कर रहे हैं?",
      type: "single_choice",
      options: [
        { value: "not_at_all", labelEn: "Rarely or not at all", labelHi: "शायद ही कभी या कभी नहीं" },
        { value: "several_days", labelEn: "A few days", labelHi: "कुछ दिन" },
        { value: "more_than_half", labelEn: "Most days", labelHi: "ज्यादातर दिन" }
      ]
    },
    {
      id: "SUBSTANCE_CAFFEINE",
      domain: "substance",
      promptEn: "How many cups of tea, coffee, or energy drinks do you drink daily?",
      promptHi: "आप रोजाना कितनी चाय, कॉफी या एनर्जी ड्रिंक पीते हैं?",
      type: "single_choice",
      options: [
        { value: "low_0_1_cups", labelEn: "0 to 1 cup", labelHi: "0 से 1 कप" },
        { value: "moderate_2_3_cups", labelEn: "2 to 3 cups", labelHi: "2 से 3 कप" },
        { value: "high_4_plus_cups", labelEn: "4 or more cups", labelHi: "4 या उससे ज्यादा" }
      ]
    },
    {
      id: "FAMILY_HISTORY",
      domain: "family_history",
      promptEn: "Does anyone in your close family also have trouble focusing?",
      promptHi: "क्या आपके परिवार में किसी और को भी ध्यान लगाने में परेशानी होती है?",
      type: "single_choice",
      options: [
        { value: "yes_first_degree", labelEn: "Yes (Parent, sibling, child)", labelHi: "हाँ (माता-पिता, भाई-बहन, बच्चा)" },
        { value: "yes_extended", labelEn: "Yes (Other relatives)", labelHi: "हाँ (अन्य रिश्तेदार)" },
        { value: "none_known", labelEn: "No or not sure", labelHi: "नहीं या पता नहीं" }
      ]
    },
    {
      id: "CRISIS_SAFETY_CHECK",
      domain: "safety",
      promptEn: "Do you feel safe right now, or do you need immediate help?",
      promptHi: "क्या आप अभी सुरक्षित महसूस कर रहे हैं, या आपको तत्काल मदद चाहिए?",
      type: "single_choice",
      options: [
        { value: "safe", labelEn: "I feel safe right now", labelHi: "मैं सुरक्षित महसूस कर रहा हूँ" },
        { value: "crisis_need_help", labelEn: "I need immediate help", labelHi: "मुझे तत्काल मदद चाहिए", isCrisisTrigger: true }
      ]
    }
  ]
};

export const SELF_CARE_TIPS = [
  {
    id: "TIP_SLEEP_ANCHOR",
    titleEn: "Wake Up at the Same Time",
    titleHi: "रोज एक ही समय पर उठें",
    actionEn: "Set an alarm for the same time every day. Morning sunlight helps set your natural body clock.",
    actionHi: "रोज सुबह एक ही समय पर उठें। सुबह की धूप शरीर की जैविक घड़ी को सही रखने में मदद करती है।"
  },
  {
    id: "TIP_SCREEN_WIND_DOWN",
    titleEn: "Screen Break Before Bed",
    titleHi: "सोने से पहले स्क्रीन बंद करें",
    actionEn: "Put away your phone and screens 1 hour before sleeping. Try listening to calming music or light stretching instead.",
    actionHi: "सोने से 1 घंटा पहले फोन और स्क्रीन को दूर रखें ताकि दिमाग शांत हो सके और अच्छी नींद आए।"
  },
  {
    id: "TIP_CAFFEINE_CUTOFF",
    titleEn: "Limit Tea & Coffee After Lunch",
    titleHi: "दोपहर 2 बजे के बाद चाय या कॉफी से बचें",
    actionEn: "Avoid tea, coffee, or energy drinks after 2:00 PM so your brain can relax and sleep deeply at night.",
    actionHi: "दोपहर 2 बजे के बाद चाय या कॉफी न पिएं, ताकि रात में गहरी और आरामदायक नींद आ सके।"
  },
  {
    id: "TIP_POMODORO_CHUNK",
    titleEn: "25-Minute Focus Blocks",
    titleHi: "25 मिनट का फोकस ब्लॉक",
    actionEn: "Work on just one thing for 25 minutes, then take a 5-minute break to stretch and drink water.",
    actionHi: "25 मिनट तक सिर्फ एक काम पर ध्यान दें और फिर 5 मिनट का छोटा ब्रेक लें।"
  },
  {
    id: "TIP_MICRO_MOVEMENT",
    titleEn: "Short Movement Breaks",
    titleHi: "हर घंटे थोड़ा टहलें",
    actionEn: "Stand up and walk around for 2 to 3 minutes every hour to refresh your energy and focus.",
    actionHi: "पढ़ाई या काम के दौरान हर घंटे उठकर 2-3 मिनट टहलें। इससे शरीर और दिमाग तरोताजा रहता है।"
  }
];

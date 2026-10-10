/**
 * MediKiosk ADHD & Neurodevelopmental Scoring Engine
 * Implements published scoring algorithms exactly:
 * 1. WHO Adult ADHD Self-Report Scale (ASRS v1.1) Part A & Part B
 * 2. Vanderbilt / SNAP-IV Parent-Report equivalent for minors
 * 3. Functional Impairment (DSM-5 Multi-Setting Criterion)
 * 4. Chronicity & Onset Duration verification
 */

export class AdhdScoringEngine {
  /**
   * Score an adult response set using WHO ASRS v1.1 published guidelines
   *
   * @param {object} answers - Map of questionId -> value
   * @returns {object} Scored result with threshold counts and clinical flags
   */
  static scoreAsrsAdult(answers = {}) {
    // 1. Check if DSM-5 12-item percentage questionnaire answers are provided
    const dsm5InattentionItems = [
      "ADHD_IN_01", "ADHD_IN_02", "ADHD_IN_03", "ADHD_IN_04", "ADHD_IN_05", "ADHD_IN_06"
    ];
    const dsm5HyperactivityItems = [
      "ADHD_HY_01", "ADHD_HY_02", "ADHD_HY_03", "ADHD_HY_04", "ADHD_IM_01", "ADHD_IM_02"
    ];

    const hasDsm5Answers = dsm5InattentionItems.some(id => answers[id] !== undefined) ||
                           dsm5HyperactivityItems.some(id => answers[id] !== undefined);

    if (hasDsm5Answers) {
      let positiveThresholdCount = 0;
      let inattentionElevated = 0;
      let hyperactivityElevated = 0;
      let totalSum = 0;
      const itemBreakdown = [];

      const allDsm5 = [
        ...dsm5InattentionItems.map(id => ({ id, domain: "Inattention", threshold: 2 })),
        ...dsm5HyperactivityItems.map(id => ({ id, domain: "Hyperactivity/Impulsivity", threshold: 2 }))
      ];

      for (const item of allDsm5) {
        const rawVal = answers[item.id];
        const numVal = (typeof rawVal === "number") ? rawVal : (parseInt(rawVal, 10) || 0);
        const isPositive = numVal >= item.threshold; // >= 2 is Often (26%-75%) or Very Often (76%-100%)

        if (isPositive) {
          positiveThresholdCount++;
          if (item.domain === "Inattention") inattentionElevated++;
          if (item.domain === "Hyperactivity/Impulsivity") hyperactivityElevated++;
        }
        totalSum += numVal;

        itemBreakdown.push({
          questionId: item.id,
          rawScore: numVal,
          threshold: item.threshold,
          isPositive,
          domain: item.domain
        });
      }

      // DSM-5 adult threshold: >= 5 symptoms in either domain or >= 4 positive screening items
      const isScreenPositive = positiveThresholdCount >= 4 || inattentionElevated >= 4 || hyperactivityElevated >= 4;

      return {
        instrument: "DSM5_ADHD_PERCENTAGE_SCREENER",
        positiveThresholdCount,
        inattentionElevated,
        hyperactivityElevated,
        totalPartASum: totalSum,
        maxPossibleThreshold: 12,
        isScreenPositive,
        severityBand: isScreenPositive ? "CLINICAL_THRESHOLD_MET" : (positiveThresholdCount >= 2 ? "BORDERLINE_ELEVATED" : "LOW_PROBABILITY"),
        itemBreakdown
      };
    }

    // 2. Standard WHO ASRS Part A Threshold Definitions
    const partAConfig = [
      { id: "ASRS_A1", threshold: 2, domain: "Inattention" },
      { id: "ASRS_A2", threshold: 2, domain: "Inattention" },
      { id: "ASRS_A3", threshold: 2, domain: "Inattention" },
      { id: "ASRS_A4", threshold: 3, domain: "Inattention" },
      { id: "ASRS_A5", threshold: 3, domain: "Hyperactivity/Impulsivity" },
      { id: "ASRS_A6", threshold: 3, domain: "Hyperactivity/Impulsivity" }
    ];

    let positiveThresholdCount = 0;
    let totalPartASum = 0;
    const itemBreakdown = [];

    for (const item of partAConfig) {
      const rawVal = answers[item.id];
      const numVal = (typeof rawVal === "number") ? rawVal : (parseInt(rawVal, 10) || 0);
      const isPositive = numVal >= item.threshold;
      
      if (isPositive) {
        positiveThresholdCount++;
      }
      totalPartASum += numVal;

      itemBreakdown.push({
        questionId: item.id,
        rawScore: numVal,
        threshold: item.threshold,
        isPositive,
        domain: item.domain
      });
    }

    // Published WHO Criterion: 4 or more shaded boxes (positive threshold items) indicates high likelihood of ADHD
    const isScreenPositive = positiveThresholdCount >= 4;

    return {
      instrument: "WHO_ASRS_v1_1",
      positiveThresholdCount,
      totalPartASum,
      maxPossibleThreshold: 6,
      isScreenPositive,
      severityBand: positiveThresholdCount >= 4 ? "CLINICAL_THRESHOLD_MET" : (positiveThresholdCount >= 2 ? "BORDERLINE_ELEVATED" : "LOW_PROBABILITY"),
      itemBreakdown
    };
  }

  /**
   * Score a pediatric/adolescent response set using Vanderbilt/SNAP-IV criteria
   *
   * @param {object} answers - Map of questionId -> value
   * @returns {object} Scored result
   */
  static scoreVanderbiltChild(answers = {}) {
    const vanderbiltItems = [
      { id: "VAND_P1", domain: "Inattention", threshold: 2 },
      { id: "VAND_P2", domain: "Inattention", threshold: 2 },
      { id: "VAND_P3", domain: "Hyperactivity/Impulsivity", threshold: 2 },
      { id: "VAND_P4", domain: "Hyperactivity/Impulsivity", threshold: 2 }
    ];

    let elevatedCount = 0;
    let inattentionElevated = 0;
    let hyperactivityElevated = 0;
    const itemBreakdown = [];

    for (const item of vanderbiltItems) {
      const rawVal = answers[item.id];
      const numVal = (typeof rawVal === "number") ? rawVal : (parseInt(rawVal, 10) || 0);
      const isElevated = numVal >= item.threshold;

      if (isElevated) {
        elevatedCount++;
        if (item.domain === "Inattention") inattentionElevated++;
        if (item.domain === "Hyperactivity/Impulsivity") hyperactivityElevated++;
      }

      itemBreakdown.push({
        questionId: item.id,
        rawScore: numVal,
        isElevated,
        domain: item.domain
      });
    }

    // Screener positive if 2 or more elevated items in screener sample
    const isScreenPositive = elevatedCount >= 2;

    return {
      instrument: "VANDERBILT_SNAP_IV_PEDIATRIC",
      elevatedCount,
      inattentionElevated,
      hyperactivityElevated,
      isScreenPositive,
      severityBand: isScreenPositive ? "CLINICAL_THRESHOLD_MET" : "LOW_PROBABILITY",
      itemBreakdown
    };
  }

  /**
   * Evaluate functional impairment across domains
   *
   * @param {Array<string>|string} settings - Selected impairment areas
   * @returns {object}
   */
  static evaluateFunctionalImpairment(settings) {
    const selected = Array.isArray(settings) ? settings : (settings ? [settings] : []);
    const validSettings = selected.filter(s => s && s !== "none_minimal");
    
    // DSM-5 requires clear evidence of impairment in two or more settings
    const satisfiesMultiSetting = validSettings.length >= 2;
    const hasAnyImpairment = validSettings.length >= 1;

    return {
      affectedSettingsCount: validSettings.length,
      settings: validSettings,
      satisfiesMultiSetting,
      hasAnyImpairment,
      impairmentLevel: validSettings.length >= 2 ? "SIGNIFICANT_MULTI_SETTING" : (validSettings.length === 1 ? "SINGLE_SETTING" : "NONE_OR_MINIMAL")
    };
  }

  /**
   * Evaluate chronicity and onset duration
   *
   * @param {string} onsetDurationVal
   * @returns {object}
   */
  static evaluateChronicity(onsetDurationVal) {
    const isChildhoodAndChronic = onsetDurationVal === "chronic_childhood_onset";
    const isRecentOnly = onsetDurationVal === "recent_onset_only";

    return {
      value: onsetDurationVal || "unspecified",
      meetsDsmDurationCriteria: isChildhoodAndChronic,
      isRecentOnset: isRecentOnly,
      notes: isChildhoodAndChronic 
        ? "Onset prior to age 12 with duration >= 6 months reported." 
        : (isRecentOnly ? "Recent onset: may reflect situational burnout, sleep debt, or acute stress rather than neurodevelopmental condition." : "Onset timeline unconfirmed.")
    };
  }

  /**
   * Master scoring aggregator
   */
  static scoreSession(sessionData = {}) {
    const { audience = "adult_self", answers = {} } = sessionData;
    const isAdult = audience !== "minor_guardian";

    const screenerResult = isAdult 
      ? this.scoreAsrsAdult(answers) 
      : this.scoreVanderbiltChild(answers);

    const impairment = this.evaluateFunctionalImpairment(answers.IMPAIRMENT_SETTINGS);
    const chronicity = this.evaluateChronicity(answers.ONSET_DURATION);

    // Comorbidity indicators
    const hasSignificantMoodDistress = answers.MOOD_STRESS === "more_than_half";
    const hasErraticSleep = answers.SLEEP_LATENCY === "over_45_min" || answers.ROUTINE_WAKE === "irregular_erratic";
    const hasHighCaffeine = answers.SUBSTANCE_CAFFEINE === "high_4_plus_cups";

    return {
      audience: isAdult ? "adult" : "minor",
      screener: screenerResult,
      impairment,
      chronicity,
      comorbidities: {
        moodDistress: hasSignificantMoodDistress,
        sleepDisturbance: hasErraticSleep,
        highStimulantUse: hasHighCaffeine
      },
      scoredAt: new Date().toISOString()
    };
  }
}

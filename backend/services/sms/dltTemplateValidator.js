/**
 * TRAI DLT (Distributed Ledger Technology) Compliance Validator
 * Validates Entity ID, Sender ID (Header), Content Template IDs, and Ordered Variables
 * against Indian Telecom Regulations (TCCCPR 2018).
 * Supports English (GSM 7-bit) and Hindi (UCS-2 Unicode).
 */

export const DLT_CONFIG = {
  entityId: process.env.DLT_ENTITY_ID || '1401550000000000001',
  senderId: process.env.DLT_SENDER_ID || 'MDKIOS',
  templates: {
    TOKEN_BOOKED: {
      templateId: '1407168000000000001',
      category: 'Service Implicit',
      en: {
        text: 'Namaste {#var#}, your Token #{#var#} is confirmed for {#var#}. Approx wait: {#var#}. Track live queue: {#var#}. MediKiosk OPD',
        varCount: 5,
        varLabels: ['patientName', 'tokenNumber', 'departmentOrDoctor', 'waitRange', 'trackingUrl'],
        maxLenPerVar: 35
      },
      hi: {
        text: 'नमस्ते {#var#}, आपका टोकन #{#var#} {#var#} हेतु दर्ज हुआ। अनुमानित प्रतीक्षा: {#var#}। लाइव स्थिति: {#var#}। मेडीकियोस्क',
        varCount: 5,
        varLabels: ['patientName', 'tokenNumber', 'departmentOrDoctor', 'waitRange', 'trackingUrl'],
        maxLenPerVar: 35
      }
    },
    ALMOST_TURN: {
      templateId: '1407168000000000002',
      category: 'Service Implicit',
      en: {
        text: 'Alert: Token #{#var#}, only {#var#} patient(s) ahead of you for {#var#}. Est time: {#var#}. Please wait outside {#var#}. MediKiosk OPD',
        varCount: 5,
        varLabels: ['tokenNumber', 'patientsAhead', 'doctorName', 'timeRange', 'cabin'],
        maxLenPerVar: 30
      },
      hi: {
        text: 'सूचना: टोकन #{#var#}, {#var#} के लिए आपके आगे {#var#} मरीज हैं। संभावित समय: {#var#}। कृपया कक्ष {#var#} के बाहर रहें। मेडीकियोस्क',
        varCount: 5,
        varLabels: ['tokenNumber', 'doctorName', 'patientsAhead', 'timeRange', 'cabin'],
        maxLenPerVar: 30
      }
    },
    TOKEN_CALLED: {
      templateId: '1407168000000000003',
      category: 'Service Implicit',
      en: {
        text: 'URGENT: Token #{#var#}, it is your turn now. Please enter {#var#} immediately for your consultation with {#var#}. MediKiosk OPD',
        varCount: 3,
        varLabels: ['tokenNumber', 'cabin', 'doctorName'],
        maxLenPerVar: 30
      },
      hi: {
        text: 'आवश्यक: टोकन #{#var#}, अब आपकी बारी है। कृपया {#var#} में परामर्श हेतु तत्काल कक्ष {#var#} में प्रवेश करें। मेडीकियोस्क',
        varCount: 3,
        varLabels: ['tokenNumber', 'doctorName', 'cabin'],
        maxLenPerVar: 30
      }
    },
    QUEUE_DELAYED: {
      templateId: '1407168000000000004',
      category: 'Service Implicit',
      en: {
        text: 'Notice: Consultation with {#var#} is delayed by approx {#var#}. Token #{#var#}, your updated est time is {#var#}. Track: {#var#}. MediKiosk OPD',
        varCount: 5,
        varLabels: ['doctorName', 'delayDuration', 'tokenNumber', 'timeRange', 'trackingUrl'],
        maxLenPerVar: 35
      },
      hi: {
        text: 'सूचना: {#var#} से परामर्श में {#var#} का विलंब है। टोकन #{#var#}, नया अनुमानित समय: {#var#}। ट्रैकिंग: {#var#}। मेडीकियोस्क',
        varCount: 5,
        varLabels: ['doctorName', 'delayDuration', 'tokenNumber', 'timeRange', 'trackingUrl'],
        maxLenPerVar: 35
      }
    },
    TOKEN_SKIPPED: {
      templateId: '1407168000000000005',
      category: 'Service Implicit',
      en: {
        text: 'Token #{#var#} was called but not present. Please report to {#var#} reception within {#var#} mins to rejoin the queue. MediKiosk OPD',
        varCount: 3,
        varLabels: ['tokenNumber', 'counterOrDept', 'rejoinMinutes'],
        maxLenPerVar: 25
      },
      hi: {
        text: 'टोकन #{#var#} बुलाया गया परंतु अनुपस्थित रहा। कतार में पुनः जुड़ने हेतु {#var#} मिनट में {#var#} काउंटर पर संपर्क करें। मेडीकियोस्क',
        varCount: 3,
        varLabels: ['tokenNumber', 'rejoinMinutes', 'counterOrDept'],
        maxLenPerVar: 25
      }
    },
    TOKEN_COMPLETED: {
      templateId: '1407168000000000006',
      category: 'Service Implicit',
      en: {
        text: 'Token #{#var#}, your OPD consultation with {#var#} is marked completed. Thank you for visiting MediKiosk Healthcare.',
        varCount: 2,
        varLabels: ['tokenNumber', 'doctorOrDept'],
        maxLenPerVar: 30
      },
      hi: {
        text: 'टोकन #{#var#}, {#var#} के साथ आपका परामर्श संपन्न हुआ। मेडीकियोस्क में पधारने हेतु धन्यवाद।',
        varCount: 2,
        varLabels: ['tokenNumber', 'doctorOrDept'],
        maxLenPerVar: 30
      }
    }
  }
};

export class DltTemplateValidator {
  /**
   * Validate whether a message satisfies DLT registration constraints
   * @param {string} eventType 
   * @param {Array<string|number>} variables - ordered variables
   * @param {string} language - 'en' or 'hi'
   * @returns {{ valid: boolean, templateId: string, entityId: string, senderId: string, renderedText: string, errors: string[], isUnicode: boolean }}
   */
  static validateAndRender(eventType, variables = [], language = 'en') {
    const errors = [];
    const entityId = DLT_CONFIG.entityId;
    const senderId = DLT_CONFIG.senderId;

    if (!entityId || entityId.length < 10) {
      errors.push('TRAI DLT Entity ID (PE ID) is missing or invalid.');
    }
    if (!senderId || senderId.length !== 6) {
      errors.push('TRAI DLT Sender ID (Header) must be exactly 6 alphabetic characters.');
    }

    const templateMeta = DLT_CONFIG.templates[eventType];
    if (!templateMeta) {
      errors.push(`Unregistered DLT event type: '${eventType}'. Dispatch blocked.`);
      return { valid: false, errors };
    }

    const lang = language === 'hi' ? 'hi' : 'en';
    const langConfig = templateMeta[lang] || templateMeta.en;
    const expectedCount = langConfig.varCount;

    if (!Array.isArray(variables) || variables.length !== expectedCount) {
      errors.push(`DLT template '${templateMeta.templateId}' (${eventType}) requires exactly ${expectedCount} variables, received ${variables ? variables.length : 0}.`);
    }

    // Sanitize and validate each variable
    const cleanVars = [];
    if (Array.isArray(variables)) {
      variables.forEach((val, idx) => {
        const strVal = String(val !== undefined && val !== null ? val : '').trim();
        // Prevent carriage return or line break injection inside variables
        if (/[\r\n]/.test(strVal)) {
          errors.push(`Variable #${idx + 1} contains prohibited newline characters.`);
        }
        const varLabel = langConfig.varLabels ? langConfig.varLabels[idx] : '';
        const maxLimit = (varLabel === 'trackingUrl' || strVal.startsWith('http')) ? 95 : (langConfig.maxLenPerVar || 35);
        if (strVal.length > maxLimit) {
          errors.push(`Variable #${idx + 1} (${varLabel || idx}) exceeds maximum DLT limit of ${maxLimit} characters (length: ${strVal.length}).`);
        }
        cleanVars.push(strVal);
      });
    }

    if (errors.length > 0) {
      return {
        valid: false,
        templateId: templateMeta.templateId,
        entityId,
        senderId,
        errors,
        renderedText: ''
      };
    }

    // Safely interpolate ordered variables into placeholder text
    let rendered = langConfig.text;
    cleanVars.forEach(v => {
      rendered = rendered.replace('{#var#}', v);
    });

    // Detect if content is Unicode (UCS-2)
    // Non-ASCII characters (e.g. Devanagari script) require UCS-2 encoding
    // eslint-disable-next-line no-control-regex
    const isUnicode = /[^\u0000-\u007F]/.test(rendered);

    return {
      valid: true,
      templateId: templateMeta.templateId,
      entityId,
      senderId,
      category: templateMeta.category,
      language: lang,
      isUnicode,
      variables: cleanVars,
      renderedText: rendered,
      errors: []
    };
  }
}

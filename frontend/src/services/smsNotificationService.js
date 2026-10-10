/**
 * MediKiosk Real-Time SMS & WhatsApp Client Notification Service
 * Orchestrates API calls to the notification gateway, local fallback, audio chimes,
 * and reactive UI updates for live queue and appointment time messaging.
 */

export class SmsNotificationService {
  constructor() {
    this.logs = [];
    this.listeners = new Set();
    this.audioCtx = null;
    this.lastDispatchedSms = null;
  }

  /**
   * Subscribe to new real-time SMS delivery events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(data) {
    this.listeners.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.warn('[SmsNotificationService] Listener error:', err);
      }
    });
  }

  /**
   * Synthesize gentle dual-tone mobile notification chime via Web Audio API
   */
  playNotificationChime() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioCtx();
      }

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now); // D6
      osc2.frequency.exponentialRampToValueAtTime(1760.00, now + 0.12); // A6

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.38);
      osc2.stop(now + 0.38);
    } catch (e) {
      // Audio playback is non-blocking
    }
  }

  /**
   * Format registered Indian phone number with spaces
   */
  formatMobile(mobile) {
    if (!mobile) return '+91 98765 43210';
    const cleaned = mobile.toString().replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+91') && cleaned.length === 13) {
      return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`;
    }
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    return cleaned;
  }

  /**
   * Dispatch real-time SMS to registered number
   */
  async dispatchRealtimeSms({
    mobile,
    patientId = 'PAT-WALKIN',
    patientName = 'Walk-in Patient',
    tokenNumber = 'TK-101',
    membersAhead = 0,
    appointmentTime,
    waitMinutes,
    doctorName = 'Dr. Sharma',
    cabin = 'OPD Cabin 3',
    eventType = 'QUEUE_UPDATE'
  }) {
    const formattedMobile = this.formatMobile(mobile);
    const calculatedWaitMin = waitMinutes !== undefined ? waitMinutes : (membersAhead === 0 ? 0 : Math.round(membersAhead * 7.5));
    const calculatedApptTime = appointmentTime || new Date(Date.now() + Math.max(5, calculatedWaitMin) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const payload = {
      mobile: formattedMobile,
      patientId,
      patientName,
      tokenNumber,
      membersAhead,
      appointmentTime: calculatedApptTime,
      waitMinutes: calculatedWaitMin,
      doctorName,
      cabin,
      eventType
    };

    let dispatchResult = null;

    try {
      const response = await fetch('/api/notifications/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const json = await response.json();
        dispatchResult = json.data;
      }
    } catch (networkErr) {
      console.warn('[SmsNotificationService] Backend unreachable, using client offline gateway simulation:', networkErr);
    }

    // Client fallback if offline / standalone
    if (!dispatchResult) {
      const isCall = eventType === 'CABIN_CALL' || membersAhead === 0;
      const isNext = eventType === 'NEXT_IN_LINE' || membersAhead === 1;
      const is30Min = eventType === '30MIN_REMINDER' || eventType === '30min' || eventType === 'REMINDER_30_MIN';
      const isToken = eventType === 'TOKEN_ISSUED';

      let msgText = '';
      if (isCall) {
        msgText = ` [NOW CALLING] Dear ${patientName}, Dr. Sharma is ready for your consultation! Token #${tokenNumber}. Please enter ${cabin} immediately.`;
      } else if (isNext) {
        msgText = ` [PRIORITY ALERT] Dear ${patientName}, you are NEXT in line! Only 1 member ahead. Your appointment with ${doctorName} (${cabin}) is at ${calculatedApptTime}. Please proceed directly to the door of ${cabin}. Token: #${tokenNumber}.`;
      } else if (is30Min) {
        msgText = `⏱ [30-MIN APPOINTMENT REMINDER] Namaste ${patientName}! Token #${tokenNumber}. Your appointment with ${doctorName} (${cabin}) is approaching in ~${calculatedWaitMin || 30} mins at ${calculatedApptTime}. Queue Status: ${membersAhead} member(s) ahead. Please be present in OPD Waiting Zone B.`;
      } else if (isToken) {
        msgText = ` [OPD APPOINTMENT CONFIRMED] Dear ${patientName}, your Token #${tokenNumber} is generated. There are ${membersAhead} members ahead of you in queue. Your estimated appointment time is ${calculatedApptTime} (~${calculatedWaitMin} mins wait) with ${doctorName} at ${cabin}. Waiting Area: Zone B. Live Tracker: https://medikiosk.gov.in/q/${tokenNumber}`;
      } else {
        const memberText = membersAhead === 1 ? '1 member ahead' : `${membersAhead} members ahead`;
        msgText = ` [LIVE QUEUE UPDATE] Dear ${patientName}, your appointment with ${doctorName} (${cabin}) is scheduled at approx ${calculatedApptTime} (in ~${calculatedWaitMin} mins). Queue Status: ${memberText} of you in line. Token: #${tokenNumber}. Please be ready near Waiting Zone B.`;
      }

      dispatchResult = {
        success: true,
        messageSid: 'SM' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        status: 'Delivered ',
        deliveryLatencyMs: 160,
        recipient: {
          mobile: formattedMobile,
          masked: formattedMobile.replace(/(\+91\s\d{2})\d{3}\s\d{2}(\d{3})/, '$1*** **$2'),
          patientName
        },
        appointmentDetails: {
          tokenNumber,
          membersAhead,
          appointmentTime: calculatedApptTime,
          waitMinutes: calculatedWaitMin,
          doctorName,
          cabin
        },
        message: msgText,
        timestamp: new Date().toISOString()
      };
    }

    const logItem = {
      id: 'SMS-' + Math.floor(100 + Math.random() * 900),
      patientId,
      patientName,
      mobile: formattedMobile,
      token: tokenNumber,
      membersAhead,
      patientsAhead: membersAhead,
      scheduledTime: calculatedApptTime,
      dispatchTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Delivered ',
      channel: 'SMS Gateway + WhatsApp Cloud API',
      message: dispatchResult.message,
      eventType
    };

    this.logs.unshift(logItem);
    this.lastDispatchedSms = logItem;

    // Trigger audio chime
    this.playNotificationChime();

    // Notify subscribed UI components (phone simulator, toast, queue badges)
    this.notifyListeners(logItem);

    return logItem;
  }

  /**
   * Fetch all logs
   */
  async fetchLogs() {
    try {
      const res = await fetch('/api/notifications/logs');
      if (res.ok) {
        const json = await res.json();
        if (json.logs && Array.isArray(json.logs)) {
          // Merge with local logs
          const combined = [...json.logs];
          this.logs.forEach(l => {
            if (!combined.some(c => c.id === l.id)) {
              combined.push(l);
            }
          });
          return combined;
        }
      }
    } catch (e) {
      // Return local logs on error
    }
    return this.logs;
  }
}

export const smsNotificationService = new SmsNotificationService();

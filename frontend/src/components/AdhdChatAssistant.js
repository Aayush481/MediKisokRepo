/**
 * MediKiosk ADHD-Friendly AI Chat Assistant & Neurodevelopmental Screening UI
 *
 * ADHD-Friendly Human Factors:
 * - One short question per screen (<= 15 words)
 * - Large, tactile tap-target answer chips (>= 48px height)
 * - Continuous visible progress: "Question X of Y • ~Z min left"
 * - Short Mode (10 Qs, ~4 min) vs Full Mode (24 Qs, ~9 min)
 * - Voice input (Web Speech API) & audio read-aloud (TTS via speechService)
 * - Pause & Resume state saved to localStorage
 * - No countdown timeouts that wipe answers; clear Back, Skip, Not Sure buttons
 * - Calm, minimal-distraction visuals, zero flickering/flashing animations
 * - Bilingual support: English & Hindi (Devanagari)
 * - Deterministic Routing: Path A (Self-Care), Path B (Doctor Booking), Path C (Crisis)
 */

import { adhdClientService } from '../services/adhdClientService.js';
import { speechService } from '../services/speechService.js';
import { ADHD_QUESTION_BANK, SELF_CARE_TIPS } from '../data/adhdContentLibrary.js';

export class AdhdChatAssistant {
  constructor(appContext) {
    this.app = appContext;
    this.isOpen = false;
    this.currentLanguage = (this.app?.currentLanguage || 'en').startsWith('hi') ? 'hi' : 'en';
    this.isShortMode = true; // default to rapid 4-min screening mode
    this.questions = ADHD_QUESTION_BANK.questions;
    this.activeQuestionIndex = 0;
    this.answers = {};
    this.sessionId = 'NEURO-' + Math.floor(10000 + Math.random() * 90000);
    this.consentGiven = true;
    this.audience = 'adult_self';
    this.isListening = false;
    this.isSpeaking = false;
    this.assessmentResult = null;
    this.selectedDoctor = null;
    this.bookedAppointment = null;
    this.isCheckInModalOpen = false;
    this.crisisTriggered = null;

    // Check for saved progress
    const saved = adhdClientService.loadSessionProgress();
    if (saved && saved.answers && Object.keys(saved.answers).length > 0) {
      this.hasSavedSession = true;
      this.savedData = saved;
    } else {
      this.hasSavedSession = false;
    }
  }

  open() {
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    speechService.stopSpeaking();
    speechService.stopListening();
    const modal = document.getElementById('adhdModalContainer');
    if (modal) modal.remove();
  }

  resumeSavedSession() {
    if (this.savedData) {
      this.answers = this.savedData.answers || {};
      this.activeQuestionIndex = this.savedData.activeQuestionIndex || 0;
      this.isShortMode = this.savedData.isShortMode ?? true;
      this.sessionId = this.savedData.sessionId || this.sessionId;
      this.audience = this.savedData.audience || 'adult_self';
    }
    this.hasSavedSession = false;
    this.render();
  }

  startFreshSession() {
    adhdClientService.clearSessionProgress();
    this.hasSavedSession = false;
    this.answers = {};
    this.activeQuestionIndex = 0;
    this.assessmentResult = null;
    this.bookedAppointment = null;
    this.crisisTriggered = null;
    this.render();
  }

  getActiveQuestionsList() {
    if (this.isShortMode) {
      const shortIds = new Set(ADHD_QUESTION_BANK.shortModeQuestionIds);
      return this.questions.filter(q => shortIds.has(q.id));
    }
    return this.questions;
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    speechService.setLanguage(lang);
    this.render();
  }

  toggleMode(shortMode) {
    this.isShortMode = shortMode;
    this.activeQuestionIndex = 0;
    this.render();
  }

  speakCurrentQuestion() {
    const list = this.getActiveQuestionsList();
    const q = list[this.activeQuestionIndex];
    if (!q) return;

    const textToSpeak = this.currentLanguage === 'hi' ? q.promptHi : q.promptEn;
    this.isSpeaking = true;
    speechService.speak(textToSpeak, this.currentLanguage, () => {
      this.isSpeaking = false;
      this.renderAudioIndicator(false);
    });
    this.renderAudioIndicator(true);
  }

  renderAudioIndicator(active) {
    const btn = document.getElementById('adhdAudioBtn');
    if (btn) {
      btn.style.borderColor = active ? '#059669' : '#CBD5E1';
      btn.style.color = active ? '#059669' : '#475569';
      btn.style.background = active ? '#ECFDF5' : '#FFFFFF';
    }
  }

  startVoiceInput() {
    if (this.isListening) {
      speechService.stopListening();
      this.isListening = false;
      this.renderMicIndicator(false);
      return;
    }

    this.isListening = true;
    this.renderMicIndicator(true);

    speechService.startListening(
      (interim) => {
        const input = document.getElementById('adhdFreeTextInput');
        if (input) input.value = interim;
      },
      (finalText) => {
        this.isListening = false;
        this.renderMicIndicator(false);
        const input = document.getElementById('adhdFreeTextInput');
        if (input) input.value = finalText;
        this.handleFreeTextAnswer(finalText);
      },
      (err) => {
        this.isListening = false;
        this.renderMicIndicator(false);
      }
    );
  }

  renderMicIndicator(active) {
    const btn = document.getElementById('adhdMicBtn');
    if (btn) {
      btn.style.background = active ? '#FEF2F2' : '#FFFFFF';
      btn.style.borderColor = active ? '#EF4444' : '#CBD5E1';
      btn.style.color = active ? '#EF4444' : '#475569';
    }
  }

  async recordAnswer(questionId, value) {
    // 1. Safety check on this answer
    this.answers[questionId] = value;

    if (questionId === 'DEMO_AUDIENCE') {
      this.audience = value;
    }

    if (questionId === 'CONSENT_DPDP') {
      if (value === 'consent_declined') {
        this.close();
        return;
      }
      this.consentGiven = value === 'consent_granted_ai';
    }

    // Check crisis keyword or structured answer
    const safetyCheck = await adhdClientService.checkSafety(String(value), this.answers);
    if (safetyCheck && safetyCheck.isTriggered) {
      this.crisisTriggered = safetyCheck;
      this.render();
      return;
    }

    // Save progress to localStorage
    adhdClientService.saveSessionProgress({
      sessionId: this.sessionId,
      audience: this.audience,
      answers: this.answers,
      activeQuestionIndex: this.activeQuestionIndex + 1,
      isShortMode: this.isShortMode
    });

    const list = this.getActiveQuestionsList();
    if (this.activeQuestionIndex < list.length - 1) {
      this.activeQuestionIndex++;
      this.render();
    } else {
      // Completed all questions! Run scoring & triage
      this.finishAssessment();
    }
  }

  async handleFreeTextAnswer(text) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();

    // Safety check first
    const safetyCheck = await adhdClientService.checkSafety(cleanText, this.answers);
    if (safetyCheck && safetyCheck.isTriggered) {
      this.crisisTriggered = safetyCheck;
      this.render();
      return;
    }

    const list = this.getActiveQuestionsList();
    const q = list[this.activeQuestionIndex];
    if (q) {
      this.recordAnswer(q.id, cleanText);
    }
  }

  prevQuestion() {
    if (this.activeQuestionIndex > 0) {
      this.activeQuestionIndex--;
      this.render();
    }
  }

  skipQuestion() {
    const list = this.getActiveQuestionsList();
    const q = list[this.activeQuestionIndex];
    if (q) {
      this.recordAnswer(q.id, 'skipped_not_sure');
    }
  }

  async finishAssessment() {
    this.isLoading = true;
    this.render();

    const payload = {
      sessionId: this.sessionId,
      patientId: this.app?.patient?.id || 'PAT-WALKIN',
      audience: this.audience,
      answers: this.answers,
      language: this.currentLanguage,
      consentGiven: this.consentGiven,
      patientRequestedDoctor: false
    };

    const result = await adhdClientService.submitAssessment(payload);
    this.isLoading = false;
    this.assessmentResult = result;

    // Attach to current patient state so doctor dashboard can view it immediately
    if (this.app && this.app.patient) {
      this.app.patient.neuroAssessment = result;
      this.app.patient.hasNeuroScreening = true;
      this.app.patient.chiefComplaint = this.app.patient.chiefComplaint 
        ? `${this.app.patient.chiefComplaint}, Focus / Wellness Screening`
        : `Focus & Daily Executive Routine Screening`;
    }

    adhdClientService.clearSessionProgress();
    this.render();
  }

  async requestDoctorBooking() {
    this.isLoadingDoctors = true;
    this.render();

    const specs = this.assessmentResult?.triage?.suggestedSpecialties || ['Psychiatry', 'Clinical Psychology'];
    const recs = await adhdClientService.getDoctorRecommendations(specs);
    this.doctorRecommendations = recs.candidates || [];
    this.isLoadingDoctors = false;
    this.showDoctorBookingFlow = true;
    this.render();
  }

  async confirmBooking(doctorId) {
    this.isBookingSlot = true;
    this.render();

    const booking = await adhdClientService.bookDoctorSlot({
      doctorId,
      patientId: this.app?.patient?.id || 'PAT-WALKIN',
      patientName: this.app?.patient?.name || 'Walk-in Patient',
      mobile: this.app?.patient?.mobile || '+91 98765 43210',
      sessionId: this.sessionId
    });

    this.isBookingSlot = false;
    this.bookedAppointment = booking.booking;

    // If app has queue, add or update patient token
    if (this.app) {
      if (booking.booking?.tokenNumber) {
        this.app.patient.tokenNumber = booking.booking.tokenNumber;
      }
      if (booking.booking?.doctor) {
        this.app.patient.assignedDoctor = booking.booking.doctor;
      }
    }

    this.render();
  }

  openCheckInModal() {
    this.isCheckInModalOpen = true;
    this.render();
  }

  closeCheckInModal() {
    this.isCheckInModalOpen = false;
    this.render();
  }

  async submitCheckIn(answers) {
    const res = await adhdClientService.submitCheckIn(this.sessionId, answers);
    this.checkInResult = res;
    if (res.escalated) {
      this.showDoctorBookingFlow = true;
      this.requestDoctorBooking();
    } else {
      alert(res.message);
      this.closeCheckInModal();
    }
  }

  render() {
    if (!this.isOpen) return;

    let container = document.getElementById('adhdModalContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'adhdModalContainer';
      document.body.appendChild(container);
    }

    const isHi = this.currentLanguage === 'hi';
    const list = this.getActiveQuestionsList();
    const currentQ = list[this.activeQuestionIndex];
    const totalQs = list.length;
    const progressPercent = Math.round(((this.activeQuestionIndex + 1) / totalQs) * 100);
    const estMinutesRemaining = Math.max(1, Math.round((totalQs - this.activeQuestionIndex - 1) * 0.4));

    // Check-In Follow-Up Modal View
    if (this.isCheckInModalOpen) {
      container.innerHTML = `
        <div class="adhd-backdrop">
          <div class="adhd-card" style="max-width: 540px;">
            <div class="adhd-results-header">
              <div>
                <h2 style="margin: 0; font-size: 1.25rem; color: #0F172A;">${isHi ? '2-सप्ताह अनुवर्ती चेक-इन' : '2-Week Clinical Follow-Up'}</h2>
                <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748B;">${isHi ? 'आपकी प्रगति की समीक्षा' : 'Review your daily routine and symptom progression'}</p>
              </div>
              <button class="adhd-close-btn" onclick="window.adhdAssistant.closeCheckInModal()"></button>
            </div>
            <div class="adhd-question-body">
              <p style="font-size: 0.9rem; line-height: 1.5; color: #334155; margin-bottom: 1.25rem;">
                ${isHi 
                  ? 'पिछले 14 दिनों में आपकी दैनिक एकाग्रता, नींद और दिनचर्या में क्या स्थिति रही है?' 
                  : 'Over the past 14 days, how have your focus routines and day-to-day productivity progressed?'}
              </p>
              <div class="adhd-options-grid">
                <button class="adhd-option-btn" onclick="window.adhdAssistant.submitCheckIn({ routineAdherence: 'improved', escalationRequested: false })">
                  <span class="option-check"></span>
                  <span class="option-label">${isHi ? 'काफी सुधार हुआ है (दैनिक आदतें मददगार रहीं)' : 'Significantly Improved (Habits were effective)'}</span>
                </button>
                <button class="adhd-option-btn" onclick="window.adhdAssistant.submitCheckIn({ routineAdherence: 'same', escalationRequested: false })">
                  <span class="option-check">○</span>
                  <span class="option-label">${isHi ? 'समान स्थिति (कोई बड़ा बदलाव नहीं)' : 'Stable / Same (No significant change)'}</span>
                </button>
                <button class="adhd-option-btn" onclick="window.adhdAssistant.submitCheckIn({ routineAdherence: 'worsened', escalationRequested: true })">
                  <span class="option-check" style="color: #059669;">!</span>
                  <span class="option-label" style="color: #064E3B; font-weight: 600;">${isHi ? 'कठिनाई बढ़ रही है (विशेषज्ञ डॉक्टर से परामर्श चाहिए)' : 'Persistent Challenges (Request Specialist Consultation)'}</span>
                </button>
              </div>
            </div>
            <div class="adhd-footer" style="justify-content: flex-end;">
              <button class="btn-adhd-secondary" onclick="window.adhdAssistant.closeCheckInModal()">${isHi ? 'वापस' : 'Back'}</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // 1. Crisis Interruption View (Path C)
    if (this.crisisTriggered) {
      container.innerHTML = `
        <div class="adhd-backdrop">
          <div class="adhd-card adhd-card-crisis">
            <div class="adhd-crisis-header">
              <div class="adhd-crisis-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h2>${isHi ? 'आपकी सुरक्षा हमारी सर्वोच्च प्राथमिकता है' : 'Immediate Support & Safety Protocol'}</h2>
                <p>${isHi ? 'हम आपके साथ हैं। यह प्रश्नावली रोक दी गई है।' : 'We are here with you. This questionnaire is currently paused.'}</p>
              </div>
            </div>

            <div class="adhd-crisis-body">
              <p class="adhd-crisis-msg">
                ${isHi 
                  ? 'यदि आप या कोई अन्य व्यक्ति अत्यधिक तनाव, अवसाद या संकट में हैं, तो कृपया अकेले न रहें। भारत सरकार की राष्ट्रीय टेली-मानस हेल्पलाइन 24 घंटे निःशुल्क और गोपनीय सहायता प्रदान करती है:' 
                  : 'If you or someone you know is going through emotional crisis, distress, or having thoughts of self-harm, please connect with dedicated clinical care right now. You do not have to go through this alone:'}
              </p>

              <div class="adhd-helpline-grid">
                <div class="adhd-helpline-card highlight">
                  <div class="helpline-title">Tele-MANAS (Govt. of India)</div>
                  <div class="helpline-number">14416</div>
                  <div class="helpline-sub">${isHi ? '24x7 निःशुल्क राष्ट्रीय हेल्पलाइन' : '24x7 Toll-Free National Mental Health Helpline'}</div>
                  <a href="tel:14416" class="btn-helpline-call">${isHi ? 'तुरंत कॉल करें (14416)' : 'Call Now (14416)'}</a>
                </div>

                <div class="adhd-helpline-card">
                  <div class="helpline-title">Emergency Response</div>
                  <div class="helpline-number">112</div>
                  <div class="helpline-sub">${isHi ? 'राष्ट्रीय आपातकालीन सेवा' : 'National All-in-One Emergency Helpline'}</div>
                  <a href="tel:112" class="btn-helpline-call secondary">Call 112</a>
                </div>

                <div class="adhd-helpline-card">
                  <div class="helpline-title">Hospital Emergency Desk</div>
                  <div class="helpline-number">Ext. 102</div>
                  <div class="helpline-sub">${isHi ? 'अस्पताल ट्राइएज एवं इमरजेंसी वार्ड' : 'Hospital Triage & Resuscitation Bay 1'}</div>
                  <button class="btn-helpline-call secondary" onclick="alert('Hospital On-Duty Emergency Medical Officer notified.');">${isHi ? 'इमरजेंसी डेस्क को सूचित करें' : 'Alert On-Duty Doctor'}</button>
                </div>
              </div>

              <div class="adhd-disclaimer-box" style="margin-top: 1.5rem; display: flex; align-items: center; gap: 8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>${isHi ? 'सभी हेल्पलाइन सेवाएं 24x7 निःशुल्क और गोपनीय हैं।' : 'All helpline services are free, confidential, and available 24/7.'}</span>
              </div>
            </div>

            <div class="adhd-footer" style="justify-content: flex-end;">
              <button class="btn-adhd-secondary" onclick="window.adhdAssistant.close()">${isHi ? 'स्क्रीनिंग बंद करें' : 'Close'}</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // 2. Completed Assessment View (Path A or Path B)
    if (this.assessmentResult) {
      const outcome = this.assessmentResult.triage?.outcome;
      const isPathB = outcome === 'PATH_B_SPECIALIST_RECOMMENDED';
      const summary = this.assessmentResult.summary;
      const tips = this.assessmentResult.personalizedTips || [];

      container.innerHTML = `
        <div class="adhd-backdrop">
          <div class="adhd-card adhd-card-results">
            <!-- Header -->
            <div class="adhd-results-header">
              <div>
                <h2 style="margin: 0; font-size: 1.35rem; color: #0F172A;">${isHi ? 'आपकी चेक-इन रिपोर्ट एवं सुझाव' : 'Your Focus Check-In & Action Plan'}</h2>
                <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748B;">
                  ${isPathB 
                    ? (isHi ? 'डॉक्टर से परामर्श की सिफारिश की गई है' : 'Doctor consultation recommended') 
                    : (isHi ? 'दैनिक आदतों के लिए सरल सुझाव' : 'Simple daily habits to help you stay on track')}
                </p>
              </div>
              <button class="adhd-close-btn" onclick="window.adhdAssistant.close()"></button>
            </div>

            <!-- Patient-facing plain language summary -->
            <div class="adhd-explanation-box">
              <p>${summary?.patientFacingExplanation || 'Your responses have been documented.'}</p>
            </div>

            <!-- Route Specific Content -->
            ${this.bookedAppointment ? `
              <div class="adhd-booking-success-box">
                <div class="booking-check-badge">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <h3 style="margin: 0; color: #065F46;">${isHi ? 'डॉक्टर अपॉइंटमेंट बुक हो गया' : 'Specialist Consultation Confirmed'}</h3>
                  <p style="margin: 4px 0; font-size: 0.9rem; color: #1E293B;">
                    <strong>${this.bookedAppointment.doctor?.name}</strong> (${this.bookedAppointment.doctor?.specialty}) • 
                    <span>${this.bookedAppointment.doctor?.cabin}</span> (${this.bookedAppointment.doctor?.floor})
                  </p>
                  <p style="font-size: 0.85rem; color: #047857; margin: 0; font-weight: 600;">
                    ${isHi ? 'टोकन संख्या' : 'OPD Token'}: <strong>#${this.bookedAppointment.tokenNumber}</strong> • 
                    ${isHi ? 'अनुमानित समय' : 'Estimated Time'}: <strong>${this.bookedAppointment.appointmentTime}</strong>
                  </p>
                </div>
              </div>
            ` : (this.showDoctorBookingFlow ? `
              <!-- Doctor selection cards -->
              <div class="adhd-doctor-selection-panel">
                <h3 style="margin-top: 0; color: #0F172A;">${isHi ? 'उपलब्ध विशेषज्ञ चिकित्सक चुनें' : 'Recommended Hospital Specialists'}</h3>
                <div class="adhd-doctor-grid">
                  ${(this.doctorRecommendations || []).map(doc => `
                    <div class="adhd-doc-card">
                      <div class="doc-header">
                        <strong>${doc.name}</strong>
                        <span style="font-size: 0.82rem; color: #059669; font-weight: 700;">${doc.specialty}</span>
                      </div>
                      <div class="doc-details">
                        <span style="display: flex; align-items: center; gap: 4px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          ${doc.cabin} (${doc.floor})
                        </span>
                        <span style="display: flex; align-items: center; gap: 4px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          ${isHi ? 'प्रतीक्षा समय' : 'Wait time'}: ~${doc.estimatedWaitMinutes} mins
                        </span>
                      </div>
                      <button class="btn-adhd-primary" onclick="window.adhdAssistant.confirmBooking('${doc.id}')" ${this.isBookingSlot ? 'disabled' : ''}>
                        ${this.isBookingSlot ? 'Booking...' : (isHi ? 'यह अपॉइंटमेंट बुक करें' : 'Confirm Consultation')}
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : '')}

            <!-- 7-Day Personalized Micro-Action Plan (Path A & Supportive for Path B) -->
            <div class="adhd-section-title">
              <h3 style="margin: 0; font-size: 1.05rem; color: #0F172A; display: flex; align-items: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${isHi ? 'आपकी 7-दिन की दिनचर्या' : 'Your 7-Day Focus Plan'}
              </h3>
              <span style="font-size: 0.82rem; color: #64748B;">${isHi ? 'दैनिक आसान आदतें' : 'Easy habits for each day'}</span>
            </div>

            <div class="adhd-tips-grid">
              ${tips.map((tip, idx) => `
                <div class="adhd-tip-card">
                  <div class="tip-title">
                    <span class="tip-number-badge">${isHi ? 'दिन' : 'Day'} ${idx + 1}</span>
                    ${isHi ? tip.titleHi : tip.titleEn}
                  </div>
                  <div class="tip-action">${isHi ? tip.actionHi : tip.actionEn}</div>
                </div>
              `).join('')}
            </div>

            <!-- Plain Notice -->
            <div class="adhd-disclaimer-box" style="margin-top: 1.25rem; display: flex; align-items: flex-start; gap: 8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>${isHi 
                ? 'यह जानकारी केवल आपकी सुविधा के लिए है, किसी बीमारी का डॉक्टरी निदान नहीं। पूरी जांच के लिए अस्पताल के डॉक्टर से मिलें।' 
                : 'This check is for informational support only and is not a medical diagnosis. Please consult a doctor for a full medical evaluation.'}</span>
            </div>

            <!-- Footer Actions -->
            <div class="adhd-results-footer">
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn-adhd-secondary" onclick="window.print()" style="display: inline-flex; align-items: center; gap: 6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  ${isHi ? 'योजना प्रिंट करें' : 'Print / Save Plan'}
                </button>
                <button class="btn-adhd-secondary" onclick="window.adhdAssistant.openCheckInModal()" style="display: inline-flex; align-items: center; gap: 6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  ${isHi ? '2-सप्ताह चेक-इन' : '2-Week Check-in'}
                </button>
              </div>

              <div style="display: flex; gap: 8px;">
                ${!this.showDoctorBookingFlow && !this.bookedAppointment ? `
                  <button class="btn-adhd-primary" onclick="window.adhdAssistant.requestDoctorBooking()" style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    ${isHi ? 'डॉक्टर से परामर्श लें' : 'Talk to a Doctor'}
                  </button>
                ` : ''}
                <button class="btn-adhd-secondary" onclick="window.adhdAssistant.close()">${isHi ? 'समाप्त करें' : 'Done'}</button>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // 3. Saved Progress Resume Prompt View
    if (this.hasSavedSession) {
      container.innerHTML = `
        <div class="adhd-backdrop">
          <div class="adhd-card adhd-card-resume">
            <h2>${isHi ? 'पिछली स्क्रीनिंग प्रगति मिली' : 'Resume Previous Screening?'}</h2>
            <p>${isHi ? 'आपकी पिछली अधूरी स्क्रीनिंग के उत्तर सहेजे गए हैं। क्या आप वहीं से जारी रखना चाहते हैं?' : 'You have an in-progress screening saved on this terminal. Would you like to resume where you left off?'}</p>
            
            <div style="display: flex; gap: 12px; margin-top: 1.5rem; justify-content: flex-end;">
              <button class="btn-adhd-secondary" onclick="window.adhdAssistant.startFreshSession()">${isHi ? 'नई स्क्रीनिंग शुरू करें' : 'Start Fresh'}</button>
              <button class="btn-adhd-primary" onclick="window.adhdAssistant.resumeSavedSession()">${isHi ? 'जारी रखें' : 'Resume Progress'}</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // 4. Interactive Screening View (1 short question per screen)
    if (!currentQ) return;
    const promptText = isHi ? currentQ.promptHi : currentQ.promptEn;
    const helperText = isHi ? currentQ.helperHi : currentQ.helperEn;
    const currentVal = this.answers[currentQ.id];

    container.innerHTML = `
      <div class="adhd-backdrop">
        <div class="adhd-card">
          <!-- Top Bar: Progress, Mode, Language, TTS -->
          <div class="adhd-top-bar">
            <!-- Progress Pill -->
            <div class="adhd-progress-meta">
              <span class="adhd-step-count">
                ${isHi ? 'प्रश्न' : 'Question'} ${this.activeQuestionIndex + 1} ${isHi ? 'का' : 'of'} ${totalQs}
              </span>
              <span class="adhd-time-estimate" style="display: inline-flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ~${estMinutesRemaining} ${isHi ? 'मिनट शेष' : 'min left'}
              </span>
            </div>

            <!-- Controls (TTS, Mic, Lang, Mode) -->
            <div class="adhd-controls">
              <!-- Mode Toggle -->
              <div class="adhd-mode-toggle">
                <button class="mode-chip ${this.isShortMode ? 'active' : ''}" onclick="window.adhdAssistant.toggleMode(true)">
                  ${isHi ? 'त्वरित (~4m)' : 'Short (~4m)'}
                </button>
                <button class="mode-chip ${!this.isShortMode ? 'active' : ''}" onclick="window.adhdAssistant.toggleMode(false)">
                  ${isHi ? 'विस्तृत (~9m)' : 'Full (~9m)'}
                </button>
              </div>

              <!-- Audio Read Aloud -->
              <button id="adhdAudioBtn" class="btn-adhd-icon" onclick="window.adhdAssistant.speakCurrentQuestion()" title="Listen to question">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </button>

              <!-- Language Toggle -->
              <button class="btn-adhd-icon" onclick="window.adhdAssistant.setLanguage('${isHi ? 'en' : 'hi'}')" title="Switch Language">
                ${isHi ? 'English' : 'हिन्दी'}
              </button>

              <!-- Close -->
              <button class="adhd-close-btn" onclick="window.adhdAssistant.close()"></button>
            </div>
          </div>

          <!-- Progress Bar Line -->
          <div class="adhd-progress-track">
            <div class="adhd-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>

          <!-- Question Content Container -->
          <div class="adhd-question-body">
            <h2 class="adhd-question-title">${promptText}</h2>
            ${helperText ? `<p class="adhd-question-helper">${helperText}</p>` : ''}

            <!-- Large Tap Target Options Grid -->
            <div class="adhd-options-grid">
              ${(currentQ.options || []).map(opt => {
                const label = isHi ? opt.labelHi : opt.labelEn;
                const isSelected = currentVal === opt.value || (Array.isArray(currentVal) && currentVal.includes(opt.value));
                return `
                  <button 
                    class="adhd-option-btn ${isSelected ? 'selected' : ''}" 
                    onclick="window.adhdAssistant.recordAnswer('${currentQ.id}', ${typeof opt.value === 'number' ? opt.value : `'${opt.value}'`})">
                    <span class="option-check">${isSelected ? '' : '○'}</span>
                    <span class="option-label">${label}</span>
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Optional Voice / Free-Text Input -->
            <div class="adhd-text-input-row">
              <input 
                type="text" 
                id="adhdFreeTextInput" 
                class="adhd-text-input" 
                placeholder="${isHi ? 'या अपने शब्दों में बोलें या टाइप करें...' : 'Or speak / type your answer here...'}" 
                onkeydown="if(event.key === 'Enter') { window.adhdAssistant.handleFreeTextAnswer(this.value); this.value = ''; }" />
              <button id="adhdMicBtn" class="btn-adhd-icon" onclick="window.adhdAssistant.startVoiceInput()" title="Voice Dictation">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <button class="btn-adhd-primary-mini" onclick="const val = document.getElementById('adhdFreeTextInput').value; if(val) { window.adhdAssistant.handleFreeTextAnswer(val); document.getElementById('adhdFreeTextInput').value = ''; }">
                ${isHi ? 'भेजें' : 'Send'}
              </button>
            </div>
          </div>

          <!-- Bottom Navigation Bar: Back / Skip / I'm not sure -->
          <div class="adhd-footer">
            <button class="btn-adhd-nav" onclick="window.adhdAssistant.prevQuestion()" ${this.activeQuestionIndex === 0 ? 'disabled' : ''}>
              ← ${isHi ? 'पीछे' : 'Back'}
            </button>
            <div style="display: flex; gap: 8px;">
              <button class="btn-adhd-nav" onclick="window.adhdAssistant.skipQuestion()">
                ${isHi ? 'छोड़ें / निश्चित नहीं' : 'Skip / Not Sure'}
              </button>
              <button class="btn-adhd-nav" onclick="window.adhdAssistant.recordAnswer('CRISIS_SAFETY_CHECK', 'crisis_need_help')" style="color: var(--text-muted);">
                ${isHi ? 'मदद चाहिए' : 'Need Help'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

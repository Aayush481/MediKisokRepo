/**
 * MediKiosk Real-Time Smartphone Notification Simulator
 * Displays an interactive smartphone interface showcasing live SMS & WhatsApp alerts
 * with queue position, members ahead, and estimated appointment time.
 */

import { smsNotificationService } from '../services/smsNotificationService.js';

export class RealtimePhoneModal {
  constructor(options = {}) {
    this.modalEl = null;
    this.isOpen = false;
    this.currentPatient = options.patient || null;
    this.doctorQueue = options.doctorQueue || [];
    this.messages = [];
    this.onQueueAdvance = options.onQueueAdvance || null;

    // Listen to real-time dispatches
    this.unsubscribe = smsNotificationService.subscribe((logItem) => {
      this.handleIncomingSms(logItem);
    });

    this.initMessages();
  }

  initMessages() {
    // Seed initial welcome / queue message
    this.messages = [
      {
        id: 'msg-seed-1',
        sender: 'MEDIKIOSK-GOV',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        membersAhead: 3,
        appointmentTime: '10:45 AM',
        waitMinutes: 22,
        token: 'A-24',
        doctor: 'Dr. Sharma',
        cabin: 'OPD Cabin 3',
        text: '🏥 MediKiosk AI OPD: Dear Patient, Token #A-24 is confirmed. Currently 3 members are ahead of you in line. Your estimated appointment time is 10:45 AM (~22 mins wait) with Dr. Sharma at OPD Cabin 3. Please be seated in Waiting Zone B.'
      }
    ];
  }

  handleIncomingSms(logItem) {
    const formatted = {
      id: logItem.id || 'msg-' + Date.now(),
      sender: 'MEDIKIOSK-GOV',
      timestamp: logItem.dispatchTimestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      membersAhead: logItem.membersAhead !== undefined ? logItem.membersAhead : logItem.patientsAhead,
      appointmentTime: logItem.scheduledTime || '10:45 AM',
      waitMinutes: logItem.waitMinutes || (logItem.membersAhead * 7.5),
      token: logItem.token || 'A-12',
      doctor: logItem.doctorName || 'Dr. Sharma',
      cabin: logItem.cabin || 'OPD Cabin 3',
      text: logItem.message
    };

    this.messages.unshift(formatted);

    // If modal open, re-render chat thread and trigger visual notification pulse
    if (this.isOpen) {
      this.renderMessages();
      this.triggerBannerAnimation(formatted);
    }

    // Update unread badge on top navbar if element exists
    const badge = document.getElementById('phoneSimulatorBadge');
    if (badge) {
      badge.textContent = this.messages.length;
      badge.style.display = 'inline-flex';
    }
  }

  open(patient = null, queue = []) {
    if (patient) this.currentPatient = patient;
    if (queue && queue.length > 0) this.doctorQueue = queue;

    if (!this.modalEl) {
      this.render();
    }
    this.modalEl.style.display = 'flex';
    this.isOpen = true;
    this.renderMessages();

    // Trigger entrance banner
    if (this.messages.length > 0) {
      this.triggerBannerAnimation(this.messages[0]);
    }
  }

  close() {
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
    this.isOpen = false;
  }

  triggerBannerAnimation(msg) {
    const banner = document.getElementById('phoneLiveBanner');
    if (!banner) return;

    banner.classList.remove('slide-in');
    void banner.offsetWidth; // Force reflow
    banner.classList.add('slide-in');

    const titleEl = document.getElementById('phoneBannerTitle');
    const bodyEl = document.getElementById('phoneBannerBody');
    const timeEl = document.getElementById('phoneBannerTime');

    if (titleEl) titleEl.textContent = `MEDIKIOSK • Token #${msg.token}`;
    if (bodyEl) {
      const aheadText = msg.membersAhead === 0 ? 'NOW CALLING' : `${msg.membersAhead} members ahead`;
      bodyEl.textContent = `Queue: ${aheadText} • Appt: ${msg.appointmentTime} (${msg.cabin})`;
    }
    if (timeEl) timeEl.textContent = msg.timestamp;
  }

  render() {
    const existing = document.getElementById('realtimePhoneModalContainer');
    if (existing) existing.remove();

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'realtimePhoneModalContainer';
    this.modalEl.className = 'modal-backdrop-3d';
    this.modalEl.style.display = 'none';
    this.modalEl.style.zIndex = '9999';

    const p = this.currentPatient || (window.app ? window.app.patient : null) || {
      name: 'Walk-in Patient',
      mobile: '+91 98765 43210',
      tokenNumber: 'A-24'
    };

    const qIdx = (window.app && window.app.doctorQueue) ? window.app.doctorQueue.findIndex(item => item.id === p.id) : 2;
    const membersAhead = Math.max(0, qIdx >= 0 ? qIdx : 2);
    const estWaitMin = membersAhead === 0 ? 5 : Math.round(membersAhead * 7.5);
    const estTime = new Date(Date.now() + estWaitMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.modalEl.innerHTML = `
      <div class="modal-content-3d phone-modal-wrapper" style="max-width: 440px; width: 95%; background: transparent; box-shadow: none; border: none; padding: 0;">
        
        <!-- ============================================== -->
        <!-- ULTRA-REALISTIC SMARTPHONE DEVICE CONTAINER    -->
        <!-- ============================================== -->
        <div class="smartphone-bezel">
          <!-- Outer Hardware Buttons -->
          <div class="phone-hw-btn phone-btn-volume-up"></div>
          <div class="phone-hw-btn phone-btn-volume-down"></div>
          <div class="phone-hw-btn phone-btn-power"></div>

          <!-- Glass Screen -->
          <div class="smartphone-screen">
            
            <!-- Dynamic Island / Speaker Notch -->
            <div class="phone-island-bar">
              <div class="phone-camera-lens"></div>
              <div class="phone-speaker-slit"></div>
            </div>

            <!-- Top Status Bar -->
            <div class="phone-status-bar">
              <span class="phone-clock" id="phoneLiveClock">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <div class="phone-network-icons">
                <span style="font-size: 0.68rem; font-weight: 700; letter-spacing: -0.5px;">Jio 5G</span>
                <span class="signal-bars">●●●●</span>
                <span style="font-size: 0.72rem;">📶</span>
                <span style="font-size: 0.72rem;">🔋 98%</span>
              </div>
            </div>

            <!-- Floating Slide-Down Push Notification Banner -->
            <div class="phone-push-banner" id="phoneLiveBanner">
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <div class="push-app-icon">💬</div>
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong class="push-app-title" id="phoneBannerTitle">MEDIKIOSK • Token #A-24</strong>
                    <span class="push-time" id="phoneBannerTime">Just now</span>
                  </div>
                  <p class="push-body" id="phoneBannerBody">
                    Queue: ${membersAhead} members ahead • Appt: ${estTime}
                  </p>
                </div>
              </div>
            </div>

            <!-- In-App Header (SMS Messages App) -->
            <div class="phone-app-header">
              <button class="phone-app-back-btn" onclick="window.realtimePhoneModal.close()">✕</button>
              <div class="phone-contact-info">
                <div class="phone-contact-avatar">🏥</div>
                <div>
                  <div class="phone-contact-name">
                    MEDIKIOSK-GOV <span class="verified-tick">✓</span>
                  </div>
                  <div class="phone-contact-sub">Ayushman Bharat OPD Gateway</div>
                </div>
              </div>
              <div style="width: 28px;"></div>
            </div>

            <!-- Live Appointment & Queue Tracker Ribbon -->
            <div class="phone-live-ribbon">
              <div class="ribbon-metric">
                <span class="ribbon-lbl">REGISTERED NO.</span>
                <span class="ribbon-val" id="phoneModalRegisteredNum">${p.mobile || '+91 98765 43210'}</span>
              </div>
              <div class="ribbon-divider"></div>
              <div class="ribbon-metric">
                <span class="ribbon-lbl">MEMBERS NEXT</span>
                <span class="ribbon-val" style="color: var(--amber);" id="phoneModalMembersAhead">${membersAhead} Ahead</span>
              </div>
              <div class="ribbon-divider"></div>
              <div class="ribbon-metric">
                <span class="ribbon-lbl">APPT. TIME</span>
                <span class="ribbon-val" style="color: var(--emerald);" id="phoneModalApptTime">${estTime}</span>
              </div>
            </div>

            <!-- Chat Message Feed -->
            <div class="phone-chat-scroll" id="phoneChatMessages">
              <!-- Rendered dynamically -->
            </div>

            <!-- Interactive Quick Actions Drawer -->
            <div class="phone-action-tray">
              <div style="display: flex; gap: 6px; margin-bottom: 8px;">
                <input type="tel" id="phoneQuickTestNumber" class="input-text-3d" style="flex: 1; padding: 6px 10px; font-size: 0.75rem; border-radius: 8px; background: rgba(255,255,255,0.9);" placeholder="Enter Registered Mobile" value="${p.mobile || '+91 98765 43210'}">
                <button type="button" class="btn-3d btn-3d-primary" style="padding: 6px 12px; font-size: 0.74rem; white-space: nowrap;" onclick="window.realtimePhoneModal.sendTestSmsFromInput()">
                  ⚡ Send SMS
                </button>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                <button type="button" class="btn-3d btn-3d-secondary" style="padding: 6px 8px; font-size: 0.72rem; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="window.realtimePhoneModal.simulateAdvanceQueue()">
                  ⏭️ Advance Queue (-1)
                </button>
                <button type="button" class="btn-3d btn-3d-secondary" style="padding: 6px 8px; font-size: 0.72rem; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="window.realtimePhoneModal.copyLastMessage()">
                  📋 Copy SMS
                </button>
              </div>
            </div>

            <!-- Home Indicator Bar -->
            <div class="phone-home-indicator" onclick="window.realtimePhoneModal.close()"></div>
          </div>
        </div>

        <!-- Floating Close Pill -->
        <div style="text-align: center; margin-top: 10px;">
          <button class="btn-3d btn-3d-secondary" style="padding: 6px 16px; font-size: 0.8rem; background: rgba(15, 23, 42, 0.8); color: #FFFFFF; border-color: rgba(255,255,255,0.2);" onclick="window.realtimePhoneModal.close()">
            ✕ Close Phone Preview
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(this.modalEl);

    // Close on backdrop click
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    // Update live clock
    setInterval(() => {
      const clock = document.getElementById('phoneLiveClock');
      if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 10000);
  }

  renderMessages() {
    const container = document.getElementById('phoneChatMessages');
    if (!container) return;

    if (this.messages.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: #94A3B8; font-size: 0.78rem;">
          No SMS messages received yet on registered number.
        </div>
      `;
      return;
    }

    container.innerHTML = this.messages.map(msg => {
      const isCall = msg.membersAhead === 0 || (msg.text && msg.text.includes('NOW CALLING'));
      const isNext = msg.membersAhead === 1;

      return `
        <div class="sms-bubble-wrapper">
          <div class="sms-timestamp-pill">${msg.timestamp}</div>

          <div class="sms-bubble ${isCall ? 'call-now' : ''}">
            <!-- SMS Card Header -->
            <div class="sms-header">
              <span class="sms-sender">🏥 MEDIKIOSK AI OPD</span>
              <span class="sms-badge ${isCall ? 'badge-emergency' : isNext ? 'badge-next' : 'badge-token'}">
                ${isCall ? '🚨 CALL IN' : isNext ? '⚡ NEXT IN LINE' : 'TOKEN #' + msg.token}
              </span>
            </div>

            <!-- Highlighted Queue Info Box -->
            <div class="sms-queue-card">
              <div class="sms-queue-row">
                <span class="sms-lbl">👥 Members Next in Line:</span>
                <strong class="sms-val" style="color: ${isCall ? '#DC2626' : isNext ? '#D97706' : '#059669'};">
                  ${isCall ? 'Doctor Calling Now!' : msg.membersAhead + ' Ahead of You'}
                </strong>
              </div>
              <div class="sms-queue-row">
                <span class="sms-lbl">⏰ Appointment Time:</span>
                <strong class="sms-val" style="color: #0F172A;">
                  ${msg.appointmentTime} (~${Math.max(5, Math.round(msg.waitMinutes || (msg.membersAhead * 7.5)))} mins)
                </strong>
              </div>
              <div class="sms-queue-row">
                <span class="sms-lbl">👨‍⚕️ Cabin:</span>
                <span class="sms-val">${msg.doctor} • ${msg.cabin}</span>
              </div>
            </div>

            <!-- Full Message Body -->
            <p class="sms-body-text">
              ${msg.text}
            </p>

            <!-- Delivery Receipt Footer -->
            <div class="sms-footer">
              <span>Delivered via Airtel/Jio SMS Gateway</span>
              <span>✓✓ Received</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  async sendTestSmsFromInput() {
    const input = document.getElementById('phoneQuickTestNumber');
    const mobile = input ? input.value.trim() : '+91 98765 43210';
    const p = this.currentPatient || (window.app ? window.app.patient : null) || {};

    let qIdx = 2;
    if (window.app && window.app.doctorQueue) {
      const idx = window.app.doctorQueue.findIndex(item => item.id === p.id);
      if (idx >= 0) qIdx = idx;
    }

    const membersAhead = qIdx;
    const waitMin = membersAhead === 0 ? 5 : Math.round(membersAhead * 7.5);
    const estTime = new Date(Date.now() + waitMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Update patient mobile if app exists
    if (window.app && window.app.patient) {
      window.app.patient.mobile = mobile;
    }

    const dispatched = await smsNotificationService.dispatchRealtimeSms({
      mobile,
      patientId: p.id || 'PAT-TEST',
      patientName: p.name || 'Walk-in Patient',
      tokenNumber: p.tokenNumber || 'A-24',
      membersAhead,
      appointmentTime: estTime,
      waitMinutes: waitMin,
      doctorName: 'Dr. Sharma',
      cabin: 'OPD Cabin 3',
      eventType: membersAhead === 0 ? 'CABIN_CALL' : membersAhead === 1 ? 'NEXT_IN_LINE' : 'QUEUE_UPDATE'
    });

    // Update ribbon
    const numEl = document.getElementById('phoneModalRegisteredNum');
    if (numEl) numEl.textContent = mobile;

    if (window.app && typeof window.app.showDoctorToast === 'function') {
      window.app.showDoctorToast(`📲 Real-time message dispatched to ${mobile} (${membersAhead} members ahead, Appt: ${estTime})`);
    }
  }

  simulateAdvanceQueue() {
    // Decrement members ahead for demonstrated patient
    const lastMsg = this.messages[0];
    const prevAhead = lastMsg ? lastMsg.membersAhead : 3;
    const newAhead = Math.max(0, prevAhead - 1);
    const waitMin = newAhead === 0 ? 0 : Math.round(newAhead * 7.5);
    const estTime = new Date(Date.now() + Math.max(5, waitMin) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const p = this.currentPatient || (window.app ? window.app.patient : null) || {};
    const mobile = p.mobile || '+91 98765 43210';

    const eventType = newAhead === 0 ? 'CABIN_CALL' : newAhead === 1 ? 'NEXT_IN_LINE' : 'QUEUE_UPDATE';

    smsNotificationService.dispatchRealtimeSms({
      mobile,
      patientId: p.id || 'PAT-SIM',
      patientName: p.name || 'Walk-in Patient',
      tokenNumber: p.tokenNumber || 'A-24',
      membersAhead: newAhead,
      appointmentTime: estTime,
      waitMinutes: waitMin,
      doctorName: 'Dr. Sharma',
      cabin: 'OPD Cabin 3',
      eventType
    });

    // If caller provided callback, advance queue in app as well
    if (typeof this.onQueueAdvance === 'function') {
      this.onQueueAdvance();
    } else if (window.app && typeof window.app.callNextPatient === 'function' && window.app.currentMode === 'doctor') {
      window.app.callNextPatient();
    }

    // Update ribbon
    const aheadEl = document.getElementById('phoneModalMembersAhead');
    const timeEl = document.getElementById('phoneModalApptTime');
    if (aheadEl) aheadEl.textContent = newAhead === 0 ? 'Called In!' : `${newAhead} Ahead`;
    if (timeEl) timeEl.textContent = estTime;
  }

  copyLastMessage() {
    if (this.messages.length === 0) return;
    const text = this.messages[0].text;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.app && typeof window.app.showDoctorToast === 'function') {
          window.app.showDoctorToast('📋 SMS message text copied to clipboard.');
        } else {
          alert('Copied SMS message to clipboard:\n\n' + text);
        }
      });
    }
  }
}

/**
 * MediKiosk Virtual Smartphone SMS Handset Simulator
 * Renders an interactive phone simulation displaying real-time incoming SMS messages
 * showing queue status, members ahead count, and estimated appointment time.
 */

import { notificationClientService } from '../services/notificationClientService.js';

export class PhoneSimulatorModal {
  constructor(appInstance) {
    this.app = appInstance;
    this.modalEl = null;
    this.isOpen = false;
    this.customMobile = "";

    // Subscribe to incoming messages
    notificationClientService.subscribe((event, data) => {
      if (this.isOpen) {
        this.renderMessages();
      }
      this.updateUnreadBadge();
    });
  }

  open(mobile) {
    this.isOpen = true;
    if (mobile) {
      this.customMobile = mobile;
    } else if (this.app && this.app.patient && this.app.patient.mobile) {
      this.customMobile = this.app.patient.mobile;
    } else {
      this.customMobile = "+91 98765 43210";
    }

    this.render();
  }

  close() {
    this.isOpen = false;
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
  }

  toggle(mobile) {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(mobile);
    }
  }

  updateUnreadBadge() {
    const badge = document.getElementById('phoneSimulatorBadge');
    if (badge) {
      const logs = notificationClientService.getLogs();
      badge.textContent = logs.length;
      badge.style.display = logs.length > 0 ? 'inline-flex' : 'none';
    }
  }

  render() {
    if (!this.modalEl) {
      this.modalEl = document.createElement('div');
      this.modalEl.id = 'phoneSimulatorModal';
      this.modalEl.className = 'phone-modal-overlay';
      document.body.appendChild(this.modalEl);
    }

    this.modalEl.style.display = 'flex';
    this.modalEl.innerHTML = `
      <div class="phone-handset-container" onclick="event.stopPropagation()">
        <!-- Phone Hardware Frame -->
        <div class="phone-handset-frame">
          <!-- Phone Speaker & Camera Notch -->
          <div class="phone-notch">
            <div class="phone-speaker"></div>
            <div class="phone-camera-lens"></div>
          </div>

          <!-- Phone Status Bar -->
          <div class="phone-status-bar">
            <span class="phone-time" id="phoneClock">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div class="phone-icons">
              <span title="5G Carrier Signal">5G</span>
              <span title="Wi-Fi Connected"></span>
              <span title="98% Battery">98% </span>
            </div>
          </div>

          <!-- Messages App Header -->
          <div class="phone-app-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="phone-back-btn" onclick="window.app && window.app.togglePhoneSimulator(false)" title="Close Phone"></button>
              <div class="phone-avatar"></div>
              <div>
                <div class="phone-contact-name">MediKiosk OPD Alert</div>
                <div class="phone-registered-badge">
                  <span> Reg:</span>
                  <strong id="phoneActiveMobile">${this.customMobile}</strong>
                </div>
              </div>
            </div>
            <button class="phone-close-action" onclick="window.app && window.app.togglePhoneSimulator(false)">Done</button>
          </div>

          <!-- Queue Status At A Glance Widget -->
          <div class="phone-queue-summary-card" id="phoneQueueBanner">
            ${this.renderQueueBannerContent()}
          </div>

          <!-- SMS Thread Messages Body -->
          <div class="phone-sms-thread" id="phoneSmsThread">
            ${this.renderMessagesHtml()}
          </div>

          <!-- Quick Test & Mobile Input Controls -->
          <div class="phone-footer-toolbar">
            <div class="phone-input-row">
              <input type="tel" id="simulatorMobileInput" class="phone-mini-input" placeholder="Change Mobile (+91...)" value="${this.customMobile}">
              <button type="button" class="phone-send-test-btn" onclick="window.app && window.app.sendTestSmsFromSimulator()">
                 Send Live SMS
              </button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.68rem; color: #64748b; margin-top: 4px;">
              <span>Real-Time SMS & WhatsApp Carrier Service</span>
              <span style="color: #10b981; font-weight: 700;">● Active Gateway</span>
            </div>
          </div>

          <!-- Phone Home Indicator Bar -->
          <div class="phone-home-indicator"></div>
        </div>
      </div>
    `;

    // Close on background click
    this.modalEl.onclick = (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    };

    // Auto-scroll SMS thread to bottom
    const thread = document.getElementById('phoneSmsThread');
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }

  renderQueueBannerContent() {
    // Determine active patient queue position
    let patient = this.app ? this.app.patient : null;
    let queue = (this.app && this.app.doctorQueue) ? this.app.doctorQueue : [];
    let qIdx = -1;

    if (patient && patient.id) {
      qIdx = queue.findIndex(p => p.id === patient.id || (p.mobile && p.mobile === this.customMobile));
    }
    if (qIdx < 0 && this.customMobile) {
      qIdx = queue.findIndex(p => p.mobile && p.mobile.replace(/\D/g, '') === this.customMobile.replace(/\D/g, ''));
    }

    const membersNext = qIdx >= 0 ? qIdx : 2;
    const waitMin = membersNext === 0 ? 0 : Math.round(membersNext * 7.5);
    const estTime = new Date(Date.now() + Math.max(5, waitMin) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const token = (patient && patient.tokenNumber) ? patient.tokenNumber : (qIdx >= 0 ? queue[qIdx].tokenNumber : "TK-101");

    return `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 800; font-size: 0.76rem; color: #047857; text-transform: uppercase; letter-spacing: 0.05em;">
          Live OPD Queue Status
        </span>
        <span class="pill-3d pill-3d-emerald" style="font-size: 0.68rem; padding: 2px 7px;">
          Token #${token}
        </span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
        <div class="phone-metric-box">
          <span class="phone-metric-label">Members Next:</span>
          <span class="phone-metric-val ${membersNext === 0 ? 'urgent' : ''}">
            ${membersNext === 0 ? ' In Cabin Now' : (membersNext === 1 ? ' 1 (You Are Next!)' : `${membersNext} Members Ahead`)}
          </span>
        </div>
        <div class="phone-metric-box">
          <span class="phone-metric-label">Appt Time:</span>
          <span class="phone-metric-val">~${estTime} (${waitMin}m)</span>
        </div>
      </div>
    `;
  }

  renderMessagesHtml() {
    const logs = notificationClientService.getLogs();
    if (!logs || logs.length === 0) {
      return `
        <div class="phone-empty-thread">
          <div style="font-size: 2.2rem; margin-bottom: 6px;"></div>
          <p style="font-weight: 700; color: #1e293b; margin: 0 0 4px 0;">No Messages Yet</p>
          <p style="font-size: 0.74rem; color: #64748b; margin: 0; line-height: 1.4;">
            When you register or the queue updates, real-time SMS messages will appear on this handset with members next & appointment times.
          </p>
        </div>
      `;
    }

    return logs.map((msg, i) => {
      const isUrgent = msg.membersNext === 0 || msg.alertType === "cabin_call";
      const isNext = msg.membersNext === 1 || msg.alertType === "urgent_next";

      return `
        <div class="phone-bubble-wrapper">
          <div class="phone-bubble-timestamp">${msg.dispatchTimestamp || 'Just now'} • SMS Delivery</div>
          <div class="phone-sms-bubble ${isUrgent ? 'urgent' : ''} ${isNext ? 'next-alert' : ''}">
            <div class="phone-bubble-header">
              <span class="phone-sender-tag"> MEDIKIOSK-OPD</span>
              <span class="phone-status-tag">${msg.status || 'Delivered '}</span>
            </div>
            <div class="phone-bubble-text">
              ${msg.message}
            </div>
            <div class="phone-bubble-pills">
              <span class="phone-pill"> ${msg.membersNext === 0 ? 'Your Turn' : `${msg.membersNext} Next`}</span>
              <span class="phone-pill">⏱ ${msg.appointmentTime}</span>
              <span class="phone-pill"> #${msg.tokenNumber}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderMessages() {
    const thread = document.getElementById('phoneSmsThread');
    if (thread) {
      thread.innerHTML = this.renderMessagesHtml();
      thread.scrollTop = thread.scrollHeight;
    }
    const banner = document.getElementById('phoneQueueBanner');
    if (banner) {
      banner.innerHTML = this.renderQueueBannerContent();
    }
  }
}

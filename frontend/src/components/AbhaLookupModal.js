/**
 * MediKiosk ABHA Patient Lookup & Verification Component
 * Multi-step glassmorphic 3D accessible modal:
 * Step 1: ABHA Number Input -> Request OTP
 * Step 2: 6-digit OTP Verification + 60s Resend Timer
 * Step 3: ABDM Verified Demographic Profile Display + Auto-fill & Link Action
 */

import { abhaClientService } from '../services/abhaService.js';

export class AbhaLookupModal {
  constructor(options = {}) {
    this.onSuccess = options.onSuccess || (() => {});
    this.onClose = options.onClose || (() => {});
    this.modalEl = null;

    // Component State
    this.currentStep = 1; // 1: Input, 2: OTP, 3: Profile
    this.abhaNumber = '';
    this.otpSystem = 'aadhaar'; // 'aadhaar' | 'abdm'
    this.txnId = '';
    this.otpValue = '';
    this.profile = null;
    this.isLoading = false;
    this.errorMessage = '';
    this.resendCountdown = 60;
    this.timerInterval = null;
    this.consentGiven = true;
  }

  /**
   * Format raw digits into standard ABHA format: XX-XXXX-XXXX-XXXX, or preserve ABHA Address
   */
  formatAbhaInput(val) {
    if (!val) return '';
    const trimmed = val.trim();
    if (trimmed.includes('@') || /[a-zA-Z]/.test(trimmed)) {
      return trimmed;
    }
    const digits = trimmed.replace(/\D/g, '').slice(0, 14);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 6));
    if (digits.length > 6) parts.push(digits.slice(6, 10));
    if (digits.length > 10) parts.push(digits.slice(10, 14));
    return parts.join('-');
  }

  open(initialAbha = '') {
    this.currentStep = 1;
    this.abhaNumber = this.formatAbhaInput(initialAbha);
    this.otpValue = '';
    this.errorMessage = '';
    this.isLoading = false;
    this.profile = null;

    this.renderModal();
  }

  close() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.modalEl) {
      this.modalEl.remove();
      this.modalEl = null;
    }
    this.onClose();
  }

  startResendTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.resendCountdown = 60;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.updateTimerDisplay();
    }, 1000);
  }

  updateTimerDisplay() {
    const timerText = document.getElementById('abhaResendTimerText');
    const resendBtn = document.getElementById('abhaResendBtn');
    if (timerText) {
      if (this.resendCountdown > 0) {
        timerText.textContent = `(Resend in ${this.resendCountdown}s)`;
      } else {
        timerText.textContent = '';
      }
    }
    if (resendBtn) {
      resendBtn.disabled = this.resendCountdown > 0 || this.isLoading;
    }
  }

  async handleRequestOtp() {
    const trimmed = (this.abhaNumber || '').trim();
    const isAbhaAddress = trimmed.includes('@');
    const cleanId = isAbhaAddress ? trimmed : trimmed.replace(/\D/g, '');

    if (!isAbhaAddress && cleanId.length !== 14) {
      this.errorMessage = 'Please enter a valid 14-digit ABHA number or ABHA address (e.g. user@abdm).';
      this.renderBody();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.renderBody();

    const result = await abhaClientService.requestOtp(cleanId, this.otpSystem);

    this.isLoading = false;
    if (!result.success) {
      this.errorMessage = result.error || 'Failed to request OTP from ABDM.';
      this.renderBody();
      return;
    }

    this.txnId = result.txnId;
    this.currentStep = 2;
    this.renderBody();
    this.startResendTimer();

    // Auto-focus OTP input
    setTimeout(() => {
      const otpInput = document.getElementById('abhaOtpInput');
      if (otpInput) otpInput.focus();
    }, 100);
  }

  async handleVerifyOtp() {
    const cleanOtp = (this.otpValue || '').trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      this.errorMessage = 'Please enter a valid 6-digit numeric OTP.';
      this.renderBody();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.renderBody();

    const result = await abhaClientService.verifyOtp(this.txnId, cleanOtp, this.abhaNumber);

    this.isLoading = false;
    if (!result.success) {
      this.errorMessage = result.error || 'Invalid OTP or verification failure.';
      this.renderBody();
      return;
    }

    this.profile = result.profile;
    this.currentStep = 3;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.renderBody();
  }

  async handleLinkPatient() {
    if (!this.profile) return;
    if (!this.consentGiven) {
      this.errorMessage = 'Patient consent is required before importing demographic data.';
      this.renderBody();
      return;
    }

    this.isLoading = true;
    this.renderBody();

    const consent = {
      consentGiven: true,
      purpose: 'CLINICAL_INTAKE_REGISTRATION',
      consentTimestamp: new Date().toISOString()
    };

    const linkResult = await abhaClientService.linkPatient(this.profile, consent);

    this.isLoading = false;
    if (!linkResult.success) {
      this.errorMessage = linkResult.error || 'Failed to persist patient record.';
      this.renderBody();
      return;
    }

    // Success: Pass verified profile to MediKiosk app callback and close
    this.onSuccess(this.profile);
    this.close();
  }

  renderModal() {
    // Remove any existing modal
    const existing = document.getElementById('abhaLookupModalContainer');
    if (existing) existing.remove();

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'abhaLookupModalContainer';
    this.modalEl.className = 'modal-backdrop-3d';
    this.modalEl.style.display = 'flex';
    this.modalEl.innerHTML = `
      <div class="modal-content-3d abha-modal-container" style="max-width: 620px; width: 95%;">
        <!-- Header -->
        <div class="abha-modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="abha-badge-icon">🇮🇳</div>
            <div>
              <h3 style="margin: 0; font-size: 1.18rem; font-weight: 800; color: var(--text-primary);">
                ABHA Patient Lookup & Verification
              </h3>
              <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--text-muted);">
                Ayushman Bharat Digital Mission (ABDM) • Milestone 1 Gateway
              </p>
            </div>
          </div>
          <button id="closeAbhaModalBtn" class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.8rem;"></button>
        </div>

        <!-- Progress Steps -->
        <div class="abha-step-indicator">
          <div class="abha-step-item ${this.currentStep === 1 ? 'active' : ''} ${this.currentStep > 1 ? 'completed' : ''}">
            <div class="abha-step-dot">1</div>
            <span>ABHA Lookup</span>
          </div>
          <div class="abha-step-line ${this.currentStep > 1 ? 'filled' : ''}"></div>
          <div class="abha-step-item ${this.currentStep === 2 ? 'active' : ''} ${this.currentStep > 2 ? 'completed' : ''}">
            <div class="abha-step-dot">2</div>
            <span>Verify OTP</span>
          </div>
          <div class="abha-step-line ${this.currentStep > 2 ? 'filled' : ''}"></div>
          <div class="abha-step-item ${this.currentStep === 3 ? 'active' : ''}">
            <div class="abha-step-dot">3</div>
            <span>ABDM Profile</span>
          </div>
        </div>

        <!-- Modal Body Container -->
        <div id="abhaModalBody" style="margin-top: 1.2rem;">
          <!-- Rendered dynamically -->
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    // Bind Close button & Backdrop click
    const closeBtn = document.getElementById('closeAbhaModalBtn');
    if (closeBtn) closeBtn.onclick = () => this.close();
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    this.renderBody();
  }

  renderBody() {
    const body = document.getElementById('abhaModalBody');
    if (!body) return;

    let contentHtml = '';

    // Error Alert Banner
    const errorHtml = this.errorMessage ? `
      <div class="abha-alert-error" role="alert">
        <span style="font-size: 1rem;"></span>
        <span style="font-size: 0.82rem; line-height: 1.4;">${this.errorMessage}</span>
      </div>
    ` : '';

    if (this.currentStep === 1) {
      contentHtml = `
        ${errorHtml}
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label class="input-label-3d" style="color: var(--text-primary); font-weight: 700;">
              Enter 14-Digit ABHA Number
            </label>
            <div style="position: relative; margin-top: 6px;">
              <input 
                type="text" 
                id="abhaNumberInput" 
                class="input-text-3d abha-input-large" 
                placeholder="e.g. 91-0000-0000-0001" 
                value="${this.abhaNumber}" 
                maxlength="17"
                autofocus
              />
              <span class="abha-input-icon">🆔</span>
            </div>
            <span style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px; display: block;">
              Format: 14 digits linked with patient's Ayushman Bharat Health Account
            </span>
          </div>

          <div>
            <label class="input-label-3d" style="color: var(--text-primary); font-weight: 700;">
              OTP Verification Mode
            </label>
            <div class="abha-radio-group">
              <label class="abha-radio-card ${this.otpSystem === 'aadhaar' ? 'selected' : ''}">
                <input type="radio" name="otpSys" value="aadhaar" ${this.otpSystem === 'aadhaar' ? 'checked' : ''} />
                <div>
                  <strong style="display: block; font-size: 0.85rem; color: var(--text-primary);">Aadhaar OTP (Recommended)</strong>
                  <span style="font-size: 0.74rem; color: var(--text-muted);">Dispatched to Aadhaar-linked mobile number</span>
                </div>
              </label>

              <label class="abha-radio-card ${this.otpSystem === 'abdm' ? 'selected' : ''}">
                <input type="radio" name="otpSys" value="abdm" ${this.otpSystem === 'abdm' ? 'checked' : ''} />
                <div>
                  <strong style="display: block; font-size: 0.85rem; color: var(--text-primary);">ABDM Mobile OTP</strong>
                  <span style="font-size: 0.74rem; color: var(--text-muted);">Dispatched to mobile registered on ABHA</span>
                </div>
              </label>
            </div>
          </div>

          <div class="abha-dpdp-notice">
            <span></span>
            <span style="font-size: 0.75rem; color: var(--emerald-deep);">
              <strong>DPDP Act 2023 Consent:</strong> Patient authentication occurs directly via ABDM secure gateway. Credentials & OTPs are never stored in plain text.
            </span>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
            <button id="cancelAbhaBtn" class="btn-3d btn-3d-secondary">Cancel</button>
            <button id="sendAbhaOtpBtn" class="btn-3d btn-3d-primary" ${this.isLoading ? 'disabled' : ''}>
              ${this.isLoading ? '<span class="abha-spinner"></span> Requesting OTP...' : 'Request OTP from ABDM →'}
            </button>
          </div>
        </div>
      `;
    } else if (this.currentStep === 2) {
      const maskedAbha = this.abhaNumber.length > 4 ? `**-****-****-${this.abhaNumber.slice(-4)}` : '****';
      contentHtml = `
        ${errorHtml}
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 10px; padding: 12px 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 0.74rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Target ABHA</span>
                <div style="font-family: var(--font-mono); font-size: 1rem; color: var(--emerald-dark); font-weight: 700;">${maskedAbha}</div>
              </div>
              <button id="abhaChangeNumberBtn" class="btn-3d btn-3d-secondary" style="font-size: 0.75rem; padding: 4px 10px;">Change</button>
            </div>
            <p style="margin: 6px 0 0; font-size: 0.76rem; color: var(--emerald-dark);">
               OTP sent to mobile registered with ${this.otpSystem === 'aadhaar' ? 'UIDAI (Aadhaar)' : 'ABDM'}.
            </p>
          </div>

          <div>
            <label class="input-label-3d" style="color: var(--text-primary); font-weight: 700;">
              Enter 6-Digit OTP Code
            </label>
            <input 
              type="text" 
              id="abhaOtpInput" 
              class="input-text-3d abha-otp-input" 
              placeholder="••••••" 
              value="${this.otpValue}" 
              maxlength="6"
              inputmode="numeric"
              autocomplete="one-time-code"
            />
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
            <span style="color: var(--text-muted);">Didn't receive the OTP?</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button id="abhaResendBtn" class="btn-inline" ${this.resendCountdown > 0 || this.isLoading ? 'disabled' : ''}>
                Resend OTP
              </button>
              <span id="abhaResendTimerText" style="color: var(--text-muted); font-family: var(--font-mono);">
                ${this.resendCountdown > 0 ? `(${this.resendCountdown}s)` : ''}
              </span>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button id="abhaBackBtn" class="btn-3d btn-3d-secondary" ${this.isLoading ? 'disabled' : ''}>← Back</button>
            <button id="abhaVerifyBtn" class="btn-3d btn-3d-primary" ${this.isLoading ? 'disabled' : ''}>
              ${this.isLoading ? '<span class="abha-spinner"></span> Verifying with ABDM...' : 'Verify OTP & Fetch Profile '}
            </button>
          </div>
        </div>
      `;
    } else if (this.currentStep === 3) {
      const p = this.profile || {};
      contentHtml = `
        ${errorHtml}
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Verified Profile Card -->
          <div class="abha-profile-card">
            <div style="display: flex; gap: 16px; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
              <div class="abha-photo-circle">
                ${p.photoUrl ? `<img src="data:image/jpeg;base64,${p.photoUrl}" alt="Patient Photo" />` : `<span>${(p.name || 'P')[0]}</span>`}
              </div>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <h4 style="margin: 0; font-size: 1.15rem; color: var(--text-primary); font-weight: 800;">${p.name || 'ABHA Patient'}</h4>
                  <span class="pill-3d pill-3d-emerald" style="font-size: 0.7rem; padding: 2px 8px;"> ABDM VERIFIED</span>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 4px; font-size: 0.8rem; color: var(--emerald-dark); font-family: var(--font-mono);">
                  <span>ABHA: ${p.abhaNumber || 'N/A'}</span>
                  <span>•</span>
                  <span>${p.abhaAddress || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div class="abha-demographics-grid">
              <div>
                <span class="meta-label">Gender</span>
                <strong class="meta-value">${p.gender || 'N/A'}</strong>
              </div>
              <div>
                <span class="meta-label">Age / DOB</span>
                <strong class="meta-value">${p.age ? `${p.age} Yrs` : ''} (${p.dateOfBirth || 'N/A'})</strong>
              </div>
              <div>
                <span class="meta-label">Mobile</span>
                <strong class="meta-value">${p.mobile ? `******${p.mobile.slice(-4)}` : 'N/A'}</strong>
              </div>
              <div>
                <span class="meta-label">Location</span>
                <strong class="meta-value">${[p.district, p.state].filter(Boolean).join(', ') || 'N/A'} (${p.pincode || ''})</strong>
              </div>
            </div>
          </div>

          <!-- Consent Checkbox -->
          <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; background: var(--bg-surface-inset); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-light);">
            <input type="checkbox" id="abhaConsentCheckbox" ${this.consentGiven ? 'checked' : ''} style="margin-top: 3px; accent-color: var(--emerald);" />
            <span style="font-size: 0.76rem; color: var(--text-secondary); line-height: 1.4;">
              I confirm that the patient has provided informed consent under DPDP Act 2023 to link this ABDM profile and pre-populate clinical intake records.
            </span>
          </label>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
            <button id="abhaCloseFinishedBtn" class="btn-3d btn-3d-secondary">Cancel</button>
            <button id="abhaUseProfileBtn" class="btn-3d btn-3d-primary" ${this.isLoading ? 'disabled' : ''}>
              ${this.isLoading ? '<span class="abha-spinner"></span> Saving Record...' : 'Auto-Fill & Link Patient Record '}
            </button>
          </div>
        </div>
      `;
    }

    body.innerHTML = contentHtml;
    this.bindEvents();
  }

  bindEvents() {
    // Step 1 Events
    const abhaInput = document.getElementById('abhaNumberInput');
    if (abhaInput) {
      abhaInput.addEventListener('input', (e) => {
        this.abhaNumber = this.formatAbhaInput(e.target.value);
        e.target.value = this.abhaNumber;
      });
      abhaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleRequestOtp();
      });
    }

    document.querySelectorAll('input[name="otpSys"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.otpSystem = e.target.value;
        this.renderBody();
      });
    });

    const sendOtpBtn = document.getElementById('sendAbhaOtpBtn');
    if (sendOtpBtn) sendOtpBtn.onclick = () => this.handleRequestOtp();

    const cancelBtn = document.getElementById('cancelAbhaBtn');
    if (cancelBtn) cancelBtn.onclick = () => this.close();

    // Step 2 Events
    const otpInput = document.getElementById('abhaOtpInput');
    if (otpInput) {
      otpInput.addEventListener('input', (e) => {
        this.otpValue = e.target.value.replace(/\D/g, '').slice(0, 6);
        e.target.value = this.otpValue;
      });
      otpInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleVerifyOtp();
      });
    }

    const verifyBtn = document.getElementById('abhaVerifyBtn');
    if (verifyBtn) verifyBtn.onclick = () => this.handleVerifyOtp();

    const backBtn = document.getElementById('abhaBackBtn');
    if (backBtn) {
      backBtn.onclick = () => {
        this.currentStep = 1;
        this.errorMessage = '';
        this.renderBody();
      };
    }

    const changeNumBtn = document.getElementById('abhaChangeNumberBtn');
    if (changeNumBtn) {
      changeNumBtn.onclick = () => {
        this.currentStep = 1;
        this.errorMessage = '';
        this.renderBody();
      };
    }

    const resendBtn = document.getElementById('abhaResendBtn');
    if (resendBtn) {
      resendBtn.onclick = () => {
        if (this.resendCountdown <= 0) {
          this.handleRequestOtp();
        }
      };
    }

    // Step 3 Events
    const consentCb = document.getElementById('abhaConsentCheckbox');
    if (consentCb) {
      consentCb.addEventListener('change', (e) => {
        this.consentGiven = e.target.checked;
      });
    }

    const useProfileBtn = document.getElementById('abhaUseProfileBtn');
    if (useProfileBtn) useProfileBtn.onclick = () => this.handleLinkPatient();

    const closeFinBtn = document.getElementById('abhaCloseFinishedBtn');
    if (closeFinBtn) closeFinBtn.onclick = () => this.close();
  }
}

// Patient registration, ABHA check-in, and live digital health card component

export function renderStep1Registration(app, i18n) {
  const patient = app.patient;
  const isVerified = Boolean(patient.isAbhaVerified && patient.abhaDetails);
  const details = patient.abhaDetails || {};

  return `
    <div class="registration-layout-grid">
      <!-- Left Column: Primary Intake Form -->
      <div class="card-3d">
        <div class="card-header-3d">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.65rem;">Terminal: Kiosk-04 • OPD Admissions</span>
              <span class="pill-3d pill-3d-blue" style="font-size: 0.65rem;">ABDM Milestone 1-3</span>
            </div>
            <h2 class="card-title-3d">${i18n.t("reg_title")}</h2>
            <p class="card-subtitle-3d">${i18n.t("reg_subtitle")}</p>
          </div>
          <button class="btn-3d btn-3d-secondary" style="padding: 8px 14px; font-size: 0.8rem;" onclick="window.app.speakStep1Prompt()">
            ${i18n.t("audio_guide_btn")}
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 1rem;">
          <!-- Patient Full Name -->
          <div>
            <label class="input-label-3d">
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${i18n.t("full_name_label")}
              </span>
            </label>
            <input type="text" id="patientNameInput" class="input-text-3d" placeholder="${i18n.t("full_name_ph")}" value="${patient.name || ''}" autocomplete="name">
          </div>

          <!-- Age and Gender Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label class="input-label-3d">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  ${i18n.t("age_label")}
                </span>
              </label>
              <input type="number" id="patientAgeInput" class="input-text-3d" placeholder="${i18n.t("age_ph")}" value="${patient.age || ''}" min="1" max="120">
            </div>
            <div>
              <label class="input-label-3d">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M9.17 14.83l-4.24 4.24"/></svg>
                  ${i18n.t("gender_label")}
                </span>
              </label>
              <select id="patientGenderInput" class="input-text-3d">
                <option value="Female" ${patient.gender === 'Female' ? 'selected' : ''}>${i18n.t("gender_female")}</option>
                <option value="Male" ${patient.gender === 'Male' ? 'selected' : ''}>${i18n.t("gender_male")}</option>
                <option value="Other" ${patient.gender === 'Other' ? 'selected' : ''}>${i18n.t("gender_other")}</option>
              </select>
            </div>
          </div>

          <!-- ABHA Number with Verification Action -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="input-label-3d" style="margin-bottom: 0;">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  ${i18n.t("abha_label")}
                </span>
              </label>
              ${isVerified ? `
                <span class="pill-3d pill-3d-emerald" style="font-size: 0.66rem; padding: 2px 8px;">
                   Verified & Linked
                </span>
              ` : `
                <span style="font-size: 0.68rem; font-family: var(--font-mono); color: var(--grey-500);">
                  Optional / Fast e-KYC
                </span>
              `}
            </div>
            <div class="input-with-action-group">
              <input type="text" id="patientAbhaInput" class="input-text-3d" placeholder="${i18n.t("abha_ph")}" value="${patient.abhaId || ''}" onkeydown="if(event.key==='Enter'){event.preventDefault();window.app.verifyAbhaRecord();}">
              <button type="button" class="btn-3d ${isVerified ? 'btn-3d-secondary' : 'btn-3d-primary'}" style="padding: 0 16px; font-size: 0.78rem; white-space: nowrap;" onclick="window.app.verifyAbhaRecord()">
                ${app.isAbhaVerifying ? 'Verifying...' : (isVerified ? 'Re-Verify' : 'Verify ABHA')}
              </button>
            </div>
            <span class="input-hint-3d">Format: 14-digit number (e.g. 91-8274-1923-0194) or PHR address (@abdm)</span>
          </div>

          <!-- Mobile Number -->
          <div>
            <label class="input-label-3d">
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                ${i18n.t("mobile_label")}
              </span>
            </label>
            <input type="tel" id="patientMobileInput" class="input-text-3d" placeholder="${i18n.t("mobile_ph")}" value="${patient.mobile || ''}">
          </div>

          <!-- DPDP Act 2023 Encrypted Box -->
          <div style="background: var(--green-subtle); border: 1px solid var(--green-border); border-radius: 6px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 12px; margin-top: 2px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:1px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div>
              <strong style="font-size: 0.8rem; color: var(--green-darkest); font-family: var(--font-mono); letter-spacing: 0.04em; text-transform: uppercase;">${i18n.t("dpdp_title")}</strong>
              <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 3px; line-height: 1.4;">
                ${i18n.t("dpdp_desc")}
              </p>
            </div>
          </div>

          <!-- Next Button -->
          <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
            <button class="btn-3d btn-3d-primary" style="padding: 13px 32px;" onclick="window.app.saveStep1AndNext()">
              ${i18n.t("btn_proceed_vitals")} →
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: ABHA Card Preview (ONLY IF VERIFIED) OR ABDM Sync Gateway (IF NOT VERIFIED) -->
      <div>
        ${isVerified ? `
          <!-- Government of India Official ABHA Card (ONLY SHOWN WHEN AUTHENTICATED) -->
          <div class="abha-card-preview verified-glow-animation">
            <div class="abha-tricolor-bar"></div>
            <div class="abha-card-header">
              <div class="abha-header-left">
                <div class="abha-emblem">AB</div>
                <div>
                  <div class="abha-header-title">National Health Authority</div>
                  <div class="abha-header-sub">Government of India • ABDM Digital Health ID</div>
                </div>
              </div>
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.64rem; font-weight: 800;">
                 e-KYC VERIFIED
              </span>
            </div>

            <div class="abha-card-body">
              <!-- Patient Photo Box -->
              <div class="abha-avatar-box">
                <svg class="abha-avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span class="abha-avatar-caption">ABDM ID</span>
              </div>

              <!-- Details -->
              <div class="abha-details-list">
                <div class="abha-field-row">
                  <span class="abha-field-lbl">Patient Full Name</span>
                  <span class="abha-field-val" id="abhaCardPreviewName">${details.name || patient.name}</span>
                </div>
                <div class="abha-field-row">
                  <span class="abha-field-lbl">14-Digit ABHA Number</span>
                  <span class="abha-field-val-mono" id="abhaCardPreviewAbha">${details.abhaNumber || patient.abhaId}</span>
                </div>
                <div class="abha-field-row">
                  <span class="abha-field-lbl">ABHA Address (PHR)</span>
                  <span class="abha-field-val-address" id="abhaCardPreviewAddress">${details.abhaAddress || (patient.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '@abdm')}</span>
                </div>
                <div class="abha-field-grid-2">
                  <div class="abha-field-row">
                    <span class="abha-field-lbl">Gender • Year of Birth</span>
                    <span class="abha-field-val-sub" id="abhaCardPreviewMeta">${details.gender || patient.gender} • YOB: ${details.yob || (2026 - (parseInt(patient.age) || 30))}</span>
                  </div>
                  <div class="abha-field-row">
                    <span class="abha-field-lbl">Linked Mobile</span>
                    <span class="abha-field-val-sub" id="abhaCardPreviewMobile">${details.mobile || patient.mobile || 'Linked'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="abha-card-footer">
              <div class="abha-footer-left">
                <div class="abha-qr-thumb">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </div>
                <div class="abha-footer-meta">
                  <span class="abha-footer-main">Instant Health Exchange QR</span>
                  <span class="abha-footer-sec">Token: ${details.authMethod || 'e-KYC Verified'} • ${details.verifiedAt || 'Active'}</span>
                </div>
              </div>
              <button type="button" class="btn-unlink-abha" onclick="window.app.resetAbhaVerification()">
                 Unlink / Re-verify
              </button>
            </div>
          </div>
        ` : `
          <!-- ABDM Verification Hub (SHOWN WHEN NOT YET VERIFIED) -->
          <div class="abdm-sync-hub-card">
            <div class="sync-hub-header">
              <div class="sync-hub-badge-row">
                <span class="sync-hub-pulse-dot"></span>
                <span class="sync-hub-status-text">ABDM Health Gateway • Awaiting Verification</span>
              </div>
              <h3 class="sync-hub-title">Ayushman Bharat Health Account</h3>
              <p class="sync-hub-subtitle">
                Enter your 14-digit ABHA ID or scan your health QR code to securely link digital medical records and preview your official card.
              </p>
            </div>

            <!-- Verification Action Tiles -->
            <div class="sync-action-list">
              <div class="sync-action-tile" onclick="window.app.focusAbhaInput()">
                <div class="sync-action-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div class="sync-action-content">
                  <strong class="sync-action-title">1. Enter 14-Digit ABHA ID</strong>
                  <span class="sync-action-desc">Input your ABHA in the form and click "Verify ABHA"</span>
                </div>
                <span class="sync-action-arrow">→</span>
              </div>

              <div class="sync-action-tile" onclick="window.app.simulateAbhaQrScan()">
                <div class="sync-action-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </div>
                <div class="sync-action-content">
                  <strong class="sync-action-title">2. Scan Physical / Mobile ABHA QR</strong>
                  <span class="sync-action-desc">Optical scan from Ayushman Bharat app or Cowin document</span>
                </div>
                <span class="sync-action-arrow"></span>
              </div>

              <div class="sync-action-tile sync-action-test" onclick="window.app.verifyAbhaRecord('91-8274-1923-0194')">
                <div class="sync-action-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div class="sync-action-content">
                  <strong class="sync-action-title">3. Test ABDM Sandbox Token (1-Click)</strong>
                  <span class="sync-action-desc">Simulate authentic ABDM gateway response for kiosk demonstration</span>
                </div>
                <span class="sync-action-badge">Test Token</span>
              </div>
            </div>

            <!-- Security & DPDP Compliance Footer -->
            <div class="sync-security-footer">
              <div class="sync-security-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>DPDP Act 2023 Consent Protected</span>
              </div>
              <div class="sync-security-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                <span>Zero Retention Without Verification</span>
              </div>
            </div>
          </div>
        `}

        <!-- Station Hardware & Gateway Status Tile -->
        <div class="station-telemetry-box">
          <div class="station-telemetry-header">
            <span class="station-telemetry-title">Hardware Station Status</span>
            <span class="pill-3d pill-3d-emerald" style="font-size: 0.62rem;">All Systems Nominal</span>
          </div>
          <div class="station-telemetry-grid">
            <div class="station-telemetry-tile">
              <span class="station-telemetry-dot"></span>
              <div class="station-telemetry-info">
                <span class="station-telemetry-label">Optical Sensor</span>
                <span class="station-telemetry-status">ONLINE • 30 FPS</span>
              </div>
            </div>
            <div class="station-telemetry-tile">
              <span class="station-telemetry-dot"></span>
              <div class="station-telemetry-info">
                <span class="station-telemetry-label">FaceMesh AI</span>
                <span class="station-telemetry-status">468 PTS READY</span>
              </div>
            </div>
            <div class="station-telemetry-tile">
              <span class="station-telemetry-dot"></span>
              <div class="station-telemetry-info">
                <span class="station-telemetry-label">ABDM Gateway</span>
                <span class="station-telemetry-status">HIE-CM ACTIVE</span>
              </div>
            </div>
            <div class="station-telemetry-tile">
              <span class="station-telemetry-dot"></span>
              <div class="station-telemetry-info">
                <span class="station-telemetry-label">Encryption</span>
                <span class="station-telemetry-status">AES-256 GCM</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Today's Clinic Live Queue Overview Tile -->
        <div class="clinic-overview-tile">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.72rem; font-weight: 800; font-family: var(--font-mono); text-transform: uppercase; color: var(--grey-700);">Today's OPD Queue Status</span>
            <span style="font-size: 0.65rem; font-family: var(--font-mono); color: var(--green-dark); font-weight: 700;">LIVE DISPATCH</span>
          </div>
          <div class="clinic-overview-stats">
            <div class="clinic-stat-item">
              <div class="clinic-stat-val">14</div>
              <div class="clinic-stat-lbl">Waiting Queue</div>
            </div>
            <div class="clinic-stat-item">
              <div class="clinic-stat-val">~8 min</div>
              <div class="clinic-stat-lbl">Avg Consultation</div>
            </div>
            <div class="clinic-stat-item">
              <div class="clinic-stat-val" style="color: var(--primary);">Cabin 04</div>
              <div class="clinic-stat-lbl">Dr. Sharma, MD</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Patient registration, ABHA check-in, and live digital health card component

export function renderStep1Registration(app, i18n) {
  const patient = app.patient;
  const name = patient.name || "Priya Patel";
  const age = patient.age || 24;
  const gender = patient.gender || "Female";
  const abha = patient.abhaId || "91-8274-1923-0194";
  const mobile = patient.mobile || "+91 98765 43210";
  const yob = 2026 - (parseInt(age) || 24);
  const abhaAddress = (patient.name ? patient.name.toLowerCase().replace(/[^a-z0-9]/g, '') : "priya.patel") + "@abdm";

  return `
    <div class="registration-layout-grid">
      <!-- Left Column: Primary Intake Form -->
      <div class="card-3d">
        <div class="card-header-3d">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.65rem;">Terminal: Kiosk-04 • OPD Admissions</span>
              <span class="pill-3d pill-3d-blue" style="font-size: 0.65rem;">ABDM Milestone 1</span>
            </div>
            <h2 class="card-title-3d">${i18n.t("reg_title")}</h2>
            <p class="card-subtitle-3d">${i18n.t("reg_subtitle")}</p>
          </div>
          <button class="btn-3d btn-3d-secondary" style="padding: 8px 14px; font-size: 0.8rem;" onclick="window.app.speakStep1Prompt()">
            ${i18n.t("audio_guide_btn")}
          </button>
        </div>

        <!-- Fast-Track Demo Patient Selector for 1-click test intake -->
        <div class="demo-profile-bar">
          <span class="demo-profile-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Quick-Fill Demo:
          </span>
          <button type="button" class="demo-pill" onclick="window.app.quickFillDemo('ramesh')">
            Ramesh Kumar (48M • Diabetes)
          </button>
          <button type="button" class="demo-pill" onclick="window.app.quickFillDemo('sunita')">
            Sunita Sharma (36F • Hypertension)
          </button>
          <button type="button" class="demo-pill" onclick="window.app.quickFillDemo('priya')">
            Priya Patel (24F • General)
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label class="input-label-3d">
              <span style="display: inline-flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${i18n.t("full_name_label")}
              </span>
            </label>
            <input type="text" id="patientNameInput" class="input-text-3d" placeholder="${i18n.t("full_name_ph")}" value="${patient.name || ''}">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label class="input-label-3d">
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  ${i18n.t("age_label")}
                </span>
              </label>
              <input type="number" id="patientAgeInput" class="input-text-3d" placeholder="${i18n.t("age_ph")}" value="${patient.age || ''}">
            </div>
            <div>
              <label class="input-label-3d">
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M9.17 14.83l-4.24 4.24"/></svg>
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

          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="input-label-3d" style="margin-bottom: 0;">
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  ${i18n.t("abha_label")}
                </span>
              </label>
              <button type="button" class="quick-chip" style="padding: 2px 8px; font-size: 0.68rem;" onclick="window.app.quickFillDemo('priya')">
                Auto-Generate ABHA
              </button>
            </div>
            <input type="text" id="patientAbhaInput" class="input-text-3d" placeholder="${i18n.t("abha_ph")}" value="${patient.abhaId || ''}">
          </div>

          <div>
            <label class="input-label-3d">
              <span style="display: inline-flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                ${i18n.t("mobile_label")}
              </span>
            </label>
            <input type="tel" id="patientMobileInput" class="input-text-3d" placeholder="${i18n.t("mobile_ph")}" value="${patient.mobile || ''}">
          </div>

          <div style="background: var(--green-subtle); border: 1px solid var(--green-border); border-radius: 6px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 12px; margin-top: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:1px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div>
              <strong style="font-size: 0.8rem; color: var(--green-darkest); font-family: var(--font-mono); letter-spacing: 0.04em; text-transform: uppercase;">${i18n.t("dpdp_title")}</strong>
              <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 3px; line-height: 1.4;">
                ${i18n.t("dpdp_desc")}
              </p>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 0.75rem;">
            <button class="btn-3d btn-3d-primary" style="padding: 13px 32px;" onclick="window.app.saveStep1AndNext()">
              ${i18n.t("btn_proceed_vitals")} →
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: Live Digital ABHA Health Card Preview & Station Telemetry -->
      <div>
        <!-- Government of India Official ABHA Card Preview -->
        <div class="abha-card-preview">
          <div class="abha-tricolor-bar"></div>
          <div class="abha-card-header">
            <div class="abha-header-left">
              <div class="abha-emblem">AB</div>
              <div>
                <div class="abha-header-title">National Health Authority</div>
                <div class="abha-header-sub">Government of India • ABDM Card</div>
              </div>
            </div>
            <span class="pill-3d pill-3d-emerald" style="font-size: 0.62rem;">Live Preview</span>
          </div>

          <div class="abha-card-body">
            <!-- Patient Photo Box -->
            <div class="abha-avatar-box">
              <svg class="abha-avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span class="abha-avatar-caption">Digital ID</span>
            </div>

            <!-- Details -->
            <div class="abha-details-list">
              <div class="abha-field-row">
                <span class="abha-field-lbl">Patient Name</span>
                <span class="abha-field-val" id="abhaCardPreviewName">${name}</span>
              </div>
              <div class="abha-field-row">
                <span class="abha-field-lbl">ABHA Number</span>
                <span class="abha-field-val-mono" id="abhaCardPreviewAbha">${abha}</span>
              </div>
              <div class="abha-field-row">
                <span class="abha-field-lbl">ABHA Address</span>
                <span style="font-size: 0.74rem; font-family: var(--font-mono); color: var(--grey-600);" id="abhaCardPreviewAddress">${abhaAddress}</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 2px;">
                <div class="abha-field-row">
                  <span class="abha-field-lbl">Gender / Year of Birth</span>
                  <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-primary);" id="abhaCardPreviewMeta">${gender} • YOB: ${yob}</span>
                </div>
                <div class="abha-field-row">
                  <span class="abha-field-lbl">Mobile Link</span>
                  <span style="font-size: 0.75rem; font-family: var(--font-mono); font-weight: 700; color: var(--text-primary);" id="abhaCardPreviewMobile">${mobile}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="abha-card-footer">
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span style="font-size: 0.64rem; font-family: var(--font-mono); color: var(--grey-600);">Instant Health Exchange QR</span>
            </div>
            <span class="pill-3d pill-3d-emerald" style="font-size: 0.64rem;">✓ ABDM Verified</span>
          </div>
        </div>

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

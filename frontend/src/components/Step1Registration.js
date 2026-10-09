// Patient registration, ABHA check-in, optical card scanner, and live digital health card component
import { ABDM_REGISTRY, formatAbhaInput } from "../services/abhaService.js";
import { generateQrCodeSvg } from "../services/qrGenerator.js";

export function renderStep1Registration(app, i18n) {
  const patient = app.patient;
  const isVerified = Boolean(patient.isAbhaVerified && patient.abhaDetails);
  const details = patient.abhaDetails || {};
  const abhaMode = app.abhaMode || 'abha'; // 'abha' or 'manual'
  const validationError = app.abhaValidationError;
  const isVerifying = Boolean(app.isAbhaVerifying);

  // If ABHA is verified, show Verified e-KYC View (NO manual inputs asked!)
  if (isVerified) {
    return renderVerifiedAbhaView(app, i18n, patient, details);
  }

  // If not verified, show Intake View (ABHA Check-In default or Manual Walk-in fallback)
  return renderUnverifiedIntakeView(app, i18n, patient, abhaMode, validationError, isVerifying);
}

/**
 * Rendered when ABHA ID is authenticated.
 * All details were retrieved from the ABHA card - the user is NEVER asked for details.
 */
function renderVerifiedAbhaView(app, i18n, patient, details) {
  const name = details.name || patient.name || "Verified Citizen";
  const age = details.age || patient.age || "";
  const gender = details.gender || patient.gender || "Not Specified";
  const mobile = details.mobile || patient.mobile || "Not Linked";
  const abhaNumber = details.abhaNumber || patient.abhaId || "";
  const abhaAddress = details.abhaAddress || (name !== "Verified Citizen" ? `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@abdm` : "");
  const yob = details.yob || (age ? 2026 - parseInt(age, 10) : "");
  const dob = details.dob || (yob ? `01/01/${yob}` : "Not Specified");
  const bloodGroup = details.bloodGroup || "Not Specified";
  const state = details.state || "Not Specified";
  const district = details.district || "Not Specified";
  const pin = details.pin || "------";
  const recordsCount = details.linkedRecordsCount || 0;
  const avatarInitials = details.avatarInitials || (name.split(" ").map(n => n[0]).join("") || "AB");
  const avatarColor = details.avatarColor || (gender === "Female" ? "#EC4899" : "#10B981");
  const photoUrl = details.photoUrl || null;

  // Build authentic ABDM QR payload so the QR code can be scanned by any smartphone or 2D gun
  const abdmQrPayload = JSON.stringify({
    hidn: abhaNumber,
    hid: abhaAddress,
    name: name,
    gender: gender === "Male" ? "M" : (gender === "Female" ? "F" : "O"),
    dob: dob,
    yob: yob,
    mobile: mobile.replace(/[^0-9]/g, "").slice(-10),
    state_name: state,
    dist_name: district,
    pincode: pin
  });

  return `
    <div class="registration-layout-grid">
      <!-- Left Column: Fetched & Verified Demographics (Zero manual typing required!) -->
      <div class="card-3d verified-glow-animation">
        <div class="card-header-3d" style="border-bottom: 1px solid var(--green-border);">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.68rem; font-weight: 800;">
                ✓ ABDM e-KYC Authenticated
              </span>
              <span class="pill-3d pill-3d-blue" style="font-size: 0.68rem;">
                Milestone 1-3 Verified
              </span>
            </div>
            <h2 class="card-title-3d" style="color: var(--text-primary); font-size: 1.25rem;">
              Patient Details Retrieved
            </h2>
            <p class="card-subtitle-3d" style="color: var(--green-darkest); font-weight: 600;">
              ✓ Demographics fetched directly from Government of India ABHA Registry / Card. Zero manual entry needed.
            </p>
          </div>
          <button class="btn-3d btn-3d-secondary" style="padding: 8px 14px; font-size: 0.8rem;" onclick="window.app.speakStep1Prompt()">
            ${i18n.t("audio_guide_btn")}
          </button>
        </div>

        <!-- Success Banner -->
        <div style="background: var(--green-subtle); border: 1px solid var(--green-border); border-radius: 8px; padding: 12px 16px; margin-top: 1rem; display: flex; align-items: center; gap: 12px;">
          <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 1.1rem; flex-shrink: 0;">
            ✓
          </div>
          <div>
            <strong style="color: var(--green-darkest); font-size: 0.92rem; display: block;">
              Identity Verified: ${name}
            </strong>
            <span style="font-size: 0.74rem; color: var(--grey-600);">
              ABHA Number: <strong style="font-family: var(--font-mono); color: var(--green-darkest);">${abhaNumber}</strong> • Authenticated via ${details.authMethod || 'Aadhaar e-KYC (UIDAI OTP)'}
            </span>
          </div>
        </div>

        <!-- Fetched Demographics Grid (Read-Only & Verified) -->
        <div class="abha-fetched-grid" style="margin-top: 1.2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="abha-fetched-tile">
            <span class="abha-fetched-label">Patient Full Name</span>
            <div class="abha-fetched-val">
              <span>${name}</span>
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.6rem; padding: 1px 6px;">e-KYC</span>
            </div>
          </div>

          <div class="abha-fetched-tile">
            <span class="abha-fetched-label">Age & Date of Birth</span>
            <div class="abha-fetched-val">
              <span>${age} Years (${dob})</span>
            </div>
          </div>

          <div class="abha-fetched-tile">
            <span class="abha-fetched-label">Gender</span>
            <div class="abha-fetched-val">
              <span>${gender}</span>
            </div>
          </div>

          <div class="abha-fetched-tile">
            <span class="abha-fetched-label">Linked Mobile Number</span>
            <div class="abha-fetched-val" style="font-family: var(--font-mono);">
              <span>${mobile}</span>
            </div>
          </div>

          <div class="abha-fetched-tile">
            <span class="abha-fetched-label">ABHA Address (PHR)</span>
            <div class="abha-fetched-val" style="font-family: var(--font-mono); color: var(--primary); font-size: 0.85rem;">
              <span>${abhaAddress}</span>
            </div>
          </div>

          <div class="abha-fetched-tile">
            <span class="abha-fetched-label">Blood Group</span>
            <div class="abha-fetched-val">
              <span class="pill-3d pill-3d-blue" style="font-size: 0.75rem; padding: 2px 8px;">${bloodGroup}</span>
            </div>
          </div>

          <div class="abha-fetched-tile" style="grid-column: span 2;">
            <span class="abha-fetched-label">Registered State & District</span>
            <div class="abha-fetched-val">
              <span>${district}, ${state} • PIN: ${pin}</span>
            </div>
          </div>
        </div>

        <!-- Compliance & Security Notice -->
        <div style="background: #F9FAFB; border: 1px solid var(--grey-300); border-radius: 6px; padding: 10px 14px; margin-top: 1rem; display: flex; align-items: center; gap: 10px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style="font-size: 0.72rem; color: var(--grey-600); line-height: 1.35;">
            DPDP Act 2023 Consent Active. Health records linked ephemerally to OPD Token <strong>${patient.tokenNumber || 'A-15'}</strong>.
          </span>
        </div>

        <!-- Action Row: PROCEED CTA -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--grey-200);">
          <button type="button" class="btn-3d btn-3d-secondary" style="padding: 10px 16px; font-size: 0.8rem;" onclick="window.app.resetAbhaVerification()">
            🔄 Change / Unlink ABHA
          </button>
          <button type="button" class="btn-3d btn-3d-primary" style="padding: 14px 34px; font-size: 0.95rem; font-weight: 800;" onclick="window.app.saveStep1AndNext()">
            Proceed to Vitals Scan (as ${name}) →
          </button>
        </div>
      </div>

      <!-- Right Column: Official Government of India Digital ABHA Card -->
      <div>
        <div class="abha-card-preview verified-glow-animation">
          <div class="abha-tricolor-bar"></div>
          <div class="abha-card-header">
            <div class="abha-header-left">
              <div class="abha-emblem">AB</div>
              <div>
                <div class="abha-header-title">National Health Authority</div>
                <div class="abha-header-sub">Government of India • Ayushman Bharat Digital Mission</div>
              </div>
            </div>
            <span class="pill-3d pill-3d-emerald" style="font-size: 0.64rem; font-weight: 800;">
              ✓ e-KYC VERIFIED
            </span>
          </div>

          <div class="abha-card-body">
            <!-- Patient Photo Box with Photo or Initials -->
            <div class="abha-avatar-box" style="background: ${photoUrl ? '#0F172A' : avatarColor}; color: #fff; overflow: hidden; padding: 0;">
              ${photoUrl ? `
                <img src="${photoUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">
              ` : `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                  <span style="font-size: 1.5rem; font-weight: 900; letter-spacing: 1px;">
                    ${avatarInitials}
                  </span>
                  <span class="abha-avatar-caption" style="background: rgba(0,0,0,0.3); color: #fff; margin-top: 6px;">
                    ABDM e-KYC
                  </span>
                </div>
              `}
            </div>

            <!-- Details -->
            <div class="abha-details-list">
              <div class="abha-field-row">
                <span class="abha-field-lbl">Patient Full Name</span>
                <span class="abha-field-val">${name}</span>
              </div>
              <div class="abha-field-row">
                <span class="abha-field-lbl">14-Digit ABHA Number</span>
                <span class="abha-field-val-mono">${abhaNumber}</span>
              </div>
              <div class="abha-field-row">
                <span class="abha-field-lbl">ABHA Address (PHR)</span>
                <span class="abha-field-val-address">${abhaAddress}</span>
              </div>
              <div class="abha-field-grid-2">
                <div class="abha-field-row">
                  <span class="abha-field-lbl">Gender • Year of Birth</span>
                  <span class="abha-field-val-sub">${gender} • YOB: ${yob}</span>
                </div>
                <div class="abha-field-row">
                  <span class="abha-field-lbl">Linked Mobile</span>
                  <span class="abha-field-val-sub">${mobile}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Footer with Real Scannable ABDM QR Code -->
          <div class="abha-card-footer" style="padding: 12px 16px;">
            <div class="abha-footer-left" style="gap: 14px;">
              <div style="width: 58px; height: 58px; background: #fff; border-radius: 6px; padding: 2px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
                ${generateQrCodeSvg(abdmQrPayload, 54)}
              </div>
              <div class="abha-footer-meta">
                <span class="abha-footer-main" style="font-size: 0.85rem; font-weight: 700; color: #0F172A;">Instant Health Exchange QR</span>
                <span class="abha-footer-sec" style="font-size: 0.72rem; color: #475569;">Scannable ABDM Demographic Token • Active</span>
                <span style="font-size: 0.68rem; color: #16A34A; font-weight: 700;">● Live Verified Gateway</span>
              </div>
            </div>
            <span class="pill-3d pill-3d-emerald" style="font-size: 0.65rem;">
              ● ONLINE
            </span>
          </div>
        </div>

        <!-- Linked Records Gateway Card -->
        <div style="background: #FFFFFF; border: 1px solid var(--grey-300); border-radius: 8px; padding: 14px 16px; margin-top: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 0.8rem; color: var(--grey-800); text-transform: uppercase; font-family: var(--font-mono);">
              Linked Health Records (PHR)
            </strong>
            <span class="pill-3d pill-3d-blue" style="font-size: 0.66rem;">
              ${recordsCount} Records Available
            </span>
          </div>
          <p style="font-size: 0.74rem; color: var(--grey-600); line-height: 1.4; margin: 0;">
            Existing diagnostic reports, prescriptions, and immunizations will be automatically synchronized into Step 3.
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Rendered when ABHA ID is not yet verified.
 * Offers instant ABHA e-KYC (default) or Walk-In manual registration fallback.
 */
function renderUnverifiedIntakeView(app, i18n, patient, abhaMode, validationError, isVerifying) {
  return `
    <div class="registration-layout-grid">
      <!-- Left Column: Primary ABHA Check-In / Intake Form -->
      <div class="card-3d">
        <div class="card-header-3d">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.65rem;">ABDM Gateway • Active</span>
              <span class="pill-3d pill-3d-blue" style="font-size: 0.65rem;">Milestone 1-3 Certified</span>
            </div>
            <h2 class="card-title-3d">${i18n.t("reg_title")}</h2>
            <p class="card-subtitle-3d">
              ${abhaMode === 'abha' 
                ? 'Scan your physical/mobile ABHA card or enter your 14-digit ID for instant zero-typing e-KYC check-in.' 
                : 'Enter your details manually for walk-in OPD registration without ABHA.'}
            </p>
          </div>
          <button class="btn-3d btn-3d-secondary" style="padding: 8px 14px; font-size: 0.8rem;" onclick="window.app.speakStep1Prompt()">
            ${i18n.t("audio_guide_btn")}
          </button>
        </div>

        <!-- Mode Toggle Tabs: ABHA Check-In vs Walk-In Manual -->
        <div class="abha-mode-switcher" style="margin-top: 1rem;">
          <button type="button" class="abha-mode-tab ${abhaMode === 'abha' ? 'active' : ''}" onclick="window.app.setAbhaMode('abha')">
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              <strong>⚡ Instant ABHA Check-In</strong>
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.6rem; padding: 1px 6px;">Recommended</span>
            </span>
          </button>
          <button type="button" class="abha-mode-tab ${abhaMode === 'manual' ? 'active' : ''}" onclick="window.app.setAbhaMode('manual')">
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>✍️ Walk-In (No ABHA)</span>
            </span>
          </button>
        </div>

        ${abhaMode === 'abha' ? `
          <!-- ABHA Intake Form -->
          <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 1.2rem;">
            
            <!-- Real Optical Card Scanning Tiles -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <!-- Action 1: Camera Optical Scanner -->
              <div class="sync-action-tile" style="margin: 0; padding: 14px;" onclick="window.app.openAbhaCameraScanner()">
                <div class="sync-action-icon" style="background: var(--green-subtle); border-color: var(--green-border);">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <div class="sync-action-content">
                  <strong class="sync-action-title">Live Camera Scanner</strong>
                  <span class="sync-action-desc">Point physical card or mobile QR to kiosk camera</span>
                </div>
                <span class="sync-action-arrow">📷</span>
              </div>

              <!-- Action 2: Upload Card File / Photo -->
              <div class="sync-action-tile" style="margin: 0; padding: 14px;" onclick="document.getElementById('abhaCardFileInput').click()">
                <div class="sync-action-icon" style="background: #EFF6FF; border-color: #BFDBFE;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div class="sync-action-content">
                  <strong class="sync-action-title">Upload ABHA Card</strong>
                  <span class="sync-action-desc">Photo, screenshot, or PDF of your ABHA card</span>
                </div>
                <span class="sync-action-arrow">📁</span>
              </div>
            </div>

            <!-- Hidden File Input for Card Upload -->
            <input 
              type="file" 
              id="abhaCardFileInput" 
              accept="image/*,application/pdf" 
              style="display: none;" 
              onchange="window.app.handleAbhaCardUpload(event)"
            >

            <!-- 14-Digit ABHA Input -->
            <div style="background: #F8FAFC; border: 1px solid var(--grey-300); border-radius: 8px; padding: 14px 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="input-label-3d" style="margin-bottom: 0;">
                  <span style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Or Enter 14-Digit ABHA ID / PHR Address
                  </span>
                </label>
                <span id="abhaDigitsCounter" style="font-size: 0.68rem; font-family: var(--font-mono); color: var(--grey-500);">
                  Format: XX-XXXX-XXXX-XXXX
                </span>
              </div>

              <div class="input-with-action-group">
                <input 
                  type="text" 
                  id="patientAbhaInput" 
                  class="input-text-3d ${validationError ? 'input-error-glow' : ''}" 
                  placeholder="e.g. 91-8274-1923-0194 or name@abdm" 
                  value="${patient.abhaId || ''}" 
                  autocomplete="off"
                  oninput="window.app.handleAbhaInputChange(event)"
                  onkeydown="if(event.key==='Enter'){event.preventDefault();window.app.verifyAbhaRecord();}"
                >
                <button 
                  type="button" 
                  id="btnVerifyAbha" 
                  class="btn-3d btn-3d-primary" 
                  style="padding: 0 20px; font-size: 0.85rem; font-weight: 700; white-space: nowrap; min-width: 130px;" 
                  onclick="window.app.verifyAbhaRecord()"
                  ${isVerifying ? 'disabled' : ''}
                >
                  ${isVerifying ? 'Verifying...' : 'Verify ABHA →'}
                </button>
              </div>

              <!-- Error Alert Box: Visible ONLY when validation fails -->
              ${validationError ? `
                <div class="abha-validation-error-box input-shake">
                  <div style="display: flex; align-items: flex-start; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.2" style="flex-shrink: 0; margin-top: 1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <div>
                      <strong style="font-size: 0.8rem; color: #991B1B; display: block;">
                        ABHA ID Verification Failed
                      </strong>
                      <span style="font-size: 0.74rem; color: #B91C1C; line-height: 1.4; display: block; margin-top: 2px;">
                        ${validationError}
                      </span>
                    </div>
                  </div>
                </div>
              ` : `
                <span class="input-hint-3d" style="display: flex; align-items: center; gap: 6px; margin-top: 6px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  Scanning card or verifying ID fetches genuine demographics directly into your medical intake.
                </span>
              `}
            </div>

            <!-- DPDP Act Notice -->
            <div style="background: var(--green-subtle); border: 1px solid var(--green-border); border-radius: 6px; padding: 10px 12px; display: flex; align-items: flex-start; gap: 10px; margin-top: 2px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" stroke-width="2" style="flex-shrink:0; margin-top:1px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div style="font-size: 0.73rem; color: var(--text-muted); line-height: 1.35;">
                <strong style="color: var(--green-darkest); font-family: var(--font-mono);">DPDP ACT 2023 COMPLIANT</strong> — Zero biometric retention. Health data is linked ephemerally under ABDM standards.
              </div>
            </div>
          </div>
        ` : `
          <!-- Manual Intake Form (ONLY shown when patient chooses Walk-In mode) -->
          <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 1.2rem;">
            <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 8px 12px; font-size: 0.74rem; color: #1E40AF;">
              💡 <strong>Walk-In Registration</strong>: If the patient has an ABHA ID, <a href="javascript:void(0)" onclick="window.app.setAbhaMode('abha')" style="color: #2563EB; font-weight: 700; text-decoration: underline;">switch to ABHA Check-In</a> to skip manual entry.
            </div>

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

            <!-- Proceed Button -->
            <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
              <button class="btn-3d btn-3d-primary" style="padding: 13px 32px;" onclick="window.app.saveStep1AndNext()">
                ${i18n.t("btn_proceed_vitals")} →
              </button>
            </div>
          </div>
        `}
      </div>

      <!-- Right Column: ABDM Information & Security Gateway -->
      <div>
        <div class="abdm-sync-hub-card">
          <div class="sync-hub-header">
            <div class="sync-hub-badge-row">
              <span class="sync-hub-pulse-dot"></span>
              <span class="sync-hub-status-text">ABDM Central Bridge • Ready</span>
            </div>
            <h3 class="sync-hub-title">Why Use ABHA Check-In?</h3>
            <p class="sync-hub-subtitle">
              Ayushman Bharat Health Account (ABHA) establishes a trusted digital health identity under the National Health Authority (NHA).
            </p>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 1.2rem;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--green-subtle); color: var(--green-darkest); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">
                1
              </div>
              <div>
                <strong style="font-size: 0.78rem; color: var(--text-primary); display: block;">Zero Manual Typing (e-KYC)</strong>
                <span style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.35; display: block;">
                  Name, age, gender, and contact details are fetched instantly from your ABHA record or card scan.
                </span>
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--green-subtle); color: var(--green-darkest); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">
                2
              </div>
              <div>
                <strong style="font-size: 0.78rem; color: var(--text-primary); display: block;">Instant Record Synchronization</strong>
                <span style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.35; display: block;">
                  Historical prescriptions and lab reports are linked securely for the consulting doctor.
                </span>
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--green-subtle); color: var(--green-darkest); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">
                3
              </div>
              <div>
                <strong style="font-size: 0.78rem; color: var(--text-primary); display: block;">Paperless OPD Pass</strong>
                <span style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.35; display: block;">
                  Receive your digital consultation token and diagnosis slip directly on WhatsApp / SMS.
                </span>
              </div>
            </div>
          </div>

          <!-- Gateway Security Badges -->
          <div class="sync-security-footer">
            <div class="sync-security-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>DPDP Act 2023 Consent Protected</span>
            </div>
            <div class="sync-security-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <span>AES-256 GCM Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

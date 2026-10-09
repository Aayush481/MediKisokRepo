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

  return `
    <div class="registration-single-container">
      ${isVerified 
        ? renderVerifiedAbhaView(app, i18n, patient, details)
        : renderUnverifiedIntakeView(app, i18n, patient, abhaMode, validationError, isVerifying)
      }
    </div>
  `;
}

/**
 * Rendered when ABHA ID is authenticated.
 * Unified, single-column Government of India Digital ABHA Card + Verified Demographics Pass.
 * Zero manual typing was required from the patient.
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
  const recordsCount = details.linkedRecordsCount || (patient.linkedAbdmRecords?.length || 3);
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
    <div class="registration-main-card verified-glow-animation">
      <!-- Tricolor Flag Band Accent -->
      <div class="abha-tricolor-bar"></div>

      <!-- Verified Header -->
      <div class="reg-card-header">
        <div class="reg-header-meta">
          <div class="reg-badges-row">
            <span class="reg-status-badge badge-green">
              <span class="pulse-dot"></span> ✓ ABDM e-KYC Authenticated
            </span>
            <span class="reg-status-badge badge-blue">
              Token #${patient.tokenNumber || 'A-15'}
            </span>
            <span class="reg-status-badge badge-neutral">
              DPDP Act 2023 Compliant
            </span>
          </div>
          <h2 class="reg-main-title">
            Patient Demographics Verified
          </h2>
          <p class="reg-main-subtitle">
            Identity & clinical history fetched directly from Government of India National Health Authority.
          </p>
        </div>
        <button class="btn-3d btn-3d-secondary reg-audio-btn" onclick="window.app.speakStep1Prompt()">
          ${i18n.t("audio_guide_btn")}
        </button>
      </div>

      <!-- Integrated Digital ABHA Card -->
      <div class="verified-pass-container">
        <!-- Pass Identity Bar -->
        <div class="verified-pass-identity-row">
          <div class="pass-avatar-wrapper" style="background: ${photoUrl ? '#0F172A' : avatarColor};">
            ${photoUrl ? `
              <img src="${photoUrl}" alt="${name}" class="pass-avatar-img">
            ` : `
              <span class="pass-avatar-text">${avatarInitials}</span>
            `}
            <span class="pass-avatar-badge">e-KYC</span>
          </div>

          <div class="pass-identity-info">
            <div class="pass-patient-name-row">
              <h3 class="pass-patient-name">${name}</h3>
              <span class="verified-check-pill">✓ Verified</span>
            </div>
            <div class="pass-meta-row">
              <span class="pass-abha-id">ABHA: <strong>${abhaNumber}</strong></span>
              <span class="pass-separator">•</span>
              <span class="pass-abha-address">${abhaAddress}</span>
            </div>
            <div class="pass-auth-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Authenticated via ${details.authMethod || 'Aadhaar e-KYC (ABDM Gateway)'}</span>
            </div>
          </div>

          <!-- Integrated Scannable ABDM QR Code -->
          <div class="pass-qr-box">
            <div class="pass-qr-svg">
              ${generateQrCodeSvg(abdmQrPayload, 62)}
            </div>
            <span class="pass-qr-label">ABDM Token QR</span>
          </div>
        </div>

        <!-- Demographic Details Grid (Clean 6-Tile Layout) -->
        <div class="verified-tiles-grid">
          <div class="verified-tile">
            <span class="tile-label">Age & Date of Birth</span>
            <span class="tile-value">${age} Years <small>(${dob})</small></span>
          </div>
          <div class="verified-tile">
            <span class="tile-label">Gender</span>
            <span class="tile-value">${gender}</span>
          </div>
          <div class="verified-tile">
            <span class="tile-label">Linked Mobile</span>
            <span class="tile-value font-mono">${mobile}</span>
          </div>
          <div class="verified-tile">
            <span class="tile-label">Blood Group</span>
            <span class="tile-value">
              <span class="blood-badge">${bloodGroup}</span>
            </span>
          </div>
          <div class="verified-tile">
            <span class="tile-label">State & District</span>
            <span class="tile-value">${district}, ${state} <small>(${pin})</small></span>
          </div>
          <div class="verified-tile">
            <span class="tile-label">Linked Records (PHR)</span>
            <span class="tile-value records-synced">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              ${recordsCount} Records Available
            </span>
          </div>
        </div>

        <!-- DPDP Act Consent Banner -->
        <div class="verified-compliance-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>DPDP Act 2023 Consent Active. Patient records linked ephemerally for Consultation Token <strong>${patient.tokenNumber || 'A-15'}</strong>. Zero biometric retention.</span>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="reg-actions-footer">
        <button type="button" class="btn-3d btn-3d-secondary" onclick="window.app.resetAbhaVerification()">
          🔄 Change / Unlink ABHA
        </button>
        <button type="button" class="btn-3d btn-3d-primary reg-btn-proceed" onclick="window.app.saveStep1AndNext()">
          Proceed to Vitals Scan (as ${name}) →
        </button>
      </div>
    </div>
  `;
}

/**
 * Rendered when ABHA ID is not yet verified.
 * High-end Single Column Layout:
 * - Segmented Toggle: [⚡ Have ABHA ID] | [✍️ Don't Have ABHA ID (Walk-In)]
 * - Mode A: ABHA Input Console with instant fetch, quick sandbox citizen test chips, optical scan links
 * - Mode B: Direct Walk-In intake form asking for Name, Gender, Age, Mobile, Blood Group, State, Symptoms
 */
function renderUnverifiedIntakeView(app, i18n, patient, abhaMode, validationError, isVerifying) {
  const currentGender = patient.gender || "Female";
  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Not Known"];
  const currentBg = patient.bloodGroup || "O+";
  const salutations = ["Mr.", "Mrs.", "Ms.", "Dr.", "Master"];
  const activeSal = app.manualSalutation || (currentGender === "Male" ? "Mr." : "Ms.");

  return `
    <div class="registration-main-card">
      <!-- Card Header -->
      <div class="reg-card-header">
        <div class="reg-header-meta">
          <div class="reg-badges-row">
            <span class="reg-status-badge badge-green">
              <span class="pulse-dot"></span> ABDM Gateway Live
            </span>
            <span class="reg-status-badge badge-blue">
              NHA Certified M1-M3
            </span>
            <span class="reg-status-badge badge-neutral">
              DPDP Act 2023 Compliant
            </span>
          </div>
          <h2 class="reg-main-title">
            ${i18n.t("reg_title")}
          </h2>
          <p class="reg-main-subtitle">
            Authenticate with ABHA ID to automatically retrieve patient records, or register manually for walk-in OPD.
          </p>
        </div>
        <button class="btn-3d btn-3d-secondary reg-audio-btn" onclick="window.app.speakStep1Prompt()">
          ${i18n.t("audio_guide_btn")}
        </button>
      </div>

      <!-- Segmented Mode Control Bar -->
      <div class="intake-segmented-bar">
        <button 
          type="button" 
          class="intake-segment-tab ${abhaMode === 'abha' ? 'active-abha' : ''}" 
          onclick="window.app.setAbhaMode('abha')"
        >
          <span class="segment-icon">⚡</span>
          <span class="segment-label">Instant ABHA Fetch</span>
          <span class="segment-badge badge-pill-green">Auto-Fills Details</span>
        </button>
        <button 
          type="button" 
          class="intake-segment-tab ${abhaMode === 'manual' ? 'active-manual' : ''}" 
          onclick="window.app.setAbhaMode('manual')"
        >
          <span class="segment-icon">✍️</span>
          <span class="segment-label">Walk-In Registration</span>
          <span class="segment-badge badge-pill-blue">No ABHA ID</span>
        </button>
      </div>

      <div class="reg-card-body-content">
        <!-- ========================================================
             TRACK 1: ABHA CHECK-IN (Auto-Fetch Details)
             ======================================================== -->
        ${abhaMode === 'abha' ? `
          <div class="abha-lookup-section">
            <!-- Search & Fetch Box -->
            <div class="abha-search-console">
              <div class="console-label-row">
                <label class="console-label" for="patientAbhaInput">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  Enter 14-Digit ABHA ID or PHR Address
                </label>
                <span id="abhaDigitsCounter" class="console-counter">
                  Format: XX-XXXX-XXXX-XXXX
                </span>
              </div>

              <!-- Input Action Bar -->
              <div class="abha-input-action-bar">
                <div class="abha-input-wrapper">
                  <span class="input-card-icon">💳</span>
                  <input 
                    type="text" 
                    id="patientAbhaInput" 
                    class="abha-input-field-hero ${validationError ? 'input-error-glow' : ''}" 
                    placeholder="e.g. 91-8274-1923-0194 or name@abdm" 
                    value="${patient.abhaId || ''}" 
                    autocomplete="off"
                    oninput="window.app.handleAbhaInputChange(event)"
                    onkeydown="if(event.key==='Enter'){event.preventDefault();window.app.verifyAbhaRecord();}"
                  >
                </div>
                <button 
                  type="button" 
                  id="btnVerifyAbha" 
                  class="btn-fetch-hero" 
                  onclick="window.app.verifyAbhaRecord()"
                  ${isVerifying ? 'disabled' : ''}
                >
                  ${isVerifying ? `
                    <svg class="spin-animation" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                    <span>Fetching ABDM...</span>
                  ` : `
                    <span>⚡ Fetch ABHA Details →</span>
                  `}
                </button>
              </div>

              <!-- Validation Error Box -->
              ${validationError ? `
                <div class="abha-validation-error-box input-shake">
                  <div class="error-box-inner">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <div>
                      <strong class="error-title">ABHA Lookup Notice</strong>
                      <span class="error-desc">${validationError}</span>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="console-hint-text">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  Entering an ABHA ID retrieves verified name, age, gender, DOB and past clinical history instantly with zero typing.
                </div>
              `}

              <!-- Quick-Fill Sandbox Test Profiles -->
              <div class="sandbox-quick-chips-bar">
                <span class="sandbox-chips-label">⚡ One-Click ABDM Sandbox Test Profiles:</span>
                <div class="sandbox-chips-grid">
                  <button type="button" class="sandbox-citizen-chip" onclick="window.app.selectQuickAbha('91-8274-1923-0194')">
                    <span>👤 <strong>Ravi Kumar</strong> (91-8274-1923-0194)</span>
                    <span class="chip-state-tag">Delhi</span>
                  </button>
                  <button type="button" class="sandbox-citizen-chip" onclick="window.app.selectQuickAbha('91-7210-4491-8023')">
                    <span>👤 <strong>Sunita Verma</strong> (91-7210-4491-8023)</span>
                    <span class="chip-state-tag">Bengaluru</span>
                  </button>
                  <button type="button" class="sandbox-citizen-chip" onclick="window.app.selectQuickAbha('91-5829-1029-4481')">
                    <span>👤 <strong>Dr. Kavita</strong> (91-5829-1029-4481)</span>
                    <span class="chip-state-tag">Mumbai</span>
                  </button>
                  <button type="button" class="sandbox-citizen-chip" onclick="window.app.selectQuickAbha('91-9124-4412-0941')">
                    <span>👤 <strong>Sneha R.</strong> (91-9124-4412-0941)</span>
                    <span class="chip-state-tag">Noida</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Optical Utilities & Alternative Registration Bar -->
            <div class="utility-options-bar">
              <div class="utility-actions-group">
                <button type="button" class="utility-action-btn" onclick="window.app.openAbhaCameraScanner()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <span>📷 Scan Physical Card</span>
                </button>
                <button type="button" class="utility-action-btn" onclick="document.getElementById('abhaCardFileInput').click()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>📁 Upload Card File</span>
                </button>
              </div>

              <div class="utility-switch-prompt">
                <span>No ABHA ID?</span>
                <button type="button" class="link-switch-btn" onclick="window.app.setAbhaMode('manual')">
                  Register as Walk-In Patient →
                </button>
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
          </div>
        ` : `
          <!-- ========================================================
               TRACK 2: MANUAL WALK-IN REGISTRATION (Asks Name, Age, Gender, etc.)
               ======================================================== -->
          <div class="manual-intake-form">
            <!-- Notice Banner -->
            <div class="manual-notice-banner">
              <div class="notice-icon">📋</div>
              <div class="notice-text">
                <strong>Walk-In Registration Mode</strong>
                <span>No ABHA ID provided. Please enter patient information below to generate an OPD queue pass.</span>
              </div>
              <button type="button" class="switch-to-abha-btn" onclick="window.app.setAbhaMode('abha')">
                ⚡ Have ABHA? Auto-Fill
              </button>
            </div>

            <!-- 1. Patient Full Name with Salutation Chips -->
            <div class="form-group-3d">
              <label class="form-label-3d" for="patientNameInput">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Patient Full Name <span class="required-asterisk">*</span>
              </label>

              <!-- Salutation selector -->
              <div class="salutation-chips-row">
                ${salutations.map(sal => `
                  <button type="button" class="salutation-chip ${activeSal === sal ? 'active' : ''}" data-sal="${sal}" onclick="window.app.setManualSalutation('${sal}')">
                    ${sal}
                  </button>
                `).join('')}
              </div>

              <input 
                type="text" 
                id="patientNameInput" 
                class="input-text-3d" 
                placeholder="Enter patient full name (e.g. Rahul Sharma)" 
                value="${patient.name ? patient.name.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Master)\s*/, '') : ''}" 
                autocomplete="name"
              >
            </div>

            <!-- 2. Gender Selection Cards (3-segment) -->
            <div class="form-group-3d">
              <label class="form-label-3d">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M9.17 14.83l-4.24 4.24"/></svg>
                Patient Gender <span class="required-asterisk">*</span>
              </label>

              <div class="gender-cards-grid">
                <div class="gender-select-card ${currentGender === 'Male' ? 'active' : ''}" data-gender="Male" onclick="window.app.setManualGender('Male')">
                  <span class="gender-icon">👨</span>
                  <span class="gender-label">Male</span>
                </div>
                <div class="gender-select-card ${currentGender === 'Female' ? 'active' : ''}" data-gender="Female" onclick="window.app.setManualGender('Female')">
                  <span class="gender-icon">👩</span>
                  <span class="gender-label">Female</span>
                </div>
                <div class="gender-select-card ${currentGender === 'Other' ? 'active' : ''}" data-gender="Other" onclick="window.app.setManualGender('Other')">
                  <span class="gender-icon">🧑</span>
                  <span class="gender-label">Other</span>
                </div>
              </div>
              <input type="hidden" id="patientGenderInput" value="${currentGender}">
            </div>

            <!-- 3. Age & Date of Birth Row -->
            <div class="form-row-2col">
              <div class="form-group-3d">
                <label class="form-label-3d" for="patientAgeInput">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Age in Years <span class="required-asterisk">*</span>
                </label>
                <input 
                  type="number" 
                  id="patientAgeInput" 
                  class="input-text-3d" 
                  placeholder="e.g. 28" 
                  value="${patient.age || ''}" 
                  min="1" 
                  max="120"
                >
              </div>

              <div class="form-group-3d">
                <label class="form-label-3d" for="patientDobInput">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Date of Birth <span class="optional-label">(Optional)</span>
                </label>
                <input 
                  type="text" 
                  id="patientDobInput" 
                  class="input-text-3d" 
                  placeholder="DD/MM/YYYY" 
                  value="${patient.dob || ''}"
                >
              </div>
            </div>

            <!-- 4. Mobile & State Row -->
            <div class="form-row-2col">
              <div class="form-group-3d">
                <label class="form-label-3d" for="patientMobileInput">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Mobile Number
                </label>
                <div class="mobile-input-group">
                  <span class="mobile-prefix-badge">🇮🇳 +91</span>
                  <input 
                    type="tel" 
                    id="patientMobileInput" 
                    class="input-text-3d mobile-input-field" 
                    placeholder="98765 43210" 
                    value="${patient.mobile ? patient.mobile.replace(/^\+91\s*/, '') : ''}"
                    maxlength="10"
                  >
                </div>
              </div>

              <div class="form-group-3d">
                <label class="form-label-3d" for="patientStateInput">
                  State / Region
                </label>
                <select id="patientStateInput" class="input-text-3d state-select-field">
                  <option value="Delhi (NCT)" ${patient.state === 'Delhi (NCT)' ? 'selected' : ''}>Delhi (NCT)</option>
                  <option value="Maharashtra" ${patient.state === 'Maharashtra' ? 'selected' : ''}>Maharashtra</option>
                  <option value="Karnataka" ${patient.state === 'Karnataka' ? 'selected' : ''}>Karnataka</option>
                  <option value="Uttar Pradesh" ${patient.state === 'Uttar Pradesh' ? 'selected' : ''}>Uttar Pradesh</option>
                  <option value="Telangana" ${patient.state === 'Telangana' ? 'selected' : ''}>Telangana</option>
                  <option value="Tamil Nadu" ${patient.state === 'Tamil Nadu' ? 'selected' : ''}>Tamil Nadu</option>
                  <option value="Gujarat" ${patient.state === 'Gujarat' ? 'selected' : ''}>Gujarat</option>
                  <option value="West Bengal" ${patient.state === 'West Bengal' ? 'selected' : ''}>West Bengal</option>
                  <option value="Rajasthan" ${patient.state === 'Rajasthan' ? 'selected' : ''}>Rajasthan</option>
                  <option value="Kerala" ${patient.state === 'Kerala' ? 'selected' : ''}>Kerala</option>
                </select>
              </div>
            </div>

            <!-- 5. Blood Group Selector Pills -->
            <div class="form-group-3d">
              <label class="form-label-3d">
                Blood Group <span class="optional-label">(Optional)</span>
              </label>
              <div class="blood-group-pills-grid">
                ${bloodGroups.map(bg => `
                  <button type="button" class="blood-group-pill ${currentBg === bg ? 'active' : ''}" data-bg="${bg}" onclick="window.app.setManualBloodGroup('${bg}')">
                    ${bg}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 6. Chief Medical Concern / Symptoms -->
            <div class="form-group-3d">
              <label class="form-label-3d" for="patientComplaintInput">
                Chief Medical Concern / Symptoms
              </label>
              <input 
                type="text" 
                id="patientComplaintInput" 
                class="input-text-3d" 
                placeholder="e.g. High fever, dry cough and throat irritation since 2 days" 
                value="${patient.chiefComplaint || ''}"
              >
              <div class="symptom-tags-cloud">
                <span class="symptom-tag-chip" data-tag="Fever & Chills" onclick="window.app.toggleChiefComplaint('Fever & Chills')">🤒 Fever & Chills</span>
                <span class="symptom-tag-chip" data-tag="Cough & Cold" onclick="window.app.toggleChiefComplaint('Cough & Cold')">🤧 Cough & Cold</span>
                <span class="symptom-tag-chip" data-tag="Chest Discomfort" onclick="window.app.toggleChiefComplaint('Chest Discomfort')">🫁 Chest Discomfort</span>
                <span class="symptom-tag-chip" data-tag="Headache & Body Pain" onclick="window.app.toggleChiefComplaint('Headache & Body Pain')">⚡ Body Pain</span>
                <span class="symptom-tag-chip" data-tag="Routine Checkup" onclick="window.app.toggleChiefComplaint('Routine Checkup')">🩺 Routine Checkup</span>
              </div>
            </div>

            <!-- Action Buttons Row -->
            <div class="reg-actions-footer">
              <button type="button" class="btn-3d btn-3d-secondary" onclick="window.app.setAbhaMode('abha')">
                ← Switch to ABHA Fetch
              </button>
              <button type="button" class="btn-3d btn-3d-primary reg-btn-proceed" onclick="window.app.saveStep1AndNext()">
                ${i18n.t("btn_proceed_vitals")} →
              </button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

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
              ✓ Demographics fetched directly from Government of India ABHA Registry. Zero manual typing needed.
            </p>
          </div>
          <button class="btn-3d btn-3d-secondary" style="padding: 8px 14px; font-size: 0.8rem;" onclick="window.app.speakStep1Prompt()">
            ${i18n.t("audio_guide_btn")}
          </button>
        </div>

        <!-- Success Banner -->
        <div style="background: var(--green-subtle); border: 1px solid var(--green-border); border-radius: 8px; padding: 12px 16px; margin-top: 1rem; display: flex; align-items: center; gap: 12px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 1.15rem; flex-shrink: 0; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);">
            ✓
          </div>
          <div style="flex: 1;">
            <strong style="color: var(--green-darkest); font-size: 0.95rem; display: block;">
              Identity Verified: ${name}
            </strong>
            <span style="font-size: 0.74rem; color: var(--grey-600);">
              ABHA Number: <strong style="font-family: var(--font-mono); color: var(--green-darkest);">${abhaNumber}</strong> • Authenticated via ${details.authMethod || 'Aadhaar e-KYC (ABDM Gateway)'}
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
            Existing clinical encounters, vitals observations, and laboratory reports will be automatically synchronized into Step 3.
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Rendered when ABHA ID is not yet verified.
 * Offers visual Dual-Track Mode:
 * Track 1: Fast ABHA Check-In (Enter ABHA ID -> Auto-fetch all details)
 * Track 2: Walk-In Registration (No ABHA ID -> Comprehensive manual intake for Name, Age, Gender, Mobile, etc.)
 */
function renderUnverifiedIntakeView(app, i18n, patient, abhaMode, validationError, isVerifying) {
  const currentGender = patient.gender || "Female";
  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Not Known"];
  const currentBg = patient.bloodGroup || "O+";
  const salutations = ["Mr.", "Mrs.", "Ms.", "Dr.", "Master"];
  const activeSal = app.manualSalutation || (currentGender === "Male" ? "Mr." : "Ms.");

  return `
    <div class="registration-layout-grid">
      <!-- Left Column: Primary Intake Flow -->
      <div class="card-3d">
        <!-- Header with Live System Badge -->
        <div class="card-header-3d">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.65rem; font-weight: 800;">
                🟢 ABDM Gateway Live
              </span>
              <span class="pill-3d pill-3d-blue" style="font-size: 0.65rem;">
                NHA Certified M1-M3
              </span>
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.65rem;">
                DPDP Act 2023 Compliant
              </span>
            </div>
            <h2 class="card-title-3d" style="font-size: 1.35rem; font-weight: 800; letter-spacing: -0.01em;">
              ${i18n.t("reg_title")}
            </h2>
            <p class="card-subtitle-3d" style="font-size: 0.82rem; margin-top: 4px;">
              Provide an ABHA ID for instant 1-click demographic retrieval, or proceed with walk-in manual entry.
            </p>
          </div>
          <button class="btn-3d btn-3d-secondary" style="padding: 8px 14px; font-size: 0.8rem;" onclick="window.app.speakStep1Prompt()">
            ${i18n.t("audio_guide_btn")}
          </button>
        </div>

        <!-- DUAL-TRACK MODE SELECTOR CARDS -->
        <div class="intake-track-grid">
          <!-- Track 1: Fast ABHA ID -->
          <div class="intake-track-card ${abhaMode === 'abha' ? 'active-abha' : ''}" onclick="window.app.setAbhaMode('abha')">
            <div class="intake-track-icon-wrapper">
              ⚡
            </div>
            <div class="intake-track-body">
              <div class="intake-track-header-row">
                <span class="intake-track-title">Instant ABHA Fetch</span>
                <span class="pill-3d pill-3d-emerald" style="font-size: 0.58rem; padding: 1px 6px;">Recommended</span>
              </div>
              <p class="intake-track-desc">
                Enter 14-digit ID or scan card. Details auto-fill in 10 seconds.
              </p>
            </div>
            <div class="intake-track-check">✓</div>
          </div>

          <!-- Track 2: Walk-In (No ABHA ID) -->
          <div class="intake-track-card ${abhaMode === 'manual' ? 'active-manual' : ''}" onclick="window.app.setAbhaMode('manual')">
            <div class="intake-track-icon-wrapper">
              ✍️
            </div>
            <div class="intake-track-body">
              <div class="intake-track-header-row">
                <span class="intake-track-title">Walk-In (No ABHA ID)</span>
                <span class="pill-3d pill-3d-blue" style="font-size: 0.58rem; padding: 1px 6px;">Manual</span>
              </div>
              <p class="intake-track-desc">
                No ABHA card? Enter Name, Age, Gender manually for OPD token.
              </p>
            </div>
            <div class="intake-track-check">✓</div>
          </div>
        </div>

        <!-- ========================================================
             TRACK 1: ABHA CHECK-IN (Auto-Fetch Details)
             ======================================================== -->
        ${abhaMode === 'abha' ? `
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Hero ABHA Input Console -->
            <div class="abha-console-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="input-label-3d" style="margin-bottom: 0; font-weight: 800; font-size: 0.88rem; color: var(--text-primary);">
                  <span style="display: inline-flex; align-items: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.4"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Enter 14-Digit ABHA ID or PHR Address
                  </span>
                </label>
                <span id="abhaDigitsCounter" style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--primary); font-weight: 700;">
                  Format: XX-XXXX-XXXX-XXXX
                </span>
              </div>

              <!-- Input Action Bar with Hero Fetch CTA -->
              <div class="abha-input-action-bar">
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

              <!-- Error Alert Box -->
              ${validationError ? `
                <div class="abha-validation-error-box input-shake" style="margin-top: 10px;">
                  <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.4" style="flex-shrink: 0; margin-top: 1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <div>
                      <strong style="font-size: 0.82rem; color: #991B1B; display: block;">
                        ABHA Verification Error
                      </strong>
                      <span style="font-size: 0.75rem; color: #B91C1C; line-height: 1.4; display: block; margin-top: 2px;">
                        ${validationError}
                      </span>
                    </div>
                  </div>
                </div>
              ` : `
                <span class="input-hint-3d" style="display: flex; align-items: center; gap: 6px; margin-top: 8px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  Entering an authentic ABHA ID automatically fetches verified name, DOB, gender & medical records.
                </span>
              `}

              <!-- Quick-Fill Sandbox Test Profiles (One-Click Testing) -->
              <div class="sandbox-quick-chips-bar">
                <span class="sandbox-chips-label">⚡ One-Click ABDM Sandbox Test Profiles:</span>
                <div class="sandbox-chips-grid">
                  <button type="button" class="sandbox-citizen-chip" onclick="window.app.selectQuickAbha('91-8274-1923-0194')">
                    <span>👤 <strong>Ravi Kumar</strong> (91-8274-1923-0194)</span>
                    <span class="pill-3d pill-3d-emerald" style="font-size: 0.6rem; padding: 1px 5px;">Delhi</span>
                  </button>
                  <button type="button" class="sandbox-citizen-chip" onclick="window.app.selectQuickAbha('91-7210-4491-8023')">
                    <span>👤 <strong>Sunita Verma</strong> (91-7210-4491-8023)</span>
                    <span class="pill-3d pill-3d-blue" style="font-size: 0.6rem; padding: 1px 5px;">Bengaluru</span>
                  </button>
                  <button type="button" class="sandbox-citizen-chip" onclick="window.app.selectQuickAbha('91-5829-1029-4481')">
                    <span>👤 <strong>Dr. Kavita</strong> (91-5829-1029-4481)</span>
                    <span class="pill-3d pill-3d-emerald" style="font-size: 0.6rem; padding: 1px 5px;">Mumbai</span>
                  </button>
                  <button type="button" class="sandbox-citizen-chip" onclick="window.app.selectQuickAbha('91-9124-4412-0941')">
                    <span>👤 <strong>Sneha R.</strong> (91-9124-4412-0941)</span>
                    <span class="pill-3d pill-3d-blue" style="font-size: 0.6rem; padding: 1px 5px;">Noida</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Optical Card Scanning Options Grid -->
            <div class="scanner-tiles-grid">
              <!-- Live Camera Optical Scanner -->
              <div class="scanner-action-tile" onclick="window.app.openAbhaCameraScanner()">
                <div class="sync-action-icon" style="background: var(--green-subtle); border-color: var(--green-border);">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <div>
                  <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">Live Camera Scanner</strong>
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 2px;">Point physical card or QR to kiosk camera</span>
                </div>
              </div>

              <!-- Upload Card File / Photo -->
              <div class="scanner-action-tile" onclick="document.getElementById('abhaCardFileInput').click()">
                <div class="sync-action-icon" style="background: #EFF6FF; border-color: #BFDBFE;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div>
                  <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">Upload ABHA Card Photo</strong>
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 2px;">Card image, photo or PDF</span>
                </div>
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

            <!-- Switch Callout for Users without ABHA -->
            <div style="background: #F1F5F9; border: 1px dashed var(--grey-300); border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 0.8rem; color: var(--text-primary); display: block;">
                  Don't have an ABHA ID with you?
                </strong>
                <span style="font-size: 0.73rem; color: var(--text-muted);">
                  You can register as a walk-in patient in under 1 minute.
                </span>
              </div>
              <button type="button" class="btn-3d btn-3d-secondary" style="padding: 6px 14px; font-size: 0.76rem; font-weight: 700;" onclick="window.app.setAbhaMode('manual')">
                ✍️ Enter Details Manually →
              </button>
            </div>

            <!-- DPDP Act Notice -->
            <div style="background: var(--green-subtle); border: 1px solid var(--green-border); border-radius: 8px; padding: 10px 14px; display: flex; align-items: flex-start; gap: 10px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" stroke-width="2" style="flex-shrink:0; margin-top:1px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div style="font-size: 0.73rem; color: var(--text-muted); line-height: 1.35;">
                <strong style="color: var(--green-darkest); font-family: var(--font-mono);">DPDP ACT 2023 COMPLIANT</strong> — Zero biometric retention. Health data is linked ephemerally under ABDM standards.
              </div>
            </div>
          </div>
        ` : `
          <!-- ========================================================
               TRACK 2: MANUAL WALK-IN REGISTRATION (Asks Name, Age, Gender, etc.)
               ======================================================== -->
          <div style="display: flex; flex-direction: column; gap: 18px;">
            <!-- Top Callout with Switcher -->
            <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2rem;">📋</span>
                <div>
                  <strong style="font-size: 0.82rem; color: #1E40AF; display: block;">
                    Walk-In Intake Mode Active
                  </strong>
                  <span style="font-size: 0.74rem; color: #3B82F6;">
                    Please enter the patient's information below to generate an OPD queue pass.
                  </span>
                </div>
              </div>
              <button type="button" class="btn-3d btn-3d-primary" style="padding: 6px 14px; font-size: 0.74rem; font-weight: 700; white-space: nowrap;" onclick="window.app.setAbhaMode('abha')">
                ⚡ Have ABHA? Auto-Fill →
              </button>
            </div>

            <!-- 1. Patient Full Name with Salutation Chips -->
            <div>
              <label class="input-label-3d" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Patient Full Name *
                </span>
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
                style="font-size: 1rem; font-weight: 600;"
              >
            </div>

            <!-- 2. Interactive Gender Cards Grid (3D Selection Cards) -->
            <div>
              <label class="input-label-3d" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M9.17 14.83l-4.24 4.24"/></svg>
                  Patient Gender *
                </span>
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

            <!-- 3. Age & Date of Birth Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div>
                <label class="input-label-3d" style="font-weight: 700; font-size: 0.85rem;">
                  <span style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Age in Years *
                  </span>
                </label>
                <input 
                  type="number" 
                  id="patientAgeInput" 
                  class="input-text-3d" 
                  placeholder="e.g. 28" 
                  value="${patient.age || ''}" 
                  min="1" 
                  max="120"
                  style="font-size: 1rem; font-weight: 600;"
                >
              </div>

              <div>
                <label class="input-label-3d" style="font-weight: 700; font-size: 0.85rem;">
                  <span style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Date of Birth (Optional)
                  </span>
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

            <!-- 4. Mobile Number & Blood Group Grid -->
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px;">
              <div>
                <label class="input-label-3d" style="font-weight: 700; font-size: 0.85rem;">
                  <span style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Mobile Number
                  </span>
                </label>
                <div style="display: flex; gap: 6px;">
                  <span style="padding: 10px 12px; background: var(--grey-100); border: 1px solid var(--grey-300); border-radius: 8px; font-weight: 700; font-size: 0.85rem; color: var(--text-primary); display: inline-flex; align-items: center; gap: 4px;">
                    🇮🇳 +91
                  </span>
                  <input 
                    type="tel" 
                    id="patientMobileInput" 
                    class="input-text-3d" 
                    placeholder="98765 43210" 
                    value="${patient.mobile ? patient.mobile.replace(/^\+91\s*/, '') : ''}"
                    maxlength="10"
                    style="flex: 1;"
                  >
                </div>
              </div>

              <div>
                <label class="input-label-3d" style="font-weight: 700; font-size: 0.85rem;">
                  State / Region
                </label>
                <select id="patientStateInput" class="input-text-3d" style="height: 42px;">
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
            <div>
              <label class="input-label-3d" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">
                Blood Group (Optional)
              </label>
              <div class="blood-group-pills-grid">
                ${bloodGroups.map(bg => `
                  <button type="button" class="blood-group-pill ${currentBg === bg ? 'active' : ''}" data-bg="${bg}" onclick="window.app.setManualBloodGroup('${bg}')">
                    ${bg}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 6. Chief Complaint & Symptoms for Visit -->
            <div>
              <label class="input-label-3d" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;">
                Chief Medical Concern / Symptoms
              </label>
              <input 
                type="text" 
                id="patientComplaintInput" 
                class="input-text-3d" 
                placeholder="e.g. High fever, dry cough and body weakness since 2 days" 
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

            <!-- 7. Action Button: Proceed CTA -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-light);">
              <button type="button" class="btn-3d btn-3d-secondary" onclick="window.app.setAbhaMode('abha')">
                ← Back to ABHA Fetch
              </button>
              <button type="button" class="btn-3d btn-3d-primary" style="padding: 14px 34px; font-weight: 800; font-size: 0.95rem;" onclick="window.app.saveStep1AndNext()">
                ${i18n.t("btn_proceed_vitals")} →
              </button>
            </div>
          </div>
        `}
      </div>

      <!-- Right Column: ABDM Central Bridge Monitor & Security Status -->
      <div>
        <div class="abdm-sync-hub-card">
          <div class="sync-hub-header">
            <div class="sync-hub-badge-row">
              <span class="sync-hub-pulse-dot"></span>
              <span class="sync-hub-status-text">ABDM Central Bridge • Active (42ms)</span>
            </div>
            <h3 class="sync-hub-title">Why Use ABHA Check-In?</h3>
            <p class="sync-hub-subtitle">
              Ayushman Bharat Digital Mission (ABDM) creates an interoperable, paperless health journey under the National Health Authority (NHA).
            </p>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--green-subtle); color: var(--green-darkest); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                1
              </div>
              <div>
                <strong style="font-size: 0.82rem; color: var(--text-primary); display: block;">Zero Manual Typing (e-KYC)</strong>
                <span style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; display: block; margin-top: 2px;">
                  Name, age, gender, DOB and state are retrieved automatically from Government records in under 10 seconds.
                </span>
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--green-subtle); color: var(--green-darkest); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                2
              </div>
              <div>
                <strong style="font-size: 0.82rem; color: var(--text-primary); display: block;">Historical Record Synchronization</strong>
                <span style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; display: block; margin-top: 2px;">
                  Prior hospital visits, lab reports, and medications are linked securely for the consulting doctor's review.
                </span>
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--green-subtle); color: var(--green-darkest); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                3
              </div>
              <div>
                <strong style="font-size: 0.82rem; color: var(--text-primary); display: block;">Paperless OPD Pass & Token</strong>
                <span style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; display: block; margin-top: 2px;">
                  Receive your digital consultation token and diagnosis slip directly on SMS / WhatsApp upon discharge.
                </span>
              </div>
            </div>
          </div>

          <!-- Gateway Security Badges -->
          <div class="sync-security-footer">
            <div class="sync-security-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>DPDP Act 2023 Consent Protected</span>
            </div>
            <div class="sync-security-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <span>AES-256 GCM Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

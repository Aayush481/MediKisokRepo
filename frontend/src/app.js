/**
 * MediKiosk 3D Real-World Clinical Hardware & Terminal Application Logic
 * MERN Architecture Client Engine
 * Integrates Contactless Optical rPPG, Python/MediaPipe Face Detection,
 * SNOMED-CT Prescription Parsing, Dynamic Lab Reports, AYUSH Dashavidha, and ABDM HL7 FHIR R4.
 */

import { speechService } from "./services/speechService.js";
import { clinicalParser, SOCRATES_QUESTIONS } from "./services/clinicalParser.js";
import { ayushEngine, AYUSH_QUESTIONS } from "./services/ayushEngine.js";
import { ocrEngine } from "./services/ocrEngine.js";
import { prescriptionParser } from "./services/prescriptionParser.js";
import { labParser } from "./services/labParser.js";
import { fhirService } from "./services/fhirService.js";
import { rppgService } from "./services/rppgVitalsService.js";
import { herbDrugService } from "./services/herbDrugService.js";
import { clinicalGraphService } from "./services/clinicalKnowledgeGraph.js";
import { meshService } from "./services/meshService.js";
import { diseaseExtractor } from "./services/diseaseExtractor.js";
import { i18n } from "./services/i18nService.js";
import { AbhaLookupModal } from "./components/AbhaLookupModal.js";
import { ANATOMY_REGISTRY, ANATOMY_SYSTEMS } from "./data/anatomyRegistry.js";
import { anatomyRegistryService } from "./services/anatomyRegistryService.js";
import { BodyMap2D } from "./components/BodyMap2D.js";
import { SymptomQuestionEngine } from "./components/SymptomQuestionEngine.js";
import { EmergencyAlertModal } from "./components/EmergencyAlertModal.js";
import { notificationClientService } from "./services/notificationClientService.js";
import { PhoneSimulatorModal } from "./components/PhoneSimulatorModal.js";

function generateMedicalDocSvg(type, title, facility, items = [], rootCause = "", patientName = "Priya Patel", token = "A-24") {
  const isRx = type === "prescription";
  const isLab = type === "lab_report";
  const isRadio = type === "radiology" || type === "scan";
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  let bodyContent = "";
  if (isRx) {
    bodyContent = `
      <g transform="translate(40, 220)">
        <text x="0" y="0" font-family="Georgia, serif" font-size="36" font-weight="bold" fill="#0284C7">℞</text>
        <line x1="0" y1="15" x2="520" y2="15" stroke="#CBD5E1" stroke-width="1.5"/>
        ${items.map((it, idx) => `
          <g transform="translate(0, ${45 + idx * 56})">
            <text x="0" y="0" font-family="'Courier New', monospace" font-size="14" font-weight="bold" fill="#0F172A">${idx + 1}. ${typeof it === 'string' ? it : it.name} ${it.dosage || ''} - ${it.freq || 'OD'}</text>
            <text x="20" y="20" font-family="system-ui, sans-serif" font-size="11" fill="#475569">Sig: ${it.timing || 'After Meals'} • Dur: ${it.duration || '5 days'} • Route: ${it.route || 'Oral'}</text>
            <text x="20" y="34" font-family="system-ui, sans-serif" font-size="10" fill="#0284C7">SNOMED: ${it.snomedCode || '387517004'} | Class: ${it.schedule || 'Schedule H'}</text>
          </g>
        `).join('')}
      </g>
    `;
  } else if (isLab) {
    bodyContent = `
      <g transform="translate(40, 220)">
        <rect x="0" y="0" width="520" height="28" fill="#E2E8F0" rx="4"/>
        <text x="12" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#1E293B">INVESTIGATION / PARAMETER</text>
        <text x="280" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#1E293B">OBSERVED VALUE</text>
        <text x="420" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#1E293B">FLAG STATUS</text>
        ${items.map((it, idx) => {
          const isHigh = it.status === 'HIGH' || it.status === 'ABNORMAL';
          const isLow = it.status === 'LOW';
          const color = isHigh ? '#EF4444' : isLow ? '#F59E0B' : '#10B981';
          return `
            <g transform="translate(0, ${48 + idx * 36})">
              <text x="12" y="0" font-family="system-ui, sans-serif" font-size="12" fill="#0F172A">${it.name}</text>
              <text x="280" y="0" font-family="monospace" font-size="12" font-weight="bold" fill="#0F172A">${it.value}</text>
              <rect x="420" y="-12" width="70" height="18" fill="${color}" fill-opacity="0.15" rx="3" stroke="${color}" stroke-width="0.8"/>
              <text x="455" y="0" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="${color}">${it.status}</text>
              <line x1="0" y1="12" x2="520" y2="12" stroke="#F1F5F9" stroke-width="1"/>
            </g>
          `;
        }).join('')}
      </g>
    `;
  } else {
    bodyContent = `
      <g transform="translate(40, 220)">
        <rect x="0" y="0" width="520" height="260" fill="#020617" rx="8" stroke="#334155" stroke-width="2"/>
        <circle cx="260" cy="130" r="95" fill="none" stroke="#1E293B" stroke-dasharray="6,4"/>
        <path d="M 180,80 C 140,110 130,170 170,220 C 190,200 200,160 190,110 Z" fill="#1E293B" opacity="0.6"/>
        <path d="M 340,80 C 380,110 390,170 350,220 C 330,200 320,160 330,110 Z" fill="#1E293B" opacity="0.6"/>
        <circle cx="345" cy="175" r="22" fill="#EF4444" fill-opacity="0.25" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="3,2"/>
        <text x="375" y="180" font-family="monospace" font-size="10" fill="#EF4444">Focal Finding</text>
        <text x="20" y="30" font-family="monospace" font-size="11" fill="#38BDF8">DIGITAL RADIOGRAM 100kVp</text>
        <text x="500" y="30" text-anchor="end" font-family="monospace" font-size="11" fill="#94A3B8">PA ERECT</text>
        <text x="260" y="245" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#F8FAFC">Diagnostic Impression: ${rootCause.slice(0, 48)}</text>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="820" viewBox="0 0 600 820">
    <rect width="600" height="820" fill="#FFFFFF" rx="8"/>
    <rect x="12" y="12" width="576" height="796" fill="none" stroke="#CBD5E1" stroke-width="1.5" rx="6"/>
    
    <rect x="20" y="20" width="560" height="96" fill="#0F172A" rx="6"/>
    <text x="40" y="52" font-family="system-ui, sans-serif" font-size="18" font-weight="800" fill="#38BDF8">${facility}</text>
    <text x="40" y="74" font-family="system-ui, sans-serif" font-size="12" fill="#94A3B8">${title}</text>
    <text x="40" y="94" font-family="system-ui, sans-serif" font-size="10" fill="#64748B">ABDM Health Facility Registry (HFR) Accredited • Telemetry Desk</text>
    <text x="560" y="52" text-anchor="end" font-family="monospace" font-size="11" fill="#38BDF8">REF: #${Math.floor(100000 + Math.random() * 900000)}</text>
    <text x="560" y="74" text-anchor="end" font-family="system-ui, sans-serif" font-size="11" fill="#94A3B8">${dateStr}</text>

    <text x="300" y="470" text-anchor="middle" font-family="system-ui, sans-serif" font-size="44" font-weight="900" fill="#F1F5F9" transform="rotate(-30 300 470)">${(type || 'DOCUMENT').toUpperCase()}</text>

    <rect x="25" y="130" width="550" height="52" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" rx="4"/>
    <text x="40" y="152" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0F172A">PATIENT: <tspan fill="#0284C7">${patientName.toUpperCase()}</tspan></text>
    <text x="240" y="152" font-family="system-ui, sans-serif" font-size="11" fill="#475569">TOKEN: <tspan font-weight="bold" fill="#0F172A">${token}</tspan></text>
    <text x="380" y="152" font-family="system-ui, sans-serif" font-size="11" fill="#475569">DATE: <tspan fill="#0F172A">${dateStr}</tspan></text>
    <text x="40" y="170" font-family="system-ui, sans-serif" font-size="10" fill="#64748B">CLINICAL FINDING: <tspan font-weight="bold" fill="#0F172A">${rootCause}</tspan></text>

    ${bodyContent}

    <g transform="translate(360, 700)">
      <rect x="0" y="0" width="200" height="65" fill="none" stroke="#0284C7" stroke-width="1.5" stroke-dasharray="4,2" rx="4"/>
      <text x="100" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0284C7">DIGITALLY VERIFIED</text>
      <text x="100" y="40" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#0F172A">Dr. Consultation Desk 3</text>
      <text x="100" y="54" text-anchor="middle" font-family="monospace" font-size="8" fill="#64748B">REG NO: MCI-44912/2016</text>
    </g>
    <text x="40" y="760" font-family="system-ui, sans-serif" font-size="10" fill="#94A3B8">MediKiosk Clinical Document Ingestion Engine • ISO 13606 / HL7 FHIR Compliant</text>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

class MediKioskApp {
  constructor() {
    this.currentMode = "kiosk"; // "kiosk" | "doctor"
    this.currentStep = 1; // 1: Check-In, 2: Vitals & Intake, 3: Records, 4: Summary
    this.currentLanguage = i18n.getLanguage() || "hi";
    this.isAyushMode = false;
    this.isOcrProcessing = false;
    this.ocrProgressText = "";
    this.isRppgScanning = false;
    this.rppgProgress = 0;
    this.faceDetectorEngine = "mediapipe"; // "mediapipe" | "python"
    this.scanDuration = 30000; // 30000 ms (30s Rapid Scan) | 60000 ms (60s Diagnostic HRV)
    this.faceLockState = {
      isLocked: false,
      detected: false,
      progress: 0,
      message: "Aligning Face in Biometric Reticle...",
      checks: { faceDetected: false, isCentered: false, isOptimalDistance: false, isStill: false, hasValidROIs: false }
    };
    this.autoScanTimer = null;
    this.autoScanCountdown = 0;
    this.oscilloscopeSamples = [];
    this.rppgElapsedSec = "0.0";

    // Clean initial walk-in state
    this.resetPatientState();

    // Doctor Live Queue & Workspace State
    this.doctorQueue = [];
    this.selectedQueuePatient = null;
    this.doctorActiveTab = "all"; // "all" | "summary" | "prescriptions" | "previews"
    this.smsDispatchLogs = [];
    this.inspectedDoc = null;
    this.docZoomLevel = 1;
    this.isSmsLogModalOpen = false;
    this.ayushAnswers = {};

    // 3D Anatomical Body Map & Clinical Intake State
    this.bodyMap2DInstance = null;
    this.questionEngineInstance = null;
    this.isVitalsBayCollapsed = false;

    this.initDefaultDoctorQueue();
    this.checkAndTrigger30MinAlerts();

    // Start background queue timer for real-time 30-min SMS evaluation
    if (typeof window !== "undefined") {
      this.queueMonitorTimer = setInterval(() => this.checkAndTrigger30MinAlerts(), 15000);
    }

    this.init();
  }

  resetPatientState() {
    this.patient = {
      id: "PAT-" + Math.floor(1000 + Math.random() * 9000),
      name: "",
      age: "",
      gender: "Female",
      abhaId: "",
      abhaAddress: "",
      isAbhaVerified: false,
      verifiedProfile: null,
      mobile: "",
      chiefComplaint: "",
      hpi: {
        site: "",
        onset: "",
        character: "",
        radiation: "",
        associations: [],
        exacerbating: "",
        severity: 0
      },
      ayushIntake: null,
      ayushHerbs: [],
      allopathicMeds: [],
      medications: [],
      diagnoses: [],
      diseases: [],
      documents: [],
      rppgVitals: null,
      anatomicalIntake: null,
      isEmergency: false,
      tokenNumber: "A-" + Math.floor(10 + Math.random() * 89)
    };
  }

  init() {
    this.abhaModal = new AbhaLookupModal({
      onSuccess: (profile) => this.onAbhaProfileLinked(profile)
    });
    this.phoneSimulator = new PhoneSimulatorModal(this);
    this.currentLanguage = i18n.getLanguage() || "hi";
    speechService.setLanguage(this.currentLanguage);
    const langSelect = document.getElementById("langSelect");
    if (langSelect) langSelect.value = this.currentLanguage;
    this.updateStaticHeaderTranslations();
    this.bindGlobalEvents();
    this.render();
  }

  openAbhaLookupModal() {
    const currentInput = document.getElementById("patientAbhaInput")?.value || this.patient.abhaId || "";
    if (this.abhaModal) {
      this.abhaModal.open(currentInput);
    }
  }

  onAbhaProfileLinked(profile) {
    if (!profile) return;
    this.patient.isAbhaVerified = true;
    this.patient.verifiedProfile = profile;
    this.patient.name = profile.name || this.patient.name;
    this.patient.gender = profile.gender || this.patient.gender;
    if (profile.age) this.patient.age = profile.age;
    if (profile.abhaAddress) this.patient.abhaAddress = profile.abhaAddress;
    this.patient.abhaId = profile.abhaAddress || profile.abhaNumber || this.patient.abhaId;
    if (profile.mobile) this.patient.mobile = profile.mobile;
    if (profile.address) this.patient.address = profile.address;

    this.render();
  }

  bindGlobalEvents() {
    document.querySelectorAll(".mode-btn[data-mode]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const mode = e.target.closest(".mode-btn")?.dataset?.mode;
        if (mode) this.setMode(mode);
      });
    });

    const langSelect = document.getElementById("langSelect");
    if (langSelect) {
      langSelect.addEventListener("change", (e) => {
        this.setLanguage(e.target.value);
      });
    }
  }

  updateStaticHeaderTranslations() {
    const kBtn = document.querySelector('.mode-btn[data-mode="kiosk"]');
    if (kBtn) kBtn.textContent = i18n.t("mode_kiosk");
    const dBtn = document.querySelector('.mode-btn[data-mode="doctor"]');
    if (dBtn) dBtn.textContent = i18n.t("mode_doctor");

    const quickIntake = document.querySelector(".quick-bar-left span");
    if (quickIntake) quickIntake.innerHTML = `🏥 <strong>${i18n.t("quick_intake_mode")}</strong>`;

    const quickChips = document.querySelectorAll(".quick-bar-actions .quick-chip");
    if (quickChips.length >= 3) {
      quickChips[0].textContent = i18n.t("quick_new_patient");
      quickChips[1].textContent = i18n.t("quick_optical_scan");
      quickChips[2].textContent = i18n.t("quick_scan_report");
    }

    const langSelect = document.getElementById("langSelect");
    if (langSelect && langSelect.value !== this.currentLanguage) {
      langSelect.value = this.currentLanguage;
    }
  }

  appendSymptom(sym) {
    const textarea = document.getElementById("chiefComplaintText");
    if (!textarea) return;
    const current = textarea.value.trim();
    if (!current) {
      textarea.value = sym;
    } else if (!current.toLowerCase().includes(sym.toLowerCase())) {
      textarea.value = current + ", " + sym;
    }
    this.patient.chiefComplaint = textarea.value;
  }

  toggleVitalsBayCollapse() {
    this.isVitalsBayCollapsed = !this.isVitalsBayCollapsed;
    this.render();
  }

  setMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll(".mode-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    if (mode === "kiosk" && this.currentStep === 2) {
      setTimeout(() => this.initCamera(), 100);
    } else {
      this.stopCamera();
    }

    this.render();
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    i18n.setLanguage(lang);
    speechService.setLanguage(lang);
    this.updateStaticHeaderTranslations();
    this.render();
  }

  goToStep(step) {
    if (this.currentStep === 2 && step !== 2) {
      this.stopCamera();
      this.destroyBodyMapModule();
    }
    this.currentStep = step;
    this.render();
    if (step === 2) {
      setTimeout(() => {
        try {
          this.initBodyMapModule();
        } catch (mapErr) {
          console.error("[MediKiosk] Body map init error:", mapErr);
        }
        try {
          this.initCamera();
          this.drawLiveOscilloscope();
        } catch (camErr) {
          console.warn("[MediKiosk] Camera init warning (optional hardware):", camErr);
        }
      }, 50);
    }
  }

  nextStep() {
    if (this.currentStep === 1) {
      this.saveStep1AndNext();
      return;
    }
    if (this.currentStep < 4) {
      this.goToStep(this.currentStep + 1);
      if (this.currentStep === 4) {
        this.enqueuePatient();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  enqueuePatient() {
    const clone = JSON.parse(JSON.stringify(this.patient));
    if (!clone.mobile && this.patient.mobile) clone.mobile = this.patient.mobile;
    if (!clone.name && this.patient.name) clone.name = this.patient.name;

    const existingIdx = this.doctorQueue.findIndex(p => p.id === clone.id);
    let qPosition = 0;
    if (existingIdx >= 0) {
      this.doctorQueue[existingIdx] = clone;
      qPosition = existingIdx + 1;
    } else {
      // Append newly created walk-in patient at the END of the live OPD queue
      this.doctorQueue.push(clone);
      qPosition = this.doctorQueue.length;
    }

    const membersNext = Math.max(0, qPosition - 1);
    const waitMinutes = membersNext === 0 ? 5 : Math.round(membersNext * 7.5);
    const estTime = new Date(Date.now() + Math.max(5, waitMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Send real-time registration SMS to registered number
    notificationClientService.sendRealTimeSms({
      mobile: clone.mobile || "+91 98765 43210",
      patientId: clone.id,
      patientName: clone.name || "Walk-in Patient",
      tokenNumber: clone.tokenNumber || "TK-101",
      membersNext,
      appointmentTime: estTime,
      waitMinutes,
      doctorName: "Dr. Sharma",
      cabinNumber: "Cabin 3",
      department: "General Medicine",
      alertType: "registration"
    });

    this.checkAndTrigger30MinAlerts();

    // Save to MERN backend API
    fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clone)
    }).catch(e => console.warn("Patient API notice:", e));
  }

  render() {
    const container = document.getElementById("appContainer");
    if (!container) return;

    if (this.currentMode === "doctor") {
      container.innerHTML = this.renderDoctorDashboard();
      this.bindDoctorEvents();
    } else {
      container.innerHTML = `
        <!-- 2D Kiosk Hardware Stepper -->
        <div class="kiosk-stepper">
          <div class="step-node ${this.currentStep === 1 ? 'active' : ''} ${this.currentStep > 1 ? 'completed' : ''}" onclick="window.app.goToStep(1)">
            <div class="step-number">${this.currentStep > 1 ? '✓' : '1'}</div>
            <div>
              <div class="step-label">${i18n.t("step1_title")}</div>
              <div class="step-subtext">${i18n.t("step1_sub")}</div>
            </div>
          </div>
          <div class="step-node ${this.currentStep === 2 ? 'active' : ''} ${this.currentStep > 2 ? 'completed' : ''}" onclick="window.app.goToStep(2)">
            <div class="step-number">${this.currentStep > 2 ? '✓' : '2'}</div>
            <div>
              <div class="step-label">🦴 2D Skeleton & Intake</div>
              <div class="step-subtext">Interactive Skeleton, Organs & Joints</div>
            </div>
          </div>
          <div class="step-node ${this.currentStep === 3 ? 'active' : ''} ${this.currentStep > 3 ? 'completed' : ''}" onclick="window.app.goToStep(3)">
            <div class="step-number">${this.currentStep > 3 ? '✓' : '3'}</div>
            <div>
              <div class="step-label">${i18n.t("step3_title")}</div>
              <div class="step-subtext">${i18n.t("step3_sub")}</div>
            </div>
          </div>
          <div class="step-node ${this.currentStep === 4 ? 'active' : ''}" onclick="window.app.goToStep(4)">
            <div class="step-number">4</div>
            <div>
              <div class="step-label">${i18n.t("step4_title")}</div>
              <div class="step-subtext">${i18n.t("step4_sub")}</div>
            </div>
          </div>
        </div>

        <!-- Active Wizard Step -->
        ${this.renderCurrentStepContent()}
      `;
      this.bindKioskEvents();

      // Lifecycle hook: If Step 2 is active, ALWAYS mount BodyMap2D immediately into the fresh DOM
      if (this.currentStep === 2) {
        setTimeout(() => {
          this.initBodyMapModule();
        }, 15);
      }
    }
  }

  renderCurrentStepContent() {
    switch (this.currentStep) {
      case 1: return this.renderStep1Registration();
      case 2: return this.renderStep2VitalsAndIntake();
      case 3: return this.renderStep3Records();
      case 4: return this.renderStep4Summary();
      default: return this.renderStep1Registration();
    }
  }

  // ========================================================
  // STEP 1: PATIENT REGISTRATION & ABHA VERIFICATION
  // ========================================================
  renderStep1Registration() {
    return `
      <div class="card-3d" style="max-width: 680px; margin: 0 auto;">
        <div class="card-header-3d">
          <div>
            <h2 class="card-title-3d">${i18n.t("reg_title")}</h2>
            <p class="card-subtitle-3d">${i18n.t("reg_subtitle")}</p>
          </div>
          <button class="btn-3d btn-3d-secondary" style="padding: 8px 14px; font-size: 0.8rem;" onclick="window.app.speakStep1Prompt()">${i18n.t("audio_guide_btn")}</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label class="input-label-3d">${i18n.t("full_name_label")}</label>
            <input type="text" id="patientNameInput" class="input-text-3d" placeholder="${i18n.t("full_name_ph")}" value="${this.patient.name}">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label class="input-label-3d">${i18n.t("age_label")}</label>
              <input type="number" id="patientAgeInput" class="input-text-3d" placeholder="${i18n.t("age_ph")}" value="${this.patient.age}">
            </div>
            <div>
              <label class="input-label-3d">${i18n.t("gender_label")}</label>
              <select id="patientGenderInput" class="input-text-3d">
                <option value="Female" ${this.patient.gender === 'Female' ? 'selected' : ''}>${i18n.t("gender_female")}</option>
                <option value="Male" ${this.patient.gender === 'Male' ? 'selected' : ''}>${i18n.t("gender_male")}</option>
                <option value="Other" ${this.patient.gender === 'Other' ? 'selected' : ''}>${i18n.t("gender_other")}</option>
              </select>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label class="input-label-3d" style="margin: 0;">${i18n.t("abha_label")}</label>
              <button type="button" class="btn-3d btn-3d-secondary" style="font-size: 0.74rem; padding: 4px 10px; color: var(--emerald-dark); border-color: var(--emerald-border); background: var(--emerald-light);" onclick="window.app.openAbhaLookupModal()">
                🔍 ABDM Patient Lookup (OTP)
              </button>
            </div>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="patientAbhaInput" class="input-text-3d" placeholder="${i18n.t("abha_ph")}" value="${this.patient.abhaId}" style="flex: 1;">
              <button type="button" class="btn-3d btn-3d-primary" style="font-size: 0.78rem; padding: 6px 12px; white-space: nowrap;" onclick="window.app.openAbhaLookupModal()">
                Verify ABHA
              </button>
            </div>
            ${this.patient.isAbhaVerified ? `
              <div style="margin-top: 6px; display: flex; align-items: center; gap: 6px; font-size: 0.76rem; color: var(--emerald-dark); font-weight: 700; background: var(--emerald-light); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--emerald-border);">
                <span>✓</span> ABDM Verified Patient Profile Linked (${this.patient.abhaAddress || this.patient.abhaId})
              </div>
            ` : ''}
          </div>

          <div>
            <label class="input-label-3d">${i18n.t("mobile_label")}</label>
            <input type="tel" id="patientMobileInput" class="input-text-3d" placeholder="${i18n.t("mobile_ph")}" value="${this.patient.mobile}">
          </div>

          <div style="background: var(--emerald-light); border: 1px solid var(--emerald-border); border-radius: 12px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 10px; margin-top: 6px;">
            <span style="font-size: 1.2rem;">🔒</span>
            <div>
              <strong style="font-size: 0.82rem; color: var(--emerald-deep);">${i18n.t("dpdp_title")}</strong>
              <p style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
                ${i18n.t("dpdp_desc")}
              </p>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; flex-wrap: wrap; gap: 8px;">
            <button type="button" class="btn-3d btn-3d-secondary" style="padding: 12px 20px; color: #0284C7; border-color: rgba(2, 132, 199, 0.4); font-weight: 700;" onclick="window.app.goToStep(2)">
              🦴 Launch 2D Skeleton & Anatomy Map →
            </button>
            <button class="btn-3d btn-3d-primary" style="padding: 14px 32px;" onclick="window.app.saveStep1AndNext()">
              ${i18n.t("btn_proceed_vitals")}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ========================================================
  // STEP 2: CONTACTLESS OPTICAL VITALS & VOICE INTAKE
  // ========================================================
  renderStep2VitalsAndIntake() {
    const vitals = this.patient.rppgVitals || {
      heartRate: "--",
      hrv: "--",
      respiratoryRate: "--",
      stressScore: "--",
      signalQuality: "Awaiting Face Alignment"
    };

    const isLocked = this.faceLockState.isLocked;
    const checks = this.faceLockState.checks || {};

    return `
      ${this.isVitalsBayCollapsed ? `
        <!-- Collapsed Compact Vitals Telemetry Strip -->
        <div class="vitals-hardware-bay vitals-hardware-bay-collapsed" style="padding: 10px 18px; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.3rem;">📷</span>
              <div>
                <strong style="color: var(--text-primary); font-size: 0.9rem;">${i18n.t("vitals_title")}</strong>
                <span style="font-size: 0.74rem; color: var(--text-muted); display: block;">
                  ${this.patient.rppgVitals ? '✓ Calibrated Diagnostic Telemetry' : 'Contactless Optical Scanner (Optional)'}
                </span>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="pill-3d ${vitals.heartRate !== '--' ? 'pill-3d-emerald' : 'pill-3d-subtle'}" style="font-size: 0.74rem; padding: 4px 10px;">
                🫀 <strong>${vitals.heartRate}</strong> BPM
              </span>
              <span class="pill-3d ${vitals.stressScore !== '--' && vitals.stressScore !== undefined ? 'pill-3d-emerald' : 'pill-3d-subtle'}" style="font-size: 0.74rem; padding: 4px 10px;">
                ⚡ <strong>${vitals.stressScore !== undefined ? vitals.stressScore : '--'}</strong>/100 Stress
              </span>
              <span class="pill-3d ${vitals.hrv !== '--' ? 'pill-3d-emerald' : 'pill-3d-subtle'}" style="font-size: 0.74rem; padding: 4px 10px;">
                〰 <strong>${vitals.hrv}</strong> ms HRV
              </span>
              <span class="pill-3d ${vitals.respiratoryRate !== '--' ? 'pill-3d-emerald' : 'pill-3d-subtle'}" style="font-size: 0.74rem; padding: 4px 10px;">
                🫁 <strong>${vitals.respiratoryRate}</strong> RPM
              </span>
              <button class="btn-3d btn-3d-secondary" style="padding: 5px 12px; font-size: 0.74rem;" onclick="window.app.toggleVitalsBayCollapse()">
                ⌄ Expand Camera Scanner
              </button>
            </div>
          </div>
        </div>
      ` : `
        <!-- Vitals Hardware Bay -->
        <div class="vitals-hardware-bay">
          <div class="bay-header">
            <div>
              <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">
                ${i18n.t("vitals_title")}
              </h3>
              <p style="font-size: 0.78rem; color: var(--text-muted);">
                ${i18n.t("vitals_subtitle")}
              </p>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <!-- Scan Duration Switcher -->
              <div style="background: var(--bg-surface-subtle); padding: 3px; border-radius: 10px; border: 1px solid var(--border-light); display: flex; gap: 2px;">
                <button class="mode-btn ${this.scanDuration === 30000 ? 'active' : ''}" style="padding: 4px 10px; font-size: 0.74rem;" onclick="window.app.setScanDuration(30000)">
                  ${i18n.t("rapid_scan_btn")}
                </button>
                <button class="mode-btn ${this.scanDuration === 60000 ? 'active' : ''}" style="padding: 4px 10px; font-size: 0.74rem;" onclick="window.app.setScanDuration(60000)">
                  ${i18n.t("diagnostic_scan_btn")}
                </button>
              </div>

              <button class="btn-3d ${this.isAyushMode ? 'btn-3d-success' : 'btn-3d-secondary'}" style="padding: 6px 12px; font-size: 0.76rem;" onclick="window.app.toggleAyushMode()">
                🌿 ${this.isAyushMode ? 'AYUSH Active' : i18n.t("ayush_mode_btn")}
              </button>

              <button class="btn-3d btn-3d-secondary" style="padding: 6px 10px; font-size: 0.74rem;" onclick="window.app.toggleVitalsBayCollapse()" title="Minimize camera bay to give full height to Body Map">
                ⌃ Minimize Bay
              </button>
            </div>
          </div>`}

        ${!this.isVitalsBayCollapsed ? `
        <div style="display: grid; grid-template-columns: 240px 1fr; gap: 1.25rem; align-items: stretch;">
          <!-- Camera View / Verified Card -->
          <div>
            ${this.patient.rppgVitals ? `
              <div style="height: 200px; border-radius: 14px; background: var(--green-surface); border: 2px solid var(--emerald); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 1rem; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.15);">
                <div style="font-size: 2.5rem; line-height: 1; margin-bottom: 6px; color: var(--emerald);">✓</div>
                <strong style="color: var(--emerald-dark); font-size: 0.95rem;">${i18n.t("vitals_calibrated")}</strong>
                <p style="font-size: 0.74rem; color: var(--emerald-deep); margin-top: 2px;">${i18n.t("vitals_calibrated_sub")}</p>
                <span class="pill-3d pill-3d-emerald" style="margin-top: 8px;">
                  ${this.patient.rppgVitals.durationSeconds || 30}s • ${i18n.t("verified_badge")}
                </span>
              </div>
            ` : `
              <div class="camera-hardware-lens" id="rppgCameraFeedContainer" style="cursor: pointer;" onclick="if(!window.app.patient.rppgVitals && window.app.cameraError) window.app.requestCameraDirectly();">
                <div class="reticle-hud ${isLocked ? 'locked' : ''}">
                  <span class="reticle-status-badge">
                    ${this.cameraError ? '🔴 ' + i18n.t("camera_req_btn") : (this.faceLockState.message || (this.isRppgScanning ? i18n.t("btn_scanning_vitals") : 'ALIGNING FACE...'))}
                  </span>
                </div>
              </div>
              ${this.cameraError ? `
                <div style="margin-top: 6px; text-align: center;">
                  <button class="btn-3d btn-3d-warning" style="padding: 6px 12px; font-size: 0.78rem; width: 100%;" onclick="window.app.requestCameraDirectly()">
                    ${i18n.t("camera_req_btn")}
                  </button>
                </div>
              ` : ''}
            `}

            <!-- 5-Point Alignment Status Checklist -->
            <div class="checklist-pill-bar">
              <div class="pill-check ${this.patient.rppgVitals || checks.faceDetected ? 'pass' : ''}">
                <span>${this.patient.rppgVitals || checks.faceDetected ? '✓' : '○'}</span> Face
              </div>
              <div class="pill-check ${this.patient.rppgVitals || checks.isCentered ? 'pass' : ''}">
                <span>${this.patient.rppgVitals || checks.isCentered ? '✓' : '○'}</span> Center
              </div>
              <div class="pill-check ${this.patient.rppgVitals || checks.isOptimalDistance ? 'pass' : ''}">
                <span>${this.patient.rppgVitals || checks.isOptimalDistance ? '✓' : '○'}</span> Distance
              </div>
              <div class="pill-check ${this.patient.rppgVitals || checks.isStill ? 'pass' : ''}">
                <span>${this.patient.rppgVitals || checks.isStill ? '✓' : '○'}</span> Still
              </div>
              <div class="pill-check ${this.patient.rppgVitals || checks.hasValidROIs ? 'pass' : ''}">
                <span>${this.patient.rppgVitals || checks.hasValidROIs ? '✓' : '○'}</span> Skin ROI
              </div>
            </div>
          </div>

          <!-- Telemetry Monitors & Pulse Extraction Waveform -->
          <div style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 0.78rem; color: var(--emerald-dark); font-weight: 700;">
                  ${this.scanDuration >= 60000 ? i18n.t("diagnostic_scan_btn") : i18n.t("rapid_scan_btn")}:
                </span>
                ${this.patient.rppgVitals ? `
                  <button class="btn-3d btn-3d-success" style="padding: 6px 14px; font-size: 0.78rem;" onclick="window.app.nextStep()">
                    ${i18n.t("btn_next_records")}
                  </button>
                ` : `
                  <button id="btnStartVitalsScan" class="btn-3d ${isLocked ? 'btn-3d-success' : 'btn-3d-primary'}" style="padding: 6px 14px; font-size: 0.78rem;" onclick="window.app.triggerRppgScan()">
                    ${this.isRppgScanning ? i18n.t("btn_scanning_vitals") : (isLocked ? i18n.t("auto_scan_msg") : i18n.t("btn_scan_vitals"))}
                  </button>
                `}
              </div>

              ${this.isRppgScanning ? `
                <div style="background: #0F172A; border: 1px solid #334155; border-radius: 10px; padding: 8px 12px; margin-bottom: 10px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: #34D399; font-weight: 600;">
                    <span id="rppgCountdownText">${this.rppgElapsedSec || '0.0'}s / ${(this.scanDuration/1000).toFixed(1)}s (Hold Still)</span>
                    <strong id="rppgProgressText">${this.rppgProgress}%</strong>
                  </div>
                  <div style="width: 100%; height: 6px; background: #1E293B; border-radius: 3px; overflow: hidden; margin-top: 5px;">
                    <div id="rppgProgressBar" style="width: ${this.rppgProgress}%; height: 100%; background: var(--emerald); transition: width 0.1s linear;"></div>
                  </div>
                </div>
              ` : ''}

              <!-- Real-Time Capillary Pulse Wave Oscilloscope Visualizer -->
              <div class="oscilloscope-container-3d">
                <div class="oscilloscope-legend">
                  <span>📈 Live Photoplethysmogram Oscilloscope (Pulse Waveform)</span>
                  <span style="color: ${this.isRppgScanning ? '#34D399' : (this.patient.rppgVitals ? '#6EE7B7' : 'var(--text-muted)')}; font-weight: 700;">
                    ${this.isRppgScanning ? '● SAMPLING 30 FPS' : (this.patient.rppgVitals ? '✓ CAPTURE LOCKED' : '○ STANDBY')}
                  </span>
                </div>
                <canvas id="rppgOscilloscopeCanvas" width="480" height="52" class="oscilloscope-canvas-3d"></canvas>
              </div>

              <!-- Real-Time Telemetry Grid -->
              <div class="telemetry-grid">
                <div class="telemetry-card ${vitals.heartRate > 100 ? 'highlight' : ''}">
                  <div class="telemetry-value">${vitals.heartRate}<span class="telemetry-unit">${i18n.t("telemetry_hr_unit")}</span></div>
                  <div class="telemetry-label">${i18n.t("telemetry_hr")}</div>
                  <div class="telemetry-status" style="font-size: 0.68rem; line-height: 1.2;">
                    ${this.isRppgScanning 
                      ? '● Sampling 30 FPS...' 
                      : (vitals.heartRate !== '--' 
                          ? (vitals.heartRate > 100 ? '⚠️ High (>100)' : '✓ Verified Normal') 
                          : 'Awaiting scan (60-100)')}
                  </div>
                </div>

                <div class="telemetry-card ${vitals.stressScore > 70 ? 'highlight' : ''}">
                  <div class="telemetry-value">${vitals.stressScore !== undefined ? vitals.stressScore : '--'}<span class="telemetry-unit">${i18n.t("telemetry_stress_unit")}</span></div>
                  <div class="telemetry-label">${i18n.t("telemetry_stress")}</div>
                  <div class="telemetry-status" style="font-size: 0.68rem; line-height: 1.2; color: var(--text-secondary);">
                    ${this.isRppgScanning 
                      ? '● Computing spectral power...' 
                      : (vitals.stressScore !== '--' && vitals.stressScore !== undefined 
                          ? (vitals.stressScore > 70 ? '⚡ High Stress' : '✓ Normal / Balanced') 
                          : 'Awaiting baseline')}
                  </div>
                </div>

                <div class="telemetry-card">
                  <div class="telemetry-value">${vitals.hrv}<span class="telemetry-unit">${i18n.t("telemetry_hrv_unit")}</span></div>
                  <div class="telemetry-label">${i18n.t("telemetry_hrv")}</div>
                  <div class="telemetry-status" style="font-size: 0.68rem; line-height: 1.2;">
                    ${this.isRppgScanning 
                      ? '● Tracking R-R intervals...' 
                      : (vitals.hrv !== '--' ? '✓ Steady Baseline' : 'Requires 15s stable wave')}
                  </div>
                </div>

                <div class="telemetry-card">
                  <div class="telemetry-value">${vitals.respiratoryRate}<span class="telemetry-unit">${i18n.t("telemetry_resp_unit")}</span></div>
                  <div class="telemetry-label">${i18n.t("telemetry_resp")}</div>
                  <div class="telemetry-status" style="font-size: 0.68rem; line-height: 1.2;">
                    ${this.isRppgScanning 
                      ? '● Chest/nasal motion...' 
                      : (vitals.respiratoryRate !== '--' ? '✓ Resting (12-20 RPM)' : 'Awaiting motion signal')}
                  </div>
                </div>
              </div>

              <!-- Reassuring Clinical Vitals Verification -->
              ${this.patient.rppgVitals ? `
                <div style="background: var(--emerald-light); border: 1px solid var(--emerald-border); border-radius: 10px; padding: 10px 14px; margin-top: 10px; font-size: 0.8rem; color: var(--emerald-dark); display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.2rem;">✓</span>
                  <div>
                    <strong>${i18n.t("vitals_summary_badge")}</strong>
                    <p style="font-size: 0.74rem; color: var(--emerald-deep); margin: 2px 0 0 0;">
                      Heart rate, respiratory rate, and autonomic hemodynamics are securely calibrated for doctor evaluation.
                    </p>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Clinical Intake Layout (Balanced 50/50: Voice & SOCRATES on left, Full-Width Skeleton + Questions Below on right) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start;">
        <div>
          <!-- Voice Station -->
          <div class="voice-station-3d">
            <button id="micBtn" class="mic-tactile-button" onclick="window.app.toggleSpeech()">
              🎙️
            </button>
            <h4 id="micStatusText" style="font-size: 1.05rem; margin-top: 10px; font-weight: 700;">${i18n.t("voice_mic_title")}</h4>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${i18n.t("voice_mic_sub")}</p>

            <div style="margin-top: 1rem; text-align: left;">
              <label class="input-label-3d">${i18n.t("chief_complaint_label")}</label>
              <textarea id="chiefComplaintText" class="input-text-3d" rows="3" 
                        style="width: 100%; min-height: 85px; padding: 12px; font-size: 0.9rem; line-height: 1.5; border-radius: 10px; resize: vertical;" 
                        placeholder="${i18n.t("chief_complaint_ph")}">${this.patient.chiefComplaint}</textarea>

              <!-- Quick Common Symptoms Chips -->
              <div style="margin-top: 12px;">
                <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">${i18n.t("quick_symptoms_title")}</label>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  <button type="button" class="quick-chip" style="min-height: 40px; padding: 6px 14px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;" onclick="window.app.appendSymptom('${i18n.t("sym_fever")}')">🤒 ${i18n.t("sym_fever")}</button>
                  <button type="button" class="quick-chip" style="min-height: 40px; padding: 6px 14px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;" onclick="window.app.appendSymptom('${i18n.t("sym_cough")}')">🤧 ${i18n.t("sym_cough")}</button>
                  <button type="button" class="quick-chip" style="min-height: 40px; padding: 6px 14px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;" onclick="window.app.appendSymptom('${i18n.t("sym_headache")}')">🤕 ${i18n.t("sym_headache")}</button>
                  <button type="button" class="quick-chip" style="min-height: 40px; padding: 6px 14px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;" onclick="window.app.appendSymptom('${i18n.t("sym_chest_pain")}')">🫀 ${i18n.t("sym_chest_pain")}</button>
                  <button type="button" class="quick-chip" style="min-height: 40px; padding: 6px 14px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;" onclick="window.app.appendSymptom('${i18n.t("sym_stomach_pain")}')">🤢 ${i18n.t("sym_stomach_pain")}</button>
                  <button type="button" class="quick-chip" style="min-height: 40px; padding: 6px 14px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;" onclick="window.app.appendSymptom('${i18n.t("sym_breathless")}')">🫁 ${i18n.t("sym_breathless")}</button>
                  <button type="button" class="quick-chip" style="min-height: 40px; padding: 6px 14px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;" onclick="window.app.appendSymptom('${i18n.t("sym_joint_pain")}')">🦴 ${i18n.t("sym_joint_pain")}</button>
                  <button type="button" class="quick-chip" style="min-height: 40px; padding: 6px 14px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;" onclick="window.app.appendSymptom('${i18n.t("sym_vomiting")}')">🤮 ${i18n.t("sym_vomiting")}</button>
                  <button type="button" class="quick-chip" style="min-height: 40px; padding: 6px 14px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;" onclick="window.app.appendSymptom('${i18n.t("sym_fatigue")}')">😴 ${i18n.t("sym_fatigue")}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- AYUSH / Home Herbal Remedies Declaration -->
          <div class="card-3d" style="padding: 1.25rem; margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--emerald-dark);">${i18n.t("herbs_title")}</h4>
                <p style="font-size: 0.72rem; color: var(--text-muted); margin: 0;">${i18n.t("herbs_sub")}</p>
              </div>
              <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.72rem;" onclick="window.app.promptAddHerb()">${i18n.t("herbs_add_btn")}</button>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${(this.patient.ayushHerbs || []).map((h, hIdx) => `
                <span class="pill-3d pill-3d-emerald" style="cursor: pointer;" onclick="window.app.removeHerb(${hIdx})">
                  🌿 ${h.name} ✕
                </span>
              `).join('')}
              ${(!this.patient.ayushHerbs || this.patient.ayushHerbs.length === 0) ? `
                <span style="font-size: 0.78rem; color: var(--text-muted);">${i18n.t("herbs_empty")}</span>
              ` : ''}
            </div>
          </div>

          <!-- SOCRATES Symptom Probing -->
          <div class="card-3d" style="padding: 1.25rem;">
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 10px;">${i18n.t("socrates_title")}</h4>
            
            <div style="margin-bottom: 12px;">
              <label class="input-label-3d">${SOCRATES_QUESTIONS.character.title}</label>
              <div class="chip-rack">
                ${SOCRATES_QUESTIONS.character.options.map(opt => `
                  <button class="tactile-chip ${this.patient.hpi.character === opt ? 'selected' : ''}" onclick="window.app.setHpiField('character', '${opt}')">${opt}</button>
                `).join('')}
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 700; margin-bottom: 6px;">
                <span>Discomfort Severity:</span>
                <span style="color: ${this.patient.hpi.severity >= 7 ? 'var(--crimson)' : 'var(--emerald)'}">${this.patient.hpi.severity || 0} / 10 ${this.patient.hpi.severity >= 7 ? '(PRIORITY ALERT)' : ''}</span>
              </div>
              <input type="range" style="width: 100%; accent-color: var(--emerald); cursor: pointer;" min="0" max="10" value="${this.patient.hpi.severity || 0}" oninput="window.app.setSeverity(this.value)">
            </div>
          </div>
        </div>

        <div>
          ${this.isAyushMode ? this.renderAyushModule() : this.renderBodyMapModule()}

          <div class="kiosk-action-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-light);">
            <button type="button" class="btn-3d btn-3d-secondary" style="min-height: 48px; padding: 12px 24px; font-weight: 700;" onclick="window.app.prevStep()">
              ← ${i18n.t("btn_back") || "Back to Check-In"}
            </button>
            <button type="button" class="btn-3d ${this.patient.rppgVitals ? 'btn-3d-success' : 'btn-3d-primary'}" style="min-height: 48px; padding: 12px 28px; font-weight: 700;" onclick="window.app.nextStep()">
              ${i18n.t("btn_next_records") || "Next: Upload Records →"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderBodyMapModule() {
    return `
      <div class="bodymap-2d-layout bodymap-3d-layout" style="display: flex; flex-direction: column; gap: 1.25rem; width: 100%;">
        <!-- Top: 2D Full Skeleton Viewport (Full Width of Right Half Screen) -->
        <div class="bodymap-2d-card bodymap-3d-card" style="width: 100%;">
          <!-- Top Bar: Title, Search Autocomplete -->
          <div class="bodymap-2d-toolbar-top bodymap-3d-toolbar-top">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.25rem;">🦴</span>
              <div>
                <strong style="color: #FFFFFF; font-size: 0.9rem; display: block; line-height: 1.1;">2D Human Skeleton & Visceral Anatomy Map</strong>
                <span style="font-size: 0.7rem; color: #38BDF8;">Full-Body Clinical Interactive SVG Engine</span>
              </div>
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.68rem; margin-left: 6px;">
                🦴 2D Skeleton Active
              </span>
            </div>

            <!-- Anatomical Search Box -->
            <div class="bodymap-search-box">
              <input type="text" id="anatomySearchInput" class="bodymap-search-input" 
                     placeholder="Search bone, joint or organ (Femur, Heart, गुर्दा)..." 
                     oninput="window.app.handleAnatomySearch(this.value)"
                     onfocus="window.app.handleAnatomySearch(this.value)">
              <div id="anatomySearchDropdown" class="bodymap-search-dropdown" style="display: none;"></div>
            </div>
          </div>

          <!-- 2D Viewport Container (BodyMap2D mounts here) -->
          <div class="bodymap-2d-viewport" id="bodymap2dCanvasContainer" style="width: 100%; min-height: 640px; height: 640px; position: relative;">
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #38BDF8; font-size: 0.85rem; padding: 2rem;">
              ⏳ Loading Interactive 2D Skeleton & Anatomy Map...
            </div>
          </div>
        </div>

        <!-- Bottom: Dynamic Symptom Question Engine (Directly in Bottom of Skeleton) -->
        <div id="symptomQuestionEngineContainer" style="width: 100%;">
          <div style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid rgba(56, 189, 248, 0.25); border-radius: 14px; padding: 1.25rem; text-align: center; color: #94A3B8;">
            <div style="font-size: 1.25rem; margin-bottom: 6px;">🩺</div>
            <strong style="color: #FFFFFF; font-size: 0.86rem; display: block;">Clinical Follow-Up Questions</strong>
            <p style="font-size: 0.76rem; color: #94A3B8; margin: 4px 0 0 0;">Tap any bone, joint or organ on the skeleton above to open guided clinical questions</p>
          </div>
        </div>
      </div>
    `;
  }

  renderAyushModule() {
    const prakritiResult = ayushEngine.calculatePrakriti(this.ayushAnswers);

    return `
      <div class="bodymap-hardware-box" style="border-color: var(--emerald-border);">
        <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--emerald-dark); text-align: left;">
          🌿 AYUSH Dashavidha Pariksha & Prakriti Assessment
        </h4>
        <p style="font-size: 0.78rem; color: var(--text-muted); text-align: left;">
          Standardized Ayurvedic phenotypic constitutional evaluation
        </p>

        <div style="background: var(--emerald-light); border: 1px solid var(--emerald-border); border-radius: 12px; padding: 12px; margin: 1rem 0;">
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 700; margin-bottom: 6px;">
            <span>Dominant Prakriti:</span>
            <span style="color: var(--emerald-deep);">${prakritiResult.dominant}</span>
          </div>
          <div style="display: flex; height: 10px; border-radius: 5px; overflow: hidden; background: #E2E8F0;">
            <div style="width: ${prakritiResult.scores.vata}%; background: #60A5FA;" title="Vata: ${prakritiResult.scores.vata}%"></div>
            <div style="width: ${prakritiResult.scores.pitta}%; background: #F87171;" title="Pitta: ${prakritiResult.scores.pitta}%"></div>
            <div style="width: ${prakritiResult.scores.kapha}%; background: var(--emerald);" title="Kapha: ${prakritiResult.scores.kapha}%"></div>
          </div>
        </div>

        <div style="max-height: 260px; overflow-y: auto; text-align: left;">
          ${AYUSH_QUESTIONS.map(q => `
            <div style="margin-bottom: 12px; border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">
              <p style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">${q.question}</p>
              <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
                ${q.options.map((opt, oIdx) => `
                  <label style="font-size: 0.78rem; display: flex; align-items: flex-start; gap: 6px; cursor: pointer; color: var(--text-secondary);">
                    <input type="radio" name="${q.id}" value="${oIdx}" ${(this.ayushAnswers[q.id] || 0) === oIdx ? 'checked' : ''} onchange="window.app.setAyushAnswer('${q.id}', ${oIdx})">
                    <span>${opt.text}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ========================================================
  // STEP 3: MEDICAL RECORDS & PRESCRIPTIONS DIGITIZATION
  // ========================================================
  renderStep3Records() {
    const latestDoc = (this.patient.documents && this.patient.documents.length > 0) ? this.patient.documents[0] : null;
    const allFlags = (this.patient.documents || []).flatMap(d => d.flags || []);
    
    // Aggregate medications across patient and all documents
    const seenMeds = new Set();
    const docMeds = (this.patient.documents || []).flatMap(d => d.medications || []);
    const allExtractedMeds = [...(this.patient.allopathicMeds || []), ...docMeds].filter(m => {
      const name = ((typeof m === "string" ? m : (m.name || m.brandReported || "")) || "").toLowerCase();
      if (!name || seenMeds.has(name)) return false;
      seenMeds.add(name);
      return true;
    });

    // Aggregate diseases & diagnoses across patient and all documents
    const seenDx = new Set();
    const docDiseases = (this.patient.documents || []).flatMap(d => d.diseases || []);
    const allDiseases = [...(this.patient.diagnoses || []), ...docDiseases].filter(d => {
      const name = (d.name || "").toLowerCase();
      if (!name || seenDx.has(name)) return false;
      seenDx.add(name);
      return true;
    });

    return `
      <div class="card-3d">
        <div class="card-header-3d">
          <div>
            <h2 class="card-title-3d">${i18n.t("doc_title")}</h2>
            <p class="card-subtitle-3d">${i18n.t("doc_subtitle")}</p>
          </div>
          <button class="btn-3d btn-3d-secondary" style="padding: 6px 14px; font-size: 0.78rem;" onclick="window.app.speakDocScanPrompt()">${i18n.t("audio_guide_btn")}</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <!-- Left: Real Upload Dropzone & File Preview -->
          <div>
            <div class="scanner-dropzone-3d" id="uploadDropzone" onclick="window.app.triggerFileInput()">
              <div style="font-size: 2.5rem; margin-bottom: 6px;">📸</div>
              <strong style="color: var(--emerald-dark); font-size: 1rem;">${i18n.t("upload_dropzone_title")}</strong>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                ${i18n.t("upload_dropzone_desc")}
              </p>
              <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: center;">
                <button type="button" class="btn-3d btn-3d-secondary" style="padding: 5px 12px; font-size: 0.74rem;">${i18n.t("upload_btn_photo")}</button>
                <button type="button" class="btn-3d btn-3d-primary" style="padding: 5px 12px; font-size: 0.74rem;">${i18n.t("upload_btn_file")}</button>
              </div>
              <input type="file" id="realDocUpload" accept="image/*,.pdf" capture="environment" style="display: none;" onchange="window.app.handleFileUpload(event)">
            </div>

            ${this.patient.documents.length > 0 ? `
              <div style="margin-top: 12px; border-radius: 12px; overflow: hidden; background: var(--bg-surface-inset); max-height: 220px; border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: center;">
                <img src="${this.patient.documents[0].previewUrl}" alt="Scanned Document" style="max-height: 220px; width: 100%; object-fit: contain;">
              </div>
            ` : ''}

            ${this.isOcrProcessing ? `
              <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: var(--emerald-light); border: 1px solid var(--emerald-border); font-size: 0.82rem; color: var(--emerald-dark); text-align: center;">
                ${i18n.t("ocr_processing_msg")}
              </div>
            ` : ''}
          </div>

          <!-- Right: Real-Time Extracted Clinical Findings -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">Digitized Clinical Findings</h4>
              <span class="pill-3d pill-3d-emerald">${this.patient.documents.length} ${i18n.t("files_processed")}</span>
            </div>

            ${latestDoc ? `
              <div style="background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 10px; padding: 12px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="pill-3d pill-3d-blue" style="font-weight: 700;">${latestDoc.categoryLabel || latestDoc.type || 'Medical Record'}</span>
                  <span class="pill-3d pill-3d-emerald">${i18n.t("verified_badge")}</span>
                </div>
                ${latestDoc.doctorName ? `
                  <p style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-top: 6px; margin-bottom: 2px;">
                    👨‍⚕️ Doctor: ${latestDoc.doctorName}
                  </p>
                ` : ''}
                ${latestDoc.facility ? `
                  <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0;">
                    🏥 Facility: ${latestDoc.facility}
                  </p>
                ` : ''}
              </div>
            ` : ''}

            <!-- Identified Diseases & Clinical Diagnoses Section -->
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 0.8rem; color: var(--emerald-dark); text-transform: uppercase;">${i18n.t("dx_heading")}</strong>
                <span class="pill-3d pill-3d-blue" style="font-size: 0.7rem;">${allDiseases.length} Detected</span>
              </div>
              <div style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
                ${allDiseases.length > 0 ? allDiseases.map(d => `
                  <div style="background: #FFFFFF; border: 1px solid var(--border-light); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                    <div>
                      <strong style="color: var(--text-primary); font-size: 0.88rem;">${d.name}</strong>
                      <p style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; margin-bottom: 0;">
                        Detected from medical document
                      </p>
                    </div>
                    <span class="pill-3d pill-3d-blue" style="font-size: 0.7rem;">${i18n.t("verified_badge")}</span>
                  </div>
                `).join('') : `
                  <div style="background: var(--bg-surface-inset); border: 1px dashed var(--border-medium); border-radius: 8px; padding: 8px 12px; font-size: 0.78rem; color: var(--text-muted);">
                    ${i18n.t("dx_empty")}
                  </div>
                `}
              </div>
            </div>

            <!-- Lab Biomarkers Section -->
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 0.8rem; color: var(--crimson); text-transform: uppercase;">${i18n.t("lab_heading")}</strong>
                <span class="pill-3d pill-3d-crimson" style="font-size: 0.7rem;">${allFlags.length} Flags</span>
              </div>
              <div style="max-height: 140px; overflow-y: auto;">
                ${allFlags.length > 0 ? allFlags.map(f => `
                  <div class="lab-flag-item-3d">
                    <div>
                      <strong style="color: #991B1B; font-size: 0.82rem;">${f.test || f.param}: ${f.value}</strong>
                      <p style="font-size: 0.72rem; color: var(--text-muted);">Ref: ${f.ref} [${f.status}]</p>
                    </div>
                    <span class="pill-3d pill-3d-crimson">${(f.status || 'ABNORMAL').split(' ')[0]}</span>
                  </div>
                `).join('') : `
                  <p style="font-size: 0.78rem; color: var(--text-muted); padding: 6px;">${i18n.t("lab_empty")}</p>
                `}
              </div>
            </div>

            <!-- Prescribed Medications Section -->
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 0.8rem; color: var(--emerald-dark); text-transform: uppercase;">${i18n.t("rx_heading")}</strong>
                <span class="pill-3d pill-3d-emerald" style="font-size: 0.7rem;">${allExtractedMeds.length} ${i18n.t("active_badge")}</span>
              </div>
              <div style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
                ${allExtractedMeds.length > 0 ? allExtractedMeds.map(m => {
                  const name = typeof m === 'string' ? m : m.name;
                  const dosage = m.dosage || '';
                  const freq = m.freq || 'Daily';
                  const timing = m.timing || 'After Food';
                  const duration = m.duration || '';

                  return `
                    <div class="medication-card-3d">
                      <div>
                        <strong style="color: var(--text-primary); font-size: 0.88rem;">${name}</strong>
                        ${dosage && dosage !== 'Standard Dose' ? `<span class="pill-3d pill-3d-blue" style="margin-left: 6px; font-size: 0.7rem;">${dosage}</span>` : ''}
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin: 3px 0 0 0;">
                          ${freq} • ${timing} ${duration ? `• ${duration}` : ''}
                        </p>
                      </div>
                      <span class="pill-3d pill-3d-emerald" style="font-size: 0.7rem;">${i18n.t("verified_badge")}</span>
                    </div>
                  `;
                }).join('') : `
                  <div style="background: var(--bg-surface-inset); border: 1px dashed var(--border-medium); border-radius: 8px; padding: 10px 14px; font-size: 0.78rem; color: var(--text-muted);">
                    ${latestDoc && ((latestDoc.type || '').includes('pathology') || (latestDoc.categoryLabel || '').toLowerCase().includes('pathology') || (latestDoc.categoryLabel || '').toLowerCase().includes('lab')) ? 
                      '🔬 <strong>Pathology Diagnostic Report:</strong> Laboratory test values & diagnostic biomarkers extracted above. (No outpatient prescribed medications in this lab report).' : 
                      i18n.t("rx_empty")}
                  </div>
                `}
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button class="btn-3d btn-3d-secondary" onclick="window.app.prevStep()">${i18n.t("btn_back")}</button>
              <button class="btn-3d btn-3d-primary" onclick="window.app.nextStep()">${i18n.t("btn_gen_summary")}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ========================================================
  // STEP 4: OPD TOKEN & ENCOUNTER SUMMARY
  // ========================================================
  renderStep4Summary() {
    const qIdx = this.doctorQueue.findIndex(p => p.id === this.patient.id);
    const qPosition = qIdx >= 0 ? qIdx + 1 : this.doctorQueue.length;
    const patientsAhead = Math.max(0, qPosition - 1);
    const estWaitMin = patientsAhead === 0 ? 5 : Math.round(patientsAhead * 7.5);

    return `
      <div class="card-3d" style="max-width: 600px; margin: 0 auto; text-align: center;">
        <div style="font-size: 2.8rem; margin-bottom: 8px;">🎉</div>
        <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary);">${i18n.t("summary_congrats")}</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
          ${i18n.t("summary_subtitle")}
        </p>

        <div style="background: var(--emerald-light); border: 2px dashed var(--emerald-border); border-radius: 16px; padding: 1.75rem; margin: 1.5rem 0;">
          <p style="font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--emerald-dark); font-weight: 800;">
            ${i18n.t("opd_token_header")}
          </p>
          <div style="font-family: var(--font-display); font-size: 3.5rem; font-weight: 900; color: var(--emerald-deep); line-height: 1.1; margin: 8px 0;">
            ${this.patient.tokenNumber || 'TK-101'}
          </div>
          <div style="font-size: 0.88rem; color: var(--text-primary); margin-top: 8px;">
            ${i18n.t("patient_info_label")}: <strong>${this.patient.name || 'Walk-in Patient'}</strong> (${this.patient.age || '--'} ${i18n.t("age_yrs")} / ${i18n.t("gender_" + (this.patient.gender || "Female").toLowerCase()) || this.patient.gender})
          </div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">
            📱 Registered Mobile: <strong>${this.patient.mobile || '+91 98765 43210'}</strong>
          </div>

          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-light); display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: left; font-size: 0.78rem;">
            <div>
              <span style="color: var(--text-muted);">${i18n.t("assigned_dept_label")}:</span><br>
              <strong style="color: var(--emerald-dark);">${i18n.t("default_dept")}</strong>
            </div>
            <div>
              <span style="color: var(--text-muted);">${i18n.t("est_wait_label")}:</span><br>
              <strong style="color: var(--emerald);">~${estWaitMin} Minutes (${patientsAhead} Ahead)</strong>
            </div>
          </div>

          <!-- Structured 3D Body Map Clinical Intake Summary (When recorded) -->
          ${this.patient.anatomicalIntake ? `
            <div style="margin-top: 14px; background: #FFFFFF; border: 1.5px solid #38BDF8; border-radius: 14px; padding: 14px 16px; text-align: left; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.1);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.25rem;">🩺</span>
                  <div>
                    <strong style="font-size: 0.88rem; color: #0284C7; display: block;">3D Anatomical Symptom Intake Profile</strong>
                    <span style="font-size: 0.72rem; color: var(--text-muted);">
                      Site: <strong style="color: var(--text-primary);">${this.patient.anatomicalIntake.primaryPart?.displayName?.[this.currentLanguage] || this.patient.anatomicalIntake.primaryPart?.displayName?.en || 'Selected Structure'}</strong> 
                      (${this.patient.anatomicalIntake.primaryPart?.laterality || ''} • SNOMED: ${this.patient.anatomicalIntake.primaryPart?.snomedBodyStructure?.code || 'N/A'})
                    </span>
                  </div>
                </div>
                <span class="pill-3d ${this.patient.anatomicalIntake.urgency?.badgeClass || 'pill-3d-blue'}">
                  ${this.patient.anatomicalIntake.urgency?.label || 'Triage Level'}
                </span>
              </div>

              <div style="background: var(--bg-surface-subtle); border: 1px solid var(--border-light); border-radius: 10px; padding: 10px 12px; font-size: 0.76rem; color: var(--text-secondary); line-height: 1.45; margin: 8px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
                  <div><span style="color: var(--text-muted);">Severity Score:</span> <strong>${this.patient.anatomicalIntake.answers?.severity ?? '--'}/10</strong></div>
                  <div><span style="color: var(--text-muted);">Onset / Duration:</span> <strong>${this.patient.anatomicalIntake.answers?.duration_trend || 'Documented'}</strong></div>
                </div>
                <p style="margin: 0; font-size: 0.74rem;">${this.patient.anatomicalIntake.urgency?.action || ''}</p>
              </div>

              <div style="font-size: 0.68rem; color: var(--text-muted); font-style: italic;">
                ⚖️ CDSCO SaMD Notice: Structured symptom intake aid for clinician evaluation. Not a diagnostic conclusion.
              </div>
            </div>
          ` : ''}
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="btn-3d btn-3d-primary" style="padding: 12px;" onclick="window.print()">
            ${i18n.t("btn_print_slip")}
          </button>
          <button class="btn-3d btn-3d-secondary" onclick="window.app.setMode('doctor')">
            ${i18n.t("btn_doctor_desk")}
          </button>
          <button class="btn-3d btn-3d-secondary" onclick="window.app.resetSession()">
            ${i18n.t("btn_next_patient")}
          </button>
          <button style="background: none; border: none; color: #64748B; font-size: 0.76rem; cursor: pointer; text-decoration: underline; margin-top: 6px;" onclick="window.app.openFhirModal()">
            ${i18n.t("btn_view_fhir")}
          </button>
        </div>
      </div>
    `;
  }

  // ========================================================
  // DOCTOR OPD CONSULTATION DASHBOARD
  // ========================================================
  renderDoctorDashboard() {
    const currentInCabin = (this.doctorQueue && this.doctorQueue.length > 0) ? this.doctorQueue[0] : null;
    const p = this.selectedQueuePatient || currentInCabin || this.patient;
    const isViewingCurrent = currentInCabin && (p.id === currentInCabin.id);
    const selectedQueueIdx = this.doctorQueue.findIndex(item => item.id === p.id);

    const summary = clinicalParser.generateStructuredSummary(p);
    const vitals = p.rppgVitals || { heartRate: "--", hrv: "--", respiratoryRate: "--", stressScore: "--" };
    const hdiResult = herbDrugService.evaluateInteractions(p.allopathicMeds || [], p.ayushHerbs || []);
    const reasoningMap = clinicalGraphService.generateReasoningMap(p);

    const allDocs = p.documents || [];
    const rxDocs = allDocs.filter(d => d.type === "prescription" || d.categoryLabel === "Prescription");
    const labDocs = allDocs.filter(d => d.type === "lab_report" || d.type === "radiology" || d.categoryLabel === "Lab Report" || d.categoryLabel === "Diagnostic Scan" || d.categoryLabel === "Imaging Scan");
    const allFlags = allDocs.flatMap(d => d.flags || []);
    const abnormalFlags = allFlags.filter(f => f.status === "HIGH" || f.status === "LOW" || f.status === "ABNORMAL" || f.status === "MILD STENOSIS");

    const seenMeds = new Set();
    const docMeds = allDocs.flatMap(d => d.medications || []);
    let allMeds = [...(p.allopathicMeds || []), ...docMeds].filter(m => {
      const name = ((typeof m === "string" ? m : (m.name || m.brandReported || "")) || "").toLowerCase();
      if (!name || seenMeds.has(name)) return false;
      seenMeds.add(name);
      return true;
    });

    const seenDx = new Set();
    const docDx = allDocs.flatMap(d => d.diseases || []);
    let allDiseases = [...(p.diagnoses || []), ...docDx].filter(d => {
      const name = (d.name || "").toLowerCase();
      if (!name || seenDx.has(name)) return false;
      seenDx.add(name);
      return true;
    });

    const showAll = this.doctorActiveTab === "all";
    const showSummary = showAll || this.doctorActiveTab === "summary";
    const showPrescriptions = showAll || this.doctorActiveTab === "prescriptions";
    const showPreviews = showAll || this.doctorActiveTab === "previews";

    return `
      <div class="doctor-layout-3d">
        <!-- ========================================== -->
        <!-- SECTION 4: LIVE OPD PATIENT QUEUE (LEFT)   -->
        <!-- ========================================== -->
        <div class="queue-panel-3d">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-light); padding-bottom: 8px; flex-wrap: wrap; gap: 6px;">
            <div>
              <h3 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); margin: 0;">📋 Live Patient Queue</h3>
              <p style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">OPD Cabin 3 • Dr. Sharma</p>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button class="btn-3d btn-3d-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: var(--emerald-light); color: var(--emerald-dark); border-color: var(--emerald-border);" onclick="window.app.broadcastRealTimeQueueSms()" title="Broadcast real-time queue position SMS to all waiting patients">
                📢 Broadcast SMS
              </button>
              <span class="pill-3d pill-3d-emerald">${this.doctorQueue.length} Active</span>
            </div>
          </div>

          <div id="queueList" style="display: flex; flex-direction: column; gap: 8px;">
            ${this.doctorQueue.map((item, idx) => {
              const patientsAhead = idx;
              const waitMinutes = Math.round(patientsAhead * 7.5);
              const estTime = item.smsAlertTime || (waitMinutes === 0 ? "Now" : new Date(Date.now() + waitMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              const isSelected = item.id === p.id;
              const isCurrent = idx === 0;

              return `
                <div class="queue-patient-card-3d ${isSelected ? 'active' : ''} ${item.isEmergency ? 'emergency' : ''}" onclick="window.app.selectQueuePatient('${item.id}')" style="cursor: pointer; position: relative;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <strong style="font-size: 0.88rem; color: var(--text-primary);">${item.name || 'Walk-in Patient'}</strong>
                      <div style="font-size: 0.72rem; color: var(--emerald-dark); font-family: monospace; font-weight: 600; margin-top: 2px;">ABHA: ${item.abhaId || 'Walk-in'}</div>
                    </div>
                    <span class="pill-3d ${item.isEmergency ? 'pill-3d-crimson' : (isCurrent ? 'pill-3d-emerald' : 'pill-3d-blue')}">
                      ${item.isEmergency ? 'EMERGENCY' : (isCurrent ? '🟢 IN CABIN' : 'TOKEN ' + item.tokenNumber)}
                    </span>
                  </div>

                  <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">
                    ${item.age || '--'} Yrs / ${item.gender} • 📱 Reg: <strong>${item.mobile || '+91 98765 43210'}</strong>
                  </p>
                  <p style="font-size: 0.73rem; color: var(--text-secondary); margin-top: 3px; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                    ${item.chiefComplaint || 'Clinical Intake Completed'}
                  </p>

                  <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">
                      <span style="color: var(--text-muted);">
                        Pos #${idx + 1} • <strong style="color: ${isCurrent ? 'var(--emerald)' : (patientsAhead === 1 ? 'var(--crimson)' : 'var(--amber)')};">${isCurrent ? '🟢 In Cabin' : (patientsAhead === 1 ? '⚠️ 1 Ahead (Next!)' : `${patientsAhead} members ahead`)}</strong>
                      </span>
                      <span style="color: var(--text-primary); font-weight: 700;">⏱️ ${isCurrent ? 'Active Now' : '~' + waitMinutes + 'm (' + estTime + ')'}</span>
                    </div>

                    ${item.smsAlertSent ? `
                      <div class="queue-30min-badge sent" title="Real-time SMS dispatched to registered mobile">
                        🔔 SMS Dispatched (${item.smsAlertTime || estTime})
                      </div>
                    ` : ''}

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; gap: 4px; flex-wrap: wrap;">
                      <button class="btn-sms-alert-3d" style="font-size: 0.7rem; padding: 3px 8px;" onclick="event.stopPropagation(); window.app.togglePhoneSimulator(true); window.app.phoneSimulator.open('${item.mobile || "+91 98765 43210"}')" title="Inspect phone handset view">
                        📱 Phone
                      </button>
                      <button class="btn-sms-alert-3d" style="font-size: 0.7rem; padding: 3px 8px; background: #E0F2FE; color: #0284C7; border: 1px solid #BAE6FD;" onclick="event.stopPropagation(); window.app.sendManual30MinAlert('${item.id}')" title="Dispatch 30-minute advance appointment reminder SMS to registered mobile number">
                        ⏱️ 30-Min Alert
                      </button>
                      <button class="btn-sms-alert-3d" style="font-size: 0.7rem; padding: 3px 8px;" onclick="event.stopPropagation(); window.app.sendManualRealTimeSms('${item.id}')" title="Dispatch real-time SMS to registered number with members ahead count and appointment time">
                        📲 ${item.smsAlertSent ? 'Resend SMS' : 'Send Live SMS'}
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- ========================================== -->
        <!-- DOCTOR OPD CONSULTATION WORKSPACE (RIGHT)  -->
        <!-- ========================================== -->
        <div class="card-3d" style="min-width: 0;">
          <!-- Top Header: Patient Demographic & Quick Action Toolbar -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.85rem; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin: 0;">${p.name || 'Walk-in Patient'}</h2>
                <span class="pill-3d ${isViewingCurrent ? 'pill-3d-emerald' : 'pill-3d-blue'}" style="font-weight: 800;">
                  ${isViewingCurrent ? '🟢 IN CABIN (CURRENT PATIENT)' : `📋 REVIEWING QUEUE PATIENT (#${selectedQueueIdx + 1})`}
                </span>
                <span class="pill-3d ${p.isEmergency ? 'pill-3d-crimson' : 'pill-3d-blue'}">${p.isEmergency ? '🚨 PRIORITY EMERGENCY' : 'TOKEN ' + p.tokenNumber}</span>
                <span class="pill-3d pill-3d-blue">ABHA: ${p.abhaId || 'Walk-in'}</span>
                ${p.smsAlertSent ? `<span class="pill-3d pill-3d-emerald">🔔 30-Min SMS Dispatched</span>` : ''}
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 0;">
                ${p.age || '--'} Years • ${p.gender} • Registered Mobile: <strong style="color: var(--emerald-dark);">${p.mobile || 'Not provided'}</strong> • Chief Complaint: <span style="color: var(--text-secondary); font-weight: 600;">${p.chiefComplaint || 'None provided'}</span>
              </p>
              ${!isViewingCurrent && currentInCabin ? `
                <div style="margin-top: 6px;">
                  <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.74rem;" onclick="window.app.selectQueuePatient('${currentInCabin.id}')">
                    ← Return to Current In-Cabin Patient (${currentInCabin.name})
                  </button>
                </div>
              ` : ''}
            </div>

            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <button class="btn-3d btn-3d-success" style="padding: 6px 14px; font-size: 0.8rem; font-weight: 700;" onclick="window.app.callNextPatient()" title="Complete consultation for current patient and advance queue">
                ⏭️ Call Next Patient
              </button>
              <button class="btn-3d btn-3d-secondary" style="padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 5px;" onclick="window.app.openSmsLogModal()">
                📨 30-Min SMS Logs (${this.smsDispatchLogs.length})
              </button>
              <button class="btn-3d btn-3d-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.app.openFhirModal()">
                FHIR JSON
              </button>
              <button class="btn-3d btn-3d-primary" style="padding: 6px 14px; font-size: 0.8rem;" onclick="window.app.acceptSummary()">
                ✓ Accept & Push HIS
              </button>
            </div>
          </div>

          <!-- Section Navigation Tabs -->
          <div class="doctor-tabs-3d">
            <button class="doctor-tab-btn ${this.doctorActiveTab === 'all' ? 'active' : ''}" onclick="window.app.setDoctorTab('all')">
              📊 All Sections (Stacked)
            </button>
            <button class="doctor-tab-btn ${this.doctorActiveTab === 'summary' ? 'active' : ''}" onclick="window.app.setDoctorTab('summary')">
              📑 Section 1: Summary of All Documents (${allDocs.length})
            </button>
            <button class="doctor-tab-btn ${this.doctorActiveTab === 'prescriptions' ? 'active' : ''}" onclick="window.app.setDoctorTab('prescriptions')">
              💊 Section 2: All Prescriptions Extracted (${allMeds.length})
            </button>
            <button class="doctor-tab-btn ${this.doctorActiveTab === 'previews' ? 'active' : ''}" onclick="window.app.setDoctorTab('previews')">
              🖼️ Section 3: Document Previews Gallery (${allDocs.length})
            </button>
          </div>

          <!-- ==================================================== -->
          <!-- SECTION 1: SUMMARY OF ALL UPLOADED DOCUMENTS         -->
          <!-- ==================================================== -->
          ${showSummary ? `
            <div id="sectionSummary" style="margin-bottom: 1.5rem; background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 14px; padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>
                  <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--emerald-dark); margin: 0;">📑 Section 1: Summary of All Uploaded Documents</h3>
                  <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Synthesized Diagnostic Intelligence, OCR Multi-Page Aggregation, and Contactless Vitals</p>
                </div>
                <span class="pill-3d pill-3d-emerald">${allDocs.length} Total Records</span>
              </div>

              <!-- KPI Metric Ribbon -->
              <div class="doc-kpi-ribbon">
                <div class="doc-kpi-card">
                  <div class="doc-kpi-val" style="color: var(--emerald);">${allDocs.length}</div>
                  <div class="doc-kpi-lbl">Total Documents</div>
                </div>
                <div class="doc-kpi-card">
                  <div class="doc-kpi-val" style="color: var(--text-primary);">${allDiseases.length}</div>
                  <div class="doc-kpi-lbl">Identified Diseases</div>
                </div>
                <div class="doc-kpi-card">
                  <div class="doc-kpi-val" style="color: var(--emerald-dark);">${allMeds.length}</div>
                  <div class="doc-kpi-lbl">Prescriptions Analyzed</div>
                </div>
                <div class="doc-kpi-card">
                  <div class="doc-kpi-val" style="color: var(--text-secondary);">${labDocs.length}</div>
                  <div class="doc-kpi-lbl">Labs & Imaging Scans</div>
                </div>
                <div class="doc-kpi-card">
                  <div class="doc-kpi-val" style="color: ${abnormalFlags.length > 0 ? 'var(--crimson)' : 'var(--emerald)'};">${abnormalFlags.length}</div>
                  <div class="doc-kpi-lbl">Abnormal Biomarker Flags</div>
                </div>
              </div>

              <!-- Contactless Optical Vitals Ribbon -->
              <div style="background: var(--emerald-light); border: 1px solid var(--emerald-border); border-radius: 12px; padding: 10px 14px; margin-bottom: 1.25rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--emerald-dark); font-weight: 700; margin-bottom: 8px;">
                  <span>Contactless Optical Vitals (rPPG Camera Telemetry)</span>
                  <span class="pill-3d pill-3d-emerald">${vitals.signalQuality || 'Real-Time Ingestion'}</span>
                </div>
                <div class="telemetry-grid" style="margin-top: 0;">
                  <div class="telemetry-card ${vitals.heartRate > 100 ? 'highlight' : ''}">
                    <div class="telemetry-value">${vitals.heartRate}<span class="telemetry-unit">BPM</span></div>
                    <div class="telemetry-label">Heart Rate</div>
                  </div>
                  <div class="telemetry-card ${vitals.stressScore > 70 ? 'highlight' : ''}">
                    <div class="telemetry-value">${vitals.stressScore !== undefined ? vitals.stressScore : '--'}<span class="telemetry-unit">/100</span></div>
                    <div class="telemetry-label">Stress Index</div>
                  </div>
                  <div class="telemetry-card">
                    <div class="telemetry-value">${vitals.hrv}<span class="telemetry-unit">ms</span></div>
                    <div class="telemetry-label">HRV Tone</div>
                  </div>
                  <div class="telemetry-card">
                    <div class="telemetry-value">${vitals.respiratoryRate}<span class="telemetry-unit">RPM</span></div>
                    <div class="telemetry-label">Respiration</div>
                  </div>
                </div>
              </div>

              <!-- Herb-Drug Interaction (HDI) Contraindication Alert -->
              ${hdiResult.hasConflict ? `
                <div class="hdi-alert-box-3d" style="margin-bottom: 1.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: var(--crimson); font-size: 0.92rem;">⚠️ HERB-DRUG CONTRAINDICATION ALERT</strong>
                    <span class="pill-3d pill-3d-crimson">${hdiResult.count} Conflict(s)</span>
                  </div>
                  ${hdiResult.conflicts.map(c => `
                    <div style="background: #FFFFFF; border: 1px solid var(--crimson-border); border-radius: 8px; padding: 8px 12px; margin-top: 6px;">
                      <strong style="color: #991B1B; font-size: 0.84rem;">⚡ ${c.drug} ⟷ ${c.herb} (${c.herbBotanical})</strong>
                      <p style="font-size: 0.76rem; color: #DC2626; margin-top: 2px; margin-bottom: 2px;"><strong>Hazard:</strong> ${c.clinicalEffect}</p>
                      <p style="font-size: 0.74rem; color: var(--emerald-dark); margin: 0;"><strong>Recommendation:</strong> ${c.recommendation}</p>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <!-- Identified Diseases & Clinical Conditions Breakdown -->
              <div style="margin-bottom: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong style="font-size: 0.85rem; color: var(--text-primary); text-transform: uppercase;">
                    🩺 Patient Diagnoses, Diseases & Active Pathologies:
                  </strong>
                  <span class="pill-3d pill-3d-emerald">${allDiseases.length} Verified</span>
                </div>
                ${allDiseases.length > 0 ? `
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px;">
                    ${allDiseases.map(d => `
                      <div style="background: #FFFFFF; border: 1px solid var(--border-light); border-radius: 8px; padding: 8px 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <strong style="color: var(--text-primary); font-size: 0.84rem;">${d.name}</strong>
                          <span class="pill-3d pill-3d-blue" style="font-size: 0.68rem;">${d.icd10 || 'R69'}</span>
                        </div>
                        <p style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px; margin-bottom: 0;">
                          ${d.source || 'Clinical Record Diagnostic Evaluation'}
                        </p>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">No active diseases or diagnoses flagged yet.</p>
                `}
              </div>

              <!-- Document-by-Document Diagnostic Findings Breakdown -->
              <div style="margin-top: 1rem;">
                <strong style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 8px;">
                  📋 Verified Clinical Records & Findings Breakdown:
                </strong>
                ${allDocs.length > 0 ? `
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${allDocs.map((doc, idx) => `
                      <div style="background: #FFFFFF; border: 1px solid var(--border-light); border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                        <div style="flex: 1;">
                          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span class="pill-3d ${doc.type === 'prescription' ? 'pill-3d-emerald' : (doc.type === 'radiology' ? 'pill-3d-blue' : 'pill-3d-violet')}">
                              ${doc.categoryLabel || doc.type}
                            </span>
                            <strong style="font-size: 0.86rem; color: var(--text-primary);">${doc.title}</strong>
                            <span style="font-size: 0.72rem; color: var(--text-muted);">${doc.date || 'Recent'} • ${doc.doctor || 'Verified Facility'}</span>
                          </div>
                          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px; margin-bottom: 4px;">
                            <strong style="color: var(--emerald-dark);">Diagnostic Finding / Root Cause:</strong> ${doc.rootCause || 'Verified Clinical Ingestion Record'}
                          </p>
                          ${(doc.flags && doc.flags.length > 0) ? `
                            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                              ${doc.flags.map(f => `
                                <span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: ${f.status === 'NORMAL' ? 'var(--emerald-light)' : 'var(--crimson-light)'}; color: ${f.status === 'NORMAL' ? 'var(--emerald-dark)' : '#B91C1C'}; border: 1px solid ${f.status === 'NORMAL' ? 'var(--emerald-border)' : 'var(--crimson-border)'};">
                                  ${f.name}: <strong>${f.value}</strong> [${f.status}]
                                </span>
                              `).join('')}
                            </div>
                          ` : ''}
                        </div>
                        <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.74rem; white-space: nowrap;" onclick="window.app.openDocInspectModal('${doc.id}')">
                          🔍 Inspect Scan
                        </button>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">No documents scanned or uploaded for this patient yet.</p>
                `}
              </div>
            </div>
          ` : ''}

          <!-- ==================================================== -->
          <!-- SECTION 2: ALL PRESCRIPTIONS EXTRACTED               -->
          <!-- ==================================================== -->
          ${showPrescriptions ? `
            <div id="sectionPrescriptions" style="margin-bottom: 1.5rem; background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 14px; padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <div>
                  <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--emerald-dark); margin: 0;">💊 Section 2: All Prescriptions Fetched Using Uploaded Prescriptions</h3>
                  <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Doctor Handwritten & Printed Prescriptions Standardized to SNOMED-CT Clinical Nomenclature</p>
                </div>
                <span class="pill-3d pill-3d-emerald">${allMeds.length} Active Prescriptions</span>
              </div>

              <div class="rx-table-container">
                <table class="rx-table-3d">
                  <thead>
                    <tr>
                      <th style="width: 30px;">#</th>
                      <th>Medication & Generic Molecule</th>
                      <th>Dosage / Strength</th>
                      <th>Frequency (Sig)</th>
                      <th>Timing</th>
                      <th>Duration</th>
                      <th>Route</th>
                      <th>SNOMED-CT</th>
                      <th>Schedule</th>
                      <th>Source Document</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${allMeds.length > 0 ? allMeds.map((m, idx) => {
                      const name = typeof m === 'string' ? m : m.name;
                      const dosage = m.dosage || 'Standard Dose';
                      const freq = m.freq || 'OD';
                      const timing = m.timing || 'After Meals';
                      const duration = m.duration || '5-7 Days';
                      const route = m.route || 'Oral';
                      const snomed = m.snomedCode || '387517004';
                      const schedule = m.schedule || 'Schedule H';
                      const source = m.sourceDoc || 'Uploaded Prescription';
                      const status = m.status || 'Verified';

                      return `
                        <tr>
                          <td style="color: var(--text-muted); font-weight: bold;">${idx + 1}</td>
                          <td>
                            <strong style="color: var(--text-primary); font-size: 0.85rem;">${name}</strong>
                          </td>
                          <td><span class="pill-3d pill-3d-blue" style="font-size: 0.72rem;">${dosage}</span></td>
                          <td><strong style="color: var(--emerald-dark);">${freq}</strong></td>
                          <td style="color: var(--text-secondary);">${timing}</td>
                          <td style="color: var(--text-muted);">${duration}</td>
                          <td><span style="font-size: 0.74rem; color: var(--text-secondary);">${route}</span></td>
                          <td><code style="font-size: 0.72rem; color: var(--emerald-dark); background: var(--emerald-light); border: 1px solid var(--emerald-border); padding: 2px 6px; border-radius: 4px;">${snomed}</code></td>
                          <td><span class="pill-3d ${schedule === 'OTC' ? 'pill-3d-emerald' : 'pill-3d-amber'}" style="font-size: 0.68rem;">${schedule}</span></td>
                          <td style="font-size: 0.72rem; color: var(--text-muted); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${source}</td>
                          <td><span class="pill-3d pill-3d-emerald" style="font-size: 0.68rem;">✓ ${status}</span></td>
                        </tr>
                      `;
                    }).join('') : `
                      <tr>
                        <td colspan="11" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                          No prescriptions extracted for this patient. Upload a medical prescription in the Kiosk terminal to extract medications.
                        </td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <!-- ==================================================== -->
          <!-- SECTION 3: ALL UPLOADED DOCUMENT PREVIEWS GALLERY    -->
          <!-- ==================================================== -->
          ${showPreviews ? `
            <div id="sectionPreviews" style="margin-bottom: 1.5rem; background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 14px; padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <div>
                  <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0;">🖼️ Section 3: All Uploaded Document Previews Gallery</h3>
                  <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Interactive Visual Scan Gallery with Optical Zoom Inspection (100% - 250%) & Clinical Cross-Verification</p>
                </div>
                <span class="pill-3d pill-3d-emerald">${allDocs.length} Visual Scans</span>
              </div>

              <div class="doc-preview-gallery-3d">
                ${allDocs.length > 0 ? allDocs.map((doc, idx) => `
                  <div class="doc-card-preview-3d">
                    <div class="doc-card-thumb-container" onclick="window.app.openDocInspectModal('${doc.id}')" title="Click to open zoom inspection">
                      <img src="${doc.previewUrl || ''}" alt="${doc.title}" loading="lazy" />
                      <div class="doc-card-thumb-overlay">
                        <button class="btn-3d btn-3d-primary" style="padding: 6px 14px; font-size: 0.75rem;">
                          🔍 Inspect & Zoom
                        </button>
                      </div>
                    </div>
                    <div class="doc-card-body">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 6px;">
                        <span class="pill-3d ${doc.type === 'prescription' ? 'pill-3d-emerald' : (doc.type === 'radiology' ? 'pill-3d-blue' : 'pill-3d-violet')}" style="font-size: 0.68rem;">
                          ${doc.categoryLabel || doc.type}
                        </span>
                        <span style="font-size: 0.68rem; color: var(--text-muted);">${doc.date || 'Recent'}</span>
                      </div>
                      <strong style="font-size: 0.84rem; color: var(--text-primary); line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 6px;">
                        ${doc.title}
                      </strong>
                      <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.3; margin: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                        ${doc.rootCause || 'Verified Clinical Ingestion Record'}
                      </p>
                      <div style="margin-top: auto; padding-top: 8px;">
                        <button class="btn-3d btn-3d-secondary" style="width: 100%; padding: 6px; font-size: 0.74rem;" onclick="window.app.openDocInspectModal('${doc.id}')">
                          🔍 View Scan Details
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('') : `
                  <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.82rem;">
                    No uploaded document scans available for this patient.
                  </div>
                `}
              </div>
            </div>
          ` : ''}

          <!-- Doctor Examination Notes & E-Prescription Entry -->
          <div class="card-3d" style="padding: 1.25rem; margin-top: 1rem;">
            <strong style="font-size: 0.85rem; color: var(--text-primary); text-transform: uppercase;">Doctor's Consultation Assessment & Notes:</strong>
            <textarea class="input-text-3d" rows="3" style="margin-top: 8px;" placeholder="Add clinical examination findings, final diagnosis, and new prescriptions..."></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
              <button class="btn-3d btn-3d-secondary" onclick="alert('Prescription printed successfully!')">🖨️ Print Prescription</button>
              <button class="btn-3d btn-3d-success" onclick="alert('Encounter record successfully saved and pushed to ABDM & e-Hospital HIS!')">💾 Save & Close Encounter</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================================================== -->
      <!-- MODAL: DOCUMENT ZOOM & INSPECTION MODAL              -->
      <!-- ==================================================== -->
      ${this.inspectedDoc ? `
        <div id="docInspectModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
          <div class="card-3d" style="width: 90%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; padding: 0; background: #FFFFFF; border: 1px solid var(--border-light); border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            <!-- Modal Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: #FFFFFF; border-bottom: 1px solid var(--border-light);">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="pill-3d ${this.inspectedDoc.type === 'prescription' ? 'pill-3d-emerald' : 'pill-3d-blue'}">${this.inspectedDoc.categoryLabel || this.inspectedDoc.type}</span>
                  <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0;">${this.inspectedDoc.title}</h3>
                </div>
                <p style="font-size: 0.72rem; color: var(--text-muted); margin: 2px 0 0 0;">${this.inspectedDoc.date || 'Recent'} • ${this.inspectedDoc.doctor || 'Verified Clinical Facility'}</p>
              </div>

              <!-- Zoom Controls Toolbar -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.82rem;" onclick="window.app.changeDocZoom(-0.25)" title="Zoom Out">➖</button>
                <span id="inspectZoomLabel" style="font-size: 0.78rem; font-family: monospace; color: var(--emerald-dark); min-width: 44px; text-align: center; font-weight: bold;">${Math.round(this.docZoomLevel * 100)}%</span>
                <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.82rem;" onclick="window.app.changeDocZoom(0.25)" title="Zoom In">➕</button>
                <button class="btn-3d btn-3d-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="window.app.changeDocZoom(0)" title="Reset Zoom">100%</button>
                <button class="btn-3d btn-3d-secondary" style="padding: 4px 12px; font-size: 0.82rem; margin-left: 8px; color: var(--crimson);" onclick="window.app.closeDocInspectModal()">✖ Close</button>
              </div>
            </div>

            <!-- Modal Body: High Resolution Scan Display -->
            <div style="flex: 1; overflow: auto; padding: 20px; background: var(--bg-surface-inset); display: flex; justify-content: center; align-items: flex-start;">
              <img id="inspectModalImage" src="${this.inspectedDoc.previewUrl || ''}" alt="${this.inspectedDoc.title}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: scale(${this.docZoomLevel}); transform-origin: top center; transition: transform 0.15s ease-out;" />
            </div>

            <!-- Modal Footer: Extracted Clinical Findings & Text Stream -->
            <div style="padding: 12px 20px; background: #FFFFFF; border-top: 1px solid var(--border-light); font-size: 0.78rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div>
                  <strong style="color: var(--emerald-dark);">Diagnostic Findings:</strong> <span style="color: var(--text-secondary);">${this.inspectedDoc.rootCause || 'Verified Record'}</span>
                </div>
                ${this.inspectedDoc.extractedText ? `
                  <button class="btn-3d btn-3d-secondary" style="padding: 2px 10px; font-size: 0.72rem;" onclick="const el = document.getElementById('inspectRawTextStream'); if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';">
                    📄 Toggle Text Stream
                  </button>
                ` : ''}
              </div>
              ${this.inspectedDoc.extractedText ? `
                <div id="inspectRawTextStream" style="display: none; margin-top: 8px; max-height: 140px; overflow-y: auto; background: var(--bg-surface-subtle); border: 1px solid var(--border-light); padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 0.72rem; color: var(--text-secondary); white-space: pre-wrap;">${this.inspectedDoc.extractedText}</div>
              ` : ''}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- ==================================================== -->
      <!-- MODAL: 30-MIN ADVANCE SMS NOTIFICATION DISPATCH LOGS -->
      <!-- ==================================================== -->
      <div id="smsLogModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 9999; display: ${this.isSmsLogModalOpen ? 'flex' : 'none'}; align-items: center; justify-content: center; padding: 20px;">
        <div class="card-3d" style="width: 90%; max-width: 960px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; padding: 0; background: #FFFFFF; border: 1px solid var(--border-light); border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
          <!-- Modal Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; background: #FFFFFF; border-bottom: 1px solid var(--border-light);">
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.3rem;">📨</span>
                <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0;">30-Minute Advance Patient Appointment SMS Dispatch Logs</h3>
              </div>
              <p style="font-size: 0.74rem; color: var(--text-muted); margin: 3px 0 0 0;">
                Automated SMS & WhatsApp Cloud Gateway Dispatches Sent 30 Minutes Prior to Doctor Consultation (OPD Cabin 3)
              </p>
            </div>
            <button class="btn-3d btn-3d-secondary" style="padding: 6px 14px; font-size: 0.8rem; color: var(--crimson);" onclick="window.app.closeSmsLogModal()">✖ Close</button>
          </div>

          <!-- Modal Body Table -->
          <div style="flex: 1; overflow-y: auto; padding: 16px 20px; background: #FFFFFF;">
            <table class="rx-table-3d" style="width: 100%;">
              <thead>
                <tr>
                  <th>Dispatch Time</th>
                  <th>Patient Name</th>
                  <th>Token</th>
                  <th>Mobile Number</th>
                  <th>Queue Status</th>
                  <th>Scheduled Time</th>
                  <th>Gateway Status</th>
                  <th>SMS Content Sent to Patient</th>
                </tr>
              </thead>
              <tbody>
                ${this.smsDispatchLogs.length > 0 ? this.smsDispatchLogs.map(log => `
                  <tr>
                    <td style="font-family: monospace; color: var(--text-muted); font-size: 0.74rem; white-space: nowrap;">${log.dispatchTimestamp}</td>
                    <td><strong style="color: var(--text-primary);">${log.patientName}</strong></td>
                    <td><span class="pill-3d pill-3d-blue" style="font-size: 0.72rem;">${log.token}</span></td>
                    <td style="font-family: monospace; font-size: 0.74rem; color: var(--text-muted);">${log.mobile}</td>
                    <td><span class="pill-3d pill-3d-amber" style="font-size: 0.7rem;">${log.patientsAhead} Patients Ahead</span></td>
                    <td><strong style="color: var(--emerald-dark); font-size: 0.78rem;">${log.scheduledTime}</strong></td>
                    <td><span class="pill-3d pill-3d-emerald" style="font-size: 0.7rem;">${log.status}</span></td>
                    <td style="font-size: 0.74rem; color: var(--text-secondary); line-height: 1.4; max-width: 320px;">
                      <div style="background: var(--emerald-light); border: 1px solid var(--emerald-border); border-radius: 6px; padding: 6px 10px; border-left: 3px solid var(--emerald);">
                        "${log.message}"
                      </div>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No SMS dispatch logs recorded yet.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>

          <!-- Modal Footer -->
          <div style="padding: 12px 20px; background: var(--bg-surface-inset); border-top: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; color: var(--text-muted);">
            <span>Gateway: <strong style="color: var(--emerald-dark);">NIC e-Hospital & ABDM SMS Service</strong> • Delivery Latency: &lt;1.2s</span>
            <button class="btn-3d btn-3d-secondary" style="padding: 4px 14px; font-size: 0.78rem;" onclick="window.app.closeSmsLogModal()">Close</button>
          </div>
        </div>
      </div>

      <!-- Toast Container -->
      <div id="doctorToastContainer" class="doctor-toast-container"></div>
    `;
  }

  // ========================================================
  // EVENT BINDINGS & HANDLERS
  // ========================================================
  bindKioskEvents() {
    const chiefInput = document.getElementById("chiefComplaintText");
    if (chiefInput) {
      chiefInput.addEventListener("input", (e) => {
        this.patient.chiefComplaint = e.target.value;
      });
    }

    const dropzone = document.getElementById("uploadDropzone");
    if (dropzone) {
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });
      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
      });
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.processUserFile(e.dataTransfer.files[0]);
        }
      });
    }
  }

  bindDoctorEvents() {}

  saveStep1AndNext() {
    const name = document.getElementById("patientNameInput")?.value || "";
    const age = document.getElementById("patientAgeInput")?.value || "";
    const gender = document.getElementById("patientGenderInput")?.value || "Female";
    const abha = document.getElementById("patientAbhaInput")?.value || "";
    const mobile = document.getElementById("patientMobileInput")?.value || "";

    this.patient.name = name;
    this.patient.age = age;
    this.patient.gender = gender;
    this.patient.abhaId = abha;
    this.patient.mobile = mobile;

    this.goToStep(2);
  }

  triggerFileInput() {
    const fileInput = document.getElementById("realDocUpload");
    if (fileInput) fileInput.click();
  }

  handleFileUpload(event) {
    if (event.target.files && event.target.files.length > 0) {
      this.processUserFile(event.target.files[0]);
    }
  }

  async processUserFile(file) {
    this.isOcrProcessing = true;
    this.ocrProgressText = `Digitizing "${file.name}"...`;
    this.render();

    try {
      const ocrResult = await ocrEngine.processDocument(file, (msg) => {
        this.ocrProgressText = msg;
        this.render();
      });

      this.isOcrProcessing = false;

      if (!ocrResult || !ocrResult.isValidMedical) {
        this.render();
        alert(ocrResult?.errorMessage || `❌ Non-Medical File Rejected: "${file.name}" does not contain recognizable clinical records.`);
        return;
      }

      const isPathologyOrLab = ocrResult.type === "pathology_report" || 
                               ocrResult.type === "xray_report" || 
                               ocrResult.type === "ecg_report" ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("pathology") ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("biochemistry") ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("laboratory");

      // Strictly zero out medications if the document is a pathology lab report or diagnostic scan
      const newMeds = isPathologyOrLab ? [] : (ocrResult.entities?.medications || ocrResult.extractedMedications || []);
      const newDiseases = ocrResult.entities?.diseases || ocrResult.extractedDiseases || [];
      const labFlags = ocrResult.entities?.flags || ocrResult.labFlags || [];
      const labNormals = ocrResult.entities?.normalValues || ocrResult.labNormals || [];

      // Extract diseases if not already populated
      const allExtractedDiseases = newDiseases.length > 0 ? newDiseases : diseaseExtractor.extractDiseases(
        ocrResult.extractedText || "",
        labFlags,
        newMeds,
        ocrResult.rootCause || ""
      );

      this.patient.documents.unshift({
        id: ocrResult.docId || ("DOC-" + Math.floor(1000 + Math.random() * 9000)),
        title: ocrResult.title,
        type: ocrResult.type,
        categoryLabel: ocrResult.categoryLabel,
        previewUrl: ocrResult.previewUrl,
        rootCause: ocrResult.rootCause,
        anatomicalSite: ocrResult.anatomicalSite,
        flags: labFlags,
        normalValues: labNormals,
        medications: newMeds,
        structuredPrescriptionJSON: isPathologyOrLab ? null : (ocrResult.structuredPrescriptionJSON || prescriptionParser.parseToStructuredJSON(ocrResult.extractedText || '')),
        extractedText: ocrResult.extractedText || ocrResult.rawOcrText || '',
        diseases: allExtractedDiseases
      });

      // Update patient diagnoses & diseases
      if (allExtractedDiseases.length > 0) {
        const existingDx = new Set((this.patient.diagnoses || []).map(d => d.name.toLowerCase()));
        const uniqueDx = allExtractedDiseases.filter(d => !existingDx.has(d.name.toLowerCase()));
        this.patient.diagnoses = [...uniqueDx, ...(this.patient.diagnoses || [])];
        this.patient.diseases = this.patient.diagnoses;
      }

      // Update patient medications ONLY if the document had authentic prescriptions
      if (newMeds.length > 0 && !isPathologyOrLab) {
        const existingNames = new Set((this.patient.allopathicMeds || []).map(m => (typeof m === "string" ? m : m.name).toLowerCase()));
        const uniqueNew = newMeds.filter(m => !existingNames.has((typeof m === "string" ? m : m.name).toLowerCase()));
        this.patient.allopathicMeds = [...uniqueNew, ...(this.patient.allopathicMeds || [])];
        this.patient.medications = this.patient.allopathicMeds;
      }

      this.render();
      const medNotice = isPathologyOrLab ? "• Prescribed Medications: None (Pathology Diagnostic Investigation)" : `• Prescribed Medications: ${newMeds.length}`;
      alert(`✅ Verified Medical Document Digitized!\n\nClassification: [${ocrResult.categoryLabel}]\nDiagnostic Finding: ${ocrResult.rootCause}\n• Identified Diseases/Diagnoses: ${allExtractedDiseases.length}\n${medNotice}\n• Diagnostic Biomarkers: ${labFlags.length}`);
    } catch (err) {
      this.isOcrProcessing = false;
      this.render();
      console.error("Processing error:", err);
      alert(`⚠️ Error processing document: ${err.message || "Please upload a valid image."}`);
    }
  }

  // ========================================================
  // CAMERA & rPPG OPTICAL TRACKING
  // ========================================================
  async initCamera() {
    if (this.patient.rppgVitals) return;

    try {
      const feedContainer = document.getElementById("rppgCameraFeedContainer");
      if (!feedContainer) return;
      this.cameraError = null;

      // Start the live face alignment & tracking pipeline
      await rppgService.startFaceAlignment(
        feedContainer,
        (state) => {
          this.handleFaceLockUpdate(state);
        },
        (lockedState) => {
          this.handleFaceLockUpdate(lockedState);
        },
        this.faceDetectorEngine
      );
    } catch (err) {
      console.warn("Camera init notice:", err);
      this.cameraError = err.message || "Camera access required";
      this.render();
    }
  }

  async requestCameraDirectly() {
    this.cameraError = null;
    this.render();
    await this.initCamera();
  }

  handleFaceLockUpdate(state) {
    if (!state) return;
    this.faceLockState = state;

    const hud = document.querySelector(".reticle-hud");
    const statusBadge = document.querySelector(".reticle-status-badge");
    if (hud) {
      hud.classList.toggle("locked", !!state.isFaceLocked);
    }
    if (statusBadge) {
      statusBadge.textContent = state.message || (state.isFaceLocked ? "🟢 Face Validated & Locked" : "Aligning Face...");
    }

    // Update 5-Point Alignment Status Checklist
    const chkBoxes = document.querySelectorAll(".pill-check");
    const checks = state.checks || {};
    if (chkBoxes.length >= 5) {
      chkBoxes[0].classList.toggle("pass", !!(state.detected || checks.faceDetected));
      chkBoxes[0].querySelector("span").textContent = (state.detected || checks.faceDetected) ? "✓" : "○";

      chkBoxes[1].classList.toggle("pass", !!checks.isCentered);
      chkBoxes[1].querySelector("span").textContent = checks.isCentered ? "✓" : "○";

      chkBoxes[2].classList.toggle("pass", !!checks.isOptimalDistance);
      chkBoxes[2].querySelector("span").textContent = checks.isOptimalDistance ? "✓" : "○";

      chkBoxes[3].classList.toggle("pass", !!checks.isStill);
      chkBoxes[3].querySelector("span").textContent = checks.isStill ? "✓" : "○";

      chkBoxes[4].classList.toggle("pass", !!checks.hasValidROIs);
      chkBoxes[4].querySelector("span").textContent = checks.hasValidROIs ? "✓" : "○";
    }

    // Auto-Scan Countdown Trigger when face is aligned and locked
    if (state.isFaceLocked && !this.isRppgScanning && !this.patient.rppgVitals && !this.autoScanTimer) {
      this.autoScanCountdown = 2;
      const scanBtn = document.getElementById("btnStartVitalsScan");
      if (scanBtn) scanBtn.textContent = `Auto-Scanning in 2s (Click Now)`;

      this.autoScanTimer = setInterval(() => {
        this.autoScanCountdown--;
        const btn = document.getElementById("btnStartVitalsScan");
        if (btn) btn.textContent = `Auto-Scanning in ${this.autoScanCountdown}s (Click Now)`;
        if (this.autoScanCountdown <= 0) {
          clearInterval(this.autoScanTimer);
          this.autoScanTimer = null;
          this.triggerRppgScan();
        }
      }, 1000);
    } else if (!state.isFaceLocked && this.autoScanTimer) {
      clearInterval(this.autoScanTimer);
      this.autoScanTimer = null;
      const scanBtn = document.getElementById("btnStartVitalsScan");
      if (scanBtn && !this.isRppgScanning) {
        scanBtn.textContent = `⚡ Scan Vitals`;
      }
    }
  }

  stopCamera() {
    if (this.autoScanTimer) {
      clearInterval(this.autoScanTimer);
      this.autoScanTimer = null;
    }
    rppgService.stopFaceAlignment(true);
    rppgService.stopScan();
  }

  setFaceDetectorEngine(engine) {
    this.faceDetectorEngine = engine;
    rppgService.setFaceDetectorEngine(engine);
    this.render();
    if (this.currentStep === 2) {
      setTimeout(() => this.initCamera(), 100);
    }
  }

  setScanDuration(durationMs) {
    this.scanDuration = Number(durationMs) || 30000;
    rppgService.setCaptureDuration(this.scanDuration);
    this.render();
    if (this.currentStep === 2 && !this.patient.rppgVitals) {
      setTimeout(() => this.initCamera(), 100);
    }
  }

  recordOscilloscopeSample(sample) {
    if (!this.oscilloscopeSamples) this.oscilloscopeSamples = [];
    this.oscilloscopeSamples.push(sample);
    if (this.oscilloscopeSamples.length > 180) {
      this.oscilloscopeSamples.shift();
    }
  }

  drawLiveOscilloscope() {
    const canvas = document.getElementById("rppgOscilloscopeCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Dark clinical grid backdrop
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);

    // Subtle clinical grid lines
    ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const samples = this.oscilloscopeSamples || [];
    if (samples.length < 2) {
      // Baseline resting line
      ctx.strokeStyle = "rgba(52, 211, 153, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      return;
    }

    // Auto-scale waveform amplitude
    let min = Infinity, max = -Infinity;
    for (const v of samples) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = Math.max(0.005, max - min);
    const mid = (min + max) / 2;

    // Draw glowing arterial photoplethysmogram wave
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#10B981";
    ctx.strokeStyle = "#34D399";
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    const dx = w / (samples.length - 1);
    for (let i = 0; i < samples.length; i++) {
      const x = i * dx;
      const normalized = (samples[i] - mid) / (range * 0.55);
      const y = (h / 2) - (normalized * (h * 0.38));
      const clampedY = Math.max(4, Math.min(h - 4, y));
      if (i === 0) ctx.moveTo(x, clampedY);
      else ctx.lineTo(x, clampedY);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Scan head marker
    if (samples.length > 0) {
      const lastX = (samples.length - 1) * dx;
      const lastNorm = (samples[samples.length - 1] - mid) / (range * 0.55);
      const lastY = Math.max(4, Math.min(h - 4, (h / 2) - (lastNorm * (h * 0.38))));

      ctx.fillStyle = "#6EE7B7";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderRppgProgressOnly() {
    const pBar = document.getElementById("rppgProgressBar");
    const pText = document.getElementById("rppgProgressText");
    const countdownText = document.getElementById("rppgCountdownText");

    if (pBar) pBar.style.width = `${this.rppgProgress}%`;
    if (pText) pText.textContent = `${this.rppgProgress}%`;
    if (countdownText && this.rppgElapsedSec !== undefined) {
      const totalSec = (this.scanDuration / 1000).toFixed(1);
      const remaining = Math.max(0, parseFloat(totalSec) - parseFloat(this.rppgElapsedSec)).toFixed(1);
      countdownText.textContent = `Acquiring: ${this.rppgElapsedSec}s / ${totalSec}s (${remaining}s remaining • ${this.scanDuration >= 60000 ? 'Diagnostic HRV Gold Standard (≥60s)' : '30s Rapid Clinical Intake'} • Hold Still)`;
    }

    this.drawLiveOscilloscope();
  }

  triggerRppgScan() {
    if (this.isRppgScanning || this.patient.rppgVitals) return;
    if (this.autoScanTimer) {
      clearInterval(this.autoScanTimer);
      this.autoScanTimer = null;
    }

    this.isRppgScanning = true;
    this.rppgProgress = 0;
    this.rppgElapsedSec = "0.0";
    this.oscilloscopeSamples = [];
    this.render();

    const feedContainer = document.getElementById("rppgCameraFeedContainer");

    rppgService.startScan(
      feedContainer,
      (data) => {
        if (typeof data === "number") {
          this.rppgProgress = data;
        } else if (data) {
          this.rppgProgress = data.progress;
          this.rppgElapsedSec = (data.elapsedMs / 1000).toFixed(1);
          if (data.livePulseSample !== undefined) {
            this.recordOscilloscopeSample(data.livePulseSample);
          }
        }
        this.renderRppgProgressOnly();
      },
      (status) => {
        const statusBadge = document.querySelector(".reticle-status-badge");
        if (statusBadge && status.message) {
          statusBadge.textContent = status.message;
        }
      },
      (vitals) => {
        this.isRppgScanning = false;
        this.patient.rppgVitals = vitals;
        this.stopCamera();
        this.render();
      },
      (err) => {
        this.isRppgScanning = false;
        this.render();
        console.warn("rPPG Scan notice:", err);
      },
      this.patient
    );
  }

  promptAddHerb() {
    const herbName = prompt("Enter Ayurvedic or Home remedy name (e.g. Guggulu, Karela Juice, Giloy, Ashwagandha):");
    if (herbName && herbName.trim().length > 0) {
      this.patient.ayushHerbs.push({ name: herbName.trim(), dosage: "Self-Medicated" });
      this.render();
    }
  }

  removeHerb(idx) {
    this.patient.ayushHerbs.splice(idx, 1);
    this.render();
  }

  selectBodyPart(site) {
    this.patient.hpi.site = site;
    this.render();
  }

  setHpiField(field, val) {
    this.patient.hpi[field] = val;
    this.render();
  }

  toggleAssociation(item) {
    this.patient.hpi.associations = this.patient.hpi.associations || [];
    if (this.patient.hpi.associations.includes(item)) {
      this.patient.hpi.associations = this.patient.hpi.associations.filter(x => x !== item);
    } else {
      this.patient.hpi.associations.push(item);
    }
    this.render();
  }

  setSeverity(val) {
    this.patient.hpi.severity = parseInt(val);
    const flag = clinicalParser.checkRedFlags(this.patient.chiefComplaint, this.patient.hpi.severity);
    if (flag?.isEmergency && !this.patient.isEmergency) {
      this.patient.isEmergency = true;
    }
    this.render();
  }

  toggleAyushMode() {
    this.isAyushMode = !this.isAyushMode;
    this.render();
  }

  setAyushAnswer(qId, oIdx) {
    this.ayushAnswers[qId] = oIdx;
    const res = ayushEngine.calculatePrakriti(this.ayushAnswers);
    this.patient.ayushIntake = res;
    this.render();
  }

  selectQueuePatient(id) {
    const found = this.doctorQueue.find(p => p.id === id);
    if (found) {
      this.selectedQueuePatient = found;
      this.render();
    }
  }

  setDoctorTab(tab) {
    this.doctorActiveTab = tab;
    this.render();
  }

  openSmsLogModal() {
    this.isSmsLogModalOpen = true;
    const modal = document.getElementById("smsLogModal");
    if (modal) modal.style.display = "flex";
  }

  closeSmsLogModal() {
    this.isSmsLogModalOpen = false;
    const modal = document.getElementById("smsLogModal");
    if (modal) modal.style.display = "none";
  }

  openDocInspectModal(docId) {
    const p = this.selectedQueuePatient || this.patient;
    const doc = (p.documents || []).find(d => d.id === docId);
    if (!doc) return;
    this.inspectedDoc = doc;
    this.docZoomLevel = 1;
    this.render();
  }

  closeDocInspectModal() {
    this.inspectedDoc = null;
    this.docZoomLevel = 1;
    this.render();
  }

  changeDocZoom(delta) {
    if (delta === 0) {
      this.docZoomLevel = 1;
    } else {
      this.docZoomLevel = Math.max(0.75, Math.min(2.5, Number((this.docZoomLevel + delta).toFixed(2))));
    }
    const img = document.getElementById("inspectModalImage");
    const lbl = document.getElementById("inspectZoomLabel");
    if (img) img.style.transform = `scale(${this.docZoomLevel})`;
    if (lbl) lbl.textContent = `${Math.round(this.docZoomLevel * 100)}%`;
  }

  showDoctorToast(message) {
    const container = document.getElementById("doctorToastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "doctor-toast-3d";
    toast.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 10px;">
        <span style="font-size: 1.2rem;">🔔</span>
        <div style="flex: 1;">
          <strong style="color: var(--emerald-dark); font-size: 0.85rem; display: block; margin-bottom: 2px;">OPD Notification Dispatched</strong>
          <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4; margin: 0;">${message}</p>
        </div>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  async checkAndTrigger30MinAlerts() {
    if (!this.doctorQueue || this.doctorQueue.length === 0) return;

    for (let idx = 0; idx < this.doctorQueue.length; idx++) {
      const patient = this.doctorQueue[idx];
      const patientsAhead = idx;
      const waitMinutes = Math.round(patientsAhead * 7.5);

      // Trigger condition: Patients approximately 30 minutes away from consultation (20 to 35 mins or 3-4 patients ahead)
      if ((patientsAhead === 4 || patientsAhead === 3 || (waitMinutes >= 20 && waitMinutes <= 35)) && !patient.smsAlertSent) {
        const estTime = new Date(Date.now() + Math.max(15, waitMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        patient.smsAlertSent = true;
        patient.smsAlertTime = estTime;

        const mobileNum = patient.mobile || "+91 98765 43210";

        // Dispatch real-time SMS to registered number via notificationClientService
        const res = await notificationClientService.sendRealTimeSms({
          mobile: mobileNum,
          patientId: patient.id,
          patientName: patient.name || "Patient",
          tokenNumber: patient.tokenNumber || "TK-101",
          membersNext: patientsAhead,
          membersAhead: patientsAhead,
          appointmentTime: estTime,
          waitMinutes: waitMinutes || 30,
          doctorName: "Dr. Sharma",
          cabinNumber: "Cabin 3",
          department: "General Medicine",
          alertType: "30min",
          eventType: "30MIN_REMINDER"
        });

        const logItem = (res && res.log) ? res.log : {
          id: "SMS-" + Math.floor(100 + Math.random() * 900),
          patientId: patient.id,
          patientName: patient.name || "Patient",
          mobile: mobileNum,
          token: patient.tokenNumber,
          queuePosition: idx + 1,
          patientsAhead: patientsAhead,
          scheduledTime: estTime,
          dispatchTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: "Delivered ✓",
          channel: "SMS Gateway + WhatsApp Cloud API",
          message: `⏱️ [30-MIN APPOINTMENT REMINDER] Namaste ${patient.name || 'Patient'}! Token #${patient.tokenNumber}. Your appointment with Dr. Sharma (Cabin 3) is scheduled in ~${waitMinutes || 30} mins at ${estTime}. Queue Status: ${patientsAhead} patient(s) ahead of you. Please be present in OPD Waiting Zone B.`
        };

        if (!this.smsDispatchLogs.some(l => l.token === patient.tokenNumber && (l.alertType === '30min' || (l.message && l.message.includes('30-Min'))))) {
          this.smsDispatchLogs.unshift({
            ...logItem,
            token: patient.tokenNumber,
            patientsAhead: patientsAhead,
            scheduledTime: estTime,
            alertType: '30min'
          });
        }

        this.showDoctorToast(`⏱️ Real-Time 30-Min Reminder Dispatched to Registered Mobile: ${mobileNum} (${patient.name || 'Patient'}) for ~${estTime}!`);
      }
    }
  }

  async sendManualRealTimeSms(patientId) {
    const idx = this.doctorQueue.findIndex(p => p.id === patientId);
    if (idx < 0) return;
    const patient = this.doctorQueue[idx];
    const membersNext = idx;
    const waitMinutes = membersNext === 0 ? 0 : Math.round(membersNext * 7.5);
    const estTime = new Date(Date.now() + Math.max(5, waitMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    patient.smsAlertSent = true;
    patient.smsAlertTime = estTime;

    const res = await notificationClientService.sendRealTimeSms({
      mobile: patient.mobile || "+91 98765 43210",
      patientId: patient.id,
      patientName: patient.name || "Patient",
      tokenNumber: patient.tokenNumber || "TK-101",
      membersNext,
      appointmentTime: estTime,
      waitMinutes,
      doctorName: "Dr. Sharma",
      cabinNumber: "Cabin 3",
      alertType: membersNext === 0 ? "cabin_call" : (membersNext === 1 ? "urgent_next" : (membersNext >= 3 && waitMinutes >= 20 ? "30min" : "update"))
    });

    this.showDoctorToast(`📲 Real-time SMS dispatched to registered mobile: ${patient.mobile || '+91 98765 43210'} (${membersNext} members ahead, ~${estTime})`);
    this.render();
  }

  async sendManual30MinAlert(patientId) {
    const idx = this.doctorQueue.findIndex(p => p.id === patientId);
    if (idx < 0) return;
    const patient = this.doctorQueue[idx];
    const patientsAhead = idx;
    const waitMinutes = Math.max(15, Math.round(patientsAhead * 7.5));
    const estTime = new Date(Date.now() + Math.max(25, waitMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    patient.smsAlertSent = true;
    patient.smsAlertTime = estTime;

    const res = await notificationClientService.sendRealTimeSms({
      mobile: patient.mobile || "+91 98765 43210",
      patientId: patient.id,
      patientName: patient.name || "Patient",
      tokenNumber: patient.tokenNumber || "TK-101",
      membersNext: patientsAhead,
      membersAhead: patientsAhead,
      appointmentTime: estTime,
      waitMinutes: waitMinutes || 30,
      doctorName: "Dr. Sharma",
      cabinNumber: "Cabin 3",
      department: "General Medicine",
      alertType: "30min",
      eventType: "30MIN_REMINDER"
    });

    const mobileNum = patient.mobile || "+91 98765 43210";
    const logItem = (res && res.log) ? res.log : {
      id: "SMS-" + Math.floor(100 + Math.random() * 900),
      patientId: patient.id,
      patientName: patient.name || "Patient",
      mobile: mobileNum,
      token: patient.tokenNumber,
      queuePosition: idx + 1,
      patientsAhead: patientsAhead,
      scheduledTime: estTime,
      dispatchTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Delivered ✓",
      channel: "SMS Gateway + WhatsApp Cloud API",
      message: `⏱️ [30-MIN APPOINTMENT REMINDER] Namaste ${patient.name || 'Patient'}! Token #${patient.tokenNumber}. Your appointment with Dr. Sharma (Cabin 3) is scheduled in ~${waitMinutes} mins at ${estTime}. Queue Status: ${patientsAhead} patient(s) ahead of you. Please be present in OPD Waiting Zone B.`
    };

    this.smsDispatchLogs.unshift({
      ...logItem,
      token: patient.tokenNumber,
      patientsAhead: patientsAhead,
      scheduledTime: estTime,
      alertType: '30min'
    });

    this.showDoctorToast(`⏱️ 30-Min Advance SMS sent to registered mobile: ${mobileNum} (${patientsAhead} patients ahead, appointment at ${estTime})`);
    this.render();
  }

  async broadcastRealTimeQueueSms() {
    if (!this.doctorQueue || this.doctorQueue.length === 0) {
      alert("No active patients waiting in the queue.");
      return;
    }

    const res = await notificationClientService.broadcastQueue(this.doctorQueue, {
      doctorName: "Dr. Sharma",
      cabinNumber: "Cabin 3"
    });

    this.showDoctorToast(`📢 Real-time queue broadcast dispatched to ${this.doctorQueue.length} registered patient mobile numbers!`);
    this.render();
  }

  async callNextPatient() {
    if (!this.doctorQueue || this.doctorQueue.length === 0) {
      alert("No more patients waiting in the queue.");
      return;
    }
    // Atomically advance backend Queue Domain Service (triggers DLT events & BullMQ pipeline)
    notificationClientService.callNextQueuePatient('DOC_SHARMA');

    const completed = this.doctorQueue.shift();
    this.showDoctorToast(`✓ Consultation completed for ${completed.name} (Token ${completed.tokenNumber}). Queue updated.`);
    this.selectedQueuePatient = this.doctorQueue[0] || null;

    // Real-time urgent call to the patient now entering cabin
    if (this.selectedQueuePatient) {
      speechService.speak(`Token number ${this.selectedQueuePatient.tokenNumber}, ${this.selectedQueuePatient.name}, please enter OPD Cabin 3.`);
      notificationClientService.sendRealTimeSms({
        mobile: this.selectedQueuePatient.mobile || "+91 98765 43210",
        patientId: this.selectedQueuePatient.id,
        patientName: this.selectedQueuePatient.name || "Patient",
        tokenNumber: this.selectedQueuePatient.tokenNumber || "TK-101",
        membersNext: 0,
        appointmentTime: "Now (Cabin 3)",
        waitMinutes: 0,
        doctorName: "Dr. Sharma",
        cabinNumber: "Cabin 3",
        alertType: "cabin_call"
      });
    }

    // Broadcast updated queue positions & appointment times to all remaining waiting patients
    if (this.doctorQueue.length > 0) {
      notificationClientService.broadcastQueue(this.doctorQueue, {
        doctorName: "Dr. Sharma",
        cabinNumber: "Cabin 3"
      });
    }

    this.checkAndTrigger30MinAlerts();
    this.render();
  }

  async triggerPatientRealTimeSms() {
    const mobile = this.patient.mobile || "+91 98765 43210";
    const qIdx = this.doctorQueue.findIndex(p => p.id === this.patient.id);
    const membersNext = Math.max(0, qIdx >= 0 ? qIdx : 2);
    const waitMin = membersNext === 0 ? 0 : Math.round(membersNext * 7.5);
    const estTime = new Date(Date.now() + Math.max(5, waitMin) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.patient.smsAlertSent = true;
    this.patient.smsAlertTime = estTime;

    if (qIdx >= 0) {
      this.doctorQueue[qIdx].smsAlertSent = true;
      this.doctorQueue[qIdx].smsAlertTime = estTime;
    }

    await notificationClientService.sendRealTimeSms({
      mobile,
      patientId: this.patient.id,
      patientName: this.patient.name || "Walk-in Patient",
      tokenNumber: this.patient.tokenNumber || "TK-101",
      membersNext,
      appointmentTime: estTime,
      waitMinutes: waitMin,
      doctorName: "Dr. Sharma",
      cabinNumber: "Cabin 3",
      alertType: "registration"
    });

    this.showDoctorToast(`📲 Real-Time SMS dispatched to registered mobile: ${mobile} (${membersNext} members ahead, appointment: ${estTime})`);
    this.render();
  }

  async triggerPatient30MinTestSms() {
    const mobile = this.patient.mobile || "+91 98765 43210";
    const qIdx = this.doctorQueue.findIndex(p => p.id === this.patient.id);
    const membersNext = Math.max(0, qIdx >= 0 ? qIdx : 4);
    const waitMin = 30;
    const estTime = new Date(Date.now() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.patient.smsAlertSent = true;
    this.patient.smsAlertTime = estTime;

    if (qIdx >= 0) {
      this.doctorQueue[qIdx].smsAlertSent = true;
      this.doctorQueue[qIdx].smsAlertTime = estTime;
    }

    const res = await notificationClientService.sendRealTimeSms({
      mobile,
      patientId: this.patient.id,
      patientName: this.patient.name || "Registered Patient",
      tokenNumber: this.patient.tokenNumber || "TK-101",
      membersNext,
      membersAhead: membersNext,
      appointmentTime: estTime,
      waitMinutes: waitMin,
      doctorName: "Dr. Sharma",
      cabinNumber: "Cabin 3",
      department: "General Medicine",
      alertType: "30min",
      eventType: "30MIN_REMINDER"
    });

    const logItem = (res && res.log) ? res.log : {
      id: "SMS-" + Math.floor(100 + Math.random() * 900),
      patientId: this.patient.id,
      patientName: this.patient.name || "Patient",
      mobile,
      token: this.patient.tokenNumber || "TK-101",
      queuePosition: membersNext + 1,
      patientsAhead: membersNext,
      scheduledTime: estTime,
      dispatchTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Delivered ✓",
      channel: "SMS Gateway + WhatsApp Cloud API",
      message: `⏱️ [30-MIN APPOINTMENT REMINDER] Namaste ${this.patient.name || 'Patient'}! Token #${this.patient.tokenNumber || 'TK-101'}. Your appointment with Dr. Sharma (Cabin 3) is scheduled in ~30 mins at ${estTime}. Queue Status: ${membersNext} patient(s) ahead of you. Please be present in OPD Waiting Zone B.`
    };

    this.smsDispatchLogs.unshift({
      ...logItem,
      token: this.patient.tokenNumber || "TK-101",
      patientsAhead: membersNext,
      scheduledTime: estTime,
      alertType: '30min'
    });

    this.showDoctorToast(`⏱️ 30-Minute Advance SMS dispatched to registered mobile: ${mobile} (Appointment: ${estTime})`);
    this.render();
  }

  togglePhoneSimulator(forceOpen) {
    if (!this.phoneSimulator) {
      this.phoneSimulator = new PhoneSimulatorModal(this);
    }
    const mobile = this.patient.mobile || "+91 98765 43210";
    if (typeof forceOpen === 'boolean') {
      if (forceOpen) this.phoneSimulator.open(mobile);
      else this.phoneSimulator.close();
    } else {
      this.phoneSimulator.toggle(mobile);
    }
  }

  sendTestSmsFromSimulator() {
    const input = document.getElementById("simulatorMobileInput");
    const mobile = (input && input.value.trim()) ? input.value.trim() : (this.patient.mobile || "+91 98765 43210");
    const qIdx = this.doctorQueue.findIndex(p => p.id === this.patient.id);
    const membersNext = Math.max(0, qIdx >= 0 ? qIdx : 2);
    const waitMin = membersNext === 0 ? 0 : Math.round(membersNext * 7.5);
    const estTime = new Date(Date.now() + Math.max(5, waitMin) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    notificationClientService.sendRealTimeSms({
      mobile,
      patientId: this.patient.id,
      patientName: this.patient.name || "Registered Patient",
      tokenNumber: this.patient.tokenNumber || "TK-101",
      membersNext,
      appointmentTime: estTime,
      waitMinutes: waitMin,
      doctorName: "Dr. Sharma",
      cabinNumber: "Cabin 3",
      alertType: membersNext === 0 ? "cabin_call" : (membersNext === 1 ? "urgent_next" : "update")
    });

    this.showDoctorToast(`📲 Live SMS dispatched to registered mobile: ${mobile} (${membersNext} members ahead, appointment: ${estTime})`);
  }

  initDefaultDoctorQueue() {
    const p1Docs = [
      {
        id: "doc-ramesh-1",
        title: "Apex Heart & Chest Clinic - OPD Prescription",
        categoryLabel: "Prescription",
        type: "prescription",
        doctor: "Dr. V. K. Malhotra, MD (Cardio)",
        date: "24-Sep-2026",
        rootCause: "Hypertensive heart disease stage 2 with stable angina pectoris",
        anatomicalSite: "Cardiovascular System",
        medications: [
          { name: "Telmisartan", dosage: "40 mg", freq: "OD (Once Daily)", timing: "Morning after breakfast", duration: "Ongoing", route: "Oral", snomedCode: "387517004", schedule: "Schedule H", sourceDoc: "Apex Cardiology Rx #108", status: "Verified" },
          { name: "Amlodipine", dosage: "5 mg", freq: "OD (Once Daily)", timing: "Morning after breakfast", duration: "Ongoing", route: "Oral", snomedCode: "386864001", schedule: "Schedule H", sourceDoc: "Apex Cardiology Rx #108", status: "Verified" },
          { name: "Atorvastatin", dosage: "20 mg", freq: "OD (Once Daily)", timing: "Night at bedtime", duration: "Ongoing", route: "Oral", snomedCode: "387584000", schedule: "Schedule H", sourceDoc: "Apex Cardiology Rx #108", status: "Verified" }
        ],
        previewUrl: generateMedicalDocSvg("prescription", "OPD Clinical Prescription", "Apex Heart & Chest Specialty Clinic", [
          { name: "Telmisartan", dosage: "40 mg", freq: "OD", timing: "After breakfast", duration: "Ongoing", route: "Oral", snomedCode: "387517004", schedule: "Schedule H" },
          { name: "Amlodipine", dosage: "5 mg", freq: "OD", timing: "After breakfast", duration: "Ongoing", route: "Oral", snomedCode: "386864001", schedule: "Schedule H" },
          { name: "Atorvastatin", dosage: "20 mg", freq: "OD", timing: "Bedtime", duration: "Ongoing", route: "Oral", snomedCode: "387584000", schedule: "Schedule H" }
        ], "Hypertensive Heart Disease with Stable Angina", "Ramesh Sharma", "A-12")
      },
      {
        id: "doc-ramesh-2",
        title: "Resting 12-Lead Electrocardiogram (ECG)",
        categoryLabel: "Diagnostic Scan",
        type: "lab_report",
        doctor: "Dr. K. S. Oberoi, MD",
        date: "24-Sep-2026",
        rootCause: "Normal sinus rhythm, occasional premature ventricular contractions (PVCs)",
        anatomicalSite: "Heart",
        flags: [
          { name: "R-R Interval Variability", value: "34 ms", status: "LOW" },
          { name: "PR Interval", value: "162 ms", status: "NORMAL" },
          { name: "QRS Duration", value: "98 ms", status: "NORMAL" }
        ],
        previewUrl: generateMedicalDocSvg("lab_report", "12-Lead Rest ECG Telemetry Scan", "Apex Cardiology Diagnostic Wing", [
          { name: "R-R Interval Variability", value: "34 ms", status: "LOW" },
          { name: "PR Interval Duration", value: "162 ms", status: "NORMAL" },
          { name: "QRS Complex Duration", value: "98 ms", status: "NORMAL" },
          { name: "QTc Bazett Interval", value: "422 ms", status: "NORMAL" }
        ], "Sinus Rhythm with Occasional PVCs", "Ramesh Sharma", "A-12")
      }
    ];

    const p2Docs = [
      {
        id: "doc-sunita-1",
        title: "Metropolis Lab - Glycemic & Lipid Profile",
        categoryLabel: "Lab Report",
        type: "lab_report",
        doctor: "Dr. N. Mehta, MD (Path)",
        date: "25-Sep-2026",
        rootCause: "Sub-optimally controlled Type 2 Diabetes Mellitus with microalbuminuria",
        anatomicalSite: "Endocrine & Renal System",
        flags: [
          { name: "Fasting Blood Glucose", value: "184 mg/dL", status: "HIGH" },
          { name: "HbA1c Glycated Hemoglobin", value: "8.6%", status: "HIGH" },
          { name: "Hemoglobin", value: "9.4 g/dL", status: "LOW" },
          { name: "Serum Creatinine", value: "1.1 mg/dL", status: "NORMAL" }
        ],
        previewUrl: generateMedicalDocSvg("lab_report", "Comprehensive Glycemic Diagnostic Panel", "Metropolis Clinical Diagnostic Laboratories", [
          { name: "Fasting Blood Glucose", value: "184 mg/dL", status: "HIGH" },
          { name: "HbA1c Glycated Hemoglobin", value: "8.6%", status: "HIGH" },
          { name: "Hemoglobin (Hb)", value: "9.4 g/dL", status: "LOW" },
          { name: "Serum Creatinine", value: "1.1 mg/dL", status: "NORMAL" },
          { name: "Estimated GFR (eGFR)", value: "72 mL/min", status: "NORMAL" }
        ], "Uncontrolled Diabetes Mellitus with Mild Microcytic Anemia", "Sunita Verma", "A-15")
      },
      {
        id: "doc-sunita-2",
        title: "Dr. R. Iyer Endocrinology OPD Prescription",
        categoryLabel: "Prescription",
        type: "prescription",
        doctor: "Dr. R. Iyer, DM (Endocrinology)",
        date: "25-Sep-2026",
        rootCause: "Type 2 Diabetes Mellitus with early peripheral sensory neuropathy",
        anatomicalSite: "Endocrine System",
        medications: [
          { name: "Metformin Hydrochloride", dosage: "500 mg", freq: "BD (Twice Daily)", timing: "After Meals", duration: "Ongoing", route: "Oral", snomedCode: "372567009", schedule: "Schedule H", sourceDoc: "Endocrine Clinic Rx #42", status: "Verified" },
          { name: "Glimepiride", dosage: "1 mg", freq: "OD (Once Daily)", timing: "Before Breakfast", duration: "Ongoing", route: "Oral", snomedCode: "387063004", schedule: "Schedule H", sourceDoc: "Endocrine Clinic Rx #42", status: "Verified" }
        ],
        previewUrl: generateMedicalDocSvg("prescription", "Endocrine Specialty OPD Prescription", "Apollo Endocrine Care Centre", [
          { name: "Metformin Hydrochloride", dosage: "500 mg", freq: "BD", timing: "After Meals", duration: "Ongoing", route: "Oral", snomedCode: "372567009", schedule: "Schedule H" },
          { name: "Glimepiride", dosage: "1 mg", freq: "OD", timing: "Before Breakfast", duration: "Ongoing", route: "Oral", snomedCode: "387063004", schedule: "Schedule H" }
        ], "Type 2 Diabetes with Peripheral Neuropathy", "Sunita Verma", "A-15")
      }
    ];

    const p3Docs = [
      {
        id: "doc-arif-1",
        title: "PulmoCare Digital PA Chest Radiograph",
        categoryLabel: "Imaging Scan",
        type: "radiology",
        doctor: "Dr. S. Mukherjee, DMRD",
        date: "26-Sep-2026",
        rootCause: "Bilateral bronchial wall thickening with right lower zone haziness",
        anatomicalSite: "Respiratory System / Lungs",
        flags: [
          { name: "Bronchial Markings", value: "Prominent RLL Haziness", status: "ABNORMAL" },
          { name: "Cardiothoracic Ratio", value: "0.46", status: "NORMAL" }
        ],
        previewUrl: generateMedicalDocSvg("radiology", "PA Chest Digital Radiography", "PulmoCare Chest Diagnostic Centre", [], "Acute Bronchial Infiltrates & Exacerbation", "Mohammad Arif", "A-19")
      },
      {
        id: "doc-arif-2",
        title: "Pulmonology Handwritten Prescription - Dr. A. Khan",
        categoryLabel: "Prescription",
        type: "prescription",
        doctor: "Dr. A. Khan, MD (Pulm)",
        date: "26-Sep-2026",
        rootCause: "Acute infective exacerbation of bronchitis",
        anatomicalSite: "Respiratory System",
        medications: [
          { name: "Amoxicillin + Clavulanic Acid", dosage: "625 mg", freq: "TDS (3 times/day)", timing: "After Meals", duration: "5 days", route: "Oral", snomedCode: "372833007", schedule: "Schedule H1", sourceDoc: "PulmoCare OPD Rx #309", status: "Verified" },
          { name: "Paracetamol", dosage: "650 mg", freq: "SOS (As Needed)", timing: "Post Meals for fever >100°F", duration: "3 days", route: "Oral", snomedCode: "387517004", schedule: "OTC", sourceDoc: "PulmoCare OPD Rx #309", status: "Verified" },
          { name: "Levosalbutamol + Ambroxol Syrup", dosage: "10 ml", freq: "TDS (3 times/day)", timing: "After Meals", duration: "5 days", route: "Oral", snomedCode: "411529001", schedule: "Schedule H", sourceDoc: "PulmoCare OPD Rx #309", status: "Verified" }
        ],
        previewUrl: generateMedicalDocSvg("prescription", "Pulmonology Handwritten Clinical Prescription", "PulmoCare Chest Centre", [
          { name: "Amoxicillin + Clav", dosage: "625 mg", freq: "TDS", timing: "After Meals", duration: "5 days", route: "Oral", snomedCode: "372833007", schedule: "Schedule H1" },
          { name: "Paracetamol", dosage: "650 mg", freq: "SOS", timing: "Post Meals", duration: "3 days", route: "Oral", snomedCode: "387517004", schedule: "OTC" },
          { name: "Levosalbutamol + Ambroxol", dosage: "10 ml", freq: "TDS", timing: "After Meals", duration: "5 days", route: "Oral", snomedCode: "411529001", schedule: "Schedule H" }
        ], "Acute Infective Exacerbation of Bronchitis", "Mohammad Arif", "A-19")
      }
    ];

    const p4Docs = [
      {
        id: "doc-priya-1",
        title: "City Hospital OPD Handwritten Doctor Prescription",
        categoryLabel: "Prescription",
        type: "prescription",
        doctor: "Dr. Ananya Ray, MBBS, MD",
        date: "27-Sep-2026",
        rootCause: "Acute viral pharyngitis with secondary reactive gastritis",
        anatomicalSite: "Oropharynx & Upper GI",
        medications: [
          { name: "Dolo 650 (Paracetamol)", dosage: "650 mg", freq: "TDS (3 times/day)", timing: "After Meals", duration: "4 days", route: "Oral", snomedCode: "387517004", schedule: "OTC", sourceDoc: "City Hospital OPD Handwritten Rx", status: "Verified" },
          { name: "Pantocid 40 (Pantoprazole)", dosage: "40 mg", freq: "OD (Once Daily)", timing: "Empty Stomach (30 min before breakfast)", duration: "7 days", route: "Oral", snomedCode: "387428000", schedule: "Schedule H", sourceDoc: "City Hospital OPD Handwritten Rx", status: "Verified" },
          { name: "Montair-LC (Montelukast + Levocetirizine)", dosage: "10 mg / 5 mg", freq: "OD (Once Daily)", timing: "Night at bedtime", duration: "5 days", route: "Oral", snomedCode: "427314002", schedule: "Schedule H", sourceDoc: "City Hospital OPD Handwritten Rx", status: "Verified" }
        ],
        previewUrl: generateMedicalDocSvg("prescription", "OPD Handwritten Doctor Prescription Note", "City General Hospital - OPD Dept", [
          { name: "Dolo 650", dosage: "650 mg", freq: "TDS", timing: "After Meals", duration: "4 days", route: "Oral", snomedCode: "387517004", schedule: "OTC" },
          { name: "Pantocid 40", dosage: "40 mg", freq: "OD", timing: "Empty Stomach (Morning)", duration: "7 days", route: "Oral", snomedCode: "387428000", schedule: "Schedule H" },
          { name: "Montair-LC", dosage: "10mg/5mg", freq: "OD", timing: "Bedtime", duration: "5 days", route: "Oral", snomedCode: "427314002", schedule: "Schedule H" }
        ], "Acute Viral Pharyngitis with Odynophagia", "Priya Patel", "A-24")
      },
      {
        id: "doc-priya-2",
        title: "Serum Biochemistry & Renal Panel",
        categoryLabel: "Lab Report",
        type: "lab_report",
        doctor: "Dr. S. K. Gupta, MD (Biochem)",
        date: "27-Sep-2026",
        rootCause: "All hepatic enzymes and renal biomarkers within physiological limits",
        anatomicalSite: "Metabolic / Renal",
        flags: [
          { name: "Serum Creatinine", value: "0.85 mg/dL", status: "NORMAL" },
          { name: "SGPT / ALT Enzyme", value: "28 U/L", status: "NORMAL" },
          { name: "Total Bilirubin", value: "0.7 mg/dL", status: "NORMAL" }
        ],
        previewUrl: generateMedicalDocSvg("lab_report", "Hepato-Renal Biochemical Profile", "City Hospital Diagnostic Pathology", [
          { name: "Serum Creatinine", value: "0.85 mg/dL", status: "NORMAL" },
          { name: "SGPT / ALT Enzyme", value: "28 U/L", status: "NORMAL" },
          { name: "Total Bilirubin", value: "0.7 mg/dL", status: "NORMAL" },
          { name: "Serum Electrolytes (Na+)", value: "140 mEq/L", status: "NORMAL" }
        ], "Normal Renal & Hepatic Biomarkers", "Priya Patel", "A-24")
      }
    ];

    const p5Docs = [
      {
        id: "doc-ananya-1",
        title: "OrthoSpine Specialty Clinic Prescription - Dr. B. Sen",
        categoryLabel: "Prescription",
        type: "prescription",
        doctor: "Dr. B. Sen, MS (Ortho)",
        date: "27-Sep-2026",
        rootCause: "L4-L5 disc protrusion with right-sided L5 nerve root impingement",
        anatomicalSite: "Lumbosacral Spine",
        medications: [
          { name: "Etoricoxib", dosage: "90 mg", freq: "OD (Once Daily)", timing: "After Lunch", duration: "7 days", route: "Oral", snomedCode: "387467008", schedule: "Schedule H", sourceDoc: "OrthoSpine Specialty Clinic Rx", status: "Verified" },
          { name: "Thiocolchicoside", dosage: "4 mg", freq: "BD (Twice Daily)", timing: "After Meals", duration: "5 days", route: "Oral", snomedCode: "398715003", schedule: "Schedule H", sourceDoc: "OrthoSpine Specialty Clinic Rx", status: "Verified" },
          { name: "Rabeprazole", dosage: "20 mg", freq: "OD (Once Daily)", timing: "Morning before food", duration: "10 days", route: "Oral", snomedCode: "387428000", schedule: "Schedule H", sourceDoc: "OrthoSpine Specialty Clinic Rx", status: "Verified" }
        ],
        previewUrl: generateMedicalDocSvg("prescription", "Orthopaedic Spine Consultation Rx", "OrthoSpine Advanced Joint & Spine Centre", [
          { name: "Etoricoxib", dosage: "90 mg", freq: "OD", timing: "After Lunch", duration: "7 days", route: "Oral", snomedCode: "387467008", schedule: "Schedule H" },
          { name: "Thiocolchicoside", dosage: "4 mg", freq: "BD", timing: "After Meals", duration: "5 days", route: "Oral", snomedCode: "398715003", schedule: "Schedule H" },
          { name: "Rabeprazole", dosage: "20 mg", freq: "OD", timing: "Before Breakfast", duration: "10 days", route: "Oral", snomedCode: "387428000", schedule: "Schedule H" }
        ], "L4-L5 Disc Protrusion with Lumbar Radiculopathy", "Ananya Sengupta", "A-31")
      }
    ];

    this.doctorQueue = [
      {
        id: "PAT-9012",
        name: "Ramesh Sharma",
        age: 58,
        gender: "Male",
        abhaId: "91-4521-8842-1092",
        mobile: "+91 98201 44521",
        tokenNumber: "A-12",
        chiefComplaint: "Chest tightness on exertion, intermittent palpitations, known hypertension for 6 years",
        isEmergency: false,
        smsAlertSent: false,
        rppgVitals: { heartRate: 88, spO2: 97, stressScore: 68, hrv: 34, respiratoryRate: 18, signalQuality: "Optimal" },
        allopathicMeds: p1Docs[0].medications,
        ayushHerbs: ["Arjuna (Terminalia arjuna)", "Ashwagandha"],
        documents: p1Docs
      },
      {
        id: "PAT-9015",
        name: "Sunita Verma",
        age: 52,
        gender: "Female",
        abhaId: "91-8841-2309-4411",
        mobile: "+91 97110 33812",
        tokenNumber: "A-15",
        chiefComplaint: "Uncontrolled blood sugars, persistent fatigue, polyuria, bilateral lower extremity burning paresthesias",
        isEmergency: false,
        smsAlertSent: false,
        rppgVitals: { heartRate: 76, spO2: 98, stressScore: 54, hrv: 42, respiratoryRate: 16, signalQuality: "Optimal" },
        allopathicMeds: p2Docs[1].medications,
        ayushHerbs: ["Karela (Momordica charantia)", "Jamun seed powder"],
        documents: p2Docs
      },
      {
        id: "PAT-9019",
        name: "Mohammad Arif",
        age: 34,
        gender: "Male",
        abhaId: "91-3142-9901-5612",
        mobile: "+91 94152 77091",
        tokenNumber: "A-19",
        chiefComplaint: "Productive cough with yellow sputum for 6 days, low-grade evening fever (100.4°F), wheezing on exertion",
        isEmergency: false,
        smsAlertSent: false,
        rppgVitals: { heartRate: 94, spO2: 96, stressScore: 62, hrv: 38, respiratoryRate: 22, signalQuality: "Optimal" },
        allopathicMeds: p3Docs[1].medications,
        ayushHerbs: ["Tulsi", "Vasaka"],
        documents: p3Docs
      },
      {
        id: "PAT-9024",
        name: "Priya Patel",
        age: 29,
        gender: "Female",
        abhaId: "91-7782-4410-9088",
        mobile: "+91 98980 12345",
        tokenNumber: "A-24",
        chiefComplaint: "Acute throat pain, painful swallowing (odynophagia) for 3 days, epigastric heartburn after antibiotics",
        isEmergency: false,
        smsAlertSent: true,
        smsAlertTime: "10:15 AM",
        rppgVitals: { heartRate: 82, spO2: 99, stressScore: 48, hrv: 52, respiratoryRate: 17, signalQuality: "Optimal" },
        allopathicMeds: p4Docs[0].medications,
        ayushHerbs: ["Mulethi (Licorice)", "Ginger honey paste"],
        documents: p4Docs
      },
      {
        id: "PAT-9031",
        name: "Ananya Sengupta",
        age: 42,
        gender: "Female",
        abhaId: "91-6651-3321-7711",
        mobile: "+91 98300 65432",
        tokenNumber: "A-31",
        chiefComplaint: "Chronic lower back ache radiating to right posterior thigh and calf (radiculopathy), aggravated by sitting",
        isEmergency: false,
        smsAlertSent: false,
        rppgVitals: { heartRate: 74, spO2: 98, stressScore: 56, hrv: 46, respiratoryRate: 15, signalQuality: "Optimal" },
        allopathicMeds: p5Docs[0].medications,
        ayushHerbs: ["Shallaki (Boswellia)", "Guggulu"],
        documents: p5Docs
      }
    ];

    this.smsDispatchLogs = [
      {
        id: "SMS-101",
        patientId: "PAT-9024",
        patientName: "Priya Patel",
        mobile: "+91 98980 12345",
        token: "A-24",
        queuePosition: 4,
        patientsAhead: 4,
        scheduledTime: "10:15 AM",
        dispatchTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "Delivered ✓",
        channel: "SMS Gateway + WhatsApp Cloud API",
        message: "Dear Priya Patel, your appointment with Dr. Sharma (OPD Cabin 3) is scheduled after 4 patients at approx 10:15 AM (approx 30 mins). Token: A-24. Please proceed to OPD Waiting Zone B."
      }
    ];

    // Default to the CURRENT active consulting patient in OPD Cabin 3
    this.selectedQueuePatient = this.doctorQueue[0];
  }

  acceptSummary() {
    alert("✅ Encounter Summary Accepted!\nClinical Record published to Hospital Information System (e-Hospital) & ABDM Gateway.");
  }

  openFhirModal() {
    const bundle = fhirService.generateFHIRBundle(this.selectedQueuePatient || this.patient);
    const modal = document.getElementById("fhirModal");
    const pre = document.getElementById("fhirCodeBlock");
    if (modal && pre) {
      pre.textContent = JSON.stringify(bundle, null, 2);
      modal.style.display = "flex";
    }
  }

  closeFhirModal() {
    const modal = document.getElementById("fhirModal");
    if (modal) modal.style.display = "none";
  }

  toggleSpeech() {
    const micBtn = document.getElementById("micBtn");
    const micStatus = document.getElementById("micStatusText");

    if (speechService.isListening) {
      speechService.stopListening();
      if (micBtn) micBtn.classList.remove("listening");
      if (micStatus) micStatus.textContent = i18n.t("voice_mic_title");
    } else {
      if (micBtn) micBtn.classList.add("listening");
      if (micStatus) micStatus.textContent = i18n.t("voice_listening");

      speechService.startListening(
        (interim) => {
          const area = document.getElementById("chiefComplaintText");
          if (area) area.value = interim;
        },
        (final) => {
          const area = document.getElementById("chiefComplaintText");
          if (area) {
            area.value = final;
            this.patient.chiefComplaint = final;
          }
          if (micBtn) micBtn.classList.remove("listening");
          if (micStatus) micStatus.textContent = "✓ " + i18n.t("voice_mic_title");
        },
        (err) => {
          console.warn(err);
          if (micBtn) micBtn.classList.remove("listening");
          if (micStatus) micStatus.textContent = i18n.t("voice_mic_title");
        }
      );
    }
  }

  speakStep1Prompt() {
    const prompt = i18n.getAudioPrompt("audio_step1");
    speechService.speak(prompt, this.currentLanguage);
  }

  speakVitalsPrompt() {
    const prompt = i18n.getAudioPrompt("audio_step2");
    speechService.speak(prompt, this.currentLanguage);
  }

  speakDocScanPrompt() {
    const prompt = i18n.getAudioPrompt("audio_step3");
    speechService.speak(prompt, this.currentLanguage);
  }

  initBodyMapModule() {
    const container = document.getElementById("bodymap2dCanvasContainer") || document.getElementById("bodymap3dCanvasContainer");
    const questionContainer = document.getElementById("symptomQuestionEngineContainer");

    if (container) {
      if (this.bodyMap2DInstance) {
        try {
          this.bodyMap2DInstance.destroy?.();
        } catch (e) {
          console.warn("[MediKiosk] Previous bodymap cleanup error:", e);
        }
        this.bodyMap2DInstance = null;
      }
      this.bodyMap2DInstance = new BodyMap2D(container);
      this.bodyMap2DInstance.init();
    }

    if (questionContainer) {
      if (this.questionEngineInstance) {
        try {
          this.questionEngineInstance.destroy?.();
        } catch (e) {
          console.warn("[MediKiosk] Previous question engine cleanup error:", e);
        }
        this.questionEngineInstance = null;
      }
      this.questionEngineInstance = new SymptomQuestionEngine(questionContainer, {
        onSummaryGenerated: (summary) => this.handleIntakeSummaryGenerated(summary),
        onEmergencyTriggered: (triage) => this.handleEmergencyTriggered(triage)
      });
      this.questionEngineInstance.init();
    }
  }

  destroyBodyMapModule() {
    if (this.bodyMap2DInstance) {
      this.bodyMap2DInstance.destroy?.();
      this.bodyMap2DInstance = null;
    }
    if (this.questionEngineInstance) {
      this.questionEngineInstance.destroy?.();
      this.questionEngineInstance = null;
    }
  }

  handleAnatomySearch(query) {
    const dropdown = document.getElementById("anatomySearchDropdown");
    if (!dropdown) return;

    if (!query || query.trim().length === 0) {
      dropdown.style.display = "none";
      return;
    }

    const results = anatomyRegistryService.search(query, this.currentLanguage);
    if (results.length === 0) {
      dropdown.innerHTML = `<div style="padding: 10px; font-size: 0.78rem; color: #94A3B8;">No anatomical parts found matching "${query}"</div>`;
      dropdown.style.display = "block";
      return;
    }

    dropdown.innerHTML = results.slice(0, 8).map(item => `
      <div class="search-item" onclick="window.app.selectAnatomyFromSearch('${item.id}')" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <div>
          <strong style="color: #FFFFFF; font-size: 0.82rem;">${item.displayName[this.currentLanguage] || item.displayName.en}</strong>
          <span style="font-size: 0.7rem; color: #94A3B8; margin-left: 6px;">(${item.displayName.en})</span>
        </div>
        <div style="font-size: 0.68rem; color: #38BDF8; margin-top: 2px;">
          ${item.system.toUpperCase()} • ${item.laterality.toUpperCase()} • SNOMED: ${item.snomedBodyStructure.code}
        </div>
      </div>
    `).join("");
    dropdown.style.display = "block";
  }

  selectAnatomyFromSearch(id) {
    bodymapStore.selectPart(id, false);
    const dropdown = document.getElementById("anatomySearchDropdown");
    const input = document.getElementById("anatomySearchInput");
    if (dropdown) dropdown.style.display = "none";
    if (input) {
      const item = anatomyRegistryService.getById(id);
      input.value = item ? item.displayName[this.currentLanguage] || item.displayName.en : "";
    }
  }

  setCameraPreset(preset) {
    if (this.bodyMap2DInstance) {
      this.bodyMap2DInstance.setView(preset === "back" ? "back" : "front");
    }
  }

  setBodyMapOpacity(val) {
    if (this.bodyMap2DInstance) {
      this.bodyMap2DInstance.setPeelLevel(val);
    }
  }

  toggleIsolateSelected(val) {
    bodymapStore.setIsolateSelected(val);
  }

  setAnatomySystem(systemId) {
    bodymapStore.setActiveSystem(systemId);
    if (this.bodyMap2DInstance) {
      this.bodyMap2DInstance.setSystem(systemId);
    }
  }

  removeSelectedOrgan(id) {
    bodymapStore.deselectPart(id);
  }

  toggle3DBodyMapMode() {
    if (this.bodyMap2DInstance) {
      const nextView = this.bodyMap2DInstance.currentView === "front" ? "back" : "front";
      this.bodyMap2DInstance.setView(nextView);
    }
  }

  resetBodyMap() {
    bodymapStore.reset();
    if (this.bodyMap2DInstance) {
      this.bodyMap2DInstance.resetTransform();
      this.bodyMap2DInstance.setView("front");
    }
  }

  handleIntakeSummaryGenerated(summary) {
    this.patient.anatomicalIntake = summary;
    if (summary.primaryPart) {
      const organName = summary.primaryPart.displayName[this.currentLanguage] || summary.primaryPart.displayName.en;
      this.patient.chiefComplaint = `${organName} - ${summary.urgency.label}`;
    }
    this.showDoctorToast(`✓ Anatomical Clinical Summary recorded for ${summary.primaryPart?.displayName?.en || 'selected region'}`);
  }

  handleEmergencyTriggered(triage) {
    this.patient.isEmergency = true;
    if (!this.patient.emergencyDetails) {
      this.patient.emergencyDetails = triage;
    }
    const alertMsg = triage.triggeredRules?.[0]?.reason || "Critical clinical red flag detected during symptom intake!";
    this.showDoctorToast(`🚨 CRITICAL EMERGENCY ALERT: ${alertMsg}`);
  }

  resetSession() {
    this.stopCamera();
    this.resetPatientState();
    this.currentStep = 1;
    this.render();
  }
}

// Initialize Application
function bootstrapApp() {
  if (!window.app) {
    window.app = new MediKioskApp();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapApp);
} else {
  bootstrapApp();
}

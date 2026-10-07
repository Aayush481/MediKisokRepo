/**
 * MediKiosk - Clinical Intake & Doctor Portal Application
 * Orchestrates patient intake wizard, optical rPPG vitals telemetry,
 * document OCR parsing, and doctor consultation queue.
 */

import { speechService } from "./services/speechService.js";
import { clinicalParser } from "./services/clinicalParser.js";
import { ayushEngine } from "./services/ayushEngine.js";
import { ocrEngine } from "./services/ocrEngine.js";
import { prescriptionParser } from "./services/prescriptionParser.js";
import { labParser } from "./services/labParser.js";
import { fhirService } from "./services/fhirService.js";
import { rppgService } from "./services/rppgVitalsService.js";
import { meshService } from "./services/meshService.js";
import { diseaseExtractor } from "./services/diseaseExtractor.js";
import { i18n } from "./services/i18nService.js";
import { validateAbhaId, formatAbhaInput, ABDM_REGISTRY } from "./services/abhaService.js";

// Modular UI Components
import { renderStepper } from "./components/Stepper.js";
import { renderStep1Registration } from "./components/Step1Registration.js";
import { renderStep2VitalsAndIntake, renderBodyMapModule, renderAyushModule } from "./components/Step2Vitals.js";
import { renderStep3Records } from "./components/Step3Records.js";
import { renderStep4Summary, generateBarcodeSvg } from "./components/Step4Summary.js";
import { renderDoctorDashboard } from "./components/DoctorDashboard.js";
import { initHero3D, updateHeroActiveState } from "./components/HeroSection.js";
import { SKELETAL_REGIONS } from "./components/SkeletalBodyMap.js";
import { clinicalTriageService, HOSPITAL_DOCTORS } from "./services/clinicalTriageService.js";

function generateMedicalDocSvg(type, title, facility, items = [], rootCause = "", patientName = "Priya Patel", token = "A-24") {
  const isRx = type === "prescription";
  const isLab = type === "lab_report";
  const isRadio = type === "radiology" || type === "scan";
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  let bodyContent = "";
  if (isRx) {
    bodyContent = `
      <g transform="translate(40, 220)">
        <text x="0" y="0" font-family="'Inter', system-ui, serif" font-size="34" font-weight="900" fill="#000000">℞</text>
        <line x1="0" y1="15" x2="520" y2="15" stroke="#E4E4E7" stroke-width="1.5"/>
        ${items.map((it, idx) => `
          <g transform="translate(0, ${45 + idx * 56})">
            <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="bold" fill="#000000">${idx + 1}. ${typeof it === 'string' ? it : it.name} ${it.dosage || ''} - ${it.freq || 'OD'}</text>
            <text x="20" y="20" font-family="system-ui, sans-serif" font-size="11" fill="#52525B">Sig: ${it.timing || 'After Meals'} • Dur: ${it.duration || '5 days'} • Route: ${it.route || 'Oral'}</text>
            <text x="20" y="34" font-family="'JetBrains Mono', monospace" font-size="10" fill="#71717A">SNOMED: ${it.snomedCode || '387517004'} | Class: ${it.schedule || 'Schedule H'}</text>
          </g>
        `).join('')}
      </g>
    `;
  } else if (isLab) {
    bodyContent = `
      <g transform="translate(40, 220)">
        <rect x="0" y="0" width="520" height="28" fill="#F4F4F5" rx="3" stroke="#E4E4E7" stroke-width="1"/>
        <text x="12" y="19" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold" fill="#000000">INVESTIGATION / PARAMETER</text>
        <text x="280" y="19" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold" fill="#000000">OBSERVED VALUE</text>
        <text x="420" y="19" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold" fill="#000000">FLAG STATUS</text>
        ${items.map((it, idx) => {
          const isHigh = it.status === 'HIGH' || it.status === 'ABNORMAL';
          const isLow = it.status === 'LOW';
          const isAbnormal = isHigh || isLow;
          return `
            <g transform="translate(0, ${48 + idx * 36})">
              <text x="12" y="0" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#18181B">${it.name}</text>
              <text x="280" y="0" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold" fill="#000000">${it.value}</text>
              <rect x="420" y="-12" width="76" height="18" fill="${isAbnormal ? '#000000' : '#FAFAFA'}" rx="3" stroke="#27272A" stroke-width="1"/>
              <text x="458" y="1" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="bold" fill="${isAbnormal ? '#FFFFFF' : '#52525B'}">${it.status}</text>
              <line x1="0" y1="12" x2="520" y2="12" stroke="#F4F4F5" stroke-width="1"/>
            </g>
          `;
        }).join('')}
      </g>
    `;
  } else {
    bodyContent = `
      <g transform="translate(40, 220)">
        <rect x="0" y="0" width="520" height="260" fill="#000000" rx="6" stroke="#27272A" stroke-width="1.5"/>
        <circle cx="260" cy="130" r="95" fill="none" stroke="#27272A" stroke-dasharray="6,4"/>
        <path d="M 180,80 C 140,110 130,170 170,220 C 190,200 200,160 190,110 Z" fill="#18181B" opacity="0.8"/>
        <path d="M 340,80 C 380,110 390,170 350,220 C 330,200 320,160 330,110 Z" fill="#18181B" opacity="0.8"/>
        <circle cx="345" cy="175" r="22" fill="#FFFFFF" fill-opacity="0.12" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="4,2"/>
        <text x="375" y="180" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold" fill="#FFFFFF">Focal Finding</text>
        <text x="20" y="30" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="bold" fill="#FFFFFF">DIGITAL RADIOGRAM 100kVp</text>
        <text x="500" y="30" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="11" fill="#A1A1AA">PA ERECT</text>
        <text x="260" y="245" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">Diagnostic Impression: ${rootCause.slice(0, 48)}</text>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="820" viewBox="0 0 600 820">
    <rect width="600" height="820" fill="#FFFFFF" rx="4"/>
    <rect x="12" y="12" width="576" height="796" fill="none" stroke="#18181B" stroke-width="1.5" rx="4"/>
    
    <rect x="20" y="20" width="560" height="96" fill="#000000" rx="4"/>
    <text x="40" y="52" font-family="system-ui, sans-serif" font-size="18" font-weight="800" fill="#FFFFFF">${facility}</text>
    <text x="40" y="74" font-family="system-ui, sans-serif" font-size="12" fill="#D4D4D8">${title}</text>
    <text x="40" y="94" font-family="'JetBrains Mono', monospace" font-size="9" fill="#A1A1AA">ABDM Health Facility Registry (HFR) Accredited • Telemetry Desk</text>
    <text x="560" y="52" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="11" fill="#FFFFFF">REF: #${Math.floor(100000 + Math.random() * 900000)}</text>
    <text x="560" y="74" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="11" fill="#A1A1AA">${dateStr}</text>

    <text x="300" y="470" text-anchor="middle" font-family="system-ui, sans-serif" font-size="44" font-weight="900" fill="#F4F4F5" transform="rotate(-30 300 470)">${(type || 'DOCUMENT').toUpperCase()}</text>

    <rect x="25" y="130" width="550" height="52" fill="#FAFAFA" stroke="#E4E4E7" stroke-width="1" rx="3"/>
    <text x="40" y="152" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#000000">PATIENT: <tspan fill="#000000">${patientName.toUpperCase()}</tspan></text>
    <text x="240" y="152" font-family="'JetBrains Mono', monospace" font-size="11" fill="#52525B">TOKEN: <tspan font-weight="bold" fill="#000000">${token}</tspan></text>
    <text x="380" y="152" font-family="'JetBrains Mono', monospace" font-size="11" fill="#52525B">DATE: <tspan fill="#000000">${dateStr}</tspan></text>
    <text x="40" y="170" font-family="system-ui, sans-serif" font-size="10" fill="#52525B">CLINICAL FINDING: <tspan font-weight="bold" fill="#000000">${rootCause}</tspan></text>

    ${bodyContent}

    <g transform="translate(360, 700)">
      <rect x="0" y="0" width="200" height="65" fill="#FAFAFA" stroke="#000000" stroke-width="1.5" stroke-dasharray="3,2" rx="3"/>
      <text x="100" y="24" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="bold" fill="#000000">DIGITALLY VERIFIED</text>
      <text x="100" y="40" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#27272A">Dr. Consultation Desk 3</text>
      <text x="100" y="54" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="8" fill="#71717A">REG NO: MCI-44912/2016</text>
    </g>
    <text x="40" y="760" font-family="'JetBrains Mono', monospace" font-size="9" fill="#71717A">MediKiosk Clinical Ingestion Engine • ISO 13606 / HL7 FHIR Compliant</text>
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
    this.lastUploadedDocStatus = null;
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

    // ABHA e-KYC & Intake State
    this.abhaMode = 'abha'; // 'abha' | 'manual'
    this.abhaValidationError = null;
    this.isAbhaVerifying = false;

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
      mobile: "",
      isAbhaVerified: false,
      abhaDetails: null,
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
      skeletalRegion: null,
      skeletalRegions: [],
      skeletalView: "anterior",
      bodyMapLayer: "all",
      skeletalMcqAnswers: {},
      rppgVitals: null,
      isEmergency: false,
      assignedDoctor: null,
      triageResult: null,
      tokenNumber: "A-" + Math.floor(10 + Math.random() * 89)
    };
  }

  init() {
    this.initTheme();
    this.currentLanguage = i18n.getLanguage() || "hi";
    speechService.setLanguage(this.currentLanguage);
    const langSelect = document.getElementById("langSelect");
    if (langSelect) langSelect.value = this.currentLanguage;
    this.updateStaticHeaderTranslations();
    this.bindGlobalEvents();
    this.render();
    initHero3D(this);
    this.updateHeroActiveState(this.currentMode);
  }

  initTheme() {
    const saved = localStorage.getItem('medikiosk-theme') || 'light';
    this.currentTheme = saved;
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeButton();
  }

  toggleTheme() {
    this.currentTheme = (this.currentTheme === 'dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('medikiosk-theme', this.currentTheme);
    this.updateThemeButton();
  }

  updateThemeButton() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    const isDark = this.currentTheme === 'dark';
    btn.innerHTML = isDark ? `<span>☀️ Light</span>` : `<span>🌙 Dark</span>`;
  }

  toggleHero() {
    const hero = document.getElementById('heroSection');
    if (!hero) return;
    const isCollapsed = hero.classList.toggle('collapsed');
    const btn = document.getElementById('heroToggleBtn');
    if (btn) {
      btn.innerHTML = isCollapsed ? `<span>✨ Show 3D</span>` : `<span>✨ Hide 3D</span>`;
    }
  }

  updateHeroActiveState(mode) {
    updateHeroActiveState(mode || this.currentMode);
  }

  enterPatientPortal() {
    if (this.currentMode !== "kiosk") {
      this.setMode("kiosk");
    } else {
      this.updateHeroActiveState("kiosk");
    }
    const target = document.getElementById("services");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  enterDoctorPortal() {
    if (this.currentMode !== "doctor") {
      this.setMode("doctor");
    } else {
      this.updateHeroActiveState("doctor");
    }
    const target = document.getElementById("services");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  navigateToService(stepNumber, optionalAyush = false) {
    if (this.currentMode !== "kiosk") {
      this.setMode("kiosk");
    }
    if (optionalAyush) {
      this.goToStep(2);
      if (!this.isAyushMode) {
        this.toggleAyushMode();
      }
    } else {
      this.goToStep(stepNumber);
    }
    this.updateHeroActiveState("kiosk");
    const target = document.getElementById("services");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
    if (quickIntake) quickIntake.innerHTML = ` <strong>${i18n.t("quick_intake_mode")}</strong>`;

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

  setMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll(".mode-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    this.updateHeroActiveState(mode);

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
    }
    this.currentStep = step;
    this.render();
    if (step === 2) {
      setTimeout(() => {
        this.initCamera();
        this.drawLiveOscilloscope();
      }, 100);
    }
  }

  async nextStep() {
    if (this.currentStep === 1) {
      this.saveStep1AndNext();
      return;
    }
    if (this.currentStep === 2) {
      await this.evaluateStep2SymptomsAndProceed();
      return;
    }
    if (this.currentStep < 4) {
      this.goToStep(this.currentStep + 1);
      if (this.currentStep === 4) {
        this.enqueuePatient();
      }
    }
  }

  async evaluateStep2SymptomsAndProceed() {
    // Stop camera sensor when leaving Step 2
    this.stopCamera();

    // 1. Sync input values from textarea if present
    const chiefInput = document.getElementById("chiefComplaintText");
    if (chiefInput && chiefInput.value.trim()) {
      this.patient.chiefComplaint = chiefInput.value.trim();
    }

    if (!this.patient.chiefComplaint) {
      if (this.patient.skeletalRegions && this.patient.skeletalRegions.length > 0) {
        this.patient.chiefComplaint = `${this.patient.skeletalRegions.join(', ')} pain and discomfort`;
      } else {
        this.patient.chiefComplaint = "General health checkup and malaise";
      }
    }

    const modal = document.getElementById("triageModal");
    const container = document.getElementById("triageModalContainer");
    if (!modal || !container) {
      this.goToStep(3);
      return;
    }

    modal.style.display = "flex";
    container.innerHTML = `
      <div class="triage-modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.4rem;">🩺</span>
          <div>
            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-display);">AI Clinical Triage & Department Matching</h3>
            <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted);">Evaluating symptoms against clinical protocols & hospital department roster</p>
          </div>
        </div>
        <span class="pill-3d pill-3d-blue">Processing Stream</span>
      </div>

      <div class="triage-modal-body" style="text-align: center; padding: 2.75rem 1.5rem;">
        <div class="triage-loading-spinner"></div>
        <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
          Evaluating Symptoms & Hemodynamics...
        </h4>
        <p style="font-size: 0.82rem; color: var(--text-secondary); max-width: 520px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
          Checking reported complaint <strong style="color: var(--primary);">"${this.patient.chiefComplaint}"</strong> for home self-care eligibility and matching appropriate hospital OPD department.
        </p>
        <div style="display: inline-flex; gap: 10px; font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); background: var(--bg-surface-inset); padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border-light); flex-wrap: wrap; justify-content: center;">
          <span>Pulse: ${this.patient.rppgVitals?.heartRate || '75'} BPM</span>
          <span>•</span>
          <span>SpO2: ${this.patient.rppgVitals?.spO2 || '98'}%</span>
          <span>•</span>
          <span>Severity: ${this.patient.hpi?.severity || 0}/10</span>
          <span>•</span>
          <span>Mode: ${this.isAyushMode ? 'AYUSH Holistic' : 'Allopathic Clinical'}</span>
        </div>
      </div>
    `;

    try {
      const triage = await clinicalTriageService.evaluateSymptoms({
        ...this.patient,
        isAyushMode: this.isAyushMode
      });

      this.patient.triageResult = triage;
      this.patient.assignedDoctor = triage.assignedDoctor;

      if (triage.isHomeRemedyEligible && triage.homeRemedyPlan) {
        this.renderHomeRemedyModal(triage);
      } else {
        this.renderEscalationModal(triage);
      }
    } catch (err) {
      console.warn("Clinical triage evaluation notice:", err);
      const fallback = clinicalTriageService.evaluateClientRules({
        ...this.patient,
        isAyushMode: this.isAyushMode
      });
      this.patient.triageResult = fallback;
      this.patient.assignedDoctor = fallback.assignedDoctor;

      if (fallback.isHomeRemedyEligible && fallback.homeRemedyPlan) {
        this.renderHomeRemedyModal(fallback);
      } else {
        this.renderEscalationModal(fallback);
      }
    }
  }

  renderHomeRemedyModal(triage) {
    const container = document.getElementById("triageModalContainer");
    if (!container) return;

    const plan = triage.homeRemedyPlan;
    const doc = triage.assignedDoctor || HOSPITAL_DOCTORS.general;

    container.innerHTML = `
      <div class="triage-modal-header" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(52, 211, 153, 0.05) 100%); border-bottom: 1.5px solid var(--primary-border);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--primary-gradient); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            🌿
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.68rem; font-weight: 800;">MILD CONDITION • HOME REMEDY SUITABLE</span>
              <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">Severity: ${this.patient.hpi?.severity || 0}/10</span>
            </div>
            <h3 style="margin: 4px 0 0 0; font-size: 1.15rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-display);">
              ${plan.title || 'Mild Self-Care Protocol'}
            </h3>
            ${plan.hi_title ? `<p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">${plan.hi_title}</p>` : ''}
          </div>
        </div>
        <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.82rem;" onclick="window.app.closeTriageModal()">✕</button>
      </div>

      <div class="triage-modal-body">
        <div style="background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 14px;">
          <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
            <strong style="color: var(--primary);">Clinical Assessment:</strong> ${plan.conditionSummary || triage.rationale}
          </p>
        </div>

        <h4 style="font-size: 0.88rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-primary); margin: 0 0 4px 0; font-family: var(--font-mono);">
          Evidence-Based Verified Home Remedies & Self-Care:
        </h4>

        <div class="remedy-grid">
          ${(plan.remedies || []).map(r => `
            <div class="remedy-card">
              <div class="remedy-icon-bubble">${r.icon || '🍵'}</div>
              <div class="remedy-title">${r.name}</div>
              <div class="remedy-instruction">${r.instruction}</div>
              <div class="remedy-mechanism">
                <strong>Mechanism:</strong> ${r.mechanism}
              </div>
            </div>
          `).join('')}
        </div>

        ${plan.lifestyleTips && plan.lifestyleTips.length > 0 ? `
          <div style="background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 12px 16px; margin-top: 10px;">
            <strong style="font-size: 0.8rem; color: var(--text-primary); font-family: var(--font-mono); text-transform: uppercase; display: block; margin-bottom: 6px;">
              💡 Lifestyle & Dietary Advice:
            </strong>
            <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5;">
              ${plan.lifestyleTips.map(t => `<li style="margin-bottom: 3px;">${t}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="red-flag-alert-box">
          <div class="red-flag-icon">⚠️</div>
          <div class="red-flag-content">
            <h5>When to Consult Doctor / Hospital Red Flags</h5>
            <p>${plan.whenToSeeDoctor || 'If symptoms persist beyond 48 hours or worsen unexpectedly.'}</p>
          </div>
        </div>

        <div style="margin-top: 14px; background: rgba(14, 165, 233, 0.06); border: 1px solid var(--blue-border); border-radius: var(--radius-md); padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.3rem;">👨‍⚕️</span>
            <div>
              <span style="font-size: 0.7rem; font-weight: 700; color: var(--blue); text-transform: uppercase; font-family: var(--font-mono);">Pre-Assigned Attending Doctor on Standby</span>
              <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">${doc.name} (${doc.specialty}) • <span class="cabin-tag">${doc.cabin}</span></div>
            </div>
          </div>
          <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); white-space: nowrap;">Wait ~${doc.avgWaitMins || 10}m</span>
        </div>
      </div>

      <div class="triage-modal-footer">
        <button class="btn-3d btn-3d-secondary" onclick="window.app.closeTriageModal()">
          Close
        </button>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn-3d btn-3d-success" onclick="window.app.acceptHomeRemedies()">
            🌿 Accept Home Care & Download Pass
          </button>
          <button class="btn-3d btn-3d-primary" onclick="window.app.proceedToRecordsFromTriage()">
            🏥 Consult Doctor Anyway (Upload Documents) →
          </button>
        </div>
      </div>
    `;
  }

  renderEscalationModal(triage) {
    const container = document.getElementById("triageModalContainer");
    if (!container) return;

    const doc = triage.assignedDoctor || HOSPITAL_DOCTORS.general;

    container.innerHTML = `
      <div class="triage-modal-header" style="background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(99, 102, 241, 0.06) 100%); border-bottom: 1.5px solid var(--blue-border);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--blue-gradient); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);">
            🏥
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="pill-3d ${triage.badgeColor || 'pill-3d-blue'}" style="font-size: 0.68rem; font-weight: 800;">
                ${triage.triageBadge || 'CLINICAL CONSULTATION REQUIRED'}
              </span>
              <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">Automated Hospital Match</span>
            </div>
            <h3 style="margin: 4px 0 0 0; font-size: 1.15rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-display);">
              Clinical Consultation & Records Review Required
            </h3>
          </div>
        </div>
        <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.82rem;" onclick="window.app.proceedToRecordsFromTriage()">✕</button>
      </div>

      <div class="triage-modal-body">
        <div style="background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 16px;">
          <strong style="font-size: 0.82rem; color: var(--text-primary); font-family: var(--font-mono); text-transform: uppercase; display: block; margin-bottom: 4px;">
            AI Clinical Rationale:
          </strong>
          <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
            ${triage.rationale || 'Patient presentation requires formal clinical physical evaluation and diagnostic review by an attending specialist.'}
          </p>
        </div>

        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%); border: 1.5px solid var(--primary-border); border-radius: var(--radius-lg); padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.7rem; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); flex-shrink: 0;">
              👨‍⚕️
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                <span class="pill-3d pill-3d-emerald" style="font-size: 0.66rem; font-weight: 800;">AUTOMATICALLY SELECTED SPECIALIST</span>
                <span class="cabin-tag">${doc.cabin}</span>
              </div>
              <h4 style="margin: 0; font-size: 1.12rem; font-weight: 800; color: var(--text-primary);">${doc.name} <span style="font-size: 0.82rem; font-weight: normal; color: var(--text-secondary);">(${doc.qualification})</span></h4>
              <p style="margin: 3px 0 0 0; font-size: 0.82rem; font-weight: 700; color: var(--primary);">${doc.specialty}</p>
              <p style="margin: 2px 0 0 0; font-size: 0.74rem; color: var(--text-muted);">${doc.wing}, Room ${doc.room} • Est. Wait: ~${doc.avgWaitMins || 15} Mins</p>
            </div>
          </div>
          <div style="text-align: right; flex-shrink: 0;">
            <span class="pill-3d pill-3d-blue" style="font-size: 0.74rem;">Matched</span>
          </div>
        </div>

        <div style="background: var(--bg-surface-inset); border: 1px dashed var(--border-medium); border-radius: var(--radius-md); padding: 12px 16px;">
          <strong style="font-size: 0.78rem; color: var(--text-primary); font-family: var(--font-mono); text-transform: uppercase; display: block; margin-bottom: 2px;">
            Next Step: Step 3 (Document Uploadation)
          </strong>
          <p style="margin: 0; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.45;">
            Please proceed to upload any prior prescriptions, pathology lab reports, or X-rays. MediKiosk OCR will extract diagnostic findings directly for <strong>${doc.name}</strong>.
          </p>
        </div>
      </div>

      <div class="triage-modal-footer">
        <span style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono);" id="triageCountdownNotice">
          Forwarding to Step 3 in 2 seconds...
        </span>
        <button class="btn-3d btn-3d-primary" onclick="window.app.proceedToRecordsFromTriage()">
          Proceed to Document Uploadation (Step 3) →
        </button>
      </div>
    `;

    // Auto forward after 2.5 seconds
    this.triageTimer = setTimeout(() => {
      this.proceedToRecordsFromTriage();
    }, 2500);
  }

  proceedToRecordsFromTriage() {
    if (this.triageTimer) {
      clearTimeout(this.triageTimer);
      this.triageTimer = null;
    }
    const modal = document.getElementById("triageModal");
    if (modal) modal.style.display = "none";
    this.goToStep(3);
  }

  closeTriageModal() {
    if (this.triageTimer) {
      clearTimeout(this.triageTimer);
      this.triageTimer = null;
    }
    const modal = document.getElementById("triageModal");
    if (modal) modal.style.display = "none";
  }

  acceptHomeRemedies() {
    if (this.triageTimer) {
      clearTimeout(this.triageTimer);
      this.triageTimer = null;
    }
    const plan = this.patient.triageResult?.homeRemedyPlan;
    const doc = this.patient.assignedDoctor || HOSPITAL_DOCTORS.general;
    const patientName = this.patient.name || "Walk-in Patient";
    const token = this.patient.tokenNumber || "A-15";

    const passText = `=====================================================
MEDIKIOSK DIGITAL HEALTHCARE - AI SELF-CARE CLINICAL PASS
=====================================================
PATIENT: ${patientName.toUpperCase()}
TOKEN: ${token}
UHID: ${this.patient.id}
DATE: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US')}

CLINICAL IMPRESSION:
${plan?.title || 'Mild Self-Care Protocol'}
${plan?.conditionSummary || ''}

VERIFIED HOME REMEDIES:
${(plan?.remedies || []).map((r, i) => `${i+1}. ${r.name}\n   - Instruction: ${r.instruction}\n   - Mechanism: ${r.mechanism}`).join('\n\n')}

LIFESTYLE & DIETARY ADVICE:
${(plan?.lifestyleTips || []).map(t => `* ${t}`).join('\n')}

WHEN TO VISIT HOSPITAL DOCTOR:
${plan?.whenToSeeDoctor || 'If symptoms persist beyond 48 hours.'}

ASSIGNED OPD SPECIALIST ON STANDBY:
${doc.name} (${doc.specialty} • ${doc.cabin}, Room ${doc.room})
=====================================================
MediKiosk Enterprise v2.4 • ABDM Compliant First-Mile Triage
=====================================================`;

    const blob = new Blob([passText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MediKiosk_SelfCare_Pass_${token}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`🌿 Self-Care Guidance Pass downloaded successfully!\n\nYour verified home remedies for "${plan?.title || 'mild symptoms'}" are saved. If symptoms worsen, proceed to OPD ${doc.cabin}.`);

    this.closeTriageModal();
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
    if (this.patient.assignedDoctor) clone.assignedDoctor = this.patient.assignedDoctor;

    const existingIdx = this.doctorQueue.findIndex(p => p.id === clone.id);
    if (existingIdx >= 0) {
      this.doctorQueue[existingIdx] = clone;
    } else {
      // Append newly created walk-in patient at the END of the live OPD queue
      this.doctorQueue.push(clone);
    }
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
        <!-- Multi-step intake navigation -->
        ${renderStepper(this, i18n)}

        <!-- Active Wizard Step -->
        ${this.renderCurrentStepContent()}
      `;
      this.bindKioskEvents();
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
  // Step 1: Patient registration & ABHA check-in
  renderStep1Registration() {
    return renderStep1Registration(this, i18n);
  }

  // Step 2: Optical vitals and clinical intake
  renderStep2VitalsAndIntake() {
    return renderStep2VitalsAndIntake(this, i18n);
  }

  // Anatomical body map localization
  renderBodyMapModule() {
    return renderBodyMapModule(this, i18n);
  }

  // AYUSH Prakriti assessment module
  renderAyushModule() {
    return renderAyushModule(this, i18n);
  }

  // Step 3: Medical records and OCR findings
  renderStep3Records() {
    return renderStep3Records(this, i18n);
  }

  // Barcode generator for consultation pass
  generateBarcodeSvg(text) {
    return generateBarcodeSvg(text);
  }

  // Step 4: OPD token pass and encounter summary
  renderStep4Summary() {
    return renderStep4Summary(this, i18n);
  }

  // Doctor consultation desk and queue management
  renderDoctorDashboard() {
    return renderDoctorDashboard(this, i18n);
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

    // Real-time reactive manual registration input sync (only when not in verified ABHA mode)
    if (!this.patient.isAbhaVerified) {
      const nameInput = document.getElementById("patientNameInput");
      const ageInput = document.getElementById("patientAgeInput");
      const genderInput = document.getElementById("patientGenderInput");
      const mobileInput = document.getElementById("patientMobileInput");

      const syncManualInputs = () => {
        if (nameInput) this.patient.name = nameInput.value.trim();
        if (ageInput) this.patient.age = parseInt(ageInput.value.trim(), 10) || '';
        if (genderInput) this.patient.gender = genderInput.value;
        if (mobileInput) this.patient.mobile = mobileInput.value.trim();
      };

      [nameInput, ageInput, genderInput, mobileInput].forEach(el => {
        if (el) el.addEventListener("input", syncManualInputs);
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

  quickFillDemo(type) {
    const profiles = {
      ramesh: {
        name: "Ramesh Kumar",
        age: 48,
        gender: "Male",
        abhaId: "91-4820-1940-5821",
        mobile: "+91 98450 12345"
      },
      sunita: {
        name: "Sunita Sharma",
        age: 36,
        gender: "Female",
        abhaId: "91-7210-4491-0392",
        mobile: "+91 99801 84729"
      },
      priya: {
        name: "Priya Patel",
        age: 24,
        gender: "Female",
        abhaId: "91-8274-1923-0194",
        mobile: "+91 98765 43210"
      }
    };
    const p = profiles[type] || profiles.priya;
    this.patient.name = p.name;
    this.patient.age = p.age;
    this.patient.gender = p.gender;
    this.patient.abhaId = p.abhaId;
    this.patient.mobile = p.mobile;
    this.render();
  }

  loadSampleDoc(type) {
    if (type === "rx") {
      this.patient.documents = [{
        id: "doc-sample-rx",
        name: "Doctor Prescription (Rx) - Outpatient.pdf",
        type: "prescription",
        categoryLabel: "Doctor Prescription (Rx)",
        doctorName: "Dr. Ananya Sharma, MD",
        facility: "Bangalore General Hospital - OPD Wing",
        date: "Today",
        previewUrl: generateMedicalDocSvg("prescription", "Outpatient Prescription Record", "Bangalore General Hospital", [
          { name: "Amoxicillin + Clavulanic Acid (Augmentin 625)", dosage: "625 mg", freq: "TDS", timing: "After Food", duration: "5 days", route: "Oral", snomedCode: "387517004", schedule: "Schedule H" },
          { name: "Pantoprazole (Pan-D)", dosage: "40 mg", freq: "OD", timing: "Before Breakfast", duration: "10 days", route: "Oral", snomedCode: "387063000", schedule: "Schedule H" },
          { name: "Levocetirizine + Montelukast (Montair-LC)", dosage: "10 mg / 5 mg", freq: "HS", timing: "Night Bedtime", duration: "7 days", route: "Oral", snomedCode: "420379008", schedule: "Schedule H" }
        ], "Upper Respiratory Infection with Acute Rhinitis", this.patient.name || "Ramesh Kumar", this.patient.tokenNumber || "A-15"),
        medications: [
          { name: "Amoxicillin + Clavulanic Acid (Augmentin 625)", dosage: "625 mg", frequency: "TDS", timing: "After Food", duration: "5 days", route: "Oral" },
          { name: "Pantoprazole (Pan-D)", dosage: "40 mg", frequency: "OD", timing: "Before Breakfast", duration: "10 days", route: "Oral" },
          { name: "Levocetirizine + Montelukast (Montair-LC)", dosage: "10 mg / 5 mg", frequency: "HS", timing: "Night Bedtime", duration: "7 days", route: "Oral" }
        ],
        diseases: [{ name: "Acute Upper Respiratory Tract Infection", snomed: "195662009" }],
        flags: []
      }];
    } else if (type === "lab") {
      this.patient.documents = [{
        id: "doc-sample-lab",
        name: "Comprehensive Pathology & Biochemistry Report.pdf",
        type: "lab_report",
        categoryLabel: "Pathology & Biochemistry Report",
        doctorName: "Dr. R. K. Singhal, MD (Path)",
        facility: "Apex Central Diagnostic Pathology Lab",
        date: "Today",
        previewUrl: generateMedicalDocSvg("lab_report", "Comprehensive Metabolic & Lipid Panel", "Apex Central Diagnostic Pathology Lab", [
          { name: "Fasting Blood Glucose", value: "198.50 mg/dL", status: "HIGH" },
          { name: "HbA1c (Glycated Hemoglobin)", value: "9.40 %", status: "HIGH" },
          { name: "Serum Triglycerides", value: "342.00 mg/dL", status: "HIGH" },
          { name: "Total Cholesterol", value: "248.00 mg/dL", status: "HIGH" },
          { name: "Serum Creatinine", value: "1.85 mg/dL", status: "HIGH" }
        ], "Uncontrolled Hyperglycemia & Atherogenic Dyslipidemia", this.patient.name || "Ramesh Kumar", this.patient.tokenNumber || "A-15"),
        medications: [],
        diseases: [{ name: "Type 2 Diabetes Mellitus with Hyperglycemia", snomed: "44054006" }],
        flags: [
          { test: "Fasting Blood Glucose", param: "Glucose", value: "198.50 mg/dL", ref: "70.00 - 100.00 mg/dL", status: "HIGH (Elevated)" },
          { test: "HbA1c", param: "HbA1c", value: "9.40 %", ref: "< 5.70 %", status: "HIGH (Critical Poor Glycemic Control)" },
          { test: "Serum Triglycerides", param: "Triglycerides", value: "342.00 mg/dL", ref: "< 150.00 mg/dL", status: "HIGH (Hypertriglyceridemia)" },
          { test: "Total Cholesterol", param: "Cholesterol", value: "248.00 mg/dL", ref: "< 200.00 mg/dL", status: "HIGH (Hypercholesterolemia)" },
          { test: "Serum Creatinine", param: "Creatinine", value: "1.85 mg/dL", ref: "0.70 - 1.30 mg/dL", status: "HIGH (Renal Impairment)" }
        ]
      }];
    } else if (type === "xray") {
      this.patient.documents = [{
        id: "doc-sample-xray",
        name: "Digital Radiogram - Bilateral Knee PA Erect.png",
        type: "xray_report",
        categoryLabel: "X-Ray Radiograph (Bilateral Knee Joint)",
        doctorName: "Dr. Vikram Sethi, MD (Radio)",
        facility: "Advanced Imaging & Orthopedic Diagnostic Center",
        date: "Today",
        previewUrl: generateMedicalDocSvg("radiology", "Digital Skeletal Radiography", "Advanced Imaging Center", [], "Medial compartment joint space narrowing with subchondral sclerosis", this.patient.name || "Ramesh Kumar", this.patient.tokenNumber || "A-15"),
        anatomicalSite: "Bilateral Knee Joint (Tibiofemoral Articulation)",
        rootCause: "Degenerative Osteoarthritis with Medial Compartment Joint Space Narrowing (Sandhigata Vata)",
        medications: [],
        diseases: [{ name: "Osteoarthritis of Bilateral Knee Joints", snomed: "239873007", icd10: "M19.9" }],
        flags: [{ test: "Joint Space Width", param: "Knee Joint", value: "Narrowed (Grade III)", ref: "Normal Space", status: "ABNORMAL" }]
      }];
    } else if (type === "pns_xray" || type === "face") {
      this.patient.documents = [{
        id: "doc-sample-pns",
        name: "Digital Radiogram - PNS Water's View.png",
        type: "xray_report",
        categoryLabel: "Paranasal Sinuses (PNS - Water's / Caldwell Projection)",
        doctorName: "Dr. Vikram Sethi, MD (Radio)",
        facility: "Metro Head & Neck Imaging & ENT Diagnostic Center",
        date: "Today",
        previewUrl: generateMedicalDocSvg("radiology", "PNS & Facial Bone Radiography", "Metro Head & Neck Imaging", [], "Maxillary sinus mucosal thickening and opacification with Deviated Nasal Septum", this.patient.name || "Ramesh Kumar", this.patient.tokenNumber || "A-15"),
        anatomicalSite: "Paranasal Sinuses (PNS - Water's & Caldwell Projection)",
        rootCause: "Paranasal Sinusitis (Maxillary & Frontal Sinus Opacification / Mucosal Thickening)",
        medications: [],
        diseases: [
          { name: "Paranasal Sinusitis (Maxillary / Frontal)", icd10: "J01.90", snomed: "36971009", acuity: "Acute / Inflammatory", organSystem: "Paranasal Sinuses & Upper Airway" },
          { name: "Deviated Nasal Septum (DNS)", icd10: "J34.2", snomed: "402863004", acuity: "Structural / Mechanical", organSystem: "Nasal Cavity & Septum" }
        ],
        flags: [
          { test: "Radiological Impression", value: "Paranasal Sinusitis (Maxillary & Frontal Sinus Opacification)", ref: "Water's (Occipitomental) View", status: "DIAGNOSTIC", alertLevel: "warning" },
          { test: "Maxillary Sinus Aeration", value: "Mucosal thickening and antral opacification / fluid level", ref: "Bilateral Antra", status: "ABNORMAL", alertLevel: "warning" },
          { test: "Nasal Septum & Turbinates", value: "Septum shows marked deviation to left with turbinate hypertrophy", ref: "Nasal Cavity", status: "ABNORMAL", alertLevel: "warning" },
          { test: "Orbital Rims & Zygoma", value: "Bilateral orbital rims and zygomatic arches intact with no step-off", ref: "Facial Skeleton", status: "INTACT", alertLevel: "info" }
        ]
      }];
    } else if (type === "skull_xray" || type === "head") {
      this.patient.documents = [{
        id: "doc-sample-skull",
        name: "Digital Radiogram - Skull AP & Lateral View.png",
        type: "xray_report",
        categoryLabel: "Skull & Cranial Vault Radiograph (Calvarium AP & Lateral)",
        doctorName: "Dr. Vikram Sethi, MD (Radio)",
        facility: "Trauma Neuroimaging & Orthopedic Radiology",
        date: "Today",
        previewUrl: generateMedicalDocSvg("radiology", "Cranial Vault Digital Radiography", "Trauma Neuroimaging Center", [], "Intact cranial vault inner and outer calvarial tables without fracture", this.patient.name || "Ramesh Kumar", this.patient.tokenNumber || "A-15"),
        anatomicalSite: "Skull & Cranial Vault (Calvarium AP & Lateral)",
        rootCause: "Intact Cranial Vault: No Skull Fracture, Lytic Bone Lesion, or Calvarial Defect",
        medications: [],
        diseases: [],
        flags: [
          { test: "Radiological Impression", value: "Intact Cranial Vault: No Skull Fracture or Lytic Bone Lesion", ref: "Skull AP & Lateral", status: "NORMAL", alertLevel: "success" },
          { test: "Calvarium Table Integrity", value: "Continuous inner and outer cortical tables without traumatic step-off", ref: "Parietal & Frontal Vault", status: "INTACT", alertLevel: "info" },
          { test: "Cranial Sutures Alignment", value: "Normal coronal, sagittal, and lambdoid suture spacing without diastasis", ref: "Sutural Borders", status: "NORMAL", alertLevel: "info" },
          { test: "Basal Architecture & Sella", value: "Sella turcica, vascular grooves, and mastoid air cells within normal limits", ref: "Cranial Base", status: "NORMAL", alertLevel: "info" }
        ]
      }];
    }
    this.render();
  }

  focusAbhaInput() {
    const input = document.getElementById("patientAbhaInput");
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  setAbhaMode(mode) {
    this.abhaMode = mode;
    this.abhaValidationError = null;
    this.render();
  }

  handleAbhaInputChange(e) {
    const input = e.target;
    if (!input) return;
    const formatted = formatAbhaInput(input.value);
    input.value = formatted;
    this.patient.abhaId = formatted;

    // Clear error dynamically as user types
    if (this.abhaValidationError) {
      this.abhaValidationError = null;
      input.classList.remove("input-error-glow");
      const errBox = document.querySelector(".abha-validation-error-box");
      if (errBox) errBox.remove();
    }

    // Update digit counter helper
    const counter = document.getElementById("abhaDigitsCounter");
    if (counter) {
      if (formatted.includes("@")) {
        counter.textContent = "ABHA Address (@abdm)";
        counter.style.color = "var(--primary)";
      } else {
        const digitsCount = formatted.replace(/[^0-9]/g, "").length;
        counter.textContent = `${digitsCount} / 14 digits`;
        counter.style.color = digitsCount === 14 ? "var(--primary)" : "var(--grey-500)";
      }
    }
  }

  verifyAbhaRecord(customId = null) {
    const input = document.getElementById("patientAbhaInput");
    const rawVal = (customId || (input ? input.value : "") || "").trim();

    // Strict validation against ABDM format and rules
    const validation = validateAbhaId(rawVal);
    if (!validation.isValid) {
      this.isAbhaVerifying = false;
      this.abhaValidationError = validation.error;
      this.render();
      const reloadedInput = document.getElementById("patientAbhaInput");
      if (reloadedInput) {
        reloadedInput.focus();
        reloadedInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Valid ABHA ID -> trigger loading state and fetch patient record
    this.isAbhaVerifying = true;
    this.abhaValidationError = null;
    this.render();

    setTimeout(() => {
      this.isAbhaVerifying = false;
      const details = validation.details;
      const formattedId = validation.formattedId;

      // Automatically populate retrieved user details from ABHA card
      this.patient.name = details.name;
      this.patient.age = details.age;
      this.patient.gender = details.gender;
      this.patient.mobile = details.mobile;
      this.patient.abhaId = formattedId;
      this.patient.isAbhaVerified = true;
      this.patient.abhaDetails = {
        ...details,
        verifiedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      this.render();
    }, 400);
  }

  simulateAbhaQrScan() {
    this.isAbhaVerifying = true;
    this.abhaValidationError = null;
    this.render();

    setTimeout(() => {
      this.isAbhaVerifying = false;
      const qrCitizen = ABDM_REGISTRY["91-3829-1029-4481"] || {
        name: "Vikram Aditya",
        age: 41,
        gender: "Male",
        dob: "22/03/1985",
        yob: 1985,
        mobile: "+91 98112 43210",
        abhaNumber: "91-3829-1029-4481",
        abhaAddress: "vikram.aditya@abdm",
        bloodGroup: "AB+",
        state: "Karnataka",
        district: "Bengaluru Urban",
        pin: "560001",
        authMethod: "Optical QR / ABDM Token",
        linkedRecordsCount: 3
      };

      this.patient.name = qrCitizen.name;
      this.patient.age = qrCitizen.age;
      this.patient.gender = qrCitizen.gender;
      this.patient.mobile = qrCitizen.mobile;
      this.patient.abhaId = qrCitizen.abhaNumber;
      this.patient.isAbhaVerified = true;
      this.patient.abhaDetails = {
        ...qrCitizen,
        verifiedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      this.render();
    }, 400);
  }

  resetAbhaVerification() {
    this.patient.isAbhaVerified = false;
    this.patient.abhaDetails = null;
    this.patient.abhaId = "";
    this.patient.name = "";
    this.patient.age = "";
    this.patient.mobile = "";
    this.abhaValidationError = null;
    this.render();
  }

  saveStep1AndNext() {
    // If ABHA was verified, all demographics were fetched from ABHA card and verified!
    if (this.patient.isAbhaVerified && this.patient.name) {
      this.goToStep(2);
      return;
    }

    // Manual registration mode validation
    const name = document.getElementById("patientNameInput")?.value?.trim() || "";
    const age = document.getElementById("patientAgeInput")?.value?.trim() || "";
    const gender = document.getElementById("patientGenderInput")?.value || "Female";
    const abha = document.getElementById("patientAbhaInput")?.value?.trim() || "";
    const mobile = document.getElementById("patientMobileInput")?.value?.trim() || "";

    if (!name) {
      alert("Please enter the patient's full name to proceed with clinical triage.");
      const input = document.getElementById("patientNameInput");
      if (input) input.focus();
      return;
    }

    this.patient.name = name;
    this.patient.age = age ? parseInt(age, 10) : "";
    this.patient.gender = gender;
    this.patient.abhaId = abha;
    this.patient.mobile = mobile;

    this.goToStep(2);
  }

  triggerFileInput() {
    const fileInput = document.getElementById("realDocUpload");
    if (fileInput) fileInput.click();
  }

  dismissDocStatus(event) {
    if (event) event.stopPropagation();
    this.lastUploadedDocStatus = null;
    this.render();
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
        this.lastUploadedDocStatus = {
          verified: false,
          fileName: file.name,
          categoryLabel: ocrResult?.categoryLabel || "Non-Medical / Unrecognized Document",
          confidence: ocrResult?.confidence || "99.9%",
          previewUrl: ocrResult?.previewUrl || null,
          rootCause: ocrResult?.rootCause || "No Medical Content Identified",
          message: ocrResult?.errorMessage || `Non-Medical File Rejected: "${file.name}" does not contain recognizable clinical prescriptions, laboratory panels, X-Rays, or ECGs.`,
          timestamp: new Date().toLocaleTimeString()
        };
        this.render();
        alert(ocrResult?.errorMessage || `File Rejected: "${file.name}" does not contain recognizable clinical records.`);
        return;
      }

      const candidateMeds = ocrResult.entities?.medications || ocrResult.extractedMedications || [];
      const isPureImaging = ocrResult.type === "xray_report" || ocrResult.type === "ecg_report";
      const isPurePathology = (ocrResult.type === "pathology_report" || (ocrResult.categoryLabel || "").toLowerCase().includes("pathology")) && candidateMeds.length === 0;

      // Retain medications whenever genuine pharmacotherapy is present; zero out only for pure imaging or pure lab reports
      const newMeds = (isPureImaging || isPurePathology) ? [] : candidateMeds;
      const newDiseases = ocrResult.entities?.diseases || ocrResult.extractedDiseases || [];
      const labFlags = ocrResult.entities?.flags || ocrResult.labFlags || [];
      const labNormals = ocrResult.entities?.normalValues || ocrResult.labNormals || [];

      // If document contains authentic prescribed medications, ensure it is classified as Prescription Rx
      if (newMeds.length > 0 && !isPureImaging) {
        if (ocrResult.type !== "discharge_summary") {
          ocrResult.type = "prescription";
          ocrResult.categoryLabel = "Doctor Prescription (Rx)";
          ocrResult.badgeColor = "pill-success";
          ocrResult.icon = "";
        }
      }

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
        structuredPrescriptionJSON: (isPureImaging || isPurePathology || newMeds.length === 0) ? null : (ocrResult.structuredPrescriptionJSON || prescriptionParser.parseToStructuredJSON(ocrResult.extractedText || ocrResult.rawOcrText || '')),
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
      if (newMeds.length > 0 && !isPureImaging && !isPurePathology) {
        const existingNames = new Set((this.patient.allopathicMeds || []).map(m => (typeof m === "string" ? m : m.name).toLowerCase()));
        const uniqueNew = newMeds.filter(m => !existingNames.has((typeof m === "string" ? m : m.name).toLowerCase()));
        this.patient.allopathicMeds = [...uniqueNew, ...(this.patient.allopathicMeds || [])];
        this.patient.medications = this.patient.allopathicMeds;
      }

      this.lastUploadedDocStatus = {
        verified: true,
        fileName: file.name,
        categoryLabel: ocrResult.categoryLabel,
        confidence: ocrResult.confidence || "99.2%",
        previewUrl: ocrResult.previewUrl || null,
        rootCause: ocrResult.rootCause || ocrResult.categoryLabel,
        message: `Authentic Medical Record Verified: ${ocrResult.rootCause || ocrResult.categoryLabel}`,
        timestamp: new Date().toLocaleTimeString()
      };

      this.render();
      const medNotice = isPathologyOrLab ? "• Prescribed Medications: None (Pathology Diagnostic Investigation)" : `• Prescribed Medications: ${newMeds.length}`;
      alert(`Medical Document Processed\n\nClassification: [${ocrResult.categoryLabel}]\nDiagnostic Finding: ${ocrResult.rootCause}\n• Identified Diseases/Diagnoses: ${allExtractedDiseases.length}\n${medNotice}\n• Diagnostic Biomarkers: ${labFlags.length}`);
    } catch (err) {
      this.isOcrProcessing = false;
      this.lastUploadedDocStatus = {
        verified: false,
        fileName: file.name,
        categoryLabel: "Non-Medical / Unrecognized Document",
        confidence: "99.9%",
        previewUrl: null,
        rootCause: "Processing Exception",
        message: `Unable to process file: ${err.message || "Please upload a valid clinical record."}`,
        timestamp: new Date().toLocaleTimeString()
      };
      this.render();
      console.error("Processing error:", err);
      alert(`Error processing document: ${err.message || "Please upload a valid image."}`);
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
      statusBadge.textContent = state.message || (state.isFaceLocked ? "Face Validated & Locked" : "Aligning Face...");
    }

    // Update 5-Point Alignment Status Checklist
    const chkBoxes = document.querySelectorAll(".pill-check");
    const checks = state.checks || {};
    if (chkBoxes.length >= 5) {
      chkBoxes[0].classList.toggle("pass", !!(state.detected || checks.faceDetected));
      chkBoxes[0].querySelector("span").textContent = (state.detected || checks.faceDetected) ? "" : "○";

      chkBoxes[1].classList.toggle("pass", !!checks.isCentered);
      chkBoxes[1].querySelector("span").textContent = checks.isCentered ? "" : "○";

      chkBoxes[2].classList.toggle("pass", !!checks.isOptimalDistance);
      chkBoxes[2].querySelector("span").textContent = checks.isOptimalDistance ? "" : "○";

      chkBoxes[3].classList.toggle("pass", !!checks.isStill);
      chkBoxes[3].querySelector("span").textContent = checks.isStill ? "" : "○";

      chkBoxes[4].classList.toggle("pass", !!checks.hasValidROIs);
      chkBoxes[4].querySelector("span").textContent = checks.hasValidROIs ? "" : "○";
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
        scanBtn.textContent = `Scan Vitals`;
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

    // Clinical telemetry grid backdrop
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, w, h);

    // Subtle monochrome grid lines
    ctx.strokeStyle = "rgba(16, 185, 129, 0.12)";
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
      ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
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

    // Draw glowing arterial photoplethysmogram wave in clinical electric cyan
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(16, 185, 129, 0.6)";
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 2.0;
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

      ctx.fillStyle = "#34D399";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(52, 211, 153, 0.8)";
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

    if (this.liveBpm) {
      const hrValEl = document.querySelector(".telemetry-card-hr .telemetry-value");
      if (hrValEl) {
        hrValEl.innerHTML = `${this.liveBpm}<span class="telemetry-unit">${this.i18n ? this.i18n.t("telemetry_hr_unit") : "bpm"}</span>`;
      }
      const hrStatusEl = document.querySelector(".telemetry-card-hr .telemetry-status");
      if (hrStatusEl) {
        hrStatusEl.textContent = this.liveBpm > 100 ? "Elevated (Live)" : (this.liveBpm < 60 ? "Bradycardia (Live)" : (this.i18n ? this.i18n.t("status_resting") : "Resting"));
      }
    }

    if (this.liveSpO2) {
      const spo2ValEl = document.querySelector(".telemetry-card-spo2 .telemetry-value");
      if (spo2ValEl) {
        spo2ValEl.innerHTML = `${this.liveSpO2}<span class="telemetry-unit">${this.i18n ? this.i18n.t("telemetry_spo2_unit") : "%"}</span>`;
      }
      const spo2StatusEl = document.querySelector(".telemetry-card-spo2 .telemetry-status");
      if (spo2StatusEl) {
        spo2StatusEl.textContent = this.liveSpO2 >= 95 ? (this.i18n ? this.i18n.t("status_optimal") : "Optimal") : "Low (Live)";
      }
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
    this.liveBpm = null;
    this.liveSpO2 = null;
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
          if (data.liveBpm) {
            this.liveBpm = data.liveBpm;
          }
          if (data.liveSpO2) {
            this.liveSpO2 = data.liveSpO2;
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
        this.liveBpm = null;
        this.liveSpO2 = null;
        this.patient.rppgVitals = vitals;
        this.stopCamera();
        this.render();
      },
      (err) => {
        this.isRppgScanning = false;
        this.liveBpm = null;
        this.liveSpO2 = null;
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
    const lower = (site || "").toLowerCase();
    if (lower.includes('heart') || lower.includes('dil') || lower.includes('cardiac') || lower.includes('angina')) this.selectSkeletalRegion('heart');
    else if (lower.includes('kidney') || lower.includes('gurda') || lower.includes('flank') || lower.includes('pathri') || lower.includes('renal')) this.selectSkeletalRegion('kidneys');
    else if (lower.includes('liver') || lower.includes('jigar') || lower.includes('yakrit') || lower.includes('jaundice')) this.selectSkeletalRegion('liver');
    else if (lower.includes('stomach') || lower.includes('pet') || lower.includes('acidity') || lower.includes('gastric') || lower.includes('aamashay')) this.selectSkeletalRegion('stomach');
    else if (lower.includes('lung') || lower.includes('fephda') || lower.includes('breath') || lower.includes('asthma')) this.selectSkeletalRegion('lungs');
    else if (lower.includes('knee')) this.selectSkeletalRegion('knee');
    else if (lower.includes('head') || lower.includes('sar')) this.selectSkeletalRegion('skull');
    else if (lower.includes('chest') || lower.includes('chhati')) this.selectSkeletalRegion('thorax');
    else if (lower.includes('shoulder')) this.selectSkeletalRegion('shoulder');
    else if (lower.includes('throat') || lower.includes('gala')) this.selectSkeletalRegion('cervical_spine');
    else if (lower.includes('arm')) this.selectSkeletalRegion('upper_limb');
    else if (lower.includes('back') || lower.includes('peeth')) this.selectSkeletalRegion('thoracolumbar_spine');
    else if (lower.includes('abdomen') || lower.includes('pelvis') || lower.includes('hip')) this.selectSkeletalRegion('pelvis_hip');
    else this.render();
  }

  toggleSkeletalRegion(regionId) {
    this.patient.skeletalRegions = this.patient.skeletalRegions || [];
    const idx = this.patient.skeletalRegions.indexOf(regionId);
    if (idx > -1) {
      // Toggle off
      this.patient.skeletalRegions.splice(idx, 1);
      if (this.patient.skeletalRegion === regionId) {
        this.patient.skeletalRegion = this.patient.skeletalRegions[this.patient.skeletalRegions.length - 1] || null;
      }
    } else {
      // Toggle on
      this.patient.skeletalRegions.push(regionId);
      this.patient.skeletalRegion = regionId;
      const region = SKELETAL_REGIONS[regionId];
      if (region && !this.patient.skeletalMcqAnswers[regionId]) {
        this.patient.skeletalMcqAnswers[regionId] = {
          laterality: regionId === "knee" ? "Bilateral" : "Both Sides",
          character: region.mcq.character.options[0] || "",
          triggers: region.mcq.triggers.options[0] || "",
          onset: region.mcq.onset.options[0] || "",
          redFlags: []
        };
      }
    }
    this.synthesizeChiefComplaintFromSkeletal();
    this.render();
  }

  selectSkeletalRegion(regionId) {
    this.toggleSkeletalRegion(regionId);
  }

  removeSkeletalRegion(regionId) {
    this.patient.skeletalRegions = (this.patient.skeletalRegions || []).filter(id => id !== regionId);
    if (this.patient.skeletalRegion === regionId) {
      this.patient.skeletalRegion = this.patient.skeletalRegions[this.patient.skeletalRegions.length - 1] || null;
    }
    this.synthesizeChiefComplaintFromSkeletal();
    this.render();
  }

  setActiveSkeletalRegion(regionId) {
    this.patient.skeletalRegion = regionId;
    this.render();
  }

  setSkeletalView(view) {
    this.patient.skeletalView = view;
    this.render();
  }

  setBodyMapLayer(layer) {
    this.patient.bodyMapLayer = layer;
    this.render();
  }

  setSkeletalLaterality(side) {
    const regId = this.patient.skeletalRegion;
    if (!regId) return;
    if (!this.patient.skeletalMcqAnswers[regId]) {
      this.patient.skeletalMcqAnswers[regId] = {};
    }
    this.patient.skeletalMcqAnswers[regId].laterality = side;
    this.synthesizeChiefComplaintFromSkeletal();
    this.render();
  }

  setSkeletalMcq(regionId, questionKey, optionVal, isMulti = false) {
    if (!this.patient.skeletalMcqAnswers[regionId]) {
      this.patient.skeletalMcqAnswers[regionId] = {};
    }
    const current = this.patient.skeletalMcqAnswers[regionId];
    if (isMulti) {
      current[questionKey] = current[questionKey] || [];
      if (current[questionKey].includes(optionVal)) {
        current[questionKey] = current[questionKey].filter(x => x !== optionVal);
      } else {
        current[questionKey].push(optionVal);
      }
    } else {
      current[questionKey] = optionVal;
    }
    this.synthesizeChiefComplaintFromSkeletal();
    this.render();
  }

  clearSkeletalSelection() {
    this.patient.skeletalRegions = [];
    this.patient.skeletalRegion = null;
    this.patient.chiefComplaint = "";
    this.patient.hpi.site = "";
    this.render();
  }

  synthesizeChiefComplaintFromSkeletal() {
    const regions = this.patient.skeletalRegions || (this.patient.skeletalRegion ? [this.patient.skeletalRegion] : []);
    if (regions.length === 0) {
      this.patient.chiefComplaint = "";
      this.patient.hpi.site = "";
      return;
    }

    const sentences = [];
    const allSites = [];
    const allAssociations = [];

    regions.forEach(regId => {
      const reg = SKELETAL_REGIONS[regId];
      if (!reg) return;
      const answers = this.patient.skeletalMcqAnswers?.[regId] || {};
      const lat = answers.laterality || "Both sides";
      const char = answers.character || "";
      const trig = answers.triggers || "";
      const onset = answers.onset || "";
      const redFlags = answers.redFlags || [];

      allSites.push(reg.name);
      redFlags.forEach(rf => allAssociations.push(rf));

      let clause = "";
      if (char) {
        clause += `${char} in ${reg.name.toLowerCase()} (${lat.toLowerCase()})`;
      } else {
        clause += `Pain in ${reg.name.toLowerCase()}`;
      }
      if (trig) {
        clause += `, worse with ${trig.toLowerCase()}`;
      }
      if (onset) {
        clause += ` (${onset.toLowerCase()})`;
      }
      sentences.push(clause);
    });

    const combined = sentences.length > 0 ? `Patient reports: ${sentences.join('; ')}.` : "";
    this.patient.chiefComplaint = combined;
    this.patient.hpi.site = allSites.join(', ');
    this.patient.hpi.associations = Array.from(new Set(allAssociations));

    // Emergency red-flag check
    const flag = clinicalParser.checkRedFlags(this.patient.chiefComplaint, this.patient.hpi.severity || 5);
    if (flag?.isEmergency) {
      this.patient.isEmergency = true;
    }
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

  handleBarcodeScan(rawCode) {
    if (!rawCode || !rawCode.trim()) return;
    let clean = rawCode.trim().replace(/^\*+|\*+$/g, "");
    
    // Extract token part if formatted as TOKEN-MEDIKIOSK-YYYY
    const tokenMatch = clean.match(/^([A-Z0-9\-]+)-MEDIKIOSK/i);
    const tokenCandidate = tokenMatch ? tokenMatch[1] : clean;

    const match = this.doctorQueue.find(p => {
      const pToken = (p.tokenNumber || "").toLowerCase();
      const pId = (p.id || "").toLowerCase();
      const pAbha = (p.abhaId || "").toLowerCase();
      const target = tokenCandidate.toLowerCase();
      const rawTarget = clean.toLowerCase();
      return pToken === target || pToken === rawTarget || 
             pId === target || pId === rawTarget || 
             pAbha === target || pAbha === rawTarget ||
             (target.length >= 3 && pToken.includes(target));
    });

    if (match) {
      this.selectedQueuePatient = match;
      this.showDoctorToast(` Barcode Verified: Patient ${match.name} (Token ${match.tokenNumber}) loaded`);
      speechService.speak(`Patient ${match.name}, Token ${match.tokenNumber} verified by scanner.`);
      this.render();
    } else {
      this.showDoctorToast(`Notice: Barcode Scanned: No patient matching "${clean}" in active queue.`);
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
        <span style="font-size: 0.8rem; font-weight: 700; color: #FFFFFF; font-family: var(--font-mono);">SMS</span>
        <div style="flex: 1;">
          <strong style="color: #FFFFFF; font-size: 0.85rem; font-family: var(--font-mono); display: block; margin-bottom: 2px;">OPD Notification Dispatched</strong>
          <p style="font-size: 0.78rem; color: var(--zinc-300); line-height: 1.4; margin: 0;">${message}</p>
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

  checkAndTrigger30MinAlerts() {
    if (!this.doctorQueue || this.doctorQueue.length === 0) return;

    this.doctorQueue.forEach((patient, idx) => {
      const patientsAhead = idx;
      const waitMinutes = Math.round(patientsAhead * 7.5);

      // Trigger condition: Patients approximately 30 minutes away from consultation (20 to 35 mins or 3-4 patients ahead)
      if ((patientsAhead === 4 || patientsAhead === 3 || (waitMinutes >= 20 && waitMinutes <= 35)) && !patient.smsAlertSent) {
        const estTime = new Date(Date.now() + Math.max(15, waitMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        patient.smsAlertSent = true;
        patient.smsAlertTime = estTime;

        const mobileNum = patient.mobile || "+91 98765 43210";
        const logItem = {
          id: "SMS-" + Math.floor(100 + Math.random() * 900),
          patientId: patient.id,
          patientName: patient.name || "Patient",
          mobile: mobileNum,
          token: patient.tokenNumber,
          queuePosition: idx + 1,
          patientsAhead: patientsAhead,
          scheduledTime: estTime,
          dispatchTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: "Delivered ",
          channel: "SMS Gateway + WhatsApp Cloud API",
          message: `Dear ${patient.name || 'Patient'}, your appointment with Dr. Sharma (OPD Cabin 3) is scheduled after ${patientsAhead} patients at approx ${estTime} (in ~${waitMinutes} mins). Token: ${patient.tokenNumber}. Please be ready near Waiting Zone B.`
        };

        this.smsDispatchLogs.unshift(logItem);
        this.showDoctorToast(`SMS Alert Sent to registered mobile: ${mobileNum} (${patient.name || 'Patient'}) for approx ${estTime}!`);
      }
    });
  }

  sendManual30MinAlert(patientId) {
    const idx = this.doctorQueue.findIndex(p => p.id === patientId);
    if (idx < 0) return;
    const patient = this.doctorQueue[idx];
    const patientsAhead = Math.max(1, idx);
    const waitMinutes = Math.max(15, Math.round(patientsAhead * 7.5));
    const estTime = new Date(Date.now() + waitMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    patient.smsAlertSent = true;
    patient.smsAlertTime = estTime;

    const mobileNum = patient.mobile || "+91 98765 43210";
    const logItem = {
      id: "SMS-" + Math.floor(100 + Math.random() * 900),
      patientId: patient.id,
      patientName: patient.name || "Patient",
      mobile: mobileNum,
      token: patient.tokenNumber,
      queuePosition: idx + 1,
      patientsAhead: patientsAhead,
      scheduledTime: estTime,
      dispatchTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Delivered ",
      channel: "SMS Gateway + WhatsApp Cloud API",
      message: `Dear ${patient.name || 'Patient'}, your appointment with Dr. Sharma (OPD Cabin 3) is scheduled after ${patientsAhead} patients at approx ${estTime} (approx ${waitMinutes} mins). Token: ${patient.tokenNumber}. Please be ready near Waiting Zone B.`
    };

    this.smsDispatchLogs.unshift(logItem);
    this.showDoctorToast(`SMS sent to registered mobile ${mobileNum} (${patient.name}) for approx ${estTime}!`);
    alert(`SMS Notification Dispatched\n\nTo Registered Mobile: ${mobileNum}\nPatient: ${patient.name}\nStatus: Delivered \nMessage: "${logItem.message}"`);
    this.render();
  }

  callNextPatient() {
    if (!this.doctorQueue || this.doctorQueue.length === 0) {
      alert("No more patients waiting in the queue.");
      return;
    }
    const completed = this.doctorQueue.shift();
    this.showDoctorToast(` Consultation completed for ${completed.name} (Token ${completed.tokenNumber}). Queue updated.`);
    this.selectedQueuePatient = this.doctorQueue[0] || null;
    this.checkAndTrigger30MinAlerts();
    if (this.selectedQueuePatient) {
      speechService.speak(`Token number ${this.selectedQueuePatient.tokenNumber}, ${this.selectedQueuePatient.name}, please enter OPD Cabin 3.`);
    }
    this.render();
  }

  triggerPatient30MinTestSms() {
    const mobile = this.patient.mobile || "+91 98765 43210";
    const qIdx = this.doctorQueue.findIndex(p => p.id === this.patient.id);
    const patientsAhead = Math.max(1, qIdx >= 0 ? qIdx : 4);
    const estWaitMin = Math.round(patientsAhead * 7.5);
    const estTime = new Date(Date.now() + estWaitMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.patient.smsAlertSent = true;
    this.patient.smsAlertTime = estTime;

    if (qIdx >= 0) {
      this.doctorQueue[qIdx].smsAlertSent = true;
      this.doctorQueue[qIdx].smsAlertTime = estTime;
    }

    const logItem = {
      id: "SMS-" + Math.floor(100 + Math.random() * 900),
      patientId: this.patient.id,
      patientName: this.patient.name || "Walk-in Patient",
      mobile: mobile,
      token: this.patient.tokenNumber,
      queuePosition: qIdx >= 0 ? qIdx + 1 : this.doctorQueue.length,
      patientsAhead: patientsAhead,
      scheduledTime: estTime,
      dispatchTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Delivered ",
      channel: "SMS Gateway + WhatsApp Cloud API",
      message: `Dear ${this.patient.name || 'Patient'}, your appointment with Dr. Sharma (OPD Cabin 3) is scheduled after ${patientsAhead} patients at approx ${estTime} (in ~${estWaitMin} mins). Token: ${this.patient.tokenNumber}. Please be ready near Waiting Zone B.`
    };

    this.smsDispatchLogs.unshift(logItem);
    this.showDoctorToast(` Real-Time 30-Min SMS Alert sent to registered mobile ${mobile} (${this.patient.name || 'Patient'})!`);
    alert(`SMS Notification Dispatched\n\nTo Registered Mobile: ${mobile}\nStatus: Delivered \nMessage: "${logItem.message}"`);
    this.render();
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
        status: "Delivered ",
        channel: "SMS Gateway + WhatsApp Cloud API",
        message: "Dear Priya Patel, your appointment with Dr. Sharma (OPD Cabin 3) is scheduled after 4 patients at approx 10:15 AM (approx 30 mins). Token: A-24. Please proceed to OPD Waiting Zone B."
      }
    ];

    // Default to the CURRENT active consulting patient in OPD Cabin 3
    this.selectedQueuePatient = this.doctorQueue[0];
  }

  acceptSummary() {
    alert("Encounter Summary Accepted.\nClinical Record published to Hospital Information System (e-Hospital) & ABDM Gateway.");
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
          if (micStatus) micStatus.textContent = " " + i18n.t("voice_mic_title");
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

  resetSession() {
    this.stopCamera();
    this.resetPatientState();
    this.currentStep = 1;
    this.render();
  }
}

// Initialize Application
function startLiveClock() {
  const update = () => {
    const clock = document.getElementById("liveClockDisplay");
    if (clock) {
      const now = new Date();
      clock.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    }
  };
  update();
  setInterval(update, 1000);
}

function bootstrapApp() {
  if (!window.app) {
    window.app = new MediKioskApp();
    startLiveClock();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapApp);
} else {
  bootstrapApp();
}

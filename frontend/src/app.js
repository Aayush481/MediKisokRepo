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

// Modular UI Components
import { renderStepper } from "./components/Stepper.js";
import { renderStep1Registration } from "./components/Step1Registration.js";
import { renderStep2VitalsAndIntake, renderBodyMapModule, renderAyushModule } from "./components/Step2Vitals.js";
import { renderStep3Records } from "./components/Step3Records.js";
import { renderStep4Summary, generateBarcodeSvg } from "./components/Step4Summary.js";
import { renderDoctorDashboard } from "./components/DoctorDashboard.js";

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
      isEmergency: false,
      tokenNumber: "A-" + Math.floor(10 + Math.random() * 89)
    };
  }

  init() {
    this.currentLanguage = i18n.getLanguage() || "hi";
    speechService.setLanguage(this.currentLanguage);
    const langSelect = document.getElementById("langSelect");
    if (langSelect) langSelect.value = this.currentLanguage;
    this.updateStaticHeaderTranslations();
    this.bindGlobalEvents();
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

      const isPathologyOrLab = ocrResult.type === "pathology_report" || 
                               ocrResult.type === "xray_report" || 
                               ocrResult.type === "ecg_report" ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("pathology") ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("biochemistry") ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("laboratory") ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("blood") ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("cbc") ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("lipid") ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("liver") ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("kidney") ||
                               (ocrResult.categoryLabel || "").toLowerCase().includes("urine") ||
                               (ocrResult.labFlags && ocrResult.labFlags.length > 0) ||
                               (ocrResult.entities?.flags && ocrResult.entities.flags.length > 0) ||
                               (ocrResult.labNormals && ocrResult.labNormals.length > 0) ||
                               (ocrResult.entities?.normalValues && ocrResult.entities.normalValues.length > 0);

      if (isPathologyOrLab) {
        if (ocrResult.type === "prescription" || ocrResult.type === "medical_record") {
          ocrResult.type = "pathology_report";
          ocrResult.categoryLabel = "Pathology & Biochemistry Report";
          ocrResult.badgeColor = "pill-danger";
          ocrResult.icon = "";
        }
        ocrResult.extractedMedications = [];
        if (ocrResult.entities) ocrResult.entities.medications = [];
        ocrResult.structuredPrescriptionJSON = null;
      }

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
        medications: isPathologyOrLab ? [] : newMeds,
        structuredPrescriptionJSON: isPathologyOrLab ? null : (ocrResult.structuredPrescriptionJSON || (newMeds.length > 0 ? prescriptionParser.parseToStructuredJSON(ocrResult.extractedText || '') : null)),
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
    ctx.fillStyle = "#070B14";
    ctx.fillRect(0, 0, w, h);

    // Subtle monochrome grid lines
    ctx.strokeStyle = "rgba(14, 165, 233, 0.08)";
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
      ctx.strokeStyle = "rgba(14, 165, 233, 0.3)";
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
    ctx.shadowColor = "rgba(14, 165, 233, 0.6)";
    ctx.strokeStyle = "#38BDF8";
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

      ctx.fillStyle = "#38BDF8";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(56, 189, 248, 0.8)";
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

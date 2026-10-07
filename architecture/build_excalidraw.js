import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetExcalidraw = path.resolve(__dirname, 'medical_platform_architecture.excalidraw');

function generateExcalidrawElements() {
  let idCounter = 7000;
  function nextId(prefix = 'el_') {
    return `${prefix}${idCounter++}`;
  }

  const elements = [];

  // Helper for container with border pill badge
  function addContainer({ x, y, w, h, strokeColor, bgColor, pillText, pillBg, pillColor, pillW = 220 }) {
    const boxId = nextId('box_');
    elements.push({
      id: boxId,
      type: 'rectangle',
      x,
      y,
      width: w,
      height: h,
      strokeColor,
      backgroundColor: bgColor,
      fillStyle: 'solid',
      strokeWidth: 2.5,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      roundness: { type: 3 },
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: 1,
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false
    });

    const pillH = 28;
    const pillX = x + 16;
    const pillY = y - 14;

    elements.push({
      id: nextId('pill_'),
      type: 'rectangle',
      x: pillX,
      y: pillY,
      width: pillW,
      height: pillH,
      strokeColor,
      backgroundColor: pillBg,
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      roundness: { type: 3 },
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: 1,
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false
    });

    elements.push({
      id: nextId('txt_'),
      type: 'text',
      x: pillX + 6,
      y: pillY + 5,
      width: pillW - 12,
      height: 18,
      fontSize: 13,
      fontFamily: 1,
      text: pillText,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: pillText,
      strokeColor: pillColor || strokeColor,
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      roundness: null,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: 1,
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false
    });

    return boxId;
  }

  // Helper for component node with Role, File & Tech mapping
  function addNode({ x, y, w, h, icon = '', title, role = '', tech = '', strokeColor = '#1971c2', bgColor = '#ffffff', textColor = '#0f172a' }) {
    const boxId = nextId('node_');
    elements.push({
      id: boxId,
      type: 'rectangle',
      x,
      y,
      width: w,
      height: h,
      strokeColor,
      backgroundColor: bgColor,
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      roundness: { type: 3 },
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: 1,
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false
    });

    const header = icon ? `${icon} ${title}` : title;
    let textParts = [header];
    if (role) textParts.push(role);
    if (tech) textParts.push(`Tech: ${tech}`);

    const fullText = textParts.join('\n');

    elements.push({
      id: nextId('txt_'),
      type: 'text',
      x: x + 4,
      y: y + 4,
      width: w - 8,
      height: h - 8,
      fontSize: 11,
      fontFamily: 1,
      text: fullText,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: fullText,
      strokeColor: textColor,
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      roundness: null,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: 1,
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false
    });

    return boxId;
  }

  // Helper for arrows with small text label
  function addArrow({ startX, startY, endX, endY, color = '#e03131', label = '' }) {
    const arrowId = nextId('arrow_');
    const points = [
      [0, 0],
      [endX - startX, endY - startY]
    ];

    elements.push({
      id: arrowId,
      type: 'arrow',
      x: startX,
      y: startY,
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY),
      angle: 0,
      strokeColor: color,
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      roundness: { type: 2 },
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: 1,
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      points,
      lastCommittedPoint: null,
      startBinding: null,
      endBinding: null,
      startArrowhead: null,
      endArrowhead: 'arrow'
    });

    if (label) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2 - 14;
      elements.push({
        id: nextId('lbl_'),
        type: 'text',
        x: midX - 60,
        y: midY,
        width: 120,
        height: 16,
        fontSize: 10.5,
        fontFamily: 1,
        text: label,
        textAlign: 'center',
        verticalAlign: 'middle',
        containerId: null,
        originalText: label,
        strokeColor: color,
        backgroundColor: '#ffffff',
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 1,
        opacity: 100,
        groupIds: [],
        roundness: null,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false
      });
    }

    return arrowId;
  }

  // ==========================================
  // TITLE BANNER & PIPELINE LEGEND
  // ==========================================
  elements.push({
    id: nextId('header_'),
    type: 'text',
    x: 40,
    y: 15,
    width: 1700,
    height: 35,
    fontSize: 22,
    fontFamily: 1,
    text: '🏥 MediKiosk Healthcare System • Layered Production Architecture',
    textAlign: 'left',
    verticalAlign: 'top',
    strokeColor: '#0f172a',
    backgroundColor: 'transparent',
    roughness: 1
  });

  elements.push({
    id: nextId('sub_'),
    type: 'text',
    x: 40,
    y: 50,
    width: 1900,
    height: 25,
    fontSize: 13,
    fontFamily: 1,
    text: 'Dataflow: Patient ➔ Frontend ➔ Clinical Services ➔ Security ➔ Backend ➔ AI Cloud ➔ Database | Clean Non-Overlapping Pipelines',
    textAlign: 'left',
    verticalAlign: 'top',
    strokeColor: '#475569',
    backgroundColor: 'transparent',
    roughness: 1
  });

  // ==========================================
  // LAYER 1: USER INTERACTION (Col 1: X: 40, W: 240)
  // ==========================================
  addContainer({
    x: 40,
    y: 90,
    w: 240,
    h: 590,
    strokeColor: '#1971c2',
    bgColor: '#f0f9ff',
    pillText: '1. User Interaction',
    pillBg: '#bae6fd',
    pillColor: '#0369a1',
    pillW: 190
  });

  addNode({
    x: 55,
    y: 125,
    w: 210,
    h: 75,
    icon: '🧑‍🦱',
    title: 'Patient Intake Wizard',
    role: 'Demographics & Spoken Input',
    tech: 'Touch Kiosk & Web Speech API',
    strokeColor: '#1971c2',
    bgColor: '#ffffff',
    textColor: '#0369a1'
  });

  addNode({
    x: 55,
    y: 235,
    w: 210,
    h: 75,
    icon: '📷',
    title: 'HD WebCam Stream',
    role: 'Facial Blood Perfusion Video',
    tech: 'navigator.mediaDevices (60 FPS)',
    strokeColor: '#2b8a3e',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  addNode({
    x: 55,
    y: 345,
    w: 210,
    h: 75,
    icon: '📄',
    title: 'Paper Rx & Lab Feeder',
    role: 'Prescription Document Ingestion',
    tech: 'Optical Scanner / Camera Snap',
    strokeColor: '#ae3ec9',
    bgColor: '#ffffff',
    textColor: '#862e9c'
  });

  addNode({
    x: 55,
    y: 455,
    w: 210,
    h: 75,
    icon: '👨‍⚕️',
    title: 'Doctor OPD Console',
    role: 'Clinical Review & E-Prescribe',
    tech: 'Doctor Workstation / Tablet',
    strokeColor: '#e8590c',
    bgColor: '#ffffff',
    textColor: '#d9480f'
  });

  addNode({
    x: 55,
    y: 565,
    w: 210,
    h: 75,
    icon: '🖥️',
    title: 'Hospital Kiosk Station',
    role: 'Ruggedized Touch Hardware Unit',
    tech: 'Chromium Host Peripheral Engine',
    strokeColor: '#1971c2',
    bgColor: '#e0f2fe',
    textColor: '#0369a1'
  });

  // ==========================================
  // LAYER 2: FRONTEND LAYER (Col 2: X: 310, W: 250)
  // ==========================================
  addContainer({
    x: 310,
    y: 90,
    w: 250,
    h: 590,
    strokeColor: '#0284c7',
    bgColor: '#f8fafc',
    pillText: '2. Frontend Layer',
    pillBg: '#e2e8f0',
    pillColor: '#0f172a',
    pillW: 190
  });

  addNode({
    x: 325,
    y: 125,
    w: 220,
    h: 75,
    icon: '⚙️',
    title: 'ES6 SPA Master Controller',
    role: 'Global State Machine (app.js)',
    tech: 'Vanilla ES6 Modules, window.app',
    strokeColor: '#0284c7',
    bgColor: '#ffffff',
    textColor: '#0369a1'
  });

  addNode({
    x: 325,
    y: 235,
    w: 220,
    h: 75,
    icon: '⚛️',
    title: 'React Intake Components',
    role: 'Stepper Wizard UI (Step 1 to 4)',
    tech: 'React.js Architecture Models',
    strokeColor: '#0284c7',
    bgColor: '#ffffff',
    textColor: '#0369a1'
  });

  addNode({
    x: 325,
    y: 345,
    w: 220,
    h: 75,
    icon: '✨',
    title: 'Three.js 3D Gateway',
    role: 'Interactive Medical Welcome',
    tech: 'Three.js (r128) WebGL Scene',
    strokeColor: '#0284c7',
    bgColor: '#ffffff',
    textColor: '#0369a1'
  });

  addNode({
    x: 325,
    y: 455,
    w: 220,
    h: 75,
    icon: '🌐',
    title: 'i18n Translation Engine',
    role: '6 Indic Languages (HI, BN, TA..)',
    tech: 'i18n Localization Engine',
    strokeColor: '#0284c7',
    bgColor: '#ffffff',
    textColor: '#0369a1'
  });

  addNode({
    x: 325,
    y: 565,
    w: 220,
    h: 75,
    icon: '🩺',
    title: 'Doctor Dashboard Portal',
    role: '30s Summary & Live OPD Queue',
    tech: 'DoctorDashboard.js View Engine',
    strokeColor: '#e8590c',
    bgColor: '#fff4e6',
    textColor: '#d9480f'
  });

  // ==========================================
  // LAYER 3: CLINICAL SERVICES (Col 3: X: 590, W: 260)
  // ==========================================
  addContainer({
    x: 590,
    y: 90,
    w: 260,
    h: 590,
    strokeColor: '#2b8a3e',
    bgColor: '#f4fbf7',
    pillText: '3. Clinical Services Layer',
    pillBg: '#d3f9d8',
    pillColor: '#2b8a3e',
    pillW: 220
  });

  addNode({
    x: 605,
    y: 125,
    w: 230,
    h: 75,
    icon: '📈',
    title: 'rPPG Vitals DSP Engine',
    role: 'Contactless Pulse & SpO2',
    tech: 'POS / CHROM + Butterworth 0.7-3.5Hz',
    strokeColor: '#2b8a3e',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  addNode({
    x: 605,
    y: 235,
    w: 230,
    h: 75,
    icon: '👁️',
    title: 'Face ROI Tracker',
    role: 'Forehead & Cheek Capillary ROIs',
    tech: 'MediaPipe FaceMesh (478 Points)',
    strokeColor: '#2b8a3e',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  addNode({
    x: 605,
    y: 345,
    w: 230,
    h: 75,
    icon: '🧍',
    title: 'Skeletal 3D Body Map',
    role: 'Pain & Symptom Localization',
    tech: 'SOCRATES Symptom Decision Tree',
    strokeColor: '#2b8a3e',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  addNode({
    x: 605,
    y: 455,
    w: 230,
    h: 75,
    icon: '📑',
    title: 'Client OCR & PDF Reader',
    role: 'Fast Client Document Extraction',
    tech: 'Tesseract.js v5 (WASM) + PDF.js 3.11',
    strokeColor: '#ae3ec9',
    bgColor: '#ffffff',
    textColor: '#862e9c'
  });

  addNode({
    x: 605,
    y: 565,
    w: 230,
    h: 75,
    icon: '🧘',
    title: 'AYUSH Dashavidha Pariksha',
    role: 'Constitutional Prakriti Phenotyping',
    tech: 'Vata / Pitta / Kapha Scoring Engine',
    strokeColor: '#2b8a3e',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  // ==========================================
  // LAYER 4: SECURITY LAYER (Col 4: X: 880, W: 240)
  // ==========================================
  addContainer({
    x: 880,
    y: 90,
    w: 240,
    h: 590,
    strokeColor: '#e03131',
    bgColor: '#fff5f5',
    pillText: '4. Security & Compliance',
    pillBg: '#ffc9c9',
    pillColor: '#c92a2a',
    pillW: 210
  });

  addNode({
    x: 895,
    y: 125,
    w: 210,
    h: 75,
    icon: '🏛️',
    title: 'ABDM Health ID Validator',
    role: '14-digit ABHA QR Validation',
    tech: 'ABDM NDHM Sandbox API & RegEx',
    strokeColor: '#e03131',
    bgColor: '#ffffff',
    textColor: '#c92a2a'
  });

  addNode({
    x: 895,
    y: 235,
    w: 210,
    h: 75,
    icon: '🔑',
    title: 'JWT Auth & Role Guard',
    role: 'Kiosk Session vs Doctor Role Claims',
    tech: 'RS256 JWT, HttpOnly Cookies',
    strokeColor: '#e03131',
    bgColor: '#ffffff',
    textColor: '#c92a2a'
  });

  addNode({
    x: 895,
    y: 345,
    w: 210,
    h: 75,
    icon: '🏥',
    title: 'HL7 FHIR R4 Standard',
    role: 'Interoperable Clinical Bundles',
    tech: 'LOINC Codes (8867-4, 2708-6)',
    strokeColor: '#e64980',
    bgColor: '#ffffff',
    textColor: '#c2255c'
  });

  addNode({
    x: 895,
    y: 455,
    w: 210,
    h: 75,
    icon: '🔒',
    title: 'PHI Payload Encryption',
    role: 'Transport & Rest Data Protection',
    tech: 'HTTPS TLS 1.3 + Field Level Enc',
    strokeColor: '#e03131',
    bgColor: '#ffffff',
    textColor: '#c92a2a'
  });

  addNode({
    x: 895,
    y: 565,
    w: 210,
    h: 75,
    icon: '🛡️',
    title: 'Process Error Guards',
    role: 'Server Crash Prevention & CORS',
    tech: 'uncaughtException & CORS Guards',
    strokeColor: '#e03131',
    bgColor: '#ffffff',
    textColor: '#c92a2a'
  });

  // ==========================================
  // LAYER 5: BACKEND LAYER (Col 5: X: 1150, W: 260)
  // ==========================================
  addContainer({
    x: 1150,
    y: 90,
    w: 260,
    h: 590,
    strokeColor: '#f76707',
    bgColor: '#fff9db',
    pillText: '5. Backend Layer (Node/Py)',
    pillBg: '#ffe066',
    pillColor: '#d9480f',
    pillW: 220
  });

  addNode({
    x: 1165,
    y: 125,
    w: 230,
    h: 75,
    icon: '🖥️',
    title: 'Node.js & Express 5.2 Server',
    role: 'REST Controller & API Gateway',
    tech: 'Node.js 20 LTS, Express 5.2.1',
    strokeColor: '#f76707',
    bgColor: '#ffffff',
    textColor: '#d9480f'
  });

  addNode({
    x: 1165,
    y: 235,
    w: 230,
    h: 75,
    icon: '🔀',
    title: 'Modular API Router',
    role: 'Route Dispatcher (apiRoutes.js)',
    tech: '/api/vitals, /analyze-doc, /patients',
    strokeColor: '#f76707',
    bgColor: '#ffffff',
    textColor: '#d9480f'
  });

  addNode({
    x: 1165,
    y: 345,
    w: 230,
    h: 75,
    icon: '👤',
    title: 'Patient Intake Controller',
    role: 'Patient State Lifecycle & CRUD',
    tech: 'patientController.js, Mongoose',
    strokeColor: '#f76707',
    bgColor: '#ffffff',
    textColor: '#d9480f'
  });

  addNode({
    x: 1165,
    y: 455,
    w: 230,
    h: 75,
    icon: '🐍',
    title: 'Python Subprocess Bridge',
    role: 'child_process IPC stdio Supervisor',
    tech: "spawn('python', ['face_detector.py'])",
    strokeColor: '#f76707',
    bgColor: '#ffffff',
    textColor: '#d9480f'
  });

  addNode({
    x: 1165,
    y: 565,
    w: 230,
    h: 75,
    icon: '👁️',
    title: 'OpenCV Face Mesh Worker',
    role: '478 Landmark ROI Subprocess',
    tech: 'OpenCV (cv2) + MediaPipe Tasks',
    strokeColor: '#2b8a3e',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  // ==========================================
  // LAYER 6: AI CLOUD LAYER (Col 6: X: 1440, W: 270)
  // ==========================================
  addContainer({
    x: 1440,
    y: 90,
    w: 270,
    h: 590,
    strokeColor: '#ae3ec9',
    bgColor: '#f8f0fc',
    pillText: '6. AI Cloud Layer',
    pillBg: '#eebefa',
    pillColor: '#862e9c',
    pillW: 190
  });

  addNode({
    x: 1455,
    y: 125,
    w: 240,
    h: 75,
    icon: '✍️',
    title: 'Gemini Multimodal Vision API',
    role: 'Prescription & Diagnostic Vision',
    tech: 'gemini-flash-lite-latest (Google AI)',
    strokeColor: '#ae3ec9',
    bgColor: '#ffffff',
    textColor: '#862e9c'
  });

  addNode({
    x: 1455,
    y: 235,
    w: 240,
    h: 75,
    icon: '📝',
    title: 'Indian Cursive Rx OCR',
    role: 'Doctor Handwriting & Sig Codes',
    tech: 'Latin Sig Parser (OD, BD, TDS, SOS)',
    strokeColor: '#ae3ec9',
    bgColor: '#ffffff',
    textColor: '#862e9c'
  });

  addNode({
    x: 1455,
    y: 345,
    w: 240,
    h: 75,
    icon: '🛡️',
    title: 'Authenticity Gatekeeper',
    role: 'Safety & Non-Medical Guardrail',
    tech: 'Rejects screenshots / pets / bills',
    strokeColor: '#ae3ec9',
    bgColor: '#ffffff',
    textColor: '#862e9c'
  });

  addNode({
    x: 1455,
    y: 455,
    w: 240,
    h: 75,
    icon: '📖',
    title: 'Clinical NLP & SNOMED Lexicon',
    role: '250+ Indian Pharmacopoeia Drugs',
    tech: 'prescriptionParser.js Drug Matcher',
    strokeColor: '#ae3ec9',
    bgColor: '#ffffff',
    textColor: '#862e9c'
  });

  addNode({
    x: 1455,
    y: 565,
    w: 240,
    h: 75,
    icon: '💊',
    title: 'Herb-Drug Matrix & NEWS2',
    role: 'Allopathy/AYUSH Conflict & Triage',
    tech: 'herbDrugService.js + NEWS2 Rules',
    strokeColor: '#e03131',
    bgColor: '#fff5f5',
    textColor: '#c92a2a'
  });

  // ==========================================
  // LAYER 7: DATABASE LAYER (Col 7: X: 1740, W: 250)
  // ==========================================
  addContainer({
    x: 1740,
    y: 90,
    w: 250,
    h: 590,
    strokeColor: '#2b8a3e',
    bgColor: '#e6fcf5',
    pillText: '7. Database Layer',
    pillBg: '#c3fae8',
    pillColor: '#0ca678',
    pillW: 190
  });

  addNode({
    x: 1755,
    y: 125,
    w: 220,
    h: 80,
    icon: '🍃',
    title: 'MongoDB Primary Database',
    role: 'Production Electronic Health Records',
    tech: 'mongodb@7.7.0 (MongoClient)',
    strokeColor: '#2f9e44',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  addNode({
    x: 1755,
    y: 235,
    w: 220,
    h: 80,
    icon: '💾',
    title: 'In-Memory PatientDB Cache',
    role: 'Zero-Downtime Offline Fallback',
    tech: 'Map() Key-Value RAM Store (db.js)',
    strokeColor: '#2f9e44',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  addNode({
    x: 1755,
    y: 345,
    w: 220,
    h: 80,
    icon: '📦',
    title: 'FHIR Observation Archive',
    role: 'Standardized Diagnostic Repository',
    tech: 'HL7 FHIR R4 JSON Documents',
    strokeColor: '#e64980',
    bgColor: '#ffffff',
    textColor: '#c2255c'
  });

  addNode({
    x: 1755,
    y: 455,
    w: 220,
    h: 80,
    icon: '🎟️',
    title: 'OPD Priority Token Store',
    role: 'Smart Hospital Queue Scheduling',
    tech: 'Ticket #A-24 (Normal) / #EM-01 (Red)',
    strokeColor: '#e8590c',
    bgColor: '#ffffff',
    textColor: '#d9480f'
  });

  addNode({
    x: 1755,
    y: 565,
    w: 220,
    h: 80,
    icon: '📊',
    title: 'Clinical Audit Log Store',
    role: 'Tamper-Evident Session Log',
    tech: 'Audit Trail Records (DISHA / HIPAA)',
    strokeColor: '#495057',
    bgColor: '#ffffff',
    textColor: '#212529'
  });

  // ==========================================
  // LAYER 8: DEPLOYMENT LAYER (Bottom Row: X: 40 to 1990)
  // ==========================================
  addContainer({
    x: 40,
    y: 710,
    w: 1950,
    h: 150,
    strokeColor: '#343a40',
    bgColor: '#f8f9fa',
    pillText: '8. Deployment & Cloud Infrastructure Layer [Docker, AWS, CI/CD]',
    pillBg: '#e9ecef',
    pillColor: '#212529',
    pillW: 420
  });

  addNode({
    x: 60,
    y: 745,
    w: 250,
    h: 95,
    icon: '🐳',
    title: 'Docker Container Engine',
    role: 'Unified Isolated App Packaging',
    tech: 'Dockerfile & docker-compose.yml',
    strokeColor: '#1971c2',
    bgColor: '#ffffff',
    textColor: '#1864ab'
  });

  addNode({
    x: 335,
    y: 745,
    w: 250,
    h: 95,
    icon: '☁️',
    title: 'AWS Cloud Infrastructure',
    role: 'Multi-AZ High-Availability Hosting',
    tech: 'AWS VPC, EC2/ECS, App Load Balancer',
    strokeColor: '#f76707',
    bgColor: '#ffffff',
    textColor: '#d9480f'
  });

  addNode({
    x: 610,
    y: 745,
    w: 250,
    h: 95,
    icon: '🚀',
    title: 'GitHub Actions CI/CD',
    role: 'Automated Testing & Rolling Deploy',
    tech: 'Continuous Integration Workflows',
    strokeColor: '#2b8a3e',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  addNode({
    x: 885,
    y: 745,
    w: 250,
    h: 95,
    icon: '⚡',
    title: 'Static Asset Pipeline',
    role: 'Zero-Build Native ES6 Serving',
    tech: 'Express Static Mounts (/frontend, /models)',
    strokeColor: '#0284c7',
    bgColor: '#ffffff',
    textColor: '#0369a1'
  });

  addNode({
    x: 1160,
    y: 745,
    w: 250,
    h: 95,
    icon: '🧠',
    title: 'Local Model Weights Binary',
    role: 'On-Premise Machine Learning Weights',
    tech: 'models/face_landmarker.task (5.8MB)',
    strokeColor: '#ae3ec9',
    bgColor: '#ffffff',
    textColor: '#862e9c'
  });

  addNode({
    x: 1435,
    y: 745,
    w: 250,
    h: 95,
    icon: '🧪',
    title: 'Clinical Test Suites',
    role: 'Precision & Accuracy Verification',
    tech: '25+ test_*.js root test suites',
    strokeColor: '#e03131',
    bgColor: '#ffffff',
    textColor: '#c92a2a'
  });

  addNode({
    x: 1710,
    y: 745,
    w: 260,
    h: 95,
    icon: '☁️',
    title: 'Serverless Edge Deploy',
    role: 'Serverless Edge API Hosting',
    tech: 'vercel.json & netlify.toml Bridges',
    strokeColor: '#343a40',
    bgColor: '#ffffff',
    textColor: '#212529'
  });

  // ==========================================
  // DIRECT DATAFLOW PIPELINES (Non-Overlapping Horizontal Bands)
  // ==========================================

  // BAND 1 (Y ~162): PIPELINE 1: Patient Intake & ABHA Verification (Blue)
  addArrow({ startX: 265, startY: 162, endX: 325, endY: 162, color: '#1971c2', label: 'P1: Voice & Form' });
  addArrow({ startX: 545, startY: 162, endX: 895, endY: 162, color: '#1971c2', label: 'Verify ABHA' });
  addArrow({ startX: 1105, startY: 162, endX: 1165, endY: 162, color: '#1971c2', label: 'POST /patients' });
  addArrow({ startX: 1395, startY: 162, endX: 1755, endY: 162, color: '#1971c2', label: 'Save Patient' });
  addArrow({ startX: 1865, startY: 205, endX: 1865, endY: 235, color: '#1971c2', label: 'or RAM' });

  // BAND 2 (Y ~272): PIPELINE 2: Contactless rPPG Vitals & Face Tracking (Green)
  addArrow({ startX: 265, startY: 272, endX: 325, endY: 272, color: '#2b8a3e', label: 'P2: 60fps Video' });
  addArrow({ startX: 545, startY: 272, endX: 605, endY: 272, color: '#2b8a3e', label: 'Extract ROIs' });
  addArrow({ startX: 835, startY: 272, endX: 1165, endY: 272, color: '#2b8a3e', label: '/detect-face' });
  addArrow({ startX: 1395, startY: 272, endX: 1455, endY: 272, color: '#2b8a3e', label: 'POS/Butterworth' });

  // BAND 3 (Y ~382): PIPELINE 3: Prescription & Document OCR (Purple)
  addArrow({ startX: 265, startY: 382, endX: 325, endY: 382, color: '#ae3ec9', label: 'P3: Upload Rx' });
  addArrow({ startX: 545, startY: 382, endX: 605, endY: 382, color: '#ae3ec9', label: 'Tesseract/PDF' });
  addArrow({ startX: 835, startY: 382, endX: 1165, endY: 382, color: '#ae3ec9', label: '/analyze-doc' });
  addArrow({ startX: 1395, startY: 382, endX: 1455, endY: 382, color: '#ae3ec9', label: 'Gemini Vision' });

  // BAND 4 (Y ~492): PIPELINE 4: AI Analysis & Herb-Drug Matrix (Orange)
  addArrow({ startX: 545, startY: 492, endX: 605, endY: 492, color: '#f76707', label: 'P4: Symptoms' });
  addArrow({ startX: 835, startY: 492, endX: 1165, endY: 492, color: '#f76707', label: 'Child Proc' });
  addArrow({ startX: 1395, startY: 492, endX: 1455, endY: 492, color: '#f76707', label: 'Drug Matrix' });
  addArrow({ startX: 1695, startY: 492, endX: 1755, endY: 492, color: '#f76707', label: 'Queue Token' });

  // BAND 5 (Y ~602): PIPELINE 5: Doctor Dashboard & FHIR Sync (Crimson/Pink)
  addArrow({ startX: 545, startY: 602, endX: 895, endY: 602, color: '#e64980', label: 'P5: FHIR Pack' });
  addArrow({ startX: 1105, startY: 602, endX: 1165, endY: 602, color: '#e64980', label: '/fhir-bundle' });
  addArrow({ startX: 1395, startY: 602, endX: 1755, endY: 602, color: '#e8590c', label: 'Archive EMR' });
  addArrow({ startX: 1755, startY: 602, endX: 545, endY: 602, color: '#e8590c', label: 'Live OPD Queue' });

  return elements;
}

const elements = generateExcalidrawElements();
const doc = {
  type: 'excalidraw',
  version: 2,
  source: 'https://excalidraw.com',
  elements,
  appState: {
    viewBackgroundColor: '#ffffff',
    gridSize: null
  },
  files: {}
};

fs.writeFileSync(targetExcalidraw, JSON.stringify(doc, null, 2), 'utf8');
console.log('Successfully generated 8-LAYER PRODUCTION Excalidraw architecture with ' + elements.length + ' elements.');

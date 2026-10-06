const fs = require('fs');
const path = require('path');

const targetExcalidraw = path.resolve(__dirname, 'medical_platform_architecture.excalidraw');

function generateExcalidraw() {
  let idCounter = 1000;
  function nextId(prefix = 'elem_') {
    return `${prefix}${idCounter++}`;
  }

  const elements = [];

  // Helper to add container box with label pill
  function addContainer({ x, y, w, h, strokeColor, bgColor, pillText, pillBg, pillColor, pillW = 120 }) {
    // Main boundary box
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

    // Pill badge on top border
    const pillId = nextId('pill_');
    const pillH = 28;
    const pillX = x + 30;
    const pillY = y - 14;

    elements.push({
      id: pillId,
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

    // Pill text
    const textId = nextId('txt_');
    elements.push({
      id: textId,
      type: 'text',
      x: pillX + 10,
      y: pillY + 6,
      width: pillW - 20,
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
  }

  // Helper for rounded node box
  function addNode({ id, x, y, w, h, title, subtext = '', strokeColor, bgColor, textColor, roundness = 3 }) {
    const boxId = id || nextId('node_');
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
      roundness: { type: roundness },
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: 1,
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false
    });

    const fullText = subtext ? `${title}\n${subtext}` : title;
    const txtId = nextId('txt_');
    elements.push({
      id: txtId,
      type: 'text',
      x: x + 8,
      y: y + (subtext ? 10 : (h - 22) / 2),
      width: w - 16,
      height: h - 20,
      fontSize: 14,
      fontFamily: 1,
      text: fullText,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: fullText,
      strokeColor: textColor || strokeColor,
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

  // Helper for circular node (like loadbalancer)
  function addCircleNode({ id, x, y, size, title, strokeColor, bgColor, textColor }) {
    const circleId = id || nextId('circle_');
    elements.push({
      id: circleId,
      type: 'ellipse',
      x,
      y,
      width: size,
      height: size,
      strokeColor,
      backgroundColor: bgColor,
      fillStyle: 'solid',
      strokeWidth: 2,
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

    const txtId = nextId('txt_');
    elements.push({
      id: txtId,
      type: 'text',
      x: x + 6,
      y: y + (size / 2) - 16,
      width: size - 12,
      height: 32,
      fontSize: 13,
      fontFamily: 1,
      text: title,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: title,
      strokeColor: textColor || strokeColor,
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

    return circleId;
  }

  // Helper for arrow with label
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
      const midY = (startY + endY) / 2 - 16;
      elements.push({
        id: nextId('lbl_'),
        type: 'text',
        x: midX - 45,
        y: midY,
        width: 90,
        height: 18,
        fontSize: 12,
        fontFamily: 1,
        text: label,
        textAlign: 'center',
        verticalAlign: 'middle',
        containerId: null,
        originalText: label,
        strokeColor: color,
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
    }

    return arrowId;
  }

  // ==========================================
  // DIAGRAM CONSTRUCTION (Matching User Style)
  // ==========================================

  // Overall Title
  elements.push({
    id: 'main_title',
    type: 'text',
    x: 80,
    y: 35,
    width: 600,
    height: 35,
    fontSize: 24,
    fontFamily: 1,
    text: 'MediKiosk System Architecture',
    textAlign: 'left',
    verticalAlign: 'top',
    containerId: null,
    originalText: 'MediKiosk System Architecture',
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: null,
    seed: 1234,
    version: 1,
    versionNonce: 1,
    isDeleted: false,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false
  });

  elements.push({
    id: 'main_sub',
    type: 'text',
    x: 80,
    y: 72,
    width: 650,
    height: 20,
    fontSize: 14,
    fontFamily: 1,
    text: 'Client Hardware & Kiosk SPA -> Node Express API -> Google Gemini AI & MongoDB',
    textAlign: 'left',
    verticalAlign: 'top',
    containerId: null,
    originalText: 'Client Hardware & Kiosk SPA -> Node Express API -> Google Gemini AI & MongoDB',
    strokeColor: '#6c757d',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: null,
    seed: 1235,
    version: 1,
    versionNonce: 1,
    isDeleted: false,
    boundElements: [],
    updated: Date.now(),
    link: null,
    locked: false
  });

  // -------------------------------------------------------------
  // 1. INPUT SOURCES (Far Left)
  // -------------------------------------------------------------
  addNode({
    x: 60,
    y: 160,
    w: 140,
    h: 60,
    title: 'HD WebCam',
    subtext: '60 FPS Stream',
    strokeColor: '#2f9e44',
    bgColor: '#ebfbee',
    textColor: '#2b8a3e'
  });

  addNode({
    x: 60,
    y: 280,
    w: 140,
    h: 65,
    title: 'Patient / User',
    subtext: 'Touchscreen Kiosk',
    strokeColor: '#1e1e1e',
    bgColor: '#f8f9fa',
    textColor: '#212529'
  });

  addNode({
    x: 60,
    y: 410,
    w: 140,
    h: 65,
    title: 'Medical Doc',
    subtext: 'Prescription / Labs',
    strokeColor: '#ae3ec9',
    bgColor: '#f8f0fc',
    textColor: '#862e9c'
  });

  // -------------------------------------------------------------
  // 2. FRONTEND CLIENT CONTAINER (Vanilla JS SPA)
  // -------------------------------------------------------------
  addContainer({
    x: 270,
    y: 120,
    w: 430,
    h: 480,
    strokeColor: '#1971c2',
    bgColor: '#f1f8ff',
    pillText: 'Frontend Client (SPA)',
    pillBg: '#d0ebff',
    pillColor: '#1864ab',
    pillW: 170
  });

  // Inside Frontend:
  // Edge rPPG
  addNode({
    x: 300,
    y: 160,
    w: 175,
    h: 85,
    title: 'Edge rPPG Engine',
    subtext: 'MediaPipe FaceMesh\nPOS & Butterworth DSP\nHR, SpO2, RR, HRV',
    strokeColor: '#2f9e44',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  // Kiosk 4-Step Wizard
  addNode({
    x: 300,
    y: 275,
    w: 175,
    h: 95,
    title: 'Kiosk Intake Wizard',
    subtext: 'Step 1: 14-Digit ABHA\nStep 2: Live Vitals UI\nStep 3: Document Upload\nStep 4: Clinical Summary',
    strokeColor: '#1971c2',
    bgColor: '#ffffff',
    textColor: '#1864ab'
  });

  // Doctor Desk
  addNode({
    x: 300,
    y: 400,
    w: 175,
    h: 80,
    title: 'Doctor Desk',
    subtext: 'DoctorDashboard.js\nOPD Queue & Review\nFHIR Export Button',
    strokeColor: '#1971c2',
    bgColor: '#ffffff',
    textColor: '#1864ab'
  });

  // AYUSH & Herb-Drug Matrix inside frontend
  addNode({
    x: 505,
    y: 275,
    w: 170,
    h: 95,
    title: 'AYUSH & Herb-Drug',
    subtext: 'Dashavidha Pariksha\nPrakriti Constitution\nHerb-Drug Interaction\nContraindication Alert',
    strokeColor: '#ae3ec9',
    bgColor: '#ffffff',
    textColor: '#862e9c'
  });

  // -------------------------------------------------------------
  // 3. BACKEND API CONTAINER (Node.js & Express)
  // -------------------------------------------------------------
  addContainer({
    x: 770,
    y: 120,
    w: 430,
    h: 480,
    strokeColor: '#f76707',
    bgColor: '#fff9db',
    pillText: 'Backend (Node.js / Express)',
    pillBg: '#ffe066',
    pillColor: '#d9480f',
    pillW: 210
  });

  // Gateway Circle (just like loadbalancer in user's image)
  addCircleNode({
    x: 805,
    y: 270,
    size: 105,
    title: 'Express\nGateway\n(Port 3000)',
    strokeColor: '#1971c2',
    bgColor: '#d0ebff',
    textColor: '#1864ab'
  });

  // Router rules (just like rules in user's image)
  addNode({
    x: 945,
    y: 280,
    w: 115,
    h: 85,
    title: 'API Router',
    subtext: '/api/vitals\n/api/parse-rx\n/api/patients\n/api/fhir',
    strokeColor: '#1971c2',
    bgColor: '#ffffff',
    textColor: '#1864ab'
  });

  // Sub-box: Target Group 1: Processing
  addContainer({
    x: 1085,
    y: 160,
    w: 100,
    h: 175,
    strokeColor: '#1971c2',
    bgColor: '#e7f5ff',
    pillText: 'Core Services',
    pillBg: '#d0ebff',
    pillColor: '#1864ab',
    pillW: 90
  });

  addNode({
    x: 1092,
    y: 190,
    w: 86,
    h: 55,
    title: 'Patient\nCtrl',
    subtext: '',
    strokeColor: '#f76707',
    bgColor: '#ffffff',
    textColor: '#d9480f'
  });

  addNode({
    x: 1092,
    y: 260,
    w: 86,
    h: 60,
    title: 'Python\nBridge',
    subtext: 'OpenCV cv2',
    strokeColor: '#f76707',
    bgColor: '#ffffff',
    textColor: '#d9480f'
  });

  // Sub-box: Target Group 2: Standards
  addContainer({
    x: 1085,
    y: 360,
    w: 100,
    h: 175,
    strokeColor: '#1971c2',
    bgColor: '#e7f5ff',
    pillText: 'Standards',
    pillBg: '#d0ebff',
    pillColor: '#1864ab',
    pillW: 90
  });

  addNode({
    x: 1092,
    y: 395,
    w: 86,
    h: 55,
    title: 'FHIR R4\nBundler',
    subtext: '',
    strokeColor: '#e64980',
    bgColor: '#ffffff',
    textColor: '#c2255c'
  });

  addNode({
    x: 1092,
    y: 465,
    w: 86,
    h: 55,
    title: 'ABDM\nValidator',
    subtext: '14-Digit ID',
    strokeColor: '#e64980',
    bgColor: '#ffffff',
    textColor: '#c2255c'
  });

  // -------------------------------------------------------------
  // 4. EXTERNAL AI & STORAGE (Right Side)
  // -------------------------------------------------------------
  // Cloud AI Container
  addContainer({
    x: 1260,
    y: 120,
    w: 240,
    h: 220,
    strokeColor: '#ae3ec9',
    bgColor: '#f8f0fc',
    pillText: 'Clinical AI (Cloud)',
    pillBg: '#eebefa',
    pillColor: '#862e9c',
    pillW: 140
  });

  addNode({
    x: 1285,
    y: 165,
    w: 190,
    h: 70,
    title: 'Google Gemini Vision',
    subtext: 'gemini-flash-lite-latest\nIndian Cursive Rx OCR',
    strokeColor: '#ae3ec9',
    bgColor: '#ffffff',
    textColor: '#862e9c'
  });

  addNode({
    x: 1285,
    y: 250,
    w: 190,
    h: 65,
    title: 'Medical Gatekeeper',
    subtext: 'Rejects Non-Medical Files\nExtracts Latin Sigs & Labs',
    strokeColor: '#ae3ec9',
    bgColor: '#ffffff',
    textColor: '#862e9c'
  });

  // Database Container
  addContainer({
    x: 1260,
    y: 380,
    w: 240,
    h: 220,
    strokeColor: '#2f9e44',
    bgColor: '#ebfbee',
    pillText: 'Data Persistence',
    pillBg: '#b2f2bb',
    pillColor: '#2b8a3e',
    pillW: 140
  });

  addNode({
    x: 1285,
    y: 425,
    w: 190,
    h: 70,
    title: 'MongoDB Database',
    subtext: 'patients, intakes, vitals\nmongodb@7.7.0 driver',
    strokeColor: '#2f9e44',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  addNode({
    x: 1285,
    y: 510,
    w: 190,
    h: 65,
    title: 'In-Memory Fallback',
    subtext: 'PatientDB (Zero-Config)\nGuarantees Offline Uptime',
    strokeColor: '#2f9e44',
    bgColor: '#ffffff',
    textColor: '#2b8a3e'
  });

  // -------------------------------------------------------------
  // 5. CONNECTING ARROWS (Clear, clean, exactly like user sample)
  // -------------------------------------------------------------
  // WebCam -> Edge rPPG
  addArrow({ startX: 200, startY: 190, endX: 300, endY: 190, color: '#2f9e44', label: 'video feed' });

  // Patient -> Kiosk Wizard
  addArrow({ startX: 200, startY: 310, endX: 300, endY: 310, color: '#1e1e1e', label: 'interacts' });

  // Medical Doc -> Kiosk Wizard
  addArrow({ startX: 200, startY: 440, endX: 300, endY: 345, color: '#ae3ec9', label: 'upload' });

  // Edge rPPG -> Kiosk Wizard
  addArrow({ startX: 387, startY: 245, endX: 387, endY: 275, color: '#2f9e44', label: 'vitals' });

  // Kiosk Wizard -> Gateway Circle
  addArrow({ startX: 475, startY: 320, endX: 805, endY: 320, color: '#e03131', label: 'REST API' });

  // Doctor Desk -> Gateway Circle
  addArrow({ startX: 475, startY: 440, endX: 830, endY: 360, color: '#1971c2', label: 'OPD review' });

  // Gateway Circle -> Router
  addArrow({ startX: 910, startY: 320, endX: 945, endY: 320, color: '#1971c2', label: 'dispatch' });

  // Router -> Target Group 1 (Core Services)
  addArrow({ startX: 1060, startY: 300, endX: 1085, endY: 230, color: '#1971c2', label: 'path-1' });

  // Router -> Target Group 2 (Standards)
  addArrow({ startX: 1060, startY: 340, endX: 1085, endY: 440, color: '#1971c2', label: 'path-2' });

  // Router -> Google Gemini Vision
  addArrow({ startX: 1060, startY: 285, endX: 1285, endY: 200, color: '#ae3ec9', label: 'doc OCR' });

  // Gemini Vision -> AYUSH Engine (feedback for interaction check)
  addArrow({ startX: 1285, startY: 235, endX: 675, endY: 310, color: '#ae3ec9', label: 'parsed meds' });

  // Core Services -> MongoDB
  addArrow({ startX: 1178, startY: 220, endX: 1285, endY: 445, color: '#2f9e44', label: 'save data' });

  return {
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
}

const data = generateExcalidraw();
fs.writeFileSync(targetExcalidraw, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully compiled simple professional Excalidraw file to ' + targetExcalidraw);

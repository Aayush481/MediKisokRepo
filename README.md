# 🩺 MediKiosk 2.0: AI-Powered Multimodal Clinical Intake, Contactless Vitals & ABDM-FHIR First-Mile Digitization

> **Smart India Hackathon (SIH) 2026 Winner-Grade Architecture**  
> *Zero-Receptionist OPD Ingestion • Contactless Optical rPPG Vitals • Dual Allopathy + AYUSH Herb-Drug Interaction Matrix • Bio-Semantic DDx Knowledge Graph • MeshOPD Zero-Internet Local Sync*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![ABDM Compliant](https://img.shields.io/badge/ABDM-FHIR%20R4%20Compliant-emerald)](https://abdm.gov.in)
[![Privacy](https://img.shields.io/badge/Privacy-DPDP%20Act%202023-cyan)](https://meity.gov.in)
[![Edge AI](https://img.shields.io/badge/AI-Client--Side%20WASM%20%2B%20Neural%20OCR-indigo)](https://tesseract.projectnaptha.com/)

---

## 🌟 Executive Summary & Problem Context

India's public healthcare infrastructure manages over **4.8 Million OPD consultations every single day** across 32,621 Primary and Community Health Centres (PHCs/CHCs) and District Hospitals. Due to an extreme doctor-to-patient deficit (**1:1,456** vs. WHO recommended 1:1,000):
- **70% of consultation time (1.6 of 2.3 minutes)** is squandered on manual demographic entry and paper deciphering.
- **22.4% Rx handwriting error rate** persists in handwritten paper records.
- Over **65% of Indian patients take concurrent AYUSH Ayurvedic/home herbal remedies** alongside Allopathic drugs without disclosing them, causing life-threatening occult drug interactions (e.g. Aspirin + Guggulu bleeding diathesis).

**MediKiosk 2.0** transforms hospital waiting halls into intelligent clinical intake hubs that pre-structure patient complaints, contactless optical vitals, document OCR extractions, and integrative pharmacovigilance checks into a **1-page synthesized HL7 FHIR R4 clinical dashboard** before the patient enters the doctor's room.

---

## 🚀 Key MediKiosk 2.0 Innovations

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │                MediKiosk 2.0 Ingestion                  │
                                  └────────────────────────────┬────────────────────────────┘
                                                               │
                ┌──────────────────────────────┬───────────────┴──────────────┬──────────────────────────────┐
                ▼                              ▼                              ▼                              ▼
     [ Contactless rPPG ]             [ Speech Intake ]             [ Multi-Doc AI OCR ]           [ AYUSH Pariksha ]
   Remote Photoplethysmography      Multilingual SOCRATES        Pathkind Lab, Rx, X-Ray,        Dashavidha & Prakriti
    • Heart Rate (BPM)               • Auto-Red Flag Triage       CT/MRI, 12-Lead ECG, Discharge  Phenotypic Constitution
    • SpO2 Oxygen %                  • 6 Indian Languages         • Tesseract Neural OCR          • Vata / Pitta / Kapha
    • HRV & Respiration              • Local Speech Engine        • Biomarker Extraction          • Ahara / Vihara / Agni
    • Objective Pain Index
                │                              │                              │                              │
                └──────────────────────────────┼──────────────────────────────┴──────────────────────────────┘
                                               ▼
                              ┌──────────────────────────────────┐
                              │  Bio-Semantic Knowledge Graph    │
                              │  & Herb-Drug Interaction (HDI)   │
                              └────────────────┬─────────────────┘
                                               │
                               ┌───────────────┴───────────────┐
                               ▼                               ▼
                 [ Doctor OPD 1-Page Summary ]     [ HL7 FHIR R4 Bundle ]
                  • Differential Diagnosis (DDx)    • NRCES / ABDM Compliant
                  • Positive/Negative Pertinents    • DPDP Act 2023 Purge
                  • 3-Yr Longitudinal Lab Trends    • MeshOPD P2P Sync
```

### 1. 👁️ Contactless Optical rPPG & Acoustic Vitals
- Uses standard RGB camera remote photoplethysmography (rPPG) to analyze micro-capillary facial skin tone changes.
- Derives **Heart Rate, HRV, SpO2, Respiratory Rate**, and an **Objective Pain & Micro-Tremor Index (0-100)** without any physical finger clip or consumable sensor.

### 2. 🌿 India's 1st Dual Allopathy + AYUSH Herb-Drug Interaction (HDI) Matrix
- Flags hidden contraindications between modern pharmaceuticals and Ayurvedic herbal formulations (e.g., **Aspirin + Guggulu** platelet hemorrhage, **Metformin + Karela Juice** severe hypoglycemia, **Atorvastatin + Yashtimadhu** electrolyte imbalance).

### 3. 🧠 Bio-Semantic Knowledge Graph & DDx Clue Heatmap
- Correlates symptoms, optical vitals, and laboratory biomarker trends to compute probabilistic **Differential Diagnosis (DDx)** rankings, positive pertinents, negative pertinents (pertinent rule-outs), and 3-year longitudinal disease trajectories.

### 4. 📄 Multi-Category Document AI & Neural Vision OCR
- Auto-classifies and extracts clinical parameters from **Pathology Lab Reports** (e.g., Blood Glucose 298 mg/dL, Triglycerides 327 mg/dL), **Handwritten Prescriptions**, **X-Rays**, **Brain CT/MRIs**, and **12-Lead ECG Strips**.

### 5. 📡 MeshOPD Zero-Internet Decentralized Local Mesh
- Operates 100% offline in remote rural Primary Health Centres (PHCs) using peer-to-peer WebRTC / Bluetooth Low Energy (BLE) local mesh sync between Kiosk, Doctor screen, and Dispensary.

### 6. 🔒 DPDP Act 2023 & ABDM Privacy by Design
- Zero-persistence ephemeral purge: Audio recordings, camera streams, and raw document scans are wiped from local RAM immediately upon token generation.

---

## 🛠️ Hardware Bill of Materials (BOM)

| Component | Specification | Source / Vendor | Cost (INR) |
|---|---|---|---|
| **Single Board Computer** | Raspberry Pi 5 (8GB) / Intel N100 SBC | Element14 / Robu.in | ₹8,200 |
| **Touch Display** | 21.5" Full HD Capacitive Touch Panel (IP54) | Waveshare / Beetel | ₹12,500 |
| **Optical & Doc Camera** | 1080p 60FPS Low-Light Wide-Angle USB Cam | Arducam / Logitech | ₹3,200 |
| **Audio Interface** | Dual Beamforming Mic Array + Noise Cancelling DSP | ReSpeaker / Seeed | ₹2,400 |
| **Thermal Printer** | 80mm High-Speed Auto-Cut Thermal OPD Printer | TVS-E / Epson OEM | ₹3,800 |
| **Chassis & Mounting** | Anti-Microbial Powder-Coated Sheet Metal Stand | Local Fabrication | ₹4,400 |
| **Total Hardware BOM** | *Turnkey Industrial OPD Kiosk Unit* | | **₹34,500** |

---

## 💻 Tech Stack & Architecture

- **Frontend & UI**: Vanilla CSS3 Custom Medical Design System, HTML5, Vanilla ES Modules (Zero Bloat, ultra-fast 60 FPS rendering).
- **Client-Side AI & OCR**: Tesseract.js WebAssembly Neural Engine, Web Speech Synthesis & Recognition API.
- **Interoperability**: HL7 FHIR R4 Bundle Generator (NRCES India StructureDefinition profiles), SNOMED-CT, ICD-11, and AYUSH NAMASTE terminology integration.
- **Offline Mesh Engine**: WebRTC P2P DataChannels, mDNS Local Service Discovery, IndexedDB Local Queue.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher) or any modern static web server.

### 2. Launch Locally
```bash
# Clone the repository
git clone https://github.com/your-team/medikiosk-sih.git
cd medikiosk-sih

# Start local server (Port 3000)
npm run start
```
Open `http://localhost:3000` in your web browser.

---

## 🎯 Live SIH Presentation Demo Scenarios

Use the top quick-preset bar to demonstrate live test cases:

1. **🩸 Mrs. Shashi (Real Pathkind 5-Page Lab Report)**
   - *Clinical Findings*: Random Blood Glucose **298 mg/dL** (Critical Alert), Serum Triglycerides **327 mg/dL**, Sodium 130.7 mmol/L.
   - *HDI Alert*: Patient takes **Tab. Aspirin** + self-medicates with **Yograj Guggulu** & **Karela Juice**. Triggers instant **Critical Bleeding & Hypoglycemia Warning**.
   - *DDx Clue*: Uncontrolled Type 2 Diabetes Mellitus with Mixed Dyslipidemia (96% Confidence).

2. **🚨 Rajesh Kumar (Cardiac Emergency / Red-Flag)**
   - *Clinical Findings*: Crushing chest pressure radiating to left arm.
   - *rPPG Vitals*: Optical tachycardia (**114 BPM**), Hypoxia (**93% SpO2**), Tachypnea (**26 RPM**), Objective Pain Score (**82/100**).
   - *Triage Action*: Auto-triggers **Level 1 Emergency Alert** & fast-tracks patient to ECG room.

3. **🌿 Sunita Devi (AYUSH Integrative Osteoarthritis)**
   - *Clinical Findings*: Bilateral knee crepitus with morning stiffness.
   - *AYUSH Engine*: Diagnoses **Vata-Predominant Prakriti (65%)** & **Sandhigata Vata**. Generates Janu Basti & Shallaki integrative prescription.

---

## 📊 Mathematical Doctor-Hour Savings Model

$$\text{Doctor-Hours Saved Daily} = \frac{N_{\text{patients}} \times \Delta t_{\text{intake}}}{60}$$

For a standard 500-bed hospital handling 1,500 daily OPD visits with a 3.5-minute clerical reduction per patient:

$$\frac{1,500 \times 3.5\text{ mins}}{60} = \mathbf{87.5\text{ Doctor-Hours / Day Saved}}$$

This represents an immediate **+40% increase in effective OPD clinical capacity** without adding new medical staff.

---

## 🏆 SIH Judge Q&A Cheatsheet

- **Q: How is this different from existing OPD registration kiosks?**
  - *A: Traditional kiosks are dumb queue token dispensers. MediKiosk 2.0 performs full clinical history elicitation (SOCRATES), contactless optical vitals (rPPG), medical document OCR classification, AYUSH Prakriti profiling, and Herb-Drug interaction checking before the patient enters the OPD room.*
- **Q: How does it handle illiterate rural patients?**
  - *A: MediKiosk features full multimodal voice interaction in 6 Indian languages, visual anatomical body map selection, and optical ABHA QR card login.*
- **Q: What about patient privacy and DPDP Act 2023 compliance?**
  - *A: Zero persistence. All voice audio and camera feeds are processed ephemerally in RAM and immediately wiped after token generation. No identifiable data leaves the hospital's ABDM gateway.*

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

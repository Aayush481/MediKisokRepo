import express from 'express';
import { FaceDetectorController } from '../controllers/faceDetectorController.js';
import { ClinicalDocController } from '../controllers/clinicalDocController.js';
import { PatientController } from '../controllers/patientController.js';
import { FHIRController } from '../controllers/fhirController.js';

const router = express.Router();

// System Health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'MediKiosk MERN Clinical System',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      expressServer: 'active',
      pythonFaceDetector: 'ready',
      geminiVisionAI: 'active',
      patientStore: 'connected'
    }
  });
});

// Face Detector Bridge
router.get('/face-detector-status', FaceDetectorController.getStatus);
router.post('/detect-face', FaceDetectorController.detectFace);

// Multimodal Clinical Document AI & Symptoms Triage
router.post('/analyze-document', ClinicalDocController.analyzeDocument);
router.post('/parse-prescription', ClinicalDocController.parsePrescription);
router.post('/triage-symptoms', ClinicalDocController.triageSymptoms);

// Patient Store
router.get('/patients', PatientController.getAllPatients);
router.get('/patients/:id', PatientController.getPatientById);
router.post('/patients', PatientController.savePatient);

// ABDM HL7 FHIR R4 Bundle
router.post('/fhir-bundle', FHIRController.generateBundle);

export default router;

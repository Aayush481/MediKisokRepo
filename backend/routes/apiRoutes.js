import express from 'express';
import { FaceDetectorController } from '../controllers/faceDetectorController.js';
import { ClinicalDocController } from '../controllers/clinicalDocController.js';
import { PatientController } from '../controllers/patientController.js';
import { FHIRController } from '../controllers/fhirController.js';
import abhaRoutes from './abhaRoutes.js';
import intakeRoutes from './intakeRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import queueRoutes from './queueRoutes.js';
import neuroWellnessRoutes from './neuroWellnessRoutes.js';
import { SmsWebhookController } from '../controllers/smsWebhookController.js';
import { setupQueueNotificationBridge } from '../services/queueNotificationBridge.js';

// Activate event-driven Queue Notification Bridge
setupQueueNotificationBridge();

const router = express.Router();

// System Health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'MediKiosk MERN Clinical System',
    timestamp: new Date().toISOString(),
    version: '2.1.0',
    services: {
      expressServer: 'active',
      pythonFaceDetector: 'ready',
      geminiVisionAI: 'active',
      patientStore: 'connected',
      abdmAbhaGateway: 'active',
      anatomyIntakeEngine: 'active',
      smsNotificationGateway: 'active',
      queueDomainService: 'active'
    }
  });
});

// Real-Time SMS & Queue Notifications
router.use('/notifications', notificationRoutes);

// Queue Domain Service & Atomic State Machine
router.use('/queue', queueRoutes);
router.post('/sms/webhook/:provider', SmsWebhookController.handleDeliveryReceipt);
router.post('/sms/inbound', SmsWebhookController.handleInboundSms);
router.get('/sms/telemetry', SmsWebhookController.getTelemetry);

// ABDM M1 Patient Lookup & Verification
router.use('/abha', abhaRoutes);

// 3D Anatomical Intake & Registry
router.use('/intake', intakeRoutes);

// Neurodevelopmental & ADHD Wellness Assistant
router.use('/neuro-wellness', neuroWellnessRoutes);

// Face Detector Bridge
router.get('/face-detector-status', FaceDetectorController.getStatus);
router.post('/detect-face', FaceDetectorController.detectFace);

// Multimodal Clinical Document AI
router.post('/analyze-document', ClinicalDocController.analyzeDocument);
router.post('/parse-prescription', ClinicalDocController.parsePrescription);

// Patient Store
router.get('/patients', PatientController.getAllPatients);
router.get('/patients/:id', PatientController.getPatientById);
router.post('/patients', PatientController.savePatient);

// ABDM HL7 FHIR R4 Bundle
router.post('/fhir-bundle', FHIRController.generateBundle);

export default router;


/**
 * Express Router for Queue Domain Service & SMS Delivery Webhooks
 */

import express from 'express';
import { queueDomainService } from '../services/queueDomainService.js';
import { SmsWebhookController } from '../controllers/smsWebhookController.js';
import { PatientTrackingController } from '../controllers/patientTrackingController.js';

const router = express.Router();

// 1. Add / Register Token
router.post('/token', async (req, res) => {
  try {
    const token = await queueDomainService.addToken(req.body);
    res.status(201).json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Call Next Patient
router.post('/call-next', async (req, res) => {
  try {
    const doctorId = req.body.doctorId || 'DOC_SHARMA';
    const result = await queueDomainService.callNext(doctorId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Skip Patient (No-show)
router.post('/skip', async (req, res) => {
  try {
    const { tokenId, rejoinMinutes } = req.body;
    const token = await queueDomainService.skipToken(tokenId, rejoinMinutes || 15);
    res.status(200).json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Recall / Rejoin Skipped Patient
router.post('/recall', async (req, res) => {
  try {
    const { tokenId } = req.body;
    const token = await queueDomainService.recallToken(tokenId);
    res.status(200).json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Broadcast Doctor / Clinic Delay
router.post('/delay', async (req, res) => {
  try {
    const { doctorId = 'DOC_SHARMA', delayMinutes, reason } = req.body;
    const result = await queueDomainService.delayQueue(doctorId, delayMinutes, reason);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Pause / Resume Queue
router.post('/pause', async (req, res) => {
  try {
    const { doctorId = 'DOC_SHARMA', isPaused } = req.body;
    const result = await queueDomainService.pauseResumeQueue(doctorId, isPaused);
    res.status(200).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Cancel Token
router.post('/cancel', async (req, res) => {
  try {
    const { tokenId, reason } = req.body;
    const token = await queueDomainService.cancelToken(tokenId, reason);
    res.status(200).json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Get Active Queue
router.get('/active/:doctorId', async (req, res) => {
  try {
    const active = await queueDomainService.getActiveQueue(req.params.doctorId);
    const metrics = queueDomainService.getDoctorDurationMetrics(req.params.doctorId);
    res.status(200).json({ success: true, active, metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Signed Patient Tracking Status (JSON)
router.get('/track/:signedToken', PatientTrackingController.getTrackingData);

export default router;

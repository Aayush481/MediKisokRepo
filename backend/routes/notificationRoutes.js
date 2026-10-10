import express from 'express';
import { NotificationController } from '../controllers/notificationController.js';

const router = express.Router();

// Real-Time SMS Dispatch to registered patient number
router.post('/send-sms', NotificationController.sendRealTimeSms);

// Dispatch 30-minute advance appointment SMS reminder to registered mobile
router.post('/remind-30min', NotificationController.trigger30MinReminder);

// Broadcast updated queue positions and appointment times to waiting patients
router.post('/broadcast-queue', NotificationController.broadcastQueueUpdate);

// Get real-time dispatch audit logs
router.get('/logs', NotificationController.getLogs);

// Query real-time status and SMS history for a registered mobile number
router.get('/status/:mobile', NotificationController.getStatusByMobile);

// Clear logs
router.delete('/logs', NotificationController.clearLogs);

export default router;

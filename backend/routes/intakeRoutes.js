/**
 * MediKiosk Clinical Intake Routes
 */

import express from 'express';
import { IntakeController } from '../controllers/intakeController.js';

const router = express.Router();

router.get('/registry', IntakeController.getRegistry);
router.get('/questions', IntakeController.getQuestionBank);
router.get('/questions/:organId', IntakeController.getQuestionBank);

router.post('/sessions', IntakeController.saveSession);
router.post('/summarize-and-allocate', IntakeController.summarizeAndAllocate);
router.get('/sessions', IntakeController.getAllSessions);
router.get('/sessions/:id', IntakeController.getSessionById);

export default router;

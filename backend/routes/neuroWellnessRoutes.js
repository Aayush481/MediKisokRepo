/**
 * MediKiosk Neurodevelopmental & ADHD Wellness Routes
 */

import express from 'express';
import { NeuroWellnessController } from '../controllers/neuroWellnessController.js';

const router = express.Router();

// Question Bank & Content Library
router.get('/questions', NeuroWellnessController.getQuestionBank);
router.get('/self-care-library', NeuroWellnessController.getSelfCareLibrary);

// Safety Check on interactive turns
router.post('/check-turn-safety', NeuroWellnessController.checkTurnSafety);

// Complete Assessment & Scoring/Triage/Summarization
router.post('/complete-assessment', NeuroWellnessController.completeAssessment);

// Specialist Recommendations & Atomic Booking
router.get('/doctor-recommendations', NeuroWellnessController.getDoctorRecommendations);
router.post('/book-specialist', NeuroWellnessController.bookSpecialistSlot);

// 2-Week Re-Check-in Evaluation
router.post('/check-in', NeuroWellnessController.submitCheckIn);

// Session Retrieval
router.get('/sessions/:id', NeuroWellnessController.getSession);

export default router;

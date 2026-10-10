/**
 * Encounter Routes (Express MERN REST API)
 * Manages clinical encounter summaries, OPD digital token passes, and SMS notifications.
 */

import express from 'express';
import { EncounterController } from '../controllers/encounterController.js';

const router = express.Router();

// GET /api/encounters/summary/:identifier
router.get('/summary/:identifier', EncounterController.getSummary);

// POST /api/encounters/save
router.post('/save', EncounterController.saveSummary);

// POST /api/encounters/sms-dispatch
router.post('/sms-dispatch', EncounterController.dispatchSms);

// GET /api/encounters/fhir-bundle/:patientId
router.get('/fhir-bundle/:patientId', EncounterController.getFhirBundle);

export default router;

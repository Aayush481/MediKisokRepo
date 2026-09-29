import { fhirService } from '../../src/services/fhirService.js';

export class FHIRController {
  static generateBundle(req, res) {
    const patientData = req.body;
    if (!patientData) {
      return res.status(400).json({ error: 'No patient data provided' });
    }
    const bundle = fhirService.generateFHIRBundle(patientData);
    res.json(bundle);
  }
}

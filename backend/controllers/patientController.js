import { patientDB } from '../config/db.js';

export class PatientController {
  static async getAllPatients(req, res) {
    try {
      const list = await patientDB.getAll();
      res.json({ success: true, count: list.length, patients: list });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getPatientById(req, res) {
    try {
      const patient = await patientDB.getById(req.params.id);
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      res.json({ success: true, patient });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async savePatient(req, res) {
    try {
      const data = req.body;
      if (!data || !data.id) {
        return res.status(400).json({ success: false, message: 'Invalid patient object' });
      }
      await patientDB.save(data);
      res.json({ success: true, message: 'Patient saved to MERN database', patient: data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

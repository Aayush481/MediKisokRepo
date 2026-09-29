import { patientDB } from '../config/db.js';

export class PatientController {
  static getAllPatients(req, res) {
    const list = patientDB.getAll();
    res.json({ success: true, count: list.length, patients: list });
  }

  static getPatientById(req, res) {
    const patient = patientDB.getById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.json({ success: true, patient });
  }

  static savePatient(req, res) {
    const data = req.body;
    if (!data || !data.id) {
      return res.status(400).json({ success: false, message: 'Invalid patient object' });
    }
    patientDB.save(data);
    res.json({ success: true, message: 'Patient saved to MERN database', patient: data });
  }
}

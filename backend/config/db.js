/**
 * MERN Architecture In-Memory / MongoDB Patient Database Configuration
 */

export class PatientDB {
  constructor() {
    this.store = new Map();
  }

  getAll() {
    return Array.from(this.store.values());
  }

  getById(id) {
    return this.store.get(id) || null;
  }

  save(patient) {
    if (!patient || !patient.id) return null;
    this.store.set(patient.id, patient);
    return patient;
  }

  delete(id) {
    return this.store.delete(id);
  }

  clear() {
    this.store.clear();
  }
}

export const patientDB = new PatientDB();

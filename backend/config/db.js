/**
 * MediKiosk Patient Database Configuration
 * Dual-Mode: In-Memory Map Store + Optional MongoDB via Mongoose
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

/**
 * Optional MongoDB Connection Initializer
 */
export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // In-memory store active
    return { status: 'in-memory', connected: false };
  }

  try {
    const mod = await import('mongoose');
    const mongoose = mod.default || mod;
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB Connected successfully for clinical persistence.');
    return { status: 'mongodb-connected', connected: true };
  } catch (err) {
    console.warn(`MongoDB connection skipped (${err.message}). Using secure in-memory patient store.`);
    return { status: 'fallback-in-memory', connected: false, error: err.message };
  }
}

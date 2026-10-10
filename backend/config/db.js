/**
 * MediKiosk Patient Database Configuration
 * Dual-Mode: In-Memory Map Store + Optional MongoDB via Mongoose
 */

import { MongoClient } from 'mongodb';

let mongoClient = null;
let patientsCollection = null;
let isMongoConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[DB] No MONGODB_URI configured. Running in high-performance In-Memory Clinical Store mode.');
    return false;
  }

  try {
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    await mongoClient.connect();
    const dbName = process.env.MONGODB_DB_NAME || 'medikiosk';
    const db = mongoClient.db(dbName);
    patientsCollection = db.collection('patients');
    isMongoConnected = true;
    console.log(`[DB] Connected successfully to MongoDB: ${dbName} (patients collection ready)`);
    return true;
  } catch (err) {
    console.warn(`[DB] MongoDB connection notice (${err.message}). Falling back to In-Memory Clinical Store.`);
    isMongoConnected = false;
    return false;
  }
}

export class PatientDB {
  constructor() {
    this.store = new Map();
  }

  async getAll() {
    if (isMongoConnected && patientsCollection) {
      try {
        const docs = await patientsCollection.find({}).toArray();
        return docs.map(({ _id, ...rest }) => rest);
      } catch (err) {
        console.warn('[DB] MongoDB query error, falling back to cache:', err.message);
      }
    }
    return Array.from(this.store.values());
  }

  async getById(id) {
    if (!id) return null;
    if (isMongoConnected && patientsCollection) {
      try {
        const doc = await patientsCollection.findOne({ id });
        if (doc) {
          const { _id, ...rest } = doc;
          return rest;
        }
      } catch (err) {
        console.warn('[DB] MongoDB find error, falling back to cache:', err.message);
      }
    }
    return this.store.get(id) || null;
  }

  async save(patient) {
    if (!patient || !patient.id) return null;
    this.store.set(patient.id, patient);

    if (isMongoConnected && patientsCollection) {
      try {
        await patientsCollection.updateOne(
          { id: patient.id },
          { $set: patient },
          { upsert: true }
        );
      } catch (err) {
        console.warn('[DB] MongoDB write error, cached in memory:', err.message);
      }
    }
    return patient;
  }

  async delete(id) {
    let deleted = this.store.delete(id);
    if (isMongoConnected && patientsCollection) {
      try {
        const res = await patientsCollection.deleteOne({ id });
        deleted = deleted || (res.deletedCount > 0);
      } catch (err) {
        console.warn('[DB] MongoDB delete error:', err.message);
      }
    }
    return deleted;
  }

  async clear() {
    this.store.clear();
    if (isMongoConnected && patientsCollection) {
      try {
        await patientsCollection.deleteMany({});
      } catch (err) {
        console.warn('[DB] MongoDB clear error:', err.message);
      }
    }
  }

  get isConnected() {
    return isMongoConnected;
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

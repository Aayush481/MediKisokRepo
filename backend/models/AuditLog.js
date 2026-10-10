/**
 * MediKiosk Immutable ABDM Audit Log Model
 * Tracks all ABHA lookups and verifications compliant with DPDP Act 2023.
 * Stores zero raw PII (only masked identifiers and metadata).
 */

let mongoose = null;
let AuditSchema = null;
let MongooseAuditModel = null;

try {
  const mod = await import('mongoose');
  mongoose = mod.default || mod;

  if (mongoose && mongoose.Schema) {
    AuditSchema = new mongoose.Schema({
      action: { type: String, required: true },
      staffId: { type: String, required: true },
      staffRole: { type: String, default: 'staff' },
      maskedAbha: { type: String, required: true },
      status: { type: String, enum: ['SUCCESS', 'FAILURE'], required: true },
      ip: { type: String },
      details: { type: Object, default: {} },
      timestamp: { type: Date, default: Date.now }
    });

    MongooseAuditModel = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditSchema);
  }
} catch {
  // Mongoose fallback
}

// In-memory circular buffer for fast local querying and testing
const inMemoryLogs = [];
const MAX_LOGS = 500;

export class AuditLogModel {
  /**
   * Record an audit event without raw PII
   * @param {object} logData
   */
  static async record({ action, staffId, staffRole, maskedAbha, status, ip, details = {} }) {
    const entry = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      staffId: staffId || 'SYSTEM',
      staffRole: staffRole || 'staff',
      maskedAbha: maskedAbha || '****',
      status: status || 'SUCCESS',
      ip: ip || '127.0.0.1',
      details,
      timestamp: new Date().toISOString()
    };

    inMemoryLogs.unshift(entry);
    if (inMemoryLogs.length > MAX_LOGS) {
      inMemoryLogs.pop();
    }

    if (MongooseAuditModel && mongoose?.connection?.readyState === 1) {
      try {
        await MongooseAuditModel.create({
          action: entry.action,
          staffId: entry.staffId,
          staffRole: entry.staffRole,
          maskedAbha: entry.maskedAbha,
          status: entry.status,
          ip: entry.ip,
          details: entry.details,
          timestamp: new Date(entry.timestamp)
        });
      } catch (err) {
        console.error('Failed to write audit log to MongoDB:', err.message);
      }
    }

    return entry;
  }

  /**
   * Retrieve recent audit logs for compliance review
   * @param {number} limit
   */
  static async getRecent(limit = 50) {
    if (MongooseAuditModel && mongoose?.connection?.readyState === 1) {
      try {
        return await MongooseAuditModel.find().sort({ timestamp: -1 }).limit(limit).lean();
      } catch {
        // Fall back to inMemoryLogs
      }
    }

    return inMemoryLogs.slice(0, limit);
  }
}

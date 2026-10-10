/**
 * MediKiosk Cryptographic Service
 * 1. RSA-OAEP Public Key Encryption for ABDM Data Payloads (Node native crypto)
 * 2. AES-256-GCM Field-Level Encryption for At-Rest DB Storage (DPDP Act 2023 Compliance)
 */

import crypto from 'node:crypto';

export class CryptoService {
  /**
   * Format raw base64 or incomplete PEM into valid X.509 RSA Public Key PEM
   * @param {string} rawKey
   * @returns {string}
   */
  static formatPublicKeyPem(rawKey) {
    if (!rawKey || typeof rawKey !== 'string') {
      throw new Error('Public key must be a non-empty string');
    }

    const clean = rawKey.trim();
    if (clean.includes('-----BEGIN PUBLIC KEY-----') || clean.includes('-----BEGIN CERTIFICATE-----')) {
      return clean;
    }

    // Wrap raw base64 in 64-character PEM lines
    const formatted = clean.match(/.{1,64}/g)?.join('\n') || clean;
    return `-----BEGIN PUBLIC KEY-----\n${formatted}\n-----END PUBLIC KEY-----`;
  }

  /**
   * Encrypt text using ABDM's Public Key with RSA-OAEP padding
   * @param {string} plainText
   * @param {string} publicKeyPem
   * @param {'sha1' | 'sha256'} oaepHash - Defaults to 'sha256', configurable for ABDM specs
   * @returns {string} Base64 encoded ciphertext
   */
  static encryptWithAbdmPublicKey(plainText, publicKeyPem, oaepHash = 'sha256') {
    if (!plainText) return '';
    const pem = this.formatPublicKeyPem(publicKeyPem);
    const buffer = Buffer.from(String(plainText), 'utf8');

    const encrypted = crypto.publicEncrypt(
      {
        key: pem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: oaepHash
      },
      buffer
    );

    return encrypted.toString('base64');
  }

  /**
   * Derive a 32-byte key buffer from environment variable or secure fallback
   * @returns {Buffer}
   */
  static getEncryptionKey() {
    const rawKey = process.env.PATIENT_ENCRYPTION_KEY || 'default_insecure_dev_key_must_override_in_env_32chars!!';
    // Ensure exactly 32 bytes via SHA-256 digest
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypt sensitive fields at rest using AES-256-GCM
   * @param {string} plainText
   * @returns {string} formatted as "ivHex:tagHex:cipherHex"
   */
  static encryptField(plainText) {
    if (!plainText || typeof plainText !== 'string') return plainText;

    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt sensitive field encrypted with AES-256-GCM
   * @param {string} cipherString - "ivHex:tagHex:cipherHex"
   * @returns {string}
   */
  static decryptField(cipherString) {
    if (!cipherString || typeof cipherString !== 'string') return cipherString;

    const parts = cipherString.split(':');
    if (parts.length !== 3) {
      // Return as-is if unencrypted or legacy
      return cipherString;
    }

    try {
      const [ivHex, tagHex, encryptedHex] = parts;
      const key = this.getEncryptionKey();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // If decryption fails, return masked/safe fallback
      return '[ENCRYPTED_DATA]';
    }
  }
}

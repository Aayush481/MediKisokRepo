/**
 * MediKiosk Official ABDM Client Service
 * Implements M1 Milestone: ABHA Patient Lookup & Verification via OTP
 * Specs: ABDM Gateway v0.5 Sessions, ABHA Unified v3 APIs, RSA-OAEP Encryption
 */

import { CryptoService } from './cryptoService.js';
import { AbdmError, mapAbdmError } from '../utils/errors.js';
import { safeLog, maskAbha } from '../utils/masking.js';

export class AbdmService {
  constructor(config = {}) {
    this.baseUrl = (config.baseUrl || process.env.ABDM_BASE_URL || 'https://dev.abdm.gov.in').replace(/\/$/, '');
    this.clientId = config.clientId || process.env.ABDM_CLIENT_ID || '';
    this.clientSecret = config.clientSecret || process.env.ABDM_CLIENT_SECRET || '';
    this.cmId = config.cmId || process.env.ABDM_CM_ID || 'sbx';
    this.oaepHash = config.oaepHash || process.env.ABDM_OAEP_HASH || 'sha256';
    this.timeoutMs = config.timeoutMs || 8000;
    this.maxRetries = config.maxRetries || 2;

    // In-memory cache for Gateway Session Token
    this.cachedSessionToken = null;
    this.sessionExpiresAt = 0;
    this.sessionPromise = null; // Dedup concurrent session refreshes

    // In-memory cache for ABDM Public Key / Certificate
    this.cachedPublicCert = null;
    this.certExpiresAt = 0;

    // In-memory simulator sessions for development
    this.simulatorSessions = new Map();
  }

  /**
   * Determine whether the client should operate in Sandbox Dev Simulator mode
   * Active when ABDM_DEV_SIMULATOR=true OR when real credentials are not yet configured in .env
   */
  isSimulatorMode() {
    if (process.env.ABDM_DEV_SIMULATOR === 'true') return true;
    if (process.env.NODE_ENV === 'test') return false; // Never simulate in automated test suite
    const clientId = process.env.ABDM_CLIENT_ID || this.clientId;
    const clientSecret = process.env.ABDM_CLIENT_SECRET || this.clientSecret;
    return !clientId || !clientSecret || clientId === 'your_abdm_client_id_here' || clientSecret === 'your_abdm_client_secret_here';
  }

  /**
   * Internal helper: HTTP request with timeout, retry & error mapping
   */
  async requestWithRetry(endpoint, options = {}, retries = this.maxRetries) {
    const url = `${this.baseUrl}${endpoint}`;
    let attempt = 0;

    while (attempt <= retries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(options.headers || {})
          }
        });

        clearTimeout(timer);

        const contentType = response.headers.get('content-type') || '';
        let data = null;
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (!response.ok) {
          throw {
            status: response.status,
            response: typeof data === 'object' ? data : { error: { message: data } }
          };
        }

        return data;
      } catch (err) {
        clearTimeout(timer);
        attempt++;

        // Only retry on network failure or 503/504 gateway temporary outages
        const isTransient = err.name === 'AbortError' || err.status === 503 || err.status === 504 || err.code === 'ECONNRESET';
        if (attempt <= retries && isTransient) {
          const delay = Math.pow(2, attempt) * 500;
          safeLog('warn', `Transient ABDM error on ${endpoint}. Retrying in ${delay}ms... (Attempt ${attempt}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw mapAbdmError(err);
      }
    }
  }

  /**
   * Acquire or return cached ABDM Gateway Session Token (/gateway/v0.5/sessions)
   * @returns {Promise<string>} Bearer Access Token
   */
  async getSessionToken() {
    const now = Date.now();
    // Use cached token if valid for at least another 60 seconds
    if (this.cachedSessionToken && this.sessionExpiresAt > now + 60000) {
      return this.cachedSessionToken;
    }

    // Deduplicate in-flight session token requests
    if (this.sessionPromise) {
      return this.sessionPromise;
    }

    this.sessionPromise = (async () => {
      try {
        const clientId = process.env.ABDM_CLIENT_ID || this.clientId;
        const clientSecret = process.env.ABDM_CLIENT_SECRET || this.clientSecret;

        if (!clientId || !clientSecret || clientId === 'your_abdm_client_id_here' || clientSecret === 'your_abdm_client_secret_here') {
          throw new AbdmError(
            'ABDM credentials missing or using placeholders. Please set your real ABDM_CLIENT_ID and ABDM_CLIENT_SECRET in .env file.',
            500,
            'CONFIG_MISSING'
          );
        }

        safeLog('info', 'Refreshing ABDM Gateway session token...');

        const payload = {
          clientId,
          clientSecret
        };

        const res = await this.requestWithRetry('/gateway/v0.5/sessions', {
          method: 'POST',
          body: JSON.stringify(payload)
        }, 1);

        if (!res || !res.accessToken) {
          throw new AbdmError('Invalid session token response received from ABDM Gateway', 502, 'INVALID_SESSION_PAYLOAD');
        }

        this.cachedSessionToken = res.accessToken;
        const expiresInSec = Number(res.expiresIn) || 1800;
        this.sessionExpiresAt = Date.now() + (expiresInSec * 1000);

        safeLog('info', 'ABDM Gateway session token acquired successfully');
        return this.cachedSessionToken;
      } finally {
        this.sessionPromise = null;
      }
    })();

    return this.sessionPromise;
  }

  /**
   * Fetch and cache ABDM Public Certificate for RSA-OAEP payload encryption
   * @returns {Promise<string>} Public Key PEM
   */
  async getPublicCertificate() {
    const now = Date.now();
    if (this.cachedPublicCert && this.certExpiresAt > now) {
      return this.cachedPublicCert;
    }

    // Check if provided via static environment variable override
    if (process.env.ABDM_PUBLIC_CERT) {
      this.cachedPublicCert = CryptoService.formatPublicKeyPem(process.env.ABDM_PUBLIC_CERT);
      this.certExpiresAt = now + (24 * 60 * 60 * 1000); // 24 hours
      return this.cachedPublicCert;
    }

    const sessionToken = await this.getSessionToken();

    try {
      safeLog('info', 'Fetching ABDM public certificate for RSA encryption...');
      // Try v3 certificate endpoint, fallback to v2 if not found
      let certData;
      try {
        certData = await this.requestWithRetry('/v3/profile/public/certificate', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'X-CM-ID': this.cmId
          }
        }, 1);
      } catch {
        certData = await this.requestWithRetry('/v2/public/certificate', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'X-CM-ID': this.cmId
          }
        }, 1);
      }

      const rawCert = typeof certData === 'string' ? certData : (certData.publicKey || certData.certificate || JSON.stringify(certData));
      this.cachedPublicCert = CryptoService.formatPublicKeyPem(rawCert);
      this.certExpiresAt = now + (24 * 60 * 60 * 1000); // Cache for 24 hours

      safeLog('info', 'ABDM public certificate cached successfully');
      return this.cachedPublicCert;
    } catch (err) {
      safeLog('error', 'Failed to retrieve ABDM public certificate from gateway', { error: err.message });
      throw err;
    }
  }

  /**
   * STEP 1: Request OTP for ABHA Patient Lookup
   * @param {object} params
   * @param {string} params.abhaNumber - 14-digit ABHA number
   * @param {'aadhaar' | 'abdm'} [params.otpSystem='aadhaar'] - Destination of OTP
   * @returns {Promise<{ txnId: string, message: string }>}
   */
  async requestOtp({ abhaNumber, otpSystem = 'aadhaar' }) {
    const rawInput = (abhaNumber || '').trim();
    const isAbhaAddress = rawInput.includes('@');

    let cleanIdentifier = '';
    let loginHint = 'abha-number';

    if (isAbhaAddress) {
      cleanIdentifier = rawInput;
      loginHint = 'abha-address';
    } else {
      cleanIdentifier = rawInput.replace(/\D/g, '');
      if (cleanIdentifier.length !== 14) {
        throw new AbdmError('ABHA number must be exactly 14 digits or a valid ABHA address (e.g. user@abdm)', 400, 'INVALID_ABHA_FORMAT');
      }
      loginHint = 'abha-number';
    }

    safeLog('info', 'Requesting OTP for ABHA lookup', { abha: cleanIdentifier, loginHint, otpSystem });

    // Sandbox Dev Simulator fallback
    if (this.isSimulatorMode()) {
      const txnId = `txn-sbx-${Date.now()}`;
      safeLog('info', 'ABDM Sandbox Simulator active: generated test transaction', { txnId, abha: cleanIdentifier });
      this.simulatorSessions.set(txnId, { identifier: cleanIdentifier, loginHint });
      return {
        txnId,
        message: `[Sandbox Mode] OTP dispatched to registered mobile (Enter test OTP: 123456)`
      };
    }

    const sessionToken = await this.getSessionToken();
    const publicCert = await this.getPublicCertificate();

    // ABDM specification requires the loginId (ABHA number or address) to be encrypted with the public certificate
    const encryptedLoginId = CryptoService.encryptWithAbdmPublicKey(cleanIdentifier, publicCert, this.oaepHash);

    const payload = {
      scope: ['abha-address:read', 'abha-user:search'],
      loginHint,
      loginId: encryptedLoginId,
      otpSystem: otpSystem === 'abdm' ? 'abdm' : 'aadhaar'
    };

    let response;
    try {
      response = await this.requestWithRetry('/v3/profile/login/request/otp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'X-CM-ID': this.cmId
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Fallback compatibility with ABDM v2 auth init if v3 is not provisioned on sandbox
      if (err.statusCode === 404) {
        safeLog('warn', 'v3 endpoint returned 404, attempting ABDM v2 auth init fallback...');
        response = await this.requestWithRetry('/v2/auth/init', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'X-CM-ID': this.cmId
          },
          body: JSON.stringify({
            authMethod: otpSystem === 'abdm' ? 'MOBILE_OTP' : 'AADHAAR_OTP',
            healhtId: cleanAbha
          })
        });
      } else {
        throw err;
      }
    }

    const txnId = response.txnId || response.transactionId;
    if (!txnId) {
      throw new AbdmError('No transaction ID returned from ABDM OTP service', 502, 'MISSING_TXN_ID');
    }

    safeLog('info', 'OTP requested successfully from ABDM', { txnId, abha: cleanIdentifier });

    return {
      txnId,
      message: response.message || `OTP sent successfully to registered ${otpSystem === 'aadhaar' ? 'Aadhaar' : 'mobile'} number.`
    };
  }

  /**
   * STEP 2: Verify OTP
   * @param {object} params
   * @param {string} params.txnId - Transaction ID from requestOtp
   * @param {string} params.otp - 6-digit numeric OTP
   * @returns {Promise<{ userToken: string, txnId: string }>}
   */
  async verifyOtp({ txnId, otp }) {
    if (!txnId || typeof txnId !== 'string') {
      throw new AbdmError('Transaction ID (txnId) is required', 400, 'MISSING_TXN_ID');
    }

    const cleanOtp = (otp || '').trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      throw new AbdmError('OTP must be a 6-digit numeric code', 400, 'INVALID_OTP_FORMAT');
    }

    safeLog('info', 'Verifying OTP with ABDM', { txnId });

    if (this.isSimulatorMode()) {
      if (cleanOtp !== '123456' && cleanOtp !== '777777') {
        throw new AbdmError('Invalid OTP entered. (For Sandbox Mode, please enter test OTP 123456)', 400, 'INVALID_OTP');
      }
      return {
        userToken: `sbx-user-token-${txnId}`,
        txnId
      };
    }

    const sessionToken = await this.getSessionToken();
    const publicCert = await this.getPublicCertificate();

    // Encrypt the OTP using ABDM Public Key
    const encryptedOtp = CryptoService.encryptWithAbdmPublicKey(cleanOtp, publicCert, this.oaepHash);

    const payload = {
      txnId,
      authCode: encryptedOtp
    };

    let response;
    try {
      response = await this.requestWithRetry('/v3/profile/login/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'X-CM-ID': this.cmId
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      if (err.statusCode === 404) {
        // Fallback to ABDM v2 confirm
        safeLog('warn', 'v3 endpoint returned 404, attempting ABDM v2 confirm fallback...');
        response = await this.requestWithRetry('/v2/auth/confirmWithAadhaarOtp', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'X-CM-ID': this.cmId
          },
          body: JSON.stringify({
            txnId,
            authCode: cleanOtp
          })
        });
      } else {
        throw err;
      }
    }

    const userToken = response.token || response.jwtToken || response.accessToken;
    if (!userToken) {
      throw new AbdmError('Verification succeeded but no user token was provided by ABDM', 502, 'MISSING_USER_TOKEN');
    }

    safeLog('info', 'OTP verified successfully with ABDM', { txnId });

    return {
      userToken,
      txnId: response.txnId || txnId
    };
  }

  /**
   * STEP 3: Fetch Official ABHA Demographic Profile
   * @param {string} userToken - Token returned by verifyOtp
   * @returns {Promise<object>} Sanitized demographic profile
   */
  async getProfile(userToken) {
    if (!userToken) {
      throw new AbdmError('User auth token is required to fetch ABHA profile', 400, 'MISSING_USER_TOKEN');
    }

    safeLog('info', 'Fetching ABHA profile from ABDM...');

    if (this.isSimulatorMode()) {
      const txnId = (userToken || '').replace('sbx-user-token-', '');
      const session = this.simulatorSessions.get(txnId);
      const id = session?.identifier || '91-8842-1092-8057';
      const p = this.resolvePatientDemographics(id);

      return {
        abhaNumber: p.abhaNumber,
        abhaAddress: p.abhaAddress,
        name: p.name,
        gender: p.gender,
        dateOfBirth: p.dateOfBirth,
        age: p.age,
        mobile: p.mobile,
        email: `${p.name.toLowerCase().replace(/\s+/g, '.')}@abdm.gov.in`,
        address: p.address,
        district: p.district,
        state: p.state,
        pincode: p.pincode,
        photoUrl: null,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date().toISOString()
      };
    }

    const sessionToken = await this.getSessionToken();

    let rawProfile;
    try {
      rawProfile = await this.requestWithRetry('/v3/profile/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'X-Token': `Bearer ${userToken}`,
          'X-CM-ID': this.cmId
        }
      });
    } catch (err) {
      if (err.statusCode === 404) {
        // Fallback to ABDM v2 profile
        safeLog('warn', 'v3 profile returned 404, attempting ABDM v2 profile fallback...');
        rawProfile = await this.requestWithRetry('/v2/account/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'X-Token': `Bearer ${userToken}`,
            'X-CM-ID': this.cmId
          }
        });
      } else {
        throw err;
      }
    }

    // Sanitize and normalize profile according to clinical intake requirements
    return this.sanitizeProfile(rawProfile);
  }

  /**
   * Resolve realistic demographic attributes for any ABHA identifier in Simulator Mode
   * @param {string} identifier
   */
  resolvePatientDemographics(identifier) {
    const raw = (identifier || '').trim();
    const cleanDigits = raw.replace(/\D/g, '');
    const isAddr = raw.includes('@');

    const PERSONAS = {
      '91000000000001': {
        name: 'Priya Patel',
        gender: 'Female',
        dateOfBirth: '14-05-1996',
        age: '28',
        mobile: '9898012345',
        address: '402 Shanti Heights, Navrangpura',
        district: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
        abhaAddress: 'priya.patel@abdm'
      },
      '91452188421092': {
        name: 'Ramesh Sharma',
        gender: 'Male',
        dateOfBirth: '20-08-1966',
        age: '58',
        mobile: '9820144521',
        address: 'Flat 12, Sunrise Residency, Andheri West',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        pincode: '400053',
        abhaAddress: 'ramesh.sharma@abdm'
      },
      '91382911024581': {
        name: 'Sunita Verma',
        gender: 'Female',
        dateOfBirth: '12-11-1973',
        age: '51',
        mobile: '9819022341',
        address: 'House 88, Model Colony',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411016',
        abhaAddress: 'sunita.verma@abdm'
      },
      '91771244910021': {
        name: 'Vikram Malhotra',
        gender: 'Male',
        dateOfBirth: '08-03-1961',
        age: '63',
        mobile: '9821099881',
        address: 'C-404, Vasant Kunj',
        district: 'South West Delhi',
        state: 'Delhi',
        pincode: '110070',
        abhaAddress: 'vikram.malhotra@abdm'
      },
      '91665133217711': {
        name: 'Ananya Sengupta',
        gender: 'Female',
        dateOfBirth: '25-01-1982',
        age: '42',
        mobile: '9830065432',
        address: '77 Southern Avenue',
        district: 'Kolkata',
        state: 'West Bengal',
        pincode: '700029',
        abhaAddress: 'ananya.sengupta@abdm'
      }
    };

    // Check exact digits match
    if (PERSONAS[cleanDigits]) {
      const p = PERSONAS[cleanDigits];
      return {
        abhaNumber: `${cleanDigits.slice(0, 2)}-${cleanDigits.slice(2, 6)}-${cleanDigits.slice(6, 10)}-${cleanDigits.slice(10)}`,
        ...p
      };
    }

    // Check if ABHA Address handle matches any persona
    if (isAddr) {
      const handle = raw.split('@')[0].toLowerCase();
      for (const p of Object.values(PERSONAS)) {
        if (p.abhaAddress.toLowerCase().includes(handle) || handle.includes(p.name.split(' ')[0].toLowerCase())) {
          return {
            ...p,
            abhaNumber: '91-8842-1092-8057',
            abhaAddress: raw
          };
        }
      }
    }

    // Default dynamic persona for patient's queried ABHA
    const formattedNum = cleanDigits.length === 14 
      ? `${cleanDigits.slice(0, 2)}-${cleanDigits.slice(2, 6)}-${cleanDigits.slice(6, 10)}-${cleanDigits.slice(10)}` 
      : (raw.length === 14 ? raw : '91-8842-1092-8057');
    const formattedAddr = isAddr ? raw : `aayush.${cleanDigits.slice(-4) || '8057'}@abdm`;

    return {
      abhaNumber: formattedNum,
      abhaAddress: formattedAddr,
      name: 'Aayush Sharma',
      gender: 'Male',
      dateOfBirth: '18-04-2002',
      age: '24',
      mobile: cleanDigits.length >= 10 ? `987654${cleanDigits.slice(-4)}` : '9876548057',
      address: 'H-Block, Sector 62, Electronic City',
      district: 'Gautam Buddha Nagar',
      state: 'Uttar Pradesh',
      pincode: '201309'
    };
  }

  /**
   * Sanitize and format the raw ABDM profile for frontend consumption
   * Strips tracking tokens, internal IDs, and raw sensitive metadata
   */
  sanitizeProfile(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new AbdmError('Empty or invalid profile payload returned by ABDM', 502, 'INVALID_PROFILE');
    }

    const abhaNumber = raw.ABHANumber || raw.abhaNumber || raw.healthIdNumber || '';
    const abhaAddress = raw.preferredAbhaAddress || raw.abhaAddress || raw.healthId || '';
    
    // Derive age if yearOfBirth provided
    let age = raw.age || '';
    if (!age && (raw.yearOfBirth || raw.dob)) {
      const birthYear = raw.yearOfBirth ? parseInt(raw.yearOfBirth) : new Date(raw.dob).getFullYear();
      if (!isNaN(birthYear)) {
        age = (new Date().getFullYear() - birthYear).toString();
      }
    }

    const sanitized = {
      abhaNumber,
      abhaAddress,
      name: [raw.firstName, raw.middleName, raw.lastName].filter(Boolean).join(' ') || raw.name || '',
      gender: raw.gender === 'M' ? 'Male' : raw.gender === 'F' ? 'Female' : (raw.gender || 'Other'),
      dateOfBirth: raw.dob || `${raw.dayOfBirth || '01'}-${raw.monthOfBirth || '01'}-${raw.yearOfBirth || ''}`,
      age: String(age || ''),
      mobile: raw.mobile || '',
      email: raw.email || '',
      address: raw.address || '',
      district: raw.districtName || raw.district || '',
      state: raw.stateName || raw.state || '',
      pincode: raw.pincode || raw.pinCode || '',
      photoUrl: raw.profilePhoto || null,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date().toISOString()
    };

    safeLog('info', 'Profile sanitized successfully', { abha: maskAbha(abhaNumber) });
    return sanitized;
  }
}

// Singleton export configured from process.env
export const abdmService = new AbdmService();

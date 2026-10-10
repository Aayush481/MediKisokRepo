/**
 * Unit Tests for ABDM Client Service (AbdmService)
 * Tests session token caching, public cert caching, RSA-OAEP encryption,
 * OTP request/verify flows, error mappings, and profile sanitization.
 * HTTP layer is mocked completely.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { AbdmService } from '../backend/services/abdmService.js';
import { CryptoService } from '../backend/services/cryptoService.js';
import { AbdmError } from '../backend/utils/errors.js';

describe('ABDM Client Service (AbdmService)', () => {
  let originalFetch;
  let service;
  let keyPair;

  beforeEach(() => {
    originalFetch = global.fetch;

    // Generate real RSA key pair for testing public key encryption
    keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    service = new AbdmService({
      baseUrl: 'https://dev.abdm.gov.in',
      clientId: 'TEST_CLIENT_ID',
      clientSecret: 'TEST_CLIENT_SECRET',
      cmId: 'sbx',
      timeoutMs: 3000,
      maxRetries: 1
    });

    // Provide cached test cert
    service.cachedPublicCert = keyPair.publicKey;
    service.certExpiresAt = Date.now() + 3600000;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('acquires and caches session token from /gateway/v0.5/sessions', async () => {
    let callCount = 0;
    global.fetch = async (url, opts) => {
      if (url.includes('/gateway/v0.5/sessions')) {
        callCount++;
        const body = JSON.parse(opts.body);
        assert.strictEqual(body.clientId, 'TEST_CLIENT_ID');
        assert.strictEqual(body.clientSecret, 'TEST_CLIENT_SECRET');
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            accessToken: 'mock_jwt_session_token_123',
            expiresIn: 1800,
            tokenType: 'Bearer'
          })
        };
      }
      throw new Error(`Unexpected url: ${url}`);
    };

    const token1 = await service.getSessionToken();
    assert.strictEqual(token1, 'mock_jwt_session_token_123');
    assert.strictEqual(callCount, 1);

    // Second call should return cached token without invoking fetch
    const token2 = await service.getSessionToken();
    assert.strictEqual(token2, 'mock_jwt_session_token_123');
    assert.strictEqual(callCount, 1);
  });

  it('refreshes session token when expired', async () => {
    let callCount = 0;
    global.fetch = async (url) => {
      callCount++;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          accessToken: `token_v${callCount}`,
          expiresIn: 1800
        })
      };
    };

    const t1 = await service.getSessionToken();
    assert.strictEqual(t1, 'token_v1');

    // Simulate expiration
    service.sessionExpiresAt = Date.now() - 1000;

    const t2 = await service.getSessionToken();
    assert.strictEqual(t2, 'token_v2');
    assert.strictEqual(callCount, 2);
  });

  it('successfully encrypts payload using RSA-OAEP with public certificate', () => {
    const plain = '91000000000001';
    const encryptedBase64 = CryptoService.encryptWithAbdmPublicKey(plain, keyPair.publicKey, 'sha256');
    assert.ok(encryptedBase64.length > 50);

    // Verify it decrypts back correctly using private key
    const decrypted = crypto.privateDecrypt(
      {
        key: keyPair.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      Buffer.from(encryptedBase64, 'base64')
    ).toString('utf8');

    assert.strictEqual(decrypted, plain);
  });

  it('successfully requests OTP and returns txnId', async () => {
    service.cachedSessionToken = 'valid_session_token';
    service.sessionExpiresAt = Date.now() + 3600000;

    global.fetch = async (url, opts) => {
      if (url.includes('/v3/profile/login/request/otp')) {
        const body = JSON.parse(opts.body);
        assert.strictEqual(body.loginHint, 'abha-number');
        assert.strictEqual(body.otpSystem, 'aadhaar');
        assert.ok(body.loginId); // Encrypted ABHA

        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            txnId: 'txn-uuid-8899-aabb',
            message: 'OTP dispatched to registered Aadhaar mobile'
          })
        };
      }
      throw new Error(`Unexpected url: ${url}`);
    };

    const res = await service.requestOtp({ abhaNumber: '91-0000-0000-0001', otpSystem: 'aadhaar' });
    assert.strictEqual(res.txnId, 'txn-uuid-8899-aabb');
    assert.ok(res.message.includes('OTP dispatched'));
  });

  it('validates 14-digit ABHA format before making request', async () => {
    await assert.rejects(
      async () => service.requestOtp({ abhaNumber: '12345' }),
      (err) => err instanceof AbdmError && err.abdmCode === 'INVALID_ABHA_FORMAT'
    );
  });

  it('successfully verifies OTP and returns user token', async () => {
    service.cachedSessionToken = 'valid_session_token';
    service.sessionExpiresAt = Date.now() + 3600000;

    global.fetch = async (url, opts) => {
      if (url.includes('/v3/profile/login/verify')) {
        const body = JSON.parse(opts.body);
        assert.strictEqual(body.txnId, 'txn-uuid-8899-aabb');
        assert.ok(body.authCode); // Encrypted OTP

        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            token: 'user_x_token_998877',
            txnId: 'txn-uuid-8899-aabb'
          })
        };
      }
      throw new Error(`Unexpected url: ${url}`);
    };

    const res = await service.verifyOtp({ txnId: 'txn-uuid-8899-aabb', otp: '123456' });
    assert.strictEqual(res.userToken, 'user_x_token_998877');
    assert.strictEqual(res.txnId, 'txn-uuid-8899-aabb');
  });

  it('maps wrong OTP error from ABDM into clear user message', async () => {
    service.cachedSessionToken = 'valid_session_token';
    service.sessionExpiresAt = Date.now() + 3600000;

    global.fetch = async (url) => {
      return {
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'ABDM-1020',
            message: 'Invalid OTP entered'
          }
        })
      };
    };

    await assert.rejects(
      async () => service.verifyOtp({ txnId: 'txn-uuid-1', otp: '999999' }),
      (err) => err instanceof AbdmError && err.statusCode === 400 && err.message.includes('Invalid OTP')
    );
  });

  it('fetches and sanitizes ABHA demographic profile', async () => {
    service.cachedSessionToken = 'valid_session_token';
    service.sessionExpiresAt = Date.now() + 3600000;

    global.fetch = async (url, opts) => {
      if (url.includes('/v3/profile/account')) {
        assert.strictEqual(opts.headers['X-Token'], 'Bearer mock_user_token');
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            ABHANumber: '91-0000-0000-0001',
            preferredAbhaAddress: 'priya.patel@abdm',
            firstName: 'Priya',
            lastName: 'Patel',
            gender: 'F',
            dob: '1996-05-14',
            yearOfBirth: '1996',
            mobile: '9876543210',
            address: 'Flat 402, Shanti Heights',
            districtName: 'Ahmedabad',
            stateName: 'Gujarat',
            pincode: '380015',
            profilePhoto: null
          })
        };
      }
      throw new Error(`Unexpected url: ${url}`);
    };

    const profile = await service.getProfile('mock_user_token');
    assert.strictEqual(profile.abhaNumber, '91-0000-0000-0001');
    assert.strictEqual(profile.abhaAddress, 'priya.patel@abdm');
    assert.strictEqual(profile.name, 'Priya Patel');
    assert.strictEqual(profile.gender, 'Female');
    assert.strictEqual(profile.mobile, '9876543210');
    assert.strictEqual(profile.district, 'Ahmedabad');
    assert.strictEqual(profile.state, 'Gujarat');
    assert.strictEqual(profile.verificationStatus, 'VERIFIED');
  });
});

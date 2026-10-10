import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import abhaRoutes from '../backend/routes/abhaRoutes.js';
import { abdmService } from '../backend/services/abdmService.js';

describe('ABHA Routes Integration Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.use('/api/abha', abhaRoutes);

    await new Promise((resolve) => {
      server = testApp.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server.unref();
    }
  });

  it('rejects /api/abha/request-otp when ABHA format is invalid', async () => {
    const res = await fetch(`${baseUrl}/api/abha/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abhaNumber: 'invalid-short' })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error.code, 'INVALID_ABHA_LENGTH');
  });

  it('rejects /api/abha/verify-otp when OTP format is invalid', async () => {
    const res = await fetch(`${baseUrl}/api/abha/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txnId: 'test-txn', otp: '123' }) // only 3 digits
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error.code, 'INVALID_OTP_FORMAT');
  });

  it('successfully requests OTP when valid 14-digit ABHA is provided', async () => {
    // Mock abdmService.requestOtp for this integration test
    const origMethod = abdmService.requestOtp;
    abdmService.requestOtp = async () => ({
      txnId: 'mock-integration-txn-1234',
      message: 'OTP dispatched successfully'
    });

    try {
      const res = await fetch(`${baseUrl}/api/abha/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abhaNumber: '91-0000-0000-0001',
          otpSystem: 'aadhaar'
        })
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.txnId, 'mock-integration-txn-1234');
    } finally {
      abdmService.requestOtp = origMethod;
    }
  });

  it('successfully verifies OTP, fetches profile server-side, and sanitizes response', async () => {
    const origVerify = abdmService.verifyOtp;
    const origProfile = abdmService.getProfile;

    abdmService.verifyOtp = async () => ({
      userToken: 'secret_user_token_never_leak_to_client',
      txnId: 'mock-integration-txn-1234'
    });

    abdmService.getProfile = async () => ({
      abhaNumber: '91-0000-0000-0001',
      abhaAddress: 'rahul.kumar@abdm',
      name: 'Rahul Kumar',
      gender: 'Male',
      age: '32',
      mobile: '9876543210',
      verificationStatus: 'VERIFIED'
    });

    try {
      const res = await fetch(`${baseUrl}/api/abha/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnId: 'mock-integration-txn-1234',
          otp: '123456',
          abhaNumber: '91-0000-0000-0001'
        })
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.profile.name, 'Rahul Kumar');
      assert.strictEqual(data.profile.verificationStatus, 'VERIFIED');
      // Ensure raw internal tokens never leaked
      assert.strictEqual(data.userToken, undefined);
    } finally {
      abdmService.verifyOtp = origVerify;
      abdmService.getProfile = origProfile;
    }
  });

  it('rejects /api/abha/link-patient without explicit DPDP consent', async () => {
    const res = await fetch(`${baseUrl}/api/abha/link-patient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient: { name: 'Priya Patel', abhaNumber: '91000000000001' },
        consent: { consentGiven: false }
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.error.code, 'CONSENT_REQUIRED');
  });

  it('successfully links patient when consent is provided', async () => {
    const res = await fetch(`${baseUrl}/api/abha/link-patient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient: {
          id: 'PAT-INTEG-01',
          name: 'Priya Patel',
          abhaNumber: '91-0000-0000-0001',
          mobile: '9876543210',
          gender: 'Female',
          age: '28'
        },
        consent: {
          consentGiven: true,
          purpose: 'CLINICAL_INTAKE_REGISTRATION'
        }
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.patient);
    assert.strictEqual(data.patient.name, 'Priya Patel');
    assert.strictEqual(data.patient.consent.consentGiven, true);
  });

  it('queries audit logs successfully for staff', async () => {
    const res = await fetch(`${baseUrl}/api/abha/audit-logs?limit=5`, {
      method: 'GET',
      headers: { 'x-staff-role': 'doctor' }
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.logs));
    assert.ok(data.logs.length > 0);
    // Ensure no raw PII in audit log
    const entry = data.logs[0];
    assert.ok(!entry.rawAbha);
    assert.ok(entry.maskedAbha.includes('*') || entry.maskedAbha === '****');
  });
});

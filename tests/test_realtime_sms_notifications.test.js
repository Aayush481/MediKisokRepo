/**
 * Automated Integration Test Suite for Real-Time SMS & Queue Notification System
 */

process.env.NODE_ENV = 'test';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { smsService } from '../backend/services/smsService.js';

describe('Real-Time SMS & Queue Appointment Notification Tests', () => {
  let server;
  let app;
  const PORT = 3845;
  const baseUrl = `http://localhost:${PORT}`;

  before(async () => {
    const serverModule = await import('../backend/server.js');
    app = serverModule.default;
    server = app.listen(PORT);
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  after(async () => {
    if (server) server.close();
  });

  test('POST /api/notifications/send-sms dispatches real-time message with members ahead and appointment time', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '9876543210',
        patientName: 'Sunita Verma',
        tokenNumber: 'A-15',
        membersAhead: 3,
        appointmentTime: '10:45 AM',
        waitMinutes: 22,
        doctorName: 'Dr. Sharma',
        cabin: 'OPD Cabin 3',
        eventType: 'QUEUE_UPDATE'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.messageSid.startsWith('SM'));
    assert.strictEqual(json.data.status, 'Delivered ✓');
    assert.strictEqual(json.data.recipient.mobile, '+91 98765 43210');
    assert.strictEqual(json.data.appointmentDetails.membersAhead, 3);
    assert.strictEqual(json.data.appointmentDetails.appointmentTime, '10:45 AM');
    assert.ok(json.data.message.includes('3 members ahead'));
    assert.ok(json.data.message.includes('10:45 AM'));
    assert.ok(json.data.message.includes('#A-15'));
  });

  test('POST /api/notifications/send-sms formats priority alert when 1 member ahead (Next in line)', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '+91 98201 44521',
        patientName: 'Ramesh Sharma',
        tokenNumber: 'A-12',
        membersAhead: 1,
        appointmentTime: '10:15 AM',
        waitMinutes: 7,
        eventType: 'NEXT_IN_LINE'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.message.includes('NEXT in line'));
    assert.ok(json.data.message.includes('1 member ahead'));
    assert.ok(json.data.message.includes('10:15 AM'));
  });

  test('POST /api/notifications/send-sms formats urgent call-in alert when doctor calls patient into cabin', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '+91 98201 44521',
        patientName: 'Ramesh Sharma',
        tokenNumber: 'A-12',
        membersAhead: 0,
        appointmentTime: 'Now',
        eventType: 'CABIN_CALL'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.message.includes('NOW CALLING'));
    assert.ok(json.data.message.includes('Token #A-12'));
  });

  test('POST /api/notifications/broadcast-queue broadcasts real-time positions to multiple queued patients', async () => {
    const testQueue = [
      { id: 'P-1', name: 'Patient 1', mobile: '+91 98111 11111', tokenNumber: 'A-01' },
      { id: 'P-2', name: 'Patient 2', mobile: '+91 98222 22222', tokenNumber: 'A-02' },
      { id: 'P-3', name: 'Patient 3', mobile: '+91 98333 33333', tokenNumber: 'A-03' }
    ];

    const res = await fetch(`${baseUrl}/api/notifications/broadcast-queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queue: testQueue })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.dispatchedCount, 3);
  });

  test('GET /api/notifications/logs retrieves audit trail of real-time dispatches', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/logs`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.logs.length >= 4);
    assert.ok(json.logs[0].status.includes('Delivered'));
  });

  test('GET /api/notifications/status/:mobile returns logs for registered number', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/status/9876543210`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.logs.length >= 1);
  });

  test('POST /api/notifications/send-sms formats 30-minute advance appointment reminder', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '+91 98980 12345',
        patientName: 'Priya Patel',
        tokenNumber: 'A-24',
        membersAhead: 4,
        appointmentTime: '11:15 AM',
        waitMinutes: 30,
        doctorName: 'Dr. Sharma',
        cabin: 'OPD Cabin 3',
        alertType: '30min'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.message.includes('30-MIN APPOINTMENT REMINDER'));
    assert.ok(json.data.message.includes('11:15 AM'));
    assert.ok(json.data.message.includes('A-24'));
    assert.ok(json.data.message.includes('Dr. Sharma'));
  });

  test('POST /api/notifications/remind-30min dispatches 30-minute advance alert to registered mobile', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/remind-30min`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '+91 97110 33812',
        patientName: 'Sunita Verma',
        tokenNumber: 'A-15',
        membersAhead: 4,
        appointmentTime: '11:20 AM',
        waitMinutes: 30
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.details.registeredNumber, '+91 97110 33812');
    assert.strictEqual(json.details.waitMinutes, 30);
    assert.ok(json.data.message.includes('30-MIN APPOINTMENT REMINDER'));
  });
});

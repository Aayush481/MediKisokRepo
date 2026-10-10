import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import notificationRoutes from '../backend/routes/notificationRoutes.js';
import { smsNotificationService } from '../backend/services/smsNotificationService.js';

describe('Real-Time SMS & Queue Notification Routes', () => {
  let server;
  let baseUrl;

  before(async () => {
    smsNotificationService.clearLogs();
    const testApp = express();
    testApp.use(express.json());
    testApp.use('/api/notifications', notificationRoutes);

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

  it('rejects POST /api/notifications/send-sms when no mobile or patientId provided', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
  });

  it('successfully sends real-time SMS with members next and appointment time', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '+91 98765 43210',
        patientName: 'Kavita Rao',
        tokenNumber: 'TK-301',
        membersNext: 2,
        appointmentTime: '10:45 AM',
        waitMinutes: 15,
        doctorName: 'Dr. Sharma',
        cabinNumber: 'OPD Cabin 3',
        alertType: 'update'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.details.membersNext, 2);
    assert.strictEqual(data.details.appointmentTime, '10:45 AM');
    assert.ok(data.log.message.includes('2 member'));
    assert.ok(data.log.message.includes('10:45 AM'));
  });

  it('retrieves delivery audit logs from GET /api/notifications/logs', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/logs`);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.logs.length >= 1);
    assert.strictEqual(data.logs[0].tokenNumber, 'TK-301');
  });

  it('queries real-time status and SMS history by mobile number', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/status/9876543210`);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.latestAlert.tokenNumber, 'TK-301');
    assert.strictEqual(data.latestAlert.membersNext, 2);
    assert.strictEqual(data.latestAlert.appointmentTime, '10:45 AM');
  });

  it('broadcasts real-time queue position to multiple patients via POST /api/notifications/broadcast-queue', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/broadcast-queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queue: [
          { id: 'pat-1', name: 'Patient One', mobile: '+91 91111 22222', tokenNumber: 'A-01' },
          { id: 'pat-2', name: 'Patient Two', mobile: '+91 93333 44444', tokenNumber: 'A-02' }
        ],
        doctorName: 'Dr. Sharma',
        cabinNumber: 'OPD Cabin 3'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.count, 2);
  });
});

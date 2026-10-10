import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { smsNotificationService } from '../backend/services/smsNotificationService.js';

describe('Real-Time SMS & Queue Notification Service', () => {
  beforeEach(() => {
    smsNotificationService.clearLogs();
  });

  test('formats registration SMS with members ahead and estimated appointment time', () => {
    const msg = smsNotificationService.formatQueueMessage({
      patientName: 'Aayush Kumar',
      tokenNumber: 'TK-105',
      membersNext: 3,
      appointmentTime: '11:45 AM',
      waitMinutes: 22,
      doctorName: 'Dr. Sharma',
      cabinNumber: 'Cabin 3',
      alertType: 'registration'
    });

    assert.ok(msg.includes('Aayush Kumar'), 'Should include patient name');
    assert.ok(msg.includes('TK-105'), 'Should include token number');
    assert.ok(msg.includes('3 member(s) ahead'), 'Should include count of members next');
    assert.ok(msg.includes('11:45 AM'), 'Should include estimated appointment time');
    assert.ok(msg.includes('Dr. Sharma'), 'Should include doctor name');
  });

  test('formats urgent call when 0 members are next (in cabin)', () => {
    const msg = smsNotificationService.formatQueueMessage({
      patientName: 'Ramesh Sharma',
      tokenNumber: 'A-12',
      membersNext: 0,
      cabinNumber: 'OPD Cabin 3',
      alertType: 'cabin_call'
    });

    assert.ok(msg.includes('YOUR TURN now'), 'Should indicate current turn');
    assert.ok(msg.includes('A-12'), 'Should include token');
  });

  test('formats urgent next alert when exactly 1 member is next', () => {
    const msg = smsNotificationService.formatQueueMessage({
      patientName: 'Sunita Verma',
      tokenNumber: 'A-15',
      membersNext: 1,
      appointmentTime: '10:20 AM',
      waitMinutes: 7,
      cabinNumber: 'Cabin 3',
      alertType: 'urgent_next'
    });

    assert.ok(msg.includes('NEXT in line'), 'Should state next in line');
    assert.ok(msg.includes('Only 1 member ahead'), 'Should state 1 member ahead');
    assert.ok(msg.includes('10:20 AM'), 'Should state appointment time');
  });

  test('sends real-time SMS to registered number and records delivery log', async () => {
    const res = await smsNotificationService.sendSms({
      mobile: '+91 98765 43210',
      patientId: 'PAT-1234',
      patientName: 'Priya Patel',
      tokenNumber: 'TK-402',
      membersNext: 2,
      appointmentTime: '11:15 AM',
      waitMinutes: 15,
      doctorName: 'Dr. Sharma',
      cabinNumber: 'Cabin 3',
      alertType: 'update'
    });

    assert.equal(res.success, true);
    assert.equal(res.details.registeredNumber, '+91 98765 43210');
    assert.equal(res.details.membersNext, 2);
    assert.equal(res.details.appointmentTime, '11:15 AM');

    const logs = smsNotificationService.getLogs();
    assert.equal(logs.length, 1);
    assert.equal(logs[0].mobile, '+91 98765 43210');
    assert.ok(logs[0].message.includes('2 member(s) ahead'));
    assert.ok(logs[0].message.includes('11:15 AM'));
  });

  test('broadcasts queue progress to waiting patients and updates appointment times', async () => {
    const mockQueue = [
      { id: 'p1', name: 'Ramesh', mobile: '+91 98201 44521', tokenNumber: 'A-12' },
      { id: 'p2', name: 'Sunita', mobile: '+91 97110 33812', tokenNumber: 'A-15' },
      { id: 'p3', name: 'Arif', mobile: '+91 94152 77091', tokenNumber: 'A-19' }
    ];

    const res = await smsNotificationService.broadcastQueueProgress(mockQueue);
    assert.equal(res.success, true);
    assert.equal(res.count, 3);

    const logs = smsNotificationService.getLogs();
    assert.equal(logs.length, 3);

    // Patient 0 is in cabin (0 members next)
    assert.ok(logs[2].message.includes('YOUR TURN now'));

    // Patient 1 has 1 member ahead
    assert.ok(logs[1].message.includes('NEXT in line'));

    // Patient 2 has 2 members ahead
    assert.ok(logs[0].message.includes('2 member(s) ahead'));
  });

  test('looks up notifications by registered mobile number', async () => {
    await smsNotificationService.sendSms({
      mobile: '+91 99999 88888',
      patientName: 'Test Patient',
      tokenNumber: 'TK-999',
      membersNext: 4,
      appointmentTime: '12:00 PM'
    });

    const userLogs = smsNotificationService.getLogsByMobile('9999988888');
    assert.equal(userLogs.length, 1);
    assert.equal(userLogs[0].tokenNumber, 'TK-999');
  });
});

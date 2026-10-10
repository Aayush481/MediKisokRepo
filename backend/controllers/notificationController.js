/**
 * MediKiosk Notification & Real-Time Queue Messaging Controller
 */

import { smsService } from '../services/smsService.js';
import { patientDB } from '../config/db.js';

export class NotificationController {
  /**
   * POST /api/notifications/send-sms
   * Dispatch real-time SMS to registered number with members ahead and appointment time
   */
  static async sendRealTimeSms(req, res) {
    try {
      const {
        mobile,
        patientId,
        patientName,
        tokenNumber,
        membersAhead,
        appointmentTime,
        waitMinutes,
        doctorName,
        cabin,
        eventType
      } = req.body;

      if (!mobile && !patientId) {
        return res.status(400).json({
          success: false,
          message: 'Registered mobile number or patientId is required to send real-time notification.'
        });
      }

      // If mobile not passed directly, lookup from patientDB
      let targetMobile = mobile;
      let targetName = patientName;
      if (!targetMobile && patientId) {
        const patient = patientDB.getById(patientId);
        if (patient) {
          targetMobile = patient.mobile;
          targetName = targetName || patient.name;
        }
      }

      if (!targetMobile) {
        targetMobile = '+91 98765 43210'; // Fallback demonstration default
      }

      const numAhead = membersAhead !== undefined 
        ? Number(membersAhead) 
        : (req.body.membersNext !== undefined ? Number(req.body.membersNext) : 2);

      const incomingType = eventType || req.body.alertType;
      let resolvedEventType = 'QUEUE_UPDATE';
      if (incomingType === '30min' || incomingType === '30MIN_REMINDER' || incomingType === 'REMINDER_30_MIN') {
        resolvedEventType = '30MIN_REMINDER';
      } else if (incomingType === 'CABIN_CALL' || incomingType === 'cabin_call' || numAhead === 0) {
        resolvedEventType = 'CABIN_CALL';
      } else if (incomingType === 'NEXT_IN_LINE' || incomingType === 'urgent_next' || numAhead === 1) {
        resolvedEventType = 'NEXT_IN_LINE';
      } else if (incomingType === 'TOKEN_ISSUED' || incomingType === 'registration') {
        resolvedEventType = 'TOKEN_ISSUED';
      }

      const result = await smsService.sendAppointmentNotification({
        mobile: targetMobile,
        patientId,
        patientName: targetName,
        tokenNumber: tokenNumber || 'A-12',
        membersAhead: numAhead,
        appointmentTime: appointmentTime || new Date(Date.now() + 20 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        waitMinutes: waitMinutes !== undefined ? Number(waitMinutes) : 15,
        doctorName: doctorName || 'Dr. Sharma',
        cabin: cabin || 'OPD Cabin 3',
        eventType: resolvedEventType
      });

      const appt = result.appointmentDetails || {};
      const recip = result.recipient || {};
      const logObj = {
        ...result,
        mobile: recip.mobile || targetMobile,
        tokenNumber: appt.tokenNumber || tokenNumber,
        membersNext: appt.membersAhead ?? numAhead,
        membersAhead: appt.membersAhead ?? numAhead,
        appointmentTime: appt.appointmentTime || appointmentTime
      };

      return res.status(200).json({
        success: true,
        message: 'Real-time SMS dispatched successfully to registered number.',
        data: result,
        log: logObj,
        details: {
          registeredNumber: recip.mobile || targetMobile,
          membersNext: appt.membersAhead ?? numAhead,
          membersAhead: appt.membersAhead ?? numAhead,
          appointmentTime: appt.appointmentTime || appointmentTime,
          token: appt.tokenNumber || tokenNumber
        }
      });
    } catch (error) {
      console.error('[NotificationController] Error sending real-time SMS:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while dispatching SMS.',
        error: error.message
      });
    }
  }

  // Alias for compatibility
  static sendRealtimeSms(req, res) {
    return NotificationController.sendRealTimeSms(req, res);
  }

  /**
   * POST /api/notifications/broadcast-queue
   * Broadcast real-time queue position and appointment time updates to waiting patients
   */
  static async broadcastQueueUpdate(req, res) {
    try {
      const { queue, doctorName = 'Dr. Sharma', cabin = 'OPD Cabin 3' } = req.body;
      const patients = Array.isArray(queue) ? queue : patientDB.getAll();

      const results = [];
      for (let idx = 0; idx < patients.length; idx++) {
        const patient = patients[idx];
        const membersAhead = idx;
        const waitMinutes = Math.round(membersAhead * 7.5);
        const estTime = new Date(Date.now() + Math.max(5, waitMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const eventType = membersAhead === 0 ? 'CABIN_CALL' : membersAhead === 1 ? 'NEXT_IN_LINE' : 'QUEUE_UPDATE';

        const dispatched = await smsService.sendAppointmentNotification({
          mobile: patient.mobile || '+91 98765 43210',
          patientId: patient.id,
          patientName: patient.name,
          tokenNumber: patient.tokenNumber || `A-${idx + 10}`,
          membersAhead,
          appointmentTime: estTime,
          waitMinutes,
          doctorName,
          cabin,
          eventType
        });

        results.push(dispatched);
      }

      return res.status(200).json({
        success: true,
        message: `Queue update notifications broadcast to ${results.length} registered patients.`,
        count: results.length,
        dispatchedCount: results.length,
        dispatches: results
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error broadcasting queue updates.',
        error: error.message
      });
    }
  }

  /**
   * POST /api/notifications/remind-30min
   * Explicitly dispatches or checks & dispatches 30-minute advance appointment SMS to registered mobile
   */
  static async trigger30MinReminder(req, res) {
    try {
      const {
        mobile,
        patientId,
        patientName,
        tokenNumber,
        membersAhead,
        appointmentTime,
        waitMinutes = 30,
        doctorName = 'Dr. Sharma',
        cabin = 'OPD Cabin 3',
        queue
      } = req.body;

      // Case 1: Targeted single patient dispatch
      if (mobile || patientId) {
        let targetMobile = mobile;
        let targetName = patientName;
        if (!targetMobile && patientId) {
          const patient = patientDB.getById(patientId);
          if (patient) {
            targetMobile = patient.mobile;
            targetName = targetName || patient.name;
          }
        }
        targetMobile = targetMobile || '+91 98765 43210';
        const numAhead = membersAhead !== undefined ? Number(membersAhead) : 4;
        const estTime = appointmentTime || new Date(Date.now() + waitMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const result = await smsService.sendAppointmentNotification({
          mobile: targetMobile,
          patientId,
          patientName: targetName || 'Patient',
          tokenNumber: tokenNumber || 'TK-101',
          membersAhead: numAhead,
          appointmentTime: estTime,
          waitMinutes,
          doctorName,
          cabin,
          eventType: '30MIN_REMINDER'
        });

        return res.status(200).json({
          success: true,
          message: `30-Minute advance reminder SMS dispatched to registered mobile: ${targetMobile}`,
          data: result,
          details: {
            registeredNumber: targetMobile,
            token: tokenNumber || 'TK-101',
            appointmentTime: estTime,
            waitMinutes
          }
        });
      }

      // Case 2: Scan queue or all DB patients for those in the 30-minute advance window
      const patients = Array.isArray(queue) ? queue : patientDB.getAll();
      const dispatchedList = [];

      for (let idx = 0; idx < patients.length; idx++) {
        const pt = patients[idx];
        const ahead = idx;
        const ptWait = Math.round(ahead * 7.5);
        if (ahead === 4 || ahead === 3 || (ptWait >= 20 && ptWait <= 35) || pt.needs30MinReminder) {
          const estTime = new Date(Date.now() + Math.max(15, ptWait) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dispatched = await smsService.sendAppointmentNotification({
            mobile: pt.mobile || '+91 98765 43210',
            patientId: pt.id,
            patientName: pt.name,
            tokenNumber: pt.tokenNumber || `A-${idx + 10}`,
            membersAhead: ahead,
            appointmentTime: estTime,
            waitMinutes: ptWait || 30,
            doctorName,
            cabin,
            eventType: '30MIN_REMINDER'
          });
          dispatchedList.push(dispatched);
        }
      }

      return res.status(200).json({
        success: true,
        message: `30-minute reminder scan evaluated. Dispatched to ${dispatchedList.length} registered patients.`,
        count: dispatchedList.length,
        dispatches: dispatchedList
      });
    } catch (error) {
      console.error('[NotificationController] Error in trigger30MinReminder:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to dispatch 30-minute advance reminders.',
        error: error.message
      });
    }
  }

  /**
   * GET /api/notifications/logs
   * Retrieve historical audit logs of real-time SMS dispatches
   */
  static getLogs(req, res) {
    try {
      const logs = smsService.getAuditLogs();
      return res.status(200).json({
        success: true,
        count: logs.length,
        logs
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve SMS logs.',
        error: error.message
      });
    }
  }

  static getSmsLogs(req, res) {
    return NotificationController.getLogs(req, res);
  }

  /**
   * GET /api/notifications/status/:mobile
   * Query status for a specific registered mobile number
   */
  static getStatusByMobile(req, res) {
    try {
      const { mobile } = req.params;
      const cleanDigits = (mobile || '').replace(/\D/g, '');
      const targetTen = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
      const logs = smsService.getAuditLogs()
        .filter(l => {
          const itemDigits = (l.mobile || '').replace(/\D/g, '');
          const itemTen = itemDigits.length >= 10 ? itemDigits.slice(-10) : itemDigits;
          return itemTen === targetTen || itemDigits.includes(targetTen) || targetTen.includes(itemDigits);
        })
        .map(l => ({
          ...l,
          membersNext: l.membersAhead
        }));
      const latestAlert = logs[0] || null;
      return res.status(200).json({
        success: true,
        mobile,
        registeredMobile: mobile,
        latestAlert,
        count: logs.length,
        logs
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient notifications.',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/notifications/logs
   */
  static clearLogs(req, res) {
    smsService.dispatchLogs = [];
    return res.status(200).json({
      success: true,
      message: 'SMS dispatch logs cleared.'
    });
  }

  /**
   * GET /api/queue/status/:token
   */
  static getQueueStatus(req, res) {
    try {
      const { token } = req.params;
      const allPatients = patientDB.getAll();
      const status = smsService.calculateStatusForToken(token, allPatients);
      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve queue status.',
        error: error.message
      });
    }
  }
}

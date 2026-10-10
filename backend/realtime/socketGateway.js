/**
 * Socket.IO Real-Time Gateway
 * Synchronizes queue states across doctor dashboards, staff monitors,
 * and live patient mobile tracker views.
 */

import { Server as SocketIOServer } from 'socket.io';
import { queueDomainService, QUEUE_EVENTS } from '../services/queueDomainService.js';

class SocketGateway {
  constructor() {
    this.io = null;
  }

  init(httpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      // Room subscription for staff & doctor cabin dashboards
      socket.on('join:staff', () => {
        socket.join('clinic:staff');
      });

      socket.on('join:doctor', ({ doctorId }) => {
        socket.join(`doctor:${doctorId || 'DOC_SHARMA'}`);
      });

      // Private room subscription for patient tracker page
      socket.on('join:patient', ({ tokenId }) => {
        if (tokenId) {
          socket.join(`patient:${tokenId}`);
        }
      });
    });

    // Wire QueueDomainService events to real-time broadcasts
    queueDomainService.on(QUEUE_EVENTS.QUEUE_UPDATED, ({ doctorId, activeQueue }) => {
      if (!this.io) return;
      this.io.to('clinic:staff').emit('queue:updated', { doctorId, activeQueue });
      this.io.to(`doctor:${doctorId}`).emit('queue:updated', { doctorId, activeQueue });

      // Notify individual patient tracking rooms
      if (Array.isArray(activeQueue)) {
        activeQueue.forEach(token => {
          this.io.to(`patient:${token.tokenId}`).emit('patient:status', {
            position: token.position,
            status: token.status,
            estimatedWaitMinutes: token.estimatedWaitMinutes,
            timeRange: `${token.estimatedTimeStart} - ${token.estimatedTimeEnd}`,
            lastUpdated: new Date().toISOString()
          });
        });
      }
    });

    queueDomainService.on(QUEUE_EVENTS.TOKEN_CALLED, ({ token }) => {
      if (!this.io) return;
      this.io.to('clinic:staff').emit('token:called', token);
      this.io.to(`doctor:${token.doctorId}`).emit('token:called', token);
      this.io.to(`patient:${token.tokenId}`).emit('patient:called', {
        cabin: token.cabin,
        doctorName: token.doctorName,
        calledAt: token.calledAt
      });
    });

    queueDomainService.on(QUEUE_EVENTS.TOKEN_SKIPPED, ({ token, rejoinMinutes }) => {
      if (!this.io) return;
      this.io.to('clinic:staff').emit('token:skipped', token);
      this.io.to(`patient:${token.tokenId}`).emit('patient:skipped', {
        rejoinMinutes,
        rejoinDeadline: token.rejoinDeadlineAt
      });
    });

    console.log('[SocketGateway] Socket.IO Real-Time Gateway initialized.');
  }

  notifyReceptionAction(token) {
    if (this.io) {
      this.io.to('clinic:staff').emit('reception:alert', {
        tokenId: token.tokenId,
        tokenNumber: token.tokenNumber,
        patientName: token.patientName,
        patientMobile: token.patientMobile,
        reason: 'SMS Delivery permanently failed. Please call patient manually.'
      });
    }
  }
}

export const socketGateway = new SocketGateway();

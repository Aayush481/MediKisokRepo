/**
 * Queue Domain Service
 * Single source of truth for clinic & OPD queue state.
 * Implements atomic mutations, rolling average consultation duration per doctor,
 * honest ETA range computation, and domain event dispatching.
 */

import { EventEmitter } from 'events';
import { QueueTokenModel, TOKEN_STATUS } from '../models/QueueToken.js';

export const QUEUE_EVENTS = {
  TOKEN_BOOKED: 'queue.token.booked',
  TOKEN_ALMOST_DUE: 'queue.token.almost_due',
  TOKEN_CALLED: 'queue.token.called',
  QUEUE_DELAYED: 'queue.token.delayed',
  TOKEN_SKIPPED: 'queue.token.skipped',
  TOKEN_COMPLETED: 'queue.token.completed',
  TOKEN_CANCELLED: 'queue.token.cancelled',
  QUEUE_UPDATED: 'queue.updated'
};

export class QueueDomainService extends EventEmitter {
  constructor() {
    super();
    // Default consultation duration baseline: 8.5 minutes
    this.defaultDurationMinutes = 8.5;
    // Rolling consultation durations per doctor: Map<doctorId, Array<number>>
    this.doctorDurationHistory = new Map();
    // Queue pause states per doctor: Map<doctorId, boolean>
    this.doctorQueuePaused = new Map();
  }

  /**
   * Record actual consultation duration and update rolling average
   */
  recordDoctorConsultationDuration(doctorId, durationMinutes) {
    if (!durationMinutes || durationMinutes <= 0) return;
    if (!this.doctorDurationHistory.has(doctorId)) {
      this.doctorDurationHistory.set(doctorId, []);
    }
    const history = this.doctorDurationHistory.get(doctorId);
    history.push(Number(durationMinutes));
    // Keep last 15 consultations for rolling moving average
    if (history.length > 15) {
      history.shift();
    }
  }

  /**
   * Calculate rolling average consultation duration for a specific doctor
   * Returns a range [minMins, maxMins] and mean
   */
  getDoctorDurationMetrics(doctorId) {
    const history = this.doctorDurationHistory.get(doctorId) || [];
    if (history.length === 0) {
      return {
        average: this.defaultDurationMinutes,
        min: 6,
        max: 11
      };
    }
    const sum = history.reduce((acc, v) => acc + v, 0);
    const avg = sum / history.length;
    return {
      average: Math.round(avg * 10) / 10,
      min: Math.max(4, Math.round((avg * 0.75) * 10) / 10),
      max: Math.round((avg * 1.35) * 10) / 10
    };
  }

  /**
   * Calculate honest ETA range (e.g., '10:30 AM - 10:45 AM') based on positions ahead
   */
  calculateEtaRange(doctorId, positionsAhead) {
    if (positionsAhead <= 0) {
      return {
        waitMinutesRange: '0 mins',
        timeRangeStr: 'Immediate (Now)',
        minWaitMins: 0,
        maxWaitMins: 2
      };
    }

    const metrics = this.getDoctorDurationMetrics(doctorId);
    const minWaitMins = Math.round(positionsAhead * metrics.min);
    const maxWaitMins = Math.round(positionsAhead * metrics.max);

    const now = Date.now();
    const startTime = new Date(now + minWaitMins * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(now + maxWaitMins * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      waitMinutesRange: `${minWaitMins}-${maxWaitMins} mins`,
      timeRangeStr: `${startTime} - ${endTime}`,
      minWaitMins,
      maxWaitMins
    };
  }

  /**
   * Get active waiting tokens for a doctor in order
   */
  async getActiveQueue(doctorId) {
    const all = await QueueTokenModel.find({ doctorId });
    return all
      .filter(t => [TOKEN_STATUS.BOOKED, TOKEN_STATUS.WAITING, TOKEN_STATUS.ALMOST_DUE].includes(t.status))
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Recompute positions and ETA ranges for all waiting tokens in a doctor's queue
   */
  async refreshQueuePositions(doctorId) {
    const activeTokens = await this.getActiveQueue(doctorId);
    const updated = [];

    for (let idx = 0; idx < activeTokens.length; idx++) {
      const token = activeTokens[idx];
      const newPos = idx + 1;
      const eta = this.calculateEtaRange(doctorId, idx);
      
      let newStatus = token.status;
      // If position <= 2 (or ETA <= 15 min), mark as ALMOST_DUE
      if (newPos <= 2 && token.status === TOKEN_STATUS.WAITING) {
        newStatus = TOKEN_STATUS.ALMOST_DUE;
      }

      const up = await QueueTokenModel.updateById(token.tokenId, {
        position: newPos,
        estimatedWaitMinutes: Math.round((eta.minWaitMins + eta.maxWaitMins) / 2),
        estimatedTimeStart: eta.timeRangeStr.split(' - ')[0] || '',
        estimatedTimeEnd: eta.timeRangeStr.split(' - ')[1] || '',
        status: newStatus
      });
      updated.push(up);

      // Emit almost due event if transition just occurred
      if (newPos <= 2 && token.position > 2) {
        this.emit(QUEUE_EVENTS.TOKEN_ALMOST_DUE, {
          token: up,
          positionsAhead: idx,
          etaRange: eta.timeRangeStr
        });
      }
    }

    this.emit(QUEUE_EVENTS.QUEUE_UPDATED, { doctorId, activeQueue: updated });
    return updated;
  }

  /**
   * Add / Book a new token in the queue
   */
  async addToken(tokenData) {
    const doctorId = tokenData.doctorId || 'DOC_SHARMA';
    const activeQueue = await this.getActiveQueue(doctorId);
    const nextPosition = activeQueue.length + 1;
    const eta = this.calculateEtaRange(doctorId, activeQueue.length);

    const token = await QueueTokenModel.create({
      ...tokenData,
      doctorId,
      position: nextPosition,
      estimatedWaitMinutes: Math.round((eta.minWaitMins + eta.maxWaitMins) / 2),
      estimatedTimeStart: eta.timeRangeStr.split(' - ')[0] || '',
      estimatedTimeEnd: eta.timeRangeStr.split(' - ')[1] || '',
      status: nextPosition <= 2 ? TOKEN_STATUS.ALMOST_DUE : TOKEN_STATUS.WAITING
    });

    this.emit(QUEUE_EVENTS.TOKEN_BOOKED, {
      token,
      positionsAhead: activeQueue.length,
      etaRange: eta.timeRangeStr
    });

    await this.refreshQueuePositions(doctorId);
    return token;
  }

  /**
   * Call the next waiting patient into the doctor cabin
   */
  async callNext(doctorId = 'DOC_SHARMA') {
    const activeQueue = await this.getActiveQueue(doctorId);
    if (activeQueue.length === 0) {
      return { success: false, message: 'Queue is currently empty.' };
    }

    const nextToken = activeQueue[0];
    const now = new Date();

    // Mark previous patient in consultation (if any) as completed
    const currentInConsult = await QueueTokenModel.findOne({
      doctorId,
      status: TOKEN_STATUS.IN_CONSULTATION
    });

    if (currentInConsult) {
      const startTime = currentInConsult.consultationStartedAt ? new Date(currentInConsult.consultationStartedAt).getTime() : (now.getTime() - 8 * 60000);
      const duration = Math.max(1, Math.round((now.getTime() - startTime) / 60000));
      this.recordDoctorConsultationDuration(doctorId, duration);

      await QueueTokenModel.updateById(currentInConsult.tokenId, {
        status: TOKEN_STATUS.COMPLETED,
        consultationCompletedAt: now,
        actualDurationMinutes: duration
      });

      this.emit(QUEUE_EVENTS.TOKEN_COMPLETED, {
        token: currentInConsult,
        durationMinutes: duration
      });
    }

    // Advance the called token
    const calledToken = await QueueTokenModel.updateById(nextToken.tokenId, {
      status: TOKEN_STATUS.CALLED,
      position: 0,
      calledAt: now,
      consultationStartedAt: now
    });

    this.emit(QUEUE_EVENTS.TOKEN_CALLED, { token: calledToken });

    // Refresh remaining queue
    await this.refreshQueuePositions(doctorId);

    return {
      success: true,
      calledToken,
      remainingCount: activeQueue.length - 1
    };
  }

  /**
   * Skip a patient who failed to respond (No-show)
   */
  async skipToken(tokenId, rejoinMinutes = 15) {
    const token = await QueueTokenModel.findById(tokenId);
    if (!token) throw new Error(`Token ${tokenId} not found.`);

    const deadline = new Date(Date.now() + rejoinMinutes * 60000);
    const updated = await QueueTokenModel.updateById(tokenId, {
      status: TOKEN_STATUS.SKIPPED,
      skippedAt: new Date(),
      rejoinDeadlineAt: deadline,
      position: -1
    });

    this.emit(QUEUE_EVENTS.TOKEN_SKIPPED, {
      token: updated,
      rejoinMinutes,
      rejoinDeadline: deadline
    });

    await this.refreshQueuePositions(token.doctorId);
    return updated;
  }

  /**
   * Recall / Rejoin a skipped patient back into the queue
   */
  async recallToken(tokenId) {
    const token = await QueueTokenModel.findById(tokenId);
    if (!token) throw new Error(`Token ${tokenId} not found.`);

    const activeQueue = await this.getActiveQueue(token.doctorId);
    // Insert them near top (position 2 or at end if queue is short)
    const targetPos = Math.min(2, activeQueue.length + 1);

    const updated = await QueueTokenModel.updateById(tokenId, {
      status: TOKEN_STATUS.WAITING,
      position: targetPos,
      skippedAt: null,
      rejoinDeadlineAt: null
    });

    await this.refreshQueuePositions(token.doctorId);
    return updated;
  }

  /**
   * Broadcast clinic or doctor delay (doctor in emergency, round delay)
   */
  async delayQueue(doctorId, delayMinutes, reason = 'Doctor in urgent clinical consultation') {
    const activeQueue = await this.getActiveQueue(doctorId);
    this.emit(QUEUE_EVENTS.QUEUE_DELAYED, {
      doctorId,
      delayMinutes: Number(delayMinutes),
      reason,
      affectedTokens: activeQueue
    });
    return { success: true, affectedCount: activeQueue.length };
  }

  /**
   * Pause or resume a doctor's queue
   */
  async pauseResumeQueue(doctorId, isPaused) {
    this.doctorQueuePaused.set(doctorId, Boolean(isPaused));
    this.emit(QUEUE_EVENTS.QUEUE_UPDATED, { doctorId, isPaused });
    return { doctorId, isPaused: Boolean(isPaused) };
  }

  /**
   * Cancel an appointment token
   */
  async cancelToken(tokenId, reason = 'Patient cancelled') {
    const token = await QueueTokenModel.findById(tokenId);
    if (!token) throw new Error(`Token ${tokenId} not found.`);

    const updated = await QueueTokenModel.updateById(tokenId, {
      status: TOKEN_STATUS.CANCELLED,
      position: -1,
      cancelReason: reason
    });

    this.emit(QUEUE_EVENTS.TOKEN_CANCELLED, { token: updated, reason });
    await this.refreshQueuePositions(token.doctorId);
    return updated;
  }

  /**
   * Priority / Emergency insertion of a critical patient
   */
  async priorityInsert(tokenData) {
    const doctorId = tokenData.doctorId || 'DOC_SHARMA';
    const token = await QueueTokenModel.create({
      ...tokenData,
      doctorId,
      position: 1, // Immediately top of next waiting
      status: TOKEN_STATUS.ALMOST_DUE,
      isPriority: true
    });

    // Shift other tokens down
    await this.refreshQueuePositions(doctorId);

    this.emit(QUEUE_EVENTS.TOKEN_BOOKED, {
      token,
      positionsAhead: 0,
      etaRange: 'Priority (< 5 mins)'
    });

    return token;
  }
}

export const queueDomainService = new QueueDomainService();

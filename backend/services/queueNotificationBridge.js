/**
 * Queue Notification Bridge
 * Subscribes to QueueDomainService domain events, evaluates notification rules,
 * and enqueues BullMQ jobs with single deduplication keys.
 */

import { queueDomainService, QUEUE_EVENTS } from './queueDomainService.js';
import { notificationRulesEngine } from './notificationRulesEngine.js';
import { smsNotificationQueue } from '../queues/smsQueue.js';

export function setupQueueNotificationBridge() {
  // 1. Token Booked / Registered
  queueDomainService.on(QUEUE_EVENTS.TOKEN_BOOKED, async ({ token, positionsAhead, etaRange }) => {
    try {
      const evaluation = notificationRulesEngine.evaluate('TOKEN_BOOKED', token, { positionsAhead, etaRange });
      if (evaluation.shouldSend) {
        await smsNotificationQueue.enqueue({
          tokenId: token.tokenId,
          tokenNumber: token.tokenNumber,
          eventType: 'TOKEN_BOOKED',
          variables: evaluation.variables,
          preferredLanguage: evaluation.preferredLanguage,
          mobile: evaluation.mobile,
          dedupKey: evaluation.dedupKey,
          version: token.version
        });
      } else {
        console.log(`[QueueNotificationBridge] TOKEN_BOOKED suppressed for ${token.tokenNumber}: ${evaluation.reason}`);
      }
    } catch (err) {
      console.error(`[QueueNotificationBridge] Error handling TOKEN_BOOKED: ${err.message}`);
    }
  });

  // 2. "Almost Your Turn" (Position <= N or ETA <= X)
  queueDomainService.on(QUEUE_EVENTS.TOKEN_ALMOST_DUE, async ({ token, positionsAhead, etaRange }) => {
    try {
      const evaluation = notificationRulesEngine.evaluate('ALMOST_TURN', token, { positionsAhead, etaRange });
      if (evaluation.shouldSend) {
        await smsNotificationQueue.enqueue({
          tokenId: token.tokenId,
          tokenNumber: token.tokenNumber,
          eventType: 'ALMOST_TURN',
          variables: evaluation.variables,
          preferredLanguage: evaluation.preferredLanguage,
          mobile: evaluation.mobile,
          dedupKey: evaluation.dedupKey,
          version: token.version
        });
      } else {
        console.log(`[QueueNotificationBridge] ALMOST_TURN suppressed for ${token.tokenNumber}: ${evaluation.reason}`);
      }
    } catch (err) {
      console.error(`[QueueNotificationBridge] Error handling TOKEN_ALMOST_DUE: ${err.message}`);
    }
  });

  // 3. "Your Turn Now" (Token Called)
  queueDomainService.on(QUEUE_EVENTS.TOKEN_CALLED, async ({ token }) => {
    try {
      const evaluation = notificationRulesEngine.evaluate('TOKEN_CALLED', token);
      if (evaluation.shouldSend) {
        await smsNotificationQueue.enqueue({
          tokenId: token.tokenId,
          tokenNumber: token.tokenNumber,
          eventType: 'TOKEN_CALLED',
          variables: evaluation.variables,
          preferredLanguage: evaluation.preferredLanguage,
          mobile: evaluation.mobile,
          dedupKey: evaluation.dedupKey,
          version: token.version
        });
      }
    } catch (err) {
      console.error(`[QueueNotificationBridge] Error handling TOKEN_CALLED: ${err.message}`);
    }
  });

  // 4. Delay / Reschedule Notification
  queueDomainService.on(QUEUE_EVENTS.QUEUE_DELAYED, async ({ delayMinutes, reason, affectedTokens = [] }) => {
    try {
      for (const token of affectedTokens) {
        const evaluation = notificationRulesEngine.evaluate('QUEUE_DELAYED', token, { delayMinutes, reason });
        if (evaluation.shouldSend) {
          await smsNotificationQueue.enqueue({
            tokenId: token.tokenId,
            tokenNumber: token.tokenNumber,
            eventType: 'QUEUE_DELAYED',
            variables: evaluation.variables,
            preferredLanguage: evaluation.preferredLanguage,
            mobile: evaluation.mobile,
            dedupKey: evaluation.dedupKey,
            version: token.version
          });
        }
      }
    } catch (err) {
      console.error(`[QueueNotificationBridge] Error handling QUEUE_DELAYED: ${err.message}`);
    }
  });

  // 5. Missed Call / Skipped Token
  queueDomainService.on(QUEUE_EVENTS.TOKEN_SKIPPED, async ({ token, rejoinMinutes }) => {
    try {
      const evaluation = notificationRulesEngine.evaluate('TOKEN_SKIPPED', token, { rejoinMinutes });
      if (evaluation.shouldSend) {
        await smsNotificationQueue.enqueue({
          tokenId: token.tokenId,
          tokenNumber: token.tokenNumber,
          eventType: 'TOKEN_SKIPPED',
          variables: evaluation.variables,
          preferredLanguage: evaluation.preferredLanguage,
          mobile: evaluation.mobile,
          dedupKey: evaluation.dedupKey,
          version: token.version
        });
      }
    } catch (err) {
      console.error(`[QueueNotificationBridge] Error handling TOKEN_SKIPPED: ${err.message}`);
    }
  });

  // 6. Completed / Cancelled
  queueDomainService.on(QUEUE_EVENTS.TOKEN_COMPLETED, async ({ token }) => {
    try {
      const evaluation = notificationRulesEngine.evaluate('TOKEN_COMPLETED', token);
      if (evaluation.shouldSend) {
        await smsNotificationQueue.enqueue({
          tokenId: token.tokenId,
          tokenNumber: token.tokenNumber,
          eventType: 'TOKEN_COMPLETED',
          variables: evaluation.variables,
          preferredLanguage: evaluation.preferredLanguage,
          mobile: evaluation.mobile,
          dedupKey: evaluation.dedupKey,
          version: token.version
        });
      }
    } catch (err) {
      console.error(`[QueueNotificationBridge] Error handling TOKEN_COMPLETED: ${err.message}`);
    }
  });

  console.log('[QueueNotificationBridge] Event-driven SMS triggers registered successfully.');
}

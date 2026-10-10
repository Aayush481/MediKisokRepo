/**
 * SMS Notification Worker
 * Executes background SMS dispatch jobs with:
 * - Stale-message protection (drops outdated notifications if token already moved/cancelled)
 * - Strict TRAI DLT validation
 * - Automatic provider failover (Fast2SMS -> Twilio / Secondary)
 * - Deduplication checking
 * - Telemetry & audit logging
 */

import { QueueTokenModel, TOKEN_STATUS, DELIVERY_FLAG } from '../models/QueueToken.js';
import { SmsDeliveryAttemptModel, ATTEMPT_STATUS } from '../models/SmsDeliveryAttempt.js';
import { DltTemplateValidator } from '../services/sms/dltTemplateValidator.js';
import { smsProviderManager } from '../services/sms/smsProviderManager.js';
import { notificationRulesEngine } from '../services/notificationRulesEngine.js';

export async function processSmsJob(job) {
  const data = job.data || job;
  const {
    tokenId,
    tokenNumber,
    eventType,
    variables = [],
    preferredLanguage = 'en',
    mobile,
    dedupKey,
    version = 1
  } = data;

  console.log(`[SmsWorker] Processing Job #${job.id || dedupKey} for Token ${tokenNumber} (${eventType})`);

  // Step 1: Idempotency check against database
  const existing = await SmsDeliveryAttemptModel.findByDedupKey(dedupKey);
  if (existing && [ATTEMPT_STATUS.DELIVERED, ATTEMPT_STATUS.SENT].includes(existing.status)) {
    console.log(`[SmsWorker] Dedup hit: Job ${dedupKey} already processed. Skipping duplicate dispatch.`);
    return { skipped: true, reason: 'Duplicate deduplication key', dedupKey };
  }

  // Step 2: Stale-Message Protection
  // Re-verify current clinical token state before sending
  const currentToken = await QueueTokenModel.findById(tokenId);
  if (!currentToken) {
    console.warn(`[SmsWorker] Stale protection: Token ${tokenId} no longer exists. Dropping job.`);
    await SmsDeliveryAttemptModel.create({
      dedupKey,
      tokenId,
      tokenNumber,
      eventType,
      status: ATTEMPT_STATUS.DROPPED_STALE,
      errorMessage: 'Token not found in active database'
    });
    return { dropped: true, reason: 'TOKEN_NOT_FOUND' };
  }

  // Check if token was cancelled or completed while job was queued
  if ([TOKEN_STATUS.CANCELLED, TOKEN_STATUS.COMPLETED].includes(currentToken.status) && eventType !== 'TOKEN_COMPLETED' && eventType !== 'TOKEN_CANCELLED') {
    console.log(`[SmsWorker] Stale protection: Token ${tokenNumber} is already ${currentToken.status}. Dropping outdated ${eventType} alert.`);
    await SmsDeliveryAttemptModel.create({
      dedupKey,
      tokenId,
      tokenNumber,
      eventType,
      status: ATTEMPT_STATUS.DROPPED_STALE,
      errorMessage: `Token already in ${currentToken.status} state`
    });
    return { dropped: true, reason: 'TOKEN_ALREADY_INACTIVE' };
  }

  // Check if 'ALMOST_TURN' is queued, but patient has already been called
  if (eventType === 'ALMOST_TURN' && [TOKEN_STATUS.CALLED, TOKEN_STATUS.IN_CONSULTATION].includes(currentToken.status)) {
    console.log(`[SmsWorker] Stale protection: Token ${tokenNumber} is already CALLED. Dropping obsolete ALMOST_TURN alert.`);
    await SmsDeliveryAttemptModel.create({
      dedupKey,
      tokenId,
      tokenNumber,
      eventType,
      status: ATTEMPT_STATUS.DROPPED_STALE,
      errorMessage: 'Token already called'
    });
    return { dropped: true, reason: 'ALREADY_CALLED' };
  }

  // Step 3: Strict TRAI DLT Validation
  const dltResult = DltTemplateValidator.validateAndRender(eventType, variables, preferredLanguage);
  if (!dltResult.valid) {
    const errorMsg = `TRAI DLT validation failed: ${dltResult.errors.join('; ')}`;
    console.error(`[SmsWorker] ${errorMsg}`);
    await SmsDeliveryAttemptModel.create({
      dedupKey,
      tokenId,
      tokenNumber,
      eventType,
      status: ATTEMPT_STATUS.FAILED,
      errorCode: 'DLT_VALIDATION_ERROR',
      errorMessage: errorMsg
    });
    throw new Error(errorMsg);
  }

  // Step 4: Dispatch via Provider Manager with automatic failover
  const maskedMobile = notificationRulesEngine.maskMobile(mobile);
  try {
    const dispatchResult = await smsProviderManager.sendWithFailover({
      to: mobile,
      message: dltResult.renderedText,
      templateId: dltResult.templateId,
      entityId: dltResult.entityId,
      senderId: dltResult.senderId,
      variables: dltResult.variables,
      isUnicode: dltResult.isUnicode
    });

    // Record delivery attempt in audit DB
    const attempt = await SmsDeliveryAttemptModel.create({
      dedupKey,
      tokenId,
      tokenNumber,
      eventType,
      templateId: dltResult.templateId,
      maskedMobile,
      provider: dispatchResult.providerUsed,
      providerMessageId: dispatchResult.providerMessageId,
      status: dispatchResult.status === 'DELIVERED' ? ATTEMPT_STATUS.DELIVERED : ATTEMPT_STATUS.SENT,
      latencyMs: dispatchResult.latencyMs,
      isFallback: dispatchResult.isFallback,
      renderedLength: dltResult.renderedText.length,
      isUnicode: dltResult.isUnicode
    });

    console.log(`[SmsWorker] Successfully dispatched ${eventType} to ${maskedMobile} via ${dispatchResult.providerUsed} (MsgID: ${dispatchResult.providerMessageId})`);

    return {
      success: true,
      providerMessageId: dispatchResult.providerMessageId,
      attemptId: attempt.id,
      provider: dispatchResult.providerUsed
    };
  } catch (dispatchErr) {
    console.error(`[SmsWorker] Dispatch failed for ${tokenNumber}: ${dispatchErr.message}`);

    // Flag token for reception action if all carrier retries failed
    await QueueTokenModel.updateById(tokenId, {
      deliveryFlag: DELIVERY_FLAG.FLAGGED_FOR_RECEPTION,
      failedAttemptsCount: (currentToken.failedAttemptsCount || 0) + 1
    });

    await SmsDeliveryAttemptModel.create({
      dedupKey,
      tokenId,
      tokenNumber,
      eventType,
      templateId: dltResult.templateId,
      maskedMobile,
      provider: 'FAILOVER_EXHAUSTED',
      status: ATTEMPT_STATUS.FAILED,
      errorCode: dispatchErr.statusCode || 'CARRIER_ERROR',
      errorMessage: dispatchErr.message
    });

    throw dispatchErr;
  }
}

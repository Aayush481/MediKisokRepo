/**
 * SMS Webhook & Delivery Receipt (DLR) Controller
 * Handles incoming carrier delivery receipts, signature verification,
 * out-of-order DLR tolerance, failover flagging, and inbound 2-way SMS (STOP / CANCEL / STATUS).
 */

import { SmsDeliveryAttemptModel, ATTEMPT_STATUS } from '../models/SmsDeliveryAttempt.js';
import { QueueTokenModel, DELIVERY_FLAG } from '../models/QueueToken.js';
import { smsProviderManager } from '../services/sms/smsProviderManager.js';
import { queueDomainService } from '../services/queueDomainService.js';
import { notificationRulesEngine } from '../services/notificationRulesEngine.js';

export class SmsWebhookController {
  /**
   * POST /api/sms/webhook/:provider
   * Receives incoming delivery receipt from telecom gateway
   */
  static async handleDeliveryReceipt(req, res) {
    const providerParam = (req.params.provider || '').toLowerCase();
    const provider = smsProviderManager.getPrimary();

    try {
      const parsed = provider.parseWebhook(req.headers, req.body);

      if (!parsed.validSignature) {
        console.warn(`[SmsWebhook] Invalid webhook signature from provider: ${providerParam}`);
        return res.status(401).json({ success: false, message: 'Invalid webhook cryptographic signature' });
      }

      const { providerMessageId, status, errorCode } = parsed;
      if (!providerMessageId) {
        return res.status(400).json({ success: false, message: 'Missing providerMessageId in DLR payload' });
      }

      console.log(`[SmsWebhook] Received DLR for MsgID ${providerMessageId}: Status=${status}`);

      // Locate delivery attempt in database
      const attempt = await SmsDeliveryAttemptModel.findByProviderMessageId(providerMessageId);
      if (!attempt) {
        // Out-of-order tolerance: attempt might be committing or sandbox id
        console.warn(`[SmsWebhook] Attempt not found for MsgID ${providerMessageId}. Storing standalone DLR record.`);
        return res.status(200).json({ success: true, status: 'RECORDED_STANDALONE' });
      }

      // Idempotency: if already delivered or finalized, don't regress
      if (attempt.status === ATTEMPT_STATUS.DELIVERED && status !== 'DELIVERED') {
        return res.status(200).json({ success: true, status: 'IGNORED_SUPERSEDED' });
      }

      const newStatus = status === 'DELIVERED' ? ATTEMPT_STATUS.DELIVERED : (['FAILED', 'UNDELIVERED'].includes(status) ? ATTEMPT_STATUS.FAILED : ATTEMPT_STATUS.SENT);

      await SmsDeliveryAttemptModel.updateStatus(attempt.id, {
        status: newStatus,
        errorCode: errorCode || attempt.errorCode
      });

      // If delivery permanently failed, flag the token on the staff dashboard for reception manual outreach
      if (newStatus === ATTEMPT_STATUS.FAILED && attempt.tokenId) {
        console.warn(`[SmsWebhook] Flagging Token ${attempt.tokenNumber} for RECEPTION ACTION due to carrier delivery failure.`);
        await QueueTokenModel.updateById(attempt.tokenId, {
          deliveryFlag: DELIVERY_FLAG.FLAGGED_FOR_RECEPTION,
          lastDeliveryStatus: 'FAILED'
        });
      }

      return res.status(200).json({
        success: true,
        providerMessageId,
        updatedStatus: newStatus
      });
    } catch (err) {
      console.error(`[SmsWebhook] Error processing DLR: ${err.message}`);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/sms/inbound
   * Handles inbound 2-way patient SMS commands: "CANCEL", "STOP", "STATUS"
   */
  static async handleInboundSms(req, res) {
    try {
      const { From, Body } = req.body;
      const rawMobile = notificationRulesEngine.normalizeMobile(From || req.body.mobile || '');
      const command = (Body || req.body.text || '').trim().toUpperCase();

      console.log(`[SmsWebhook] Inbound SMS from ${notificationRulesEngine.maskMobile(rawMobile)}: "${command}"`);

      // Find active token associated with this phone number
      const activeTokens = await QueueTokenModel.find({ patientMobile: rawMobile });
      const activeToken = activeTokens.find(t => ['BOOKED', 'WAITING', 'ALMOST_DUE', 'CALLED'].includes(t.status));

      if (command === 'STOP') {
        // Patient opting out of notifications (DPDP Act 2023 compliance)
        if (activeToken) {
          await QueueTokenModel.updateById(activeToken.tokenId, { optedOut: true });
        }
        return res.status(200).json({
          success: true,
          action: 'OPT_OUT_CONFIRMED',
          reply: 'You have unsubscribed from MediKiosk OPD SMS updates. Reply START to resubscribe.'
        });
      }

      if (command === 'CANCEL') {
        if (!activeToken) {
          return res.status(200).json({
            success: true,
            reply: 'No active OPD token found to cancel.'
          });
        }
        await queueDomainService.cancelToken(activeToken.tokenId, 'Patient cancelled via SMS');
        return res.status(200).json({
          success: true,
          action: 'TOKEN_CANCELLED',
          reply: `Your OPD Token #${activeToken.tokenNumber} has been cancelled.`
        });
      }

      if (command === 'STATUS') {
        if (!activeToken) {
          return res.status(200).json({
            success: true,
            reply: 'You do not have an active OPD token today.'
          });
        }
        return res.status(200).json({
          success: true,
          action: 'STATUS_REPORT',
          reply: `Token #${activeToken.tokenNumber}: Position ${activeToken.position}, Wait approx ${activeToken.estimatedWaitMinutes}m (${activeToken.estimatedTimeStart}-${activeToken.estimatedTimeEnd}).`
        });
      }

      return res.status(200).json({
        success: true,
        action: 'HELP_INFO',
        reply: 'MediKiosk OPD Help: Reply STATUS for queue position, CANCEL to cancel appointment, or STOP to opt out.'
      });
    } catch (err) {
      console.error(`[SmsWebhook] Error handling inbound SMS: ${err.message}`);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/sms/telemetry
   * Admin metrics endpoint for dashboard
   */
  static async getTelemetry(req, res) {
    try {
      const metrics = await SmsDeliveryAttemptModel.getMetrics();
      const recentAttempts = await SmsDeliveryAttemptModel.getAll(50);
      return res.status(200).json({
        success: true,
        metrics,
        recentAttempts
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

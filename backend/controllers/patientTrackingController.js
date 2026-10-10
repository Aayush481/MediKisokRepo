/**
 * Patient Live Tracking Controller
 * Validates HMAC-signed expiring tokens from SMS links and serves
 * real-time queue position, doctor cabin, and ETA ranges.
 * Fully optimized for low-end mobile browsers on 2G/3G networks.
 */

import { QueueTokenModel } from '../models/QueueToken.js';
import { notificationRulesEngine } from '../services/notificationRulesEngine.js';
import { queueDomainService } from '../services/queueDomainService.js';

export class PatientTrackingController {
  /**
   * GET /api/queue/track/:signedToken
   * Fetches JSON queue status for signed tracking token
   */
  static async getTrackingData(req, res) {
    const { signedToken } = req.params;
    const verification = notificationRulesEngine.verifySignedTrackingToken(signedToken);

    if (!verification.valid) {
      return res.status(403).json({
        success: false,
        error: verification.reason || 'Invalid or expired tracking link'
      });
    }

    const token = await QueueTokenModel.findById(verification.tokenId);
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token record not found in active clinic registry'
      });
    }

    const doctorMetrics = queueDomainService.getDoctorDurationMetrics(token.doctorId);
    const positionsAhead = Math.max(0, (token.position || 1) - 1);

    return res.status(200).json({
      success: true,
      tokenNumber: token.tokenNumber,
      status: token.status,
      position: token.position,
      positionsAhead,
      doctorName: token.doctorName,
      departmentName: token.departmentName,
      cabin: token.cabin,
      estimatedWaitMinutes: token.estimatedWaitMinutes,
      timeRange: `${token.estimatedTimeStart || ''} - ${token.estimatedTimeEnd || ''}`.trim(),
      averageConsultationMinutes: doctorMetrics.average,
      calledAt: token.calledAt,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * GET /q/:signedToken
   * Direct mobile browser landing page for patient SMS tracking link
   */
  static async renderMobileTrackingPage(req, res) {
    const { signedToken } = req.params;
    const verification = notificationRulesEngine.verifySignedTrackingToken(signedToken);

    if (!verification.valid) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>MediKiosk OPD - Link Expired</title>
          <style>body{font-family:sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;}
          .card{background:#1e293b;padding:32px;border-radius:16px;max-width:380px;box-shadow:0 10px 25px rgba(0,0,0,0.5);}
          h2{color:#f87171;margin-top:0;}p{color:#94a3b8;font-size:15px;}</style>
        </head>
        <body>
          <div class="card">
            <h2> Link Expired or Invalid</h2>
            <p>${verification.reason || 'This secure tracking link has expired.'}</p>
            <p>Please check the reception counter or request a new SMS update.</p>
          </div>
        </body>
        </html>
      `);
    }

    const token = await QueueTokenModel.findById(verification.tokenId);
    if (!token) {
      return res.status(404).send('Token not found.');
    }

    const isCalled = token.status === 'CALLED';
    const isAlmostDue = token.status === 'ALMOST_DUE';
    const statusColor = isCalled ? '#ef4444' : (isAlmostDue ? '#f59e0b' : '#10b981');
    const statusBadge = isCalled ? ' YOUR TURN NOW' : (isAlmostDue ? ' ALMOST YOUR TURN' : '⏳ IN QUEUE');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Token ${token.tokenNumber} - MediKiosk Live Tracker</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; margin: 0; padding: 16px; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .tracker-card { background: #131d31; border: 1px solid #1e293b; border-radius: 20px; width: 100%; max-width: 420px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
          .brand { font-size: 14px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; }
          .badge { background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}55; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
          .token-hero { text-align: center; margin: 24px 0; }
          .token-label { font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
          .token-num { font-size: 56px; font-weight: 900; color: #ffffff; letter-spacing: -1px; margin: 4px 0; }
          .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
          .stat-box { background: #1a253c; border-radius: 12px; padding: 14px; text-align: center; }
          .stat-val { font-size: 22px; font-weight: 800; color: #38bdf8; }
          .stat-lbl { font-size: 12px; color: #94a3b8; margin-top: 4px; }
          .info-list { background: #1a253c; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; font-size: 14px; }
          .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #23314f; }
          .info-row:last-child { border-bottom: none; }
          .info-lbl { color: #94a3b8; }
          .info-val { font-weight: 600; color: #f1f5f9; }
          .live-indicator { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; color: #10b981; }
          .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          .footer-note { text-align: center; font-size: 11px; color: #64748b; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="tracker-card">
          <div class="header">
            <div class="brand"> MediKiosk OPD</div>
            <div class="badge">${statusBadge}</div>
          </div>
          <div class="token-hero">
            <div class="token-label">Your Live Token</div>
            <div class="token-num">${token.tokenNumber}</div>
            <div style="color: #cbd5e1; font-weight: 500;">${token.patientName}</div>
          </div>
          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-val">${token.position > 0 ? token.position : 'Called'}</div>
              <div class="stat-lbl">Queue Position</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${token.estimatedWaitMinutes || 0}m</div>
              <div class="stat-lbl">Approx Wait</div>
            </div>
          </div>
          <div class="info-list">
            <div class="info-row">
              <span class="info-lbl">Doctor:</span>
              <span class="info-val">${token.doctorName}</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Cabin / Room:</span>
              <span class="info-val" style="color: #38bdf8;">${token.cabin}</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Estimated Time:</span>
              <span class="info-val">${token.estimatedTimeStart || ''} - ${token.estimatedTimeEnd || ''}</span>
            </div>
          </div>
          <div class="live-indicator">
            <div class="dot"></div>
            <span>Auto-refreshing every 10s &bull; Last updated ${new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        <div class="footer-note">MediKiosk DPDP Act 2023 Compliant Clinical Tracking</div>
        <script>
          // Automatic resilient polling fallback for 2G/3G low-end devices
          setInterval(() => {
            fetch('/api/queue/track/${signedToken}')
              .then(res => res.json())
              .then(data => {
                if (data.success && data.status !== '${token.status}') {
                  location.reload();
                }
              }).catch(() => {});
          }, 10000);
        </script>
      </body>
      </html>
    `;

    return res.status(200).send(html);
  }
}

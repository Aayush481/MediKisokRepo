/**
 * MediKiosk Emergency Triage Red-Flag Alert Modal
 * Immediately interrupts intake workflow when critical life-threatening criteria are triggered.
 * Localized emergency directives (112 / 108 calling) and fast-track OPD triage instructions.
 */

export class EmergencyAlertModal {
  static show(triageResult, onAcknowledge = null) {
    let modal = document.getElementById("emergencyAlertModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "emergencyAlertModal";
      modal.className = "modal-backdrop-3d emergency-backdrop-critical";
      document.body.appendChild(modal);
    }

    const triggered = triageResult?.triggeredRules || [];
    const reasonText = triggered.map(r => r.reason).join("<br/><br/>") || "Critical physiological or symptom distress criteria triggered.";

    modal.innerHTML = `
      <div class="modal-content-3d emergency-modal-critical" style="max-width: 640px; border: 2.5px solid #EF4444; background: #0b0f19; box-shadow: 0 0 40px rgba(239, 68, 68, 0.4);">
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(239,68,68,0.3); padding-bottom: 12px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(239,68,68,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; border: 2px solid #EF4444; animation: pulse 1.5s infinite;">
            🚨
          </div>
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 900; color: #EF4444; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
              Immediate Emergency Care Required
            </h2>
            <p style="font-size: 0.8rem; color: #FCA5A5; margin: 2px 0 0 0;">
              तत्काल आपातकालीन चिकित्सा सहायता प्राप्त करें • Priority 1 Red Flag
            </p>
          </div>
        </div>

        <div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #EF4444; border-radius: 8px; padding: 14px; margin-bottom: 1.2rem;">
          <strong style="color: #F87171; font-size: 0.88rem; display: block; margin-bottom: 6px;">
            ⚠️ Clinical Red-Flag Triggered:
          </strong>
          <div style="font-size: 0.84rem; color: #FEE2E2; line-height: 1.5;">
            ${reasonText}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 1.2rem;">
          <a href="tel:112" class="btn-3d" style="background: #DC2626; color: #FFFFFF; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-size: 0.95rem; border: 1px solid #EF4444; border-radius: 8px;">
            📞 Call National 112
          </a>
          <a href="tel:108" class="btn-3d" style="background: #B91C1C; color: #FFFFFF; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-size: 0.95rem; border: 1px solid #F87171; border-radius: 8px;">
            🚑 Call Ambulance 108
          </a>
        </div>

        <div style="background: #1e293b; border-radius: 8px; padding: 12px; margin-bottom: 1.2rem; font-size: 0.78rem; color: #CBD5E1; line-height: 1.4;">
          🏥 <strong>Hospital Kiosk Action:</strong> Please inform the nearest triage nurse, OPD reception, or security desk immediately for emergency room fast-tracking. Do not leave the facility unattended.
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.7rem; color: #94A3B8;">
            Rule Engine: ${triageResult?.engineVersion || 'v2.1.0'} • CDSCO SaMD Informational Notice
          </span>
          <button id="btnAcknowledgeEmergency" class="btn-3d btn-3d-secondary" style="padding: 8px 16px; font-size: 0.8rem; border-color: rgba(255,255,255,0.2);">
            Acknowledge & Continue with Warning
          </button>
        </div>
      </div>
    `;

    modal.style.display = "flex";

    const btnAck = document.getElementById("btnAcknowledgeEmergency");
    if (btnAck) {
      btnAck.onclick = () => {
        modal.style.display = "none";
        if (typeof onAcknowledge === "function") {
          onAcknowledge();
        }
      };
    }
  }

  static hide() {
    const modal = document.getElementById("emergencyAlertModal");
    if (modal) modal.style.display = "none";
  }
}

// Encounter summary, OPD consultation token, and queue pass component

export function generateBarcodeSvg(text) {
  const CODE39 = {
    '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
    '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
    '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
    'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
    'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
    'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
    'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
    'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
    'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
    '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
    '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
  };

  const clean = '*' + (text || 'A-15').toUpperCase().replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '') + '*';
  let x = 6;
  const narrow = 2;
  const wide = 5;
  const height = 30;
  const rects = [];

  for (const ch of clean) {
    const pattern = CODE39[ch] || CODE39['-'];
    for (let i = 0; i < 9; i++) {
      const isBar = (i % 2 === 0);
      const w = pattern[i] === '1' ? wide : narrow;
      if (isBar) {
        rects.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="var(--text-primary)"/>`);
      }
      x += w;
    }
    x += narrow;
  }

  const totalW = x + 6;
  return `<svg viewBox="0 0 ${totalW} ${height}" width="${Math.min(260, totalW)}" height="28" style="opacity: 0.9;">${rects.join('')}</svg>`;
}

export function renderStep4Summary(app, i18n) {
  const patient = app.patient;
  const qIdx = app.doctorQueue.findIndex(p => p.id === patient.id);
  const qPosition = qIdx >= 0 ? qIdx + 1 : app.doctorQueue.length;
  const patientsAhead = Math.max(0, qPosition - 1);
  const estWaitMin = patientsAhead === 0 ? 5 : Math.round(patientsAhead * 7.5);
  const token = patient.tokenNumber || 'A-15';
  const regUhid = patient.id || `MED-${Date.now().toString().slice(-5)}`;
  const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return `
    <div class="opd-ticket-wrapper">
      <!-- Summary congratulations -->
      <div style="text-align: center; margin-bottom: 1.25rem;">
        <h2 style="font-size: 1.45rem; font-weight: 800; color: #FFFFFF; letter-spacing: -0.01em;">
          ${i18n.t("summary_congrats")}
        </h2>
        <p style="font-size: 0.84rem; color: var(--slate-300); margin-top: 4px;">
          ${i18n.t("summary_subtitle")}
        </p>
      </div>

      <!-- OPD token pass card -->
      <div class="opd-ticket-card">
        <!-- Clinic header band -->
        <div class="ticket-header-band">
          <div class="ticket-clinic-info">
            <div class="ticket-clinic-emblem" style="background: var(--primary-gradient); color: #FFFFFF; font-weight: 800; font-family: var(--font-mono);">OPD</div>
            <div>
              <div class="ticket-clinic-title">MediKiosk Outpatient Department</div>
              <div class="ticket-clinic-subtitle">ABDM First-Mile Triage & Digital Queue Pass</div>
            </div>
          </div>
          <div class="ticket-status-chip">
            <span class="ticket-status-dot"></span>
            <span>Live Queue</span>
          </div>
        </div>

        <div class="ticket-body">
          <!-- Hero token number -->
          <div class="ticket-token-hero">
            <div>
              <div class="token-label-text">${i18n.t("opd_token_header")}</div>
              <div class="token-number-hero" style="color: var(--primary);">${token}</div>
              <div class="token-dept-badge">
                <span>${i18n.t("default_dept")}</span>
              </div>
            </div>
            <div class="token-cabin-pill">
              <div class="token-cabin-label">Attending Desk</div>
              <div class="token-cabin-value">Cabin 04</div>
              <div style="font-size: 0.72rem; color: var(--slate-400); margin-top: 2px;">Dr. Sharma (MD)</div>
            </div>
          </div>

          <!-- Perforated tear line -->
          <div class="ticket-perforation">
            <div class="ticket-notch-left"></div>
            <div class="ticket-tear-line"></div>
            <div class="ticket-notch-right"></div>
          </div>

          <!-- Patient details grid -->
          <div class="ticket-meta-grid">
            <div class="ticket-meta-item">
              <span class="ticket-meta-label">${i18n.t("patient_info_label")}</span>
              <span class="ticket-meta-value">${patient.name || 'Walk-in Patient'} (${patient.age || '--'} ${i18n.t("age_yrs")} / ${i18n.t("gender_" + (patient.gender || "Female").toLowerCase()) || patient.gender})</span>
            </div>
            <div class="ticket-meta-item">
              <span class="ticket-meta-label">Registration UHID</span>
              <span class="ticket-meta-value" style="font-family: var(--font-mono); color: var(--primary);">${regUhid}</span>
            </div>
            <div class="ticket-meta-item">
              <span class="ticket-meta-label">Registered Mobile</span>
              <span class="ticket-meta-value">${patient.mobile || '+91 98765 43210'}</span>
            </div>
            <div class="ticket-meta-item">
              <span class="ticket-meta-label">Issued Date & Time</span>
              <span class="ticket-meta-value">${nowStr}</span>
            </div>
          </div>

          <!-- Live queue stepper -->
          <div class="ticket-queue-section">
            <div class="ticket-queue-header">
              <span class="ticket-queue-title">${i18n.t("est_wait_label")}</span>
              <span class="ticket-wait-pill">~${estWaitMin} Mins (${patientsAhead} Ahead)</span>
            </div>
            <div class="ticket-queue-stepper">
              <div class="queue-step-node active-now" title="Currently inside doctor cabin">1</div>
              <div class="queue-step-node">2</div>
              <div class="queue-step-node">3</div>
              <div class="queue-step-node patient-target" title="Your turn">4</div>
            </div>
            <div class="queue-step-caption">
              <span>Now Serving at Cabin 04</span>
              <span style="color: var(--primary); font-weight: 700; font-family: var(--font-mono);">Your Position (${token})</span>
            </div>
          </div>

          <!-- Automated SMS notice -->
          <div class="ticket-sms-box">
            <div class="ticket-sms-icon" style="background: rgba(14, 165, 233, 0.15); color: var(--primary); font-family: var(--font-mono);">SMS</div>
            <div class="ticket-sms-content">
              <div class="ticket-sms-title" style="color: #FFFFFF; font-family: var(--font-mono); margin-bottom: 2px;">Automated SMS Notification</div>
              <p class="ticket-sms-desc">
                An automated SMS alert will be dispatched to <strong>${patient.mobile || '+91 98765 43210'}</strong> exactly 30 minutes before your consultation call.
              </p>
            </div>
            <span class="pill-3d pill-3d-blue" style="font-size: 0.68rem; align-self: center; white-space: nowrap;">
              ${patient.smsAlertSent ? 'Alert Sent' : 'Scheduled'}
            </span>
          </div>

          <!-- Barcode graphic -->
          <div class="ticket-barcode-wrap">
            ${generateBarcodeSvg(token)}
            <div class="barcode-code-text">*${token}*</div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="ticket-actions-row">
        <button class="btn-3d btn-3d-primary" style="padding: 12px; font-weight: 800; font-size: 0.92rem;" onclick="window.print()">
          ${i18n.t("btn_print_slip")}
        </button>
        <button class="btn-3d btn-3d-secondary" style="padding: 12px; font-weight: 700; font-size: 0.88rem;" onclick="window.app.resetSession()">
          ${i18n.t("btn_next_patient")}
        </button>
      </div>

      <div class="ticket-footer-sublinks" style="justify-content: center;">
        <button type="button" class="ticket-sublink-btn" onclick="window.app.openFhirModal()">
          ${i18n.t("btn_view_fhir")}
        </button>
      </div>
    </div>
  `;
}

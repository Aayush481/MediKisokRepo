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

  const vitals = patient.rppgVitals || { heartRate: "72", spO2: "98", respiratoryRate: "16", hrv: "48", stressScore: "Normal" };
  const docCount = (patient.documents || []).length;
  const medCount = (patient.allopathicMeds || []).length + (patient.documents || []).flatMap(d => d.medications || []).length;
  const flagCount = (patient.documents || []).flatMap(d => d.flags || []).length;

  const assignedDoc = patient.assignedDoctor;
  const deptName = assignedDoc ? assignedDoc.specialty : i18n.t("default_dept");
  const cabinName = assignedDoc ? assignedDoc.cabin : "Cabin 04";
  const doctorName = assignedDoc ? `${assignedDoc.name} (${assignedDoc.qualification || 'MD'})` : "Dr. Sharma (MD)";

  return `
    <div>
      <!-- Summary congratulations header -->
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--green-subtle); border: 1px solid var(--green-border); border-radius: 20px; padding: 4px 14px; margin-bottom: 8px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary);"></span>
          <span style="font-size: 0.74rem; font-family: var(--font-mono); font-weight: 700; color: var(--green-darkest); text-transform: uppercase;">
            Triage Encounter Complete • Token Assigned
          </span>
        </div>
        <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.01em;">
          ${i18n.t("summary_congrats")}
        </h2>
        <p style="font-size: 0.84rem; color: var(--text-muted); margin-top: 4px;">
          ${i18n.t("summary_subtitle")}
        </p>
      </div>

      <!-- Two-column dispatch layout -->
      <div class="summary-dispatch-grid">
        <!-- Left Column: Physical OPD Token Pass -->
        <div>
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
                    <span>${deptName}</span>
                  </div>
                </div>
                <div class="token-cabin-pill">
                  <div class="token-cabin-label">Attending Desk</div>
                  <div class="token-cabin-value">${cabinName}</div>
                  <div style="font-size: 0.72rem; color: var(--grey-600); margin-top: 2px;">${doctorName}</div>
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
                  <span>Now Serving at ${cabinName}</span>
                  <span style="color: var(--primary); font-weight: 700; font-family: var(--font-mono);">Your Position (${token})</span>
                </div>
              </div>

              <!-- Automated SMS notice -->
              <div class="ticket-sms-box">
                <div class="ticket-sms-icon">SMS</div>
                <div class="ticket-sms-content">
                  <div class="ticket-sms-title">Automated SMS Notification</div>
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
              🖨️ ${i18n.t("btn_print_slip")}
            </button>
            <button class="btn-3d btn-3d-secondary" style="padding: 12px; font-weight: 700; font-size: 0.88rem;" onclick="window.app.resetSession()">
              ➕ ${i18n.t("btn_next_patient")}
            </button>
          </div>
        </div>

        <!-- Right Column: Clinical Encounter Digest & FHIR Export -->
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Triage Clinical Summary Card -->
          <div class="card-3d" style="padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--grey-300);">
              <h3 style="font-size: 0.95rem; font-weight: 800; font-family: var(--font-mono); text-transform: uppercase; color: var(--text-primary); margin: 0;">
                Clinical Triage Summary
              </h3>
              <span class="pill-3d pill-3d-emerald">Verified Ingestion</span>
            </div>

            <!-- Vitals Summary Snapshot -->
            <div style="margin-bottom: 12px;">
              <span style="font-size: 0.68rem; font-family: var(--font-mono); font-weight: 700; color: var(--grey-600); text-transform: uppercase;">
                Optical Vitals Telemetry (rPPG)
              </span>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 6px;">
                <div style="background: var(--grey-50); border: 1px solid var(--grey-300); border-radius: 6px; padding: 6px; text-align: center;">
                  <span style="font-size: 0.62rem; color: var(--grey-500); font-family: var(--font-mono); display: block;">Heart Rate</span>
                  <strong style="font-size: 0.95rem; font-family: var(--font-mono); color: var(--text-primary);">${vitals.heartRate} <small style="font-size: 0.6rem; color: var(--green-dark);">bpm</small></strong>
                </div>
                <div style="background: var(--grey-50); border: 1px solid var(--grey-300); border-radius: 6px; padding: 6px; text-align: center;">
                  <span style="font-size: 0.62rem; color: var(--grey-500); font-family: var(--font-mono); display: block;">SpO2</span>
                  <strong style="font-size: 0.95rem; font-family: var(--font-mono); color: var(--text-primary);">${vitals.spO2} <small style="font-size: 0.6rem; color: var(--green-dark);">%</small></strong>
                </div>
                <div style="background: var(--grey-50); border: 1px solid var(--grey-300); border-radius: 6px; padding: 6px; text-align: center;">
                  <span style="font-size: 0.62rem; color: var(--grey-500); font-family: var(--font-mono); display: block;">Resp Rate</span>
                  <strong style="font-size: 0.95rem; font-family: var(--font-mono); color: var(--text-primary);">${vitals.respiratoryRate || '16'} <small style="font-size: 0.6rem; color: var(--green-dark);">rpm</small></strong>
                </div>
                <div style="background: var(--grey-50); border: 1px solid var(--grey-300); border-radius: 6px; padding: 6px; text-align: center;">
                  <span style="font-size: 0.62rem; color: var(--grey-500); font-family: var(--font-mono); display: block;">HRV</span>
                  <strong style="font-size: 0.95rem; font-family: var(--font-mono); color: var(--text-primary);">${vitals.hrv || '48'} <small style="font-size: 0.6rem; color: var(--green-dark);">ms</small></strong>
                </div>
              </div>
            </div>

            <!-- Documents & Diagnoses Snapshot -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              <div style="background: var(--grey-50); border: 1px solid var(--grey-300); border-radius: 6px; padding: 8px 10px;">
                <span style="font-size: 0.65rem; color: var(--grey-600); font-family: var(--font-mono); font-weight: 700; text-transform: uppercase; display: block;">Records Digested</span>
                <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">${docCount} Documents</span>
                <div style="font-size: 0.68rem; color: var(--green-dark); font-family: var(--font-mono); margin-top: 2px;">${medCount} Active Meds • ${flagCount} Lab Flags</div>
              </div>
              <div style="background: var(--grey-50); border: 1px solid var(--grey-300); border-radius: 6px; padding: 8px 10px;">
                <span style="font-size: 0.65rem; color: var(--grey-600); font-family: var(--font-mono); font-weight: 700; text-transform: uppercase; display: block;">Chief Complaint</span>
                <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">${patient.chiefComplaint || 'Routine Health Checkup & Lab Review'}</span>
              </div>
            </div>

            <!-- Next Steps Guidance -->
            <div style="background: var(--green-subtle); border: 1px solid var(--green-border); border-radius: 6px; padding: 10px 14px;">
              <strong style="font-size: 0.78rem; color: var(--green-darkest); font-family: var(--font-mono); text-transform: uppercase; display: flex; align-items: center; gap: 5px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                Patient Consultation Instructions
              </strong>
              <p style="font-size: 0.76rem; color: var(--text-secondary); margin: 4px 0 0 0; line-height: 1.4;">
                Please proceed to <strong>${assignedDoc?.wing || 'First Floor'}, ${cabinName} (${deptName})</strong>. The attending nurse will verify your token <strong>${token}</strong> when called on the corridor display.
              </p>
            </div>

            <!-- Home Remedy Self-Care Protocol Banner if Eligible -->
            ${patient.triageResult?.homeRemedyPlan ? `
              <div style="background: rgba(16, 185, 129, 0.08); border: 1.5px solid var(--primary-border); border-radius: 6px; padding: 10px 14px; margin-top: 10px;">
                <strong style="font-size: 0.76rem; color: var(--primary); font-family: var(--font-mono); text-transform: uppercase; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                  <span>🌿</span> Attached Evidence-Based Self-Care Protocol
                </strong>
                <p style="font-size: 0.74rem; font-weight: 700; color: var(--text-primary); margin: 0 0 3px 0;">
                  ${patient.triageResult.homeRemedyPlan.title} (${patient.triageResult.homeRemedyPlan.hi_title || ''})
                </p>
                <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 4px;">
                  ${(patient.triageResult.homeRemedyPlan.remedies || []).map(r => `
                    <div style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.35;">
                      <strong>${r.icon || '🍵'} ${r.name}:</strong> ${r.instruction}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- FHIR Digital Health Record Export Card -->
          <div class="card-3d" style="padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <strong style="font-size: 0.86rem; color: var(--text-primary); font-family: var(--font-mono); text-transform: uppercase;">
                  ABDM HL7 FHIR R4 Bundle
                </strong>
                <p style="font-size: 0.72rem; color: var(--text-muted); margin: 2px 0 0 0;">
                  Interoperable clinical package containing Observations, Encounter, & MedicationStatement.
                </p>
              </div>
              <button class="btn-3d btn-3d-secondary" style="padding: 6px 12px; font-size: 0.74rem;" onclick="window.app.openFhirModal()">
                ${i18n.t("btn_view_fhir")}
              </button>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 10px;">
              <button class="quick-chip" style="flex: 1;" onclick="window.app.sendSmsConfirmation()">
                📱 Send SMS Copy
              </button>
              <button class="quick-chip" style="flex: 1;" onclick="window.print()">
                📥 Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

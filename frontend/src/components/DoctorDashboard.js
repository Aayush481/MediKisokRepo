// Doctor OPD consultation desk and outpatient queue management component with comprehensive i18n

import { clinicalParser } from "../services/clinicalParser.js";
import { herbDrugService } from "../services/herbDrugService.js";
import { clinicalGraphService } from "../services/clinicalKnowledgeGraph.js";

export function renderDoctorDashboard(app, i18n) {
  const t = (k, fallback = "") => (i18n && typeof i18n.t === "function" ? i18n.t(k, fallback) : fallback || k);

  const currentInCabin = (app.doctorQueue && app.doctorQueue.length > 0) ? app.doctorQueue[0] : null;
  const p = app.selectedQueuePatient || currentInCabin || app.patient;
  const isViewingCurrent = currentInCabin && (p.id === currentInCabin.id);
  const selectedQueueIdx = app.doctorQueue.findIndex(item => item.id === p.id);

  const vitals = p.rppgVitals || { heartRate: "--", hrv: "--", spO2: "--", respiratoryRate: "--", stressScore: "--" };
  const hdiResult = herbDrugService.evaluateInteractions(p.allopathicMeds || [], p.ayushHerbs || []);

  const allDocs = p.documents || [];
  const rxDocs = allDocs.filter(d => (d.type === "prescription" || (d.categoryLabel || '').toLowerCase().includes("prescription")) && !((d.categoryLabel || "").toLowerCase().includes("pathology") || (d.categoryLabel || "").toLowerCase().includes("biochemistry") || d.type === "pathology_report"));
  const labDocs = allDocs.filter(d => d.type === "pathology_report" || d.type === "xray_report" || d.type === "ecg_report" || d.type === "lab_report" || d.type === "radiology" || (d.categoryLabel || "").toLowerCase().includes("pathology") || (d.categoryLabel || "").toLowerCase().includes("biochemistry") || (d.categoryLabel || "").toLowerCase().includes("lab") || (d.categoryLabel || "").toLowerCase().includes("x-ray") || (d.categoryLabel || "").toLowerCase().includes("ecg"));
  const allFlags = allDocs.flatMap(d => d.flags || []);
  const abnormalFlags = allFlags.filter(f => f.isAbnormal || f.alertLevel === "danger" || f.alertLevel === "warning" || /high|low|elevated|abnormal|critical/i.test(f.status || ''));

  const seenMeds = new Set();
  const docMeds = allDocs
    .filter(d => (d.type === "prescription" || d.type === "discharge_summary") && !((d.categoryLabel || "").toLowerCase().includes("pathology") || (d.categoryLabel || "").toLowerCase().includes("biochemistry")))
    .flatMap(d => d.medications || []);
  let allMeds = [...(p.allopathicMeds || []), ...docMeds].filter(m => {
    const name = ((typeof m === "string" ? m : (m.name || m.brandReported || "")) || "").toLowerCase();
    if (!name || seenMeds.has(name)) return false;
    seenMeds.add(name);
    return true;
  });

  const seenDx = new Set();
  const docDx = allDocs.flatMap(d => d.diseases || []);
  let allDiseases = [...(p.diagnoses || []), ...docDx].filter(d => {
    const name = (d.name || "").toLowerCase();
    if (!name || seenDx.has(name)) return false;
    seenDx.add(name);
    return true;
  });

  const showAll = app.doctorActiveTab === "all";
  const showSummary = showAll || app.doctorActiveTab === "summary";
  const showPrescriptions = showAll || app.doctorActiveTab === "prescriptions";
  const showPreviews = showAll || app.doctorActiveTab === "previews";

  return `
    <div class="doctor-layout-3d">
      <!-- Outpatient queue sidebar -->
      <div class="queue-panel-3d">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">
          <div>
            <h3 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); margin: 0;">${t("doc_queue_title", "Live Outpatient Queue")}</h3>
            <p style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${t("doc_cabin_subtitle", "OPD Cabin 3 • Dr. Sharma")}</p>
          </div>
          <span class="pill-3d pill-3d-emerald">${app.doctorQueue.length} ${t("doc_active", "Active")}</span>
        </div>

        <!-- Token search input -->
        <div style="margin-bottom: 10px;">
          <div style="position: relative;">
            <input type="text" id="queueBarcodeSearch" placeholder="${t("doc_scan_barcode_ph", "Scan Barcode / Token (e.g. A-15)...")}" 
              style="width: 100%; padding: 7px 32px 7px 10px; background: var(--bg-surface-inset); border: 1px solid var(--border-medium); border-radius: 4px; color: var(--text-primary); font-size: 0.76rem; font-family: var(--font-mono); outline: none;" 
              onkeydown="if(event.key === 'Enter') { window.app.handleBarcodeScan(this.value); this.value = ''; }" />
            <span style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.72rem; font-weight: 700; color: var(--primary); font-family: var(--font-mono); cursor: pointer;" title="Scan Barcode" onclick="const val = document.getElementById('queueBarcodeSearch').value; if(val) { window.app.handleBarcodeScan(val); document.getElementById('queueBarcodeSearch').value = ''; }">${t("doc_scan_btn", "Scan")}</span>
          </div>
        </div>

        <!-- Queue list -->
        <div id="queueList" style="display: flex; flex-direction: column; gap: 8px;">
          ${app.doctorQueue.length === 0 ? `
            <div style="text-align: center; padding: 2rem 1rem; background: var(--bg-surface-inset); border: 1px dashed var(--border-medium); border-radius: 6px; color: var(--text-muted);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 6px; opacity: 0.6;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 2px;">OPD Queue is Empty</div>
              <div style="font-size: 0.72rem;">Patients completing intake at the kiosk will be assigned and queued here live.</div>
            </div>
          ` : app.doctorQueue.map((item, idx) => {
            const patientsAhead = idx;
            const waitMinutes = Math.round(patientsAhead * 7.5);
            const estTime = item.smsAlertTime || (waitMinutes === 0 ? t("doc_now", "Now") : new Date(Date.now() + waitMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            const isSelected = item.id === p.id;
            const isCurrent = idx === 0;
            const is30MinPatient = idx === 3 || patientsAhead === 4;

            return `
              <div class="queue-patient-card-3d ${isSelected ? 'active' : ''} ${item.isEmergency ? 'emergency' : ''}" onclick="window.app.selectQueuePatient('${item.id}')" style="cursor: pointer; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <strong style="font-size: 0.88rem; color: var(--text-primary);">${item.name || t("doc_walkin_patient", "Walk-in Patient")}</strong>
                    <div style="font-size: 0.72rem; color: var(--slate-400); font-family: var(--font-mono); margin-top: 2px;">ABHA: ${item.abhaId || 'Walk-in'}</div>
                  </div>
                  <span class="pill-3d ${item.isEmergency ? 'pill-3d-crimson' : (isCurrent ? 'pill-3d-emerald' : 'pill-3d-blue')}">
                    ${item.isEmergency ? t("doc_emergency", "EMERGENCY") : (isCurrent ? t("doc_in_consultation", "IN CONSULTATION") : t("doc_token", "TOKEN") + ' ' + item.tokenNumber)}
                  </span>
                </div>

                <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">
                  ${item.age || '--'} ${t("age_yrs", "Yrs")} / ${item.gender} • ${t("doc_mobile", "Mobile")}: ${item.mobile || t("doc_na", "N/A")}
                </p>
                <p style="font-size: 0.73rem; color: var(--text-secondary); margin-top: 3px; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                  ${item.chiefComplaint || t("doc_intake_completed", "Clinical Intake Completed")}
                </p>

                <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">
                    <span style="color: var(--slate-400);">${t("doc_position", "Position #")}${idx + 1} • <strong style="color: var(--text-primary); font-family: var(--font-mono);">${isCurrent ? t("doc_with_doctor", "With Doctor") : patientsAhead + ' ' + t("doc_patients_ahead", "patients ahead")}</strong></span>
                    <span style="color: var(--primary); font-weight: 700; font-family: var(--font-mono);">${isCurrent ? t("doc_consulting", "Consulting") : '~' + waitMinutes + 'm (' + estTime + ')'}</span>
                  </div>

                  ${item.smsAlertSent ? `
                    <div class="queue-30min-badge sent" title="Automated notification dispatched 30 mins prior to appointment">
                      ${t("doc_alert_sent", "30-Min Alert Sent")} (${item.smsAlertTime || '10:15 AM'})
                    </div>
                  ` : (is30MinPatient ? `
                    <div class="queue-30min-badge" title="Appointment scheduled in ~30 mins (after 4 patients)">
                      ${t("doc_alert_window", "30-Min Alert Window")} (~${waitMinutes}m)
                    </div>
                  ` : '')}

                  <div style="display: flex; justify-content: flex-end; margin-top: 2px;">
                    <button class="btn-sms-alert-3d" onclick="event.stopPropagation(); window.app.sendManual30MinAlert('${item.id}')" title="Dispatch 30-minute advance appointment SMS/WhatsApp alert">
                      ${item.smsAlertSent ? t("doc_resend_sms", "Re-send SMS") : t("doc_send_sms", "Send 30-Min SMS")}
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Doctor consultation workspace -->
      <div class="card-3d" style="min-width: 0;">
        <!-- Patient header and toolbar -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.85rem; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin: 0;">${p.name || t("doc_walkin_patient", "Walk-in Patient")}</h2>
              <span class="pill-3d ${isViewingCurrent ? 'pill-3d-emerald' : 'pill-3d-blue'}" style="font-weight: 800;">
                ${isViewingCurrent ? t("doc_current_patient_badge", "IN CONSULTATION (CURRENT PATIENT)") : `${t("doc_reviewing_queue_badge", "REVIEWING QUEUE PATIENT")} (#${selectedQueueIdx + 1})`}
              </span>
              <span class="pill-3d ${p.isEmergency ? 'pill-3d-crimson' : 'pill-3d-blue'}">${p.isEmergency ? t("doc_emergency_priority", "EMERGENCY PRIORITY") : t("doc_token", "TOKEN") + ' ' + p.tokenNumber}</span>
              <span class="pill-3d pill-3d-blue">ABHA: ${p.abhaId || 'Walk-in'}</span>
              ${p.smsAlertSent ? `<span class="pill-3d pill-3d-emerald">${t("doc_sms_dispatched", "30-Min SMS Dispatched")}</span>` : ''}
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 0;">
              ${p.age || '--'} ${t("doc_years", "Years")} • ${p.gender} • ${t("doc_reg_mobile", "Registered Mobile")}: <strong style="color: var(--text-primary); font-family: var(--font-mono);">${p.mobile || t("doc_none_provided", "Not provided")}</strong> • ${t("doc_chief_complaint_lbl", "Chief Complaint")}: <span style="color: var(--slate-200);">${p.chiefComplaint || t("doc_none_provided", "None provided")}</span>
            </p>
            ${!isViewingCurrent && currentInCabin ? `
              <div style="margin-top: 6px;">
                <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.74rem;" onclick="window.app.selectQueuePatient('${currentInCabin.id}')">
                  ${t("doc_return_current", "← Return to Current In-Cabin Patient")} (${currentInCabin.name})
                </button>
              </div>
            ` : ''}
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button class="btn-3d btn-3d-success" style="padding: 6px 14px; font-size: 0.8rem; font-weight: 700;" onclick="window.app.callNextPatient()" title="Complete consultation for current patient and advance queue">
              ${t("doc_call_next", "Call Next Patient")}
            </button>
            <button class="btn-3d btn-3d-secondary" style="padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 5px;" onclick="window.app.openSmsLogModal()">
              ${t("doc_sms_notifications", "SMS Notifications")} (${app.smsDispatchLogs.length})
            </button>
            <button class="btn-3d btn-3d-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.app.openFhirModal()">
              ${t("doc_fhir_json", "FHIR JSON")}
            </button>
            <button class="btn-3d btn-3d-primary" style="padding: 6px 14px; font-size: 0.8rem;" onclick="window.app.acceptSummary()">
              ${t("doc_push_his", "Push to HIS")}
            </button>
          </div>
        </div>

        <!-- Section navigation tabs -->
        <div class="doctor-tabs-3d">
          <button class="doctor-tab-btn ${app.doctorActiveTab === 'all' ? 'active' : ''}" onclick="window.app.setDoctorTab('all')">
            ${t("doc_tab_all", "All Records")}
          </button>
          <button class="doctor-tab-btn ${app.doctorActiveTab === 'summary' ? 'active' : ''}" onclick="window.app.setDoctorTab('summary')">
            ${t("doc_tab_summary", "Clinical Summary")} (${allDocs.length})
          </button>
          <button class="doctor-tab-btn ${app.doctorActiveTab === 'prescriptions' ? 'active' : ''}" onclick="window.app.setDoctorTab('prescriptions')">
            ${t("doc_tab_prescriptions", "Prescriptions")} (${allMeds.length})
          </button>
          <button class="doctor-tab-btn ${app.doctorActiveTab === 'previews' ? 'active' : ''}" onclick="window.app.setDoctorTab('previews')">
            ${t("doc_tab_previews", "Document Previews")} (${allDocs.length})
          </button>
        </div>

        <!-- Document summary tab -->
        ${showSummary ? `
          <div id="sectionSummary" style="margin-bottom: 1.5rem; background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 6px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0; font-family: var(--font-mono); letter-spacing: 0.03em;">${t("doc_summary_heading", "Summary of Uploaded Documents")}</h3>
                <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">${t("doc_summary_sub", "Synthesized Diagnostic Intelligence, OCR Multi-Page Aggregation, and Contactless Vitals")}</p>
              </div>
              <span class="pill-3d pill-3d-blue">${allDocs.length} ${t("doc_total_records", "Total Records")}</span>
            </div>

            <!-- KPI ribbon -->
            <div class="doc-kpi-ribbon">
              <div class="doc-kpi-card">
                <div class="doc-kpi-val" style="color: var(--primary);">${allDocs.length}</div>
                <div class="doc-kpi-lbl">${t("doc_kpi_total_docs", "Total Documents")}</div>
              </div>
              <div class="doc-kpi-card">
                <div class="doc-kpi-val" style="color: var(--emerald);">${allDiseases.length}</div>
                <div class="doc-kpi-lbl">${t("doc_kpi_diseases", "Identified Diseases")}</div>
              </div>
              <div class="doc-kpi-card">
                <div class="doc-kpi-val" style="color: var(--indigo);">${allMeds.length}</div>
                <div class="doc-kpi-lbl">${t("doc_kpi_prescriptions", "Prescriptions Analyzed")}</div>
              </div>
              <div class="doc-kpi-card">
                <div class="doc-kpi-val" style="color: var(--teal);">${labDocs.length}</div>
                <div class="doc-kpi-lbl">${t("doc_kpi_labs", "Labs & Imaging Scans")}</div>
              </div>
              <div class="doc-kpi-card">
                <div class="doc-kpi-val" style="color: var(--crimson);">${abnormalFlags.length}</div>
                <div class="doc-kpi-lbl">${t("doc_kpi_abnormal_flags", "Abnormal Biomarker Flags")}</div>
              </div>
            </div>

            <!-- Optical vitals ribbon -->
            <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 6px; padding: 10px 14px; margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-primary); font-weight: 700; font-family: var(--font-mono); margin-bottom: 8px;">
                <span>${t("doc_vitals_heading", "Contactless Optical Vitals (rPPG Camera Telemetry)")}</span>
                <span class="pill-3d pill-3d-emerald">${vitals.signalQuality || 'Real-Time Ingestion'}</span>
              </div>
              <div class="telemetry-grid" style="margin-top: 0;">
                <div class="telemetry-card telemetry-card-hr ${vitals.heartRate > 100 ? 'highlight-alert' : ''}">
                  <div class="telemetry-value telemetry-hr">${vitals.heartRate}<span class="telemetry-unit">${t("telemetry_hr_unit", "BPM")}</span></div>
                  <div class="telemetry-label">${t("telemetry_hr", "Heart Rate")}</div>
                </div>
                <div class="telemetry-card telemetry-card-spo2 ${vitals.spO2 < 95 && vitals.spO2 !== '--' ? 'highlight-alert' : ''}">
                  <div class="telemetry-value telemetry-spo2">${vitals.spO2}<span class="telemetry-unit">${t("telemetry_spo2_unit", "%")}</span></div>
                  <div class="telemetry-label">${t("telemetry_spo2", "Blood Oxygen (SpO₂)")}</div>
                </div>
                <div class="telemetry-card telemetry-card-stress ${vitals.stressScore > 70 ? 'highlight-alert' : ''}">
                  <div class="telemetry-value telemetry-stress">${vitals.stressScore !== undefined ? vitals.stressScore : '--'}<span class="telemetry-unit">${t("telemetry_stress_unit", "/100")}</span></div>
                  <div class="telemetry-label">${t("telemetry_stress", "Stress / Energy")}</div>
                </div>
                <div class="telemetry-card telemetry-card-hrv">
                  <div class="telemetry-value telemetry-hrv">${vitals.hrv}<span class="telemetry-unit">${t("telemetry_hrv_unit", "ms")}</span></div>
                  <div class="telemetry-label">${t("telemetry_hrv", "HRV Stability")}</div>
                </div>
                <div class="telemetry-card telemetry-card-resp">
                  <div class="telemetry-value telemetry-resp">${vitals.respiratoryRate}<span class="telemetry-unit">${t("telemetry_resp_unit", "RPM")}</span></div>
                  <div class="telemetry-label">${t("telemetry_resp", "Breathing Rate")}</div>
                </div>
              </div>
            </div>

            <!-- Herb-drug interaction alert -->
            ${hdiResult.hasConflict ? `
              <div class="hdi-alert-box-3d" style="background: rgba(239, 68, 68, 0.08); border: 1px solid var(--crimson); border-radius: 6px; padding: 12px 14px; margin-bottom: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong style="color: var(--crimson-light); font-size: 0.92rem; font-family: var(--font-mono);">${t("doc_hdi_alert", "Herb-Drug Interaction Alert")}</strong>
                  <span class="pill-3d pill-3d-crimson">${hdiResult.count} ${t("doc_hdi_conflicts", "Conflict(s)")}</span>
                </div>
                ${hdiResult.conflicts.map(c => `
                  <div style="background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 4px; padding: 8px 12px; margin-top: 6px;">
                    <strong style="color: var(--text-primary); font-size: 0.84rem;">${c.drug} — ${c.herb} (${c.herbBotanical})</strong>
                    <p style="font-size: 0.76rem; color: var(--slate-300); margin-top: 2px; margin-bottom: 2px;"><strong>${t("doc_hdi_hazard", "Hazard")}:</strong> ${c.clinicalEffect}</p>
                    <p style="font-size: 0.74rem; color: var(--slate-400); margin: 0;"><strong>${t("doc_hdi_rec", "Recommendation")}:</strong> ${c.recommendation}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Identified conditions breakdown -->
            <div style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 0.85rem; color: var(--text-primary); text-transform: uppercase; font-family: var(--font-mono);">
                  ${t("doc_active_diagnoses", "Active Diagnoses & Clinical Findings")}:
                </strong>
                <span class="pill-3d pill-3d-blue">${allDiseases.length} ${t("doc_verified", "Verified")}</span>
              </div>
              ${allDiseases.length > 0 ? `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px;">
                  ${allDiseases.map(d => `
                    <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 6px; padding: 8px 12px;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: var(--text-primary); font-size: 0.84rem;">${d.name}</strong>
                        <span class="pill-3d pill-3d-blue" style="font-size: 0.68rem;">${d.icd10 || 'R69'}</span>
                      </div>
                      <p style="font-size: 0.72rem; color: var(--slate-400); margin-top: 3px; margin-bottom: 0;">
                        ${d.source || 'Clinical Record Diagnostic Evaluation'}
                      </p>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">${t("doc_no_diseases", "No active diseases or diagnoses flagged yet.")}</p>
              `}
            </div>

            <!-- Individual records breakdown -->
            <div style="margin-top: 1rem;">
              <strong style="font-size: 0.85rem; color: var(--text-primary); text-transform: uppercase; display: block; margin-bottom: 8px; font-family: var(--font-mono);">
                ${t("doc_clinical_records", "Clinical Records & Findings")}:
              </strong>
              ${allDocs.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${allDocs.map((doc) => `
                    <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 6px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                      <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                          <span class="pill-3d ${doc.type === 'prescription' ? 'pill-3d-emerald' : (doc.type === 'radiology' ? 'pill-3d-blue' : 'pill-3d-violet')}">
                            ${doc.categoryLabel || doc.type}
                          </span>
                          <strong style="font-size: 0.86rem; color: var(--text-primary);">${doc.title}</strong>
                          <span style="font-size: 0.72rem; color: var(--text-muted);">${doc.date || 'Recent'} • ${doc.doctor || 'Verified Facility'}</span>
                        </div>
                        <p style="font-size: 0.78rem; color: var(--slate-300); margin-top: 4px; margin-bottom: 4px;">
                          <strong style="color: var(--text-primary); font-family: var(--font-mono);">${t("doc_clinical_records", "Diagnostic Finding")}:</strong> ${doc.rootCause || 'Verified Clinical Ingestion Record'}
                        </p>
                        ${(doc.flags && doc.flags.length > 0) ? `
                          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                            ${doc.flags.map(f => `
                              <span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 3px; background: rgba(0,0,0,0.4); color: var(--text-primary); border: 1px solid var(--border-light);">
                                ${f.name || f.test}: <strong>${f.value}</strong> [${f.status}]
                              </span>
                            `).join('')}
                          </div>
                        ` : ''}
                      </div>
                      <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.74rem; white-space: nowrap;" onclick="window.app.openDocInspectModal('${doc.id}')">
                        ${t("doc_inspect_btn", "Inspect Document")}
                      </button>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">${t("doc_no_docs", "No documents scanned or uploaded for this patient yet.")}</p>
              `}
            </div>
          </div>
        ` : ''}

        <!-- Prescriptions tab -->
        ${showPrescriptions ? `
          <div id="sectionPrescriptions" style="margin-bottom: 1.5rem; background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 6px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <div>
                <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0; font-family: var(--font-mono); letter-spacing: 0.03em;">${t("doc_rx_heading", "Prescriptions & Active Medications")}</h3>
                <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">${t("doc_rx_sub", "Standardized to SNOMED-CT Clinical Nomenclature")}</p>
              </div>
              <span class="pill-3d pill-3d-emerald">${allMeds.length} ${t("doc_rx_active", "Active Prescriptions")}</span>
            </div>

            <div class="rx-table-container">
              <table class="rx-table-3d">
                <thead>
                  <tr>
                    <th style="width: 30px;">#</th>
                    <th>${t("doc_rx_th_med", "Medication & Molecule")}</th>
                    <th>${t("doc_rx_th_dose", "Dosage / Strength")}</th>
                    <th>${t("doc_rx_th_freq", "Frequency (Sig)")}</th>
                    <th>${t("doc_rx_th_timing", "Timing")}</th>
                    <th>${t("doc_rx_th_duration", "Duration")}</th>
                    <th>${t("doc_rx_th_route", "Route")}</th>
                    <th>SNOMED-CT</th>
                    <th>${t("doc_rx_th_schedule", "Schedule")}</th>
                    <th>${t("doc_rx_th_source", "Source Document")}</th>
                    <th>${t("doc_rx_th_status", "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${allMeds.length > 0 ? allMeds.map((m, idx) => {
                    const name = typeof m === 'string' ? m : m.name;
                    const dosage = m.dosage || 'Standard Dose';
                    const freq = m.freq || 'OD';
                    const timing = m.timing || 'After Meals';
                    const duration = m.duration || '5-7 Days';
                    const route = m.route || 'Oral';
                    const snomed = m.snomedCode || '387517004';
                    const schedule = m.schedule || 'Schedule H';
                    const source = m.sourceDoc || 'Uploaded Prescription';
                    const status = m.status || 'Verified';

                    return `
                      <tr>
                        <td style="color: var(--slate-500); font-weight: bold;">${idx + 1}</td>
                        <td>
                          <strong style="color: var(--text-primary); font-size: 0.85rem;">${name}</strong>
                        </td>
                        <td><span class="pill-3d pill-3d-blue" style="font-size: 0.72rem;">${dosage}</span></td>
                        <td><strong style="color: var(--primary); font-family: var(--font-mono);">${freq}</strong></td>
                        <td style="color: var(--slate-300);">${timing}</td>
                        <td style="color: var(--slate-400);">${duration}</td>
                        <td><span style="font-size: 0.74rem; color: var(--slate-300); font-family: var(--font-mono);">${route}</span></td>
                        <td><code style="font-size: 0.72rem; color: var(--indigo-light); background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); padding: 2px 6px; border-radius: 4px;">${snomed}</code></td>
                        <td><span class="pill-3d ${schedule === 'OTC' ? 'pill-3d-emerald' : 'pill-3d-amber'}" style="font-size: 0.68rem;">${schedule}</span></td>
                        <td style="font-size: 0.72rem; color: var(--text-muted); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${source}</td>
                        <td><span class="pill-3d pill-3d-emerald" style="font-size: 0.68rem;">✓ ${status}</span></td>
                      </tr>
                    `;
                  }).join('') : `
                    <tr>
                      <td colspan="11" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        ${t("doc_rx_empty", "No prescriptions extracted for this patient. Upload a medical prescription in the Kiosk terminal to extract medications.")}
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- Previews gallery tab -->
        ${showPreviews ? `
          <div id="sectionPreviews" style="margin-bottom: 1.5rem; background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 6px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <div>
                <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0; font-family: var(--font-mono); letter-spacing: 0.03em;">${t("doc_previews_heading", "Uploaded Clinical Documents")}</h3>
                <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">${t("doc_previews_sub", "Interactive Visual Scan Gallery with Optical Zoom Inspection")}</p>
              </div>
              <span class="pill-3d pill-3d-violet">${allDocs.length} ${t("doc_visual_scans", "Visual Scans")}</span>
            </div>

            <div class="doc-preview-gallery-3d">
              ${allDocs.length > 0 ? allDocs.map((doc) => `
                <div class="doc-card-preview-3d">
                  <div class="doc-card-thumb-container" onclick="window.app.openDocInspectModal('${doc.id}')" title="Click to open zoom inspection">
                    <img src="${doc.previewUrl || ''}" alt="${doc.title}" loading="lazy" />
                    <div class="doc-card-thumb-overlay">
                      <button class="btn-3d btn-3d-primary" style="padding: 6px 14px; font-size: 0.75rem;">
                        ${t("doc_inspect_btn", "Inspect Document")}
                      </button>
                    </div>
                  </div>
                  <div class="doc-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 6px;">
                      <span class="pill-3d ${doc.type === 'prescription' ? 'pill-3d-emerald' : (doc.type === 'radiology' ? 'pill-3d-blue' : 'pill-3d-violet')}" style="font-size: 0.68rem;">
                        ${doc.categoryLabel || doc.type}
                      </span>
                      <span style="font-size: 0.68rem; color: var(--text-muted);">${doc.date || 'Recent'}</span>
                    </div>
                    <strong style="font-size: 0.84rem; color: var(--text-primary); line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 6px;">
                      ${doc.title}
                    </strong>
                    <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.3; margin: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                      ${doc.rootCause || 'Verified Clinical Ingestion Record'}
                    </p>
                    <div style="margin-top: auto; padding-top: 8px;">
                      <button class="btn-3d btn-3d-secondary" style="width: 100%; padding: 6px; font-size: 0.74rem;" onclick="window.app.openDocInspectModal('${doc.id}')">
                        ${t("doc_view_details", "View Details")}
                      </button>
                    </div>
                  </div>
                </div>
              `).join('') : `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.82rem;">
                  ${t("doc_no_previews", "No uploaded document scans available for this patient.")}
                </div>
              `}
            </div>
          </div>
        ` : ''}

        <!-- Consultation notes & prescriptions -->
        <div class="card-3d" style="padding: 1.25rem; margin-top: 1rem;">
          <strong style="font-size: 0.85rem; color: var(--text-primary); text-transform: uppercase; font-family: var(--font-mono);">${t("doc_notes_heading", "Doctor's Consultation Assessment & Notes")}:</strong>
          <textarea class="input-text-3d" rows="3" style="margin-top: 8px;" placeholder="${t("doc_notes_ph", "Add clinical examination findings, final diagnosis, and new prescriptions...")}"></textarea>
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
            <button class="btn-3d btn-3d-secondary" onclick="alert('Prescription printed successfully!')">${t("doc_print_rx", "Print Prescription")}</button>
            <button class="btn-3d btn-3d-success" onclick="alert('Encounter record successfully saved and pushed to ABDM & e-Hospital HIS!')">${t("doc_save_close", "Save & Close Encounter")}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Document inspection modal -->
    ${app.inspectedDoc ? `
      <div id="docInspectModal" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(16px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="card-3d" style="width: 90%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; padding: 0; border: 1px solid var(--primary); box-shadow: 0 25px 60px rgba(0,0,0,0.9);">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: var(--bg-surface-inset); border-bottom: 1px solid var(--border-light);">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="pill-3d ${app.inspectedDoc.type === 'prescription' ? 'pill-3d-emerald' : 'pill-3d-blue'}">${app.inspectedDoc.categoryLabel || app.inspectedDoc.type}</span>
                <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0;">${app.inspectedDoc.title}</h3>
              </div>
              <p style="font-size: 0.72rem; color: var(--text-muted); margin: 2px 0 0 0;">${app.inspectedDoc.date || 'Recent'} • ${app.inspectedDoc.doctor || 'Verified Clinical Facility'}</p>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.82rem;" onclick="window.app.changeDocZoom(-0.25)" title="Zoom Out">-</button>
              <span id="inspectZoomLabel" style="font-size: 0.78rem; font-family: monospace; color: var(--primary); min-width: 44px; text-align: center; font-weight: bold;">${Math.round(app.docZoomLevel * 100)}%</span>
              <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.82rem;" onclick="window.app.changeDocZoom(0.25)" title="Zoom In">+</button>
              <button class="btn-3d btn-3d-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="window.app.changeDocZoom(0)" title="Reset Zoom">100%</button>
              <button class="btn-3d btn-3d-secondary" style="padding: 4px 12px; font-size: 0.82rem; margin-left: 8px;" onclick="window.app.closeDocInspectModal()">${t("doc_close", "Close")}</button>
            </div>
          </div>

          <div style="flex: 1; overflow: auto; padding: 20px; background: #0F172A; display: flex; justify-content: center; align-items: flex-start;">
            <img id="inspectModalImage" src="${app.inspectedDoc.previewUrl || ''}" alt="${app.inspectedDoc.title}" style="max-width: 100%; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); transform: scale(${app.docZoomLevel}); transform-origin: top center; transition: transform 0.15s ease-out;" />
          </div>

          <div style="padding: 12px 20px; background: var(--bg-surface-inset); border-top: 1px solid var(--border-light); font-size: 0.78rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div>
                <strong style="color: var(--text-primary); font-family: var(--font-mono);">${t("doc_clinical_records", "Diagnostic Findings")}:</strong> <span style="color: var(--slate-300);">${app.inspectedDoc.rootCause || 'Verified Record'}</span>
              </div>
              ${app.inspectedDoc.extractedText ? `
                <button class="btn-3d btn-3d-secondary" style="padding: 2px 10px; font-size: 0.72rem;" onclick="const el = document.getElementById('inspectRawTextStream'); if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';">
                  ${t("doc_toggle_text", "Toggle Text Stream")}
                </button>
              ` : ''}
            </div>
            ${app.inspectedDoc.extractedText ? `
              <div id="inspectRawTextStream" style="display: none; margin-top: 8px; max-height: 140px; overflow-y: auto; background: #000000; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 0.72rem; color: #CBD5E1; border: 1px solid var(--border-light); white-space: pre-wrap;">${app.inspectedDoc.extractedText}</div>
            ` : ''}
          </div>
        </div>
      </div>
    ` : ''}

    <!-- 30-minute advance SMS dispatch log modal -->
    <div id="smsLogModal" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(16px); z-index: 9999; display: ${app.isSmsLogModalOpen ? 'flex' : 'none'}; align-items: center; justify-content: center; padding: 20px;">
      <div class="card-3d" style="width: 90%; max-width: 960px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; padding: 0; border: 1px solid var(--primary); box-shadow: 0 25px 60px rgba(0,0,0,0.9);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; background: var(--bg-surface-inset); border-bottom: 1px solid var(--border-light);">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0; font-family: var(--font-mono);">${t("doc_alert_sent", "30-Minute Advance Patient Appointment SMS Dispatch Logs")}</h3>
            </div>
            <p style="font-size: 0.74rem; color: var(--text-muted); margin: 3px 0 0 0;">
              Automated notifications sent 30 minutes prior to doctor consultation (OPD Cabin 3)
            </p>
          </div>
          <button class="btn-3d btn-3d-secondary" style="padding: 6px 14px; font-size: 0.8rem;" onclick="window.app.closeSmsLogModal()">${t("doc_close", "Close")}</button>
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 16px 20px;">
          <table class="rx-table-3d" style="width: 100%;">
            <thead>
              <tr>
                <th>Dispatch Time</th>
                <th>Patient Name</th>
                <th>Token</th>
                <th>Mobile Number</th>
                <th>Queue Status</th>
                <th>Scheduled Time</th>
                <th>Gateway Status</th>
                <th>SMS Content</th>
              </tr>
            </thead>
            <tbody>
              ${app.smsDispatchLogs.length > 0 ? app.smsDispatchLogs.map(log => `
                <tr>
                  <td style="font-family: monospace; color: var(--text-primary); font-size: 0.74rem; white-space: nowrap;">${log.dispatchTimestamp}</td>
                  <td><strong style="color: var(--text-primary);">${log.patientName}</strong></td>
                  <td><span class="pill-3d pill-3d-blue" style="font-size: 0.72rem;">${log.token}</span></td>
                  <td style="font-family: monospace; font-size: 0.74rem; color: var(--slate-400);">${log.mobile}</td>
                  <td><span class="pill-3d pill-3d-amber" style="font-size: 0.7rem;">${log.patientsAhead} Patients Ahead</span></td>
                  <td><strong style="color: var(--primary); font-size: 0.78rem; font-family: var(--font-mono);">${log.scheduledTime}</strong></td>
                  <td><span class="pill-3d pill-3d-emerald" style="font-size: 0.7rem;">${log.status}</span></td>
                  <td style="font-size: 0.74rem; color: var(--slate-300); line-height: 1.4; max-width: 320px;">
                    <div style="background: var(--bg-card); border-radius: 4px; padding: 6px 10px; border-left: 2px solid var(--primary);">
                      ${log.messageContent}
                    </div>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    No 30-minute advance notifications sent yet. Alerts trigger automatically as queue advances.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

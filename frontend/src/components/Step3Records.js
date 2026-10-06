// Medical records upload, OCR processing, and extracted clinical findings component

export function renderStep3Records(app, i18n) {
  const patient = app.patient;
  const latestDoc = (patient.documents && patient.documents.length > 0) ? patient.documents[0] : null;
  const allFlags = (patient.documents || []).flatMap(d => d.flags || []);

  // Aggregate medications across patient and all documents (prescriptions & discharge summaries only)
  const seenMeds = new Set();
  const docMeds = (patient.documents || [])
    .filter(d => (d.type === "prescription" || d.type === "discharge_summary") && !((d.categoryLabel || "").toLowerCase().includes("pathology") || (d.categoryLabel || "").toLowerCase().includes("biochemistry")))
    .flatMap(d => d.medications || []);
  const allExtractedMeds = [...(patient.allopathicMeds || []), ...docMeds].filter(m => {
    const name = ((typeof m === "string" ? m : (m.name || m.brandReported || "")) || "").toLowerCase();
    if (!name || seenMeds.has(name)) return false;
    seenMeds.add(name);
    return true;
  });

  // Aggregate diseases & diagnoses across patient and all documents
  const seenDx = new Set();
  const docDiseases = (patient.documents || []).flatMap(d => d.diseases || []);
  const allDiseases = [...(patient.diagnoses || []), ...docDiseases].filter(d => {
    const name = (d.name || "").toLowerCase();
    if (!name || seenDx.has(name)) return false;
    seenDx.add(name);
    return true;
  });

  return `
    <div class="card-3d">
      <div class="card-header-3d">
        <div>
          <h2 class="card-title-3d">${i18n.t("doc_title")}</h2>
          <p class="card-subtitle-3d">${i18n.t("doc_subtitle")}</p>
        </div>
        <button class="btn-3d btn-3d-secondary" style="padding: 6px 14px; font-size: 0.78rem;" onclick="window.app.speakDocScanPrompt()">${i18n.t("audio_guide_btn")}</button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <!-- Left: File upload dropzone and document preview -->
        <div>
          <div class="scanner-dropzone-3d" id="uploadDropzone" onclick="window.app.triggerFileInput()">
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary); font-family: var(--font-mono); margin-bottom: 6px;">Upload Document</div>
            <strong style="color: var(--text-primary); font-size: 0.95rem;">${i18n.t("upload_dropzone_title")}</strong>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
              ${i18n.t("upload_dropzone_desc")}
            </p>
            <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: center;">
              <button type="button" class="btn-3d btn-3d-secondary" style="padding: 5px 12px; font-size: 0.74rem;">${i18n.t("upload_btn_photo")}</button>
              <button type="button" class="btn-3d btn-3d-primary" style="padding: 5px 12px; font-size: 0.74rem;">${i18n.t("upload_btn_file")}</button>
            </div>
            <input type="file" id="realDocUpload" accept="image/*,.pdf" capture="environment" style="display: none;" onchange="window.app.handleFileUpload(event)">
          </div>

          <!-- Quick test sample documents -->
          <div class="sample-doc-bar">
            <span class="demo-profile-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Try Sample Records:
            </span>
            <button type="button" class="sample-doc-btn" onclick="window.app.loadSampleDoc('rx')">
              📄 Prescription Rx
            </button>
            <button type="button" class="sample-doc-btn" onclick="window.app.loadSampleDoc('lab')">
              🔬 Pathology Lab
            </button>
            <button type="button" class="sample-doc-btn" onclick="window.app.loadSampleDoc('xray')">
              🦴 Knee X-Ray
            </button>
          </div>

          ${patient.documents.length > 0 ? `
            <div style="margin-top: 12px; border-radius: 6px; overflow: hidden; background: #0F172A; max-height: 220px; border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center;">
              <img src="${patient.documents[0].previewUrl}" alt="Scanned Document" style="max-height: 220px; width: 100%; object-fit: contain;">
            </div>
          ` : ''}

          ${(!patient.documents || patient.documents.length === 0) && app.lastUploadedDocStatus && !app.lastUploadedDocStatus.verified && app.lastUploadedDocStatus.previewUrl ? `
            <div style="margin-top: 12px; border-radius: 6px; overflow: hidden; background: #0F172A; max-height: 180px; border: 1px solid var(--crimson); display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
              <img src="${app.lastUploadedDocStatus.previewUrl}" alt="Rejected Document Preview" style="max-height: 180px; width: 100%; object-fit: contain; opacity: 0.5;">
              <div style="position: absolute; bottom: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid var(--crimson); color: var(--crimson-light); font-size: 0.72rem; font-weight: 700; padding: 2px 10px; border-radius: 4px; font-family: var(--font-mono); letter-spacing: 0.5px;">
                REJECTED: NON-MEDICAL FILE
              </div>
            </div>
          ` : ''}

          ${app.lastUploadedDocStatus ? `
            <div style="margin-top: 12px; padding: 14px; border-radius: 6px; background: var(--bg-surface-inset); border: 1px solid ${app.lastUploadedDocStatus.verified ? 'var(--emerald)' : 'var(--crimson)'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${app.lastUploadedDocStatus.verified ? 'var(--emerald)' : 'var(--crimson)'};"></span>
                    <strong style="font-size: 0.82rem; color: ${app.lastUploadedDocStatus.verified ? 'var(--emerald-light)' : 'var(--crimson-light)'}; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.5px;">
                      ${app.lastUploadedDocStatus.verified ? 'Authenticity Status: Medical Document Verified' : 'Authenticity Status: Non-Medical File Rejected'}
                    </strong>
                  </div>
                  <p style="font-size: 0.8rem; color: var(--slate-300); margin: 0; line-height: 1.4;">
                    <strong>${app.lastUploadedDocStatus.fileName}</strong>: ${app.lastUploadedDocStatus.message}
                  </p>
                </div>
                <button type="button" class="btn-3d btn-3d-secondary" style="padding: 2px 8px; font-size: 0.68rem; align-self: flex-start;" onclick="window.app.dismissDocStatus(event)">Dismiss</button>
              </div>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--slate-400); font-family: var(--font-mono);">
                <span>Classification: <strong>${app.lastUploadedDocStatus.categoryLabel}</strong></span>
                <span>Confidence: ${app.lastUploadedDocStatus.confidence || '99.9%'}</span>
              </div>
            </div>
          ` : ''}

          ${app.isOcrProcessing ? `
            <div style="margin-top: 10px; padding: 10px; border-radius: 6px; background: var(--bg-surface-inset); border: 1px solid var(--primary-glow); font-size: 0.82rem; color: var(--primary); font-family: var(--font-mono); text-align: center;">
              ${i18n.t("ocr_processing_msg")}
            </div>
          ` : ''}
        </div>

        <!-- Right: Digitized clinical findings -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); letter-spacing: 0.03em;">Digitized Clinical Findings</h4>
            <span class="pill-3d pill-3d-emerald">${patient.documents.length} ${i18n.t("files_processed")}</span>
          </div>

          ${latestDoc ? `
            <div style="background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="pill-3d pill-3d-blue" style="font-weight: 700;">${latestDoc.categoryLabel || latestDoc.type || 'Medical Record'}</span>
                <span class="pill-3d pill-3d-emerald">${i18n.t("verified_badge")}</span>
              </div>
              ${latestDoc.doctorName ? `
                <p style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary); margin-top: 6px; margin-bottom: 2px;">
                  Doctor: ${latestDoc.doctorName}
                </p>
              ` : ''}
              ${latestDoc.facility ? `
                <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0;">
                  Facility: ${latestDoc.facility}
                </p>
              ` : ''}
            </div>
          ` : ''}

          <!-- Identified conditions -->
          <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="font-size: 0.8rem; color: var(--text-primary); text-transform: uppercase; font-family: var(--font-mono);">${i18n.t("dx_heading")}</strong>
              <span class="pill-3d pill-3d-blue" style="font-size: 0.7rem;">${allDiseases.length} Detected</span>
            </div>
            <div style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
              ${allDiseases.length > 0 ? allDiseases.map(d => `
                <div style="background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 6px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                  <div>
                    <strong style="color: var(--text-primary); font-size: 0.88rem;">${d.name}</strong>
                    <p style="font-size: 0.72rem; color: var(--slate-400); margin-top: 2px; margin-bottom: 0;">
                      Detected from medical document
                    </p>
                  </div>
                  <span class="pill-3d pill-3d-blue" style="font-size: 0.7rem;">${i18n.t("verified_badge")}</span>
                </div>
              `).join('') : `
                <div style="background: var(--bg-surface-inset); border: 1px dashed var(--border-light); border-radius: 6px; padding: 8px 12px; font-size: 0.78rem; color: var(--text-muted);">
                  ${i18n.t("dx_empty")}
                </div>
              `}
            </div>
          </div>

          <!-- Lab biomarker flags -->
          <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="font-size: 0.8rem; color: var(--text-primary); text-transform: uppercase; font-family: var(--font-mono);">${i18n.t("lab_heading")}</strong>
              <span class="pill-3d pill-3d-crimson" style="font-size: 0.7rem;">${allFlags.length} Flags</span>
            </div>
            <div style="max-height: 140px; overflow-y: auto;">
              ${allFlags.length > 0 ? allFlags.map(f => `
                <div class="lab-flag-item-3d">
                  <div>
                    <strong style="color: var(--text-primary); font-size: 0.82rem; font-family: var(--font-mono);">${f.test || f.param}: ${f.value}</strong>
                    <p style="font-size: 0.72rem; color: var(--text-muted);">Ref: ${f.ref} [${f.status}]</p>
                  </div>
                  <span class="pill-3d pill-3d-crimson">${(f.status || 'ABNORMAL').split(' ')[0]}</span>
                </div>
              `).join('') : `
                <p style="font-size: 0.78rem; color: var(--text-muted); padding: 6px;">${i18n.t("lab_empty")}</p>
              `}
            </div>
          </div>

          <!-- Prescribed medications -->
          <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="font-size: 0.8rem; color: var(--text-primary); text-transform: uppercase; font-family: var(--font-mono);">${i18n.t("rx_heading")}</strong>
              <span class="pill-3d pill-3d-emerald" style="font-size: 0.7rem;">${allExtractedMeds.length} ${i18n.t("active_badge")}</span>
            </div>
            <div style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
              ${allExtractedMeds.length > 0 ? allExtractedMeds.map(m => {
                const name = typeof m === 'string' ? m : m.name;
                const dosage = m.dosage || '';
                const freq = m.freq || 'Daily';
                const timing = m.timing || 'After Food';
                const duration = m.duration || '';

                return `
                  <div class="medication-card-3d">
                    <div>
                      <strong style="color: var(--text-primary); font-size: 0.88rem;">${name}</strong>
                      ${dosage && dosage !== 'Standard Dose' ? `<span class="pill-3d pill-3d-blue" style="margin-left: 6px; font-size: 0.7rem;">${dosage}</span>` : ''}
                      <p style="font-size: 0.75rem; color: var(--slate-300); margin: 3px 0 0 0; font-family: var(--font-mono);">
                        ${freq} • ${timing} ${duration ? `• ${duration}` : ''}
                      </p>
                    </div>
                    <span class="pill-3d pill-3d-emerald" style="font-size: 0.7rem;">${i18n.t("verified_badge")}</span>
                  </div>
                `;
              }).join('') : `
                <div style="background: var(--bg-surface-inset); border: 1px dashed var(--border-light); border-radius: 6px; padding: 10px 14px; font-size: 0.78rem; color: var(--slate-400);">
                  ${latestDoc && ((latestDoc.type || '').includes('pathology') || (latestDoc.categoryLabel || '').toLowerCase().includes('pathology') || (latestDoc.categoryLabel || '').toLowerCase().includes('lab')) ? 
                    '<strong>Pathology Diagnostic Report:</strong> Laboratory test values & diagnostic biomarkers extracted above. (No outpatient prescribed medications in this lab report).' : 
                    i18n.t("rx_empty")}
                </div>
              `}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
            <button class="btn-3d btn-3d-secondary" onclick="window.app.prevStep()">${i18n.t("btn_back")}</button>
            <button class="btn-3d btn-3d-primary" onclick="window.app.nextStep()">${i18n.t("btn_gen_summary")}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

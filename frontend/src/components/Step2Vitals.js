// Optical vitals scanner, camera reticle, body map, and symptom intake component

import { SOCRATES_QUESTIONS } from "../services/clinicalParser.js";
import { ayushEngine, AYUSH_QUESTIONS } from "../services/ayushEngine.js";

export function renderStep2VitalsAndIntake(app, i18n) {
  const vitals = app.patient.rppgVitals || {
    heartRate: "--",
    hrv: "--",
    spO2: "--",
    respiratoryRate: "--",
    stressScore: "--",
    signalQuality: "Awaiting Face Alignment"
  };

  const isLocked = app.faceLockState.isLocked;
  const checks = app.faceLockState.checks || {};

  return `
    <div class="vitals-hardware-bay">
      <div class="bay-header">
        <div>
          <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">
            ${i18n.t("vitals_title")}
          </h3>
          <p style="font-size: 0.78rem; color: var(--text-muted);">
            ${i18n.t("vitals_subtitle")}
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <!-- Scan duration switch -->
          <div style="background: var(--bg-surface-inset); padding: 3px; border-radius: 6px; border: 1px solid var(--border-light); display: flex; gap: 2px;">
            <button class="mode-btn ${app.scanDuration === 30000 ? 'active' : ''}" style="padding: 4px 10px; font-size: 0.74rem;" onclick="window.app.setScanDuration(30000)">
              ${i18n.t("rapid_scan_btn")}
            </button>
            <button class="mode-btn ${app.scanDuration === 60000 ? 'active' : ''}" style="padding: 4px 10px; font-size: 0.74rem;" onclick="window.app.setScanDuration(60000)">
              ${i18n.t("diagnostic_scan_btn")}
            </button>
          </div>

          <button class="btn-3d ${app.isAyushMode ? 'btn-3d-success' : 'btn-3d-secondary'}" style="padding: 6px 12px; font-size: 0.76rem;" onclick="window.app.toggleAyushMode()">
            ${app.isAyushMode ? 'AYUSH Active' : i18n.t("ayush_mode_btn")}
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 240px 1fr; gap: 1.25rem; align-items: stretch;">
        <!-- Camera feed column -->
        <div>
          ${app.patient.rppgVitals ? `
            <div style="height: 200px; border-radius: 6px; background: var(--bg-surface-inset); border: 1px solid var(--emerald); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 1rem; box-shadow: 0 0 24px var(--emerald-glow);">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <strong style="color: var(--emerald-light); font-size: 0.95rem; font-family: var(--font-mono);">${i18n.t("vitals_calibrated")}</strong>
              <p style="font-size: 0.74rem; color: var(--slate-300); margin-top: 2px;">${i18n.t("vitals_calibrated_sub")}</p>
              <span class="pill-3d pill-3d-emerald" style="margin-top: 8px;">
                ${app.patient.rppgVitals.durationSeconds || 30}s • ${i18n.t("verified_badge")}
              </span>
            </div>
          ` : `
            <div class="camera-hardware-lens" id="rppgCameraFeedContainer" style="cursor: pointer;" onclick="if(!window.app.patient.rppgVitals && window.app.cameraError) window.app.requestCameraDirectly();">
              <div class="reticle-hud ${isLocked ? 'locked' : ''}">
                <span class="reticle-status-badge">
                  ${app.cameraError ? i18n.t("camera_req_btn") : (app.faceLockState.message || (app.isRppgScanning ? i18n.t("btn_scanning_vitals") : 'ALIGNING FACE...'))}
                </span>
              </div>
            </div>
            ${app.cameraError ? `
              <div style="margin-top: 6px; text-align: center;">
                <button class="btn-3d btn-3d-warning" style="padding: 6px 12px; font-size: 0.78rem; width: 100%;" onclick="window.app.requestCameraDirectly()">
                  ${i18n.t("camera_req_btn")}
                </button>
              </div>
            ` : ''}
          `}

          <!-- Alignment checklist -->
          <div class="checklist-pill-bar">
            <div class="pill-check ${app.patient.rppgVitals || checks.faceDetected ? 'pass' : ''}">
              <span>${app.patient.rppgVitals || checks.faceDetected ? '✓' : '○'}</span> Face
            </div>
            <div class="pill-check ${app.patient.rppgVitals || checks.isCentered ? 'pass' : ''}">
              <span>${app.patient.rppgVitals || checks.isCentered ? '✓' : '○'}</span> Center
            </div>
            <div class="pill-check ${app.patient.rppgVitals || checks.isOptimalDistance ? 'pass' : ''}">
              <span>${app.patient.rppgVitals || checks.isOptimalDistance ? '✓' : '○'}</span> Distance
            </div>
            <div class="pill-check ${app.patient.rppgVitals || checks.isStill ? 'pass' : ''}">
              <span>${app.patient.rppgVitals || checks.isStill ? '✓' : '○'}</span> Still
            </div>
            <div class="pill-check ${app.patient.rppgVitals || checks.hasValidROIs ? 'pass' : ''}">
              <span>${app.patient.rppgVitals || checks.hasValidROIs ? '✓' : '○'}</span> Skin ROI
            </div>
          </div>
        </div>

        <!-- Waveform and vitals telemetry -->
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 0.78rem; color: var(--text-primary); font-weight: 700; font-family: var(--font-mono);">
                ${app.scanDuration >= 60000 ? i18n.t("diagnostic_scan_btn") : i18n.t("rapid_scan_btn")}:
              </span>
              ${app.patient.rppgVitals ? `
                <button class="btn-3d btn-3d-success" style="padding: 6px 14px; font-size: 0.78rem;" onclick="window.app.nextStep()">
                  ${i18n.t("btn_next_records")}
                </button>
              ` : `
                <button id="btnStartVitalsScan" class="btn-3d ${isLocked ? 'btn-3d-success' : 'btn-3d-primary'}" style="padding: 6px 14px; font-size: 0.78rem;" onclick="window.app.triggerRppgScan()">
                  ${app.isRppgScanning ? i18n.t("btn_scanning_vitals") : (isLocked ? i18n.t("auto_scan_msg") : i18n.t("btn_scan_vitals"))}
                </button>
              `}
            </div>

            ${app.isRppgScanning ? `
              <div style="background: var(--bg-surface-inset); border: 1px solid var(--primary-glow); border-radius: 6px; padding: 8px 12px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-primary); font-family: var(--font-mono); font-weight: 600;">
                  <span id="rppgCountdownText">${app.rppgElapsedSec || '0.0'}s / ${(app.scanDuration/1000).toFixed(1)}s (Hold Still)</span>
                  <strong id="rppgProgressText" style="color: var(--primary);">${app.rppgProgress}%</strong>
                </div>
                <div style="width: 100%; height: 6px; background: var(--grey-200); border-radius: 3px; overflow: hidden; margin-top: 5px;">
                  <div id="rppgProgressBar" style="width: ${app.rppgProgress}%; height: 100%; background: var(--primary-gradient); transition: width 0.1s linear;"></div>
                </div>
              </div>
            ` : ''}

            <!-- Oscilloscope canvas visualizer -->
            <div class="oscilloscope-container-3d">
              <div class="oscilloscope-legend">
                <span>Live Photoplethysmogram Oscilloscope (Pulse Waveform)</span>
                <span style="color: ${app.isRppgScanning ? 'var(--emerald)' : (app.patient.rppgVitals ? 'var(--cyan)' : 'var(--text-muted)')}; font-family: var(--font-mono); font-weight: 700;">
                  ${app.isRppgScanning ? '● SAMPLING 30 FPS' : (app.patient.rppgVitals ? '✓ CAPTURE LOCKED' : '○ STANDBY')}
                </span>
              </div>
              <canvas id="rppgOscilloscopeCanvas" width="480" height="52" class="oscilloscope-canvas-3d"></canvas>
            </div>

            <!-- Telemetry cards grid -->
            <div class="telemetry-grid">
              <div class="telemetry-card telemetry-card-hr ${vitals.heartRate > 100 ? 'highlight-alert' : ''}">
                <div class="telemetry-value telemetry-hr">${vitals.heartRate}<span class="telemetry-unit">${i18n.t("telemetry_hr_unit")}</span></div>
                <div class="telemetry-label">${i18n.t("telemetry_hr")}</div>
                <div class="telemetry-status">${vitals.heartRate > 100 ? 'Elevated' : (vitals.heartRate !== '--' ? i18n.t("status_resting") : '--')}</div>
                <span class="telemetry-ref-tag">Ref: 60 - 100 bpm</span>
              </div>

              <div class="telemetry-card telemetry-card-spo2 ${vitals.spO2 < 95 && vitals.spO2 !== '--' ? 'highlight-alert' : ''}">
                <div class="telemetry-value telemetry-spo2">${vitals.spO2}<span class="telemetry-unit">${i18n.t("telemetry_spo2_unit")}</span></div>
                <div class="telemetry-label">${i18n.t("telemetry_spo2")}</div>
                <div class="telemetry-status">
                  ${vitals.spO2 !== '--' ? i18n.t("status_optimal") : '--'}
                </div>
                <span class="telemetry-ref-tag">Ref: 95 - 100%</span>
              </div>

              <div class="telemetry-card telemetry-card-stress ${vitals.stressScore > 70 ? 'highlight-alert' : ''}">
                <div class="telemetry-value telemetry-stress">${vitals.stressScore !== undefined ? vitals.stressScore : '--'}<span class="telemetry-unit">${i18n.t("telemetry_stress_unit")}</span></div>
                <div class="telemetry-label">${i18n.t("telemetry_stress")}</div>
                <div class="telemetry-status">
                  ${vitals.stressScore !== '--' && vitals.stressScore !== undefined ? i18n.t("status_relaxed") : '--'}
                </div>
                <span class="telemetry-ref-tag">Ref: &lt; 35 Index</span>
              </div>

              <div class="telemetry-card telemetry-card-hrv">
                <div class="telemetry-value telemetry-hrv">${vitals.hrv}<span class="telemetry-unit">${i18n.t("telemetry_hrv_unit")}</span></div>
                <div class="telemetry-label">${i18n.t("telemetry_hrv")}</div>
                <div class="telemetry-status">
                  ${vitals.hrv !== '--' ? 'Nominal' : '--'}
                </div>
                <span class="telemetry-ref-tag">Ref: 30 - 70 ms</span>
              </div>

              <div class="telemetry-card telemetry-card-resp">
                <div class="telemetry-value telemetry-resp">${vitals.respiratoryRate}<span class="telemetry-unit">${i18n.t("telemetry_resp_unit")}</span></div>
                <div class="telemetry-label">${i18n.t("telemetry_resp")}</div>
                <div class="telemetry-status">
                  ${vitals.respiratoryRate !== '--' ? i18n.t("status_normal") : '--'}
                </div>
                <span class="telemetry-ref-tag">Ref: 12 - 20 rpm</span>
              </div>
            </div>

            <!-- Vitals calibrated notice -->
            ${app.patient.rppgVitals ? `
              <div style="background: var(--green-subtle); border: 1px solid var(--green-border); border-radius: 6px; padding: 10px 14px; margin-top: 10px; font-size: 0.8rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <div>
                  <strong style="font-family: var(--font-mono); color: var(--emerald-light);">${i18n.t("vitals_summary_badge")}</strong>
                  <p style="font-size: 0.74rem; color: var(--slate-300); margin: 2px 0 0 0;">
                    Heart rate, blood oxygen saturation, and respiration were securely measured and attached to patient intake.
                  </p>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Symptom elicitation and body map -->
    <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 1.5rem;">
      <div>
        <!-- Voice station -->
        <div class="voice-station-3d">
          <button id="micBtn" class="mic-tactile-button" onclick="window.app.toggleSpeech()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
          <h4 id="micStatusText" style="font-size: 1.05rem; margin-top: 10px; font-weight: 700;">${i18n.t("voice_mic_title")}</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${i18n.t("voice_mic_sub")}</p>

          <div style="margin-top: 1rem; text-align: left;">
            <label class="input-label-3d">${i18n.t("chief_complaint_label")}</label>
            <textarea id="chiefComplaintText" class="input-text-3d" rows="3" placeholder="${i18n.t("chief_complaint_ph")}">${app.patient.chiefComplaint}</textarea>

            <!-- Quick symptom chips -->
            <div style="margin-top: 10px;">
              <label style="font-size: 0.74rem; color: var(--text-muted); display: block; margin-bottom: 5px;">${i18n.t("quick_symptoms_title")}</label>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                <button type="button" class="quick-chip" onclick="window.app.appendSymptom('${i18n.t("sym_fever")}')">${i18n.t("sym_fever")}</button>
                <button type="button" class="quick-chip" onclick="window.app.appendSymptom('${i18n.t("sym_cough")}')">${i18n.t("sym_cough")}</button>
                <button type="button" class="quick-chip" onclick="window.app.appendSymptom('${i18n.t("sym_headache")}')">${i18n.t("sym_headache")}</button>
                <button type="button" class="quick-chip" onclick="window.app.appendSymptom('${i18n.t("sym_chest_pain")}')">${i18n.t("sym_chest_pain")}</button>
                <button type="button" class="quick-chip" onclick="window.app.appendSymptom('${i18n.t("sym_stomach_pain")}')">${i18n.t("sym_stomach_pain")}</button>
                <button type="button" class="quick-chip" onclick="window.app.appendSymptom('${i18n.t("sym_breathless")}')">${i18n.t("sym_breathless")}</button>
                <button type="button" class="quick-chip" onclick="window.app.appendSymptom('${i18n.t("sym_joint_pain")}')">${i18n.t("sym_joint_pain")}</button>
                <button type="button" class="quick-chip" onclick="window.app.appendSymptom('${i18n.t("sym_vomiting")}')">${i18n.t("sym_vomiting")}</button>
                <button type="button" class="quick-chip" onclick="window.app.appendSymptom('${i18n.t("sym_fatigue")}')">${i18n.t("sym_fatigue")}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Herbal remedies declarations -->
        <div class="card-3d" style="padding: 1.25rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div>
              <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary);">${i18n.t("herbs_title")}</h4>
              <p style="font-size: 0.72rem; color: var(--text-muted); margin: 0;">${i18n.t("herbs_sub")}</p>
            </div>
            <button class="btn-3d btn-3d-secondary" style="padding: 4px 10px; font-size: 0.72rem;" onclick="window.app.promptAddHerb()">${i18n.t("herbs_add_btn")}</button>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${(app.patient.ayushHerbs || []).map((h, hIdx) => `
              <span class="pill-3d pill-3d-emerald" style="cursor: pointer;" onclick="window.app.removeHerb(${hIdx})">
                ${h.name} ✕
              </span>
            `).join('')}
            ${(!app.patient.ayushHerbs || app.patient.ayushHerbs.length === 0) ? `
              <span style="font-size: 0.78rem; color: var(--text-muted);">${i18n.t("herbs_empty")}</span>
            ` : ''}
          </div>
        </div>

        <!-- SOCRATES symptom questionnaire -->
        <div class="card-3d" style="padding: 1.25rem;">
          <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); margin-bottom: 10px;">${i18n.t("socrates_title")}</h4>
          
          <div style="margin-bottom: 12px;">
            <label class="input-label-3d">${SOCRATES_QUESTIONS.character.title}</label>
            <div class="chip-rack">
              ${SOCRATES_QUESTIONS.character.options.map(opt => `
                <button class="tactile-chip ${app.patient.hpi.character === opt ? 'selected' : ''}" onclick="window.app.setHpiField('character', '${opt}')">${opt}</button>
              `).join('')}
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 700; margin-bottom: 6px;">
              <span>Discomfort Severity:</span>
              <span style="color: ${app.patient.hpi.severity >= 7 ? 'var(--crimson)' : 'var(--primary)'}; font-family: var(--font-mono);">${app.patient.hpi.severity || 0} / 10 ${app.patient.hpi.severity >= 7 ? '(PRIORITY ALERT)' : ''}</span>
            </div>
            <input type="range" style="width: 100%; accent-color: var(--primary); cursor: pointer;" min="0" max="10" value="${app.patient.hpi.severity || 0}" oninput="window.app.setSeverity(this.value)">
          </div>
        </div>
      </div>

      <!-- Right column: body map or AYUSH -->
      <div>
        ${app.isAyushMode ? renderAyushModule(app, i18n) : renderBodyMapModule(app, i18n)}

        <div style="display: flex; justify-content: space-between; margin-top: 1.25rem;">
          <button class="btn-3d btn-3d-secondary" onclick="window.app.prevStep()">${i18n.t("btn_back")}</button>
          <button class="btn-3d ${app.patient.rppgVitals ? 'btn-3d-success' : 'btn-3d-primary'}" onclick="window.app.nextStep()">
            ${i18n.t("btn_next_records")}
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderBodyMapModule(app, i18n) {
  const hpi = app.patient.hpi;

  return `
    <div class="bodymap-hardware-box">
      <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); text-align: left;">
        Interactive Anatomical Body Map
      </h4>
      <p style="font-size: 0.78rem; color: var(--text-muted); text-align: left;">
        Tap anatomical area to localize symptom site
      </p>

      <div class="bodymap-svg-container">
        <svg class="human-silhouette" viewBox="0 0 200 280">
          <circle cx="100" cy="30" r="20" class="body-zone-target ${hpi.site.includes('Head') ? 'selected' : ''}" onclick="window.app.selectBodyPart('Head / Sar')"/>
          <rect x="92" y="52" width="16" height="12" rx="3" class="body-zone-target ${hpi.site.includes('Throat') ? 'selected' : ''}" onclick="window.app.selectBodyPart('Throat / Gala')"/>
          <rect x="70" y="66" width="60" height="40" rx="8" class="body-zone-target ${hpi.site.includes('Chest') ? 'selected' : ''}" onclick="window.app.selectBodyPart('Chest / Chhati')"/>
          <rect x="45" y="70" width="20" height="65" rx="6" class="body-zone-target ${hpi.site.includes('Left') ? 'selected' : ''}" onclick="window.app.selectBodyPart('Left Arm / Shoulder')"/>
          <rect x="135" y="70" width="20" height="65" rx="6" class="body-zone-target" onclick="window.app.selectBodyPart('Right Arm')"/>
          <rect x="74" y="110" width="52" height="45" rx="8" class="body-zone-target ${hpi.site.includes('Abdomen') ? 'selected' : ''}" onclick="window.app.selectBodyPart('Abdomen / Pet')"/>
          <rect x="76" y="158" width="48" height="25" rx="6" class="body-zone-target ${hpi.site.includes('Back') ? 'selected' : ''}" onclick="window.app.selectBodyPart('Back / Pelvis')"/>
          <rect x="72" y="188" width="22" height="85" rx="8" class="body-zone-target ${hpi.site.includes('Knee') ? 'selected' : ''}" onclick="window.app.selectBodyPart('Knee Joints (Left)')"/>
          <rect x="106" y="188" width="22" height="85" rx="8" class="body-zone-target ${hpi.site.includes('Knee') ? 'selected' : ''}" onclick="window.app.selectBodyPart('Knee Joints (Right)')"/>
        </svg>
      </div>

      <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); margin-bottom: 12px;">
        Selected Site: <span style="color: var(--primary);">${hpi.site || 'None selected'}</span>
      </div>

      <div style="text-align: left;">
        <label class="input-label-3d">Associated Symptoms</label>
        <div class="chip-rack">
          ${SOCRATES_QUESTIONS.associations.options.map(item => `
            <button class="tactile-chip ${(hpi.associations || []).includes(item) ? 'selected' : ''}" onclick="window.app.toggleAssociation('${item}')">${item}</button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

export function renderAyushModule(app, i18n) {
  const prakritiResult = ayushEngine.calculatePrakriti(app.ayushAnswers);

  return `
    <div class="bodymap-hardware-box" style="border-color: var(--green-border);">
      <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); text-align: left;">
        AYUSH Dashavidha Pariksha & Prakriti Assessment
      </h4>
      <p style="font-size: 0.78rem; color: var(--text-muted); text-align: left;">
        Standardized Ayurvedic phenotypic constitutional evaluation
      </p>

      <div style="background: var(--bg-surface-inset); border: 1px solid var(--border-light); border-radius: 6px; padding: 12px; margin: 1rem 0;">
        <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 700; margin-bottom: 6px;">
          <span>Dominant Prakriti:</span>
          <span style="color: var(--teal-light); font-family: var(--font-mono);">${prakritiResult.dominant}</span>
        </div>
        <div style="display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: var(--grey-200); border: 1px solid var(--border-light);">
          <div style="width: ${prakritiResult.scores.vata}%; background: #38BDF8;" title="Vata: ${prakritiResult.scores.vata}%"></div>
          <div style="width: ${prakritiResult.scores.pitta}%; background: #F59E0B;" title="Pitta: ${prakritiResult.scores.pitta}%"></div>
          <div style="width: ${prakritiResult.scores.kapha}%; background: #10B981;" title="Kapha: ${prakritiResult.scores.kapha}%"></div>
        </div>
      </div>

      <div style="max-height: 260px; overflow-y: auto; text-align: left;">
        ${AYUSH_QUESTIONS.map(q => `
          <div style="margin-bottom: 12px; border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">
            <p style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">${q.question}</p>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
              ${q.options.map((opt, oIdx) => `
                <label style="font-size: 0.78rem; display: flex; align-items: flex-start; gap: 6px; cursor: pointer; color: var(--text-secondary);">
                  <input type="radio" name="${q.id}" value="${oIdx}" ${(app.ayushAnswers[q.id] || 0) === oIdx ? 'checked' : ''} onchange="window.app.setAyushAnswer('${q.id}', ${oIdx})">
                  <span>${opt.text}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

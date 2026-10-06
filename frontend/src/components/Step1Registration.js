// Patient registration and ABHA check-in form component

export function renderStep1Registration(app, i18n) {
  const patient = app.patient;

  return `
    <div class="card-3d" style="max-width: 680px; margin: 0 auto;">
      <div class="card-header-3d">
        <div>
          <h2 class="card-title-3d">${i18n.t("reg_title")}</h2>
          <p class="card-subtitle-3d">${i18n.t("reg_subtitle")}</p>
        </div>
        <button class="btn-3d btn-3d-secondary" style="padding: 8px 14px; font-size: 0.8rem;" onclick="window.app.speakStep1Prompt()">${i18n.t("audio_guide_btn")}</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="input-label-3d">${i18n.t("full_name_label")}</label>
          <input type="text" id="patientNameInput" class="input-text-3d" placeholder="${i18n.t("full_name_ph")}" value="${patient.name || ''}">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="input-label-3d">${i18n.t("age_label")}</label>
            <input type="number" id="patientAgeInput" class="input-text-3d" placeholder="${i18n.t("age_ph")}" value="${patient.age || ''}">
          </div>
          <div>
            <label class="input-label-3d">${i18n.t("gender_label")}</label>
            <select id="patientGenderInput" class="input-text-3d">
              <option value="Female" ${patient.gender === 'Female' ? 'selected' : ''}>${i18n.t("gender_female")}</option>
              <option value="Male" ${patient.gender === 'Male' ? 'selected' : ''}>${i18n.t("gender_male")}</option>
              <option value="Other" ${patient.gender === 'Other' ? 'selected' : ''}>${i18n.t("gender_other")}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="input-label-3d">${i18n.t("abha_label")}</label>
          <input type="text" id="patientAbhaInput" class="input-text-3d" placeholder="${i18n.t("abha_ph")}" value="${patient.abhaId || ''}">
        </div>

        <div>
          <label class="input-label-3d">${i18n.t("mobile_label")}</label>
          <input type="tel" id="patientMobileInput" class="input-text-3d" placeholder="${i18n.t("mobile_ph")}" value="${patient.mobile || ''}">
        </div>

        <div style="background: var(--green-subtle); border: 1px solid var(--green-border); border-radius: 6px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 12px; margin-top: 6px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:1px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <div>
            <strong style="font-size: 0.8rem; color: var(--green-darkest); font-family: var(--font-mono); letter-spacing: 0.04em; text-transform: uppercase;">${i18n.t("dpdp_title")}</strong>
            <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 3px; line-height: 1.4;">
              ${i18n.t("dpdp_desc")}
            </p>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
          <button class="btn-3d btn-3d-primary" style="padding: 13px 32px;" onclick="window.app.saveStep1AndNext()">
            ${i18n.t("btn_proceed_vitals")}
          </button>
        </div>
      </div>
    </div>
  `;
}

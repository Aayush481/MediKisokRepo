// Stepper navigation component for multi-step clinical intake wizard

export function renderStepper(app, i18n) {
  const currentStep = app.currentStep;

  return `
    <div class="kiosk-stepper">
      <div class="step-node ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}" onclick="window.app.goToStep(1)">
        <div class="step-number">${currentStep > 1 ? '✓' : '01'}</div>
        <div>
          <div class="step-label">${i18n.t("step1_title")}</div>
          <div class="step-subtext">${i18n.t("step1_sub")}</div>
        </div>
      </div>
      <div class="step-node ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}" onclick="window.app.goToStep(2)">
        <div class="step-number">${currentStep > 2 ? '✓' : '02'}</div>
        <div>
          <div class="step-label">${i18n.t("step2_title")}</div>
          <div class="step-subtext">${i18n.t("step2_sub")}</div>
        </div>
      </div>
      <div class="step-node ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}" onclick="window.app.goToStep(3)">
        <div class="step-number">${currentStep > 3 ? '✓' : '03'}</div>
        <div>
          <div class="step-label">${i18n.t("step3_title")}</div>
          <div class="step-subtext">${i18n.t("step3_sub")}</div>
        </div>
      </div>
      <div class="step-node ${currentStep === 4 ? 'active' : ''}" onclick="window.app.goToStep(4)">
        <div class="step-number">04</div>
        <div>
          <div class="step-label">${i18n.t("step4_title")}</div>
          <div class="step-subtext">${i18n.t("step4_sub")}</div>
        </div>
      </div>
      <div class="step-node ${app.patient?.hasNeuroScreening ? 'completed' : ''}" onclick="window.app.openAdhdScreening()" style="cursor: pointer;" title="Optional ADHD & Neurodevelopmental Focus Screener">
        <div class="step-number" style="background: #ECFDF5; color: #047857; border-color: #A7F3D0;">
          ${app.patient?.hasNeuroScreening ? '✓' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'}
        </div>
        <div>
          <div class="step-label" style="color: #065F46;">${i18n.t("step_neuro_title", "Wellness & Focus")}</div>
          <div class="step-subtext">${app.patient?.hasNeuroScreening ? i18n.t("step_neuro_done", "Screened") : i18n.t("step_neuro_sub", "Intake Screener")}</div>
        </div>
      </div>
    </div>
  `;
}

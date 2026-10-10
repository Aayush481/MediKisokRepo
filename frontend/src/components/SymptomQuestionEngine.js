/**
 * MediKiosk Dynamic Symptom Question Engine
 * Interactive OPQRST / SOCRATES guided follow-up question flow.
 * Evaluates red-flag rules on every user answer and produces clinician-ready summary.
 */

import { ORGAN_QUESTION_BANKS, GLOBAL_CONTEXT_QUESTIONS } from "../data/organQuestionBanks.js";
import { anatomyRegistryService } from "../services/anatomyRegistryService.js";
import { triageRuleEngine } from "../services/triageRuleEngine.js";
import { EmergencyAlertModal } from "./EmergencyAlertModal.js";
import { bodymapStore } from "../services/bodymapStore.js";

export class SymptomQuestionEngine {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.onSummaryGenerated = options.onSummaryGenerated || null;
    this.onEmergencyTriggered = options.onEmergencyTriggered || null;

    this.currentOrganId = null;
    this.questions = [];
    this.currentIndex = 0;
    this.answers = {};
    this.latestTriage = null;

    this.unsubscribeStore = null;
  }

  init() {
    this.lastPartsKey = (bodymapStore.getState().selectedParts || []).join(",");
    this.currentOrganId = bodymapStore.getState().primarySelectedPart || "organ_heart";
    this.loadOrganQuestions(this.currentOrganId);

    this.unsubscribeStore = bodymapStore.subscribe((state) => {
      const partsKey = (state.selectedParts || []).join(",");
      if (partsKey !== this.lastPartsKey) {
        this.lastPartsKey = partsKey;
        this.currentOrganId = state.primarySelectedPart || state.selectedParts?.[0] || "organ_heart";
        this.loadOrganQuestions(this.currentOrganId);
        this.render();
      }
    });

    this.render();
  }

  loadOrganQuestions(organId) {
    const selectedParts = bodymapStore.getState().selectedParts || [organId];
    const organQuestions = [];
    const seenQuestionIds = new Set();

    // Iterate through all selected organs to gather questions
    for (const pId of selectedParts) {
      const bank = ORGAN_QUESTION_BANKS[pId] || ORGAN_QUESTION_BANKS.organ_heart;
      if (bank && bank.questions) {
        for (const q of bank.questions) {
          if (!seenQuestionIds.has(q.id)) {
            seenQuestionIds.add(q.id);
            organQuestions.push({ ...q, originOrgan: pId });
          }
        }
      }
    }

    // Filter global questions based on patient demographics if available
    const patientGender = window.app?.patient?.gender?.toLowerCase() || "female";
    const filteredGlobals = GLOBAL_CONTEXT_QUESTIONS.filter(q => {
      if (q.applicableGender && q.applicableGender !== patientGender) return false;
      return true;
    });

    this.questions = [...organQuestions, ...filteredGlobals];
    this.currentIndex = 0;
    this.answers = {};
    this.latestTriage = triageRuleEngine.evaluate(this.currentOrganId, this.answers, selectedParts);
  }

  handleAnswerChange(qId, val, isMulti = false) {
    if (isMulti) {
      const existing = this.answers[qId] || [];
      if (existing.includes(val)) {
        this.answers[qId] = existing.filter(x => x !== val);
      } else {
        this.answers[qId] = [...existing, val];
      }
    } else {
      this.answers[qId] = val;
    }

    // Critical: Evaluate safety red-flags on EVERY answer across all selected organs
    const selectedParts = bodymapStore.getState().selectedParts || [this.currentOrganId];
    this.latestTriage = triageRuleEngine.evaluate(this.currentOrganId, this.answers, selectedParts);

    if (this.latestTriage.shouldInterrupt) {
      if (typeof this.onEmergencyTriggered === "function") {
        this.onEmergencyTriggered(this.latestTriage);
      }
      EmergencyAlertModal.show(this.latestTriage);
    }

    this.render();
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.render();
    } else {
      this.finishIntake();
    }
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.render();
    }
  }

  skipQuestion() {
    const currentQ = this.questions[this.currentIndex];
    if (currentQ) {
      this.answers[currentQ.id] = "skipped_or_unknown";
    }
    this.nextQuestion();
  }

  finishIntake() {
    const organItem = anatomyRegistryService.getById(this.currentOrganId);
    const finalTriage = triageRuleEngine.evaluate(this.currentOrganId, this.answers);

    const summaryPayload = {
      organId: this.currentOrganId,
      organDisplayName: organItem ? organItem.displayName.en : this.currentOrganId,
      snomedBodyStructure: organItem?.snomedBodyStructure || { code: "N/A", display: "Unspecified" },
      answers: { ...this.answers },
      triageResult: finalTriage,
      urgencyTier: finalTriage.urgencyTier,
      timestamp: new Date().toISOString(),
      questionBankVersion: "2.1.0-SIH2026",
      isEmergency: finalTriage.isEmergency
    };

    if (typeof this.onSummaryGenerated === "function") {
      this.onSummaryGenerated(summaryPayload);
    }

    this.renderCompletionSummary(summaryPayload);
  }

  renderCompletionSummary(summary) {
    if (!this.container) return;

    const tier = summary.triageResult.tierDetails;
    const triggered = summary.triageResult.triggeredRules || [];

    this.container.innerHTML = `
      <div class="question-engine-card-3d" style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${tier.color}; border-radius: 14px; padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
          <div>
            <span class="pill-3d ${tier.badgeClass}" style="font-size: 0.76rem; font-weight: 800;">
              ${tier.label}
            </span>
            <h3 style="font-size: 1.1rem; font-weight: 800; color: #FFFFFF; margin: 6px 0 0 0;">
              Clinical Intake Summary: ${summary.organDisplayName}
            </h3>
          </div>
          <button class="btn-3d btn-3d-secondary" style="padding: 4px 12px; font-size: 0.74rem;" onclick="window.__restart_intake()">
            🔄 Edit Answers
          </button>
        </div>

        <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; margin-bottom: 1rem;">
          <div style="font-size: 0.76rem; color: #94A3B8; margin-bottom: 4px;">
            SNOMED-CT Body Structure: <code style="color: #38BDF8;">${summary.snomedBodyStructure.code} (${summary.snomedBodyStructure.display})</code>
          </div>
          <div style="font-size: 0.8rem; color: #E2E8F0; line-height: 1.4;">
            <strong>Action Directive:</strong> ${tier.action}
          </div>
        </div>

        ${triggered.length > 0 ? `
          <div style="margin-bottom: 1rem;">
            <strong style="color: #F87171; font-size: 0.78rem; text-transform: uppercase;">Triggered Clinical Rules (${triggered.length}):</strong>
            <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 0.76rem; color: #FCA5A5; line-height: 1.4;">
              ${triggered.map(r => `<li><strong>[${r.ruleId}]</strong>: ${r.reason}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
          <span style="font-size: 0.7rem; color: var(--text-muted);">
            CDSCO SaMD Pre-Consultation Elicitation • Not a Medical Diagnosis
          </span>
          <button class="btn-3d btn-3d-success" style="padding: 8px 20px; font-size: 0.82rem;" onclick="window.app?.goToStep(3) || alert('Encounter recorded!')">
            Attach Clinical History to Encounter →
          </button>
        </div>
      </div>
    `;

    window.__restart_intake = () => {
      this.currentIndex = 0;
      this.render();
    };
  }

  render() {
    if (!this.container) return;

    const organItem = anatomyRegistryService.getById(this.currentOrganId);
    const organBank = ORGAN_QUESTION_BANKS[this.currentOrganId] || ORGAN_QUESTION_BANKS.organ_heart;
    const currentQ = this.questions[this.currentIndex];

    if (!currentQ) return;

    const progressPct = Math.round(((this.currentIndex + 1) / this.questions.length) * 100);
    const selectedVal = this.answers[currentQ.id];
    const isRedAlert = this.latestTriage?.isEmergency;

    this.container.innerHTML = `
      <div class="question-engine-card-3d" style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${isRedAlert ? '#EF4444' : 'rgba(56, 189, 248, 0.3)'}; border-radius: 14px; padding: 1.25rem; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
        
        <!-- Header Info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="font-size: 1.05rem; font-weight: 800; color: #38BDF8; margin: 0;">
                ${organItem ? organItem.displayName.en : 'Anatomical'} Symptom Intake
              </h3>
              <span class="pill-3d pill-3d-blue" style="font-size: 0.68rem;">
                SNOMED: ${organItem?.snomedBodyStructure?.code || 'Concept'}
              </span>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
              Guideline: ${organBank.clinicalGuideline || 'Clinical Best Practice'} • <span style="color: #FCD34D;">Needs Clinician Review: Yes</span>
            </div>
          </div>
          <span class="pill-3d ${isRedAlert ? 'pill-3d-crimson' : 'pill-3d-emerald'}" style="font-size: 0.7rem;">
            ${isRedAlert ? '🚨 RED FLAG ALERT' : 'Step ' + (this.currentIndex + 1) + ' of ' + this.questions.length}
          </span>
        </div>

        <!-- Progress Bar -->
        <div style="background: rgba(255,255,255,0.08); height: 5px; border-radius: 4px; overflow: hidden; margin-bottom: 1.25rem;">
          <div style="background: ${isRedAlert ? '#EF4444' : '#0284C7'}; width: ${progressPct}%; height: 100%; transition: width 0.3s ease;"></div>
        </div>

        <!-- Question Prompt -->
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.98rem; font-weight: 700; color: #FFFFFF; line-height: 1.4;">
            ${currentQ.prompt}
          </div>
          ${currentQ.prompt_hi ? `
            <div style="font-size: 0.84rem; color: #94A3B8; margin-top: 4px; line-height: 1.3;">
              ${currentQ.prompt_hi}
            </div>
          ` : ''}
        </div>

        <!-- Answer Options -->
        <div class="question-options-rack" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.25rem;">
          ${currentQ.type === 'scale_0_10' ? `
            <div style="padding: 10px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 0.76rem; color: #94A3B8;">0 (No Discomfort)</span>
                <span style="font-size: 1.1rem; font-weight: 800; color: #38BDF8;">${selectedVal !== undefined ? selectedVal : 5} / 10</span>
                <span style="font-size: 0.76rem; color: #EF4444;">10 (Worst Pain)</span>
              </div>
              <input type="range" min="0" max="10" value="${selectedVal !== undefined ? selectedVal : 5}" 
                     style="width: 100%; accent-color: #0284C7; cursor: pointer;"
                     oninput="window.__qe_change('${currentQ.id}', parseInt(this.value), false)">
            </div>
          ` : (currentQ.options || []).map(opt => {
            const isSelected = currentQ.type === 'multi_choice' 
              ? (Array.isArray(selectedVal) && selectedVal.includes(opt.value))
              : (selectedVal === opt.value);

            return `
              <div class="option-pill-3d ${isSelected ? 'selected' : ''}" 
                   role="${currentQ.type === 'multi_choice' ? 'checkbox' : 'radio'}"
                   aria-checked="${isSelected ? 'true' : 'false'}"
                   tabindex="0"
                   onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.__qe_change('${currentQ.id}', '${opt.value}', ${currentQ.type === 'multi_choice'})}"
                   onclick="window.__qe_change('${currentQ.id}', '${opt.value}', ${currentQ.type === 'multi_choice'})"
                   style="cursor: pointer; min-height: 52px; padding: 12px 16px; border-radius: 10px; border: 1.5px solid ${isSelected ? '#38BDF8' : 'rgba(255,255,255,0.08)'}; background: ${isSelected ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.03)'}; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: ${isSelected ? '0 0 0 1px #38BDF8, 0 4px 12px rgba(2, 132, 199, 0.25)' : 'none'};">
                <div style="flex: 1; padding-right: 12px;">
                  <div style="font-size: 0.88rem; font-weight: 700; color: ${isSelected ? '#FFFFFF' : '#CBD5E1'};">
                    ${opt.label}
                  </div>
                  ${opt.label_hi ? `
                    <div style="font-size: 0.74rem; color: #94A3B8; margin-top: 2px;">
                      ${opt.label_hi}
                    </div>
                  ` : ''}
                </div>
                <div style="width: 24px; height: 24px; border-radius: ${currentQ.type === 'multi_choice' ? '6px' : '50%'}; border: 1.5px solid ${isSelected ? '#38BDF8' : '#64748B'}; background: ${isSelected ? '#0284C7' : 'transparent'}; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 0.8rem; font-weight: bold; flex-shrink: 0;">
                  ${isSelected ? (currentQ.type === 'multi_choice' ? '✓' : '●') : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- In-Question Navigation Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; margin-top: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${this.currentIndex > 0 ? `
              <button type="button" class="btn-3d btn-3d-secondary" style="padding: 6px 14px; font-size: 0.78rem;" 
                      onclick="window.__qe_prev()">
                ‹ Previous Question
              </button>
            ` : `
              <span style="font-size: 0.74rem; color: #64748B; font-weight: 500;">Question 1 of ${this.questions.length}</span>
            `}
            <button type="button" class="btn-3d btn-3d-secondary" style="padding: 6px 12px; font-size: 0.76rem; color: #94A3B8;" 
                    onclick="window.__qe_skip()">
              Skip / Don't Know
            </button>
          </div>

          <button type="button" class="btn-3d ${this.currentIndex === this.questions.length - 1 ? 'btn-3d-success' : 'btn-3d-primary'}" 
                  style="padding: 6px 18px; font-size: 0.8rem;" 
                  onclick="window.__qe_next()">
            ${this.currentIndex === this.questions.length - 1 ? 'Complete Intake ✓' : 'Next Question ›'}
          </button>
        </div>
      </div>
    `;

    // Global window bridges for in-DOM onclick
    window.__qe_change = (qId, val, isMulti) => this.handleAnswerChange(qId, val, isMulti);
    window.__qe_next = () => this.nextQuestion();
    window.__qe_prev = () => this.prevQuestion();
    window.__qe_skip = () => this.skipQuestion();
  }

  destroy() {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
  }
}

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
    const state = bodymapStore.getState();
    this.lastPartsKey = (state.selectedParts || []).join(",");
    const hasSelection = state.selectedParts && state.selectedParts.length > 0;
    this.currentOrganId = state.primarySelectedPart || (hasSelection ? state.selectedParts[0] : null);

    if (this.currentOrganId) {
      this.loadOrganQuestions(this.currentOrganId);
    } else {
      this.questions = [];
      this.currentIndex = 0;
      this.answers = {};
    }

    this.unsubscribeStore = bodymapStore.subscribe((state) => {
      const partsKey = (state.selectedParts || []).join(",");
      if (partsKey !== this.lastPartsKey) {
        this.lastPartsKey = partsKey;
        const hasParts = state.selectedParts && state.selectedParts.length > 0;
        this.currentOrganId = state.primarySelectedPart || (hasParts ? state.selectedParts[0] : null);
        if (this.currentOrganId) {
          this.loadOrganQuestions(this.currentOrganId);
        } else {
          this.questions = [];
          this.currentIndex = 0;
          this.answers = {};
        }
        this.render();
      }
    });

    this.render();
  }

  loadOrganQuestions(organId) {
    if (!organId) {
      this.questions = [];
      return;
    }
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
      <div class="followup-questions-card" style="border: 1.5px solid ${tier.color};">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-light, #E2E8F0); padding-bottom: 10px;">
          <div>
            <span class="pill-3d ${tier.badgeClass}" style="font-size: 0.76rem; font-weight: 800;">
              ${tier.label}
            </span>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary, #0F172A); margin: 6px 0 0 0;">
              Clinical Intake Summary: ${summary.organDisplayName}
            </h3>
          </div>
          <button class="btn-3d btn-3d-secondary" style="padding: 4px 12px; font-size: 0.74rem;" onclick="window.__restart_intake()">
             Edit Answers
          </button>
        </div>

        <div style="background: var(--bg-surface-inset, #F8FAFC); border: 1px solid var(--border-light, #E2E8F0); border-radius: 10px; padding: 12px; margin-bottom: 1rem;">
          <div style="font-size: 0.88rem; color: var(--text-primary, #0F172A); line-height: 1.45;">
            <strong>Recommended Next Step:</strong> ${tier.action}
          </div>
        </div>

        ${triggered.length > 0 ? `
          <div style="margin-bottom: 1rem;">
            <strong style="color: #DC2626; font-size: 0.82rem;">Important Health Notes (${triggered.length}):</strong>
            <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 0.82rem; color: #B91C1C; line-height: 1.4;">
              ${triggered.map(r => `<li>${r.reason}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="unified-flow-footer">
          <span style="font-size: 0.75rem; color: var(--text-muted, #64748B);">
            Pre-consultation check • Not a medical diagnosis
          </span>
          <button class="btn-3d btn-3d-success" style="min-height: 48px; padding: 10px 24px; font-size: 0.84rem; font-weight: 700;" onclick="window.app?.nextStep()">
            Next: Upload Records →
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

    const selectedParts = bodymapStore.getState().selectedParts || [];
    if (!this.currentOrganId || this.questions.length === 0 || selectedParts.length === 0) {
      this.container.innerHTML = `
        <div class="followup-questions-card">
          <div class="question-empty-state-card">
            <div style="font-size: 2.2rem; margin-bottom: 8px;"></div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary, #0F172A); margin: 0 0 6px 0;">Follow-Up Questions</h3>
            <p style="font-size: 0.88rem; color: var(--text-muted, #64748B); margin: 0 auto; max-width: 480px;">
              Select a body part or describe your symptom to begin.
            </p>
          </div>
          <div class="unified-flow-footer">
            <button type="button" class="btn-3d btn-3d-secondary" style="min-height: 48px; padding: 10px 22px; font-weight: 700;" onclick="window.app.prevStep()">
              ← Back to Check-In
            </button>
            <button type="button" class="btn-3d btn-3d-primary" style="min-height: 48px; padding: 10px 26px; font-weight: 700;" onclick="window.app.nextStep()">
              Next: Upload Records →
            </button>
          </div>
        </div>
      `;
      return;
    }

    const organItem = anatomyRegistryService.getById(this.currentOrganId);
    const organBank = ORGAN_QUESTION_BANKS[this.currentOrganId] || ORGAN_QUESTION_BANKS.organ_heart;
    const currentQ = this.questions[this.currentIndex];

    if (!currentQ) return;

    const progressPct = Math.round(((this.currentIndex + 1) / this.questions.length) * 100);
    const selectedVal = this.answers[currentQ.id];
    const isRedAlert = this.latestTriage?.isEmergency;

    this.container.innerHTML = `
      <div class="followup-questions-card" style="border: 1.5px solid ${isRedAlert ? '#EF4444' : 'var(--border-light, #E2E8F0)'};">
        
        <!-- Health Alert Banner -->
        ${isRedAlert ? `
          <div class="emergency-red-flag-banner" role="alert" aria-live="assertive">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.75rem;"></span>
              <div>
                <strong style="font-size: 0.95rem; display: block; letter-spacing: 0.3px;">Important Health Alert</strong>
                <span style="font-size: 0.82rem; color: #7F1D1D;">Based on your answers, please inform hospital staff for quick evaluation.</span>
              </div>
            </div>
            <span class="pill-3d pill-3d-crimson" style="font-weight: 700; font-size: 0.76rem;">Priority Medical Care</span>
          </div>
        ` : ''}

        <!-- Card Header: Title, Selected Region Removable Chips, Progress -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 0.75rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary, #0F172A); margin: 0;">
                Follow-Up Questions
              </h3>
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                ${selectedParts.map(pId => {
                  const item = anatomyRegistryService.getById(pId);
                  const name = item ? item.displayName.en : pId;
                  return `
                    <button type="button" class="pill-3d pill-3d-blue" style="font-size: 0.72rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" onclick="window.__qe_remove_part('${pId}')" title="Remove ${name}">
                      ${name} <span style="font-weight: 900; opacity: 0.8;"></span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <div style="text-align: right;">
            <span class="pill-3d ${isRedAlert ? 'pill-3d-crimson' : 'pill-3d-emerald'}" style="font-size: 0.74rem; font-weight: 700;">
              Step ${this.currentIndex + 1} of ${this.questions.length} (${progressPct}%)
            </span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div style="background: var(--grey-200, #E2E8F0); height: 6px; border-radius: 4px; overflow: hidden; margin-bottom: 1.25rem;">
          <div style="background: ${isRedAlert ? '#EF4444' : 'var(--emerald, #059669)'}; width: ${progressPct}%; height: 100%; transition: width 0.3s ease;"></div>
        </div>

        <!-- Question Prompt (Bilingual: English + Hindi) -->
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary, #0F172A); line-height: 1.45;">
            ${currentQ.prompt}
          </div>
          ${currentQ.prompt_hi ? `
            <div style="font-size: 0.92rem; color: var(--text-secondary, #475569); margin-top: 4px; line-height: 1.4; font-weight: 500;">
              ${currentQ.prompt_hi}
            </div>
          ` : ''}
        </div>

        <!-- Large OptionTiles (min 52px Touch Targets) -->
        <div class="question-options-rack" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 1.25rem;">
          ${currentQ.type === 'scale_0_10' ? `
            <div style="padding: 10px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted, #64748B);">0 (No Discomfort)</span>
                <span style="font-size: 1.25rem; font-weight: 800; color: var(--emerald, #059669); font-family: var(--font-mono, monospace);">${selectedVal !== undefined ? selectedVal : 5} / 10</span>
                <span style="font-size: 0.8rem; font-weight: 600; color: #EF4444;">10 (Worst Pain)</span>
              </div>
              <input type="range" min="0" max="10" value="${selectedVal !== undefined ? selectedVal : 5}" 
                     style="width: 100%; accent-color: var(--emerald, #059669); cursor: pointer;"
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
                   style="cursor: pointer; min-height: 52px; padding: 12px 18px; border-radius: 12px; border: 1.5px solid ${isSelected ? 'var(--emerald, #059669)' : 'var(--border-light, #E2E8F0)'}; background: ${isSelected ? 'var(--emerald-light, #ECFDF5)' : 'var(--bg-surface-inset, #F8FAFC)'}; display: flex; justify-content: space-between; align-items: center; transition: all 0.15s ease; box-shadow: ${isSelected ? '0 0 0 1px var(--emerald, #059669), 0 2px 8px rgba(5, 150, 105, 0.15)' : 'none'};">
                <div style="flex: 1; padding-right: 14px;">
                  <div style="font-size: 0.92rem; font-weight: 700; color: ${isSelected ? 'var(--emerald-dark, #047857)' : 'var(--text-primary, #0F172A)'};">
                    ${opt.label}
                  </div>
                  ${opt.label_hi ? `
                    <div style="font-size: 0.8rem; color: var(--text-secondary, #475569); margin-top: 2px;">
                      ${opt.label_hi}
                    </div>
                  ` : ''}
                </div>
                <div style="width: 26px; height: 26px; border-radius: ${currentQ.type === 'multi_choice' ? '6px' : '50%'}; border: 2px solid ${isSelected ? 'var(--emerald, #059669)' : 'var(--border-medium, #CBD5E1)'}; background: ${isSelected ? 'var(--emerald, #059669)' : 'transparent'}; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 0.82rem; font-weight: bold; flex-shrink: 0;">
                  ${isSelected ? (currentQ.type === 'multi_choice' ? '' : '●') : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Single Unified Footer Row: Back (left), Skip / Don't know (middle), Next (right) -->
        <div class="unified-flow-footer">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button type="button" class="btn-3d btn-3d-secondary" style="min-height: 48px; padding: 10px 22px; font-weight: 700;" 
                    onclick="${this.currentIndex > 0 ? 'window.__qe_prev()' : 'window.app.prevStep()'}">
              ${this.currentIndex > 0 ? '‹ Previous Question' : '← Back to Check-In'}
            </button>
            <button type="button" class="btn-3d btn-3d-secondary" style="min-height: 48px; padding: 10px 18px; color: var(--text-muted, #64748B);" 
                    onclick="window.__qe_skip()">
              Skip / Don't know
            </button>
          </div>

          <button type="button" class="btn-3d ${this.currentIndex === this.questions.length - 1 ? 'btn-3d-success' : 'btn-3d-primary'}" 
                  style="min-height: 48px; padding: 10px 26px; font-weight: 700;" 
                  onclick="${this.currentIndex === this.questions.length - 1 ? 'window.app.nextStep()' : 'window.__qe_next()'}">
            ${this.currentIndex === this.questions.length - 1 ? 'Next: Upload Records →' : 'Next Question ›'}
          </button>
        </div>
      </div>
    `;

    // Global window bridges
    window.__qe_change = (qId, val, isMulti) => this.handleAnswerChange(qId, val, isMulti);
    window.__qe_next = () => this.nextQuestion();
    window.__qe_prev = () => this.prevQuestion();
    window.__qe_skip = () => this.skipQuestion();
    window.__qe_remove_part = (pId) => {
      bodymapStore.togglePart(pId);
    };
  }

  destroy() {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
  }
}


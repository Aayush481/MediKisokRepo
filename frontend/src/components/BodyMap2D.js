/**
 * MediKiosk Interactive 2D Human Skeleton & Visceral Anatomy Map Component
 * Clinical-Grade Layered SVG Anatomy Engine (Anterior & Dorsal Views).
 * Zero WebGL overhead, 60fps on low-end mobile & kiosk terminals, WCAG 2.1 AA accessible.
 * Fully synchronized with bodymapStore, patient-perspective laterality, layer peeling, and pan/zoom.
 * High-definition full skeleton from cranial vault down to distal toe phalanges.
 */

import { ANATOMY_REGISTRY, ANATOMY_SYSTEMS } from "../data/anatomyRegistry.js";
import { bodymapStore } from "../services/bodymapStore.js";

export class BodyMap2D {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;
    this.unsubscribe = null;

    // Viewport & Transform state
    this.currentView = "front"; // "front" (anterior) | "back" (posterior)
    this.displayMode = "skeleton"; // "skeleton" (pure bones) | "combined" (bones + organs) | "organs"
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;

    // Layer peeling & filter
    this.peelLevel = 0.0; // 0.0 (opaque) to 0.85 (peeled anterior viscera)
    this.activeSystem = "all";
    this.multiSelect = false;

    // Bound listeners for clean lifecycle
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  init() {
    this.render();
    this.unsubscribe = bodymapStore.subscribe((state) => {
      this.updateHighlights(state.selectedParts || []);
      this.updateSelectedChips(state.selectedParts || []);
      if (state.activeSystem && state.activeSystem !== this.activeSystem) {
        this.activeSystem = state.activeSystem;
        this._applySystemFilter();
      }
    });
  }

  setView(view) {
    if (this.currentView === view) return;
    this.currentView = view;
    this.render();
  }

  setDisplayMode(mode) {
    if (this.displayMode === mode) return;
    this.displayMode = mode;
    this.render();
  }

  setPeelLevel(val) {
    this.peelLevel = Math.max(0, Math.min(0.85, parseFloat(val) || 0));
    const superficialGroup = this.container?.querySelector("#layer_superficial_organs");
    if (superficialGroup) {
      superficialGroup.style.opacity = (1.0 - this.peelLevel).toFixed(2);
    }
  }

  setSystem(sysId) {
    this.activeSystem = sysId;
    bodymapStore.setSystem(sysId);
    if (sysId === "skeletal") {
      this.displayMode = "skeleton";
    } else if (["circulatory", "digestive", "respiratory", "nervous", "endocrine", "urinary"].includes(sysId)) {
      if (this.displayMode === "skeleton") {
        this.displayMode = "combined";
      }
    }
    this.render();
  }

  _applySystemFilter() {
    if (!this.container) return;
    const nodes = this.container.querySelectorAll(".anatomy-svg-node");
    nodes.forEach(node => {
      const id = node.id;
      const item = ANATOMY_REGISTRY.find(x => x.id === id);
      if (!item) return;

      if (this.activeSystem === "all" || item.system === this.activeSystem) {
        node.style.opacity = "1";
        node.style.pointerEvents = "auto";
      } else {
        node.style.opacity = "0.22";
        node.style.pointerEvents = "auto";
      }
    });

    // Update system chip buttons
    const chips = this.container.querySelectorAll(".system-chip");
    chips.forEach(chip => {
      const isCur = chip.getAttribute("data-sys") === this.activeSystem;
      chip.classList.toggle("active", isCur);
      if (isCur) {
        chip.style.background = "#0284C7";
        chip.style.borderColor = "#38BDF8";
        chip.style.color = "#FFFFFF";
      } else {
        chip.style.background = "rgba(30, 41, 59, 0.7)";
        chip.style.borderColor = "rgba(255, 255, 255, 0.1)";
        chip.style.color = "#94A3B8";
      }
    });
  }

  zoomIn() {
    this.zoom = Math.min(2.5, +(this.zoom + 0.25).toFixed(2));
    this._applyTransform();
  }

  zoomOut() {
    this.zoom = Math.max(0.75, +(this.zoom - 0.25).toFixed(2));
    this._applyTransform();
  }

  resetTransform() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this._applyTransform();
  }

  _applyTransform() {
    const svgContent = this.container?.querySelector("#anatomySvgViewportGroup");
    if (svgContent) {
      svgContent.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    }
  }

  toggleMultiSelect(enabled) {
    this.multiSelect = enabled !== undefined ? enabled : !this.multiSelect;
    const btn = this.container?.querySelector("#btnMultiSelectToggle");
    if (btn) {
      btn.classList.toggle("active", this.multiSelect);
      btn.setAttribute("aria-pressed", this.multiSelect ? "true" : "false");
      btn.style.background = this.multiSelect ? "#0284C7" : "rgba(30, 41, 59, 0.8)";
      btn.style.borderColor = this.multiSelect ? "#38BDF8" : "rgba(255, 255, 255, 0.15)";
      btn.style.color = this.multiSelect ? "#FFFFFF" : "#94A3B8";
      btn.innerHTML = this.multiSelect ? "☑ Multi-Select ON" : "☐ Multi-Select";
    }
  }

  handleRegionClick(regionId) {
    if (!regionId) return;
    const item = ANATOMY_REGISTRY.find(x => x.id === regionId);
    if (item && item.system !== "skeletal" && this.displayMode === "skeleton") {
      this.displayMode = "combined";
      this.render();
    }
    bodymapStore.selectPart(regionId, this.multiSelect);
  }

  render() {
    if (!this.container) return;
    const { selectedParts = [] } = bodymapStore.getState();
    const isFront = this.currentView === "front";
    const currentLang = window.app?.currentLanguage || "en";

    this.container.innerHTML = `
      <div class="bodymap-2d-canvas-wrapper" style="position: relative; background: #070d18; border-radius: 16px; border: 1.5px solid rgba(56, 189, 248, 0.25); overflow: hidden; display: flex; flex-direction: column; width: 100%; user-select: none; box-shadow: 0 10px 32px rgba(0,0,0,0.5);">
        
        <!-- Viewport Top Toolbar -->
        <div style="background: rgba(15, 23, 42, 0.95); padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <!-- Front / Back View Switcher & Display Modes -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div style="background: rgba(30, 41, 59, 0.85); padding: 3px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); display: inline-flex;">
              <button type="button" class="view-toggle-btn ${isFront ? 'active' : ''}" 
                      onclick="window.__bodymap_inst.setView('front')" 
                      aria-pressed="${isFront ? 'true' : 'false'}"
                      style="padding: 5px 12px; font-size: 0.74rem; font-weight: 700; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s ease; ${isFront ? 'background: #0284C7; color: #FFFFFF;' : 'background: transparent; color: #94A3B8;'}">
                🦴 Anterior (Front)
              </button>
              <button type="button" class="view-toggle-btn ${!isFront ? 'active' : ''}" 
                      onclick="window.__bodymap_inst.setView('back')" 
                      aria-pressed="${!isFront ? 'true' : 'false'}"
                      style="padding: 5px 12px; font-size: 0.74rem; font-weight: 700; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s ease; ${!isFront ? 'background: #0284C7; color: #FFFFFF;' : 'background: transparent; color: #94A3B8;'}">
                🦴 Posterior (Back)
              </button>
            </div>

            <!-- View Mode Switcher: Pure Skeleton vs Skeleton+Organs vs Organs -->
            <div style="background: rgba(30, 41, 59, 0.85); padding: 3px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); display: inline-flex;">
              <button type="button" class="mode-toggle-btn ${this.displayMode === 'skeleton' ? 'active' : ''}" 
                      onclick="window.__bodymap_inst.setDisplayMode('skeleton')" 
                      title="Inspect full skeletal framework from skull to feet"
                      style="padding: 5px 10px; font-size: 0.72rem; font-weight: 700; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s ease; ${this.displayMode === 'skeleton' ? 'background: #0284C7; color: #FFFFFF;' : 'background: transparent; color: #94A3B8;'}">
                🦴 Pure Skeleton
              </button>
              <button type="button" class="mode-toggle-btn ${this.displayMode === 'combined' ? 'active' : ''}" 
                      onclick="window.__bodymap_inst.setDisplayMode('combined')" 
                      title="Combined anatomical view: Bones and Visceral Organs"
                      style="padding: 5px 10px; font-size: 0.72rem; font-weight: 700; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s ease; ${this.displayMode === 'combined' ? 'background: #0284C7; color: #FFFFFF;' : 'background: transparent; color: #94A3B8;'}">
                🔬 Bones + Organs
              </button>
              <button type="button" class="mode-toggle-btn ${this.displayMode === 'organs' ? 'active' : ''}" 
                      onclick="window.__bodymap_inst.setDisplayMode('organs')" 
                      title="Visceral internal organ emphasis"
                      style="padding: 5px 10px; font-size: 0.72rem; font-weight: 700; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s ease; ${this.displayMode === 'organs' ? 'background: #0284C7; color: #FFFFFF;' : 'background: transparent; color: #94A3B8;'}">
                🫀 Organs
              </button>
            </div>

            <!-- Multi-Select Toggle -->
            <button type="button" id="btnMultiSelectToggle"
                    style="padding: 5px 10px; font-size: 0.72rem; font-weight: 600; border-radius: 6px; border: 1px solid ${this.multiSelect ? '#38BDF8' : 'rgba(255,255,255,0.15)'}; background: ${this.multiSelect ? '#0284C7' : 'rgba(30, 41, 59, 0.8)'}; color: ${this.multiSelect ? '#FFFFFF' : '#94A3B8'}; cursor: pointer;"
                    onclick="window.__bodymap_inst.toggleMultiSelect()"
                    title="Toggle multi-organ selection mode (up to 5 regions)"
                    aria-pressed="${this.multiSelect ? 'true' : 'false'}">
              ${this.multiSelect ? '☑ Multi-Select ON' : '☐ Multi-Select'}
            </button>
          </div>

          <!-- Layer Peeling & Pan/Zoom Controls -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            ${(isFront && this.displayMode !== 'skeleton') ? `
              <div style="display: flex; align-items: center; gap: 6px; background: rgba(30, 41, 59, 0.7); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                <label for="peelSlider" style="font-size: 0.68rem; color: #38BDF8; font-weight: 700; cursor: pointer;">Peel Organs:</label>
                <input type="range" id="peelSlider" min="0" max="0.85" step="0.05" value="${this.peelLevel}" 
                       oninput="window.__bodymap_inst.setPeelLevel(this.value)"
                       style="width: 75px; accent-color: #0284C7; cursor: pointer;"
                       title="Reduce opacity of superficial organs to easily inspect deep skeleton">
              </div>
            ` : ''}

            <!-- Pan & Zoom Control Buttons -->
            <div style="display: flex; gap: 4px;">
              <button type="button" onclick="window.__bodymap_inst.zoomIn()" title="Zoom In" 
                      style="padding: 4px 9px; font-size: 0.85rem; font-weight: bold; background: rgba(30,41,59,0.85); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer;">+</button>
              <button type="button" onclick="window.__bodymap_inst.zoomOut()" title="Zoom Out" 
                      style="padding: 4px 9px; font-size: 0.85rem; font-weight: bold; background: rgba(30,41,59,0.85); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer;">−</button>
              <button type="button" onclick="window.__bodymap_inst.resetTransform()" title="Reset Pan & Zoom" 
                      style="padding: 4px 9px; font-size: 0.74rem; font-weight: 600; background: rgba(30,41,59,0.85); color: #94A3B8; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer;">⊙ Reset</button>
            </div>
          </div>
        </div>

        <!-- System Layer Filter Rack -->
        <div style="background: rgba(15, 23, 42, 0.75); padding: 6px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;">
          ${ANATOMY_SYSTEMS.map(sys => {
            const isCur = this.activeSystem === sys.id;
            return `
              <button type="button" class="system-chip ${isCur ? 'active' : ''}" data-sys="${sys.id}"
                      onclick="window.__bodymap_inst.setSystem('${sys.id}')"
                      style="padding: 3px 9px; font-size: 0.68rem; font-weight: 600; border-radius: 12px; white-space: nowrap; cursor: pointer; transition: all 0.2s ease; border: 1px solid ${isCur ? '#38BDF8' : 'rgba(255,255,255,0.1)'}; background: ${isCur ? '#0284C7' : 'rgba(30, 41, 59, 0.7)'}; color: ${isCur ? '#FFFFFF' : '#94A3B8'};">
                <span>${sys.icon}</span> ${sys.label}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Laterality Clinical Banner (Strict Patient Perspective) -->
        <div style="background: #0B132B; padding: 5px 14px; border-bottom: 1px solid rgba(56, 189, 248, 0.2); display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem;">
          <span style="color: ${isFront ? '#38BDF8' : '#F59E0B'}; font-weight: 800; letter-spacing: 0.4px;">
            ${isFront 
              ? '◄ PATIENT RIGHT (Viewer Left)  |  PATIENT LEFT (Viewer Right) ►' 
              : '◄ PATIENT LEFT (Viewer Left)  |  PATIENT RIGHT (Viewer Right) ►'}
          </span>
          <span style="color: #CBD5E1; font-weight: 600;">
            ${isFront ? 'Full-Body Skeletal Framework (Head to Feet)' : 'Dorsal Spine & Retroperitoneal Anatomy'}
          </span>
        </div>

        <!-- Accessible List Alternative Selector (WCAG 2.1 AA) -->
        <div style="padding: 6px 14px; background: rgba(15, 23, 42, 0.85); border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 8px;">
          <label for="accessibleOrganSelector" style="font-size: 0.72rem; color: #94A3B8; white-space: nowrap;">Accessible Dropdown:</label>
          <select id="accessibleOrganSelector" class="accessible-organ-dropdown" 
                  onchange="window.__bodymap_inst.handleRegionClick(this.value)"
                  style="flex: 1; background: #1E293B; color: #F8FAFC; border: 1px solid #334155; border-radius: 6px; padding: 4px 8px; font-size: 0.74rem;">
            <option value="">-- Choose bone, joint or organ from accessible list --</option>
            ${ANATOMY_REGISTRY.map(item => `
              <option value="${item.id}" ${selectedParts.includes(item.id) ? 'selected' : ''}>
                ${item.displayName[currentLang] || item.displayName.en} (${item.laterality.toUpperCase()}) - ${item.system.toUpperCase()}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- SVG Anatomy Canvas (ViewBox: 0 0 360 720, Golden Anatomical Proportion, Zero Clipping) -->
        <div class="anatomy-svg-container" style="flex: 1; height: 620px; min-height: 560px; max-height: 660px; width: 100%; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 35%, #0d1e36 0%, #060c18 90%); cursor: default;">
          
          <svg id="anatomySvgMap" viewBox="0 0 360 720" preserveAspectRatio="xMidYMid meet"
               style="height: 100%; max-height: 100%; width: auto; max-width: 100%; display: block; margin: 0 auto; filter: drop-shadow(0 8px 24px rgba(0,0,0,0.7));"
               xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Interactive Full Human Skeleton and Anatomy Map From Head to Feet">
            
            <defs>
              <!-- Luminous selection glow filters -->
              <filter id="selectionGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <!-- Bone texture gradients for clinical fidelity -->
              <linearGradient id="boneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#F8FAFC" />
                <stop offset="50%" stop-color="#E2E8F0" />
                <stop offset="100%" stop-color="#94A3B8" />
              </linearGradient>

              <linearGradient id="boneShaftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#94A3B8" />
                <stop offset="50%" stop-color="#F1F5F9" />
                <stop offset="100%" stop-color="#CBD5E1" />
              </linearGradient>

              <linearGradient id="jointGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.9" />
                <stop offset="100%" stop-color="#0284C7" stop-opacity="0.95" />
              </linearGradient>

              <!-- Striped Hatch Pattern for High-Contrast Non-Color Accessibility -->
              <pattern id="accessibleHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#38BDF8" stroke-width="2.2" opacity="0.85" />
              </pattern>
            </defs>

            <g id="anatomySvgViewportGroup" transform="translate(0, 0) scale(1)">
              ${isFront ? this._renderFrontViewSVG(selectedParts) : this._renderBackViewSVG(selectedParts)}
            </g>
          </svg>

          <!-- Interactive Hover Tooltip Overlay -->
          <div id="anatomyHoverTooltip" style="position: absolute; display: none; pointer-events: none; background: rgba(15, 23, 42, 0.95); border: 1.5px solid #38BDF8; color: #FFFFFF; padding: 7px 12px; border-radius: 8px; font-size: 0.72rem; box-shadow: 0 8px 24px rgba(0,0,0,0.7); z-index: 100; max-width: 260px;"></div>
        </div>

        <!-- Selected Anatomical Chips Rack -->
        <div id="bodymapSelectedChipsRack" style="background: rgba(15, 23, 42, 0.95); padding: 8px 14px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span style="font-size: 0.72rem; color: #94A3B8; font-weight: 700;">Selected Site(s):</span>
          ${this._renderSelectedChips(selectedParts)}
        </div>
      </div>
    `;

    // Attach global window bridge for SVG elements
    window.__bodymap_inst = this;
    window.__bodymap_select = (id) => this.handleRegionClick(id);

    this._bindInteractiveEvents();
    this._applySystemFilter();
  }

  _renderFrontViewSVG(selectedParts) {
    const isSkeletonOnly = this.displayMode === "skeleton";
    const isOrgansOnly = this.displayMode === "organs";
    const boneBaseOpacity = isOrgansOnly ? 0.3 : 1.0;
    const organVisibility = isSkeletonOnly ? "display: none;" : "display: block;";
    const peelOp = isSkeletonOnly ? 0 : (1.0 - this.peelLevel).toFixed(2);

    return `
      <!-- ============================================================ -->
      <!-- 1. DETAILED ANATOMICAL SKELETON (CRANIUM TO TOES)            -->
      <!-- ============================================================ -->
      <g id="layer_skeleton_base" style="opacity: ${boneBaseOpacity}; transition: opacity 0.25s ease;">
        <!-- Body Silhouette Background Guide -->
        <path d="M 180,18 C 160,18 146,34 146,62 C 146,88 156,102 166,108 
                 C 134,114 104,134 96,178 C 84,222 68,318 68,335 C 68,342 78,346 84,340 
                 C 98,320 114,240 120,218 C 120,256 116,316 122,380 C 130,442 126,512 148,605 
                 C 152,624 140,642 134,660 C 130,670 144,676 156,672 C 166,668 170,648 170,612 
                 C 172,570 174,472 180,335 C 186,472 188,570 190,612 
                 C 190,648 194,668 204,672 C 216,676 230,670 226,660 
                 C 220,642 208,624 212,605 C 234,512 230,442 238,380 
                 C 244,316 240,256 240,218 C 246,240 262,320 276,340 
                 C 282,346 292,342 292,335 C 292,318 276,222 264,178 
                 C 256,134 226,114 194,108 C 204,102 214,88 214,62 
                 C 214,34 200,18 180,18 Z"
              fill="#060e1b" stroke="#1e293b" stroke-width="1.6" />

        <!-- Skull (Cranium, Facial Skeleton, Zygoma, Maxilla, Mandible) -->
        <g id="skel_skull" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_skull')" 
           tabindex="0" role="button" aria-label="Skull, Cranium & Facial Skeleton"
           style="cursor: pointer;">
          <!-- Neurocranium (Cranial Vault Dome) -->
          <path d="M 154,54 C 154,30 165,20 180,20 C 195,20 206,30 206,54 C 206,66 201,76 198,82 C 193,86 187,88 180,88 C 173,88 167,86 162,82 C 159,76 154,66 154,54 Z"
                fill="${this._fillColor('skel_skull', 'url(#boneGradient)', selectedParts)}" 
                stroke="${this._strokeColor('skel_skull', '#FFFFFF', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_skull', 1.8, selectedParts)}" />
          
          <!-- Coronal & Sagittal Suture Lines -->
          <path d="M 164,34 Q 180,42 196,34" stroke="#64748B" stroke-width="1" fill="none" stroke-dasharray="2,2"/>
          <line x1="180" y1="20" x2="180" y2="38" stroke="#64748B" stroke-width="1" stroke-dasharray="2,2"/>

          <!-- Supraorbital Ridge & Glabella -->
          <path d="M 158,49 Q 168,46 177,50 M 183,50 Q 192,46 202,49" stroke="#475569" stroke-width="1.6" fill="none"/>

          <!-- Orbital Cavities (Eye Sockets) -->
          <ellipse cx="168" cy="55" rx="7.5" ry="8.5" fill="#060e1b" stroke="#64748B" stroke-width="1.4"/>
          <circle cx="168" cy="55" r="2.8" fill="#1e293b"/>
          <ellipse cx="192" cy="55" rx="7.5" ry="8.5" fill="#060e1b" stroke="#64748B" stroke-width="1.4"/>
          <circle cx="192" cy="55" r="2.8" fill="#1e293b"/>

          <!-- Piriform Aperture (Nasal Cavity & Septum) -->
          <polygon points="180,62 175,73 180,76 185,73" fill="#060e1b" stroke="#64748B" stroke-width="1.2"/>
          <line x1="180" y1="63" x2="180" y2="75" stroke="#94A3B8" stroke-width="1.2"/>

          <!-- Zygomatic Arches (Cheekbones) -->
          <path d="M 155,60 Q 148,64 155,74" stroke="#94A3B8" stroke-width="2.2" fill="none"/>
          <path d="M 205,60 Q 212,64 205,74" stroke="#94A3B8" stroke-width="2.2" fill="none"/>

          <!-- Maxilla & Upper Dental Arch (Teeth) -->
          <path d="M 169,76 Q 180,80 191,76" stroke="#475569" stroke-width="1.5" fill="none"/>
          <line x1="171" y1="79" x2="189" y2="79" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="2.5,1"/>

          <!-- Mandible (Jawbone & Chin) -->
          <path d="M 158,74 L 160,84 Q 166,95 180,96 Q 194,95 200,84 L 202,74" 
                fill="${this._fillColor('skel_skull', '#CBD5E1', selectedParts)}" 
                stroke="${this._strokeColor('skel_skull', '#E2E8F0', selectedParts)}" 
                stroke-width="1.6"/>
          <!-- Lower Dental Arch & Mental Protuberance -->
          <line x1="172" y1="83" x2="188" y2="83" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="2.5,1"/>
          <circle cx="180" cy="91" r="2.2" fill="#94A3B8"/>
        </g>

        <!-- Cervical Spine (C1-C7 Vertebrae & Intervertebral Discs) -->
        <g id="skel_spine_cervical" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_cervical')" 
           tabindex="0" role="button" aria-label="Cervical Spine Neck C1-C7" style="cursor: pointer;">
          <!-- Atlas (C1) and Axis (C2) -->
          <rect x="175" y="97" width="10" height="3.5" rx="1.5" fill="#E2E8F0" stroke="#64748B" stroke-width="1"/>
          <rect x="174" y="102" width="12" height="3.5" rx="1.5" fill="#CBD5E1" stroke="#64748B" stroke-width="1"/>
          <!-- C3-C7 Vertebral Bodies -->
          <rect x="173" y="107" width="14" height="3.5" rx="1.5" fill="#CBD5E1" stroke="#64748B" stroke-width="1"/>
          <rect x="173" y="112" width="14" height="3.5" rx="1.5" fill="#CBD5E1" stroke="#64748B" stroke-width="1"/>
          <rect x="172" y="117" width="16" height="4.5" rx="1.5" 
                fill="${this._fillColor('skel_spine_cervical', '#E2E8F0', selectedParts)}" 
                stroke="${this._strokeColor('skel_spine_cervical', '#38BDF8', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_spine_cervical', 1.4, selectedParts)}"/>
        </g>

        <!-- Bilateral S-Curved Clavicles (Collar Bones) -->
        <path d="M 177,124 Q 148,118 118,134" stroke="#E2E8F0" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <path d="M 183,124 Q 212,118 242,134" stroke="#E2E8F0" stroke-width="4.5" fill="none" stroke-linecap="round"/>

        <!-- Thoracic Cage (12 Pairs of Ribs, Costal Cartilages & Sternum) -->
        <g id="skel_ribcage" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_ribcage')" 
           tabindex="0" role="button" aria-label="Ribcage and Sternum" style="cursor: pointer;">
          
          <!-- Sternum: Manubrium, Angle of Louis, Sternal Body, Xiphoid -->
          <polygon points="176,125 184,125 186,136 174,136" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.2"/>
          <line x1="174" y1="136" x2="186" y2="136" stroke="#38BDF8" stroke-width="1.5"/>
          <rect x="177" y="137" width="6" height="38" rx="1.5" 
                fill="${this._fillColor('skel_ribcage', '#CBD5E1', selectedParts)}" 
                stroke="${this._strokeColor('skel_ribcage', '#FFFFFF', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_ribcage', 1.6, selectedParts)}" />
          <line x1="177" y1="147" x2="183" y2="147" stroke="#94A3B8" stroke-width="1"/>
          <line x1="177" y1="157" x2="183" y2="157" stroke="#94A3B8" stroke-width="1"/>
          <line x1="177" y1="167" x2="183" y2="167" stroke="#94A3B8" stroke-width="1"/>
          <!-- Xiphoid Process -->
          <polygon points="178,175 182,175 180,184" fill="#94A3B8" stroke="#64748B" stroke-width="1"/>

          <!-- 12 Pairs of Curving Ribs -->
          <!-- Rib Pair 1 -->
          <path d="M 175,126 Q 144,128 132,139 Q 166,143 175,132" fill="none" stroke="#CBD5E1" stroke-width="2.5"/>
          <path d="M 185,126 Q 216,128 228,139 Q 194,143 185,132" fill="none" stroke="#CBD5E1" stroke-width="2.5"/>
          <!-- Rib Pair 2 -->
          <path d="M 175,134 Q 136,138 126,152 Q 168,158 176,142" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <path d="M 185,134 Q 224,138 234,152 Q 192,158 184,142" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <!-- Rib Pair 3 -->
          <path d="M 175,142 Q 128,148 122,164 Q 168,171 176,150" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <path d="M 185,142 Q 232,148 238,164 Q 192,171 184,150" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <!-- Rib Pair 4 -->
          <path d="M 175,150 Q 124,159 120,177 Q 168,185 176,159" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <path d="M 185,150 Q 236,159 240,177 Q 192,185 184,159" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <!-- Rib Pair 5 -->
          <path d="M 175,158 Q 122,169 118,189 Q 168,197 176,168" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <path d="M 185,158 Q 238,169 242,189 Q 192,197 184,168" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <!-- Rib Pair 6 -->
          <path d="M 175,166 Q 122,179 120,201 Q 168,205 176,176" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <path d="M 185,166 Q 238,179 240,201 Q 192,205 184,176" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <!-- Rib Pair 7 -->
          <path d="M 175,174 Q 124,190 122,211 Q 166,211 176,183" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <path d="M 185,174 Q 236,190 238,211 Q 194,211 184,183" fill="none" stroke="#94A3B8" stroke-width="2.3"/>
          <!-- False Ribs 8, 9, 10 -->
          <path d="M 124,215 Q 152,217 176,183" fill="none" stroke="#64748B" stroke-width="2" stroke-dasharray="3,1"/>
          <path d="M 236,215 Q 208,217 184,183" fill="none" stroke="#64748B" stroke-width="2" stroke-dasharray="3,1"/>
          <path d="M 128,220 Q 156,221 176,185" fill="none" stroke="#64748B" stroke-width="2" stroke-dasharray="3,1"/>
          <path d="M 232,220 Q 204,221 184,185" fill="none" stroke="#64748B" stroke-width="2" stroke-dasharray="3,1"/>
          <!-- Floating Ribs 11 & 12 -->
          <path d="M 132,224 Q 148,228 158,226" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round"/>
          <path d="M 228,224 Q 212,228 202,226" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round"/>
        </g>

        <!-- Thoracic Spine (Behind Sternum T1-T12) -->
        <g id="skel_spine_thoracic" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_thoracic')" 
           tabindex="0" role="button" aria-label="Thoracic Spine Mid Back" style="cursor: pointer;">
          <line x1="180" y1="124" x2="180" y2="224" 
                stroke="${this._strokeColor('skel_spine_thoracic', '#64748B', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_spine_thoracic', 3.6, selectedParts)}" stroke-dasharray="4,2" />
        </g>

        <!-- Lumbar Spine (L1-L5 Massive Vertebrae & Discs) -->
        <g id="skel_spine_lumbar" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_lumbar')" 
           tabindex="0" role="button" aria-label="Lumbar Spine Lower Back L1-L5" style="cursor: pointer;">
          <rect x="174" y="226" width="12" height="42" rx="2.5" 
                fill="${this._fillColor('skel_spine_lumbar', '#475569', selectedParts)}" 
                stroke="${this._strokeColor('skel_spine_lumbar', '#38BDF8', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_spine_lumbar', 1.8, selectedParts)}" />
          <!-- Individual L1-L5 Intervertebral Discs -->
          <line x1="174" y1="234" x2="186" y2="234" stroke="#CBD5E1" stroke-width="1.3"/>
          <line x1="174" y1="242" x2="186" y2="242" stroke="#CBD5E1" stroke-width="1.3"/>
          <line x1="174" y1="250" x2="186" y2="250" stroke="#CBD5E1" stroke-width="1.3"/>
          <line x1="174" y1="258" x2="186" y2="258" stroke="#CBD5E1" stroke-width="1.3"/>
        </g>

        <!-- Pelvic Girdle (Iliac Crests, Pubis, Ischium, Acetabulum) -->
        <g id="skel_pelvis" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_pelvis')" 
           tabindex="0" role="button" aria-label="Pelvis and Iliac Crests" style="cursor: pointer;">
          <!-- Flared Iliac Blades & Crests -->
          <path d="M 136,272 C 142,264 164,268 180,281 C 196,268 218,264 224,272 
                   C 230,284 224,310 212,314 C 198,318 188,314 180,313 C 172,314 162,318 148,314 
                   C 136,310 130,284 136,272 Z" 
                fill="${this._fillColor('skel_pelvis', '#334155', selectedParts)}" 
                stroke="${this._strokeColor('skel_pelvis', '#E2E8F0', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_pelvis', 1.8, selectedParts)}" />
          
          <!-- Iliac Crest Upper Edge Ridge -->
          <path d="M 138,273 Q 158,266 178,279" fill="none" stroke="#FFFFFF" stroke-width="1.6"/>
          <path d="M 222,273 Q 202,266 182,279" fill="none" stroke="#FFFFFF" stroke-width="1.6"/>

          <!-- Bilateral Obturator Foramina -->
          <ellipse cx="168" cy="303" rx="5" ry="6" fill="#060e1b" stroke="#64748B" stroke-width="1.2"/>
          <ellipse cx="192" cy="303" rx="5" ry="6" fill="#060e1b" stroke="#64748B" stroke-width="1.2"/>

          <!-- Pubic Symphysis Central Fibrocartilage Disc -->
          <rect x="178.5" y="309" width="3" height="6" rx="1.2" fill="#38BDF8"/>
        </g>

        <!-- Sacrum & Coccyx (S1-S5 & Foramina) -->
        <g id="skel_spine_sacrum" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_sacrum')" 
           tabindex="0" role="button" aria-label="Sacrum and Coccyx" style="cursor: pointer;">
          <polygon points="174,272 186,272 181,301 179,301" 
                   fill="${this._fillColor('skel_spine_sacrum', '#475569', selectedParts)}" 
                   stroke="${this._strokeColor('skel_spine_sacrum', '#38BDF8', selectedParts)}" 
                   stroke-width="${this._strokeWidth('skel_spine_sacrum', 1.6, selectedParts)}" />
          <!-- Sacral Foramina Dots -->
          <circle cx="178" cy="279" r="1.1" fill="#E2E8F0"/>
          <circle cx="182" cy="279" r="1.1" fill="#E2E8F0"/>
          <circle cx="178.5" cy="287" r="1.1" fill="#E2E8F0"/>
          <circle cx="181.5" cy="287" r="1.1" fill="#E2E8F0"/>
          <!-- Coccyx Terminal Segments -->
          <ellipse cx="180" cy="304" rx="1.8" ry="3" fill="#CBD5E1"/>
        </g>

        <!-- Upper Limbs: Humerus, Forearms (Radius & Ulna), Hands -->
        <!-- Right Arm (Patient Right / Viewer Left) -->
        <path d="M 118,138 Q 114,170 105,214" stroke="#CBD5E1" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M 102,220 Q 96,260 88,300" stroke="#CBD5E1" stroke-width="3.8" stroke-linecap="round"/>
        <path d="M 107,220 Q 101,260 93,300" stroke="#94A3B8" stroke-width="3.2" stroke-linecap="round"/>
        <!-- Hand / Metacarpals & Phalanges -->
        <path d="M 89,304 L 80,332 M 91,304 L 84,334 M 93,304 L 88,333 M 95,304 L 92,328" stroke="#CBD5E1" stroke-width="1.8" stroke-linecap="round"/>

        <!-- Left Arm (Patient Left / Viewer Right) -->
        <path d="M 242,138 Q 246,170 255,214" stroke="#CBD5E1" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M 258,220 Q 264,260 272,300" stroke="#CBD5E1" stroke-width="3.8" stroke-linecap="round"/>
        <path d="M 253,220 Q 259,260 267,300" stroke="#94A3B8" stroke-width="3.2" stroke-linecap="round"/>
        <!-- Hand / Metacarpals & Phalanges -->
        <path d="M 271,304 L 280,332 M 269,304 L 276,334 M 267,304 L 272,333 M 265,304 L 268,328" stroke="#CBD5E1" stroke-width="1.8" stroke-linecap="round"/>

        <!-- ============================================================ -->
        <!-- LOWER LIMBS (HEAD TO FEET: FEMURS, KNEES, SHINS, ANKLES, TOES)-->
        <!-- ============================================================ -->
        <!-- Right Leg (Patient Right / Viewer Left) -->
        <!-- Femur (Thigh Bone: Head, Neck, Shaft, Condyles) -->
        <path d="M 156,308 Q 150,370 146,442" stroke="url(#boneShaftGrad)" stroke-width="8" stroke-linecap="round"/>
        <ellipse cx="146" cy="446" rx="6" ry="3.5" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1"/> <!-- Femoral Condyles -->
        <!-- Patella (Kneecap) -->
        <path d="M 141,446 L 151,446 L 146,456 Z" fill="#F8FAFC" stroke="#38BDF8" stroke-width="1.4"/>

        <!-- Tibia (Thick Medial Shin Bone) & Fibula (Slender Lateral Strut) -->
        <path d="M 146,458 L 144,598" stroke="url(#boneShaftGrad)" stroke-width="6" stroke-linecap="round"/>
        <path d="M 137,466 L 135,594" stroke="#64748B" stroke-width="2.8" stroke-linecap="round"/>
        <!-- Medial & Lateral Malleoli (Ankle Bones) -->
        <circle cx="143" cy="602" r="3" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/>
        <circle cx="134" cy="600" r="2.2" fill="#94A3B8"/>

        <!-- Right Foot & Toes (Calcaneus Heel, Tarsus, Metatarsus & Individual Toes) -->
        <!-- Heel / Calcaneus -->
        <ellipse cx="144" cy="610" rx="5" ry="6" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.2"/>
        <!-- 5 Metatarsals Spreading Forward -->
        <line x1="144" y1="616" x2="148" y2="648" stroke="#E2E8F0" stroke-width="2.6" stroke-linecap="round"/>
        <line x1="141" y1="616" x2="142" y2="650" stroke="#CBD5E1" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="138" y1="617" x2="136" y2="648" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/>
        <line x1="135" y1="617" x2="131" y2="646" stroke="#94A3B8" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="132" y1="618" x2="126" y2="644" stroke="#94A3B8" stroke-width="1.6" stroke-linecap="round"/>
        <!-- 5 Individual Toe Phalanges (Distal Tips) -->
        <circle cx="149" cy="656" r="3.2" fill="#F8FAFC" stroke="#38BDF8" stroke-width="1"/> <!-- Big Toe (Hallux) -->
        <circle cx="142" cy="657" r="2.4" fill="#E2E8F0"/> <!-- 2nd Toe -->
        <circle cx="135" cy="654" r="2.2" fill="#CBD5E1"/> <!-- 3rd Toe -->
        <circle cx="129" cy="651" r="2.0" fill="#CBD5E1"/> <!-- 4th Toe -->
        <circle cx="124" cy="648" r="1.8" fill="#94A3B8"/> <!-- Little Toe -->

        <!-- Left Leg (Patient Left / Viewer Right) -->
        <!-- Femur (Thigh Bone) -->
        <path d="M 204,308 Q 210,370 214,442" stroke="url(#boneShaftGrad)" stroke-width="8" stroke-linecap="round"/>
        <ellipse cx="214" cy="446" rx="6" ry="3.5" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1"/> <!-- Femoral Condyles -->
        <!-- Patella (Kneecap) -->
        <path d="M 209,446 L 219,446 L 214,456 Z" fill="#F8FAFC" stroke="#38BDF8" stroke-width="1.4"/>

        <!-- Tibia & Fibula -->
        <path d="M 214,458 L 216,598" stroke="url(#boneShaftGrad)" stroke-width="6" stroke-linecap="round"/>
        <path d="M 223,466 L 225,594" stroke="#64748B" stroke-width="2.8" stroke-linecap="round"/>
        <!-- Medial & Lateral Malleoli -->
        <circle cx="217" cy="602" r="3" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/>
        <circle cx="226" cy="600" r="2.2" fill="#94A3B8"/>

        <!-- Left Foot & Toes -->
        <!-- Heel / Calcaneus -->
        <ellipse cx="216" cy="610" rx="5" ry="6" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.2"/>
        <!-- 5 Metatarsals -->
        <line x1="216" y1="616" x2="212" y2="648" stroke="#E2E8F0" stroke-width="2.6" stroke-linecap="round"/>
        <line x1="219" y1="616" x2="218" y2="650" stroke="#CBD5E1" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="222" y1="617" x2="224" y2="648" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/>
        <line x1="225" y1="617" x2="229" y2="646" stroke="#94A3B8" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="228" y1="618" x2="234" y2="644" stroke="#94A3B8" stroke-width="1.6" stroke-linecap="round"/>
        <!-- 5 Individual Toe Phalanges -->
        <circle cx="211" cy="656" r="3.2" fill="#F8FAFC" stroke="#38BDF8" stroke-width="1"/> <!-- Big Toe (Hallux) -->
        <circle cx="218" cy="657" r="2.4" fill="#E2E8F0"/> <!-- 2nd Toe -->
        <circle cx="225" cy="654" r="2.2" fill="#CBD5E1"/> <!-- 3rd Toe -->
        <circle cx="231" cy="651" r="2.0" fill="#CBD5E1"/> <!-- 4th Toe -->
        <circle cx="236" cy="648" r="1.8" fill="#94A3B8"/> <!-- Little Toe -->
      </g>

      <!-- ============================================================ -->
      <!-- 2. MAJOR ARTICULAR JOINTS (Interactive Clickable Nodes)       -->
      <!-- ============================================================ -->
      <g id="layer_major_joints">
        <!-- Shoulder Joints (Glenohumeral) -->
        <circle id="joint_shoulder_r" cx="118" cy="138" r="10" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_shoulder_r')"
                fill="${this._fillColor('joint_shoulder_r', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_shoulder_r', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_shoulder_r', 2.2, selectedParts)}"
                tabindex="0" role="button" aria-label="Right Shoulder Joint" style="cursor: pointer;" />
        
        <circle id="joint_shoulder_l" cx="242" cy="138" r="10" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_shoulder_l')"
                fill="${this._fillColor('joint_shoulder_l', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_shoulder_l', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_shoulder_l', 2.2, selectedParts)}"
                tabindex="0" role="button" aria-label="Left Shoulder Joint" style="cursor: pointer;" />

        <!-- Elbow Joints (Humeroulnar & Humeroradial) -->
        <circle id="joint_elbow_r" cx="105" cy="216" r="8.5" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_elbow_r')"
                fill="${this._fillColor('joint_elbow_r', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_elbow_r', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_elbow_r', 2, selectedParts)}"
                tabindex="0" role="button" aria-label="Right Elbow Joint" style="cursor: pointer;" />
        <circle id="joint_elbow_l" cx="255" cy="216" r="8.5" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_elbow_l')"
                fill="${this._fillColor('joint_elbow_l', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_elbow_l', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_elbow_l', 2, selectedParts)}"
                tabindex="0" role="button" aria-label="Left Elbow Joint" style="cursor: pointer;" />

        <!-- Wrist Joints (Radiocarpal) -->
        <circle id="joint_wrist_r" cx="90" cy="302" r="7.5" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_wrist_r')"
                fill="${this._fillColor('joint_wrist_r', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_wrist_r', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_wrist_r', 1.8, selectedParts)}"
                tabindex="0" role="button" aria-label="Right Wrist Joint" style="cursor: pointer;" />
        <circle id="joint_wrist_l" cx="270" cy="302" r="7.5" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_wrist_l')"
                fill="${this._fillColor('joint_wrist_l', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_wrist_l', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_wrist_l', 1.8, selectedParts)}"
                tabindex="0" role="button" aria-label="Left Wrist Joint" style="cursor: pointer;" />

        <!-- Hip Joints (Acetabulofemoral) -->
        <circle id="joint_hip_r" cx="156" cy="307" r="11" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_hip_r')"
                fill="${this._fillColor('joint_hip_r', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_hip_r', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_hip_r', 2.2, selectedParts)}"
                tabindex="0" role="button" aria-label="Right Hip Joint" style="cursor: pointer;" />
        <circle id="joint_hip_l" cx="204" cy="307" r="11" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_hip_l')"
                fill="${this._fillColor('joint_hip_l', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_hip_l', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_hip_l', 2.2, selectedParts)}"
                tabindex="0" role="button" aria-label="Left Hip Joint" style="cursor: pointer;" />

        <!-- Knee Joints (Patellofemoral & Tibiofemoral) -->
        <circle id="joint_knee_r" cx="146" cy="452" r="13" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_knee_r')"
                fill="${this._fillColor('joint_knee_r', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_knee_r', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_knee_r', 2.4, selectedParts)}"
                tabindex="0" role="button" aria-label="Right Knee Joint" style="cursor: pointer;" />
        <circle id="joint_knee_l" cx="214" cy="452" r="13" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_knee_l')"
                fill="${this._fillColor('joint_knee_l', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_knee_l', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_knee_l', 2.4, selectedParts)}"
                tabindex="0" role="button" aria-label="Left Knee Joint" style="cursor: pointer;" />

        <!-- Ankle Joints (Talocrural) -->
        <circle id="joint_ankle_r" cx="144" cy="606" r="10" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_ankle_r')"
                fill="${this._fillColor('joint_ankle_r', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_ankle_r', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_ankle_r', 2, selectedParts)}"
                tabindex="0" role="button" aria-label="Right Ankle Joint" style="cursor: pointer;" />
        <circle id="joint_ankle_l" cx="216" cy="606" r="10" 
                class="anatomy-svg-node" onclick="window.__bodymap_select('joint_ankle_l')"
                fill="${this._fillColor('joint_ankle_l', 'url(#jointGradient)', selectedParts)}"
                stroke="${this._strokeColor('joint_ankle_l', '#38BDF8', selectedParts)}"
                stroke-width="${this._strokeWidth('joint_ankle_l', 2, selectedParts)}"
                tabindex="0" role="button" aria-label="Left Ankle Joint" style="cursor: pointer;" />
      </g>

      <!-- ============================================================ -->
      <!-- 3. DEEP VISCERAL ORGANS (Accessible when Peel/Combined Active) -->
      <!-- ============================================================ -->
      <g id="layer_deep_organs" style="${organVisibility}">
        <!-- Gallbladder (Right Upper Quadrant Under Liver Bed) -->
        <g id="organ_gallbladder" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_gallbladder')"
           tabindex="0" role="button" aria-label="Gallbladder, Right Upper Quadrant" style="cursor: pointer;">
          <ellipse cx="156" cy="238" rx="8" ry="12" 
                   fill="${this._fillColor('organ_gallbladder', '#16A34A', selectedParts)}" 
                   stroke="${this._strokeColor('organ_gallbladder', '#4ADE80', selectedParts)}" 
                   stroke-width="${this._strokeWidth('organ_gallbladder', 2.2, selectedParts)}" />
        </g>

        <!-- Pancreas (Retroperitoneal Behind Stomach) -->
        <g id="organ_pancreas" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_pancreas')"
           tabindex="0" role="button" aria-label="Pancreas, Epigastric / Transverse" style="cursor: pointer;">
          <path d="M 158,234 Q 182,228 206,236 Q 202,244 158,241 Z" 
                fill="${this._fillColor('organ_pancreas', '#CA8A04', selectedParts)}" 
                stroke="${this._strokeColor('organ_pancreas', '#FDE047', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_pancreas', 2.2, selectedParts)}" />
        </g>

        <!-- Spleen (Posterior Lateral Left Upper Quadrant) -->
        <g id="organ_spleen" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_spleen')"
           tabindex="0" role="button" aria-label="Spleen, Left Upper Quadrant" style="cursor: pointer;">
          <ellipse cx="222" cy="214" rx="11" ry="15" 
                   fill="${this._fillColor('organ_spleen', '#831843', selectedParts)}" 
                   stroke="${this._strokeColor('organ_spleen', '#F472B6', selectedParts)}" 
                   stroke-width="${this._strokeWidth('organ_spleen', 2.2, selectedParts)}" />
        </g>

        <!-- Bilateral Kidneys & Ureters (Faint outlines accessible in Front) -->
        <g id="organ_kidney_r" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_kidney_r')"
           tabindex="0" role="button" aria-label="Right Kidney" style="cursor: pointer;">
          <ellipse cx="150" cy="238" rx="10" ry="16" 
                   fill="${this._fillColor('organ_kidney_r', '#7F1D1D', selectedParts, 0.4)}" 
                   stroke="${this._strokeColor('organ_kidney_r', '#EF4444', selectedParts)}" 
                   stroke-width="${this._strokeWidth('organ_kidney_r', 1.8, selectedParts)}" opacity="0.8" />
        </g>
        <g id="organ_kidney_l" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_kidney_l')"
           tabindex="0" role="button" aria-label="Left Kidney" style="cursor: pointer;">
          <ellipse cx="210" cy="232" rx="10" ry="16" 
                   fill="${this._fillColor('organ_kidney_l', '#7F1D1D', selectedParts, 0.4)}" 
                   stroke="${this._strokeColor('organ_kidney_l', '#EF4444', selectedParts)}" 
                   stroke-width="${this._strokeWidth('organ_kidney_l', 1.8, selectedParts)}" opacity="0.8" />
        </g>
        <!-- Ureters Descending -->
        <g id="organ_ureter_r" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_ureter_r')" style="cursor: pointer;">
          <line x1="150" y1="254" x2="172" y2="298" stroke="${this._strokeColor('organ_ureter_r', '#EAB308', selectedParts)}" stroke-width="${this._strokeWidth('organ_ureter_r', 2.2, selectedParts)}" stroke-dasharray="3,2" />
        </g>
        <g id="organ_ureter_l" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_ureter_l')" style="cursor: pointer;">
          <line x1="210" y1="248" x2="188" y2="298" stroke="${this._strokeColor('organ_ureter_l', '#EAB308', selectedParts)}" stroke-width="${this._strokeWidth('organ_ureter_l', 2.2, selectedParts)}" stroke-dasharray="3,2" />
        </g>
      </g>

      <!-- ============================================================ -->
      <!-- 4. SUPERFICIAL VISCERAL ORGANS (Peelable via Slider)          -->
      <!-- ============================================================ -->
      <g id="layer_superficial_organs" style="${organVisibility} opacity: ${peelOp}; transition: opacity 0.25s ease;">
        
        <!-- Brain (Cerebrum & Hemispheres within Skull) -->
        <g id="organ_brain" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_brain')"
           tabindex="0" role="button" aria-label="Brain, Cerebrum" style="cursor: pointer;">
          <ellipse cx="180" cy="52" rx="20" ry="22" 
                   fill="${this._fillColor('organ_brain', '#EC4899', selectedParts)}" 
                   stroke="${this._strokeColor('organ_brain', '#F472B6', selectedParts)}" 
                   stroke-width="${this._strokeWidth('organ_brain', 2.2, selectedParts)}" />
        </g>

        <!-- Thyroid Gland (Neck Base) -->
        <g id="organ_thyroid" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_thyroid')"
           tabindex="0" role="button" aria-label="Thyroid Gland, Anterior Neck" style="cursor: pointer;">
          <path d="M 172,102 Q 180,108 188,102 Q 185,114 180,111 Q 175,114 172,102 Z" 
                fill="${this._fillColor('organ_thyroid', '#8B5CF6', selectedParts)}" 
                stroke="${this._strokeColor('organ_thyroid', '#C4B5FD', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_thyroid', 2, selectedParts)}" />
        </g>

        <!-- Lungs (Bilateral Thoracic Cavities) -->
        <g id="organ_lungs" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_lungs')"
           tabindex="0" role="button" aria-label="Lungs, Bilateral Thorax" style="cursor: pointer;">
          <!-- Right Lung (Patient Right / Viewer Left) -->
          <path d="M 144,136 C 152,136 162,148 162,184 C 162,210 144,210 135,204 C 124,192 124,154 144,136 Z" 
                fill="${this._fillColor('organ_lungs', '#FB7185', selectedParts, 0.45)}" 
                stroke="${this._strokeColor('organ_lungs', '#F43F5E', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_lungs', 2.2, selectedParts)}" />
          <!-- Left Lung (Patient Left / Viewer Right) -->
          <path d="M 216,136 C 208,136 198,148 198,184 C 198,210 216,210 225,204 C 236,192 236,154 216,136 Z" 
                fill="${this._fillColor('organ_lungs', '#FB7185', selectedParts, 0.45)}" 
                stroke="${this._strokeColor('organ_lungs', '#F43F5E', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_lungs', 2.2, selectedParts)}" />
        </g>

        <!-- Heart (Thorax Left-of-Center Mediastinum) -->
        <g id="organ_heart" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_heart')"
           tabindex="0" role="button" aria-label="Heart, Cardiac Precordium" style="cursor: pointer;">
          <ellipse cx="190" cy="172" rx="18" ry="20" 
                   fill="${this._fillColor('organ_heart', '#DC2626', selectedParts)}" 
                   stroke="${this._strokeColor('organ_heart', '#EF4444', selectedParts)}" 
                   stroke-width="${this._strokeWidth('organ_heart', 2.6, selectedParts)}" />
          <!-- Aortic arch -->
          <path d="M 185,154 Q 190,146 196,154" stroke="#FFFFFF" stroke-width="2.2" fill="none" opacity="0.8"/>
        </g>

        <!-- Liver (Patient Right Upper Quadrant / Viewer Left) -->
        <g id="organ_liver" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_liver')"
           tabindex="0" role="button" aria-label="Liver, Right Upper Quadrant" style="cursor: pointer;">
          <path d="M 134,214 Q 174,208 174,232 Q 166,254 134,248 Q 122,234 134,214 Z" 
                fill="${this._fillColor('organ_liver', '#92400E', selectedParts)}" 
                stroke="${this._strokeColor('organ_liver', '#F59E0B', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_liver', 2.4, selectedParts)}" />
        </g>

        <!-- Stomach (Patient Left Upper Quadrant / Viewer Right) -->
        <g id="organ_stomach" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_stomach')"
           tabindex="0" role="button" aria-label="Stomach, Left Upper Quadrant" style="cursor: pointer;">
          <path d="M 184,214 Q 214,210 214,236 Q 206,256 184,248 Z" 
                fill="${this._fillColor('organ_stomach', '#EA580C', selectedParts)}" 
                stroke="${this._strokeColor('organ_stomach', '#FB923C', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_stomach', 2.4, selectedParts)}" />
        </g>

        <!-- Large Intestine (Colon Framework) -->
        <g id="organ_large_intestine" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_large_intestine')"
           tabindex="0" role="button" aria-label="Large Intestine Colon" style="cursor: pointer;">
          <path d="M 136,296 L 136,256 Q 180,250 224,256 L 224,296" fill="none" 
                stroke="${this._strokeColor('organ_large_intestine', '#B45309', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_large_intestine', 9.5, selectedParts)}" 
                stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
        </g>

        <!-- Small Intestine (Central Mesenteric Loops) -->
        <g id="organ_small_intestine" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_small_intestine')"
           tabindex="0" role="button" aria-label="Small Intestine" style="cursor: pointer;">
          <rect x="152" y="268" width="56" height="26" rx="9" 
                fill="${this._fillColor('organ_small_intestine', '#D97706', selectedParts)}" 
                stroke="${this._strokeColor('organ_small_intestine', '#FDE68A', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_small_intestine', 2, selectedParts)}" />
        </g>

        <!-- Urinary Bladder (Pelvic Midline) -->
        <g id="organ_bladder" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_bladder')"
           tabindex="0" role="button" aria-label="Urinary Bladder, Hypogastric Pelvis" style="cursor: pointer;">
          <ellipse cx="180" cy="302" rx="15" ry="12" 
                   fill="${this._fillColor('organ_bladder', '#F59E0B', selectedParts)}" 
                   stroke="${this._strokeColor('organ_bladder', '#FEF08A', selectedParts)}" 
                   stroke-width="${this._strokeWidth('organ_bladder', 2.2, selectedParts)}" />
        </g>

        <!-- Reproductive Organs (Pelvic Floor) -->
        <g id="organ_reproductive" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_reproductive')"
           tabindex="0" role="button" aria-label="Reproductive Organs, Pelvis" style="cursor: pointer;">
          <circle cx="180" cy="318" r="8" 
                  fill="${this._fillColor('organ_reproductive', '#DB2777', selectedParts)}" 
                  stroke="${this._strokeColor('organ_reproductive', '#F472B6', selectedParts)}" 
                  stroke-width="${this._strokeWidth('organ_reproductive', 2, selectedParts)}" />
        </g>
      </g>
    `;
  }

  _renderBackViewSVG(selectedParts) {
    return `
      <!-- ============================================================ -->
      <!-- BACK VIEW (POSTERIOR): SPINE, KIDNEYS, URETERS & SKELETON     -->
      <!-- ============================================================ -->
      <g id="layer_back_view">
        <!-- Body Silhouette Background Guide -->
        <path d="M 180,18 C 160,18 146,34 146,62 C 146,88 156,102 166,108 
                 C 134,114 104,134 96,178 C 84,222 68,318 68,335 C 68,342 78,346 84,340 
                 C 98,320 114,240 120,218 C 120,256 116,316 122,380 C 130,442 126,512 148,605 
                 C 152,624 140,642 134,660 C 130,670 144,676 156,672 C 166,668 170,648 170,612 
                 C 172,570 174,472 180,335 C 186,472 188,570 190,612 
                 C 190,648 194,668 204,672 C 216,676 230,670 226,660 
                 C 220,642 208,624 212,605 C 234,512 230,442 238,380 
                 C 244,316 240,256 240,218 C 246,240 262,320 276,340 
                 C 282,346 292,342 292,335 C 292,318 276,222 264,178 
                 C 256,134 226,114 194,108 C 204,102 214,88 214,62 
                 C 214,34 200,18 180,18 Z"
              fill="#060e1b" stroke="#1e293b" stroke-width="1.6" />

        <!-- Posterior Cranium / Occiput & Nuchal Lines -->
        <g id="skel_skull" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_skull')" 
           tabindex="0" role="button" aria-label="Posterior Skull / Occipital Bone" style="cursor: pointer;">
          <ellipse cx="180" cy="58" rx="30" ry="34" 
                   fill="${this._fillColor('skel_skull', 'url(#boneGradient)', selectedParts)}" 
                   stroke="${this._strokeColor('skel_skull', '#FFFFFF', selectedParts)}" 
                   stroke-width="${this._strokeWidth('skel_skull', 1.8, selectedParts)}" />
          <path d="M 158,44 Q 180,34 202,44" stroke="#64748B" stroke-width="1.2" fill="none" stroke-dasharray="2,2"/>
          <circle cx="180" cy="66" r="2.8" fill="#64748B"/>
          <path d="M 160,68 Q 180,78 200,68" stroke="#94A3B8" stroke-width="2" fill="none"/>
        </g>

        <!-- Cervical Spine Spinous Processes (C1-C7) -->
        <g id="skel_spine_cervical" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_cervical')" 
           tabindex="0" role="button" aria-label="Cervical Spine Neck" style="cursor: pointer;">
          <rect x="175" y="98" width="10" height="25" rx="3.5" 
                fill="${this._fillColor('skel_spine_cervical', '#475569', selectedParts)}" 
                stroke="${this._strokeColor('skel_spine_cervical', '#38BDF8', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_spine_cervical', 1.6, selectedParts)}" />
          <!-- C7 Vertebra Prominens -->
          <circle cx="180" cy="120" r="3" fill="#E2E8F0" stroke="#38BDF8" stroke-width="1"/>
        </g>

        <!-- Bilateral Scapulae (Dorsal Shoulder Blades) -->
        <!-- In Back View: Viewer Left is Patient Left! -->
        <g style="cursor: pointer;">
          <polygon points="158,134 128,144 142,192" fill="#334155" stroke="#CBD5E1" stroke-width="1.8"/>
          <line x1="128" y1="144" x2="152" y2="150" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>
        </g>
        <g style="cursor: pointer;">
          <polygon points="202,134 232,144 218,192" fill="#334155" stroke="#CBD5E1" stroke-width="1.8"/>
          <line x1="232" y1="144" x2="208" y2="150" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>
        </g>

        <!-- Posterior Rib Arches -->
        <path d="M 174,136 Q 132,144 126,175" fill="none" stroke="#64748B" stroke-width="2" opacity="0.6"/>
        <path d="M 186,136 Q 228,144 234,175" fill="none" stroke="#64748B" stroke-width="2" opacity="0.6"/>
        <path d="M 174,152 Q 128,162 124,192" fill="none" stroke="#64748B" stroke-width="2" opacity="0.6"/>
        <path d="M 186,152 Q 232,162 236,192" fill="none" stroke="#64748B" stroke-width="2" opacity="0.6"/>
        <path d="M 174,168 Q 126,180 124,210" fill="none" stroke="#64748B" stroke-width="2" opacity="0.6"/>
        <path d="M 186,168 Q 234,180 236,210" fill="none" stroke="#64748B" stroke-width="2" opacity="0.6"/>

        <!-- Thoracic Spine (T1-T12 Dorsal Spinous Column) -->
        <g id="skel_spine_thoracic" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_thoracic')" 
           tabindex="0" role="button" aria-label="Thoracic Spine Mid Back" style="cursor: pointer;">
          <rect x="174" y="126" width="12" height="88" rx="3.5" 
                fill="${this._fillColor('skel_spine_thoracic', '#334155', selectedParts)}" 
                stroke="${this._strokeColor('skel_spine_thoracic', '#38BDF8', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_spine_thoracic', 2, selectedParts)}" />
          <line x1="180" y1="134" x2="180" y2="141" stroke="#FFFFFF" stroke-width="2.2"/>
          <line x1="180" y1="147" x2="180" y2="154" stroke="#FFFFFF" stroke-width="2.2"/>
          <line x1="180" y1="160" x2="180" y2="167" stroke="#FFFFFF" stroke-width="2.2"/>
          <line x1="180" y1="173" x2="180" y2="180" stroke="#FFFFFF" stroke-width="2.2"/>
          <line x1="180" y1="186" x2="180" y2="193" stroke="#FFFFFF" stroke-width="2.2"/>
          <line x1="180" y1="199" x2="180" y2="206" stroke="#FFFFFF" stroke-width="2.2"/>
        </g>

        <!-- RETROPERITONEAL KIDNEYS (Prime Anatomical Access in Posterior View) -->
        <!-- Note Laterality: Viewer Left = Patient Left Kidney! -->
        <g id="organ_kidney_l" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_kidney_l')"
           tabindex="0" role="button" aria-label="Left Kidney (Patient Left / Viewer Left)" style="cursor: pointer;">
          <rect x="140" y="218" width="20" height="32" rx="10" 
                fill="${this._fillColor('organ_kidney_l', '#7F1D1D', selectedParts)}" 
                stroke="${this._strokeColor('organ_kidney_l', '#EF4444', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_kidney_l', 2.4, selectedParts)}" />
        </g>

        <!-- Patient Right Kidney (Viewer Right) -->
        <g id="organ_kidney_r" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_kidney_r')"
           tabindex="0" role="button" aria-label="Right Kidney (Patient Right / Viewer Right)" style="cursor: pointer;">
          <rect x="200" y="224" width="20" height="32" rx="10" 
                fill="${this._fillColor('organ_kidney_r', '#7F1D1D', selectedParts)}" 
                stroke="${this._strokeColor('organ_kidney_r', '#EF4444', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_kidney_r', 2.4, selectedParts)}" />
        </g>

        <!-- Bilateral Ureters Descending Retroperitoneally -->
        <g id="organ_ureter_l" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_ureter_l')"
           tabindex="0" role="button" aria-label="Left Ureter" style="cursor: pointer;">
          <line x1="150" y1="250" x2="170" y2="294" 
                stroke="${this._strokeColor('organ_ureter_l', '#EAB308', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_ureter_l', 3, selectedParts)}" stroke-dasharray="4,2" />
        </g>
        <g id="organ_ureter_r" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_ureter_r')"
           tabindex="0" role="button" aria-label="Right Ureter" style="cursor: pointer;">
          <line x1="210" y1="256" x2="190" y2="294" 
                stroke="${this._strokeColor('organ_ureter_r', '#EAB308', selectedParts)}" 
                stroke-width="${this._strokeWidth('organ_ureter_r', 3, selectedParts)}" stroke-dasharray="4,2" />
        </g>

        <!-- Lumbar Spine (L1-L5 Broad Quadrangular Spinous Processes) -->
        <g id="skel_spine_lumbar" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_lumbar')" 
           tabindex="0" role="button" aria-label="Lumbar Spine L1-L5" style="cursor: pointer;">
          <rect x="174" y="222" width="12" height="44" rx="2.5" 
                fill="${this._fillColor('skel_spine_lumbar', '#475569', selectedParts)}" 
                stroke="${this._strokeColor('skel_spine_lumbar', '#38BDF8', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_spine_lumbar', 2, selectedParts)}" />
          <rect x="176.5" y="226" width="7" height="4.5" rx="1.2" fill="#CBD5E1"/>
          <rect x="176.5" y="235" width="7" height="4.5" rx="1.2" fill="#CBD5E1"/>
          <rect x="176.5" y="244" width="7" height="4.5" rx="1.2" fill="#CBD5E1"/>
          <rect x="176.5" y="253" width="7" height="4.5" rx="1.2" fill="#CBD5E1"/>
        </g>

        <!-- Posterior Pelvis & Sacroiliac Joint Line -->
        <g id="skel_pelvis" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_pelvis')" 
           tabindex="0" role="button" aria-label="Dorsal Pelvis and Sacroiliac" style="cursor: pointer;">
          <path d="M 136,270 C 142,262 164,266 180,279 C 196,266 218,262 224,270 
                   C 230,282 224,308 212,312 C 198,316 188,312 180,311 C 172,312 162,316 148,312 
                   C 136,308 130,282 136,270 Z" 
                fill="${this._fillColor('skel_pelvis', '#334155', selectedParts)}" 
                stroke="${this._strokeColor('skel_pelvis', '#E2E8F0', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_pelvis', 1.8, selectedParts)}" />
          <!-- Posterior Superior Iliac Spines (PSIS / Dimples) -->
          <circle cx="160" cy="278" r="2.8" fill="#64748B"/>
          <circle cx="200" cy="278" r="2.8" fill="#64748B"/>
        </g>

        <!-- Sacrum Dorsal Crest & Sacral Foramina -->
        <g id="skel_spine_sacrum" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_sacrum')" 
           tabindex="0" role="button" aria-label="Dorsal Sacrum & Coccyx" style="cursor: pointer;">
          <polygon points="174,270 186,270 181,299 179,299" 
                   fill="${this._fillColor('skel_spine_sacrum', '#475569', selectedParts)}" 
                   stroke="${this._strokeColor('skel_spine_sacrum', '#38BDF8', selectedParts)}" 
                   stroke-width="${this._strokeWidth('skel_spine_sacrum', 1.8, selectedParts)}" />
          <line x1="180" y1="270" x2="180" y2="299" stroke="#CBD5E1" stroke-width="1.8"/>
          <ellipse cx="180" cy="303" rx="1.8" ry="3" fill="#CBD5E1"/>
        </g>

        <!-- Posterior Limbs (Olecranon, Linea Aspera, Calcaneus Heels to Toes) -->
        <path d="M 242,138 Q 246,170 255,214" stroke="#CBD5E1" stroke-width="6.5" stroke-linecap="round"/>
        <circle cx="255" cy="214" r="4.5" fill="#FFFFFF"/>
        <path d="M 258,220 Q 264,260 272,300" stroke="#CBD5E1" stroke-width="3.8" stroke-linecap="round"/>
        
        <path d="M 118,138 Q 114,170 105,214" stroke="#CBD5E1" stroke-width="6.5" stroke-linecap="round"/>
        <circle cx="105" cy="214" r="4.5" fill="#FFFFFF"/>
        <path d="M 102,220 Q 96,260 88,300" stroke="#CBD5E1" stroke-width="3.8" stroke-linecap="round"/>

        <!-- Posterior Legs (Head to Feet) -->
        <path d="M 156,308 Q 150,370 146,442" stroke="url(#boneShaftGrad)" stroke-width="8" stroke-linecap="round"/>
        <path d="M 146,458 L 144,598" stroke="url(#boneShaftGrad)" stroke-width="6" stroke-linecap="round"/>
        <!-- Calcaneus (Heel Bone) -->
        <ellipse cx="144" cy="608" rx="5.5" ry="7.5" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.4"/>
        <line x1="144" y1="616" x2="148" y2="652" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/>

        <path d="M 204,308 Q 210,370 214,442" stroke="url(#boneShaftGrad)" stroke-width="8" stroke-linecap="round"/>
        <path d="M 214,458 L 216,598" stroke="url(#boneShaftGrad)" stroke-width="6" stroke-linecap="round"/>
        <!-- Calcaneus (Heel Bone) -->
        <ellipse cx="216" cy="608" rx="5.5" ry="7.5" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.4"/>
        <line x1="216" y1="616" x2="212" y2="652" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/>
      </g>
    `;
  }

  _fillColor(id, defaultFill, selectedParts, defaultOpacity = 0.85) {
    if (selectedParts.includes(id)) {
      return "url(#accessibleHatch)";
    }
    return defaultFill;
  }

  _strokeColor(id, defaultStroke, selectedParts) {
    if (selectedParts.includes(id)) {
      return "#38BDF8";
    }
    return defaultStroke;
  }

  _strokeWidth(id, defaultWidth, selectedParts) {
    if (selectedParts.includes(id)) {
      return Math.max(3.5, defaultWidth + 1.6);
    }
    return defaultWidth;
  }

  _renderSelectedChips(selectedParts) {
    if (!selectedParts || selectedParts.length === 0) {
      return `<span style="font-size: 0.72rem; color: #64748B; font-style: italic;">Tap any bone, joint or organ on the skeleton to begin intake</span>`;
    }

    const currentLang = window.app?.currentLanguage || "en";
    return selectedParts.map(id => {
      const item = ANATOMY_REGISTRY.find(x => x.id === id);
      const name = item ? (item.displayName[currentLang] || item.displayName.en) : id;
      const lat = item ? item.laterality.toUpperCase() : "";

      return `
        <span class="organ-tag-pill" style="display: inline-flex; align-items: center; gap: 4px; background: rgba(2, 132, 199, 0.25); border: 1px solid #38BDF8; color: #FFFFFF; padding: 2px 9px; border-radius: 6px; font-size: 0.72rem;">
          <strong>${name}</strong>
          ${lat ? `<small style="color: #38BDF8; font-size: 0.65rem;">(${lat})</small>` : ''}
          <button type="button" onclick="event.stopPropagation(); window.__bodymap_inst.handleRegionClick('${id}')" 
                  style="background: transparent; border: none; color: #94A3B8; cursor: pointer; padding: 0 2px; font-weight: bold;" title="Remove selection">✕</button>
        </span>
      `;
    }).join('');
  }

  updateHighlights(selectedParts) {
    if (!this.container) return;
    const nodes = this.container.querySelectorAll(".anatomy-svg-node");
    nodes.forEach(node => {
      const id = node.id;
      const isSelected = selectedParts.includes(id);
      node.setAttribute("aria-pressed", isSelected ? "true" : "false");
      if (isSelected) {
        node.setAttribute("filter", "url(#selectionGlow)");
      } else {
        node.removeAttribute("filter");
      }
    });

    // Update accessible dropdown
    const selectEl = this.container.querySelector("#accessibleOrganSelector");
    if (selectEl && selectedParts.length > 0) {
      selectEl.value = selectedParts[selectedParts.length - 1];
    }
  }

  updateSelectedChips(selectedParts) {
    if (!this.container) return;
    const rack = this.container.querySelector("#bodymapSelectedChipsRack");
    if (rack) {
      rack.innerHTML = `
        <span style="font-size: 0.72rem; color: #94A3B8; font-weight: 700;">Selected Site(s):</span>
        ${this._renderSelectedChips(selectedParts)}
      `;
    }
  }

  _bindInteractiveEvents() {
    if (!this.container) return;
    const svgEl = this.container.querySelector("#anatomySvgMap");
    const tooltip = this.container.querySelector("#anatomyHoverTooltip");
    if (!svgEl) return;

    // Pan interaction
    svgEl.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("anatomy-svg-node")) return;
      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      svgEl.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this._applyTransform();
    });

    window.addEventListener("mouseup", () => {
      if (this.isPanning) {
        this.isPanning = false;
        if (svgEl) svgEl.style.cursor = "default";
      }
    });

    // Mouse wheel zoom
    svgEl.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    }, { passive: false });

    // Keyboard navigation & accessibility on nodes
    const nodes = this.container.querySelectorAll(".anatomy-svg-node");
    nodes.forEach(node => {
      node.addEventListener("mouseenter", (e) => {
        const id = node.id;
        const item = ANATOMY_REGISTRY.find(x => x.id === id);
        if (!item || !tooltip) return;

        const currentLang = window.app?.currentLanguage || "en";
        const name = item.displayName[currentLang] || item.displayName.en;
        const sys = item.system.toUpperCase();
        const lat = item.laterality.toUpperCase();

        tooltip.innerHTML = `
          <strong style="color: #38BDF8; font-size: 0.78rem; display: block;">${name}</strong>
          <span style="font-size: 0.68rem; color: #CBD5E1;">Laterality: ${lat} • System: ${sys}</span>
          <span style="font-size: 0.65rem; color: #94A3B8; display: block; margin-top: 3px;">Click to open clinical question intake</span>
        `;
        tooltip.style.display = "block";

        const rect = this.container.getBoundingClientRect();
        tooltip.style.left = `${Math.min(rect.width - 200, Math.max(10, e.clientX - rect.left + 15))}px`;
        tooltip.style.top = `${Math.min(rect.height - 80, Math.max(10, e.clientY - rect.top + 15))}px`;
      });

      node.addEventListener("mouseleave", () => {
        if (tooltip) tooltip.style.display = "none";
      });

      node.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.handleRegionClick(node.id);
        }
      });
    });
  }

  _handleKeyDown(e) {
    if (e.key === "+" || e.key === "=") this.zoomIn();
    if (e.key === "-" || e.key === "_") this.zoomOut();
    if (e.key === "0") this.resetTransform();
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    window.removeEventListener("keydown", this._handleKeyDown);
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}

// Backward-compatible alias
export const BodyMap2DFallback = BodyMap2D;

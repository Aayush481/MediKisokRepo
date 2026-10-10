/**
 * MediKiosk Interactive 2D Static Human Skeleton & Visceral Anatomy Map
 * Ultra-Clean Flat Anatomic Vector Illustration (Anterior & Posterior Views).
 * Zero scrolling (100% fit to container height), multi-select by default, 44px touch targets.
 * Fully synchronized with bodymapStore and ANATOMY_REGISTRY.
 */

import { ANATOMY_REGISTRY, ANATOMY_SYSTEMS } from "../data/anatomyRegistry.js";
import { bodymapStore } from "../services/bodymapStore.js";

export class BodyMap2D {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;
    this.unsubscribe = null;

    // View & Display state
    this.currentView = "front"; // "front" (anterior) | "back" (posterior)
    this.displayMode = "skeleton"; // "skeleton" | "combined" | "organs"
    this.multiSelect = true; // Multi-select enabled by default for multi-region intake
    this.activeSystem = "all";
    this.isListDrawerOpen = false;

    // Backward compatibility props
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.peelLevel = 0.0;
  }

  init() {
    this.render();
    this.unsubscribe = bodymapStore.subscribe((state) => {
      this.updateHighlights(state.selectedParts || []);
      this.updateSelectedChips(state.selectedParts || []);
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

  toggleMultiSelect() {
    this.multiSelect = !this.multiSelect;
    const btn = this.container?.querySelector("#btnMultiSelectToggle");
    if (btn) {
      btn.innerHTML = this.multiSelect ? " Multi-Select ON" : " Multi-Select";
      btn.style.color = this.multiSelect ? "#38BDF8" : "#94A3B8";
      btn.style.borderColor = this.multiSelect ? "#38BDF8" : "rgba(255,255,255,0.15)";
      btn.style.background = this.multiSelect ? "rgba(2,132,199,0.25)" : "transparent";
      btn.setAttribute("aria-pressed", this.multiSelect ? "true" : "false");
    }
  }

  toggleListDrawer() {
    this.isListDrawerOpen = !this.isListDrawerOpen;
    const drawer = this.container?.querySelector("#bodymapListDrawer");
    if (drawer) {
      drawer.style.display = this.isListDrawerOpen ? "flex" : "none";
    }
  }

  clearAll() {
    bodymapStore.clearSelection();
    this.updateHighlights([]);
    this.updateSelectedChips([]);
  }

  setPeelLevel(val) {
    this.peelLevel = parseFloat(val) || 0;
  }

  setSystem(sysId) {
    this.activeSystem = sysId;
    if (sysId === "skeletal") {
      this.displayMode = "skeleton";
    } else if (["circulatory", "digestive", "respiratory", "nervous", "endocrine", "urinary"].includes(sysId)) {
      this.displayMode = "combined";
    }
    this.render();
  }

  // Backward-compatible no-ops
  zoomIn() {}
  zoomOut() {}
  resetTransform() {}

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
      <div class="bodymap-2d-canvas-wrapper" style="position: relative; background: #070D18; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.2); overflow: hidden; display: flex; flex-direction: column; width: 100%; height: 100%; flex: 1 1 0%; min-height: 0; user-select: none;">
        
        <!-- Compact Single-Row Toolbar (<= 34px) -->
        <div style="background: rgba(15, 23, 42, 0.95); padding: 5px 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-shrink: 0;">
          <!-- Left: View Toggle & Mode Switcher -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="background: rgba(30, 41, 59, 0.9); padding: 2px; border-radius: 6px; display: inline-flex; border: 1px solid rgba(255,255,255,0.08);">
              <button type="button" class="view-toggle-btn ${isFront ? 'active' : ''}" 
                      onclick="window.__bodymap_inst.setView('front')" 
                      aria-pressed="${isFront ? 'true' : 'false'}"
                      style="padding: 3px 9px; font-size: 0.72rem; font-weight: 700; border-radius: 5px; border: none; cursor: pointer; transition: all 0.15s ease; ${isFront ? 'background: #0284C7; color: #FFFFFF;' : 'background: transparent; color: #94A3B8;'}">
                 Anterior (Front)
              </button>
              <button type="button" class="view-toggle-btn ${!isFront ? 'active' : ''}" 
                      onclick="window.__bodymap_inst.setView('back')" 
                      aria-pressed="${!isFront ? 'true' : 'false'}"
                      style="padding: 3px 9px; font-size: 0.72rem; font-weight: 700; border-radius: 5px; border: none; cursor: pointer; transition: all 0.15s ease; ${!isFront ? 'background: #0284C7; color: #FFFFFF;' : 'background: transparent; color: #94A3B8;'}">
                 Posterior (Back)
              </button>
            </div>

            <div style="background: rgba(30, 41, 59, 0.9); padding: 2px; border-radius: 6px; display: inline-flex; border: 1px solid rgba(255,255,255,0.08);">
              <button type="button" onclick="window.__bodymap_inst.setDisplayMode('skeleton')" 
                      title="Show pure skeleton"
                      style="padding: 3px 7px; font-size: 0.7rem; font-weight: 600; border-radius: 5px; border: none; cursor: pointer; ${this.displayMode === 'skeleton' ? 'background: #0284C7; color: #FFFFFF;' : 'background: transparent; color: #94A3B8;'}">
                Bones
              </button>
              <button type="button" onclick="window.__bodymap_inst.setDisplayMode('combined')" 
                      title="Combined Bones + Visceral Organs"
                      style="padding: 3px 7px; font-size: 0.7rem; font-weight: 600; border-radius: 5px; border: none; cursor: pointer; ${this.displayMode === 'combined' ? 'background: #0284C7; color: #FFFFFF;' : 'background: transparent; color: #94A3B8;'}">
                + Organs
              </button>
            </div>
          </div>

          <!-- Right: Multi-Select Toggle, Clear All, Accessible List Toggle -->
          <div style="display: flex; align-items: center; gap: 5px;">
            <button type="button" id="btnMultiSelectToggle"
                    onclick="window.__bodymap_inst.toggleMultiSelect()"
                    title="Toggle multi-area selection"
                    aria-pressed="${this.multiSelect ? 'true' : 'false'}"
                    style="padding: 3px 8px; font-size: 0.7rem; font-weight: 600; border-radius: 5px; border: 1px solid ${this.multiSelect ? '#38BDF8' : 'rgba(255,255,255,0.15)'}; background: ${this.multiSelect ? 'rgba(2,132,199,0.3)' : 'transparent'}; color: ${this.multiSelect ? '#38BDF8' : '#94A3B8'}; cursor: pointer;">
              ${this.multiSelect ? ' Multi-Select ON' : ' Multi-Select'}
            </button>

            <button type="button" onclick="window.__bodymap_inst.clearAll()" 
                    title="Clear all selected regions"
                    style="padding: 3px 7px; font-size: 0.7rem; font-weight: 600; border-radius: 5px; border: 1px solid rgba(255,255,255,0.12); background: rgba(30,41,59,0.8); color: #94A3B8; cursor: pointer;">
              ↺ Clear
            </button>

            <button type="button" onclick="window.__bodymap_inst.toggleListDrawer()" 
                    title="Toggle accessible body part dropdown"
                    style="padding: 3px 7px; font-size: 0.7rem; font-weight: 600; border-radius: 5px; border: 1px solid rgba(255,255,255,0.12); background: rgba(30,41,59,0.8); color: #94A3B8; cursor: pointer;">
               List
            </button>
          </div>
        </div>

        <!-- Collapsible Accessible Dropdown Row (WCAG 2.1 AA) -->
        <div id="bodymapListDrawer" style="display: ${this.isListDrawerOpen ? 'flex' : 'none'}; padding: 5px 12px; background: #0B132B; border-bottom: 1px solid rgba(56,189,248,0.25); align-items: center; gap: 8px; flex-shrink: 0;">
          <label for="accessibleOrganSelector" style="font-size: 0.7rem; color: #94A3B8; white-space: nowrap;">Accessible Dropdown:</label>
          <select id="accessibleOrganSelector" class="accessible-organ-dropdown" 
                  onchange="window.__bodymap_inst.handleRegionClick(this.value)"
                  style="flex: 1; background: #1E293B; color: #F8FAFC; border: 1px solid #334155; border-radius: 5px; padding: 3px 8px; font-size: 0.72rem;">
            <option value="">-- Choose bone, joint or organ from accessible list --</option>
            ${ANATOMY_REGISTRY.map(item => `
              <option value="${item.id}" ${selectedParts.includes(item.id) ? 'selected' : ''}>
                ${item.displayName[currentLang] || item.displayName.en} (${item.laterality.toUpperCase()}) - ${item.system.toUpperCase()}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Static SVG Anatomy Canvas (100% Fit, Zero Overflow, Head to Feet) -->
        <div class="anatomy-svg-container" style="flex: 1 1 0%; min-height: 0; width: 100%; height: 100%; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 35%, #0d1e36 0%, #060c18 90%); cursor: default;">
          
          <!-- Subtle corner laterality indicators -->
          <div style="position: absolute; top: 8px; left: 10px; font-size: 0.64rem; font-weight: 800; color: ${isFront ? '#38BDF8' : '#F59E0B'}; background: rgba(15,23,42,0.75); padding: 2px 7px; border-radius: 4px; pointer-events: none; border: 1px solid rgba(56,189,248,0.2); letter-spacing: 0.4px;">
            ${isFront ? '◄ PATIENT RIGHT' : '◄ PATIENT LEFT'}
          </div>
          <div style="position: absolute; top: 8px; right: 10px; font-size: 0.64rem; font-weight: 800; color: ${isFront ? '#38BDF8' : '#F59E0B'}; background: rgba(15,23,42,0.75); padding: 2px 7px; border-radius: 4px; pointer-events: none; border: 1px solid rgba(56,189,248,0.2); letter-spacing: 0.4px;">
            ${isFront ? 'PATIENT LEFT ►' : 'PATIENT RIGHT ►'}
          </div>

          <svg id="anatomySvgMap" viewBox="0 0 360 720" preserveAspectRatio="xMidYMid meet"
               style="width: 100%; height: 100%; max-width: 100%; max-height: 100%; display: block; margin: 0 auto; filter: drop-shadow(0 6px 18px rgba(0,0,0,0.6));"
               xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Interactive Static 2D Full Human Skeleton and Anatomy Map From Head to Feet">
            
            <defs>
              <filter id="selectionGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <pattern id="accessibleHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#38BDF8" stroke-width="2.2" opacity="0.85" />
              </pattern>

              <linearGradient id="boneShaftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#94A3B8" />
                <stop offset="50%" stop-color="#F1F5F9" />
                <stop offset="100%" stop-color="#CBD5E1" />
              </linearGradient>
            </defs>

            <g id="anatomySvgStaticGroup">
              ${isFront ? this._renderFrontViewSVG(selectedParts) : this._renderBackViewSVG(selectedParts)}
            </g>
          </svg>

          <!-- Interactive Hover Tooltip Overlay -->
          <div id="anatomyHoverTooltip" style="position: absolute; display: none; pointer-events: none; background: rgba(15, 23, 42, 0.95); border: 1.5px solid #38BDF8; color: #FFFFFF; padding: 6px 10px; border-radius: 6px; font-size: 0.72rem; box-shadow: 0 8px 24px rgba(0,0,0,0.7); z-index: 100; max-width: 240px;"></div>
        </div>

        <!-- Selected Anatomical Chips Rack -->
        <div id="bodymapSelectedChipsRack" style="background: rgba(15, 23, 42, 0.95); padding: 5px 12px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex-shrink: 0; min-height: 32px;">
          <span style="font-size: 0.7rem; color: #94A3B8; font-weight: 700;">Selected Site(s):</span>
          ${this._renderSelectedChips(selectedParts)}
        </div>
      </div>
    `;

    // Global bridge for SVG onclick
    window.__bodymap_inst = this;
    window.__bodymap_select = (id) => this.handleRegionClick(id);

    this._bindInteractiveEvents();
  }

  _renderFrontViewSVG(selectedParts) {
    const isSkeletonOnly = this.displayMode === "skeleton";
    const organVisibility = isSkeletonOnly ? "display: none;" : "display: block;";

    return `
      <!-- ============================================================ -->
      <!-- 1. SOFT BODY SILHOUETTE GUIDE (HEAD TO TOES, ZERO CLIPPING)  -->
      <!-- ============================================================ -->
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
            fill="#081224" stroke="#162338" stroke-width="1.4" opacity="0.9" />

      <!-- ============================================================ -->
      <!-- 2. CLEAN SIMPLIFIED SKELETAL FRAMEWORK (SKULL TO TOES)       -->
      <!-- ============================================================ -->
      <g id="layer_skeleton_base">

        <!-- SKULL & JAW (y: 20 to 88, cranium ratio: 68/720 = 0.094) -->
        <g id="skel_skull" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_skull')" 
           tabindex="0" role="button" aria-label="Skull, Cranium and Face" style="cursor: pointer;">
          <!-- Cranial vault -->
          <path d="M 155,52 C 155,30 166,20 180,20 C 194,20 205,30 205,52 C 205,66 200,76 196,82 C 190,86 186,88 180,88 C 174,88 170,86 164,82 C 160,76 155,66 155,52 Z"
                fill="${this._fillColor('skel_skull', '#E2E8F0', selectedParts)}" 
                stroke="${this._strokeColor('skel_skull', '#94A3B8', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_skull', 1.6, selectedParts)}" />
          <!-- Eye orbits & nasal aperture -->
          <ellipse cx="169" cy="54" rx="6.5" ry="7.5" fill="#081224" stroke="#64748B" stroke-width="1.2"/>
          <ellipse cx="191" cy="54" rx="6.5" ry="7.5" fill="#081224" stroke="#64748B" stroke-width="1.2"/>
          <polygon points="180,62 176,72 184,72" fill="#081224" stroke="#64748B" stroke-width="1"/>
          <!-- Jaw contour -->
          <path d="M 162,76 Q 165,88 180,89 Q 195,88 198,76" fill="none" stroke="#64748B" stroke-width="1.4"/>
          <!-- 44px touch target -->
          <circle cx="180" cy="54" r="26" fill="transparent" pointer-events="all"/>
        </g>

        <!-- CERVICAL SPINE (NECK C1-C7, y: 92 to 120) -->
        <g id="skel_spine_cervical" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_cervical')"
           tabindex="0" role="button" aria-label="Cervical Spine Neck" style="cursor: pointer;">
          <rect x="175" y="92" width="10" height="28" rx="3.5" 
                fill="${this._fillColor('skel_spine_cervical', '#CBD5E1', selectedParts)}" 
                stroke="${this._strokeColor('skel_spine_cervical', '#64748B', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_spine_cervical', 1.4, selectedParts)}" />
          <line x1="175" y1="101" x2="185" y2="101" stroke="#475569" stroke-width="1"/>
          <line x1="175" y1="110" x2="185" y2="110" stroke="#475569" stroke-width="1"/>
          <rect x="160" y="88" width="40" height="36" fill="transparent" pointer-events="all"/>
        </g>

        <!-- CLAVICLES (COLLARBONES) -->
        <g id="skel_clavicle_r" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_clavicle_r')" 
           tabindex="0" role="button" aria-label="Right Clavicle Collarbone" style="cursor: pointer;">
          <path d="M 180,122 Q 150,118 126,132" stroke="${this._strokeColor('skel_clavicle_r', '#CBD5E1', selectedParts)}" stroke-width="${this._strokeWidth('skel_clavicle_r', 4.5, selectedParts)}" stroke-linecap="round" fill="none"/>
        </g>
        <g id="skel_clavicle_l" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_clavicle_l')" 
           tabindex="0" role="button" aria-label="Left Clavicle Collarbone" style="cursor: pointer;">
          <path d="M 180,122 Q 210,118 234,132" stroke="${this._strokeColor('skel_clavicle_l', '#CBD5E1', selectedParts)}" stroke-width="${this._strokeWidth('skel_clavicle_l', 4.5, selectedParts)}" stroke-linecap="round" fill="none"/>
        </g>

        <!-- STERNUM (BREASTBONE) -->
        <g id="skel_sternum" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_sternum')"
           tabindex="0" role="button" aria-label="Sternum Breastbone" style="cursor: pointer;">
          <polygon points="178,124 182,124 183,165 180,178 177,165" 
                   fill="${this._fillColor('skel_sternum', '#E2E8F0', selectedParts)}" 
                   stroke="${this._strokeColor('skel_sternum', '#94A3B8', selectedParts)}" 
                   stroke-width="${this._strokeWidth('skel_sternum', 1.5, selectedParts)}" />
        </g>

        <!-- RIBCAGE (UNIFIED THORACIC CAGE, y: 132 to 220) -->
        <g id="skel_ribcage" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_ribcage')"
           tabindex="0" role="button" aria-label="Ribcage Thorax" style="cursor: pointer;">
          <path d="M 176,126 C 142,128 130,155 128,190 C 127,208 140,220 162,216 L 176,182 L 184,182 L 198,216 C 220,220 233,208 232,190 C 230,155 218,128 184,126 Z"
                fill="${this._fillColor('skel_ribcage', '#CBD5E1', selectedParts, 0.45)}" 
                stroke="${this._strokeColor('skel_ribcage', '#94A3B8', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_ribcage', 1.8, selectedParts)}" opacity="0.9" />
          <!-- Subtle contour lines showing thoracic ribs cleanly -->
          <path d="M 134,152 Q 180,158 226,152" stroke="#64748B" stroke-width="1.2" fill="none" opacity="0.6"/>
          <path d="M 130,172 Q 180,180 230,172" stroke="#64748B" stroke-width="1.2" fill="none" opacity="0.6"/>
          <path d="M 132,192 Q 180,202 228,192" stroke="#64748B" stroke-width="1.2" fill="none" opacity="0.6"/>
        </g>

        <!-- LUMBAR SPINE (L1-L5, y: 222 to 274) -->
        <g id="skel_spine_lumbar" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_lumbar')"
           tabindex="0" role="button" aria-label="Lumbar Spine Lower Back" style="cursor: pointer;">
          <rect x="174" y="222" width="12" height="50" rx="3" 
                fill="${this._fillColor('skel_spine_lumbar', '#CBD5E1', selectedParts)}" 
                stroke="${this._strokeColor('skel_spine_lumbar', '#64748B', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_spine_lumbar', 1.5, selectedParts)}" />
          <line x1="174" y1="234" x2="186" y2="234" stroke="#475569" stroke-width="1"/>
          <line x1="174" y1="247" x2="186" y2="247" stroke="#475569" stroke-width="1"/>
          <line x1="174" y1="260" x2="186" y2="260" stroke="#475569" stroke-width="1"/>
          <rect x="160" y="220" width="40" height="54" fill="transparent" pointer-events="all"/>
        </g>

        <!-- PELVIS GIRDLE & SACRUM (y: 274 to 326) -->
        <g id="skel_pelvis" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_pelvis')"
           tabindex="0" role="button" aria-label="Pelvis and Hips" style="cursor: pointer;">
          <path d="M 134,274 C 142,266 166,270 180,284 C 194,270 218,266 226,274 
                   C 232,286 226,314 212,320 C 196,326 186,322 180,320 C 174,322 164,326 148,320 
                   C 134,314 128,286 134,274 Z" 
                fill="${this._fillColor('skel_pelvis', '#CBD5E1', selectedParts)}" 
                stroke="${this._strokeColor('skel_pelvis', '#94A3B8', selectedParts)}" 
                stroke-width="${this._strokeWidth('skel_pelvis', 1.8, selectedParts)}" />
          <!-- Obturator foramen openings -->
          <ellipse cx="162" cy="308" rx="6" ry="7" fill="#081224" stroke="#64748B" stroke-width="1"/>
          <ellipse cx="198" cy="308" rx="6" ry="7" fill="#081224" stroke="#64748B" stroke-width="1"/>
        </g>

        <!-- SACRUM / COCCYX -->
        <g id="skel_spine_sacrum" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_sacrum')"
           tabindex="0" role="button" aria-label="Sacrum and Coccyx" style="cursor: pointer;">
          <polygon points="175,276 185,276 181,308 179,308" 
                   fill="${this._fillColor('skel_spine_sacrum', '#94A3B8', selectedParts)}" 
                   stroke="${this._strokeColor('skel_spine_sacrum', '#64748B', selectedParts)}" 
                   stroke-width="1.2" />
        </g>

        <!-- UPPER LIMBS (HUMERUS, FOREARMS, HANDS) -->
        <!-- Right Arm (Patient Right / Viewer Left) -->
        <g id="bone_humerus_r" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_humerus_r')" style="cursor: pointer;">
          <path d="M 118,138 Q 114,170 105,214" stroke="${this._strokeColor('bone_humerus_r', '#CBD5E1', selectedParts)}" stroke-width="${this._strokeWidth('bone_humerus_r', 6.5, selectedParts)}" stroke-linecap="round"/>
        </g>
        <g id="bone_forearm_r" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_forearm_r')" style="cursor: pointer;">
          <path d="M 104,218 Q 98,258 90,300" stroke="${this._strokeColor('bone_forearm_r', '#CBD5E1', selectedParts)}" stroke-width="${this._strokeWidth('bone_forearm_r', 5, selectedParts)}" stroke-linecap="round"/>
        </g>
        <g id="bone_hand_r" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_hand_r')" style="cursor: pointer;">
          <path d="M 90,302 Q 84,318 80,332" stroke="${this._strokeColor('bone_hand_r', '#E2E8F0', selectedParts)}" stroke-width="${this._strokeWidth('bone_hand_r', 5.5, selectedParts)}" stroke-linecap="round"/>
          <circle cx="83" cy="320" r="14" fill="transparent" pointer-events="all"/>
        </g>

        <!-- Left Arm (Patient Left / Viewer Right) -->
        <g id="bone_humerus_l" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_humerus_l')" style="cursor: pointer;">
          <path d="M 242,138 Q 246,170 255,214" stroke="${this._strokeColor('bone_humerus_l', '#CBD5E1', selectedParts)}" stroke-width="${this._strokeWidth('bone_humerus_l', 6.5, selectedParts)}" stroke-linecap="round"/>
        </g>
        <g id="bone_forearm_l" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_forearm_l')" style="cursor: pointer;">
          <path d="M 256,218 Q 262,258 270,300" stroke="${this._strokeColor('bone_forearm_l', '#CBD5E1', selectedParts)}" stroke-width="${this._strokeWidth('bone_forearm_l', 5, selectedParts)}" stroke-linecap="round"/>
        </g>
        <g id="bone_hand_l" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_hand_l')" style="cursor: pointer;">
          <path d="M 270,302 Q 276,318 280,332" stroke="${this._strokeColor('bone_hand_l', '#E2E8F0', selectedParts)}" stroke-width="${this._strokeWidth('bone_hand_l', 5.5, selectedParts)}" stroke-linecap="round"/>
          <circle cx="277" cy="320" r="14" fill="transparent" pointer-events="all"/>
        </g>

        <!-- LOWER LIMBS (FEMUR, PATELLA, SHIN, FEET, TOES) -->
        <!-- Right Leg (Patient Right / Viewer Left) -->
        <g id="bone_femur_r" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_femur_r')" style="cursor: pointer;">
          <path d="M 154,308 Q 150,370 146,446" stroke="${this._strokeColor('bone_femur_r', '#CBD5E1', selectedParts)}" stroke-width="${this._strokeWidth('bone_femur_r', 8, selectedParts)}" stroke-linecap="round"/>
        </g>
        <g id="bone_patella_r" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_patella_r')" style="cursor: pointer;">
          <circle cx="146" cy="450" r="4.5" fill="${this._fillColor('bone_patella_r', '#F8FAFC', selectedParts)}" stroke="${this._strokeColor('bone_patella_r', '#94A3B8', selectedParts)}" stroke-width="1.4"/>
        </g>
        <g id="bone_shin_r" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_shin_r')" style="cursor: pointer;">
          <path d="M 146,458 L 143,602" stroke="${this._strokeColor('bone_shin_r', '#CBD5E1', selectedParts)}" stroke-width="${this._strokeWidth('bone_shin_r', 6, selectedParts)}" stroke-linecap="round"/>
        </g>
        <g id="bone_foot_r" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_foot_r')" style="cursor: pointer;">
          <path d="M 143,604 L 144,635 L 148,656" stroke="${this._strokeColor('bone_foot_r', '#E2E8F0', selectedParts)}" stroke-width="${this._strokeWidth('bone_foot_r', 5, selectedParts)}" stroke-linecap="round"/>
          <!-- Distal toe tips (cy="656" and cy="657") -->
          <circle cx="148" cy="656" r="3.2" fill="${this._fillColor('bone_foot_r', '#F8FAFC', selectedParts)}" stroke="#38BDF8" stroke-width="0.8"/>
          <circle cx="141" cy="657" r="2.4" fill="#CBD5E1"/>
          <circle cx="135" cy="654" r="2.0" fill="#94A3B8"/>
          <circle cx="143" cy="640" r="18" fill="transparent" pointer-events="all"/>
        </g>

        <!-- Left Leg (Patient Left / Viewer Right) -->
        <g id="bone_femur_l" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_femur_l')" style="cursor: pointer;">
          <path d="M 206,308 Q 210,370 214,446" stroke="${this._strokeColor('bone_femur_l', '#CBD5E1', selectedParts)}" stroke-width="${this._strokeWidth('bone_femur_l', 8, selectedParts)}" stroke-linecap="round"/>
        </g>
        <g id="bone_patella_l" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_patella_l')" style="cursor: pointer;">
          <circle cx="214" cy="450" r="4.5" fill="${this._fillColor('bone_patella_l', '#F8FAFC', selectedParts)}" stroke="${this._strokeColor('bone_patella_l', '#94A3B8', selectedParts)}" stroke-width="1.4"/>
        </g>
        <g id="bone_shin_l" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_shin_l')" style="cursor: pointer;">
          <path d="M 214,458 L 217,602" stroke="${this._strokeColor('bone_shin_l', '#CBD5E1', selectedParts)}" stroke-width="${this._strokeWidth('bone_shin_l', 6, selectedParts)}" stroke-linecap="round"/>
        </g>
        <g id="bone_foot_l" class="anatomy-svg-node" onclick="window.__bodymap_select('bone_foot_l')" style="cursor: pointer;">
          <path d="M 217,604 L 216,635 L 212,656" stroke="${this._strokeColor('bone_foot_l', '#E2E8F0', selectedParts)}" stroke-width="${this._strokeWidth('bone_foot_l', 5, selectedParts)}" stroke-linecap="round"/>
          <circle cx="212" cy="656" r="3.2" fill="${this._fillColor('bone_foot_l', '#F8FAFC', selectedParts)}" stroke="#38BDF8" stroke-width="0.8"/>
          <circle cx="219" cy="657" r="2.4" fill="#CBD5E1"/>
          <circle cx="225" cy="654" r="2.0" fill="#94A3B8"/>
          <circle cx="217" cy="640" r="18" fill="transparent" pointer-events="all"/>
        </g>
      </g>

      <!-- ============================================================ -->
      <!-- 3. SUBTLE ARTICULAR JOINTS (Interactive Rings, 44px Hitbox)  -->
      <!-- ============================================================ -->
      <g id="layer_major_joints">
        <!-- Shoulders -->
        <g id="joint_shoulder_r" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_shoulder_r')" tabindex="0" role="button" aria-label="Right Shoulder Joint" style="cursor: pointer;">
          <circle cx="118" cy="138" r="4.5" fill="${this._jointFill('joint_shoulder_r', selectedParts)}" stroke="${this._strokeColor('joint_shoulder_r', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_shoulder_r', 1.4, selectedParts)}" />
          <circle cx="118" cy="138" r="22" fill="transparent" pointer-events="all" />
        </g>
        <g id="joint_shoulder_l" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_shoulder_l')" tabindex="0" role="button" aria-label="Left Shoulder Joint" style="cursor: pointer;">
          <circle cx="242" cy="138" r="4.5" fill="${this._jointFill('joint_shoulder_l', selectedParts)}" stroke="${this._strokeColor('joint_shoulder_l', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_shoulder_l', 1.4, selectedParts)}" />
          <circle cx="242" cy="138" r="22" fill="transparent" pointer-events="all" />
        </g>

        <!-- Elbows -->
        <g id="joint_elbow_r" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_elbow_r')" tabindex="0" role="button" aria-label="Right Elbow Joint" style="cursor: pointer;">
          <circle cx="105" cy="216" r="4.2" fill="${this._jointFill('joint_elbow_r', selectedParts)}" stroke="${this._strokeColor('joint_elbow_r', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_elbow_r', 1.4, selectedParts)}" />
          <circle cx="105" cy="216" r="22" fill="transparent" pointer-events="all" />
        </g>
        <g id="joint_elbow_l" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_elbow_l')" tabindex="0" role="button" aria-label="Left Elbow Joint" style="cursor: pointer;">
          <circle cx="255" cy="216" r="4.2" fill="${this._jointFill('joint_elbow_l', selectedParts)}" stroke="${this._strokeColor('joint_elbow_l', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_elbow_l', 1.4, selectedParts)}" />
          <circle cx="255" cy="216" r="22" fill="transparent" pointer-events="all" />
        </g>

        <!-- Wrists -->
        <g id="joint_wrist_r" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_wrist_r')" tabindex="0" role="button" aria-label="Right Wrist Joint" style="cursor: pointer;">
          <circle cx="90" cy="302" r="4.0" fill="${this._jointFill('joint_wrist_r', selectedParts)}" stroke="${this._strokeColor('joint_wrist_r', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_wrist_r', 1.4, selectedParts)}" />
          <circle cx="90" cy="302" r="22" fill="transparent" pointer-events="all" />
        </g>
        <g id="joint_wrist_l" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_wrist_l')" tabindex="0" role="button" aria-label="Left Wrist Joint" style="cursor: pointer;">
          <circle cx="270" cy="302" r="4.0" fill="${this._jointFill('joint_wrist_l', selectedParts)}" stroke="${this._strokeColor('joint_wrist_l', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_wrist_l', 1.4, selectedParts)}" />
          <circle cx="270" cy="302" r="22" fill="transparent" pointer-events="all" />
        </g>

        <!-- Hips -->
        <g id="joint_hip_r" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_hip_r')" tabindex="0" role="button" aria-label="Right Hip Joint" style="cursor: pointer;">
          <circle cx="156" cy="312" r="4.8" fill="${this._jointFill('joint_hip_r', selectedParts)}" stroke="${this._strokeColor('joint_hip_r', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_hip_r', 1.4, selectedParts)}" />
          <circle cx="156" cy="312" r="22" fill="transparent" pointer-events="all" />
        </g>
        <g id="joint_hip_l" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_hip_l')" tabindex="0" role="button" aria-label="Left Hip Joint" style="cursor: pointer;">
          <circle cx="204" cy="312" r="4.8" fill="${this._jointFill('joint_hip_l', selectedParts)}" stroke="${this._strokeColor('joint_hip_l', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_hip_l', 1.4, selectedParts)}" />
          <circle cx="204" cy="312" r="22" fill="transparent" pointer-events="all" />
        </g>

        <!-- Knees -->
        <g id="joint_knee_r" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_knee_r')" tabindex="0" role="button" aria-label="Right Knee Joint" style="cursor: pointer;">
          <circle cx="146" cy="450" r="5.0" fill="${this._jointFill('joint_knee_r', selectedParts)}" stroke="${this._strokeColor('joint_knee_r', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_knee_r', 1.4, selectedParts)}" />
          <circle cx="146" cy="450" r="22" fill="transparent" pointer-events="all" />
        </g>
        <g id="joint_knee_l" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_knee_l')" tabindex="0" role="button" aria-label="Left Knee Joint" style="cursor: pointer;">
          <circle cx="214" cy="450" r="5.0" fill="${this._jointFill('joint_knee_l', selectedParts)}" stroke="${this._strokeColor('joint_knee_l', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_knee_l', 1.4, selectedParts)}" />
          <circle cx="214" cy="450" r="22" fill="transparent" pointer-events="all" />
        </g>

        <!-- Ankles -->
        <g id="joint_ankle_r" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_ankle_r')" tabindex="0" role="button" aria-label="Right Ankle Joint" style="cursor: pointer;">
          <circle cx="143" cy="604" r="4.2" fill="${this._jointFill('joint_ankle_r', selectedParts)}" stroke="${this._strokeColor('joint_ankle_r', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_ankle_r', 1.4, selectedParts)}" />
          <circle cx="143" cy="604" r="22" fill="transparent" pointer-events="all" />
        </g>
        <g id="joint_ankle_l" class="anatomy-svg-node" onclick="window.__bodymap_select('joint_ankle_l')" tabindex="0" role="button" aria-label="Left Ankle Joint" style="cursor: pointer;">
          <circle cx="217" cy="604" r="4.2" fill="${this._jointFill('joint_ankle_l', selectedParts)}" stroke="${this._strokeColor('joint_ankle_l', '#94A3B8', selectedParts)}" stroke-width="${this._strokeWidth('joint_ankle_l', 1.4, selectedParts)}" />
          <circle cx="217" cy="604" r="22" fill="transparent" pointer-events="all" />
        </g>
      </g>

      <!-- ============================================================ -->
      <!-- 4. VISCERAL INTERNAL ORGANS (CLEAN FLAT LAYERS)              -->
      <!-- ============================================================ -->
      <g id="layer_visceral_organs" style="${organVisibility}">
        <!-- Brain -->
        <g id="organ_brain" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_brain')" style="cursor: pointer;">
          <ellipse cx="180" cy="50" rx="18" ry="18" fill="${this._fillColor('organ_brain', '#EC4899', selectedParts, 0.45)}" stroke="${this._strokeColor('organ_brain', '#F472B6', selectedParts)}" stroke-width="1.6"/>
        </g>

        <!-- Thyroid -->
        <g id="organ_thyroid" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_thyroid')" style="cursor: pointer;">
          <path d="M 174,104 Q 180,108 186,104 Q 184,114 180,111 Q 176,114 174,104 Z" fill="${this._fillColor('organ_thyroid', '#8B5CF6', selectedParts, 0.55)}" stroke="${this._strokeColor('organ_thyroid', '#C4B5FD', selectedParts)}" stroke-width="1.4"/>
        </g>

        <!-- Lungs -->
        <g id="organ_lungs" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_lungs')" style="cursor: pointer;">
          <path d="M 146,140 C 154,140 162,150 162,182 C 162,204 146,204 138,198 C 128,188 128,154 146,140 Z" fill="${this._fillColor('organ_lungs', '#FB7185', selectedParts, 0.4)}" stroke="${this._strokeColor('organ_lungs', '#F43F5E', selectedParts)}" stroke-width="1.6"/>
          <path d="M 214,140 C 206,140 198,150 198,182 C 198,204 214,204 222,198 C 232,188 232,154 214,140 Z" fill="${this._fillColor('organ_lungs', '#FB7185', selectedParts, 0.4)}" stroke="${this._strokeColor('organ_lungs', '#F43F5E', selectedParts)}" stroke-width="1.6"/>
        </g>

        <!-- Heart -->
        <g id="organ_heart" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_heart')" style="cursor: pointer;">
          <ellipse cx="188" cy="172" rx="16" ry="18" fill="${this._fillColor('organ_heart', '#DC2626', selectedParts, 0.6)}" stroke="${this._strokeColor('organ_heart', '#EF4444', selectedParts)}" stroke-width="2"/>
        </g>

        <!-- Liver -->
        <g id="organ_liver" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_liver')" style="cursor: pointer;">
          <path d="M 136,214 Q 172,210 172,230 Q 166,248 136,244 Z" fill="${this._fillColor('organ_liver', '#D97706', selectedParts, 0.55)}" stroke="${this._strokeColor('organ_liver', '#F59E0B', selectedParts)}" stroke-width="1.8"/>
        </g>

        <!-- Stomach -->
        <g id="organ_stomach" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_stomach')" style="cursor: pointer;">
          <path d="M 186,216 Q 212,212 212,234 Q 204,252 186,246 Z" fill="${this._fillColor('organ_stomach', '#EA580C', selectedParts, 0.55)}" stroke="${this._strokeColor('organ_stomach', '#FB923C', selectedParts)}" stroke-width="1.8"/>
        </g>

        <!-- Gallbladder -->
        <g id="organ_gallbladder" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_gallbladder')" style="cursor: pointer;">
          <ellipse cx="158" cy="238" rx="5" ry="7" fill="${this._fillColor('organ_gallbladder', '#10B981', selectedParts, 0.6)}" stroke="${this._strokeColor('organ_gallbladder', '#34D399', selectedParts)}" stroke-width="1.4"/>
        </g>

        <!-- Pancreas -->
        <g id="organ_pancreas" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_pancreas')" style="cursor: pointer;">
          <ellipse cx="182" cy="242" rx="14" ry="5" fill="${this._fillColor('organ_pancreas', '#F59E0B', selectedParts, 0.5)}" stroke="${this._strokeColor('organ_pancreas', '#FBBF24', selectedParts)}" stroke-width="1.4"/>
        </g>

        <!-- Spleen -->
        <g id="organ_spleen" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_spleen')" style="cursor: pointer;">
          <ellipse cx="220" cy="226" rx="7" ry="10" fill="${this._fillColor('organ_spleen', '#EC4899', selectedParts, 0.5)}" stroke="${this._strokeColor('organ_spleen', '#F472B6', selectedParts)}" stroke-width="1.4"/>
        </g>

        <!-- Kidneys (Bilateral) -->
        <g id="organ_kidney_r" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_kidney_r')" style="cursor: pointer;">
          <ellipse cx="150" cy="238" rx="8" ry="13" fill="${this._fillColor('organ_kidney_r', '#991B1B', selectedParts, 0.45)}" stroke="${this._strokeColor('organ_kidney_r', '#EF4444', selectedParts)}" stroke-width="1.4"/>
        </g>
        <g id="organ_kidney_l" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_kidney_l')" style="cursor: pointer;">
          <ellipse cx="210" cy="234" rx="8" ry="13" fill="${this._fillColor('organ_kidney_l', '#991B1B', selectedParts, 0.45)}" stroke="${this._strokeColor('organ_kidney_l', '#EF4444', selectedParts)}" stroke-width="1.4"/>
        </g>

        <!-- Ureters -->
        <g id="organ_ureter_r" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_ureter_r')" style="cursor: pointer;">
          <line x1="150" y1="250" x2="172" y2="296" stroke="${this._strokeColor('organ_ureter_r', '#EAB308', selectedParts)}" stroke-width="2" stroke-dasharray="3,2"/>
        </g>
        <g id="organ_ureter_l" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_ureter_l')" style="cursor: pointer;">
          <line x1="210" y1="246" x2="188" y2="296" stroke="${this._strokeColor('organ_ureter_l', '#EAB308', selectedParts)}" stroke-width="2" stroke-dasharray="3,2"/>
        </g>

        <!-- Large Intestine -->
        <g id="organ_large_intestine" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_large_intestine')" style="cursor: pointer;">
          <path d="M 140,292 L 140,256 Q 180,250 220,256 L 220,292" fill="none" stroke="${this._strokeColor('organ_large_intestine', '#B45309', selectedParts)}" stroke-width="8" stroke-linecap="round" opacity="0.85"/>
        </g>

        <!-- Small Intestine -->
        <g id="organ_small_intestine" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_small_intestine')" style="cursor: pointer;">
          <rect x="156" y="266" width="48" height="24" rx="8" fill="${this._fillColor('organ_small_intestine', '#D97706', selectedParts, 0.55)}" stroke="${this._strokeColor('organ_small_intestine', '#FDE68A', selectedParts)}" stroke-width="1.6"/>
        </g>

        <!-- Bladder -->
        <g id="organ_bladder" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_bladder')" style="cursor: pointer;">
          <ellipse cx="180" cy="302" rx="14" ry="10" fill="${this._fillColor('organ_bladder', '#F59E0B', selectedParts, 0.6)}" stroke="${this._strokeColor('organ_bladder', '#FEF08A', selectedParts)}" stroke-width="1.8"/>
        </g>

        <!-- Reproductive -->
        <g id="organ_reproductive" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_reproductive')" style="cursor: pointer;">
          <circle cx="180" cy="318" r="7" fill="${this._fillColor('organ_reproductive', '#DB2777', selectedParts, 0.6)}" stroke="${this._strokeColor('organ_reproductive', '#F472B6', selectedParts)}" stroke-width="1.6"/>
        </g>
      </g>
    `;
  }

  _renderBackViewSVG(selectedParts) {
    return `
      <!-- Soft body silhouette background -->
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
            fill="#081224" stroke="#162338" stroke-width="1.4" opacity="0.9" />

      <!-- POSTERIOR SKULL / OCCIPUT (y: 20 to 88) -->
      <g id="skel_skull" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_skull')" 
         tabindex="0" role="button" aria-label="Posterior Skull Occipital" style="cursor: pointer;">
        <ellipse cx="180" cy="54" rx="26" ry="32" 
                 fill="${this._fillColor('skel_skull', '#E2E8F0', selectedParts)}" 
                 stroke="${this._strokeColor('skel_skull', '#94A3B8', selectedParts)}" 
                 stroke-width="${this._strokeWidth('skel_skull', 1.6, selectedParts)}" />
        <path d="M 160,66 Q 180,74 200,66" stroke="#64748B" stroke-width="1.4" fill="none"/>
        <circle cx="180" cy="54" r="28" fill="transparent" pointer-events="all"/>
      </g>

      <!-- CERVICAL SPINE (y: 92 to 120) -->
      <g id="skel_spine_cervical" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_cervical')"
         tabindex="0" role="button" aria-label="Cervical Spine Neck" style="cursor: pointer;">
        <rect x="175" y="92" width="10" height="28" rx="3.5" 
              fill="${this._fillColor('skel_spine_cervical', '#CBD5E1', selectedParts)}" 
              stroke="${this._strokeColor('skel_spine_cervical', '#64748B', selectedParts)}" 
              stroke-width="${this._strokeWidth('skel_spine_cervical', 1.4, selectedParts)}" />
      </g>

      <!-- SCAPULAE (DORSAL SHOULDER BLADES) -->
      <!-- In back view: viewer left is patient left! -->
      <g id="skel_scapula_l" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_scapula_l')" style="cursor: pointer;">
        <polygon points="158,134 128,144 142,190" fill="${this._fillColor('skel_scapula_l', '#334155', selectedParts)}" stroke="${this._strokeColor('skel_scapula_l', '#CBD5E1', selectedParts)}" stroke-width="1.6"/>
      </g>
      <g id="skel_scapula_r" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_scapula_r')" style="cursor: pointer;">
        <polygon points="202,134 232,144 218,190" fill="${this._fillColor('skel_scapula_r', '#334155', selectedParts)}" stroke="${this._strokeColor('skel_scapula_r', '#CBD5E1', selectedParts)}" stroke-width="1.6"/>
      </g>

      <!-- THORACIC SPINE (DORSAL T1-T12, y: 122 to 218) -->
      <g id="skel_spine_thoracic" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_thoracic')"
         tabindex="0" role="button" aria-label="Thoracic Spine Mid Back" style="cursor: pointer;">
        <rect x="174" y="122" width="12" height="96" rx="3.5" 
              fill="${this._fillColor('skel_spine_thoracic', '#CBD5E1', selectedParts)}" 
              stroke="${this._strokeColor('skel_spine_thoracic', '#64748B', selectedParts)}" 
              stroke-width="${this._strokeWidth('skel_spine_thoracic', 1.6, selectedParts)}" />
        <circle cx="180" cy="170" r="24" fill="transparent" pointer-events="all"/>
      </g>

      <!-- LUMBAR SPINE (y: 220 to 274) -->
      <g id="skel_spine_lumbar" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_lumbar')"
         tabindex="0" role="button" aria-label="Lumbar Spine Lower Back" style="cursor: pointer;">
        <rect x="174" y="220" width="12" height="52" rx="3" 
              fill="${this._fillColor('skel_spine_lumbar', '#CBD5E1', selectedParts)}" 
              stroke="${this._strokeColor('skel_spine_lumbar', '#64748B', selectedParts)}" 
              stroke-width="${this._strokeWidth('skel_spine_lumbar', 1.6, selectedParts)}" />
      </g>

      <!-- DORSAL KIDNEYS & URETERS -->
      <g id="organ_kidney_l" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_kidney_l')" style="cursor: pointer;">
        <ellipse cx="150" cy="236" rx="9" ry="14" fill="${this._fillColor('organ_kidney_l', '#991B1B', selectedParts, 0.6)}" stroke="${this._strokeColor('organ_kidney_l', '#EF4444', selectedParts)}" stroke-width="1.6"/>
      </g>
      <g id="organ_kidney_r" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_kidney_r')" style="cursor: pointer;">
        <ellipse cx="210" cy="236" rx="9" ry="14" fill="${this._fillColor('organ_kidney_r', '#991B1B', selectedParts, 0.6)}" stroke="${this._strokeColor('organ_kidney_r', '#EF4444', selectedParts)}" stroke-width="1.6"/>
      </g>
      <g id="organ_ureter_l" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_ureter_l')" style="cursor: pointer;">
        <line x1="150" y1="248" x2="172" y2="294" stroke="${this._strokeColor('organ_ureter_l', '#EAB308', selectedParts)}" stroke-width="2" stroke-dasharray="3,2"/>
      </g>
      <g id="organ_ureter_r" class="anatomy-svg-node" onclick="window.__bodymap_select('organ_ureter_r')" style="cursor: pointer;">
        <line x1="210" y1="248" x2="188" y2="294" stroke="${this._strokeColor('organ_ureter_r', '#EAB308', selectedParts)}" stroke-width="2" stroke-dasharray="3,2"/>
      </g>

      <!-- POSTERIOR PELVIS & SACRUM -->
      <g id="skel_pelvis" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_pelvis')"
         tabindex="0" role="button" aria-label="Dorsal Pelvis" style="cursor: pointer;">
        <path d="M 134,272 C 142,264 166,268 180,282 C 194,268 218,264 226,272 
                 C 232,284 226,312 212,316 C 196,322 186,318 180,316 C 174,318 164,322 148,316 
                 C 134,312 128,284 134,272 Z" 
              fill="${this._fillColor('skel_pelvis', '#CBD5E1', selectedParts)}" 
              stroke="${this._strokeColor('skel_pelvis', '#94A3B8', selectedParts)}" 
              stroke-width="${this._strokeWidth('skel_pelvis', 1.8, selectedParts)}" />
      </g>
      <g id="skel_spine_sacrum" class="anatomy-svg-node" onclick="window.__bodymap_select('skel_spine_sacrum')"
         tabindex="0" role="button" aria-label="Sacrum and Coccyx" style="cursor: pointer;">
        <polygon points="174,274 186,274 181,306 179,306" 
                 fill="${this._fillColor('skel_spine_sacrum', '#94A3B8', selectedParts)}" 
                 stroke="${this._strokeColor('skel_spine_sacrum', '#64748B', selectedParts)}" 
                 stroke-width="1.4" />
      </g>

      <!-- POSTERIOR LIMBS (DOWN TO DISTAL FEET) -->
      <path d="M 156,308 Q 150,370 146,446" stroke="${this._strokeColor('bone_femur_r', '#CBD5E1', selectedParts)}" stroke-width="7.5" stroke-linecap="round"/>
      <path d="M 146,458 L 144,598" stroke="${this._strokeColor('bone_shin_r', '#CBD5E1', selectedParts)}" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="144" cy="608" rx="5.5" ry="7.5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.4"/>
      <circle cx="148" cy="656" r="3.2" fill="#CBD5E1"/>

      <path d="M 204,308 Q 210,370 214,446" stroke="${this._strokeColor('bone_femur_l', '#CBD5E1', selectedParts)}" stroke-width="7.5" stroke-linecap="round"/>
      <path d="M 214,458 L 216,598" stroke="${this._strokeColor('bone_shin_l', '#CBD5E1', selectedParts)}" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="216" cy="608" rx="5.5" ry="7.5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.4"/>
      <circle cx="212" cy="656" r="3.2" fill="#CBD5E1"/>
    `;
  }

  _fillColor(id, defaultFill, selectedParts, opacity = 0.85) {
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
      return Math.max(3.2, defaultWidth + 1.4);
    }
    return defaultWidth;
  }

  _jointFill(id, selectedParts) {
    if (selectedParts.includes(id)) {
      return "#0284C7";
    }
    return "rgba(30, 41, 59, 0.7)";
  }

  _renderSelectedChips(selectedParts) {
    if (!selectedParts || selectedParts.length === 0) {
      return `<span style="font-size: 0.7rem; color: #64748B; font-style: italic;">Tap any bone, joint or organ to select</span>`;
    }

    const currentLang = window.app?.currentLanguage || "en";
    return selectedParts.map(id => {
      const item = ANATOMY_REGISTRY.find(x => x.id === id);
      const name = item ? (item.displayName[currentLang] || item.displayName.en) : id;
      const lat = item ? item.laterality.toUpperCase() : "";

      return `
        <span class="organ-tag-pill" style="display: inline-flex; align-items: center; gap: 4px; background: rgba(2, 132, 199, 0.25); border: 1px solid #38BDF8; color: #FFFFFF; padding: 2px 8px; border-radius: 5px; font-size: 0.7rem;">
          <strong>${name}</strong>
          ${lat ? `<small style="color: #38BDF8; font-size: 0.62rem;">(${lat})</small>` : ''}
          <button type="button" onclick="event.stopPropagation(); window.__bodymap_inst.handleRegionClick('${id}')" 
                  style="background: transparent; border: none; color: #94A3B8; cursor: pointer; padding: 0 2px; font-weight: bold;" title="Deselect"></button>
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
        <span style="font-size: 0.7rem; color: #94A3B8; font-weight: 700;">Selected Site(s):</span>
        ${this._renderSelectedChips(selectedParts)}
      `;
    }
  }

  _bindInteractiveEvents() {
    if (!this.container) return;
    const tooltip = this.container.querySelector("#anatomyHoverTooltip");

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
          <strong style="color: #38BDF8; font-size: 0.76rem; display: block;">${name}</strong>
          <span style="font-size: 0.66rem; color: #CBD5E1;">Laterality: ${lat} • System: ${sys}</span>
          <span style="font-size: 0.62rem; color: #94A3B8; display: block; margin-top: 2px;">Click to toggle selection</span>
        `;
        tooltip.style.display = "block";

        const rect = this.container.getBoundingClientRect();
        tooltip.style.left = `${Math.min(rect.width - 200, Math.max(10, e.clientX - rect.left + 15))}px`;
        tooltip.style.top = `${Math.min(rect.height - 70, Math.max(10, e.clientY - rect.top + 15))}px`;
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

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}

export const BodyMap2DFallback = BodyMap2D;

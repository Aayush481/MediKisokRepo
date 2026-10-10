/**
 * MediKiosk 3D Body Map Observable State Store
 * Manages selected anatomical parts, multi-select limits, system layer visibility,
 * opacity sliders, and camera view presets without framework coupling.
 */

class BodyMapStore {
  constructor() {
    this.state = {
      selectedParts: ["organ_heart"], // default to heart for initial vertical slice
      primarySelectedPart: "organ_heart",
      activeSystem: "all",
      opacityLevel: 0.95,
      isolateSelected: false,
      cameraPreset: "front",
      searchQuery: "",
      hoveredPart: null,
      maxMultiSelect: 5,
      is3DMode: false // 2D Human Skeleton & Visceral Anatomy Map
    };
    this.listeners = new Set();
  }

  getState() {
    return { ...this.state };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.getState());
      } catch (e) {
        console.error("[BodyMapStore] Listener error:", e);
      }
    }
  }

  selectPart(id, isMulti = false) {
    if (!id) return;
    let parts = [...this.state.selectedParts];

    if (isMulti) {
      if (parts.includes(id)) {
        parts = parts.filter(p => p !== id);
        if (parts.length === 0) parts = [id];
      } else {
        if (parts.length >= this.state.maxMultiSelect) {
          parts.shift(); // remove oldest to respect cap
        }
        parts.push(id);
      }
    } else {
      parts = [id];
    }

    this.state.selectedParts = parts;
    this.state.primarySelectedPart = id;
    this.notify();
  }

  setPrimaryPart(id) {
    if (this.state.selectedParts.includes(id)) {
      this.state.primarySelectedPart = id;
      this.notify();
    }
  }

  setSystem(systemId) {
    this.state.activeSystem = systemId || "all";
    this.notify();
  }

  setOpacity(val) {
    this.state.opacityLevel = Math.max(0.1, Math.min(1.0, parseFloat(val) || 1.0));
    this.notify();
  }

  toggleIsolate(val) {
    this.state.isolateSelected = val !== undefined ? !!val : !this.state.isolateSelected;
    this.notify();
  }

  setCameraPreset(preset) {
    this.state.cameraPreset = preset;
    this.notify();
  }

  setHoveredPart(id) {
    if (this.state.hoveredPart !== id) {
      this.state.hoveredPart = id;
      this.notify();
    }
  }

  setSearchQuery(q) {
    this.state.searchQuery = q || "";
    this.notify();
  }

  toggle3DMode() {
    this.state.is3DMode = !this.state.is3DMode;
    this.notify();
  }

  reset() {
    this.state.selectedParts = ["organ_heart"];
    this.state.primarySelectedPart = "organ_heart";
    this.state.activeSystem = "all";
    this.state.opacityLevel = 0.95;
    this.state.isolateSelected = false;
    this.state.cameraPreset = "front";
    this.state.searchQuery = "";
    this.state.hoveredPart = null;
    this.notify();
  }
}

export const bodymapStore = new BodyMapStore();

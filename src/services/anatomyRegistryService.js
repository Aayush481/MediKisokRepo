/**
 * MediKiosk Anatomy Registry Service
 * Validates mesh-to-registry mappings, laterality checks, and provides multilingual searching.
 */

import { ANATOMY_REGISTRY, ANATOMY_SYSTEMS } from "../data/anatomyRegistry.js";

class AnatomyRegistryService {
  constructor() {
    this.registry = ANATOMY_REGISTRY;
    this.meshMap = new Map();
    this.idMap = new Map();

    for (const item of this.registry) {
      this.idMap.set(item.id, item);
      this.meshMap.set(item.meshName, item);
    }
  }

  getAll() {
    return this.registry;
  }

  getSystems() {
    return ANATOMY_SYSTEMS;
  }

  getById(id) {
    return this.idMap.get(id) || null;
  }

  getByMeshName(meshName) {
    const item = this.meshMap.get(meshName);
    if (!item && (typeof process !== "undefined" && process.env?.NODE_ENV !== "production")) {
      console.error(`[AnatomyRegistry] CRITICAL: 3D Mesh "${meshName}" has no registered entry in anatomy registry!`);
    }
    return item || null;
  }

  getBySystem(systemId) {
    if (!systemId || systemId === "all") return this.registry;
    return this.registry.filter(item => item.system === systemId);
  }

  search(query, lang = "en") {
    if (!query || query.trim().length === 0) return this.registry;
    const q = query.trim().toLowerCase();

    return this.registry.filter(item => {
      const matchId = item.id.toLowerCase().includes(q);
      const matchSystem = item.system.toLowerCase().includes(q);
      const matchRegion = item.parentRegion.toLowerCase().includes(q);
      const matchSnomed = item.snomedBodyStructure.display.toLowerCase().includes(q);

      const localizedName = (item.displayName[lang] || item.displayName.en || "").toLowerCase();
      const matchLocal = localizedName.includes(q);

      const anyLangMatch = Object.values(item.displayName).some(name =>
        (name || "").toLowerCase().includes(q)
      );

      return matchId || matchSystem || matchRegion || matchSnomed || matchLocal || anyLangMatch;
    });
  }

  /**
   * Anatomical Laterality Verification:
   * Patient-perspective: Left organs have negative x-coordinates in standard anterior position.
   * Right organs have positive x-coordinates.
   */
  validateLaterality(item) {
    if (!item) return { isValid: false, reason: "Item is null" };
    const [x, y, z] = item.position;

    if (item.laterality === "left") {
      if (x >= 0) {
        return { isValid: false, reason: `Left organ "${item.id}" has non-negative X coordinate (${x}). Patient-perspective requires negative X.` };
      }
    } else if (item.laterality === "right") {
      if (x <= 0) {
        return { isValid: false, reason: `Right organ "${item.id}" has non-positive X coordinate (${x}). Patient-perspective requires positive X.` };
      }
    } else if (item.laterality === "midline" || item.laterality === "axial") {
      if (Math.abs(x) > 0.25) {
        return { isValid: false, reason: `Midline/Axial organ "${item.id}" deviates too far from center X (|${x}| > 0.25).` };
      }
    }
    return { isValid: true };
  }

  validateAll() {
    const report = {
      total: this.registry.length,
      validCount: 0,
      errors: []
    };

    for (const item of this.registry) {
      if (!item.id || !item.meshName || !item.snomedBodyStructure?.code) {
        report.errors.push(`Incomplete registry schema for item: ${item.id || "unknown"}`);
        continue;
      }

      const latCheck = this.validateLaterality(item);
      if (!latCheck.isValid) {
        report.errors.push(latCheck.reason);
        continue;
      }

      report.validCount++;
    }

    report.isFullyValid = report.errors.length === 0;
    return report;
  }
}

export const anatomyRegistryService = new AnatomyRegistryService();

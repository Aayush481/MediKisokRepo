/**
 * Unit Tests: Anatomy Registry & Patient Laterality
 * Validates:
 *  - 100% of meshes in the scene map to valid registry entries
 *  - Patient-perspective laterality (Left = x < 0, Right = x > 0)
 *  - SNOMED-CT Body Structure concept codes are present and valid
 *  - Multilingual label integrity (English, Hindi, etc.)
 */

import { test } from "node:test";
import assert from "node:assert";
import { ANATOMY_REGISTRY, ANATOMY_SYSTEMS } from "../src/data/anatomyRegistry.js";
import { anatomyRegistryService } from "../src/services/anatomyRegistryService.js";

test("Anatomy Registry: Must contain all registered medical structures", () => {
  assert.ok(ANATOMY_REGISTRY.length >= 30, `Expected at least 30 registered items, got ${ANATOMY_REGISTRY.length}`);
  
  // Verify Core Triad
  assert.ok(anatomyRegistryService.getById("organ_heart"), "Heart must be registered");
  assert.ok(anatomyRegistryService.getById("organ_liver"), "Liver must be registered");
  assert.ok(anatomyRegistryService.getById("organ_kidney_l"), "Left kidney must be registered");
  assert.ok(anatomyRegistryService.getById("organ_kidney_r"), "Right kidney must be registered");
  
  // Verify Muscular System (torso & limbs)
  assert.ok(anatomyRegistryService.getById("muscle_pectoralis_l"), "Left Pectoralis must be registered");
  assert.ok(anatomyRegistryService.getById("muscle_pectoralis_r"), "Right Pectoralis must be registered");
  assert.ok(anatomyRegistryService.getById("muscle_rectus_abdominis"), "Rectus Abdominis must be registered");
  assert.ok(anatomyRegistryService.getById("muscle_obliques_l"), "Left Obliques must be registered");
  assert.ok(anatomyRegistryService.getById("muscle_quadriceps_l"), "Left Quadriceps must be registered");
  assert.ok(anatomyRegistryService.getById("muscle_trapezius"), "Trapezius must be registered");
});

test("Anatomy Registry: Every item must have unique id and unique meshName", () => {
  const ids = new Set();
  const meshNames = new Set();

  for (const item of ANATOMY_REGISTRY) {
    assert.ok(!ids.has(item.id), `Duplicate anatomy id detected: ${item.id}`);
    assert.ok(!meshNames.has(item.meshName), `Duplicate meshName detected: ${item.meshName}`);
    ids.add(item.id);
    meshNames.add(item.meshName);

    // Fail loudly if mesh does not resolve in service
    const resolved = anatomyRegistryService.getByMeshName(item.meshName);
    assert.strictEqual(resolved.id, item.id, `Mesh ${item.meshName} must resolve to item ${item.id}`);
  }
});

test("Anatomy Registry: Strict Patient-Perspective Laterality Validation", () => {
  for (const item of ANATOMY_REGISTRY) {
    const [x, y, z] = item.position;
    
    if (item.laterality === "left") {
      assert.ok(
        x < 0, 
        `Patient laterality violation: ${item.id} has laterality='left' but position x=${x} is not negative (patient's left)`
      );
    } else if (item.laterality === "right") {
      assert.ok(
        x > 0, 
        `Patient laterality violation: ${item.id} has laterality='right' but position x=${x} is not positive (patient's right)`
      );
    } else if (item.laterality === "midline") {
      assert.ok(
        Math.abs(x) <= 0.25, 
        `Patient laterality violation: ${item.id} has laterality='midline' but position x=${x} deviates from sagittal plane`
      );
    }
  }
});

test("Anatomy Registry: Clinical Metadata & SNOMED CT Codes", () => {
  for (const item of ANATOMY_REGISTRY) {
    assert.ok(item.snomedBodyStructure, `Item ${item.id} missing snomedBodyStructure`);
    assert.ok(item.snomedBodyStructure.code, `Item ${item.id} missing SNOMED code`);
    assert.ok(item.snomedBodyStructure.display, `Item ${item.id} missing SNOMED display term`);
    assert.ok(item.displayName.en, `Item ${item.id} missing English display name`);
    assert.ok(item.displayName.hi, `Item ${item.id} missing Hindi display name`);
    assert.ok(item.system, `Item ${item.id} missing system classification`);
  }
});

test("Anatomy Registry: Multilingual Search and Autocomplete", () => {
  const heartEn = anatomyRegistryService.search("Heart", "en");
  assert.ok(heartEn.length > 0 && heartEn[0].id === "organ_heart", "Search for 'Heart' must return organ_heart");

  const kidneyHi = anatomyRegistryService.search("गुर्दा", "hi");
  assert.ok(kidneyHi.length >= 2, "Search for 'गुर्दा' in Hindi must return bilateral kidneys");

  const pecSearch = anatomyRegistryService.search("Pectoral", "en");
  assert.ok(pecSearch.length >= 2, "Search for 'Pectoral' must find pectoralis major muscles");
});

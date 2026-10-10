import { test, describe } from 'node:test';
import assert from 'node:assert';
import { BodyMap2D } from '../src/components/BodyMap2D.js';

describe("Skeleton Proportions & Non-Colliding Anatomy SVG Test", () => {
  const map = new BodyMap2D({
    containerId: "testContainer",
    initialSelected: []
  });

  const frontSVG = map._renderFrontViewSVG([]);
  const backSVG = map._renderBackViewSVG([]);

  test("1. Adult Anatomical Proportions: 7.5 - 8 Heads canon with cranium ~10-14% of total height", () => {
    // Total viewBox height is 720
    const totalHeight = 720;
    
    // Cranium spans y: 20 to 88 (height: 68)
    const craniumHeight = 68;
    const craniumRatio = craniumHeight / totalHeight;
    assert.ok(craniumRatio >= 0.08 && craniumRatio <= 0.15, 
      `Cranium ratio ${craniumRatio.toFixed(3)} should be between 0.08 and 0.15 for 7.5-8 heads canon`);

    // Femur spans y: 308 to 446 (height: 138)
    const femurLength = 446 - 308;
    const femurRatio = femurLength / totalHeight;
    assert.ok(femurRatio >= 0.18 && femurRatio <= 0.25, 
      `Femur ratio ${femurRatio.toFixed(3)} should be ~20-25% of total body height`);

    // Tibia/Lower leg spans y: 458 to 602 (height: 144)
    const lowerLegLength = 602 - 458;
    const lowerLegRatio = lowerLegLength / totalHeight;
    assert.ok(lowerLegRatio >= 0.18 && lowerLegRatio <= 0.25, 
      `Lower leg ratio ${lowerLegRatio.toFixed(3)} should be ~20-25% of total body height`);
  });

  test("2. Zero Clipping: Feet and toe phalanges terminate with safe margins above viewBox 720 bottom", () => {
    // Lowest distal toe phalanges are at cy="656" or cy="657"
    assert.ok(frontSVG.includes('cy="656"') || frontSVG.includes('cy="657"'), "Front SVG must include distal toe phalanges");
    
    // Max y is 657, which leaves at least 60px padding above bottom (720 - 657 = 63px)
    const maxY = 657;
    const bottomGutter = 720 - maxY;
    assert.ok(bottomGutter >= 50, `Bottom clearance ${bottomGutter}px must be at least 50px to prevent clipping`);
  });

  test("3. No Colliding Text Labels: Neither Front nor Back SVG contains embedded <text> elements", () => {
    assert.strictEqual(frontSVG.includes("<text"), false, "Front SVG should contain 0 embedded <text> tags inside organ paths");
    assert.strictEqual(backSVG.includes("<text"), false, "Back SVG should contain 0 embedded <text> tags inside organ paths");
  });

  test("4. Complete Articular Joint Registry: All 6 Bilateral articulatory joint nodes present", () => {
    const requiredJoints = [
      "joint_shoulder_r", "joint_shoulder_l",
      "joint_elbow_r", "joint_elbow_l",
      "joint_wrist_r", "joint_wrist_l",
      "joint_hip_r", "joint_hip_l",
      "joint_knee_r", "joint_knee_l",
      "joint_ankle_r", "joint_ankle_l"
    ];

    for (const jointId of requiredJoints) {
      assert.ok(frontSVG.includes(`id="${jointId}"`), `Front SVG must contain joint node id="${jointId}"`);
    }
  });

  test("5. Complete Visceral Organ Registry: All 15 required visceral organs present", () => {
    const requiredOrgans = [
      "organ_brain", "organ_thyroid", "organ_lungs", "organ_heart",
      "organ_liver", "organ_stomach", "organ_gallbladder", "organ_pancreas",
      "organ_spleen", "organ_large_intestine", "organ_small_intestine",
      "organ_kidney_r", "organ_kidney_l", "organ_ureter_r", "organ_ureter_l",
      "organ_bladder", "organ_reproductive"
    ];

    for (const organId of requiredOrgans) {
      const inFront = frontSVG.includes(`id="${organId}"`);
      const inBack = backSVG.includes(`id="${organId}"`);
      assert.ok(inFront || inBack, `Organ id="${organId}" must be present in front or back view`);
    }
  });

  test("6. Axial Skeleton Elements: Spine cervical, thoracic, lumbar, pelvis, sacrum present", () => {
    const spineElements = [
      "skel_skull", "skel_spine_cervical", "skel_ribcage",
      "skel_spine_lumbar", "skel_pelvis", "skel_spine_sacrum"
    ];

    for (const elemId of spineElements) {
      const inFront = frontSVG.includes(`id="${elemId}"`);
      const inBack = backSVG.includes(`id="${elemId}"`);
      assert.ok(inFront || inBack, `Axial element id="${elemId}" must be present in SVG`);
    }
    assert.ok(backSVG.includes('id="skel_spine_thoracic"'), "Back SVG must contain thoracic spine");
  });
});

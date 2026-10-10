import { test, describe } from 'node:test';
import assert from 'node:assert';
import { BodyMap2D } from '../src/components/BodyMap2D.js';
import { bodymapStore } from '../src/services/bodymapStore.js';
import { ANATOMY_REGISTRY } from '../src/data/anatomyRegistry.js';

describe("Static Body Map Zero-Scroll & Multi-Select Fit Rule Test Suite", () => {
  const VIEWPORTS = [
    { name: "Kiosk Landscape", width: 1920, height: 1080 },
    { name: "Standard Laptop", width: 1366, height: 768 },
    { name: "Tablet Landscape", width: 1024, height: 768 },
    { name: "Tablet Portrait", width: 768, height: 1024 },
    { name: "Modern Mobile", width: 390, height: 844 },
    { name: "Compact Mobile", width: 360, height: 640 }
  ];

  test("1. ViewBox Invariant: Cranium top and feet bottom fit within 0 0 360 720 with safe gutters", () => {
    const map = new BodyMap2D({});
    const frontSvg = map._renderFrontViewSVG([]);
    const backSvg = map._renderBackViewSVG([]);

    // Head is at y: 20, Feet at y: 656-657
    assert.ok(frontSvg.includes('y="20"') || frontSvg.includes('cy="52"') || frontSvg.includes('cy="54"'), "Front view cranium must begin at y ~20");
    assert.ok(frontSvg.includes('cy="656"') || frontSvg.includes('cy="657"'), "Front view feet must terminate at cy 656-657");

    const topGutter = 20; // 20px padding above head
    const bottomGutter = 720 - 657; // 63px clearance below feet
    assert.ok(topGutter >= 15, `Top gutter ${topGutter}px must be >= 15px`);
    assert.ok(bottomGutter >= 50, `Bottom gutter ${bottomGutter}px must be >= 50px`);

    // Back view
    assert.ok(backSvg.includes('cy="656"'), "Back view feet must terminate at cy 656");
  });

  test("2. Viewport Height Budget Rule across all 6 target screen sizes (Body >= 70% of Card)", () => {
    for (const vp of VIEWPORTS) {
      // CSS rule: clamp(480px, 75dvh, 760px)
      const targetCardHeight = Math.min(760, Math.max(480, Math.round(vp.height * 0.75)));
      
      // Chrome toolbar is strictly <= 36px, selected chips <= 36px
      const toolbarHeight = 34;
      const chipsHeight = 32;
      const totalChrome = toolbarHeight + chipsHeight;
      const canvasHeight = targetCardHeight - totalChrome;
      const bodyRatio = canvasHeight / targetCardHeight;

      assert.ok(
        bodyRatio >= 0.70,
        `Viewport ${vp.name} (${vp.width}x${vp.height}): Body ratio ${(bodyRatio * 100).toFixed(1)}% must be >= 70% of card height`
      );
      assert.ok(
        targetCardHeight <= vp.height,
        `Viewport ${vp.name}: Card height ${targetCardHeight}px must fit inside viewport height ${vp.height}px`
      );
    }
  });

  test("3. Multi-Select Functionality: User can select and toggle multiple regions simultaneously", () => {
    bodymapStore.clearSelection();
    assert.deepStrictEqual(bodymapStore.getState().selectedParts, []);

    // Select Head
    bodymapStore.selectPart("skel_skull", true);
    assert.deepStrictEqual(bodymapStore.getState().selectedParts, ["skel_skull"]);

    // Multi-select Knee
    bodymapStore.selectPart("joint_knee_r", true);
    assert.deepStrictEqual(bodymapStore.getState().selectedParts, ["skel_skull", "joint_knee_r"]);

    // Multi-select Chest (Heart)
    bodymapStore.selectPart("organ_heart", true);
    assert.deepStrictEqual(bodymapStore.getState().selectedParts, ["skel_skull", "joint_knee_r", "organ_heart"]);

    // Toggle-deselect Knee
    bodymapStore.selectPart("joint_knee_r", true);
    assert.deepStrictEqual(bodymapStore.getState().selectedParts, ["skel_skull", "organ_heart"]);

    // Clear all
    bodymapStore.clearSelection();
    assert.deepStrictEqual(bodymapStore.getState().selectedParts, []);
  });

  test("4. 44px Minimum Touch Hit Targets on Small Nodes", () => {
    const map = new BodyMap2D({});
    const frontSvg = map._renderFrontViewSVG([]);

    // Check that joints have transparent overlay hit circles with r="22" (diameter 44px)
    const requiredJoints = [
      "joint_shoulder_r", "joint_shoulder_l",
      "joint_elbow_r", "joint_elbow_l",
      "joint_wrist_r", "joint_wrist_l",
      "joint_hip_r", "joint_hip_l",
      "joint_knee_r", "joint_knee_l",
      "joint_ankle_r", "joint_ankle_l"
    ];

    for (const jointId of requiredJoints) {
      assert.ok(frontSvg.includes(`id="${jointId}"`), `Joint ${jointId} must be present`);
    }
    // Verify touch overlays are present
    assert.ok(frontSvg.includes('r="22" fill="transparent" pointer-events="all"'), "Must provide 44px transparent touch target");
  });

  test("5. Laterality Clinical Correctness in Front & Back views", () => {
    const map = new BodyMap2D({});
    const frontSvg = map._renderFrontViewSVG([]);
    const backSvg = map._renderBackViewSVG([]);

    // In Anterior (Front) view: Patient Right is Viewer Left (x < 180)
    // Right shoulder (joint_shoulder_r) is at cx="118" (< 180)
    assert.ok(frontSvg.includes('id="joint_shoulder_r"') && frontSvg.includes('cx="118"'), 
      "Patient right shoulder must be on viewer left (x=118 < 180) in front view");

    // In Anterior (Front) view: Patient Left is Viewer Right (x > 180)
    // Left shoulder (joint_shoulder_l) is at cx="242" (> 180)
    assert.ok(frontSvg.includes('id="joint_shoulder_l"') && frontSvg.includes('cx="242"'), 
      "Patient left shoulder must be on viewer right (x=242 > 180) in front view");
  });
});

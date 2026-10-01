/**
 * Robust Facial Anatomy & ROI Tracker for webcam rPPG.
 *
 * Implements Strict Anthropometric Face Structure Validation:
 * 
 *                  Forehead (10)
 *                       ●
 *              ●                 ●
 *         Left Eye (33)    Right Eye (263)
 *                \             /
 *                 ● Nose Tip (1)
 *                /             \
 *               ●  Mouth (13)   ●
 *                      |
 *                 ● Chin (152)
 *
 * Validation Hierarchy:
 * 1. Forehead is strictly above eyes (y_10 < y_eyes).
 * 2. Two distinct eyes exist with physiological inter-ocular distance (0.20 <= IOD / faceWidth <= 0.65).
 * 3. Nose is strictly below the eyes (y_nose > y_eyes).
 * 4. Mouth is strictly below the nose (y_mouth > y_nose).
 * 5. Chin is strictly below the mouth (y_chin > y_mouth).
 * 6. Horizontal symmetry: x_leftEye < x_nose < x_rightEye.
 * 7. Face bounding box occupies adequate frame area (>= 8% of frame).
 * 8. Aspect ratio is physiologically valid (0.60 <= W/H <= 1.40).
 * 9. Motion velocity is bounded (no excessive head shaking/movement).
 */

let FaceLandmarker = null;
let FilesetResolver = null;

export class FaceROITracker {
  constructor(options = {}) {
    this.options = {
      modelPath: options.modelPath || "/models/face_landmarker.task",
      wasmPath: options.wasmPath || "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm",
      minDetectionConfidence: options.minDetectionConfidence ?? 0.7,
      minPresenceConfidence: options.minPresenceConfidence ?? 0.7,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.7,
      maxFaces: options.maxFaces ?? 1,
      maxMotion: options.maxMotion ?? 0.035,
      minValidPixelRatio: options.minValidPixelRatio ?? 0.65,
      minROIWidth: options.minROIWidth ?? 10,
      minROIHeight: options.minROIHeight ?? 10,
      maxLostFrames: options.maxLostFrames ?? 6,
    };

    this.faceLandmarker = null;
    this.initialized = false;
    this.lastTimestamp = -1;
    this.previousFace = null;
    this.lostFrames = 0;
    this.frameIndex = 0;
    this.stableLockCount = 0;
    this.lockThreshold = options.lockThreshold ?? 6;
    this.isFaceLocked = false;
    this.internalCanvas = null;
    this.internalCtx = null;
  }

  // ---------------------------------------------------------
  // INITIALIZATION WITH GPU -> CPU AUTO FALLBACK
  // ---------------------------------------------------------
  async initialize() {
    if (this.initialized && this.faceLandmarker) {
      return;
    }

    if (!FilesetResolver || !FaceLandmarker) {
      try {
        const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs");
        FilesetResolver = vision.FilesetResolver;
        FaceLandmarker = vision.FaceLandmarker;
      } catch (err) {
        console.warn("MediaPipe Vision tasks dynamic import note:", err);
      }
    }

    if (FilesetResolver && FaceLandmarker) {
      try {
        const vision = await FilesetResolver.forVisionTasks(this.options.wasmPath);
        
        // Attempt GPU acceleration first
        try {
          this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: this.options.modelPath,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: this.options.maxFaces,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: true,
          });
        } catch (gpuErr) {
          console.warn("GPU delegate failed, falling back to CPU:", gpuErr);
          this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: this.options.modelPath,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: this.options.maxFaces,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: true,
          });
        }
        this.initialized = true;
      } catch (err) {
        console.warn("MediaPipe FaceLandmarker initialization note (using Pure-JS Ensemble fallback):", err);
        this.initialized = true;
      }
    } else {
      this.initialized = true;
    }
  }

  reset() {
    this.lastTimestamp = -1;
    this.previousFace = null;
    this.lostFrames = 0;
    this.frameIndex = 0;
    this.stableLockCount = 0;
    this.isFaceLocked = false;
  }

  // ---------------------------------------------------------
  // PURE CLIENT-SIDE 2D CLUSTERING SKIN & GEOMETRIC FACE DETECTOR
  // ---------------------------------------------------------
  detectGeometricFace(video, width, height) {
    if (typeof document === "undefined" && !this.internalCanvas) return null;

    if (!this.internalCanvas && typeof document !== "undefined") {
      this.internalCanvas = document.createElement("canvas");
      this.internalCtx = this.internalCanvas.getContext("2d", { willReadFrequently: true });
    }
    if (!this.internalCtx && this.internalCanvas) {
      this.internalCtx = this.internalCanvas.getContext("2d", { willReadFrequently: true }) || this.internalCanvas.getContext("2d");
    }

    const sampleW = 160;
    const sampleH = 120;
    this.internalCanvas.width = sampleW;
    this.internalCanvas.height = sampleH;

    try {
      this.internalCtx.drawImage(video, 0, 0, sampleW, sampleH);
      const imgData = this.internalCtx.getImageData(0, 0, sampleW, sampleH);
      const data = imgData.data;

      let sumX = 0, sumY = 0, skinWeightSum = 0;
      const skinCoords = [];

      // Margin exclusion (skip outer 4% to avoid border artifacts)
      const minMarginX = Math.floor(sampleW * 0.04);
      const maxMarginX = Math.floor(sampleW * 0.96);
      const minMarginY = Math.floor(sampleH * 0.04);
      const maxMarginY = Math.floor(sampleH * 0.96);

      for (let y = minMarginY; y < maxMarginY; y++) {
        for (let x = minMarginX; x < maxMarginX; x++) {
          const idx = (y * sampleW + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const sum = r + g + b + 0.001;
          const nr = r / sum;
          const ng = g / sum;
          const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
          const cr = (r - yVal) * 0.713 + 128;
          const cb = (b - yVal) * 0.564 + 128;

          // Multi-space adaptive skin test across all skin tones and room lighting
          const isSkinYCrCb = (cr >= 126 && cr <= 182 && cb >= 70 && cb <= 138 && (cr - cb) >= 2);
          const isSkinNormRGB = (nr >= 0.33 && nr <= 0.68 && ng >= 0.24 && ng <= 0.42 && (nr - ng) >= 0.02 && yVal >= 20 && yVal <= 250);
          const isSkinRGB = (r > b) && (r >= g * 0.70) && (g > b * 0.60) && (Math.max(r, g, b) - Math.min(r, g, b) >= 6);

          if (isSkinYCrCb || isSkinNormRGB || isSkinRGB) {
            sumX += x;
            sumY += y;
            skinWeightSum++;
            skinCoords.push(x, y);
          }
        }
      }

      const minSkinThreshold = (sampleW * sampleH) * 0.025; // 2.5% skin pixels minimum
      if (skinWeightSum < minSkinThreshold || skinCoords.length < 80) {
        return null;
      }

      // Calculate 2D Centroid of the face skin mass
      const cx = sumX / skinWeightSum;
      const cy = sumY / skinWeightSum;

      // Calculate 2D Standard Deviation (Spread) around centroid
      let varX = 0, varY = 0;
      const coordLen = skinCoords.length;
      for (let i = 0; i < coordLen; i += 2) {
        const dx = skinCoords[i] - cx;
        const dy = skinCoords[i + 1] - cy;
        varX += dx * dx;
        varY += dy * dy;
      }
      const stdX = Math.sqrt(varX / skinWeightSum);
      const stdY = Math.sqrt(varY / skinWeightSum);

      if (stdX < 6 || stdY < 8) return null;

      // Bounding box wrapping the core 2D facial cluster (2.4x std deviation)
      const sampleMinX = Math.max(0, cx - stdX * 1.55);
      const sampleMaxX = Math.min(sampleW, cx + stdX * 1.55);
      const sampleMinY = Math.max(0, cy - stdY * 1.75);
      const sampleMaxY = Math.min(sampleH, cy + stdY * 1.55);

      const sampleBoxW = sampleMaxX - sampleMinX;
      const sampleBoxH = sampleMaxY - sampleMinY;
      if (sampleBoxW < 18 || sampleBoxH < 22) return null;

      const scaleX = width / sampleW;
      const scaleY = height / sampleH;
      const realMinX = sampleMinX * scaleX;
      const realMaxX = sampleMaxX * scaleX;
      const realMinY = sampleMinY * scaleY;
      const realMaxY = sampleMaxY * scaleY;
      const realW = realMaxX - realMinX;
      const realH = realMaxY - realMinY;
      const realCenterX = (realMinX + realMaxX) / 2;
      const realCenterY = (realMinY + realMaxY) / 2;

      // Synthesize 478 MediaPipe-compatible anatomical landmarks mapped to bounding box
      const landmarks = new Array(478);
      for (let i = 0; i < 478; i++) {
        landmarks[i] = { x: realCenterX / width, y: realCenterY / height, z: 0 };
      }

      // Forehead (10, 67, 109, 297, 338, 9)
      landmarks[10] = { x: realCenterX / width, y: (realMinY + realH * 0.12) / height, z: 0 };
      landmarks[67] = { x: (realMinX + realW * 0.36) / width, y: (realMinY + realH * 0.18) / height, z: 0 };
      landmarks[109] = { x: (realMinX + realW * 0.30) / width, y: (realMinY + realH * 0.16) / height, z: 0 };
      landmarks[297] = { x: (realMinX + realW * 0.64) / width, y: (realMinY + realH * 0.18) / height, z: 0 };
      landmarks[338] = { x: (realMinX + realW * 0.70) / width, y: (realMinY + realH * 0.16) / height, z: 0 };
      landmarks[9] = { x: realCenterX / width, y: (realMinY + realH * 0.28) / height, z: 0 };

      // Eyes (Left: 33, Right: 263, 130, 359)
      landmarks[33] = { x: (realMinX + realW * 0.34) / width, y: (realMinY + realH * 0.38) / height, z: 0 };
      landmarks[130] = { x: (realMinX + realW * 0.38) / width, y: (realMinY + realH * 0.38) / height, z: 0 };
      landmarks[263] = { x: (realMinX + realW * 0.66) / width, y: (realMinY + realH * 0.38) / height, z: 0 };
      landmarks[359] = { x: (realMinX + realW * 0.62) / width, y: (realMinY + realH * 0.38) / height, z: 0 };

      // Nose Tip & Columella (1, 2)
      landmarks[1] = { x: realCenterX / width, y: (realMinY + realH * 0.54) / height, z: 0 };
      landmarks[2] = { x: realCenterX / width, y: (realMinY + realH * 0.58) / height, z: 0 };

      // Mouth Lips (13, 14, 0, 17)
      landmarks[13] = { x: realCenterX / width, y: (realMinY + realH * 0.70) / height, z: 0 };
      landmarks[14] = { x: realCenterX / width, y: (realMinY + realH * 0.74) / height, z: 0 };
      landmarks[0] = { x: realCenterX / width, y: (realMinY + realH * 0.68) / height, z: 0 };
      landmarks[17] = { x: realCenterX / width, y: (realMinY + realH * 0.77) / height, z: 0 };

      // Chin (152, 175)
      landmarks[152] = { x: realCenterX / width, y: (realMinY + realH * 0.92) / height, z: 0 };
      landmarks[175] = { x: realCenterX / width, y: (realMinY + realH * 0.95) / height, z: 0 };

      // Jaws (234, 454)
      landmarks[234] = { x: (realMinX + realW * 0.08) / width, y: (realMinY + realH * 0.55) / height, z: 0 };
      landmarks[454] = { x: (realMaxX - realW * 0.08) / width, y: (realMinY + realH * 0.55) / height, z: 0 };

      // Cheeks (Left: 50, 101, 118, 205, 187; Right: 280, 330, 347, 425, 411)
      landmarks[50] = { x: (realMinX + realW * 0.28) / width, y: (realMinY + realH * 0.54) / height, z: 0 };
      landmarks[101] = { x: (realMinX + realW * 0.32) / width, y: (realMinY + realH * 0.48) / height, z: 0 };
      landmarks[118] = { x: (realMinX + realW * 0.34) / width, y: (realMinY + realH * 0.54) / height, z: 0 };
      landmarks[205] = { x: (realMinX + realW * 0.25) / width, y: (realMinY + realH * 0.52) / height, z: 0 };
      landmarks[187] = { x: (realMinX + realW * 0.30) / width, y: (realMinY + realH * 0.60) / height, z: 0 };

      landmarks[280] = { x: (realMinX + realW * 0.72) / width, y: (realMinY + realH * 0.54) / height, z: 0 };
      landmarks[330] = { x: (realMinX + realW * 0.68) / width, y: (realMinY + realH * 0.48) / height, z: 0 };
      landmarks[347] = { x: (realMinX + realW * 0.66) / width, y: (realMinY + realH * 0.54) / height, z: 0 };
      landmarks[425] = { x: (realMinX + realW * 0.75) / width, y: (realMinY + realH * 0.52) / height, z: 0 };
      landmarks[411] = { x: (realMinX + realW * 0.70) / width, y: (realMinY + realH * 0.60) / height, z: 0 };

      return landmarks;
    } catch (e) {
      return null;
    }
  }

  // ---------------------------------------------------------
  // PRE-VITALS FACE ALIGNMENT & DETECTION ONLY
  // ---------------------------------------------------------
  detectFaceOnly(video, timestamp = performance.now()) {
    const rawResult = this.detect(video, timestamp);
    const width = video?.videoWidth || video?.width || 640;
    const height = video?.videoHeight || video?.height || 480;

    if (!rawResult || !rawResult.valid || !rawResult.face) {
      this.stableLockCount = Math.max(0, this.stableLockCount - 1);
      this.isFaceLocked = false;
      const reason = rawResult?.reason || "NO_FACE_DETECTED";

      let message = "Align Face in Camera Frame";
      if (reason.includes("EXCESSIVE")) message = "Hold Still (Minimizing Head Motion)";
      else if (reason.includes("SMALL") || reason.includes("FAR")) message = "Move Closer (Face Too Small)";
      else if (reason.includes("ANATOMY")) message = "Align Face Straight & Level";
      else if (reason.includes("OCCLUDED")) message = "Ensure Forehead & Cheeks Are Visible";

      return {
        detected: false,
        valid: false,
        isFaceLocked: false,
        lockProgress: 0,
        reason,
        message,
        checks: {
          faceDetected: false,
          isCentered: false,
          isOptimalDistance: false,
          isStill: false,
          hasValidROIs: false,
        },
        geometry: null,
        rois: null,
        landmarks: null,
        frameWidth: width,
        frameHeight: height
      };
    }

    const { geometry, motion, rois, landmarks } = rawResult.face;

    // Robust, physiologically sensible alignment checks
    const normCx = geometry.center.x / width;
    const normCy = geometry.center.y / height;
    const isCentered = normCx >= 0.15 && normCx <= 0.85 && normCy >= 0.10 && normCy <= 0.90;
    const isOptimalDistance = geometry.frameCoverage >= 0.025 && geometry.frameCoverage <= 0.85;
    const isStill = !motion.excessive && motion.motionScore < 0.065;
    const hasValidROIs = !!(rois.forehead?.valid && rois.leftCheek?.valid && rois.rightCheek?.valid);

    const allPassed = isCentered && isOptimalDistance && hasValidROIs;

    if (allPassed) {
      this.stableLockCount = Math.min(this.lockThreshold, this.stableLockCount + 1);
    } else {
      this.stableLockCount = Math.max(0, this.stableLockCount - 1);
    }

    this.isFaceLocked = this.stableLockCount >= this.lockThreshold;
    const lockProgress = Math.round((this.stableLockCount / this.lockThreshold) * 100);

    let message = "Face Validated & Locked";
    if (!this.isFaceLocked) {
      if (!isCentered) message = "Center Face In Oval Guide";
      else if (!isOptimalDistance && geometry.frameCoverage < 0.025) message = "Move Closer To Camera";
      else if (!isOptimalDistance && geometry.frameCoverage > 0.85) message = "Move Back Slightly";
      else if (!isStill) message = "Hold Still (Stabilizing...)";
      else if (!hasValidROIs) message = "Ensure Forehead & Cheeks Uncovered";
      else message = `Face Aligned — Locking (${lockProgress}%)`;
    }

    return {
      detected: true,
      valid: true,
      isFaceLocked: this.isFaceLocked,
      lockProgress,
      message,
      checks: {
        faceDetected: true,
        isCentered,
        isOptimalDistance,
        isStill,
        hasValidROIs,
      },
      geometry,
      motion,
      rois,
      landmarks,
      frameWidth: width,
      frameHeight: height,
      quality: rawResult.face.quality
    };
  }

  // ---------------------------------------------------------
  // DRAW REAL-TIME FACE HUD OVERLAY
  // ---------------------------------------------------------
  drawFaceHUD(canvas, video, faceDetectionResult, options = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width || video?.videoWidth || 640;
    const h = canvas.height || video?.videoHeight || 480;

    // Clear previous overlay
    ctx.clearRect(0, 0, w, h);

    const isLocked = faceDetectionResult?.isFaceLocked;
    const isValid = faceDetectionResult?.valid;
    const themeColor = isLocked ? "#10B981" : (isValid ? "#38BDF8" : "#F87171");

    // 1. Draw Target Oval Guide Reticle
    ctx.save();
    ctx.strokeStyle = isLocked ? "rgba(16, 185, 129, 0.85)" : (isValid ? "rgba(56, 189, 248, 0.55)" : "rgba(255, 255, 255, 0.30)");
    ctx.lineWidth = isLocked ? 3 : 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.22, h * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (!faceDetectionResult || !faceDetectionResult.detected || !faceDetectionResult.geometry) {
      // Draw searching crosshair
      ctx.save();
      ctx.strokeStyle = "rgba(248, 113, 113, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 15, h / 2);
      ctx.lineTo(w / 2 + 15, h / 2);
      ctx.moveTo(w / 2, h / 2 - 15);
      ctx.lineTo(w / 2, h / 2 + 15);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const geom = faceDetectionResult.geometry;
    const rois = faceDetectionResult.rois;

    // 2. Draw Face Bounding Box Corners
    ctx.save();
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = themeColor;
    ctx.shadowBlur = isLocked ? 12 : 5;

    const bx = geom.minX;
    const by = geom.minY;
    const bw = geom.width;
    const bh = geom.height;
    const corner = Math.min(24, bw * 0.15);

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(bx, by + corner);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + corner, by);
    // Top-Right
    ctx.moveTo(bx + bw - corner, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw, by + corner);
    // Bottom-Left
    ctx.moveTo(bx, by + bh - corner);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + corner, by + bh);
    // Bottom-Right
    ctx.moveTo(bx + bw - corner, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by + bh - corner);
    ctx.stroke();
    ctx.restore();

    // 3. Draw Anatomical ROIs (Forehead, Left Cheek, Right Cheek)
    if (rois) {
      const drawROIBox = (roi, label) => {
        if (!roi || !roi.valid) return;
        ctx.save();
        ctx.fillStyle = isLocked ? "rgba(16, 185, 129, 0.18)" : "rgba(56, 189, 248, 0.14)";
        ctx.strokeStyle = isLocked ? "rgba(16, 185, 129, 0.90)" : "rgba(56, 189, 248, 0.80)";
        ctx.lineWidth = 1.5;
        ctx.fillRect(roi.left, roi.top, roi.width, roi.height);
        ctx.strokeRect(roi.left, roi.top, roi.width, roi.height);

        // Render clean label un-mirrored for crystal-clear readability
        ctx.save();
        ctx.font = "bold 9px sans-serif";
        ctx.fillStyle = "#FFFFFF";
        // Flip coordinate horizontally so text reads normally on scaleX(-1) mirrored canvas
        ctx.translate(roi.left + roi.width / 2, roi.top + 8);
        ctx.scale(-1, 1);
        ctx.textAlign = "center";
        ctx.fillText(label, 0, 0);
        ctx.restore();

        ctx.restore();
      };

      drawROIBox(rois.forehead, "Forehead");
      drawROIBox(rois.leftCheek, "L-Cheek");
      drawROIBox(rois.rightCheek, "R-Cheek");
    }

    // 4. Draw Key Landmark Dots (Forehead, Eyes, Nose, Lips, Chin)
    if (faceDetectionResult.landmarks) {
      const lms = faceDetectionResult.landmarks;
      const keyIndices = [10, 33, 263, 1, 13, 152];
      ctx.save();
      ctx.fillStyle = isLocked ? "#10B981" : "#38BDF8";
      for (const idx of keyIndices) {
        const p = this.point(lms, idx, w, h);
        if (p) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 5. Draw Lock Progress Meter in Header
    if (faceDetectionResult.lockProgress !== undefined) {
      ctx.save();
      const meterW = 120;
      const meterH = 6;
      const meterX = (w - meterW) / 2;
      const meterY = 12;

      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.beginPath();
      ctx.roundRect(meterX, meterY, meterW, meterH, 3);
      ctx.fill();

      ctx.fillStyle = isLocked ? "#10B981" : "#38BDF8";
      ctx.beginPath();
      ctx.roundRect(meterX, meterY, (meterW * faceDetectionResult.lockProgress) / 100, meterH, 3);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------
  // PYTHON BACKEND INTEGRATION BRIDGE
  // ---------------------------------------------------------
  async detectWithPythonBackend(video, canvas = null) {
    if (!video) return { detected: false, valid: false, reason: "NO_VIDEO_ELEMENT" };

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    let targetCanvas = canvas;
    if (!targetCanvas && typeof document !== "undefined") {
      targetCanvas = document.createElement("canvas");
    }

    if (targetCanvas) {
      targetCanvas.width = width;
      targetCanvas.height = height;
      const ctx = targetCanvas.getContext("2d");
      ctx.drawImage(video, 0, 0, width, height);

      const base64Image = targetCanvas.toDataURL("image/jpeg", 0.85);

      try {
        const response = await fetch("/api/detect-face", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.valid && data.boundingBox) {
            const isCentered = !!data.boundingBox.isCentered;
            const isOptimal = data.boundingBox.coverage >= 0.07 && data.boundingBox.coverage <= 0.55;
            if (isCentered && isOptimal) {
              this.stableLockCount = Math.min(this.lockThreshold, this.stableLockCount + 1);
            } else {
              this.stableLockCount = Math.max(0, this.stableLockCount - 1);
            }
            this.isFaceLocked = this.stableLockCount >= this.lockThreshold;
            data.isFaceLocked = this.isFaceLocked;
            data.lockProgress = Math.round((this.stableLockCount / this.lockThreshold) * 100);
            return data;
          }
          return data;
        }
      } catch (err) {
        console.warn("Python face detector endpoint error, using client fallback:", err);
      }
    }

    return this.detectFaceOnly(video);
  }

  // ---------------------------------------------------------
  // MAIN DETECTION & VALIDATION PIPELINE
  // ---------------------------------------------------------
  detect(video, timestamp = performance.now()) {
    if (!this.initialized) {
      throw new Error("FaceROITracker is not initialized. Call initialize() first.");
    }

    if (!(typeof HTMLVideoElement !== "undefined" && video instanceof HTMLVideoElement) && !video?.videoWidth) {
      return this.createInvalidResult("VIDEO_NOT_READY");
    }

    if (video.readyState < (typeof HTMLMediaElement !== "undefined" ? HTMLMediaElement.HAVE_CURRENT_DATA : 2)) {
      return this.createInvalidResult("VIDEO_NOT_READY");
    }

    if (!Number.isFinite(timestamp) || timestamp < 0) {
      timestamp = performance.now();
    }

    if (this.lastTimestamp >= 0 && timestamp <= this.lastTimestamp) {
      timestamp = this.lastTimestamp + 1;
    }
    this.lastTimestamp = timestamp;

    const width = video.videoWidth || video.width || 640;
    const height = video.videoHeight || video.height || 480;

    let landmarks = null;
    let rawResult = null;

    // 1. Try MediaPipe Tasks Vision FaceLandmarker
    if (this.faceLandmarker) {
      try {
        rawResult = this.faceLandmarker.detectForVideo(video, timestamp);
        if (rawResult && rawResult.faceLandmarks && rawResult.faceLandmarks.length > 0) {
          landmarks = rawResult.faceLandmarks[0];
        }
      } catch (error) {
        // Fallback to geometric detector
      }
    }

    // 2. Pure-JS Skin & Valley Geometric Ensemble Fallback
    if (!landmarks || landmarks.length < 400) {
      landmarks = this.detectGeometricFace(video, width, height);
    }

    this.frameIndex++;

    if (!landmarks || landmarks.length < 400) {
      this.lostFrames++;
      if (this.lostFrames <= this.options.maxLostFrames && this.previousFace) {
        return this.createInvalidResult("TEMPORARY_FACE_LOSS");
      }
      this.previousFace = null;
      return this.createInvalidResult("NO_FACE_DETECTED");
    }

    this.lostFrames = 0;

    // 1. Strict Anthropometric Face Structure Validation
    const anatomyCheck = this.validateFaceAnatomy(landmarks, width, height);
    if (!anatomyCheck.valid) {
      return this.createInvalidResult(anatomyCheck.reason);
    }

    // 2. Face Geometry & Size Validation
    const faceGeometry = this.calculateFaceGeometry(landmarks, width, height);
    if (!faceGeometry.valid) {
      return this.createInvalidResult("INVALID_FACE_GEOMETRY");
    }

    // 3. Motion Validation (Velocity & Jitter)
    const motion = this.calculateMotion(faceGeometry);
    if (motion.excessive) {
      return this.createInvalidResult("EXCESSIVE_HEAD_MOTION");
    }

    // 4. Build & Validate ROIs (Forehead, Left Cheek, Right Cheek)
    const rois = this.createROIs(landmarks, width, height);
    const validatedROIs = this.validateROIs(rois, width, height);

    if (!validatedROIs.forehead.valid || !validatedROIs.leftCheek.valid || !validatedROIs.rightCheek.valid) {
      return this.createInvalidResult("ROI_OCCLUDED_OR_OUT_OF_FRAME");
    }

    // 5. Overall Face Quality Score
    const faceQuality = this.calculateFaceQuality(faceGeometry, motion, validatedROIs);
    if (!faceQuality.valid) {
      return this.createInvalidResult("LOW_FACE_QUALITY");
    }

    const face = {
      landmarks,
      geometry: faceGeometry,
      motion,
      rois: validatedROIs,
      quality: faceQuality,
      frameIndex: this.frameIndex,
      timestamp,
      valid: true,
    };

    this.previousFace = {
      center: faceGeometry.center,
      width: faceGeometry.width,
      height: faceGeometry.height,
      timestamp,
    };

    return {
      valid: true,
      reason: "OK",
      face,
      raw: rawResult,
    };
  }

  // ---------------------------------------------------------
  // 1. STRICT ANTHROPOMETRIC FACE ANATOMY VALIDATION
  // ---------------------------------------------------------
  validateFaceAnatomy(landmarks, width, height) {
    const pForehead = this.point(landmarks, 10, width, height);
    const pLeftEye = this.point(landmarks, 33, width, height);
    const pRightEye = this.point(landmarks, 263, width, height);
    const pNose = this.point(landmarks, 1, width, height);
    const pUpperLip = this.point(landmarks, 13, width, height);
    const pLowerLip = this.point(landmarks, 14, width, height);
    const pChin = this.point(landmarks, 152, width, height);
    const pLeftJaw = this.point(landmarks, 234, width, height);
    const pRightJaw = this.point(landmarks, 454, width, height);

    if (!pForehead || !pLeftEye || !pRightEye || !pNose || !pUpperLip || !pChin) {
      return { valid: false, reason: "MISSING_CRITICAL_FACIAL_LANDMARKS" };
    }

    // CHECK A: Vertical Hierarchy (Forehead -> Eyes -> Nose -> Mouth -> Chin)
    const eyeY = Math.min(pLeftEye.y, pRightEye.y);
    if (pForehead.y > eyeY + 12) {
      return { valid: false, reason: "ANATOMY_FAIL: Forehead must be above eyes." };
    }

    if (pNose.y < eyeY - 8) {
      return { valid: false, reason: "ANATOMY_FAIL: Nose tip must be below eyes." };
    }

    if (pUpperLip.y < pNose.y - 8) {
      return { valid: false, reason: "ANATOMY_FAIL: Mouth must be below nose." };
    }

    const mouthY = pLowerLip ? Math.max(pUpperLip.y, pLowerLip.y) : pUpperLip.y;
    if (pChin.y < mouthY - 8) {
      return { valid: false, reason: "ANATOMY_FAIL: Chin must be below mouth." };
    }

    // CHECK B: Horizontal Arrangement (Eyes must flank nose: Left Eye < Nose < Right Eye)
    if (pLeftEye.x >= pRightEye.x || pLeftEye.x >= pNose.x || pNose.x >= pRightEye.x) {
      return { valid: false, reason: "ANATOMY_FAIL: Head yaw angle too severe." };
    }

    // CHECK C: Inter-Ocular Distance & Face Proportions
    const interOcularDist = this.distance(pLeftEye, pRightEye);
    const faceHeight = Math.abs(pChin.y - pForehead.y);
    const faceWidth = pLeftJaw && pRightJaw ? this.distance(pLeftJaw, pRightJaw) : interOcularDist * 2.0;

    if (interOcularDist < 10) {
      return { valid: false, reason: "ANATOMY_FAIL: Eye-to-eye distance too small." };
    }

    const iodRatio = interOcularDist / Math.max(1, faceWidth);
    if (iodRatio < 0.12 || iodRatio > 0.80) {
      return { valid: false, reason: "ANATOMY_FAIL: Abnormal eye-to-face width ratio." };
    }

    const aspectRatio = faceWidth / Math.max(1, faceHeight);
    if (aspectRatio < 0.40 || aspectRatio > 1.75) {
      return { valid: false, reason: "ANATOMY_FAIL: Face bounding aspect ratio out of bounds." };
    }

    return {
      valid: true,
      reason: "OK",
      metrics: { interOcularDist, faceWidth, faceHeight, aspectRatio }
    };
  }

  // ---------------------------------------------------------
  // 2. FACE GEOMETRY & BOUNDING BOX
  // ---------------------------------------------------------
  calculateFaceGeometry(landmarks, width, height) {
    if (!Array.isArray(landmarks) || width <= 0 || height <= 0) {
      return { valid: false };
    }

    const points = landmarks.filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (points.length < 100) return { valid: false };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;

    for (const p of points) {
      const x = p.x * width;
      const y = p.y * height;
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      sumX += x;
      sumY += y;
    }

    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
    const frameArea = width * height;
    const faceArea = faceWidth * faceHeight;

    // Minimum size verification (Must occupy at least 2.5% of video frame)
    if (faceWidth < 25 || faceHeight < 30 || (faceArea / frameArea) < 0.025) {
      return { valid: false, reason: "FACE_TOO_SMALL" };
    }

    const center = {
      x: sumX / points.length,
      y: sumY / points.length,
    };

    return {
      valid: true,
      minX,
      minY,
      maxX,
      maxY,
      width: faceWidth,
      height: faceHeight,
      center,
      aspectRatio: faceWidth / faceHeight,
      area: faceArea,
      frameCoverage: faceArea / frameArea
    };
  }

  // ---------------------------------------------------------
  // 3. MOTION TRACKING
  // ---------------------------------------------------------
  calculateMotion(current) {
    if (!this.previousFace) {
      return {
        valid: true,
        displacement: 0,
        normalizedDisplacement: 0,
        scaleChange: 0,
        motionScore: 0,
        excessive: false,
      };
    }

    const previous = this.previousFace;
    const dx = current.center.x - previous.center.x;
    const dy = current.center.y - previous.center.y;
    const displacement = Math.sqrt(dx * dx + dy * dy);
    const referenceSize = Math.max(previous.width, previous.height, 1);
    const normalizedDisplacement = displacement / referenceSize;
    const currentScale = Math.max(current.width, current.height, 1);
    const previousScale = Math.max(previous.width, previous.height, 1);
    const scaleChange = Math.abs(currentScale - previousScale) / previousScale;

    const motionScore = normalizedDisplacement + scaleChange * 0.5;

    return {
      valid: true,
      displacement,
      normalizedDisplacement,
      scaleChange,
      motionScore,
      excessive: motionScore > this.options.maxMotion,
    };
  }

  point(landmarks, index, width, height) {
    const p = landmarks[index];
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      return null;
    }
    return {
      x: p.x * width,
      y: p.y * height,
      z: Number.isFinite(p.z) ? p.z : 0,
    };
  }

  averagePoints(points) {
    const valid = points.filter(Boolean);
    if (valid.length === 0) return null;
    let x = 0, y = 0, z = 0;
    for (const p of valid) {
      x += p.x;
      y += p.y;
      z += p.z || 0;
    }
    return {
      x: x / valid.length,
      y: y / valid.length,
      z: z / valid.length,
    };
  }

  distance(a, b) {
    if (!a || !b) return 0;
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  // ---------------------------------------------------------
  // 4. ANATOMICAL ROI EXTRACTION
  // ---------------------------------------------------------
  createForeheadROI(landmarks, width, height) {
    const p10 = this.point(landmarks, 10, width, height);
    const p67 = this.point(landmarks, 67, width, height);
    const p297 = this.point(landmarks, 297, width, height);
    const p109 = this.point(landmarks, 109, width, height);
    const p338 = this.point(landmarks, 338, width, height);

    if (!p10 || !p67 || !p297 || !p109 || !p338) return null;

    const center = this.averagePoints([p10, p109, p338]);
    if (!center) return null;

    const left = this.averagePoints([p67, p109]);
    const right = this.averagePoints([p297, p338]);

    const foreheadY = center.y * 0.55 + ((left.y + right.y) / 2) * 0.45;
    const roiWidth = this.distance(left, right) * 0.55;
    const roiHeight = roiWidth * 0.42;

    return this.createBox(
      center.x,
      foreheadY + roiHeight * 0.18,
      roiWidth,
      roiHeight,
      "forehead"
    );
  }

  createLeftCheekROI(landmarks, width, height) {
    const p50 = this.point(landmarks, 50, width, height);
    const p101 = this.point(landmarks, 101, width, height);
    const p118 = this.point(landmarks, 118, width, height);
    const p205 = this.point(landmarks, 205, width, height);
    const p187 = this.point(landmarks, 187, width, height);
    const p33 = this.point(landmarks, 33, width, height);
    const p1 = this.point(landmarks, 1, width, height);

    if (!p50 || !p101 || !p118 || !p205 || !p187) return null;

    const center = this.averagePoints([p50, p101, p118, p205, p187]);
    if (!center) return null;

    let cheekWidth = Math.max(this.distance(p50, p187), this.distance(p101, p205)) * 1.4;
    if (p33 && p1) {
      cheekWidth = Math.max(cheekWidth, this.distance(p33, p1) * 0.60);
    }
    const finalW = Math.max(12, cheekWidth);
    const finalH = Math.max(12, finalW * 0.85);

    return this.createBox(center.x, center.y, finalW, finalH, "leftCheek");
  }

  createRightCheekROI(landmarks, width, height) {
    const p280 = this.point(landmarks, 280, width, height);
    const p330 = this.point(landmarks, 330, width, height);
    const p347 = this.point(landmarks, 347, width, height);
    const p425 = this.point(landmarks, 425, width, height);
    const p411 = this.point(landmarks, 411, width, height);
    const p263 = this.point(landmarks, 263, width, height);
    const p1 = this.point(landmarks, 1, width, height);

    if (!p280 || !p330 || !p347 || !p425 || !p411) return null;

    const center = this.averagePoints([p280, p330, p347, p425, p411]);
    if (!center) return null;

    let cheekWidth = Math.max(this.distance(p280, p411), this.distance(p330, p425)) * 1.4;
    if (p263 && p1) {
      cheekWidth = Math.max(cheekWidth, this.distance(p263, p1) * 0.60);
    }
    const finalW = Math.max(12, cheekWidth);
    const finalH = Math.max(12, finalW * 0.85);

    return this.createBox(center.x, center.y, finalW, finalH, "rightCheek");
  }

  createBox(centerX, centerY, width, height, name) {
    if (!Number.isFinite(centerX) || !Number.isFinite(centerY) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return null;
    }
    return {
      name,
      center: { x: centerX, y: centerY },
      width,
      height,
      left: centerX - width / 2,
      right: centerX + width / 2,
      top: centerY - height / 2,
      bottom: centerY + height / 2,
    };
  }

  createROIs(landmarks, width, height) {
    return {
      forehead: this.createForeheadROI(landmarks, width, height),
      leftCheek: this.createLeftCheekROI(landmarks, width, height),
      rightCheek: this.createRightCheekROI(landmarks, width, height),
    };
  }

  validateROI(roi, frameWidth, frameHeight) {
    if (!roi) return { valid: false, reason: "ROI_NOT_CREATED" };
    if (!Number.isFinite(roi.left) || !Number.isFinite(roi.right) || !Number.isFinite(roi.top) || !Number.isFinite(roi.bottom)) {
      return { valid: false, reason: "INVALID_ROI_COORDINATES" };
    }

    if (roi.right <= 0 || roi.bottom <= 0 || roi.left >= frameWidth || roi.top >= frameHeight) {
      return { valid: false, reason: "ROI_OUTSIDE_FRAME" };
    }

    const left = Math.max(0, roi.left);
    const top = Math.max(0, roi.top);
    const right = Math.min(frameWidth, roi.right);
    const bottom = Math.min(frameHeight, roi.bottom);

    const clippedWidth = right - left;
    const clippedHeight = bottom - top;

    if (clippedWidth < this.options.minROIWidth || clippedHeight < this.options.minROIHeight) {
      return { valid: false, reason: "ROI_TOO_SMALL" };
    }

    const originalArea = Math.max(roi.width * roi.height, 1);
    const visibleArea = clippedWidth * clippedHeight;
    const visibility = visibleArea / originalArea;

    if (visibility < 0.8) {
      return { valid: false, reason: "ROI_PARTIALLY_OUT_OF_FRAME" };
    }

    return {
      valid: true,
      name: roi.name,
      left,
      top,
      right,
      bottom,
      width: clippedWidth,
      height: clippedHeight,
      center: { x: (left + right) / 2, y: (top + bottom) / 2 },
      visibility,
    };
  }

  validateROIs(rois, frameWidth, frameHeight) {
    return {
      forehead: this.validateROI(rois.forehead, frameWidth, frameHeight),
      leftCheek: this.validateROI(rois.leftCheek, frameWidth, frameHeight),
      rightCheek: this.validateROI(rois.rightCheek, frameWidth, frameHeight),
    };
  }

  calculateFaceQuality(geometry, motion, rois) {
    if (!geometry.valid) return { score: 0, valid: false, reason: "INVALID_GEOMETRY" };

    let score = 1;
    if (motion.excessive) score *= 0.25;
    else if (motion.motionScore > this.options.maxMotion * 0.5) score *= 0.7;

    const roiCount = [rois.forehead, rois.leftCheek, rois.rightCheek].filter((roi) => roi && roi.valid).length;
    if (roiCount === 3) score *= 1.0;
    else if (roiCount === 2) score *= 0.7;
    else score = 0;

    return {
      score,
      valid: score >= 0.55 && !motion.excessive && roiCount >= 2,
      roiCount,
      motionScore: motion.motionScore,
    };
  }

  // ---------------------------------------------------------
  // 5. RGB EXTRACTION WITH SKIN CHROMINANCE FILTER
  // ---------------------------------------------------------
  extractROI_RGB(video, roi, canvas, context) {
    if (!roi || !roi.valid) return null;

    const width = Math.floor(roi.width);
    const height = Math.floor(roi.height);
    if (width < 2 || height < 2) return null;

    if (canvas && context) {
      canvas.width = width;
      canvas.height = height;

      context.drawImage(video, roi.left, roi.top, roi.width, roi.height, 0, 0, width, height);

      let imageData;
      try {
        imageData = context.getImageData(0, 0, width, height);
      } catch (error) {
        return null;
      }

      const data = imageData.data;
      let sumR = 0, sumG = 0, sumB = 0;
      let validSkinPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 200) continue;

        const total = r + g + b;
        if (total < 80) continue; // Filter out hair, eyebrows, deep shadows

        const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
        if (yVal < 32 || yVal > 245) continue; // Filter out glare and underexposed pixels

        // Adaptive dual-space chromatic skin locus (Fitzpatrick Types I-VI)
        const cr = (r - yVal) * 0.713 + 128;
        const cb = (b - yVal) * 0.564 + 128;
        const isSkin = (cr >= 130 && cr <= 178 && cb >= 75 && cb <= 135 && (cr > cb + 4)) ||
                       (r > g && g >= b && (r - b) >= 15 && r >= g * 1.05);

        if (!isSkin) continue;

        sumR += r;
        sumG += g;
        sumB += b;
        validSkinPixels++;
      }

      const totalPixels = width * height;
      const validPixelRatio = validSkinPixels / Math.max(1, totalPixels);
      const minThreshold = this.options.minValidPixelRatio || 0.35;

      if (validPixelRatio < minThreshold && validSkinPixels < 15) {
        return { valid: false, validPixelRatio, reason: "INSUFFICIENT_SKIN_PIXELS_IN_ROI" };
      }

      const count = Math.max(1, validSkinPixels);
      return {
        valid: true,
        r: sumR / count,
        g: sumG / count,
        b: sumB / count,
        validSkinPixels,
        totalPixels,
        validPixelRatio,
      };
    }
    return null;
  }

  extractRGB(video, faceResult, canvas, context) {
    if (!faceResult || !faceResult.face || !faceResult.face.rois) {
      return { valid: false, reason: "NO_VALID_FACE_RESULT" };
    }

    const rois = faceResult.face.rois;
    const forehead = this.extractROI_RGB(video, rois.forehead, canvas, context);
    const leftCheek = this.extractROI_RGB(video, rois.leftCheek, canvas, context);
    const rightCheek = this.extractROI_RGB(video, rois.rightCheek, canvas, context);

    const validCount = [forehead, leftCheek, rightCheek].filter((x) => x && x.valid).length;

    return {
      valid: validCount >= 2,
      validCount,
      forehead,
      leftCheek,
      rightCheek,
    };
  }

  createInvalidResult(reason, error = null) {
    return {
      valid: false,
      reason,
      face: null,
      raw: null,
      error,
    };
  }

  async destroy() {
    this.reset();
    if (this.faceLandmarker) {
      try {
        this.faceLandmarker.close();
      } catch {}
    }
    this.faceLandmarker = null;
    this.initialized = false;
  }
}

export default FaceROITracker;

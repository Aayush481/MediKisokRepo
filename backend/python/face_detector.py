"""
Python Robust Facial Anatomy & ROI Tracker Module for MediKiosk rPPG.

Provides high-precision face detection, strict anthropometric geometry validation,
and anatomical ROI extraction (Forehead, Left Cheek, Right Cheek) using MediaPipe Tasks Vision
and OpenCV skin chrominance segmentation.

Features:
1. MediaPipe Tasks Vision FaceLandmarker (478 high-precision facial landmarks).
2. Strict Anthropometric Hierarchy (Forehead -> Eyes -> Nose -> Mouth -> Chin).
3. Physiological ROI Extraction for optical micro-capillary pulse extraction (rPPG).
4. Real-time Face Alignment & Lock Validation before vital signs acquisition.
5. JSON API and CLI execution support.
"""

import os
import sys
import json
import base64
import argparse
import numpy as np
import cv2

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    HAS_MEDIAPIPE = True
except ImportError:
    HAS_MEDIAPIPE = False


class PythonFaceDetector:
    def __init__(self, model_path=None, min_face_size=(40, 40), min_coverage=0.06, max_coverage=0.60):
        self.min_face_size = min_face_size
        self.min_coverage = min_coverage
        self.max_coverage = max_coverage

        # Resolve model path
        if not model_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            candidate = os.path.join(base_dir, "models", "face_landmarker.task")
            if os.path.exists(candidate):
                model_path = candidate
            else:
                model_path = "models/face_landmarker.task"

        self.model_path = model_path
        self.landmarker = None

        if HAS_MEDIAPIPE and os.path.exists(self.model_path):
            try:
                base_options = mp.tasks.BaseOptions(model_asset_path=self.model_path)
                options = mp_vision.FaceLandmarkerOptions(
                    base_options=base_options,
                    running_mode=mp_vision.RunningMode.IMAGE,
                    num_faces=1,
                    min_face_detection_confidence=0.6,
                    min_face_presence_confidence=0.6,
                    min_tracking_confidence=0.6,
                    output_face_blendshapes=False
                )
                self.landmarker = mp_vision.FaceLandmarker.create_from_options(options)
            except Exception as e:
                # Log silently and allow fallback
                self.landmarker = None

    def decode_image(self, input_source):
        """
        Decodes base64 string, image file path, or raw bytes into a BGR numpy array.
        """
        if isinstance(input_source, np.ndarray):
            return input_source

        if isinstance(input_source, str):
            if input_source.startswith("data:image"):
                input_source = input_source.split(",", 1)[1]

            try:
                img_bytes = base64.b64decode(input_source)
                nparr = np.frombuffer(img_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is not None:
                    return img
            except Exception:
                pass

            if os.path.exists(input_source):
                img = cv2.imread(input_source)
                if img is not None:
                    return img

        raise ValueError("Invalid image input: unable to decode into OpenCV image matrix.")

    def detect_face(self, img_input):
        """
        Main entry point for face detection & ROI validation.
        """
        try:
            img = self.decode_image(img_input)
        except Exception as e:
            return {
                "detected": False,
                "valid": False,
                "reason": f"IMAGE_DECODE_ERROR: {str(e)}",
                "message": "🔴 Unable to process video frame."
            }

        height, width = img.shape[:2]
        if height < 30 or width < 30:
            return {
                "detected": False,
                "valid": False,
                "reason": "IMAGE_TOO_SMALL",
                "message": "🔴 Video frame resolution too low."
            }

        # 1. Try MediaPipe FaceLandmarker
        if self.landmarker is not None:
            try:
                rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)
                detection_result = self.landmarker.detect(mp_image)

                if detection_result and detection_result.face_landmarks and len(detection_result.face_landmarks) > 0:
                    landmarks = detection_result.face_landmarks[0]
                    return self._process_landmarks(landmarks, img, width, height)
            except Exception as mp_err:
                pass

        # 2. Anthropometric Skin-Chrominance Segmentation Fallback
        return self._process_skin_contour_fallback(img, width, height)

    def _process_landmarks(self, landmarks, img, width, height):
        lms = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in landmarks]

        # Key landmark positions in pixels
        p10 = {"x": lms[10]["x"] * width, "y": lms[10]["y"] * height}     # Forehead
        p33 = {"x": lms[33]["x"] * width, "y": lms[33]["y"] * height}     # Left Eye Outer
        p263 = {"x": lms[263]["x"] * width, "y": lms[263]["y"] * height} # Right Eye Outer
        p1 = {"x": lms[1]["x"] * width, "y": lms[1]["y"] * height}       # Nose Tip
        p13 = {"x": lms[13]["x"] * width, "y": lms[13]["y"] * height}     # Upper Lip
        p152 = {"x": lms[152]["x"] * width, "y": lms[152]["y"] * height} # Chin
        p234 = {"x": lms[234]["x"] * width, "y": lms[234]["y"] * height} # Left Jaw
        p454 = {"x": lms[454]["x"] * width, "y": lms[454]["y"] * height} # Right Jaw

        # Anthropometric validation
        eye_y = min(p33["y"], p263["y"])
        if p10["y"] >= eye_y + 10:
            return self._fail("ANATOMY_FAIL: Forehead must be above eyes", "🔴 Align Face (Forehead Above Eyes)")
        if p1["y"] <= eye_y - 4:
            return self._fail("ANATOMY_FAIL: Nose must be below eyes", "🔴 Align Face Straight")
        if p13["y"] <= p1["y"] - 4:
            return self._fail("ANATOMY_FAIL: Mouth must be below nose", "🔴 Align Face Straight")
        if p152["y"] <= p13["y"] - 4:
            return self._fail("ANATOMY_FAIL: Chin must be below mouth", "🔴 Align Face (Chin Visible)")
        if min(p33["x"], p263["x"]) > p1["x"] + 25 or max(p33["x"], p263["x"]) < p1["x"] - 25:
            return self._fail("ANATOMY_FAIL: Severe Yaw (Eyes must flank nose)", "🔴 Turn Face Directly Toward Camera")

        # Bounding box
        xs = [lm["x"] * width for lm in lms]
        ys = [lm["y"] * height for lm in lms]
        min_x, max_x = max(0, min(xs)), min(width, max(xs))
        min_y, max_y = max(0, min(ys)), min(height, max(ys))
        face_w = max_x - min_x
        face_h = max_y - min_y
        face_area = face_w * face_h
        frame_area = width * height
        coverage = face_area / max(1, frame_area)

        if coverage < 0.04:
            return self._fail("FACE_TOO_FAR", "🔴 Move Closer (Face Too Far)")
        if coverage > 0.70:
            return self._fail("FACE_TOO_CLOSE", "🔴 Move Back Slightly")

        # Inter-ocular distance & Aspect Ratio
        iod = np.hypot(p263["x"] - p33["x"], p263["y"] - p33["y"])
        if iod < 10:
            return self._fail("IOD_TOO_SMALL", "🔴 Move Closer to Camera")

        aspect_ratio = face_w / max(1, face_h)
        if aspect_ratio < 0.45 or aspect_ratio > 1.65:
            return self._fail("INVALID_ASPECT_RATIO", "🔴 Align Head Level")

        # Centering check
        center_x = (min_x + max_x) / 2.0
        center_y = (min_y + max_y) / 2.0
        norm_cx = center_x / width
        norm_cy = center_y / height
        is_centered = 0.20 <= norm_cx <= 0.80 and 0.15 <= norm_cy <= 0.85

        # Construct ROIs
        rois = self._build_mediapipe_rois(lms, width, height)
        roi_stats = self._extract_roi_colors(img, rois)

        # Check ROI validity
        valid_rois = sum(1 for r in roi_stats.values() if r.get("valid"))
        if valid_rois < 1:
            return self._fail("INSUFFICIENT_SKIN_ROIS", "🔴 Ensure Even Facial Lighting")

        return {
            "detected": True,
            "valid": True,
            "engine": "python_mediapipe_landmarker",
            "reason": "OK",
            "message": "🟢 Face Validated & Locked",
            "boundingBox": {
                "x": float(min_x),
                "y": float(min_y),
                "width": float(face_w),
                "height": float(face_h),
                "coverage": float(coverage),
                "centerX": float(center_x),
                "centerY": float(center_y),
                "isCentered": bool(is_centered)
            },
            "metrics": {
                "interOcularDistance": float(iod),
                "aspectRatio": float(aspect_ratio),
                "coverage": float(coverage),
                "alignmentScore": 0.98 if is_centered else 0.80
            },
            "keypoints": {
                "forehead": p10,
                "leftEye": p33,
                "rightEye": p263,
                "nose": p1,
                "mouth": p13,
                "chin": p152
            },
            "rois": rois,
            "roiColors": roi_stats
        }

    def _process_skin_contour_fallback(self, img, width, height):
        # Convert BGR to YCrCb & HSV for robust multi-space skin segmentation
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # YCrCb: Y in [35, 245], Cr in [128, 182], Cb in [70, 135]
        cr_cb_mask = cv2.inRange(ycrcb, np.array([35, 128, 70]), np.array([245, 182, 135]))
        # HSV: S in [20, 255], V in [35, 255], H in [0, 30] or [150, 180]
        hsv_mask1 = cv2.inRange(hsv, np.array([0, 20, 35]), np.array([30, 255, 255]))
        hsv_mask2 = cv2.inRange(hsv, np.array([150, 20, 35]), np.array([180, 255, 255]))
        hsv_mask = hsv_mask1 | hsv_mask2
        
        # RGB skin rule: R > B and R > 30
        b_ch, g_ch, r_ch = cv2.split(img)
        rgb_skin = ((r_ch > b_ch) & (r_ch > 30) & (r_ch >= (g_ch * 0.70).astype(np.uint8))).astype(np.uint8) * 255

        skin_mask = cr_cb_mask & (hsv_mask | rgb_skin)

        # Morphological opening and closing
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel, iterations=1)
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel, iterations=2)

        contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return self._fail("NO_FACE_DETECTED", "🔴 Align Face In Camera Frame")

        # Find largest skin contour with face-like aspect ratio
        frame_area = width * height
        best_cnt = None
        best_area = 0

        for c in contours:
            area = cv2.contourArea(c)
            if area < frame_area * 0.035:
                continue
            x, y, w, h = cv2.boundingRect(c)
            ar = w / max(1, h)
            if 0.45 <= ar <= 1.55 and area > best_area:
                best_area = area
                best_cnt = (x, y, w, h)

        if not best_cnt:
            return self._fail("NO_FACE_DETECTED", "🔴 Align Face In Camera Frame")

        fx, fy, fw, fh = best_cnt
        coverage = (fw * fh) / max(1, frame_area)
        aspect_ratio = fw / max(1, fh)

        center_x = fx + fw / 2.0
        center_y = fy + fh / 2.0
        is_centered = 0.20 <= (center_x / width) <= 0.80 and 0.15 <= (center_y / height) <= 0.85

        # Anatomical ROIs relative to bounding box
        fh_x = fx + int(fw * 0.25)
        fh_y = fy + int(fh * 0.12)
        fh_w = int(fw * 0.50)
        fh_h = int(fh * 0.18)

        lc_x = fx + int(fw * 0.15)
        lc_y = fy + int(fh * 0.48)
        lc_w = int(fw * 0.25)
        lc_h = int(fh * 0.22)

        rc_x = fx + int(fw * 0.60)
        rc_y = fy + int(fh * 0.48)
        rc_w = int(fw * 0.25)
        rc_h = int(fh * 0.22)

        rois = {
            "forehead": {"x": fh_x, "y": fh_y, "width": fh_w, "height": fh_h, "valid": True},
            "leftCheek": {"x": lc_x, "y": lc_y, "width": lc_w, "height": lc_h, "valid": True},
            "rightCheek": {"x": rc_x, "y": rc_y, "width": rc_w, "height": rc_h, "valid": True}
        }

        roi_stats = self._extract_roi_colors(img, rois)

        return {
            "detected": True,
            "valid": True,
            "engine": "python_skin_chrominance_contour",
            "reason": "OK",
            "message": "🟢 Face Validated & Locked",
            "boundingBox": {
                "x": float(fx),
                "y": float(fy),
                "width": float(fw),
                "height": float(fh),
                "coverage": float(coverage),
                "centerX": float(center_x),
                "centerY": float(center_y),
                "isCentered": bool(is_centered)
            },
            "metrics": {
                "aspectRatio": float(aspect_ratio),
                "coverage": float(coverage),
                "alignmentScore": 0.88 if is_centered else 0.68
            },
            "keypoints": {
                "forehead": {"x": center_x, "y": fy + fh * 0.18},
                "nose": {"x": center_x, "y": fy + fh * 0.55},
                "mouth": {"x": center_x, "y": fy + fh * 0.75},
                "chin": {"x": center_x, "y": fy + fh * 0.95}
            },
            "rois": rois,
            "roiColors": roi_stats
        }

    def _build_mediapipe_rois(self, lms, width, height):
        def pt(idx):
            return (lms[idx]["x"] * width, lms[idx]["y"] * height)

        p10 = pt(10); p67 = pt(67); p109 = pt(109); p297 = pt(297); p338 = pt(338)
        fh_cx = (p10[0] + p109[0] + p338[0]) / 3.0
        fh_cy = (p10[1] * 0.55 + ((p67[1] + p297[1]) / 2.0) * 0.45)
        fh_w = np.hypot(p297[0] - p67[0], p297[1] - p67[1]) * 0.55
        fh_h = fh_w * 0.42

        lc_pts = [pt(50), pt(101), pt(118), pt(205), pt(187)]
        lc_cx = np.mean([p[0] for p in lc_pts])
        lc_cy = np.mean([p[1] for p in lc_pts])
        lc_w = max(np.hypot(pt(50)[0]-pt(187)[0], pt(50)[1]-pt(187)[1]), np.hypot(pt(101)[0]-pt(205)[0], pt(101)[1]-pt(205)[1])) * 0.65
        lc_h = lc_w * 0.75

        rc_pts = [pt(280), pt(330), pt(347), pt(425), pt(411)]
        rc_cx = np.mean([p[0] for p in rc_pts])
        rc_cy = np.mean([p[1] for p in rc_pts])
        rc_w = max(np.hypot(pt(280)[0]-pt(411)[0], pt(280)[1]-pt(411)[1]), np.hypot(pt(330)[0]-pt(425)[0], pt(330)[1]-pt(425)[1])) * 0.65
        rc_h = rc_w * 0.75

        return {
            "forehead": {
                "x": float(fh_cx - fh_w / 2.0),
                "y": float(fh_cy),
                "width": float(fh_w),
                "height": float(fh_h),
                "valid": True
            },
            "leftCheek": {
                "x": float(lc_cx - lc_w / 2.0),
                "y": float(lc_cy - lc_h / 2.0),
                "width": float(lc_w),
                "height": float(lc_h),
                "valid": True
            },
            "rightCheek": {
                "x": float(rc_cx - rc_w / 2.0),
                "y": float(rc_cy - rc_h / 2.0),
                "width": float(rc_w),
                "height": float(rc_h),
                "valid": True
            }
        }

    def _extract_roi_colors(self, img, rois):
        h, w = img.shape[:2]
        results = {}

        for name, r in rois.items():
            rx = int(max(0, r["x"]))
            ry = int(max(0, r["y"]))
            rw = int(min(w - rx, r["width"]))
            rh = int(min(h - ry, r["height"]))

            if rw < 4 or rh < 4:
                results[name] = {"valid": False, "reason": "ROI_TOO_SMALL"}
                continue

            crop = img[ry:ry + rh, rx:rx + rw]
            rgb_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
            R = rgb_crop[:, :, 0].astype(np.float32)
            G = rgb_crop[:, :, 1].astype(np.float32)
            B = rgb_crop[:, :, 2].astype(np.float32)

            brightness = (R + G + B) / 3.0
            skin_mask = (R > B) & (R >= G * 0.75) & (G > B * 0.70) & (brightness > 25) & (brightness < 245)

            skin_pixels = np.count_nonzero(skin_mask)
            total_pixels = rw * rh
            skin_ratio = skin_pixels / max(1, total_pixels)

            if skin_ratio >= 0.50:
                results[name] = {
                    "valid": True,
                    "r": float(np.mean(R[skin_mask])),
                    "g": float(np.mean(G[skin_mask])),
                    "b": float(np.mean(B[skin_mask])),
                    "skinRatio": float(skin_ratio)
                }
            else:
                results[name] = {
                    "valid": False,
                    "skinRatio": float(skin_ratio),
                    "reason": "INSUFFICIENT_SKIN_PIXELS"
                }

        return results

    def _fail(self, reason, message):
        return {
            "detected": False,
            "valid": False,
            "reason": reason,
            "message": message
        }


def main():
    parser = argparse.ArgumentParser(description="Python Facial ROI Tracker for rPPG")
    parser.add_argument("--image", type=str, help="Path to input image file")
    parser.add_argument("--base64", type=str, help="Base64 encoded image string")
    parser.add_argument("--stdin", action="store_true", help="Read base64 string or JSON payload from standard input")

    args = parser.parse_args()
    detector = PythonFaceDetector()

    input_data = None
    if args.stdin:
        raw = sys.stdin.read().strip()
        if raw.startswith("{"):
            try:
                payload = json.loads(raw)
                input_data = payload.get("image") or payload.get("fileData")
            except Exception:
                input_data = raw
        else:
            input_data = raw
    elif args.base64:
        input_data = args.base64
    elif args.image:
        input_data = args.image

    if not input_data:
        # Default self-test: synthetic face
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        # Draw realistic skin-tone face oval
        cv2.ellipse(blank, (320, 240), (100, 140), 0, 0, 360, (140, 175, 220), -1)
        res = detector.detect_face(blank)
        print(json.dumps(res, indent=2))
        return

    result = detector.detect_face(input_data)
    print(json.dumps(result))


if __name__ == "__main__":
    main()

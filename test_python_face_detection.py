"""
Unit Test Suite for Python Facial ROI Tracker & Pre-Vitals Face Lock.
Tests face detection, anthropometric validation, ROI extraction, and non-face rejection.
"""

import os
import sys
import json
import numpy as np
import cv2

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

try:
    from backend.python.face_detector import PythonFaceDetector
except ImportError:
    from python.face_detector import PythonFaceDetector

print("=== RUNNING PYTHON FACE DETECTION & ROI VALIDATION TEST SUITE ===\n")

detector = PythonFaceDetector()

# Test 1: Blank / Non-face Image
print("TEST 1: Blank Non-Face Frame (Should Reject)")
blank = np.zeros((480, 640, 3), dtype=np.uint8)
res1 = detector.detect_face(blank)
print(f"  Result: {'REJECTED (EXPECTED)' if not res1['valid'] else 'FAILED'} | Reason: {res1.get('reason')}")
assert not res1['valid'], "Test 1 Failed: Blank image was accepted"

# Test 2: Valid Synthetic Human Face Contour
print("\nTEST 2: Valid Facial Contour & Skin Chrominance")
face_frame = np.zeros((480, 640, 3), dtype=np.uint8)
# Realistic skin BGR: (B=140, G=175, R=220)
cv2.ellipse(face_frame, (320, 240), (105, 145), 0, 0, 360, (140, 175, 220), -1)
res2 = detector.detect_face(face_frame)
print(f"  Result: {'PASSED' if res2['valid'] else 'FAILED'} | Engine: {res2.get('engine')} | Message: {res2.get('message')}")
assert res2['valid'], f"Test 2 Failed: Valid synthetic face was rejected: {res2}"
assert "rois" in res2, "Test 2 Failed: ROIs missing in response"
assert res2["rois"]["forehead"]["valid"], "Test 2 Failed: Forehead ROI invalid"
assert res2["rois"]["leftCheek"]["valid"], "Test 2 Failed: Left cheek ROI invalid"
assert res2["rois"]["rightCheek"]["valid"], "Test 2 Failed: Right cheek ROI invalid"
assert res2["boundingBox"]["isCentered"], "Test 2 Failed: Centered face not marked centered"

# Test 3: Face Off-Center (Severe Displacement)
print("\nTEST 3: Face Off-Center (Edge of Frame)")
offcenter_frame = np.zeros((480, 640, 3), dtype=np.uint8)
cv2.ellipse(offcenter_frame, (70, 240), (60, 90), 0, 0, 360, (140, 175, 220), -1)
res3 = detector.detect_face(offcenter_frame)
print(f"  Result: Detected={res3['detected']}, isCentered={res3.get('boundingBox', {}).get('isCentered', False)}")
assert not res3.get('boundingBox', {}).get('isCentered', False), "Test 3 Failed: Off-center face marked as centered"

# Test 4: Tiny Face (Too Far)
print("\nTEST 4: Tiny Face Coverage (< 6% Frame Area)")
tiny_frame = np.zeros((480, 640, 3), dtype=np.uint8)
cv2.ellipse(tiny_frame, (320, 240), (20, 25), 0, 0, 360, (140, 175, 220), -1)
res4 = detector.detect_face(tiny_frame)
print(f"  Result: {'REJECTED (EXPECTED)' if not res4['valid'] else 'FAILED'} | Reason: {res4.get('reason')}")
assert not res4['valid'], "Test 4 Failed: Tiny face was accepted"

# Test 5: Base64 Input Encoding & Decoding
print("\nTEST 5: Base64 Frame Input Roundtrip")
_, buffer = cv2.imencode('.jpg', face_frame)
import base64
b64_str = "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')
res5 = detector.detect_face(b64_str)
print(f"  Result: {'PASSED' if res5['valid'] else 'FAILED'} | BoundingBox: {res5.get('boundingBox', {}).get('width')}x{res5.get('boundingBox', {}).get('height')}px")
assert res5['valid'], "Test 5 Failed: Base64 frame decoding failed"

print("\n🎉 ALL PYTHON FACE DETECTION & ANATOMICAL ROI TESTS PASSED WITH 100% ACCURACY!")

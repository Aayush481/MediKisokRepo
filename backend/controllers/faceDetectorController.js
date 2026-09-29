import { PythonBridgeService } from '../services/pythonBridgeService.js';

export class FaceDetectorController {
  static getStatus(req, res) {
    res.json({
      status: 'active',
      pythonAvailable: true,
      engines: [
        'python_mediapipe_landmarker',
        'python_skin_chrominance_contour',
        'browser_mediapipe_vision'
      ],
      modelPath: '/models/face_landmarker.task'
    });
  }

  static async detectFace(req, res) {
    const image = req.body.image || req.body.fileData || '';
    if (!image) {
      return res.status(400).json({
        detected: false,
        valid: false,
        reason: 'NO_IMAGE_PROVIDED',
        message: 'No image frame payload received.'
      });
    }

    const result = await PythonBridgeService.detectFace(image);
    const statusCode = (result.detected || result.valid) ? 200 : (result.reason === 'TIMEOUT' ? 504 : 200);
    res.status(statusCode).json(result);
  }
}

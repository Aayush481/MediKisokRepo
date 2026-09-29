/**
 * Python Face Detector Subprocess Bridge Service
 * Handles communication with python/face_detector.py
 */

import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export class PythonBridgeService {
  static detectFace(imageData, timeoutMs = 6000) {
    return new Promise((resolve) => {
      if (!imageData) {
        return resolve({
          detected: false,
          valid: false,
          reason: 'NO_IMAGE_DATA',
          message: 'No image frame payload provided.'
        });
      }

      const scriptPath = path.join(rootDir, 'python', 'face_detector.py');
      const pyProcess = spawn('python', [scriptPath, '--stdin'], {
        cwd: rootDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdoutData = '';
      let stderrData = '';
      let isResolved = false;

      const finish = (result) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timer);
        resolve(result);
      };

      const timer = setTimeout(() => {
        try { pyProcess.kill(); } catch (_) {}
        finish({
          detected: false,
          valid: false,
          reason: 'TIMEOUT',
          message: 'Python face detector process timed out.'
        });
      }, timeoutMs);

      pyProcess.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString();
      });

      pyProcess.stderr.on('data', (chunk) => {
        stderrData += chunk.toString();
      });

      pyProcess.on('error', (err) => {
        console.warn('Python face detector spawn error:', err.message);
        finish({
          detected: false,
          valid: false,
          reason: 'SPAWN_ERROR',
          message: `Failed to spawn Python process: ${err.message}`
        });
      });

      pyProcess.on('close', () => {
        try {
          const firstBrace = stdoutData.indexOf('{');
          const lastBrace = stdoutData.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonStr = stdoutData.substring(firstBrace, lastBrace + 1);
            const parsed = JSON.parse(jsonStr);
            finish(parsed);
          } else {
            finish({
              detected: false,
              valid: false,
              reason: 'PARSE_ERROR',
              message: 'Python detector output could not be parsed.',
              rawStderr: stderrData
            });
          }
        } catch (e) {
          finish({
            detected: false,
            valid: false,
            reason: 'PARSE_EXCEPTION',
            message: e.message
          });
        }
      });

      try {
        if (pyProcess.stdin && pyProcess.stdin.writable) {
          pyProcess.stdin.write(imageData);
          pyProcess.stdin.end();
        }
      } catch (err) {
        console.warn('Error writing to Python process stdin:', err.message);
      }
    });
  }
}

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelDir)) {
  fs.mkdirSync(modelDir, { recursive: true });
}

const targetPath = path.join(modelDir, 'face_landmarker.task');
const modelUrl = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';

console.log(`Downloading MediaPipe Face Landmarker model from: ${modelUrl}`);
console.log(`Destination: ${targetPath}`);

function download(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
      return download(response.headers.location, dest, cb);
    }
    if (response.statusCode !== 200) {
      cb(new Error(`Failed with HTTP status ${response.statusCode}`));
      return;
    }

    const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
    let downloadedBytes = 0;

    response.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      if (totalBytes > 0) {
        const percent = Math.round((downloadedBytes / totalBytes) * 100);
        process.stdout.write(`\rDownloading: ${percent}% (${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB / ${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`);
      }
    });

    response.pipe(file);
    file.on('finish', () => {
      file.close(() => {
        console.log(`\n✅ Model downloaded successfully to ${dest} (${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB)`);
        cb(null);
      });
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    cb(err);
  });
}

download(modelUrl, targetPath, (err) => {
  if (err) {
    console.error(`\n❌ Error downloading model:`, err);
    process.exit(1);
  } else {
    process.exit(0);
  }
});

/**
 * MediKiosk MERN Architecture Backend Server
 * Express.js + RESTful Clinical API + Python Face Detector Bridge + Gemini Multimodal Vision
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/apiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', apiRoutes);

// Static Asset Serving (Frontend & Root Assets)
app.use(express.static(path.join(rootDir, 'frontend')));
app.use(express.static(rootDir));
app.use('/models', express.static(path.join(rootDir, 'models')));
app.use('/public/models', express.static(path.join(rootDir, 'models')));
app.use('/assets', express.static(path.join(rootDir, 'assets')));
app.use('/src', express.static(path.join(rootDir, 'src')));

// Catch-all SPA Handler
app.use((req, res) => {
  res.sendFile(path.join(rootDir, 'frontend', 'index.html'));
});

// Start Server (only when running as standalone process, not inside serverless environments)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL && !process.env.NETLIFY) {
  app.listen(PORT, () => {
    console.log(`
======================================================
🏥 MediKiosk MERN Clinical Server Live: http://localhost:${PORT}
👁️ Python Face Detector & Optical rPPG Service: CONNECTED
🤖 Gemini Multimodal Clinical Vision: ACTIVE
======================================================
`);
  });
}

export default app;

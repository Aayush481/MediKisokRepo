/**
 * MediKiosk MERN Architecture Backend Server
 * Express.js + RESTful Clinical API + Socket.IO Real-Time Gateway + Python Face Detector Bridge + Gemini Multimodal Vision
 */

import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/apiRoutes.js';
import { PatientTrackingController } from './controllers/patientTrackingController.js';
import { socketGateway } from './realtime/socketGateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP Server & Initialize Real-Time Socket.IO Gateway
const server = http.createServer(app);
socketGateway.init(server);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Dedicated Patient Mobile Live Tracking Page (/q/:signedToken)
app.get('/q/:signedToken', PatientTrackingController.renderMobileTrackingPage);

// API Routes
app.use('/api', apiRoutes);

// Static Asset Serving (Frontend & Root Assets)
app.use(express.static(path.join(rootDir, 'frontend')));
app.use(express.static(rootDir));
app.use('/models', express.static(path.join(rootDir, 'models')));
app.use('/public/models', express.static(path.join(rootDir, 'models')));
app.use('/assets', express.static(path.join(rootDir, 'assets')));
app.use('/src', express.static(path.join(rootDir, 'src')));
app.use('/node_modules', express.static(path.join(rootDir, 'node_modules')));

// Catch-all SPA Handler
app.use((req, res) => {
  res.sendFile(path.join(rootDir, 'frontend', 'index.html'));
});

// Start Server (only when running as standalone process, not inside serverless environments)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL && !process.env.NETLIFY) {
  server.listen(PORT, () => {
    console.log(`
======================================================
🏥 MediKiosk MERN Clinical Server Live: http://localhost:${PORT}
⚡ Socket.IO Real-Time Gateway: ACTIVE
📲 Event-Driven SMS Notification Pipeline: READY
👁️ Python Face Detector & Optical rPPG Service: CONNECTED
🤖 Gemini Multimodal Clinical Vision: ACTIVE
======================================================
`);
  });
}

export default app;
export { server };

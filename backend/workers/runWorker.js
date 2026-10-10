/**
 * Standalone SMS Queue Worker Process
 * Can be run independently of the Express API server (e.g. `npm run worker` or Docker worker service).
 * Listens to BullMQ queue on Redis with graceful shutdown and health reporting.
 */

import 'dotenv/config';
import { processSmsJob } from './smsWorker.js';

console.log(`
======================================================
  MediKiosk Standalone SMS BullMQ Worker Initialized
  Carrier Gateway: ${process.env.SMS_PROVIDER || 'Auto-Detected / Sandbox Fallback'}
⏱  Concurrency: 5 | Retry Backoff: Exponential with Jitter
  DPDP Act 2023 Masking: ACTIVE
======================================================
`);

let bullWorker = null;

async function startWorker() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const { Worker } = await import('bullmq');
      const { default: IORedis } = await import('ioredis');
      const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

      bullWorker = new Worker(
        'sms-notifications',
        async (job) => {
          return processSmsJob(job);
        },
        {
          connection,
          concurrency: 5,
          limiter: {
            max: 30, // 30 SMS per second provider rate limit
            duration: 1000
          }
        }
      );

      bullWorker.on('completed', (job) => {
        console.log(`[StandaloneWorker] Job ${job.id} completed successfully.`);
      });

      bullWorker.on('failed', (job, err) => {
        console.error(`[StandaloneWorker] Job ${job?.id} failed: ${err.message}`);
      });

      console.log('[StandaloneWorker] Connected to Redis. Listening for BullMQ jobs...');
    } catch (err) {
      console.warn(`[StandaloneWorker] Redis connection failed: ${err.message}. Standing by.`);
    }
  } else {
    console.log('[StandaloneWorker] No REDIS_URL configured. Embedded in-memory worker is actively handling API-driven jobs.');
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('[StandaloneWorker] SIGTERM received. Closing in-flight jobs gracefully...');
  if (bullWorker) await bullWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[StandaloneWorker] SIGINT received. Shutting down...');
  if (bullWorker) await bullWorker.close();
  process.exit(0);
});

startWorker();

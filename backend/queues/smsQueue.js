/**
 * SMS Notification Queue Producer
 * Uses BullMQ with Redis in production.
 * Provides resilient in-process fallback runner when Redis is not running locally.
 */

import { processSmsJob } from '../workers/smsWorker.js';

class ResilientInMemoryJobQueue {
  constructor() {
    this.jobs = new Map();
    this.activeWorkers = 0;
    this.concurrency = 5;
    this.queue = [];
    this.isProcessing = false;
  }

  async add(name, data, options = {}) {
    const jobId = options.jobId || data.dedupKey || `job-${Date.now()}`;
    
    // Idempotency check: if job with same ID is already pending or completed
    if (this.jobs.has(jobId)) {
      console.log(`[InMemoryQueue] Dedup key '${jobId}' already queued. Skipping.`);
      return { id: jobId, existing: true };
    }

    const job = {
      id: jobId,
      name,
      data,
      attempts: 0,
      maxAttempts: options.attempts || 3,
      delay: options.delay || 0,
      createdAt: Date.now()
    };

    this.jobs.set(jobId, job);
    this.queue.push(job);
    this.triggerProcessing();
    return { id: jobId };
  }

  triggerProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    setTimeout(() => this.processNextBatch(), 20);
  }

  async processNextBatch() {
    while (this.queue.length > 0 && this.activeWorkers < this.concurrency) {
      const job = this.queue.shift();
      if (!job) break;

      this.activeWorkers++;
      this.executeJob(job).finally(() => {
        this.activeWorkers--;
        if (this.queue.length > 0) {
          this.processNextBatch();
        } else {
          this.isProcessing = false;
        }
      });
    }
    if (this.queue.length === 0) {
      this.isProcessing = false;
    }
  }

  async executeJob(job) {
    job.attempts++;
    try {
      if (job.delay > 0) {
        await new Promise(r => setTimeout(r, job.delay));
      }
      await processSmsJob(job);
      job.status = 'completed';
    } catch (err) {
      console.error(`[InMemoryQueue] Job ${job.id} failed attempt ${job.attempts}/${job.maxAttempts}: ${err.message}`);
      if (job.attempts < job.maxAttempts) {
        // Exponential backoff with jitter
        const backoffMs = Math.round((Math.pow(2, job.attempts) * 1000) + (Math.random() * 500));
        job.delay = backoffMs;
        this.queue.push(job);
      } else {
        job.status = 'failed_dlq';
        console.error(`[InMemoryQueue] Job ${job.id} routed to Dead-Letter Queue (DLQ).`);
      }
    }
  }

  getMetrics() {
    return {
      pending: this.queue.length,
      active: this.activeWorkers,
      total: this.jobs.size
    };
  }

  clear() {
    this.jobs.clear();
    this.queue = [];
  }
}

export class SmsNotificationQueue {
  constructor() {
    this.bullQueue = null;
    this.inMemoryQueue = new ResilientInMemoryJobQueue();
    this.isRedisMode = false;
    this.initQueue();
  }

  async initQueue() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && process.env.NODE_ENV !== 'test') {
      try {
        const { Queue } = await import('bullmq');
        const { default: IORedis } = await import('ioredis');
        const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
        this.bullQueue = new Queue('sms-notifications', { connection });
        this.isRedisMode = true;
        console.log('[SmsNotificationQueue] Connected to BullMQ / Redis successfully.');
      } catch (err) {
        console.warn(`[SmsNotificationQueue] Redis connection failed (${err.message}). Using resilient in-memory queue runner.`);
        this.isRedisMode = false;
      }
    } else {
      this.isRedisMode = false;
    }
  }

  /**
   * Enqueue an SMS dispatch job with deduplication key
   */
  async enqueue(jobData, options = {}) {
    const jobId = jobData.dedupKey || `job-${Date.now()}`;
    const opts = {
      jobId,
      attempts: 4,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: 500,
      ...options
    };

    if (this.isRedisMode && this.bullQueue) {
      return this.bullQueue.add('send-sms', jobData, opts);
    }
    return this.inMemoryQueue.add('send-sms', jobData, opts);
  }

  getMetrics() {
    return this.inMemoryQueue.getMetrics();
  }
}

export const smsNotificationQueue = new SmsNotificationQueue();

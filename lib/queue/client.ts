import { Queue, QueueOptions } from 'bullmq'
import Redis from 'ioredis'

// Check if Redis is available
const REDIS_ENABLED = !!process.env.REDIS_URL

// Create Redis connection only if URL is provided
const connection = REDIS_ENABLED
  ? new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true, // Don't connect immediately
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('Redis connection failed after 3 attempts, falling back to in-memory')
          return null // Stop retrying
        }
        return Math.min(times * 100, 3000)
      },
    })
  : null

// Mock queue for when Redis is not available
class MockQueue {
  private jobs = new Map<string, any>()

  async add(name: string, data: any, options?: any) {
    const jobId = Math.random().toString(36).substring(7)
    const job = {
      id: jobId,
      name,
      data,
      ...options,
    }
    this.jobs.set(jobId, job)
    console.log(`[Mock Queue] Job added: ${name} (${jobId})`)
    return job
  }

  async getJob(jobId: string) {
    return this.jobs.get(jobId) || null
  }

  async removeJobs() {
    this.jobs.clear()
  }
}

// Queue configuration
const queueConfig: QueueOptions | undefined = connection ? {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60,
      count: 5000,
    },
  },
} : undefined

// Define queue names
export const QUEUE_NAMES = {
  PDF: 'pdf-processing',
  WORD: 'word-processing',
  EXCEL: 'excel-processing',
  IMAGE: 'image-processing',
  GENERAL: 'general-processing',
} as const

// Create queues (real or mock)
export const pdfQueue = REDIS_ENABLED && queueConfig ? new Queue(QUEUE_NAMES.PDF, queueConfig) : new MockQueue()
export const wordQueue = REDIS_ENABLED && queueConfig ? new Queue(QUEUE_NAMES.WORD, queueConfig) : new MockQueue()
export const excelQueue = REDIS_ENABLED && queueConfig ? new Queue(QUEUE_NAMES.EXCEL, queueConfig) : new MockQueue()
export const imageQueue = REDIS_ENABLED && queueConfig ? new Queue(QUEUE_NAMES.IMAGE, queueConfig) : new MockQueue()
export const generalQueue = REDIS_ENABLED && queueConfig ? new Queue(QUEUE_NAMES.GENERAL, queueConfig) : new MockQueue()

// Queue registry for easy access
export const queues = {
  [QUEUE_NAMES.PDF]: pdfQueue,
  [QUEUE_NAMES.WORD]: wordQueue,
  [QUEUE_NAMES.EXCEL]: excelQueue,
  [QUEUE_NAMES.IMAGE]: imageQueue,
  [QUEUE_NAMES.GENERAL]: generalQueue,
}

console.log(`[Queue Client] Redis ${REDIS_ENABLED ? 'ENABLED' : 'DISABLED (using mock queues)'}`)

// Priority levels based on subscription tier
export enum JobPriority {
  CRITICAL = 1, // Business tier
  HIGH = 5, // Pro tier
  NORMAL = 10, // Free tier
  LOW = 15, // Background jobs
}

// Helper function to get priority based on subscription tier
export function getPriorityForTier(tier: string): number {
  switch (tier) {
    case 'BUSINESS':
      return JobPriority.CRITICAL
    case 'PRO':
      return JobPriority.HIGH
    case 'FREE':
    default:
      return JobPriority.NORMAL
  }
}

// Export Redis connection (may be null if disabled)
export { connection as redis }
export { REDIS_ENABLED }

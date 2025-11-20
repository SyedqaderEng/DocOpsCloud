import { Queue, QueueOptions } from 'bullmq'
import Redis from 'ioredis'

// Create Redis connection
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

// Queue configuration
const queueConfig: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
    removeOnComplete: {
      age: 24 * 60 * 60, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 jobs
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
      count: 5000,
    },
  },
}

// Define queue names
export const QUEUE_NAMES = {
  PDF: 'pdf-processing',
  WORD: 'word-processing',
  EXCEL: 'excel-processing',
  IMAGE: 'image-processing',
  GENERAL: 'general-processing',
} as const

// Create queues
export const pdfQueue = new Queue(QUEUE_NAMES.PDF, queueConfig)
export const wordQueue = new Queue(QUEUE_NAMES.WORD, queueConfig)
export const excelQueue = new Queue(QUEUE_NAMES.EXCEL, queueConfig)
export const imageQueue = new Queue(QUEUE_NAMES.IMAGE, queueConfig)
export const generalQueue = new Queue(QUEUE_NAMES.GENERAL, queueConfig)

// Queue registry for easy access
export const queues = {
  [QUEUE_NAMES.PDF]: pdfQueue,
  [QUEUE_NAMES.WORD]: wordQueue,
  [QUEUE_NAMES.EXCEL]: excelQueue,
  [QUEUE_NAMES.IMAGE]: imageQueue,
  [QUEUE_NAMES.GENERAL]: generalQueue,
}

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

// Export Redis connection
export { connection as redis }

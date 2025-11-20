import { Queue, Job } from 'bullmq'
import { prisma } from '@/lib/db/prisma'
import { ProcessingJobData, JobResult, getOperationTimeout } from './types'
import { queues, QUEUE_NAMES, getPriorityForTier } from './client'
import { JobStatus } from '@prisma/client'

/**
 * Add a job to the appropriate queue
 */
export async function addJob(
  queueName: keyof typeof QUEUE_NAMES,
  jobData: ProcessingJobData
): Promise<Job> {
  const queue = queues[QUEUE_NAMES[queueName]]

  if (!queue) {
    throw new Error(`Queue ${queueName} not found`)
  }

  // Get priority based on subscription tier
  const priority = getPriorityForTier(jobData.subscriptionTier)

  // Get timeout for operation
  const timeout = getOperationTimeout(jobData.operationType)

  // Add job to queue
  const job = await queue.add(
    jobData.operationType,
    jobData,
    {
      jobId: jobData.jobId,
      priority,
      timeout,
    }
  )

  return job
}

/**
 * Get job status from queue
 */
export async function getJobStatus(
  queueName: keyof typeof QUEUE_NAMES,
  jobId: string
): Promise<{
  status: string
  progress?: number
  result?: any
  error?: string
}> {
  const queue = queues[QUEUE_NAMES[queueName]]
  const job = await queue.getJob(jobId)

  if (!job) {
    throw new Error('Job not found')
  }

  const state = await job.getState()
  const progress = job.progress as number
  const returnvalue = job.returnvalue
  const failedReason = job.failedReason

  return {
    status: state,
    progress,
    result: returnvalue,
    error: failedReason,
  }
}

/**
 * Cancel a job
 */
export async function cancelJob(
  queueName: keyof typeof QUEUE_NAMES,
  jobId: string
): Promise<void> {
  const queue = queues[QUEUE_NAMES[queueName]]
  const job = await queue.getJob(jobId)

  if (!job) {
    throw new Error('Job not found')
  }

  await job.remove()

  // Update database
  await prisma.processingJob.update({
    where: { id: jobId },
    data: { status: JobStatus.CANCELED },
  })
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName: keyof typeof QUEUE_NAMES) {
  const queue = queues[QUEUE_NAMES[queueName]]

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  }
}

/**
 * Get all queue statistics
 */
export async function getAllQueueStats() {
  const stats = await Promise.all([
    getQueueStats('PDF'),
    getQueueStats('WORD'),
    getQueueStats('EXCEL'),
    getQueueStats('IMAGE'),
    getQueueStats('GENERAL'),
  ])

  return {
    pdf: stats[0],
    word: stats[1],
    excel: stats[2],
    image: stats[3],
    general: stats[4],
  }
}

/**
 * Clean old jobs from queue
 */
export async function cleanQueue(
  queueName: keyof typeof QUEUE_NAMES,
  grace: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<string[]> {
  const queue = queues[QUEUE_NAMES[queueName]]

  // Clean completed jobs older than grace period
  const completed = await queue.clean(grace, 1000, 'completed')

  // Clean failed jobs older than 7 days
  const failed = await queue.clean(7 * 24 * 60 * 60 * 1000, 1000, 'failed')

  return [...completed, ...failed]
}

/**
 * Retry a failed job
 */
export async function retryFailedJob(
  queueName: keyof typeof QUEUE_NAMES,
  jobId: string
): Promise<void> {
  const queue = queues[QUEUE_NAMES[queueName]]
  const job = await queue.getJob(jobId)

  if (!job) {
    throw new Error('Job not found')
  }

  await job.retry()
}

/**
 * Get jobs by user
 */
export async function getUserJobs(
  userId: string,
  limit: number = 10
): Promise<Job[]> {
  const allJobs: Job[] = []

  for (const queue of Object.values(queues)) {
    const jobs = await queue.getJobs(['waiting', 'active', 'completed', 'failed'])

    const userJobs = jobs.filter(
      (job) => job.data.userId === userId
    ).slice(0, limit)

    allJobs.push(...userJobs)
  }

  // Sort by timestamp (most recent first)
  allJobs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

  return allJobs.slice(0, limit)
}

/**
 * Pause a queue
 */
export async function pauseQueue(queueName: keyof typeof QUEUE_NAMES): Promise<void> {
  const queue = queues[QUEUE_NAMES[queueName]]
  await queue.pause()
}

/**
 * Resume a queue
 */
export async function resumeQueue(queueName: keyof typeof QUEUE_NAMES): Promise<void> {
  const queue = queues[QUEUE_NAMES[queueName]]
  await queue.resume()
}

/**
 * Check if queue is paused
 */
export async function isQueuePaused(queueName: keyof typeof QUEUE_NAMES): Promise<boolean> {
  const queue = queues[QUEUE_NAMES[queueName]]
  return await queue.isPaused()
}

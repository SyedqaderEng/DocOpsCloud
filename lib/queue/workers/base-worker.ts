import { Worker, Job } from 'bullmq'
import { redis } from '../client'
import { ProcessingJobData, JobResult, JobProgress } from '../types'
import { prisma } from '@/lib/db/prisma'
import { JobStatus, ProcessingStatus } from '@prisma/client'

export abstract class BaseWorker {
  protected worker: Worker

  constructor(queueName: string) {
    this.worker = new Worker(
      queueName,
      async (job: Job<ProcessingJobData>) => {
        return await this.processJob(job)
      },
      {
        connection: redis,
        concurrency: this.getConcurrency(),
        limiter: {
          max: this.getMaxJobsPerInterval(),
          duration: 1000, // 1 second
        },
      }
    )

    this.setupEventHandlers()
  }

  /**
   * Process a job - must be implemented by subclasses
   */
  protected abstract processJob(job: Job<ProcessingJobData>): Promise<JobResult>

  /**
   * Get worker concurrency (how many jobs to process simultaneously)
   */
  protected getConcurrency(): number {
    return 5 // Default: process 5 jobs at once
  }

  /**
   * Get rate limit (max jobs per second)
   */
  protected getMaxJobsPerInterval(): number {
    return 10 // Default: max 10 jobs per second
  }

  /**
   * Update job progress in database and queue
   */
  protected async updateProgress(
    job: Job<ProcessingJobData>,
    progress: JobProgress
  ): Promise<void> {
    // Update BullMQ job progress
    await job.updateProgress(progress.progress)

    // Update database
    await prisma.processingJob.update({
      where: { id: job.data.jobId },
      data: {
        progress_percentage: Math.round(progress.progress),
        status: JobStatus.PROCESSING,
      },
    })
  }

  /**
   * Mark job as started in database
   */
  protected async markJobStarted(job: Job<ProcessingJobData>): Promise<void> {
    await prisma.processingJob.update({
      where: { id: job.data.jobId },
      data: {
        status: JobStatus.PROCESSING,
        started_at: new Date(),
      },
    })
  }

  /**
   * Mark job as completed in database
   */
  protected async markJobCompleted(
    job: Job<ProcessingJobData>,
    result: JobResult
  ): Promise<void> {
    await prisma.processingJob.update({
      where: { id: job.data.jobId },
      data: {
        status: JobStatus.COMPLETE,
        completed_at: new Date(),
        progress_percentage: 100,
        output_file_id: result.outputFileId,
      },
    })

    // Update input file processing status
    await prisma.file.update({
      where: { id: job.data.inputFileId },
      data: {
        processing_status: ProcessingStatus.COMPLETE,
      },
    })
  }

  /**
   * Mark job as failed in database
   */
  protected async markJobFailed(
    job: Job<ProcessingJobData>,
    error: string
  ): Promise<void> {
    await prisma.processingJob.update({
      where: { id: job.data.jobId },
      data: {
        status: JobStatus.FAILED,
        completed_at: new Date(),
        error_message: error,
      },
    })

    // Update input file processing status
    await prisma.file.update({
      where: { id: job.data.inputFileId },
      data: {
        processing_status: ProcessingStatus.FAILED,
      },
    })
  }

  /**
   * Setup event handlers for worker
   */
  protected setupEventHandlers(): void {
    this.worker.on('completed', async (job: Job<ProcessingJobData>, result: JobResult) => {
      console.log(`Job ${job.id} completed successfully`)
      await this.markJobCompleted(job, result)
    })

    this.worker.on('failed', async (job: Job<ProcessingJobData> | undefined, error: Error) => {
      if (job) {
        console.error(`Job ${job.id} failed:`, error.message)
        await this.markJobFailed(job, error.message)
      }
    })

    this.worker.on('active', async (job: Job<ProcessingJobData>) => {
      console.log(`Job ${job.id} started processing`)
      await this.markJobStarted(job)
    })

    this.worker.on('stalled', (jobId: string) => {
      console.warn(`Job ${jobId} stalled`)
    })

    this.worker.on('error', (error: Error) => {
      console.error('Worker error:', error)
    })
  }

  /**
   * Gracefully close the worker
   */
  async close(): Promise<void> {
    await this.worker.close()
  }
}

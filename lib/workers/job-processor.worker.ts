/**
 * Job Processor Worker
 * Processes file operations from the queue using engines
 */

import { Worker, Job } from 'bullmq'
import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { prisma } from '@/lib/db/prisma'
import { fileStorageService } from '../services/file-storage.service'
import { UniversalEngine } from '../engines/base.engine'
import { PDFEngine } from '../engines/pdf.engine'

export interface JobData {
  jobId: string
  fileId: string
  engine: string
  operation: string
  params: any
  userId?: string
}

class JobProcessorWorker {
  private worker: Worker
  private engines: Map<string, UniversalEngine>

  constructor() {
    this.engines = new Map()
    this.initializeEngines()

    this.worker = new Worker('file-processing', this.processJob.bind(this), {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // per 1 second
      },
    })

    this.setupEventHandlers()
  }

  /**
   * Initialize all available engines
   */
  private initializeEngines(): void {
    this.engines.set('PDFEngine', new PDFEngine())
    // Add more engines as they're implemented:
    // this.engines.set('ImageEngine', new ImageEngine())
    // this.engines.set('VideoEngine', new VideoEngine())
    // etc.
  }

  /**
   * Get engine instance
   */
  private getEngine(engineName: string): UniversalEngine {
    const engine = this.engines.get(engineName)

    if (!engine) {
      throw new Error(
        `Engine not found: ${engineName}. Available: ${Array.from(this.engines.keys()).join(', ')}`
      )
    }

    return engine
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job<JobData>): Promise<void> {
    const { jobId, fileId, engine: engineName, operation, params, userId } = job.data

    console.log(`[Worker] Processing job ${jobId}: ${engineName}.${operation}`)

    // Create work directory
    const workDir = path.join(os.tmpdir(), `docops-job-${jobId}`)
    await fs.mkdir(workDir, { recursive: true })

    const filesToCleanup: string[] = [workDir]

    try {
      // Update status to processing
      await this.updateJobStatus(jobId, 'processing', 10)

      // 1. Download input file from storage
      console.log(`[Worker] Downloading file ${fileId}`)
      const inputPath = path.join(workDir, 'input')
      await fileStorageService.downloadToPath(fileId, inputPath)
      filesToCleanup.push(inputPath)

      await this.updateJobStatus(jobId, 'processing', 30)

      // 2. Get engine instance
      const engine = this.getEngine(engineName)

      // 3. Execute workflow: load -> process -> export
      console.log(`[Worker] Loading file with ${engineName}`)
      const loaded = await engine.load(inputPath)

      await this.updateJobStatus(jobId, 'processing', 50)

      console.log(`[Worker] Processing operation: ${operation}`)
      const processed = await engine.process(loaded, operation, params)

      await this.updateJobStatus(jobId, 'processing', 70)

      console.log(`[Worker] Exporting result`)
      const exported = await engine.export(processed)

      await this.updateJobStatus(jobId, 'processing', 90)

      // 4. Upload result to storage
      console.log(`[Worker] Uploading result`)
      const originalFile = await fileStorageService.getFileMetadata(fileId)
      const outputFilename = this.generateOutputFilename(originalFile.filename, operation)

      const uploadResult = await fileStorageService.uploadFromBuffer(
        exported,
        outputFilename,
        originalFile.mimeType,
        userId,
        {
          ...processed.metadata,
          originalFileId: fileId,
          operation,
          processedAt: new Date(),
        }
      )

      // 5. Cleanup temporary files
      console.log(`[Worker] Cleaning up`)
      await engine.cleanup(filesToCleanup)

      // 6. Update job status to completed
      await this.updateJobStatus(jobId, 'completed', 100, uploadResult.fileId)

      console.log(`[Worker] Job ${jobId} completed successfully`)
    } catch (error: any) {
      console.error(`[Worker] Job ${jobId} failed:`, error)

      // Cleanup on error
      try {
        await fs.rm(workDir, { recursive: true, force: true })
      } catch (cleanupError) {
        console.error(`[Worker] Cleanup failed:`, cleanupError)
      }

      // Update job status to failed
      await this.updateJobStatus(jobId, 'failed', 0, undefined, error.message)

      throw error // Re-throw so BullMQ can handle retry
    }
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(
    jobId: string,
    status: 'queued' | 'processing' | 'completed' | 'failed',
    progress: number,
    outputFileId?: string,
    error?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      progress,
    }

    if (status === 'processing' && progress === 10) {
      updateData.startedAt = new Date()
    }

    if (status === 'completed') {
      updateData.completedAt = new Date()
      if (outputFileId) {
        updateData.outputToken = outputFileId
      }
    }

    if (status === 'failed' && error) {
      updateData.error = error
      updateData.completedAt = new Date()
    }

    await prisma.request.update({
      where: { requestId: jobId },
      data: updateData,
    })
  }

  /**
   * Generate output filename based on operation
   */
  private generateOutputFilename(originalFilename: string, operation: string): string {
    const ext = path.extname(originalFilename)
    const base = path.basename(originalFilename, ext)

    // For text extraction, change extension to .txt
    if (operation === 'extract-text') {
      return `${base}-text.txt`
    }

    // For metadata operations, return JSON
    if (operation === 'get-metadata') {
      return `${base}-metadata.json`
    }

    // For most operations, append operation name
    return `${base}-${operation}${ext}`
  }

  /**
   * Setup event handlers for the worker
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`[Worker] Job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed:`, err.message)
    })

    this.worker.on('error', (err) => {
      console.error('[Worker] Worker error:', err)
    })

    this.worker.on('ready', () => {
      console.log('[Worker] Worker is ready and waiting for jobs')
    })
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[Worker] Shutting down gracefully...')
    await this.worker.close()
    console.log('[Worker] Worker shut down')
  }
}

// Create and export worker instance
let workerInstance: JobProcessorWorker | null = null

export function startWorker(): JobProcessorWorker {
  if (!workerInstance) {
    workerInstance = new JobProcessorWorker()
    console.log('[Worker] Job processor worker started')
  }
  return workerInstance
}

export function getWorker(): JobProcessorWorker | null {
  return workerInstance
}

// Auto-start worker if this file is run directly
if (require.main === module) {
  const worker = startWorker()

  // Handle shutdown signals
  process.on('SIGTERM', async () => {
    await worker.shutdown()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    await worker.shutdown()
    process.exit(0)
  })
}

/**
 * Image Processing Worker
 *
 * Handles image processing jobs (resize, compress, convert, optimize)
 */

import { Worker, Job } from 'bullmq'
import { redis, QUEUE_NAMES } from '../client'
import { imageProcessor } from '@/lib/processing/image-processor'
import { prisma } from '@/lib/db/prisma'
import type {
  ImageResizeJobData,
  ImageCompressJobData,
  ImageConvertJobData,
  ImageOptimizeJobData,
} from '../jobs/image-jobs'

type ImageJobData =
  | ImageResizeJobData
  | ImageCompressJobData
  | ImageConvertJobData
  | ImageOptimizeJobData

export class ImageWorker {
  private worker: Worker

  constructor() {
    this.worker = new Worker(QUEUE_NAMES.IMAGE, this.processJob.bind(this), {
      connection: redis,
      concurrency: 5, // Process up to 5 jobs concurrently
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // Per second
      },
    })

    this.setupEventHandlers()
  }

  /**
   * Process image job
   */
  private async processJob(job: Job<ImageJobData>) {
    const { jobId, userId, inputS3Key } = job.data

    try {
      // Update job status to processing
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          startedAt: new Date(),
        },
      })

      await job.updateProgress(10)

      let outputS3Key: string
      let metadata: any = {}

      // Handle different job types
      switch (job.name) {
        case 'image_resize':
          const resizeData = job.data as ImageResizeJobData
          const resizeResult = await imageProcessor.resize(inputS3Key, resizeData.options)
          outputS3Key = resizeResult.outputS3Key
          metadata = {
            ...resizeData.options,
            width: resizeResult.result.metadata.width,
            height: resizeResult.result.metadata.height,
            size: resizeResult.result.size,
            format: resizeResult.result.format,
          }
          break

        case 'image_compress':
          const compressData = job.data as ImageCompressJobData
          const compressResult = await imageProcessor.compress(
            inputS3Key,
            compressData.options
          )
          outputS3Key = compressResult.outputS3Key
          metadata = {
            ...compressData.options,
            originalSize: (await imageProcessor.getFileSize(inputS3Key)).bytes,
            compressedSize: compressResult.result.size,
            compressionRatio: (
              (1 - compressResult.result.size / (await imageProcessor.getFileSize(inputS3Key)).bytes) *
              100
            ).toFixed(2) + '%',
          }
          break

        case 'image_convert':
          const convertData = job.data as ImageConvertJobData
          const convertResult = await imageProcessor.convert(
            inputS3Key,
            convertData.options
          )
          outputS3Key = convertResult.outputS3Key
          metadata = {
            ...convertData.options,
            width: convertResult.result.metadata.width,
            height: convertResult.result.metadata.height,
            size: convertResult.result.size,
            format: convertResult.result.format,
          }
          break

        case 'image_optimize':
          const optimizeData = job.data as ImageOptimizeJobData
          const optimizeResult = await imageProcessor.optimize(
            inputS3Key,
            optimizeData.options
          )
          outputS3Key = optimizeResult.outputS3Key
          const originalSize = (await imageProcessor.getFileSize(inputS3Key)).bytes
          metadata = {
            ...optimizeData.options,
            originalSize,
            optimizedSize: optimizeResult.result.size,
            savings: (((originalSize - optimizeResult.result.size) / originalSize) * 100).toFixed(
              2
            ) + '%',
            width: optimizeResult.result.metadata.width,
            height: optimizeResult.result.metadata.height,
            format: optimizeResult.result.format,
          }
          break

        default:
          throw new Error(`Unknown job type: ${job.name}`)
      }

      await job.updateProgress(90)

      // Create output file record
      const outputFile = await prisma.file.create({
        data: {
          userId,
          name: this.getOutputFileName(job, metadata.format),
          s3Key: outputS3Key,
          size: metadata.size || metadata.optimizedSize || 0,
          mimeType: this.getOutputMimeType(metadata.format),
        },
      })

      await job.updateProgress(95)

      // Update job as completed
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          outputFileId: outputFile.id,
          completedAt: new Date(),
          metadata: {
            ...metadata,
            outputFileName: outputFile.name,
          },
        },
      })

      await job.updateProgress(100)

      return {
        success: true,
        outputFileId: outputFile.id,
        outputS3Key,
      }
    } catch (error) {
      console.error(`Image job ${jobId} failed:`, error)

      // Update job as failed
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      })

      throw error
    }
  }

  /**
   * Get output file name based on job type
   */
  private getOutputFileName(job: Job<ImageJobData>, format: string): string {
    const timestamp = Date.now()
    const extension = format || 'jpg'

    switch (job.name) {
      case 'image_resize':
        return `resized-${timestamp}.${extension}`
      case 'image_compress':
        return `compressed-${timestamp}.${extension}`
      case 'image_convert':
        return `converted-${timestamp}.${extension}`
      case 'image_optimize':
        return `optimized-${timestamp}.${extension}`
      default:
        return `output-${timestamp}.${extension}`
    }
  }

  /**
   * Get output MIME type based on format
   */
  private getOutputMimeType(format: string): string {
    return `image/${format}`
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`✓ Image job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`✗ Image job ${job?.id} failed:`, err.message)
    })

    this.worker.on('error', (err) => {
      console.error('Image worker error:', err)
    })
  }

  /**
   * Close worker
   */
  async close() {
    await this.worker.close()
  }
}

import { Job } from 'bullmq'
import { BaseWorker } from './base-worker'
import {
  ProcessingJobData,
  JobResult,
  PdfMergeJobData,
  PdfSplitJobData,
  PdfCompressJobData,
  PdfWatermarkJobData,
  PdfRotateJobData,
  PdfExtractPagesJobData,
  PdfPageNumbersJobData,
} from '../types'
import { QUEUE_NAMES } from '../client'
import { PdfProcessor } from '@/lib/processing/pdf-processor'

export class PdfWorker extends BaseWorker {
  private processor: PdfProcessor

  constructor() {
    super(QUEUE_NAMES.PDF)
    this.processor = new PdfProcessor()
  }

  protected async processJob(job: Job<ProcessingJobData>): Promise<JobResult> {
    const { operationType } = job.data

    console.log(`Processing PDF job: ${operationType}`)

    try {
      switch (operationType) {
        case 'pdf_merge':
          return await this.processPdfMerge(job as Job<PdfMergeJobData>)

        case 'pdf_split':
          return await this.processPdfSplit(job as Job<PdfSplitJobData>)

        case 'pdf_compress':
          return await this.processPdfCompress(job as Job<PdfCompressJobData>)

        case 'pdf_watermark':
          return await this.processPdfWatermark(job as Job<PdfWatermarkJobData>)

        case 'pdf_rotate':
          return await this.processPdfRotate(job as Job<PdfRotateJobData>)

        case 'pdf_extract_pages':
          return await this.processPdfExtractPages(job as Job<PdfExtractPagesJobData>)

        case 'pdf_page_numbers':
          return await this.processPdfPageNumbers(job as Job<PdfPageNumbersJobData>)

        default:
          throw new Error(`Unknown PDF operation: ${operationType}`)
      }
    } catch (error) {
      console.error(`PDF processing error:`, error)
      throw error
    }
  }

  /**
   * Process PDF merge operation
   */
  private async processPdfMerge(job: Job<PdfMergeJobData>): Promise<JobResult> {
    const startTime = Date.now()
    const { fileIds } = job.data.operationParams

    await this.updateProgress(job, { progress: 10, message: 'Starting PDF merge...' })

    await this.updateProgress(job, {
      progress: 30,
      message: `Downloading ${fileIds.length} PDFs...`,
    })

    const result = await this.processor.mergePdfs(fileIds, job.data.userId)

    await this.updateProgress(job, { progress: 90, message: 'Upload complete' })

    const processingTime = Date.now() - startTime

    return {
      success: true,
      outputFileId: result.fileId,
      outputFileUrl: result.url,
      processingTime,
      metadata: {
        filesCount: fileIds.length,
      },
    }
  }

  /**
   * Process PDF split operation
   */
  private async processPdfSplit(job: Job<PdfSplitJobData>): Promise<JobResult> {
    const startTime = Date.now()
    const { pageRanges } = job.data.operationParams

    await this.updateProgress(job, { progress: 10, message: 'Starting PDF split...' })

    await this.updateProgress(job, { progress: 30, message: 'Downloading PDF...' })

    const results = await this.processor.splitPdf(
      job.data.inputFileId,
      job.data.userId,
      pageRanges
    )

    await this.updateProgress(job, { progress: 90, message: 'Upload complete' })

    const processingTime = Date.now() - startTime

    return {
      success: true,
      outputFileId: results[0]?.fileId,
      outputFileUrl: results[0]?.url,
      processingTime,
      metadata: {
        splitCount: results.length,
        files: results,
      },
    }
  }

  /**
   * Process PDF compress operation
   */
  private async processPdfCompress(job: Job<PdfCompressJobData>): Promise<JobResult> {
    const startTime = Date.now()
    const { quality } = job.data.operationParams

    await this.updateProgress(job, { progress: 10, message: 'Starting PDF compression...' })

    await this.updateProgress(job, { progress: 30, message: 'Downloading PDF...' })

    const result = await this.processor.compressPdf(job.data.inputFileId, job.data.userId, quality)

    await this.updateProgress(job, { progress: 90, message: 'Upload complete' })

    const processingTime = Date.now() - startTime

    return {
      success: true,
      outputFileId: result.fileId,
      outputFileUrl: result.url,
      processingTime,
      metadata: {
        quality,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        reduction: ((1 - result.compressedSize / result.originalSize) * 100).toFixed(2) + '%',
      },
    }
  }

  /**
   * Process PDF watermark operation
   */
  private async processPdfWatermark(job: Job<PdfWatermarkJobData>): Promise<JobResult> {
    const startTime = Date.now()
    const { text, ...options } = job.data.operationParams

    await this.updateProgress(job, { progress: 10, message: 'Starting PDF watermark...' })

    await this.updateProgress(job, { progress: 30, message: 'Downloading PDF...' })

    const result = await this.processor.addWatermark(
      job.data.inputFileId,
      job.data.userId,
      text,
      options
    )

    await this.updateProgress(job, { progress: 90, message: 'Upload complete' })

    const processingTime = Date.now() - startTime

    return {
      success: true,
      outputFileId: result.fileId,
      outputFileUrl: result.url,
      processingTime,
      metadata: {
        watermarkText: text,
      },
    }
  }

  /**
   * Process PDF rotate operation
   */
  private async processPdfRotate(job: Job<PdfRotateJobData>): Promise<JobResult> {
    const startTime = Date.now()
    const { pageNumbers, rotation } = job.data.operationParams

    await this.updateProgress(job, { progress: 10, message: 'Starting PDF rotation...' })

    await this.updateProgress(job, { progress: 30, message: 'Downloading PDF...' })

    const result = await this.processor.rotatePdf(
      job.data.inputFileId,
      job.data.userId,
      pageNumbers,
      rotation
    )

    await this.updateProgress(job, { progress: 90, message: 'Upload complete' })

    const processingTime = Date.now() - startTime

    return {
      success: true,
      outputFileId: result.fileId,
      outputFileUrl: result.url,
      processingTime,
      metadata: {
        rotatedPages: pageNumbers.length,
        rotation,
      },
    }
  }

  /**
   * Process PDF extract pages operation
   */
  private async processPdfExtractPages(job: Job<PdfExtractPagesJobData>): Promise<JobResult> {
    const startTime = Date.now()
    const { pageNumbers } = job.data.operationParams

    await this.updateProgress(job, { progress: 10, message: 'Starting PDF page extraction...' })

    await this.updateProgress(job, { progress: 30, message: 'Downloading PDF...' })

    const result = await this.processor.extractPages(
      job.data.inputFileId,
      job.data.userId,
      pageNumbers
    )

    await this.updateProgress(job, { progress: 90, message: 'Upload complete' })

    const processingTime = Date.now() - startTime

    return {
      success: true,
      outputFileId: result.fileId,
      outputFileUrl: result.url,
      processingTime,
      metadata: {
        extractedPages: pageNumbers.length,
      },
    }
  }

  /**
   * Process PDF page numbers operation
   */
  private async processPdfPageNumbers(job: Job<PdfPageNumbersJobData>): Promise<JobResult> {
    const startTime = Date.now()
    const options = job.data.operationParams

    await this.updateProgress(job, { progress: 10, message: 'Starting PDF page numbering...' })

    await this.updateProgress(job, { progress: 30, message: 'Downloading PDF...' })

    const result = await this.processor.addPageNumbers(
      job.data.inputFileId,
      job.data.userId,
      options
    )

    await this.updateProgress(job, { progress: 90, message: 'Upload complete' })

    const processingTime = Date.now() - startTime

    return {
      success: true,
      outputFileId: result.fileId,
      outputFileUrl: result.url,
      processingTime,
      metadata: {
        format: options.format,
        position: options.position,
      },
    }
  }

  protected getConcurrency(): number {
    return 3 // Process 3 PDF jobs simultaneously
  }
}

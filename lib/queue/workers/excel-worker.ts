/**
 * Excel/CSV Processing Worker
 *
 * Handles Excel and CSV conversion jobs
 */

import { Worker, Job } from 'bullmq'
import { redis, QUEUE_NAMES } from '../client'
import { excelProcessor } from '@/lib/processing/excel-processor'
import { prisma } from '@/lib/db/prisma'
import type { ExcelToCsvJobData, CsvToExcelJobData } from '../jobs/excel-jobs'

type ExcelJobData = ExcelToCsvJobData | CsvToExcelJobData

export class ExcelWorker {
  private worker: Worker

  constructor() {
    this.worker = new Worker(QUEUE_NAMES.EXCEL, this.processJob.bind(this), {
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
   * Process Excel job
   */
  private async processJob(job: Job<ExcelJobData>) {
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
        case 'excel_to_csv':
          const excelToCsvData = job.data as ExcelToCsvJobData
          const csvResult = await excelProcessor.convertExcelToCsv(
            inputS3Key,
            excelToCsvData.options
          )
          outputS3Key = csvResult.outputS3Key
          metadata = {
            ...excelToCsvData.options,
            rowCount: csvResult.result.rowCount,
            size: csvResult.result.size,
          }
          break

        case 'csv_to_excel':
          const csvToExcelData = job.data as CsvToExcelJobData
          const excelResult = await excelProcessor.convertCsvToExcel(
            inputS3Key,
            csvToExcelData.options
          )
          outputS3Key = excelResult.outputS3Key
          metadata = {
            ...csvToExcelData.options,
            rowCount: excelResult.result.rowCount,
            size: excelResult.result.size,
            metadata: excelResult.result.metadata,
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
          name: this.getOutputFileName(job),
          s3Key: outputS3Key,
          size: metadata.size || 0,
          mimeType: this.getOutputMimeType(job),
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
      console.error(`Excel job ${jobId} failed:`, error)

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
  private getOutputFileName(job: Job<ExcelJobData>): string {
    const timestamp = Date.now()

    switch (job.name) {
      case 'excel_to_csv':
        return `converted-${timestamp}.csv`
      case 'csv_to_excel':
        return `converted-${timestamp}.xlsx`
      default:
        return `output-${timestamp}.xlsx`
    }
  }

  /**
   * Get output MIME type based on job type
   */
  private getOutputMimeType(job: Job<ExcelJobData>): string {
    switch (job.name) {
      case 'excel_to_csv':
        return 'text/csv'
      case 'csv_to_excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      default:
        return 'application/octet-stream'
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`✓ Excel job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`✗ Excel job ${job?.id} failed:`, err.message)
    })

    this.worker.on('error', (err) => {
      console.error('Excel worker error:', err)
    })
  }

  /**
   * Close worker
   */
  async close() {
    await this.worker.close()
  }
}

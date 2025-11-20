import { Job } from 'bullmq'
import { BaseWorker } from './base-worker'
import { ProcessingJobData, JobResult } from '../types'
import { QUEUE_NAMES } from '../client'
import { WordProcessor } from '@/lib/processing/word-processor'

// Word job data interfaces
interface WordToHtmlJobData extends ProcessingJobData {
  operationType: 'word_to_html'
  operationParams: {
    includeStyles?: boolean
    includeImages?: boolean
    cleanHtml?: boolean
  }
}

interface WordToMarkdownJobData extends ProcessingJobData {
  operationType: 'word_to_markdown'
  operationParams: {
    preserveFormatting?: boolean
    includeImages?: boolean
    headingStyle?: 'atx' | 'setext'
    bulletListMarker?: '-' | '*' | '+'
  }
}

interface WordToPdfJobData extends ProcessingJobData {
  operationType: 'word_to_pdf'
  operationParams: {
    pageSize?: 'A4' | 'Letter' | 'Legal'
    orientation?: 'portrait' | 'landscape'
  }
}

export class WordWorker extends BaseWorker {
  private processor: WordProcessor

  constructor() {
    super(QUEUE_NAMES.WORD)
    this.processor = new WordProcessor()
  }

  protected async processJob(job: Job<ProcessingJobData>): Promise<JobResult> {
    const { operationType } = job.data

    console.log(`Processing Word job: ${operationType}`)

    try {
      switch (operationType) {
        case 'word_to_html':
          return await this.processWordToHtml(job as Job<WordToHtmlJobData>)

        case 'word_to_markdown':
          return await this.processWordToMarkdown(job as Job<WordToMarkdownJobData>)

        case 'word_to_pdf':
          return await this.processWordToPdf(job as Job<WordToPdfJobData>)

        default:
          throw new Error(`Unknown Word operation: ${operationType}`)
      }
    } catch (error) {
      console.error(`Word processing error:`, error)
      throw error
    }
  }

  /**
   * Process Word to HTML conversion
   */
  private async processWordToHtml(job: Job<WordToHtmlJobData>): Promise<JobResult> {
    const startTime = Date.now()
    const options = job.data.operationParams

    await this.updateProgress(job, {
      progress: 10,
      message: 'Starting Word to HTML conversion...',
    })

    await this.updateProgress(job, { progress: 30, message: 'Downloading DOCX file...' })

    const result = await this.processor.convertToHtml(
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
        format: 'HTML',
        htmlLength: result.html.length,
      },
    }
  }

  /**
   * Process Word to Markdown conversion
   */
  private async processWordToMarkdown(job: Job<WordToMarkdownJobData>): Promise<JobResult> {
    const startTime = Date.now()
    const options = job.data.operationParams

    await this.updateProgress(job, {
      progress: 10,
      message: 'Starting Word to Markdown conversion...',
    })

    await this.updateProgress(job, { progress: 30, message: 'Downloading DOCX file...' })

    const result = await this.processor.convertToMarkdown(
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
        format: 'Markdown',
        markdownLength: result.markdown.length,
      },
    }
  }

  /**
   * Process Word to PDF conversion
   */
  private async processWordToPdf(job: Job<WordToPdfJobData>): Promise<JobResult> {
    const startTime = Date.now()
    const options = job.data.operationParams

    await this.updateProgress(job, {
      progress: 10,
      message: 'Starting Word to PDF conversion...',
    })

    await this.updateProgress(job, { progress: 30, message: 'Downloading DOCX file...' })

    const result = await this.processor.convertToPdf(
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
        format: 'PDF',
        pageSize: options.pageSize,
        orientation: options.orientation,
      },
    }
  }

  protected getConcurrency(): number {
    return 2 // Process 2 Word jobs simultaneously
  }
}

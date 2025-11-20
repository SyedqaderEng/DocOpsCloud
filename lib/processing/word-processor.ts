/**
 * Word Processor
 *
 * Main processor for Word/DOCX operations
 * Orchestrates S3 downloads, Word services, and S3 uploads
 */

import { downloadFileFromS3, uploadFileToS3 } from '@/lib/storage/s3'
import { createFileRecord } from '@/lib/storage/file-manager'
import { wordConversionService } from '@/modules/word/services/conversion'
import { wordMetadataService } from '@/modules/word/services/metadata'
import { BaseProcessor } from './base-processor'
import {
  WordToPdfOptions,
  WordToHtmlOptions,
  WordToMarkdownOptions,
  WordMetadata,
} from '@/modules/word/types'

export class WordProcessor extends BaseProcessor {
  /**
   * Convert DOCX to HTML
   */
  async convertToHtml(
    fileId: string,
    userId: string,
    options: WordToHtmlOptions = {}
  ): Promise<{ fileId: string; url: string; html: string }> {
    try {
      // Download DOCX from S3
      const docxBuffer = await this.downloadFile(fileId, userId)

      // Convert to HTML
      const result = await wordConversionService.docxToHtml(docxBuffer, options)

      // Upload HTML result to S3
      const htmlBuffer = Buffer.from(result.content as string, 'utf8')
      const outputFileName = await this.generateOutputFileName(fileId, 'html')
      const { key } = await uploadFileToS3({
        buffer: htmlBuffer,
        fileName: outputFileName,
        contentType: 'text/html',
        userId,
      })

      // Create file record
      const file = await createFileRecord({
        userId,
        fileName: outputFileName,
        s3Key: key,
        fileSize: htmlBuffer.length,
        mimeType: 'text/html',
        fileType: 'HTML',
      })

      // Generate download URL
      const downloadUrl = await this.generateDownloadUrl(file.id, userId)

      return {
        fileId: file.id,
        url: downloadUrl,
        html: result.content as string,
      }
    } catch (error) {
      console.error('Word to HTML conversion error:', error)
      throw new Error(`Failed to convert DOCX to HTML: ${error}`)
    }
  }

  /**
   * Convert DOCX to Markdown
   */
  async convertToMarkdown(
    fileId: string,
    userId: string,
    options: WordToMarkdownOptions = {}
  ): Promise<{ fileId: string; url: string; markdown: string }> {
    try {
      // Download DOCX from S3
      const docxBuffer = await this.downloadFile(fileId, userId)

      // Convert to Markdown
      const result = await wordConversionService.docxToMarkdown(docxBuffer, options)

      // Upload Markdown result to S3
      const markdownBuffer = Buffer.from(result.content as string, 'utf8')
      const outputFileName = await this.generateOutputFileName(fileId, 'md')
      const { key } = await uploadFileToS3({
        buffer: markdownBuffer,
        fileName: outputFileName,
        contentType: 'text/markdown',
        userId,
      })

      // Create file record
      const file = await createFileRecord({
        userId,
        fileName: outputFileName,
        s3Key: key,
        fileSize: markdownBuffer.length,
        mimeType: 'text/markdown',
        fileType: 'MARKDOWN',
      })

      // Generate download URL
      const downloadUrl = await this.generateDownloadUrl(file.id, userId)

      return {
        fileId: file.id,
        url: downloadUrl,
        markdown: result.content as string,
      }
    } catch (error) {
      console.error('Word to Markdown conversion error:', error)
      throw new Error(`Failed to convert DOCX to Markdown: ${error}`)
    }
  }

  /**
   * Convert DOCX to plain text
   */
  async convertToText(
    fileId: string,
    userId: string
  ): Promise<{
    fileId: string
    url: string
    text: string
    wordCount: number
    characterCount: number
  }> {
    try {
      // Download DOCX from S3
      const docxBuffer = await this.downloadFile(fileId, userId)

      // Extract text
      const result = await wordConversionService.docxToText(docxBuffer)

      // Upload text result to S3
      const textBuffer = Buffer.from(result.text, 'utf8')
      const outputFileName = await this.generateOutputFileName(fileId, 'txt')
      const { key } = await uploadFileToS3({
        buffer: textBuffer,
        fileName: outputFileName,
        contentType: 'text/plain',
        userId,
      })

      // Create file record
      const file = await createFileRecord({
        userId,
        fileName: outputFileName,
        s3Key: key,
        fileSize: textBuffer.length,
        mimeType: 'text/plain',
        fileType: 'TEXT',
      })

      // Generate download URL
      const downloadUrl = await this.generateDownloadUrl(file.id, userId)

      return {
        fileId: file.id,
        url: downloadUrl,
        text: result.text,
        wordCount: result.wordCount,
        characterCount: result.characterCount,
      }
    } catch (error) {
      console.error('Word to text conversion error:', error)
      throw new Error(`Failed to convert DOCX to text: ${error}`)
    }
  }

  /**
   * Convert DOCX to PDF
   * Note: Requires puppeteer to be installed
   */
  async convertToPdf(
    fileId: string,
    userId: string,
    options: WordToPdfOptions = {}
  ): Promise<{ fileId: string; url: string }> {
    try {
      // Download DOCX from S3
      const docxBuffer = await this.downloadFile(fileId, userId)

      // Convert to PDF
      const result = await wordConversionService.docxToPdf(docxBuffer, options)

      // Upload PDF result to S3
      const pdfBuffer = result.content as Buffer
      const outputFileName = await this.generateOutputFileName(fileId, 'pdf')
      const { key } = await uploadFileToS3({
        buffer: pdfBuffer,
        fileName: outputFileName,
        contentType: 'application/pdf',
        userId,
      })

      // Create file record
      const file = await createFileRecord({
        userId,
        fileName: outputFileName,
        s3Key: key,
        fileSize: pdfBuffer.length,
        mimeType: 'application/pdf',
        fileType: 'PDF',
      })

      // Generate download URL
      const downloadUrl = await this.generateDownloadUrl(file.id, userId)

      return {
        fileId: file.id,
        url: downloadUrl,
      }
    } catch (error) {
      console.error('Word to PDF conversion error:', error)
      throw new Error(`Failed to convert DOCX to PDF: ${error}`)
    }
  }

  /**
   * Get DOCX metadata
   */
  async getMetadata(fileId: string, userId: string): Promise<WordMetadata> {
    try {
      // Download DOCX from S3
      const docxBuffer = await this.downloadFile(fileId, userId)

      // Extract metadata
      const metadata = await wordMetadataService.getMetadata(docxBuffer)

      return metadata
    } catch (error) {
      console.error('Get Word metadata error:', error)
      throw new Error(`Failed to get DOCX metadata: ${error}`)
    }
  }

  /**
   * Set DOCX metadata
   */
  async setMetadata(
    fileId: string,
    userId: string,
    metadata: Partial<WordMetadata>
  ): Promise<{ fileId: string; url: string }> {
    try {
      // Download DOCX from S3
      const docxBuffer = await this.downloadFile(fileId, userId)

      // Set metadata
      const updatedBuffer = await wordMetadataService.setMetadata(docxBuffer, metadata)

      // Upload updated DOCX to S3
      const outputFileName = await this.generateOutputFileName(fileId, 'docx')
      const { key } = await uploadFileToS3({
        buffer: updatedBuffer,
        fileName: outputFileName,
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        userId,
      })

      // Create file record
      const file = await createFileRecord({
        userId,
        fileName: outputFileName,
        s3Key: key,
        fileSize: updatedBuffer.length,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileType: 'DOCX',
      })

      // Generate download URL
      const downloadUrl = await this.generateDownloadUrl(file.id, userId)

      return {
        fileId: file.id,
        url: downloadUrl,
      }
    } catch (error) {
      console.error('Set Word metadata error:', error)
      throw new Error(`Failed to set DOCX metadata: ${error}`)
    }
  }

  /**
   * Generate output file name based on input file and extension
   */
  private async generateOutputFileName(
    inputFileId: string,
    extension: string
  ): Promise<string> {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `word-output-${timestamp}-${random}.${extension}`
  }
}

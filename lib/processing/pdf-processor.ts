import { BaseProcessor } from './base-processor'
import { pdfCoreService } from '@/modules/pdf/services/core'
import { pdfSecurityService } from '@/modules/pdf/services/security'
import { pdfCompressionService } from '@/modules/pdf/services/compression'

export class PdfProcessor extends BaseProcessor {
  /**
   * Merge multiple PDFs into one
   */
  async mergePdfs(fileIds: string[], userId: string): Promise<{ fileId: string; url: string }> {
    this.log('Starting PDF merge', { fileIds })

    // Download all PDF files
    const pdfBuffers: Buffer[] = []
    for (let i = 0; i < fileIds.length; i++) {
      this.log(`Downloading PDF ${i + 1} of ${fileIds.length}`)
      await this.validateInputFile(fileIds[i])
      const pdfBuffer = await this.downloadFile(fileIds[i])
      pdfBuffers.push(pdfBuffer)
    }

    // Merge PDFs using core service
    const mergedBuffer = await pdfCoreService.mergePdfs(pdfBuffers)

    // Upload merged PDF
    const result = await this.uploadFile(userId, 'merged.pdf', mergedBuffer, 'application/pdf')

    this.log('PDF merge complete', { outputFileId: result.fileId })

    return result
  }

  /**
   * Split PDF by page ranges
   */
  async splitPdf(
    fileId: string,
    userId: string,
    pageRanges?: Array<{ start: number; end: number }>
  ): Promise<Array<{ fileId: string; url: string }>> {
    this.log('Starting PDF split', { fileId, pageRanges })

    await this.validateInputFile(fileId)
    const pdfBuffer = await this.downloadFile(fileId)

    // Get metadata to determine page count
    const metadata = await pdfCoreService.getMetadata(pdfBuffer)

    // If no ranges specified, split each page
    if (!pageRanges || pageRanges.length === 0) {
      pageRanges = Array.from({ length: metadata.pageCount }, (_, i) => ({
        start: i + 1,
        end: i + 1,
      }))
    }

    // Split PDF using core service
    const splitBuffers = await pdfCoreService.splitPdf(pdfBuffer, pageRanges)

    // Upload all split PDFs
    const results: Array<{ fileId: string; url: string }> = []
    for (let i = 0; i < splitBuffers.length; i++) {
      const range = pageRanges[i]
      const fileName = `pages-${range.start}-${range.end}.pdf`
      const result = await this.uploadFile(userId, fileName, splitBuffers[i], 'application/pdf')
      results.push(result)
    }

    this.log('PDF split complete', { resultCount: results.length })

    return results
  }

  /**
   * Compress PDF
   */
  async compressPdf(
    fileId: string,
    userId: string,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{ fileId: string; url: string; originalSize: number; compressedSize: number }> {
    this.log('Starting PDF compression', { fileId, quality })

    await this.validateInputFile(fileId)
    const pdfBuffer = await this.downloadFile(fileId)

    const originalSize = pdfBuffer.length

    // Compress PDF using compression service
    const compressedBuffer = await pdfCompressionService.compressPdf(pdfBuffer, quality)

    const compressedSize = compressedBuffer.length

    // Upload compressed PDF
    const result = await this.uploadFile(
      userId,
      'compressed.pdf',
      compressedBuffer,
      'application/pdf'
    )

    this.log('PDF compression complete', {
      outputFileId: result.fileId,
      originalSize,
      compressedSize,
      reduction: ((1 - compressedSize / originalSize) * 100).toFixed(2) + '%',
    })

    return {
      ...result,
      originalSize,
      compressedSize,
    }
  }

  /**
   * Add watermark to PDF
   */
  async addWatermark(
    fileId: string,
    userId: string,
    watermarkText: string,
    options?: any
  ): Promise<{ fileId: string; url: string }> {
    this.log('Starting PDF watermark', { fileId, watermarkText })

    await this.validateInputFile(fileId)
    const pdfBuffer = await this.downloadFile(fileId)

    // Add watermark using security service
    const watermarkedBuffer = await pdfSecurityService.addWatermark(
      pdfBuffer,
      watermarkText,
      options
    )

    // Upload watermarked PDF
    const result = await this.uploadFile(
      userId,
      'watermarked.pdf',
      watermarkedBuffer,
      'application/pdf'
    )

    this.log('PDF watermark complete', { outputFileId: result.fileId })

    return result
  }

  /**
   * Rotate PDF pages
   */
  async rotatePdf(
    fileId: string,
    userId: string,
    pageNumbers: number[],
    rotation: 90 | 180 | 270
  ): Promise<{ fileId: string; url: string }> {
    this.log('Starting PDF rotation', { fileId, pageNumbers, rotation })

    await this.validateInputFile(fileId)
    const pdfBuffer = await this.downloadFile(fileId)

    // Rotate pages using core service
    const rotatedBuffer = await pdfCoreService.rotatePages(pdfBuffer, pageNumbers, rotation)

    // Upload rotated PDF
    const result = await this.uploadFile(userId, 'rotated.pdf', rotatedBuffer, 'application/pdf')

    this.log('PDF rotation complete', { outputFileId: result.fileId })

    return result
  }

  /**
   * Extract specific pages
   */
  async extractPages(
    fileId: string,
    userId: string,
    pageNumbers: number[]
  ): Promise<{ fileId: string; url: string }> {
    this.log('Starting PDF page extraction', { fileId, pageNumbers })

    await this.validateInputFile(fileId)
    const pdfBuffer = await this.downloadFile(fileId)

    // Extract pages using core service
    const extractedBuffer = await pdfCoreService.extractPages(pdfBuffer, pageNumbers)

    // Upload extracted PDF
    const result = await this.uploadFile(
      userId,
      'extracted-pages.pdf',
      extractedBuffer,
      'application/pdf'
    )

    this.log('PDF page extraction complete', { outputFileId: result.fileId })

    return result
  }

  /**
   * Add page numbers to PDF
   */
  async addPageNumbers(
    fileId: string,
    userId: string,
    options: any = {}
  ): Promise<{ fileId: string; url: string }> {
    this.log('Starting PDF page numbering', { fileId, options })

    await this.validateInputFile(fileId)
    const pdfBuffer = await this.downloadFile(fileId)

    // Add page numbers using security service
    const numberedBuffer = await pdfSecurityService.addPageNumbers(pdfBuffer, options)

    // Upload numbered PDF
    const result = await this.uploadFile(
      userId,
      'numbered.pdf',
      numberedBuffer,
      'application/pdf'
    )

    this.log('PDF page numbering complete', { outputFileId: result.fileId })

    return result
  }
}

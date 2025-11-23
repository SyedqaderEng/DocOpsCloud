/**
 * PDF Engine
 * Handles all 35+ PDF operations through the universal interface
 */

import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import fs from 'fs/promises'
import {
  BaseEngine,
  LoadedFile,
  PreviewData,
  ProcessResult,
  ProcessParams,
  PagePreview,
} from './base.engine'

// Disable worker for Node.js environment
const globalAny: any = global
globalAny.DOMParser = null

export class PDFEngine extends BaseEngine {
  // ============================================================================
  // 1. LOAD - Parse PDF and extract metadata
  // ============================================================================

  async load(filePath: string): Promise<LoadedFile> {
    const buffer = await fs.readFile(filePath)
    const pdfDoc = await PDFDocument.load(buffer)

    return {
      type: 'pdf',
      path: filePath,
      buffer,
      document: pdfDoc,
      metadata: {
        pageCount: pdfDoc.getPageCount(),
        title: pdfDoc.getTitle() || undefined,
        author: pdfDoc.getAuthor() || undefined,
        subject: pdfDoc.getSubject() || undefined,
        keywords: pdfDoc.getKeywords()?.split(',') || [],
        creator: pdfDoc.getCreator() || undefined,
        producer: pdfDoc.getProducer() || undefined,
        creationDate: pdfDoc.getCreationDate(),
        modificationDate: pdfDoc.getModificationDate(),
        size: buffer.length,
      },
    }
  }

  // ============================================================================
  // 2. PREVIEW - Generate thumbnails and page info
  // ============================================================================

  async preview(loadedFile: LoadedFile): Promise<PreviewData> {
    const pdfDoc = loadedFile.document as PDFDocument
    const pages = pdfDoc.getPages()

    // Generate page previews (first 5 pages for performance)
    const previewCount = Math.min(5, pages.length)
    const pagePreviews: PagePreview[] = []

    for (let i = 0; i < previewCount; i++) {
      const page = pages[i]
      const { width, height } = page.getSize()

      pagePreviews.push({
        number: i + 1,
        width,
        height,
        rotation: page.getRotation().angle,
        thumbnail: await this.generatePageThumbnail(loadedFile.buffer, i + 1),
      })
    }

    return {
      type: 'pdf',
      pageCount: pages.length,
      pages: pagePreviews,
      metadata: loadedFile.metadata,
    }
  }

  /**
   * Generate thumbnail for a specific page
   */
  private async generatePageThumbnail(
    pdfBuffer: Buffer,
    pageNumber: number
  ): Promise<string> {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer })
      const pdfDocument = await loadingTask.promise
      const page = await pdfDocument.getPage(pageNumber)

      const viewport = page.getViewport({ scale: 0.5 })
      const canvas = require('canvas').createCanvas(viewport.width, viewport.height)
      const context = canvas.getContext('2d')

      await page.render({
        canvasContext: context,
        viewport: viewport,
      } as any).promise

      return canvas.toDataURL('image/png')
    } catch (error) {
      console.warn(`Failed to generate thumbnail for page ${pageNumber}:`, error)
      return '' // Return empty string if thumbnail generation fails
    }
  }

  // ============================================================================
  // 3. PROCESS - Execute operations
  // ============================================================================

  async process(
    loadedFile: LoadedFile,
    operation: string,
    params: ProcessParams
  ): Promise<ProcessResult> {
    const supportedOps = [
      'split',
      'merge',
      'compress',
      'rotate',
      'watermark',
      'extract-text',
      'extract-pages',
      'extract-images',
      'get-metadata',
      'set-metadata',
      'add-page-numbers',
      'remove-pages',
      'reorder-pages',
      'convert-grayscale',
      'protect',
      'unlock',
    ]

    this.validateOperation(operation, supportedOps)

    switch (operation) {
      case 'split':
        return await this.split(loadedFile, params)
      case 'merge':
        return await this.merge(loadedFile, params)
      case 'compress':
        return await this.compress(loadedFile, params)
      case 'rotate':
        return await this.rotate(loadedFile, params)
      case 'watermark':
        return await this.watermark(loadedFile, params)
      case 'extract-text':
        return await this.extractText(loadedFile, params)
      case 'extract-pages':
        return await this.extractPages(loadedFile, params)
      case 'extract-images':
        return await this.extractImages(loadedFile, params)
      case 'get-metadata':
        return await this.getMetadata(loadedFile, params)
      case 'set-metadata':
        return await this.setMetadata(loadedFile, params)
      case 'add-page-numbers':
        return await this.addPageNumbers(loadedFile, params)
      case 'remove-pages':
        return await this.removePages(loadedFile, params)
      case 'reorder-pages':
        return await this.reorderPages(loadedFile, params)
      case 'convert-grayscale':
        return await this.convertGrayscale(loadedFile, params)
      default:
        throw new Error(`Operation ${operation} not implemented yet`)
    }
  }

  // ============================================================================
  // 4. EXPORT - Convert result to buffer
  // ============================================================================

  async export(processResult: ProcessResult, _format?: string): Promise<Buffer> {
    if (processResult.buffer) {
      return processResult.buffer
    }

    if (processResult.document) {
      const pdfDoc = processResult.document as PDFDocument
      const pdfBytes = await pdfDoc.save()
      return Buffer.from(pdfBytes)
    }

    throw new Error('No document or buffer in process result')
  }

  // ============================================================================
  // OPERATION IMPLEMENTATIONS
  // ============================================================================

  /**
   * Split PDF by page numbers
   */
  private async split(
    loadedFile: LoadedFile,
    params: ProcessParams
  ): Promise<ProcessResult> {
    this.validateParams(params, ['pages'], 'split')

    const sourcePdf = loadedFile.document as PDFDocument
    const newPdf = await PDFDocument.create()
    const pages = params.pages as number[]

    for (const pageNum of pages) {
      if (pageNum < 1 || pageNum > sourcePdf.getPageCount()) {
        throw new Error(`Invalid page number: ${pageNum}`)
      }
      const [page] = await newPdf.copyPages(sourcePdf, [pageNum - 1])
      newPdf.addPage(page)
    }

    return {
      success: true,
      document: newPdf,
      metadata: {
        originalPages: sourcePdf.getPageCount(),
        extractedPages: pages.length,
        pages,
      },
    }
  }

  /**
   * Merge multiple PDFs
   */
  private async merge(
    loadedFile: LoadedFile,
    params: ProcessParams
  ): Promise<ProcessResult> {
    this.validateParams(params, ['additionalFiles'], 'merge')

    const mergedPdf = await PDFDocument.create()
    const files = [loadedFile.buffer, ...(params.additionalFiles as Buffer[])]

    let totalPages = 0
    for (const fileBuffer of files) {
      const pdf = await PDFDocument.load(fileBuffer)
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      copiedPages.forEach((page) => mergedPdf.addPage(page))
      totalPages += pdf.getPageCount()
    }

    return {
      success: true,
      document: mergedPdf,
      metadata: {
        filesCount: files.length,
        totalPages,
      },
    }
  }

  /**
   * Compress PDF
   */
  private async compress(
    loadedFile: LoadedFile,
    params: ProcessParams
  ): Promise<ProcessResult> {
    const level = (params.level as string) || 'medium'
    const pdfDoc = loadedFile.document as PDFDocument

    // Compression settings based on level
    const compressionOptions = {
      low: { useObjectStreams: false },
      medium: { useObjectStreams: true, addDefaultPage: false },
      high: { useObjectStreams: true, addDefaultPage: false },
    }

    const options = compressionOptions[level as keyof typeof compressionOptions]
    const pdfBytes = await pdfDoc.save(options)

    const originalSize = loadedFile.buffer.length
    const compressedSize = pdfBytes.length
    const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(2)

    return {
      success: true,
      buffer: Buffer.from(pdfBytes),
      metadata: {
        originalSize,
        compressedSize,
        reduction: `${reduction}%`,
        level,
      },
    }
  }

  /**
   * Rotate PDF pages
   */
  private async rotate(
    loadedFile: LoadedFile,
    params: ProcessParams
  ): Promise<ProcessResult> {
    this.validateParams(params, ['degrees'], 'rotate')

    const pdfDoc = loadedFile.document as PDFDocument
    const pages = pdfDoc.getPages()
    const rotation = params.degrees as number
    const pageNumbers = (params.pages as number[]) || pages.map((_, i) => i + 1)

    for (const pageNum of pageNumbers) {
      const pageIndex = pageNum - 1
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex]
        const currentRotation = page.getRotation().angle
        page.setRotation(degrees(currentRotation + rotation))
      }
    }

    return {
      success: true,
      document: pdfDoc,
      metadata: {
        rotation,
        pagesRotated: pageNumbers.length,
      },
    }
  }

  /**
   * Add watermark to PDF
   */
  private async watermark(
    loadedFile: LoadedFile,
    params: ProcessParams
  ): Promise<ProcessResult> {
    this.validateParams(params, ['text'], 'watermark')

    const pdfDoc = loadedFile.document as PDFDocument
    const pages = pdfDoc.getPages()
    const text = params.text as string
    const position = (params.position as string) || 'center'
    const opacity = (params.opacity as number) || 0.5
    const fontSize = (params.fontSize as number) || 48

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    for (const page of pages) {
      const { width, height } = page.getSize()
      const textWidth = font.widthOfTextAtSize(text, fontSize)
      const textHeight = fontSize

      let x = 0,
        y = 0

      switch (position) {
        case 'center':
          x = (width - textWidth) / 2
          y = (height - textHeight) / 2
          break
        case 'top-left':
          x = 50
          y = height - 50
          break
        case 'top-right':
          x = width - textWidth - 50
          y = height - 50
          break
        case 'bottom-left':
          x = 50
          y = 50
          break
        case 'bottom-right':
          x = width - textWidth - 50
          y = 50
          break
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity,
      })
    }

    return {
      success: true,
      document: pdfDoc,
      metadata: {
        watermarkText: text,
        pagesWatermarked: pages.length,
      },
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractText(
    loadedFile: LoadedFile,
    params: ProcessParams
  ): Promise<ProcessResult> {
    const loadingTask = pdfjsLib.getDocument({ data: loadedFile.buffer })
    const pdfDocument = await loadingTask.promise

    const totalPages = pdfDocument.numPages
    const pages: Array<{ pageNumber: number; text: string }> = []
    let fullText = ''

    const pageNumbers = (params.pages as number[]) || Array.from(
      { length: totalPages },
      (_, i) => i + 1
    )

    for (const pageNum of pageNumbers) {
      if (pageNum < 1 || pageNum > totalPages) continue

      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()

      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim()

      pages.push({ pageNumber: pageNum, text: pageText })
      fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`
    }

    return {
      success: true,
      buffer: Buffer.from(fullText.trim(), 'utf-8'),
      metadata: {
        totalPages,
        extractedPages: pages.length,
        pages,
        text: fullText.trim(),
      },
    }
  }

  /**
   * Extract specific pages
   */
  private async extractPages(
    loadedFile: LoadedFile,
    params: ProcessParams
  ): Promise<ProcessResult> {
    this.validateParams(params, ['pages'], 'extract-pages')

    return await this.split(loadedFile, params)
  }

  /**
   * Extract images from PDF
   */
  private async extractImages(
    _loadedFile: LoadedFile,
    _params: ProcessParams
  ): Promise<ProcessResult> {
    // This is a placeholder - actual implementation would require pdf-parse or similar
    throw new Error('Image extraction not yet implemented')
  }

  /**
   * Get PDF metadata
   */
  private async getMetadata(
    loadedFile: LoadedFile,
    _params: ProcessParams
  ): Promise<ProcessResult> {
    return {
      success: true,
      buffer: Buffer.from(JSON.stringify(loadedFile.metadata, null, 2), 'utf-8'),
      metadata: loadedFile.metadata,
    }
  }

  /**
   * Set PDF metadata
   */
  private async setMetadata(
    loadedFile: LoadedFile,
    params: ProcessParams
  ): Promise<ProcessResult> {
    const pdfDoc = loadedFile.document as PDFDocument

    if (params.title) pdfDoc.setTitle(params.title as string)
    if (params.author) pdfDoc.setAuthor(params.author as string)
    if (params.subject) pdfDoc.setSubject(params.subject as string)
    if (params.keywords) {
      const keywords = Array.isArray(params.keywords)
        ? params.keywords
        : [params.keywords as string]
      pdfDoc.setKeywords(keywords)
    }
    if (params.creator) pdfDoc.setCreator(params.creator as string)
    if (params.producer) pdfDoc.setProducer(params.producer as string)

    pdfDoc.setModificationDate(new Date())

    return {
      success: true,
      document: pdfDoc,
      metadata: {
        updated: Object.keys(params),
      },
    }
  }

  /**
   * Add page numbers to PDF
   */
  private async addPageNumbers(
    loadedFile: LoadedFile,
    params: ProcessParams
  ): Promise<ProcessResult> {
    const pdfDoc = loadedFile.document as PDFDocument
    const pages = pdfDoc.getPages()

    const position = (params.position as string) || 'bottom-center'
    const format = (params.format as string) || 'page-X-of-Y'
    const fontSize = (params.fontSize as number) || 10
    const startPage = (params.startPage as number) || 1
    const endPage = (params.endPage as number) || pages.length
    const startNumber = (params.startNumber as number) || 1

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const totalPages = pages.length

    for (let i = startPage - 1; i < Math.min(endPage, totalPages); i++) {
      const page = pages[i]
      const { width, height } = page.getSize()
      const currentPageNumber = i - (startPage - 1) + startNumber

      let pageText = ''
      switch (format) {
        case 'number':
          pageText = `${currentPageNumber}`
          break
        case 'page-X':
          pageText = `Page ${currentPageNumber}`
          break
        case 'page-X-of-Y':
          pageText = `Page ${currentPageNumber} of ${totalPages}`
          break
      }

      const textWidth = font.widthOfTextAtSize(pageText, fontSize)
      const margin = 30
      let x = 0,
        y = 0

      switch (position) {
        case 'top-left':
          x = margin
          y = height - margin
          break
        case 'top-center':
          x = (width - textWidth) / 2
          y = height - margin
          break
        case 'top-right':
          x = width - textWidth - margin
          y = height - margin
          break
        case 'bottom-left':
          x = margin
          y = margin
          break
        case 'bottom-center':
          x = (width - textWidth) / 2
          y = margin
          break
        case 'bottom-right':
          x = width - textWidth - margin
          y = margin
          break
      }

      page.drawText(pageText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
    }

    return {
      success: true,
      document: pdfDoc,
      metadata: {
        pagesNumbered: endPage - startPage + 1,
      },
    }
  }

  /**
   * Remove pages from PDF
   */
  private async removePages(
    loadedFile: LoadedFile,
    params: ProcessParams
  ): Promise<ProcessResult> {
    this.validateParams(params, ['pages'], 'remove-pages')

    const sourcePdf = loadedFile.document as PDFDocument
    const newPdf = await PDFDocument.create()
    const pagesToRemove = params.pages as number[]
    const totalPages = sourcePdf.getPageCount()

    // Keep all pages EXCEPT the ones to remove
    for (let i = 1; i <= totalPages; i++) {
      if (!pagesToRemove.includes(i)) {
        const [page] = await newPdf.copyPages(sourcePdf, [i - 1])
        newPdf.addPage(page)
      }
    }

    return {
      success: true,
      document: newPdf,
      metadata: {
        originalPages: totalPages,
        removedPages: pagesToRemove.length,
        remainingPages: newPdf.getPageCount(),
      },
    }
  }

  /**
   * Reorder pages in PDF
   */
  private async reorderPages(
    loadedFile: LoadedFile,
    params: ProcessParams
  ): Promise<ProcessResult> {
    this.validateParams(params, ['order'], 'reorder-pages')

    const sourcePdf = loadedFile.document as PDFDocument
    const newPdf = await PDFDocument.create()
    const order = params.order as number[]

    for (const pageNum of order) {
      if (pageNum < 1 || pageNum > sourcePdf.getPageCount()) {
        throw new Error(`Invalid page number in order: ${pageNum}`)
      }
      const [page] = await newPdf.copyPages(sourcePdf, [pageNum - 1])
      newPdf.addPage(page)
    }

    return {
      success: true,
      document: newPdf,
      metadata: {
        originalOrder: Array.from(
          { length: sourcePdf.getPageCount() },
          (_, i) => i + 1
        ),
        newOrder: order,
      },
    }
  }

  /**
   * Convert PDF to grayscale
   */
  private async convertGrayscale(
    _loadedFile: LoadedFile,
    _params: ProcessParams
  ): Promise<ProcessResult> {
    // This requires more advanced PDF manipulation
    // For now, return the original document
    // Full implementation would modify the PDF color space
    throw new Error('Grayscale conversion not yet implemented')
  }
}

export const pdfEngine = new PDFEngine()

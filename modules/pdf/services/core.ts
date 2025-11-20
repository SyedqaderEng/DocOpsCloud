import { PDFDocument, degrees, rgb } from 'pdf-lib'
import fs from 'fs/promises'

/**
 * PDF Core Operations Service
 * Handles basic PDF manipulation operations
 */

export class PdfCoreService {
  /**
   * Merge multiple PDF files into a single PDF
   */
  async mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer> {
    if (pdfBuffers.length === 0) {
      throw new Error('No PDF files provided for merging')
    }

    const mergedPdf = await PDFDocument.create()

    for (const pdfBuffer of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBuffer)
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      copiedPages.forEach((page) => mergedPdf.addPage(page))
    }

    const mergedPdfBytes = await mergedPdf.save()
    return Buffer.from(mergedPdfBytes)
  }

  /**
   * Split PDF into separate files based on page ranges
   */
  async splitPdf(
    pdfBuffer: Buffer,
    pageRanges: Array<{ start: number; end: number }>
  ): Promise<Buffer[]> {
    const pdf = await PDFDocument.load(pdfBuffer)
    const totalPages = pdf.getPageCount()
    const results: Buffer[] = []

    for (const range of pageRanges) {
      if (range.start < 1 || range.end > totalPages) {
        throw new Error(`Invalid page range: ${range.start}-${range.end}`)
      }

      const newPdf = await PDFDocument.create()
      const pageIndices = Array.from(
        { length: range.end - range.start + 1 },
        (_, idx) => range.start + idx - 1
      )

      const copiedPages = await newPdf.copyPages(pdf, pageIndices)
      copiedPages.forEach((page) => newPdf.addPage(page))

      const pdfBytes = await newPdf.save()
      results.push(Buffer.from(pdfBytes))
    }

    return results
  }

  /**
   * Extract specific pages from PDF
   */
  async extractPages(pdfBuffer: Buffer, pageNumbers: number[]): Promise<Buffer> {
    const pdf = await PDFDocument.load(pdfBuffer)
    const totalPages = pdf.getPageCount()

    // Validate page numbers
    for (const pageNum of pageNumbers) {
      if (pageNum < 1 || pageNum > totalPages) {
        throw new Error(`Invalid page number: ${pageNum}`)
      }
    }

    const newPdf = await PDFDocument.create()
    const pageIndices = pageNumbers.map((num) => num - 1)
    const copiedPages = await newPdf.copyPages(pdf, pageIndices)
    copiedPages.forEach((page) => newPdf.addPage(page))

    const pdfBytes = await newPdf.save()
    return Buffer.from(pdfBytes)
  }

  /**
   * Remove specific pages from PDF
   */
  async removePages(pdfBuffer: Buffer, pageNumbers: number[]): Promise<Buffer> {
    const pdf = await PDFDocument.load(pdfBuffer)
    const totalPages = pdf.getPageCount()

    // Get all page numbers except the ones to remove
    const allPages = Array.from({ length: totalPages }, (_, i) => i + 1)
    const pagesToKeep = allPages.filter((num) => !pageNumbers.includes(num))

    if (pagesToKeep.length === 0) {
      throw new Error('Cannot remove all pages from PDF')
    }

    return this.extractPages(pdfBuffer, pagesToKeep)
  }

  /**
   * Rotate pages in PDF
   */
  async rotatePages(
    pdfBuffer: Buffer,
    pageNumbers: number[],
    rotation: 90 | 180 | 270
  ): Promise<Buffer> {
    const pdf = await PDFDocument.load(pdfBuffer)
    const totalPages = pdf.getPageCount()

    for (const pageNum of pageNumbers) {
      if (pageNum < 1 || pageNum > totalPages) {
        throw new Error(`Invalid page number: ${pageNum}`)
      }

      const page = pdf.getPage(pageNum - 1)
      page.setRotation(degrees(rotation))
    }

    const pdfBytes = await pdf.save()
    return Buffer.from(pdfBytes)
  }

  /**
   * Reorder pages in PDF
   */
  async reorderPages(pdfBuffer: Buffer, newOrder: number[]): Promise<Buffer> {
    const pdf = await PDFDocument.load(pdfBuffer)
    const totalPages = pdf.getPageCount()

    if (newOrder.length !== totalPages) {
      throw new Error('New order must include all pages')
    }

    // Validate new order
    const uniquePages = new Set(newOrder)
    if (uniquePages.size !== totalPages) {
      throw new Error('New order contains duplicate page numbers')
    }

    for (const pageNum of newOrder) {
      if (pageNum < 1 || pageNum > totalPages) {
        throw new Error(`Invalid page number: ${pageNum}`)
      }
    }

    // Create new PDF with reordered pages
    const newPdf = await PDFDocument.create()
    const pageIndices = newOrder.map((num) => num - 1)
    const copiedPages = await newPdf.copyPages(pdf, pageIndices)
    copiedPages.forEach((page) => newPdf.addPage(page))

    const pdfBytes = await newPdf.save()
    return Buffer.from(pdfBytes)
  }

  /**
   * Add blank pages to PDF
   */
  async addBlankPages(
    pdfBuffer: Buffer,
    positions: Array<{ after: number; count: number }>
  ): Promise<Buffer> {
    const pdf = await PDFDocument.load(pdfBuffer)

    // Sort positions in reverse order to maintain correct indices
    const sortedPositions = [...positions].sort((a, b) => b.after - a.after)

    for (const position of sortedPositions) {
      for (let i = 0; i < position.count; i++) {
        const blankPage = pdf.insertPage(position.after)
        // Standard US Letter size: 8.5 x 11 inches = 612 x 792 points
        blankPage.setSize(612, 792)
      }
    }

    const pdfBytes = await pdf.save()
    return Buffer.from(pdfBytes)
  }

  /**
   * Get PDF metadata
   */
  async getMetadata(pdfBuffer: Buffer): Promise<{
    pageCount: number
    title?: string
    author?: string
    subject?: string
    creator?: string
    producer?: string
    creationDate?: Date
    modificationDate?: Date
  }> {
    const pdf = await PDFDocument.load(pdfBuffer)

    return {
      pageCount: pdf.getPageCount(),
      title: pdf.getTitle(),
      author: pdf.getAuthor(),
      subject: pdf.getSubject(),
      creator: pdf.getCreator(),
      producer: pdf.getProducer(),
      creationDate: pdf.getCreationDate(),
      modificationDate: pdf.getModificationDate(),
    }
  }

  /**
   * Set PDF metadata
   */
  async setMetadata(
    pdfBuffer: Buffer,
    metadata: {
      title?: string
      author?: string
      subject?: string
      creator?: string
      keywords?: string[]
    }
  ): Promise<Buffer> {
    const pdf = await PDFDocument.load(pdfBuffer)

    if (metadata.title) pdf.setTitle(metadata.title)
    if (metadata.author) pdf.setAuthor(metadata.author)
    if (metadata.subject) pdf.setSubject(metadata.subject)
    if (metadata.creator) pdf.setCreator(metadata.creator)
    if (metadata.keywords) pdf.setKeywords(metadata.keywords)

    const pdfBytes = await pdf.save()
    return Buffer.from(pdfBytes)
  }
}

export const pdfCoreService = new PdfCoreService()

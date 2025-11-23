/**
 * PDF Core Processing Services
 * Uses pdf-lib for core PDF operations
 */

import { PDFDocument, degrees, rgb } from 'pdf-lib'

export class PdfCoreService {
  /**
   * Merge multiple PDFs into one
   */
  async mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer> {
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
   * Split PDF by page ranges
   */
  async splitPdf(
    pdfBuffer: Buffer,
    pageRanges: Array<{ start: number; end: number }>
  ): Promise<Buffer[]> {
    const sourcePdf = await PDFDocument.load(pdfBuffer)
    const results: Buffer[] = []

    for (const range of pageRanges) {
      const newPdf = await PDFDocument.create()

      for (let i = range.start - 1; i < range.end; i++) {
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [i])
        newPdf.addPage(copiedPage)
      }

      const pdfBytes = await newPdf.save()
      results.push(Buffer.from(pdfBytes))
    }

    return results
  }

  /**
   * Get PDF metadata
   */
  async getMetadata(pdfBuffer: Buffer): Promise<{
    pageCount: number
    title?: string
    author?: string
    subject?: string
    keywords?: string[]
    creator?: string
    producer?: string
    creationDate?: Date
    modificationDate?: Date
  }> {
    const pdfDoc = await PDFDocument.load(pdfBuffer)

    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      keywords: pdfDoc.getKeywords() ? pdfDoc.getKeywords()!.split(',') : [],
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate(),
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
      keywords?: string[]
      creator?: string
      producer?: string
    }
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer)

    if (metadata.title) pdfDoc.setTitle(metadata.title)
    if (metadata.author) pdfDoc.setAuthor(metadata.author)
    if (metadata.subject) pdfDoc.setSubject(metadata.subject)
    if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords)
    if (metadata.creator) pdfDoc.setCreator(metadata.creator)
    if (metadata.producer) pdfDoc.setProducer(metadata.producer)

    pdfDoc.setModificationDate(new Date())

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  }

  /**
   * Rotate PDF pages
   */
  async rotatePdf(
    pdfBuffer: Buffer,
    rotation: 90 | 180 | 270,
    pageNumbers?: number[]
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()

    // If no specific pages specified, rotate all pages
    const pagesToRotate = pageNumbers || pages.map((_, i) => i + 1)

    for (const pageNum of pagesToRotate) {
      const pageIndex = pageNum - 1
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex]
        const currentRotation = page.getRotation().angle
        page.setRotation(degrees(currentRotation + rotation))
      }
    }

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  }

  /**
   * Add page numbers to PDF
   */
  async addPageNumbers(
    pdfBuffer: Buffer,
    options: {
      position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
      format?: 'number' | 'page-X' | 'page-X-of-Y'
      fontSize?: number
      startPage?: number
      endPage?: number
      startNumber?: number
    } = {}
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()

    const {
      position = 'bottom-center',
      format = 'page-X-of-Y',
      fontSize = 10,
      startPage = 1,
      endPage = pages.length,
      startNumber = 1,
    } = options

    const totalPages = pages.length

    for (let i = startPage - 1; i < Math.min(endPage, totalPages); i++) {
      const page = pages[i]
      const { width, height } = page.getSize()
      const currentPageNumber = i - (startPage - 1) + startNumber

      // Generate page number text
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

      // Calculate position
      let x = 0, y = 0
      const textWidth = fontSize * pageText.length * 0.6 // Approximate text width
      const margin = 30

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
        color: rgb(0, 0, 0),
      })
    }

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  }
}

export const pdfCoreService = new PdfCoreService()

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
  }> {
    const pdfDoc = await PDFDocument.load(pdfBuffer)

    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
    }
  }
}

export const pdfCoreService = new PdfCoreService()

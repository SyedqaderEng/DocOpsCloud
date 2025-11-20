import { BaseProcessor } from './base-processor'
import { PDFDocument } from 'pdf-lib'

export class PdfProcessor extends BaseProcessor {
  /**
   * Merge multiple PDFs into one
   */
  async mergePdfs(fileIds: string[], userId: string): Promise<{ fileId: string; url: string }> {
    this.log('Starting PDF merge', { fileIds })

    // Create new PDF document
    const mergedPdf = await PDFDocument.create()

    // Download and process each PDF
    for (let i = 0; i < fileIds.length; i++) {
      this.log(`Processing PDF ${i + 1} of ${fileIds.length}`)

      await this.validateInputFile(fileIds[i])

      const pdfBuffer = await this.downloadFile(fileIds[i])
      const pdf = await PDFDocument.load(pdfBuffer)

      // Copy pages from this PDF to merged PDF
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      copiedPages.forEach((page) => mergedPdf.addPage(page))
    }

    // Save merged PDF
    const mergedPdfBytes = await mergedPdf.save()
    const mergedBuffer = Buffer.from(mergedPdfBytes)

    // Upload merged PDF
    const result = await this.uploadFile(
      userId,
      'merged.pdf',
      mergedBuffer,
      'application/pdf'
    )

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
    const pdf = await PDFDocument.load(pdfBuffer)

    const totalPages = pdf.getPageCount()
    const results: Array<{ fileId: string; url: string }> = []

    // If no page ranges specified, split each page into separate PDF
    if (!pageRanges || pageRanges.length === 0) {
      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create()
        const [copiedPage] = await newPdf.copyPages(pdf, [i])
        newPdf.addPage(copiedPage)

        const pdfBytes = await newPdf.save()
        const result = await this.uploadFile(
          userId,
          `page-${i + 1}.pdf`,
          Buffer.from(pdfBytes),
          'application/pdf'
        )

        results.push(result)
      }
    } else {
      // Split by specified ranges
      for (let i = 0; i < pageRanges.length; i++) {
        const range = pageRanges[i]
        const newPdf = await PDFDocument.create()

        const pageIndices = Array.from(
          { length: range.end - range.start + 1 },
          (_, idx) => range.start + idx - 1
        )

        const copiedPages = await newPdf.copyPages(pdf, pageIndices)
        copiedPages.forEach((page) => newPdf.addPage(page))

        const pdfBytes = await newPdf.save()
        const result = await this.uploadFile(
          userId,
          `pages-${range.start}-${range.end}.pdf`,
          Buffer.from(pdfBytes),
          'application/pdf'
        )

        results.push(result)
      }
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
  ): Promise<{ fileId: string; url: string }> {
    this.log('Starting PDF compression', { fileId, quality })

    await this.validateInputFile(fileId)

    const pdfBuffer = await this.downloadFile(fileId)
    const pdf = await PDFDocument.load(pdfBuffer)

    // TODO: Implement actual compression logic
    // For now, just re-save the PDF
    // In production, you would:
    // 1. Compress images within the PDF
    // 2. Remove unused objects
    // 3. Optimize fonts
    // 4. Remove metadata

    const compressedPdfBytes = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    })

    const result = await this.uploadFile(
      userId,
      'compressed.pdf',
      Buffer.from(compressedPdfBytes),
      'application/pdf'
    )

    this.log('PDF compression complete', { outputFileId: result.fileId })

    return result
  }
}

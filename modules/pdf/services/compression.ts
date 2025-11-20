/**
 * PDF Compression Service  
 */

import { PDFDocument } from 'pdf-lib'

export class PdfCompressionService {
  async compressPdf(
    pdfBuffer: Buffer,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    })

    const pdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    })

    return Buffer.from(pdfBytes)
  }
}

export const pdfCompressionService = new PdfCompressionService()

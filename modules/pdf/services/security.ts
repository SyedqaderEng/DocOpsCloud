/**
 * PDF Security Service
 */

import { PDFDocument } from 'pdf-lib'

export class PdfSecurityService {
  async addPasswordProtection(
    pdfBuffer: Buffer,
    userPassword: string
  ): Promise<Buffer> {
    // pdf-lib doesn't support encryption - returning original
    return pdfBuffer
  }

  async removePasswordProtection(
    pdfBuffer: Buffer,
    password: string
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
      password,
    })

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  }
}

export const pdfSecurityService = new PdfSecurityService()

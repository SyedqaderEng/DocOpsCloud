import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import * as crypto from 'crypto'

/**
 * PDF Security Service
 * Handles password protection, encryption, and digital signatures
 */

export class PdfSecurityService {
  /**
   * Add password protection to PDF
   * Note: pdf-lib has limited encryption support
   * For production, consider using additional libraries like node-qpdf
   */
  async addPassword(
    pdfBuffer: Buffer,
    userPassword: string,
    ownerPassword?: string
  ): Promise<Buffer> {
    const pdf = await PDFDocument.load(pdfBuffer)

    // pdf-lib doesn't directly support encryption
    // In production, you would use a library like qpdf or pdftk
    // For now, we'll save with metadata indicating password protection needed

    pdf.setSubject(`Password Protected - User: ${userPassword.substring(0, 3)}***`)

    const pdfBytes = await pdf.save()
    return Buffer.from(pdfBytes)

    // TODO: Implement actual encryption using qpdf or similar
    // Example workflow:
    // 1. Save PDF to temp file
    // 2. Use qpdf CLI to encrypt: qpdf --encrypt user owner 128 -- input.pdf output.pdf
    // 3. Read encrypted file back
    // 4. Return encrypted buffer
  }

  /**
   * Remove password from PDF
   */
  async removePassword(pdfBuffer: Buffer, password: string): Promise<Buffer> {
    // In production, use qpdf or pdftk to decrypt
    // For now, assume PDF is not encrypted or already decrypted

    try {
      const pdf = await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: true,
      })

      const pdfBytes = await pdf.save()
      return Buffer.from(pdfBytes)
    } catch (error) {
      throw new Error('Failed to remove password. Incorrect password or file is corrupted.')
    }

    // TODO: Implement actual decryption using qpdf
    // qpdf --password=PASSWORD --decrypt input.pdf output.pdf
  }

  /**
   * Add watermark to PDF
   */
  async addWatermark(
    pdfBuffer: Buffer,
    watermarkText: string,
    options: {
      opacity?: number
      fontSize?: number
      color?: { r: number; g: number; b: number }
      rotation?: number
      position?: 'center' | 'diagonal'
    } = {}
  ): Promise<Buffer> {
    const {
      opacity = 0.3,
      fontSize = 48,
      color = { r: 0.5, g: 0.5, b: 0.5 },
      rotation = 45,
      position = 'diagonal',
    } = options

    const pdf = await PDFDocument.load(pdfBuffer)
    const pages = pdf.getPages()
    const font = await pdf.embedFont(StandardFonts.HelveticaBold)

    for (const page of pages) {
      const { width, height } = page.getSize()
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize)
      const textHeight = fontSize

      let x: number
      let y: number
      let rotate: number

      if (position === 'center') {
        x = (width - textWidth) / 2
        y = (height - textHeight) / 2
        rotate = 0
      } else {
        // Diagonal position
        x = width / 2
        y = height / 2
        rotate = rotation
      }

      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: { angle: rotate, type: 'degrees' },
      })
    }

    const pdfBytes = await pdf.save()
    return Buffer.from(pdfBytes)
  }

  /**
   * Add header to PDF pages
   */
  async addHeader(
    pdfBuffer: Buffer,
    headerText: string,
    options: {
      fontSize?: number
      position?: 'left' | 'center' | 'right'
      marginTop?: number
    } = {}
  ): Promise<Buffer> {
    const { fontSize = 12, position = 'center', marginTop = 20 } = options

    const pdf = await PDFDocument.load(pdfBuffer)
    const pages = pdf.getPages()
    const font = await pdf.embedFont(StandardFonts.Helvetica)

    for (const page of pages) {
      const { width, height } = page.getSize()
      const textWidth = font.widthOfTextAtSize(headerText, fontSize)

      let x: number
      switch (position) {
        case 'left':
          x = 50
          break
        case 'right':
          x = width - textWidth - 50
          break
        case 'center':
        default:
          x = (width - textWidth) / 2
      }

      page.drawText(headerText, {
        x,
        y: height - marginTop,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
    }

    const pdfBytes = await pdf.save()
    return Buffer.from(pdfBytes)
  }

  /**
   * Add footer to PDF pages
   */
  async addFooter(
    pdfBuffer: Buffer,
    footerText: string,
    options: {
      fontSize?: number
      position?: 'left' | 'center' | 'right'
      marginBottom?: number
    } = {}
  ): Promise<Buffer> {
    const { fontSize = 12, position = 'center', marginBottom = 20 } = options

    const pdf = await PDFDocument.load(pdfBuffer)
    const pages = pdf.getPages()
    const font = await pdf.embedFont(StandardFonts.Helvetica)

    for (const page of pages) {
      const { width } = page.getSize()
      const textWidth = font.widthOfTextAtSize(footerText, fontSize)

      let x: number
      switch (position) {
        case 'left':
          x = 50
          break
        case 'right':
          x = width - textWidth - 50
          break
        case 'center':
        default:
          x = (width - textWidth) / 2
      }

      page.drawText(footerText, {
        x,
        y: marginBottom,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
    }

    const pdfBytes = await pdf.save()
    return Buffer.from(pdfBytes)
  }

  /**
   * Add page numbers to PDF
   */
  async addPageNumbers(
    pdfBuffer: Buffer,
    options: {
      format?: 'number' | 'pageOfTotal'
      position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center'
      fontSize?: number
      startPage?: number
      prefix?: string
      suffix?: string
    } = {}
  ): Promise<Buffer> {
    const {
      format = 'number',
      position = 'bottom-center',
      fontSize = 12,
      startPage = 1,
      prefix = '',
      suffix = '',
    } = options

    const pdf = await PDFDocument.load(pdfBuffer)
    const pages = pdf.getPages()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const totalPages = pages.length

    pages.forEach((page, index) => {
      const pageNumber = startPage + index
      let pageText: string

      if (format === 'pageOfTotal') {
        pageText = `${prefix}${pageNumber} of ${totalPages}${suffix}`
      } else {
        pageText = `${prefix}${pageNumber}${suffix}`
      }

      const { width, height } = page.getSize()
      const textWidth = font.widthOfTextAtSize(pageText, fontSize)

      let x: number
      let y: number

      switch (position) {
        case 'bottom-left':
          x = 50
          y = 30
          break
        case 'bottom-right':
          x = width - textWidth - 50
          y = 30
          break
        case 'top-center':
          x = (width - textWidth) / 2
          y = height - 30
          break
        case 'bottom-center':
        default:
          x = (width - textWidth) / 2
          y = 30
      }

      page.drawText(pageText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
    })

    const pdfBytes = await pdf.save()
    return Buffer.from(pdfBytes)
  }

  /**
   * Create digital signature placeholder
   * Note: Actual signing requires private key infrastructure
   */
  async addSignaturePlaceholder(
    pdfBuffer: Buffer,
    options: {
      pageNumber?: number
      x?: number
      y?: number
      width?: number
      height?: number
      signerName?: string
    } = {}
  ): Promise<Buffer> {
    const {
      pageNumber = 1,
      x = 50,
      y = 50,
      width = 200,
      height = 100,
      signerName = 'Signature',
    } = options

    const pdf = await PDFDocument.load(pdfBuffer)
    const pages = pdf.getPages()

    if (pageNumber < 1 || pageNumber > pages.length) {
      throw new Error(`Invalid page number: ${pageNumber}`)
    }

    const page = pages[pageNumber - 1]
    const font = await pdf.embedFont(StandardFonts.Helvetica)

    // Draw signature box
    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    })

    // Add signer name
    page.drawText(`Signed by: ${signerName}`, {
      x: x + 10,
      y: y + height - 25,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    })

    // Add date placeholder
    const date = new Date().toLocaleDateString()
    page.drawText(`Date: ${date}`, {
      x: x + 10,
      y: y + height - 45,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    })

    const pdfBytes = await pdf.save()
    return Buffer.from(pdfBytes)
  }
}

export const pdfSecurityService = new PdfSecurityService()

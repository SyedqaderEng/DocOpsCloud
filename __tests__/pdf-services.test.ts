import { describe, it, expect, beforeAll } from '@jest/globals'
import { PDFDocument, rgb } from 'pdf-lib'
import { pdfCoreService } from '@/modules/pdf/services/core'
import { pdfSecurityService } from '@/modules/pdf/services/security'
import { pdfCompressionService } from '@/modules/pdf/services/compression'
import { pdfConversionService } from '@/modules/pdf/services/conversion'
import fs from 'fs/promises'
import path from 'path'

describe('PDF Core Service', () => {
  let samplePdf1: Buffer
  let samplePdf2: Buffer

  beforeAll(async () => {
    // Create sample PDFs for testing
    const pdf1 = await PDFDocument.create()
    pdf1.addPage([600, 400])
    const page1 = pdf1.getPages()[0]
    page1.drawText('Test PDF 1', { x: 50, y: 350, size: 30, color: rgb(0, 0, 0) })
    samplePdf1 = Buffer.from(await pdf1.save())

    const pdf2 = await PDFDocument.create()
    pdf2.addPage([600, 400])
    const page2 = pdf2.getPages()[0]
    page2.drawText('Test PDF 2', { x: 50, y: 350, size: 30, color: rgb(0, 0, 0) })
    samplePdf2 = Buffer.from(await pdf2.save())
  })

  it('should merge two PDFs', async () => {
    const merged = await pdfCoreService.mergePdfs([samplePdf1, samplePdf2])
    expect(merged).toBeInstanceOf(Buffer)
    expect(merged.length).toBeGreaterThan(0)

    // Verify merged PDF has 2 pages
    const mergedDoc = await PDFDocument.load(merged)
    expect(mergedDoc.getPageCount()).toBe(2)
  })

  it('should split PDF into ranges', async () => {
    const merged = await pdfCoreService.mergePdfs([samplePdf1, samplePdf2])
    const splits = await pdfCoreService.splitPdf(merged, [
      { start: 1, end: 1 },
      { start: 2, end: 2 },
    ])

    expect(splits).toHaveLength(2)
    expect(splits[0]).toBeInstanceOf(Buffer)
    expect(splits[1]).toBeInstanceOf(Buffer)

    // Verify each split has 1 page
    const split1 = await PDFDocument.load(splits[0])
    const split2 = await PDFDocument.load(splits[1])
    expect(split1.getPageCount()).toBe(1)
    expect(split2.getPageCount()).toBe(1)
  })

  it('should extract specific pages', async () => {
    const merged = await pdfCoreService.mergePdfs([samplePdf1, samplePdf2])
    const extracted = await pdfCoreService.extractPages(merged, [1])

    expect(extracted).toBeInstanceOf(Buffer)

    const extractedDoc = await PDFDocument.load(extracted)
    expect(extractedDoc.getPageCount()).toBe(1)
  })

  it('should rotate pages', async () => {
    const rotated = await pdfCoreService.rotatePages(samplePdf1, [1], 90)
    expect(rotated).toBeInstanceOf(Buffer)

    const rotatedDoc = await PDFDocument.load(rotated)
    const page = rotatedDoc.getPages()[0]
    expect(page.getRotation().angle).toBe(90)
  })

  it('should get PDF metadata', async () => {
    const metadata = await pdfCoreService.getMetadata(samplePdf1)

    expect(metadata).toHaveProperty('pageCount')
    expect(metadata.pageCount).toBe(1)
    expect(metadata).toHaveProperty('creator')
  })

  it('should set PDF metadata', async () => {
    const updated = await pdfCoreService.setMetadata(samplePdf1, {
      title: 'Test Document',
      author: 'Test Author',
      subject: 'Testing',
    })

    expect(updated).toBeInstanceOf(Buffer)

    const metadata = await pdfCoreService.getMetadata(updated)
    expect(metadata.title).toBe('Test Document')
    expect(metadata.author).toBe('Test Author')
    expect(metadata.subject).toBe('Testing')
  })

  it('should reorder pages', async () => {
    const merged = await pdfCoreService.mergePdfs([samplePdf1, samplePdf2])
    const reordered = await pdfCoreService.reorderPages(merged, [2, 1])

    expect(reordered).toBeInstanceOf(Buffer)

    const reorderedDoc = await PDFDocument.load(reordered)
    expect(reorderedDoc.getPageCount()).toBe(2)
  })
})

describe('PDF Security Service', () => {
  let samplePdf: Buffer

  beforeAll(async () => {
    const pdf = await PDFDocument.create()
    pdf.addPage([600, 400])
    samplePdf = Buffer.from(await pdf.save())
  })

  it('should add watermark to PDF', async () => {
    const watermarked = await pdfSecurityService.addWatermark(samplePdf, 'CONFIDENTIAL', {
      opacity: 0.3,
      fontSize: 48,
      rotation: 45,
    })

    expect(watermarked).toBeInstanceOf(Buffer)
    expect(watermarked.length).toBeGreaterThan(samplePdf.length)
  })

  it('should add page numbers', async () => {
    const numbered = await pdfSecurityService.addPageNumbers(samplePdf, {
      format: 'number',
      position: 'bottom-center',
      fontSize: 12,
    })

    expect(numbered).toBeInstanceOf(Buffer)
    expect(numbered.length).toBeGreaterThan(0)
  })

  it('should add header', async () => {
    const withHeader = await pdfSecurityService.addHeader(samplePdf, 'Document Header', {
      fontSize: 14,
      position: 'center',
    })

    expect(withHeader).toBeInstanceOf(Buffer)
    expect(withHeader.length).toBeGreaterThan(0)
  })

  it('should add footer', async () => {
    const withFooter = await pdfSecurityService.addFooter(samplePdf, 'Document Footer', {
      fontSize: 10,
      position: 'right',
    })

    expect(withFooter).toBeInstanceOf(Buffer)
    expect(withFooter.length).toBeGreaterThan(0)
  })
})

describe('PDF Compression Service', () => {
  let samplePdf: Buffer

  beforeAll(async () => {
    const pdf = await PDFDocument.create()
    pdf.addPage([600, 400])
    pdf.setTitle('Test Document with Metadata')
    pdf.setAuthor('Test Author')
    pdf.setSubject('Testing Compression')
    pdf.setKeywords(['test', 'compression', 'pdf'])
    samplePdf = Buffer.from(await pdf.save())
  })

  it('should compress PDF', async () => {
    const compressed = await pdfCompressionService.compressPdf(samplePdf, 'medium')

    expect(compressed).toBeInstanceOf(Buffer)
    expect(compressed.length).toBeGreaterThan(0)
    // Note: pdf-lib compression may not always reduce size significantly
  })

  it('should remove metadata', async () => {
    const noMetadata = await pdfCompressionService.removeMetadata(samplePdf)

    expect(noMetadata).toBeInstanceOf(Buffer)

    const doc = await PDFDocument.load(noMetadata)
    expect(doc.getTitle()).toBe('')
    expect(doc.getAuthor()).toBe('')
  })

  it('should get file size', async () => {
    const sizeInfo = await pdfCompressionService.getFileSize(samplePdf)

    expect(sizeInfo).toHaveProperty('bytes')
    expect(sizeInfo).toHaveProperty('kilobytes')
    expect(sizeInfo).toHaveProperty('megabytes')
    expect(sizeInfo).toHaveProperty('formatted')
    expect(sizeInfo.bytes).toBe(samplePdf.length)
  })

  it('should estimate compression savings', async () => {
    const estimate = await pdfCompressionService.estimateCompressionSavings(samplePdf, 'medium')

    expect(estimate).toHaveProperty('originalSize')
    expect(estimate).toHaveProperty('estimatedSize')
    expect(estimate).toHaveProperty('savingsPercent')
    expect(estimate.originalSize).toBe(samplePdf.length)
    expect(estimate.savingsPercent).toBe(50) // Medium = 50% savings
  })
})

describe('PDF Conversion Service', () => {
  it('should convert images to PDF', async () => {
    // Create a simple test image buffer (1x1 PNG)
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )

    const pdf = await pdfConversionService.imagesToPdf([pngBuffer])

    expect(pdf).toBeInstanceOf(Buffer)

    const doc = await PDFDocument.load(pdf)
    expect(doc.getPageCount()).toBe(1)
  })

  it('should detect PNG image type', async () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    // @ts-ignore - accessing private method for testing
    const type = pdfConversionService['detectImageType'](pngBuffer)
    expect(type).toBe('png')
  })

  it('should detect JPEG image type', async () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff])
    // @ts-ignore - accessing private method for testing
    const type = pdfConversionService['detectImageType'](jpegBuffer)
    expect(type).toBe('jpeg')
  })
})

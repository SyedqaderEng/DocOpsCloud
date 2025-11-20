#!/usr/bin/env ts-node

/**
 * Manual PDF Services Test Script
 *
 * This script tests all PDF operations without requiring
 * database, Redis, or API setup.
 *
 * Usage: npx tsx scripts/test-pdf-services.ts
 */

import { PDFDocument, rgb } from 'pdf-lib'
import { pdfCoreService } from '../modules/pdf/services/core'
import { pdfSecurityService } from '../modules/pdf/services/security'
import { pdfCompressionService } from '../modules/pdf/services/compression'
import { pdfConversionService } from '../modules/pdf/services/conversion'
import fs from 'fs/promises'
import path from 'path'

const OUTPUT_DIR = path.join(process.cwd(), 'test-output')

async function createSamplePdf(text: string, pageCount: number = 1): Promise<Buffer> {
  const pdf = await PDFDocument.create()

  for (let i = 0; i < pageCount; i++) {
    const page = pdf.addPage([600, 400])
    page.drawText(`${text} - Page ${i + 1}`, {
      x: 50,
      y: 350,
      size: 24,
      color: rgb(0, 0, 0),
    })

    // Add some content to make it more realistic
    page.drawText('This is a test PDF document created for testing purposes.', {
      x: 50,
      y: 300,
      size: 12,
      color: rgb(0.3, 0.3, 0.3),
    })

    page.drawText(`Page number: ${i + 1} of ${pageCount}`, {
      x: 50,
      y: 50,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  return Buffer.from(await pdf.save())
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function main() {
  console.log('\n📄 PDF Services Manual Test')
  console.log('========================\n')

  try {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    console.log(`✅ Created output directory: ${OUTPUT_DIR}\n`)

    // Test 1: Create sample PDFs
    console.log('1️⃣  Creating sample PDFs...')
    const pdf1 = await createSamplePdf('Sample Document 1', 2)
    const pdf2 = await createSamplePdf('Sample Document 2', 3)

    await fs.writeFile(path.join(OUTPUT_DIR, 'sample-1.pdf'), pdf1)
    await fs.writeFile(path.join(OUTPUT_DIR, 'sample-2.pdf'), pdf2)

    console.log(`   ✅ Created sample-1.pdf (${formatBytes(pdf1.length)}, 2 pages)`)
    console.log(`   ✅ Created sample-2.pdf (${formatBytes(pdf2.length)}, 3 pages)\n`)

    // Test 2: Merge PDFs
    console.log('2️⃣  Testing PDF merge...')
    const merged = await pdfCoreService.mergePdfs([pdf1, pdf2])
    await fs.writeFile(path.join(OUTPUT_DIR, 'merged.pdf'), merged)

    const mergedDoc = await PDFDocument.load(merged)
    console.log(`   ✅ Merged PDFs (${formatBytes(merged.length)}, ${mergedDoc.getPageCount()} pages)\n`)

    // Test 3: Split PDF
    console.log('3️⃣  Testing PDF split...')
    const splits = await pdfCoreService.splitPdf(merged, [
      { start: 1, end: 2 },
      { start: 3, end: 5 },
    ])

    for (let i = 0; i < splits.length; i++) {
      await fs.writeFile(path.join(OUTPUT_DIR, `split-${i + 1}.pdf`), splits[i])
      const splitDoc = await PDFDocument.load(splits[i])
      console.log(`   ✅ Created split-${i + 1}.pdf (${formatBytes(splits[i].length)}, ${splitDoc.getPageCount()} pages)`)
    }
    console.log()

    // Test 4: Extract pages
    console.log('4️⃣  Testing page extraction...')
    const extracted = await pdfCoreService.extractPages(merged, [1, 3, 5])
    await fs.writeFile(path.join(OUTPUT_DIR, 'extracted.pdf'), extracted)

    const extractedDoc = await PDFDocument.load(extracted)
    console.log(`   ✅ Extracted pages 1, 3, 5 (${formatBytes(extracted.length)}, ${extractedDoc.getPageCount()} pages)\n`)

    // Test 5: Rotate pages
    console.log('5️⃣  Testing page rotation...')
    const rotated = await pdfCoreService.rotatePages(pdf1, [1, 2], 90)
    await fs.writeFile(path.join(OUTPUT_DIR, 'rotated.pdf'), rotated)

    const rotatedDoc = await PDFDocument.load(rotated)
    const rotation = rotatedDoc.getPages()[0].getRotation().angle
    console.log(`   ✅ Rotated pages by 90° (${formatBytes(rotated.length)}, rotation: ${rotation}°)\n`)

    // Test 6: Add watermark
    console.log('6️⃣  Testing watermark...')
    const watermarked = await pdfSecurityService.addWatermark(pdf1, 'CONFIDENTIAL', {
      opacity: 0.3,
      fontSize: 48,
      rotation: 45,
      position: 'diagonal',
    })
    await fs.writeFile(path.join(OUTPUT_DIR, 'watermarked.pdf'), watermarked)
    console.log(`   ✅ Added watermark (${formatBytes(watermarked.length)})\n`)

    // Test 7: Add page numbers
    console.log('7️⃣  Testing page numbers...')
    const numbered = await pdfSecurityService.addPageNumbers(merged, {
      format: 'pageOfTotal',
      position: 'bottom-center',
      fontSize: 12,
    })
    await fs.writeFile(path.join(OUTPUT_DIR, 'numbered.pdf'), numbered)
    console.log(`   ✅ Added page numbers (${formatBytes(numbered.length)})\n`)

    // Test 8: Compress PDF
    console.log('8️⃣  Testing compression...')
    const originalSize = pdf1.length
    const compressed = await pdfCompressionService.compressPdf(pdf1, 'medium')
    const compressedSize = compressed.length
    const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(2)

    await fs.writeFile(path.join(OUTPUT_DIR, 'compressed.pdf'), compressed)
    console.log(`   ✅ Compressed PDF:`)
    console.log(`      Original:   ${formatBytes(originalSize)}`)
    console.log(`      Compressed: ${formatBytes(compressedSize)}`)
    console.log(`      Reduction:  ${reduction}%\n`)

    // Test 9: Get metadata
    console.log('9️⃣  Testing metadata operations...')
    const metadata = await pdfCoreService.getMetadata(pdf1)
    console.log(`   ✅ Retrieved metadata:`)
    console.log(`      Pages:   ${metadata.pageCount}`)
    console.log(`      Creator: ${metadata.creator || 'N/A'}`)
    console.log(`      Producer: ${metadata.producer || 'N/A'}`)

    // Set metadata
    const withMetadata = await pdfCoreService.setMetadata(pdf1, {
      title: 'Test Document',
      author: 'DocOpsCloud Test',
      subject: 'PDF Testing',
      keywords: ['test', 'pdf', 'automation'],
    })
    await fs.writeFile(path.join(OUTPUT_DIR, 'with-metadata.pdf'), withMetadata)

    const newMetadata = await pdfCoreService.getMetadata(withMetadata)
    console.log(`   ✅ Set metadata:`)
    console.log(`      Title:   ${newMetadata.title}`)
    console.log(`      Author:  ${newMetadata.author}`)
    console.log(`      Subject: ${newMetadata.subject}\n`)

    // Test 10: Image to PDF
    console.log('🔟 Testing image to PDF conversion...')
    // Create a simple test image buffer (1x1 PNG)
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )

    const pdfFromImage = await pdfConversionService.imagesToPdf([pngBuffer, pngBuffer])
    await fs.writeFile(path.join(OUTPUT_DIR, 'from-images.pdf'), pdfFromImage)

    const imageDoc = await PDFDocument.load(pdfFromImage)
    console.log(`   ✅ Created PDF from images (${formatBytes(pdfFromImage.length)}, ${imageDoc.getPageCount()} pages)\n`)

    // Test 11: Add header and footer
    console.log('1️⃣1️⃣  Testing headers and footers...')
    const withHeader = await pdfSecurityService.addHeader(pdf1, 'Document Header', {
      fontSize: 14,
      position: 'center',
    })

    const withBoth = await pdfSecurityService.addFooter(withHeader, 'Page Footer', {
      fontSize: 10,
      position: 'right',
    })
    await fs.writeFile(path.join(OUTPUT_DIR, 'with-header-footer.pdf'), withBoth)
    console.log(`   ✅ Added header and footer (${formatBytes(withBoth.length)})\n`)

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ All tests completed successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('📂 Results saved to:', OUTPUT_DIR)
    console.log('\nGenerated files:')
    const files = await fs.readdir(OUTPUT_DIR)
    for (const file of files.sort()) {
      const stats = await fs.stat(path.join(OUTPUT_DIR, file))
      console.log(`   - ${file.padEnd(30)} ${formatBytes(stats.size)}`)
    }

    console.log('\n💡 Open any of these files to verify the operations worked correctly.\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests
main()

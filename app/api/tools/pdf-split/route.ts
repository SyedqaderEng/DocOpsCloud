import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { PDFDocument } from 'pdf-lib'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/tools/pdf-split
 * Split PDF file into multiple PDFs based on split points
 */
export async function POST(req: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)

    // 2. PARSE FORM DATA
    const formData = await req.formData()
    const file = formData.get('file') as File
    const splitPointsJson = formData.get('splitPoints') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    let splitPoints: number[] = []
    if (splitPointsJson) {
      splitPoints = JSON.parse(splitPointsJson)
    }

    // 3. LOAD PDF
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const totalPages = pdfDoc.getPageCount()

    // 4. DETERMINE PAGE RANGES FOR EACH SPLIT
    // Sort split points
    const sortedSplitPoints = [...new Set(splitPoints)].sort((a, b) => a - b)

    // Create ranges
    const ranges: { start: number; end: number }[] = []
    let currentStart = 1

    for (const splitPoint of sortedSplitPoints) {
      if (splitPoint >= currentStart && splitPoint < totalPages) {
        ranges.push({ start: currentStart, end: splitPoint })
        currentStart = splitPoint + 1
      }
    }

    // Add final range
    if (currentStart <= totalPages) {
      ranges.push({ start: currentStart, end: totalPages })
    }

    // If no valid ranges, treat as single file
    if (ranges.length === 0) {
      ranges.push({ start: 1, end: totalPages })
    }

    // 5. CREATE SPLIT PDFs
    const outputDir = join(process.cwd(), 'temp', 'output', decodedToken.uid)
    await mkdir(outputDir, { recursive: true })

    const downloadUrls: string[] = []
    const batchId = uuidv4()

    for (let i = 0; i < ranges.length; i++) {
      const { start, end } = ranges[i]
      const newPdf = await PDFDocument.create()

      // Copy pages for this range
      const pagesToCopy = []
      for (let pageNum = start; pageNum <= end; pageNum++) {
        pagesToCopy.push(pageNum - 1) // pdf-lib uses 0-based indexing
      }

      const copiedPages = await newPdf.copyPages(pdfDoc, pagesToCopy)
      copiedPages.forEach(page => newPdf.addPage(page))

      // Save this split PDF
      const pdfBytes = await newPdf.save()
      const fileName = `split_${batchId}_part${i + 1}_pages${start}-${end}.pdf`
      const filePath = join(outputDir, fileName)
      await writeFile(filePath, pdfBytes)

      downloadUrls.push(`/api/files/${decodedToken.uid}/${fileName}`)
    }

    // 6. RETURN DOWNLOAD URLs
    return NextResponse.json({
      success: true,
      downloadUrls,
      splitCount: ranges.length,
      ranges,
    })
  } catch (error: any) {
    console.error('PDF split error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to split PDF' },
      { status: 500 }
    )
  }
}

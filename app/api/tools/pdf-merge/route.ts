import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { PDFDocument } from 'pdf-lib'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/tools/pdf-merge
 * Merge multiple PDF files with specific page selection
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
    const files = formData.getAll('files') as File[]
    const selectedPagesJson = formData.get('selectedPages') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    let selectedPages: { fileIndex: number; pageNumber: number }[] = []
    if (selectedPagesJson) {
      selectedPages = JSON.parse(selectedPagesJson)
    }

    // 3. CREATE MERGED PDF
    const mergedPdf = await PDFDocument.create()

    // Load all PDF files
    const pdfDocs = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer()
        return PDFDocument.load(arrayBuffer)
      })
    )

    // If no specific pages selected, merge all pages from all files
    if (selectedPages.length === 0) {
      for (let fileIndex = 0; fileIndex < pdfDocs.length; fileIndex++) {
        const pdf = pdfDocs[fileIndex]
        const pageCount = pdf.getPageCount()

        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          selectedPages.push({ fileIndex, pageNumber: pageNum })
        }
      }
    }

    // Copy selected pages in order
    for (const { fileIndex, pageNumber } of selectedPages) {
      const sourcePdf = pdfDocs[fileIndex]
      const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [pageNumber - 1])
      mergedPdf.addPage(copiedPage)
    }

    // 4. SAVE MERGED PDF
    const pdfBytes = await mergedPdf.save()

    // Create output directory
    const outputDir = join(process.cwd(), 'temp', 'output', decodedToken.uid)
    await mkdir(outputDir, { recursive: true })

    const fileName = `merged_${uuidv4()}.pdf`
    const filePath = join(outputDir, fileName)
    await writeFile(filePath, pdfBytes)

    // 5. RETURN DOWNLOAD URL
    const downloadUrl = `/api/processed/${decodedToken.uid}/${fileName}`

    return NextResponse.json({
      success: true,
      downloadUrl,
      pageCount: mergedPdf.getPageCount(),
      fileSize: pdfBytes.length,
    })
  } catch (error: any) {
    console.error('PDF merge error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to merge PDFs' },
      { status: 500 }
    )
  }
}

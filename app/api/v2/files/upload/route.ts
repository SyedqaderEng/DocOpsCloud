/**
 * Universal File Upload Endpoint
 * POST /api/v2/files/upload
 * Handles uploads for ALL file types
 */

import { NextRequest, NextResponse } from 'next/server'
import { fileStorageService } from '@/lib/services/file-storage.service'
import { PDFEngine } from '@/lib/engines/pdf.engine'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get user ID from auth (if available)
    const userId = req.headers.get('x-user-id') || undefined

    // Generate metadata based on file type
    const metadata = await generateMetadata(buffer, file.type)

    // Upload to storage
    const result = await fileStorageService.uploadFromBuffer(
      buffer,
      file.name,
      file.type,
      userId,
      metadata
    )

    return NextResponse.json({
      fileId: result.fileId,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
      metadata: result.metadata,
    })
  } catch (error: any) {
    console.error('[Upload] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

/**
 * Generate metadata for uploaded file
 */
async function generateMetadata(buffer: Buffer, mimeType: string): Promise<any> {
  const metadata: any = {}

  try {
    if (mimeType === 'application/pdf') {
      const fs = await import('fs/promises')
      const path = await import('path')
      const os = await import('os')

      // Save to temp file
      const tempPath = path.join(os.tmpdir(), `upload-${Date.now()}.pdf`)
      await fs.writeFile(tempPath, buffer)

      try {
        const pdfEngine = new PDFEngine()
        const loaded = await pdfEngine.load(tempPath)
        metadata.pageCount = loaded.metadata.pageCount
        metadata.title = loaded.metadata.title
        metadata.author = loaded.metadata.author
      } finally {
        // Cleanup temp file
        await fs.unlink(tempPath).catch(() => {})
      }
    }
    // Add more file types as engines are implemented
    // else if (mimeType.startsWith('image/')) { ... }
    // else if (mimeType.startsWith('video/')) { ... }
  } catch (error) {
    console.warn('[Upload] Failed to generate metadata:', error)
  }

  return metadata
}

// Configure route
export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parser for file uploads
  },
}

/**
 * Universal File Preview Endpoint
 * GET /api/v2/files/[fileId]/preview
 * Generates previews for ALL file types
 */

import { NextRequest, NextResponse } from 'next/server'
import { fileStorageService } from '@/lib/services/file-storage.service'
import { PDFEngine } from '@/lib/engines/pdf.engine'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export async function GET(
  _req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params

    // Get file metadata
    const fileMetadata = await fileStorageService.getFileMetadata(fileId)

    // Download file to temp location
    const tempDir = path.join(os.tmpdir(), `preview-${fileId}`)
    await fs.mkdir(tempDir, { recursive: true })
    const tempPath = path.join(tempDir, 'file')

    await fileStorageService.downloadToPath(fileId, tempPath)

    // Generate preview based on file type
    let previewData: any

    if (fileMetadata.mimeType === 'application/pdf') {
      const pdfEngine = new PDFEngine()
      const loaded = await pdfEngine.load(tempPath)
      previewData = await pdfEngine.preview(loaded)
    } else if (fileMetadata.mimeType.startsWith('image/')) {
      // Image preview would be handled by ImageEngine
      previewData = {
        type: 'image',
        thumbnail: '', // TODO: Generate thumbnail
        metadata: fileMetadata.metadata,
      }
    } else if (fileMetadata.mimeType.startsWith('video/')) {
      // Video preview would be handled by VideoEngine
      previewData = {
        type: 'video',
        duration: 0, // TODO: Get duration
        frames: [],
        metadata: fileMetadata.metadata,
      }
    } else {
      // Generic preview
      previewData = {
        type: 'generic',
        metadata: fileMetadata.metadata,
      }
    }

    // Cleanup temp file
    await fs.rm(tempDir, { recursive: true, force: true })

    return NextResponse.json({
      fileId,
      filename: fileMetadata.filename,
      mimeType: fileMetadata.mimeType,
      size: fileMetadata.size,
      preview: previewData,
    })
  } catch (error: any) {
    console.error('[Preview] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Preview generation failed' },
      { status: 500 }
    )
  }
}

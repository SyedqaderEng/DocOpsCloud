/**
 * Universal File Download Endpoint
 * GET /api/v2/files/[fileId]/download
 * Downloads processed files
 */

import { NextRequest, NextResponse } from 'next/server'
import { fileStorageService } from '@/lib/services/file-storage.service'

export async function GET(
  _req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params

    // Get file metadata
    const fileMetadata = await fileStorageService.getFileMetadata(fileId)

    // Get download stream
    const stream = await fileStorageService.getDownloadStream(fileId)

    // Convert stream to buffer (for Next.js compatibility)
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)

    // Create response with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': fileMetadata.mimeType,
        'Content-Disposition': `attachment; filename="${fileMetadata.filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('[Download] Error:', error)

    if (error.message.includes('not found') || error.message.includes('expired')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Download failed' },
      { status: 500 }
    )
  }
}

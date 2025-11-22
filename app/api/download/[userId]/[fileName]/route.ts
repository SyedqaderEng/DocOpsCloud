import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/download/[userId]/[fileName]
 * Download processed files
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; fileName: string }> }
) {
  try {
    const { userId, fileName } = await params

    // Basic security check - only allow alphanumeric, dashes, underscores, and dots in filename
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(fileName) || !/^[a-zA-Z0-9_\-]+$/.test(userId)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const filePath = join(process.cwd(), 'temp', 'output', userId, fileName)

    try {
      const fileBuffer = await readFile(filePath)

      // Determine content type based on extension
      const extension = fileName.split('.').pop()?.toLowerCase()
      let contentType = 'application/octet-stream'

      if (extension === 'pdf') {
        contentType = 'application/pdf'
      } else if (extension === 'zip') {
        contentType = 'application/zip'
      } else if (['jpg', 'jpeg'].includes(extension || '')) {
        contentType = 'image/jpeg'
      } else if (extension === 'png') {
        contentType = 'image/png'
      }

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    } catch (error) {
      console.error('File read error:', error)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: error.message || 'Download failed' },
      { status: 500 }
    )
  }
}

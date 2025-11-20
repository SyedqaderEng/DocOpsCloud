import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { getFileById } from '@/lib/storage/upload'
import { generatePresignedDownloadUrl } from '@/lib/storage/s3'
import { UploadStatus } from '@prisma/client'

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // Require authentication
    const user = await requireUser()

    const { fileId } = params

    // Get file record and verify ownership
    const file = await getFileById(fileId, user.id)

    if (!file) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      )
    }

    // Check if file upload is complete
    if (file.upload_status !== UploadStatus.COMPLETE) {
      return NextResponse.json(
        { error: 'File upload not complete' },
        { status: 400 }
      )
    }

    // Check if file has expired
    if (new Date() > file.expires_at) {
      return NextResponse.json(
        { error: 'File has expired' },
        { status: 410 } // Gone
      )
    }

    // Generate pre-signed download URL
    const downloadUrl = await generatePresignedDownloadUrl(file.stored_name)

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl,
        fileName: file.original_name,
        expiresAt: file.expires_at,
      },
    })
  } catch (error) {
    console.error('Download URL generation error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}

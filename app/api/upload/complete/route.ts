import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { markFileUploadComplete, markFileUploadFailed, getFileById } from '@/lib/storage/upload'
import { fileExistsInS3, getPublicUrl } from '@/lib/storage/s3'
import { z } from 'zod'

const completeUploadSchema = z.object({
  fileId: z.string().cuid(),
  key: z.string(),
  success: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser()

    // Parse and validate request body
    const body = await req.json()
    const validated = completeUploadSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validated.error.errors },
        { status: 400 }
      )
    }

    const { fileId, key, success } = validated.data

    // Get file record and verify ownership
    const file = await getFileById(fileId, user.id)

    if (!file) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      )
    }

    if (!success) {
      // Mark upload as failed
      await markFileUploadFailed(fileId)

      return NextResponse.json({
        success: true,
        message: 'Upload marked as failed',
      })
    }

    // Verify file exists in S3
    const exists = await fileExistsInS3(key)

    if (!exists) {
      await markFileUploadFailed(fileId)

      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 400 }
      )
    }

    // Get public URL (or you can use pre-signed URL for downloads)
    const s3Url = getPublicUrl(key)

    // Mark upload as complete
    await markFileUploadComplete(fileId, s3Url)

    return NextResponse.json({
      success: true,
      data: {
        fileId,
        s3Url,
      },
    })
  } catch (error) {
    console.error('Upload completion error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    )
  }
}

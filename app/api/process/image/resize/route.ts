import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { addImageResizeJob } from '@/lib/queue/jobs/image-jobs'
import type { ImageResizeOptions } from '@/modules/image/types'

/**
 * POST /api/process/image/resize
 *
 * Resize image
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()
    const { fileId, width, height, fit, position, background, withoutEnlargement } = body

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    if (!width && !height) {
      return NextResponse.json(
        { error: 'At least width or height is required' },
        { status: 400 }
      )
    }

    // Verify file exists and belongs to user
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: session.user.id,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Validate file type
    if (!file.mimeType?.includes('image')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are supported.' },
        { status: 400 }
      )
    }

    // Create resize options
    const options: ImageResizeOptions = {
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      fit: fit || 'cover',
      position: position || 'center',
      background,
      withoutEnlargement: withoutEnlargement ?? false,
    }

    // Create job record
    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        type: 'image_resize',
        status: 'queued',
        inputFileId: fileId,
        metadata: {
          options,
          inputFileName: file.name,
        },
      },
    })

    // Add job to queue
    await addImageResizeJob({
      jobId: job.id,
      userId: session.user.id,
      inputS3Key: file.s3Key,
      options,
    })

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      message: 'Image resize job created',
    })
  } catch (error) {
    console.error('Image resize API error:', error)
    return NextResponse.json(
      { error: 'Failed to create resize job' },
      { status: 500 }
    )
  }
}

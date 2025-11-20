import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { addImageOptimizeJob } from '@/lib/queue/jobs/image-jobs'
import type { ImageOptimizationOptions } from '@/modules/image/types'

/**
 * POST /api/process/image/optimize
 *
 * Optimize image (resize + compress + format)
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
    const { fileId, maxWidth, maxHeight, quality, format, progressive, stripMetadata } = body

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
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

    // Create optimization options
    const options: ImageOptimizationOptions = {
      maxWidth: maxWidth ? parseInt(maxWidth) : undefined,
      maxHeight: maxHeight ? parseInt(maxHeight) : undefined,
      quality: quality ? parseInt(quality) : 80,
      format,
      progressive: progressive ?? true,
      stripMetadata: stripMetadata ?? false,
    }

    // Create job record
    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        type: 'image_optimize',
        status: 'queued',
        inputFileId: fileId,
        metadata: {
          options,
          inputFileName: file.name,
        },
      },
    })

    // Add job to queue
    await addImageOptimizeJob({
      jobId: job.id,
      userId: session.user.id,
      inputS3Key: file.s3Key,
      options,
    })

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      message: 'Image optimization job created',
    })
  } catch (error) {
    console.error('Image optimize API error:', error)
    return NextResponse.json(
      { error: 'Failed to create optimization job' },
      { status: 500 }
    )
  }
}

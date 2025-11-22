import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{ jobId: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params

    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token)

    // Get user from database
    const user = await prisma.user.findFirst({
      where: { email: decodedToken.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get job details
    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
      include: {
        input_file: true,
        output_file: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify job belongs to user
    if (job.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Calculate processing time if completed
    let processingTime = null
    if (job.completed_at && job.started_at) {
      processingTime = job.completed_at.getTime() - job.started_at.getTime()
    }

    // Return job status
    return NextResponse.json({
      jobId: job.id,
      status: job.status.toLowerCase(),
      operationType: job.operation_type,
      progress: job.progress_percentage,
      error: job.error_message,
      createdAt: job.created_at.toISOString(),
      startedAt: job.started_at?.toISOString() || null,
      completedAt: job.completed_at?.toISOString() || null,
      processingTime,
      inputFile: job.input_file
        ? {
            id: job.input_file.id,
            name: job.input_file.original_name,
            size: Number(job.input_file.file_size),
            type: job.input_file.file_type,
          }
        : null,
      outputFile: job.output_file
        ? {
            id: job.output_file.id,
            name: job.output_file.original_name,
            size: Number(job.output_file.file_size),
            downloadUrl: job.output_file.s3_url,
          }
        : null,
    })
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    )
  }
}

// Cancel a job
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params

    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token)

    // Get user from database
    const user = await prisma.user.findFirst({
      where: { email: decodedToken.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get job
    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify job belongs to user
    if (job.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Can only cancel queued or processing jobs
    if (job.status !== 'QUEUED' && job.status !== 'PROCESSING') {
      return NextResponse.json(
        { error: `Cannot cancel job with status ${job.status}` },
        { status: 400 }
      )
    }

    // Update job status to canceled
    const updatedJob = await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'CANCELED',
        completed_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      jobId: updatedJob.id,
      status: 'canceled',
    })
  } catch (error) {
    console.error('Error canceling job:', error)
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    )
  }
}

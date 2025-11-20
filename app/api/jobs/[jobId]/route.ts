import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const user = await requireUser()
    const { jobId } = params

    // Get job from database
    const job = await prisma.processingJob.findFirst({
      where: {
        id: jobId,
        user_id: user.id,
      },
      include: {
        input_file: {
          select: {
            id: true,
            original_name: true,
            file_type: true,
            file_size: true,
          },
        },
        output_file: {
          select: {
            id: true,
            original_name: true,
            s3_url: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Transform status to lowercase for frontend
    const status = job.status.toLowerCase() as 'queued' | 'processing' | 'complete' | 'failed' | 'canceled'

    // Generate download URL for output file
    let downloadUrl: string | undefined
    if (job.output_file && job.status === 'COMPLETE') {
      downloadUrl = `/api/files/${job.output_file.id}/download`
    }

    return NextResponse.json({
      id: job.id,
      type: job.operation_type,
      status: status === 'complete' ? 'completed' : status, // Map COMPLETE to completed
      progress: job.progress_percentage,
      error: job.error_message,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      inputFile: job.input_file
        ? {
            id: job.input_file.id,
            name: job.input_file.original_name,
            size: Number(job.input_file.file_size),
          }
        : undefined,
      outputFile: job.output_file
        ? {
            id: job.output_file.id,
            name: job.output_file.original_name,
            size: Number(job.output_file.file_size),
            downloadUrl,
          }
        : undefined,
      metadata: job.operation_params,
    })
  } catch (error) {
    console.error('Job status fetch error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to fetch job status' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const user = await requireUser()
    const { jobId } = params

    // Get job and verify ownership
    const job = await prisma.processingJob.findFirst({
      where: {
        id: jobId,
        user_id: user.id,
      },
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Can only cancel queued or processing jobs
    if (job.status !== 'QUEUED' && job.status !== 'PROCESSING') {
      return NextResponse.json(
        { error: 'Job cannot be cancelled in current status' },
        { status: 400 }
      )
    }

    // TODO: Cancel job in queue using cancelJob()

    // Update database
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: 'CANCELED' },
    })

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
    })
  } catch (error) {
    console.error('Job cancellation error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 })
  }
}

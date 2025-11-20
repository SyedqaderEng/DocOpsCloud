import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId } = params

    const job = await prisma.processing_job.findFirst({
      where: {
        id: jobId,
        user_id: session.user.id,
      },
      include: {
        output_file: {
          select: {
            id: true,
            name: true,
            size: true,
            mime_type: true,
            created_at: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      job: {
        id: job.id,
        operationType: job.operation_type,
        status: job.status,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        error: job.error,
        metadata: job.metadata,
        outputFile: job.output_file
          ? {
              id: job.output_file.id,
              name: job.output_file.name,
              size: Number(job.output_file.size),
              mimeType: job.output_file.mime_type,
              downloadUrl: `/api/files/download/${job.output_file.id}`,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Get job error:', error)
    return NextResponse.json({ error: 'Failed to get job' }, { status: 500 })
  }
}

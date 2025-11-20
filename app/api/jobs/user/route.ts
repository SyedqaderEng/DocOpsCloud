import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {
      user_id: user.id,
    }

    if (status) {
      where.status = status
    }

    // Get total count
    const total = await prisma.processingJob.count({ where })

    // Get jobs
    const jobs = await prisma.processingJob.findMany({
      where,
      include: {
        input_file: {
          select: {
            id: true,
            original_name: true,
            file_type: true,
          },
        },
        output_file: {
          select: {
            id: true,
            original_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobs.map((job) => ({
          id: job.id,
          status: job.status,
          progress: job.progress_percentage,
          operationType: job.operation_type,
          inputFile: job.input_file,
          outputFile: job.output_file,
          error: job.error_message,
          createdAt: job.created_at,
          completedAt: job.completed_at,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    })
  } catch (error) {
    console.error('User jobs fetch error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

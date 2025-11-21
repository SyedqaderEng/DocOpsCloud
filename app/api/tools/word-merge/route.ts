import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const wordMergeSchema = z.object({
  fileIds: z.array(z.string()).min(2, 'At least 2 files required for merging'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const usageCheck = await checkUsageLimit(userId)
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: 'Usage limit exceeded', tier: usageCheck.tier, limit: usageCheck.limit },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { fileIds } = wordMergeSchema.parse(body)

    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        user_id: userId,
      },
    })

    if (files.length !== fileIds.length) {
      return NextResponse.json({ error: 'Some files not found or not owned by user' }, { status: 404 })
    }

    const job = await prisma.processing_job.create({
      data: {
        user_id: userId,
        operation_type: 'word_merge',
        status: 'queued',
        input_file_ids: fileIds,
        metadata: {
          fileCount: files.length,
        },
      },
    })

    await queueManager.addWordJob({
      jobId: job.id,
      operationType: 'word_merge',
      userId,
      files: files.map(f => ({ id: f.id, s3_key: f.s3_key, file_name: f.file_name })),
      options: {},
    })

    await logUsage(userId, 'word_merge', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      checkStatusUrl: `/api/jobs/${job.id}`,
      message: `Word merge job queued. Merging ${files.length} documents.`,
    })
  } catch (error) {
    console.error('Word merge error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to queue Word merge' }, { status: 500 })
  }
}

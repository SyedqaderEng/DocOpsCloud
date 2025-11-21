import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const schema = z.object({
  fileIds: z.array(z.string()).min(2, 'At least 2 files required'),
  mergeType: z.enum(['sheets', 'rows']).optional(), // combine as sheets or append rows
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const usageCheck = await checkUsageLimit(userId)
    if (!usageCheck.allowed) return NextResponse.json({ error: 'Usage limit exceeded' }, { status: 429 })

    const body = await request.json()
    const { fileIds, mergeType } = schema.parse(body)

    const files = await prisma.file.findMany({
      where: { id: { in: fileIds }, user_id: userId },
    })

    if (files.length !== fileIds.length) {
      return NextResponse.json({ error: 'Some files not found' }, { status: 404 })
    }

    // Validate all files are Excel
    const invalidFiles = files.filter(f => !f.file_name.match(/\.xlsx?$/i) && !f.file_name.match(/\.csv$/i))
    if (invalidFiles.length > 0) {
      return NextResponse.json({
        error: 'All files must be Excel (.xlsx, .xls) or CSV',
        invalidFiles: invalidFiles.map(f => f.file_name)
      }, { status: 400 })
    }

    const job = await prisma.processing_job.create({
      data: {
        user_id: userId, operation_type: 'excel_merge', status: 'queued',
        input_file_ids: fileIds, metadata: { mergeType: mergeType || 'sheets', fileCount: files.length },
      },
    })

    await queueManager.addExcelJob({
      jobId: job.id, operationType: 'excel_merge', userId,
      files: files.map(f => ({ id: f.id, s3_key: f.s3_key, file_name: f.file_name })),
      options: { mergeType: mergeType || 'sheets' },
    })

    await logUsage(userId, 'excel_merge', 0)
    return NextResponse.json({ success: true, jobId: job.id, checkStatusUrl: `/api/jobs/${job.id}` })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Failed to queue merge' }, { status: 500 })
  }
}

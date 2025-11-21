import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const ALLOWED_MIMETYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]

const schema = z.object({
  fileId: z.string(),
  sheetName: z.string().optional(),
  headerRow: z.number().optional(),
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
      return NextResponse.json({ error: 'Usage limit exceeded' }, { status: 429 })
    }

    const body = await request.json()
    const { fileId, sheetName, headerRow } = schema.parse(body)

    const file = await prisma.file.findFirst({
      where: { id: fileId, user_id: userId },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (!ALLOWED_MIMETYPES.includes(file.mime_type || '') && !file.file_name.match(/\.xlsx?$/i)) {
      return NextResponse.json({
        error: 'Invalid file type. Only Excel files (.xlsx, .xls) are supported.',
      }, { status: 400 })
    }

    const job = await prisma.processing_job.create({
      data: {
        user_id: userId,
        operation_type: 'excel_to_json',
        status: 'queued',
        input_file_ids: [fileId],
        metadata: { sheetName, headerRow: headerRow || 1 },
      },
    })

    await queueManager.addExcelJob({
      jobId: job.id,
      operationType: 'excel_to_json',
      userId,
      files: [{ id: file.id, s3_key: file.s3_key, file_name: file.file_name }],
      options: { sheetName, headerRow: headerRow || 1 },
    })

    await logUsage(userId, 'excel_to_json', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      checkStatusUrl: `/api/jobs/${job.id}`,
    })
  } catch (error) {
    console.error('Excel to JSON error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to queue conversion' }, { status: 500 })
  }
}

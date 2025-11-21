import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const ALLOWED_MIMETYPES = ['text/csv', 'application/csv', 'text/plain']

const csvToExcelSchema = z.object({
  fileId: z.string(),
  sheetName: z.string().optional(),
  delimiter: z.string().optional(),
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
    const { fileId, sheetName, delimiter } = csvToExcelSchema.parse(body)

    const file = await prisma.file.findFirst({
      where: { id: fileId, user_id: userId },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Validate file type - check extension if mime type not reliable
    const isCSV = ALLOWED_MIMETYPES.includes(file.mime_type || '') ||
                  file.file_name.toLowerCase().endsWith('.csv')

    if (!isCSV) {
      return NextResponse.json({
        error: 'Invalid file type. Only CSV files are supported.',
        allowedTypes: ['.csv']
      }, { status: 400 })
    }

    const job = await prisma.processing_job.create({
      data: {
        user_id: userId,
        operation_type: 'csv_to_excel',
        status: 'queued',
        input_file_ids: [fileId],
        metadata: {
          sheetName: sheetName || 'Sheet1',
          delimiter: delimiter || ',',
        },
      },
    })

    await queueManager.addExcelJob({
      jobId: job.id,
      operationType: 'csv_to_excel',
      userId,
      files: [{ id: file.id, s3_key: file.s3_key, file_name: file.file_name }],
      options: {
        sheetName: sheetName || 'Sheet1',
        delimiter: delimiter || ',',
      },
    })

    await logUsage(userId, 'csv_to_excel', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      checkStatusUrl: `/api/jobs/${job.id}`,
      message: 'CSV to Excel conversion job queued',
    })
  } catch (error) {
    console.error('CSV to Excel error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to queue CSV to Excel conversion' }, { status: 500 })
  }
}

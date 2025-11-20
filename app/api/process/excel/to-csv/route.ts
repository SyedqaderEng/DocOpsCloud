import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { addExcelToCsvJob } from '@/lib/queue/jobs/excel-jobs'
import type { ExcelToCsvOptions } from '@/modules/excel/types'

/**
 * POST /api/process/excel/to-csv
 *
 * Convert Excel file to CSV
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
    const { fileId, sheetName, sheetIndex, delimiter, includeHeaders } = body

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
    if (!file.mimeType?.includes('spreadsheet') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only Excel files are supported.' },
        { status: 400 }
      )
    }

    // Create conversion options
    const options: ExcelToCsvOptions = {
      sheetName,
      sheetIndex: sheetIndex ?? 0,
      delimiter: delimiter || ',',
      includeHeaders: includeHeaders ?? true,
    }

    // Create job record
    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        type: 'excel_to_csv',
        status: 'queued',
        inputFileId: fileId,
        metadata: {
          options,
          inputFileName: file.name,
        },
      },
    })

    // Add job to queue
    await addExcelToCsvJob({
      jobId: job.id,
      userId: session.user.id,
      inputS3Key: file.s3Key,
      options,
    })

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      message: 'Excel to CSV conversion job created',
    })
  } catch (error) {
    console.error('Excel to CSV API error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversion job' },
      { status: 500 }
    )
  }
}

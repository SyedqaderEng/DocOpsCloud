import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { addCsvToExcelJob } from '@/lib/queue/jobs/excel-jobs'
import type { CsvToExcelOptions } from '@/modules/excel/types'

/**
 * POST /api/process/excel/to-excel
 *
 * Convert CSV file to Excel
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
    const { fileId, sheetName, delimiter, hasHeaders, autoDetectTypes } = body

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
    if (!file.mimeType?.includes('csv') && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV files are supported.' },
        { status: 400 }
      )
    }

    // Create conversion options
    const options: CsvToExcelOptions = {
      sheetName: sheetName || 'Sheet1',
      delimiter: delimiter || ',',
      hasHeaders: hasHeaders ?? true,
      autoDetectTypes: autoDetectTypes ?? true,
    }

    // Create job record
    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        type: 'csv_to_excel',
        status: 'queued',
        inputFileId: fileId,
        metadata: {
          options,
          inputFileName: file.name,
        },
      },
    })

    // Add job to queue
    await addCsvToExcelJob({
      jobId: job.id,
      userId: session.user.id,
      inputS3Key: file.s3Key,
      options,
    })

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      message: 'CSV to Excel conversion job created',
    })
  } catch (error) {
    console.error('CSV to Excel API error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversion job' },
      { status: 500 }
    )
  }
}

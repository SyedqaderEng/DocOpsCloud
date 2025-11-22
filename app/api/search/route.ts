import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

/**
 * GET /api/search?query=...&fileType=...&status=...
 * Advanced search across files and jobs
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)

    // Extract search parameters
    const query = searchParams.get('query') || ''
    const fileTypes = searchParams.get('fileType')?.split(',').filter(Boolean) || []
    const statuses = searchParams.get('status')?.split(',').filter(Boolean) || []
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sizeMin = searchParams.get('sizeMin')
    const sizeMax = searchParams.get('sizeMax')
    const sortBy = (searchParams.get('sortBy') as 'date' | 'name' | 'size') || 'date'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

    // Build file search filters
    const fileWhere: Prisma.FileWhereInput = {
      user_id: user.id,
      AND: [],
    }

    // Text search in filename
    if (query) {
      fileWhere.AND!.push({
        original_name: {
          contains: query,
          mode: 'insensitive',
        },
      })
    }

    // File type filter
    if (fileTypes.length > 0) {
      fileWhere.AND!.push({
        file_type: {
          in: fileTypes as any[],
        },
      })
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const dateFilter: any = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      fileWhere.AND!.push({
        created_at: dateFilter,
      })
    }

    // Size range filter
    if (sizeMin || sizeMax) {
      const sizeFilter: any = {}
      if (sizeMin) sizeFilter.gte = BigInt(sizeMin)
      if (sizeMax) sizeFilter.lte = BigInt(sizeMax)
      fileWhere.AND!.push({
        file_size: sizeFilter,
      })
    }

    // Clean up empty AND array
    if (fileWhere.AND!.length === 0) {
      delete fileWhere.AND
    }

    // Build sort order
    const orderBy: Prisma.FileOrderByWithRelationInput =
      sortBy === 'date'
        ? { created_at: sortOrder }
        : sortBy === 'name'
        ? { original_name: sortOrder }
        : { file_size: sortOrder }

    // Search files
    const files = await prisma.file.findMany({
      where: fileWhere,
      orderBy,
      take: 50, // Limit to 50 results
      include: {
        input_jobs: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            operation_type: true,
            status: true,
            created_at: true,
          },
        },
      },
    })

    // Build job search filters
    const jobWhere: Prisma.ProcessingJobWhereInput = {
      user_id: user.id,
      AND: [],
    }

    // Text search in operation type
    if (query) {
      jobWhere.AND!.push({
        operation_type: {
          contains: query,
          mode: 'insensitive',
        },
      })
    }

    // Status filter
    if (statuses.length > 0) {
      jobWhere.AND!.push({
        status: {
          in: statuses as any[],
        },
      })
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const dateFilter: any = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      jobWhere.AND!.push({
        created_at: dateFilter,
      })
    }

    // Clean up empty AND array
    if (jobWhere.AND!.length === 0) {
      delete jobWhere.AND
    }

    // Search jobs
    const jobs = await prisma.processingJob.findMany({
      where: jobWhere,
      orderBy: { created_at: sortOrder },
      take: 50,
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
            file_type: true,
            file_size: true,
          },
        },
      },
    })

    // Format results
    const fileResults = files.map((file) => ({
      type: 'file' as const,
      id: file.id,
      name: file.original_name,
      fileType: file.file_type,
      size: Number(file.file_size),
      uploadStatus: file.upload_status,
      processingStatus: file.processing_status,
      thumbnailUrl: file.thumbnail_url,
      s3Url: file.s3_url,
      createdAt: file.created_at,
      expiresAt: file.expires_at,
      recentJob: file.input_jobs[0] || null,
    }))

    const jobResults = jobs.map((job) => ({
      type: 'job' as const,
      id: job.id,
      operationType: job.operation_type,
      status: job.status,
      progress: job.progress_percentage,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      inputFile: job.input_file
        ? {
            id: job.input_file.id,
            name: job.input_file.original_name,
            type: job.input_file.file_type,
            size: Number(job.input_file.file_size),
          }
        : null,
      outputFile: job.output_file
        ? {
            id: job.output_file.id,
            name: job.output_file.original_name,
            type: job.output_file.file_type,
            size: Number(job.output_file.file_size),
          }
        : null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        files: fileResults,
        jobs: jobResults,
        totalResults: fileResults.length + jobResults.length,
        query,
        filters: {
          fileTypes,
          statuses,
          dateRange: dateFrom || dateTo ? { from: dateFrom, to: dateTo } : null,
          sizeRange: sizeMin || sizeMax ? { min: sizeMin, max: sizeMax } : null,
        },
      },
    })
  } catch (error) {
    console.error('Search error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

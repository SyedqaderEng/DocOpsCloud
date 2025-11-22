import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/files/[fileId]/metadata
 * Get comprehensive metadata for a file
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const user = await requireUser()
    const { fileId } = params

    // Get file with all related data
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        user_id: user.id,
      },
      include: {
        input_jobs: {
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            output_file: {
              select: {
                id: true,
                original_name: true,
                file_size: true,
                created_at: true,
              },
            },
          },
        },
        output_jobs: {
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            input_file: {
              select: {
                id: true,
                original_name: true,
                file_size: true,
                created_at: true,
              },
            },
          },
        },
      },
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      )
    }

    // Get share links for this file
    const shareLinks = await prisma.shareLink.findMany({
      where: { file_id: fileId },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            // Note: This requires adding relation in schema
          },
        },
      },
    })

    // Calculate file analytics
    const totalProcessingJobs = file.input_jobs.length + file.output_jobs.length
    const completedJobs = [
      ...file.input_jobs.filter(j => j.status === 'COMPLETE'),
      ...file.output_jobs.filter(j => j.status === 'COMPLETE'),
    ].length
    const failedJobs = [
      ...file.input_jobs.filter(j => j.status === 'FAILED'),
      ...file.output_jobs.filter(j => j.status === 'FAILED'),
    ].length

    // Get operations performed on this file
    const operationsPerformed = file.input_jobs.map(j => j.operation_type)
    const uniqueOperations = [...new Set(operationsPerformed)]

    // Calculate total shares and views
    const totalShares = shareLinks.length
    const activeShares = shareLinks.filter(
      link => new Date() < link.expires_at &&
              (!link.max_views || link.current_views < link.max_views)
    ).length
    const totalViews = shareLinks.reduce((sum, link) => sum + link.current_views, 0)

    // File age
    const ageInDays = Math.floor(
      (Date.now() - file.created_at.getTime()) / (1000 * 60 * 60 * 24)
    )
    const expiresInDays = Math.floor(
      (file.expires_at.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    // Build metadata response
    const metadata = {
      // Basic file info
      file: {
        id: file.id,
        name: file.original_name,
        storedName: file.stored_name,
        type: file.file_type,
        size: Number(file.file_size),
        mimeType: file.mime_type,
        uploadStatus: file.upload_status,
        processingStatus: file.processing_status,
        s3Url: file.s3_url,
        thumbnailUrl: file.thumbnail_url,
        createdAt: file.created_at,
        expiresAt: file.expires_at,
      },

      // File lifecycle
      lifecycle: {
        ageInDays,
        expiresInDays,
        isExpiringSoon: expiresInDays <= 7,
        willExpire: expiresInDays > 0,
      },

      // Processing history
      processing: {
        totalJobs: totalProcessingJobs,
        completedJobs,
        failedJobs,
        inProgressJobs: totalProcessingJobs - completedJobs - failedJobs,
        operationsPerformed: uniqueOperations,
        recentJobs: file.input_jobs.slice(0, 5).map(job => ({
          id: job.id,
          operation: job.operation_type,
          status: job.status,
          progress: job.progress_percentage,
          createdAt: job.created_at,
          completedAt: job.completed_at,
          error: job.error_message,
          outputFile: job.output_file ? {
            id: job.output_file.id,
            name: job.output_file.original_name,
            size: Number(job.output_file.file_size),
          } : null,
        })),
      },

      // Sharing analytics
      sharing: {
        totalShares,
        activeShares,
        expiredShares: totalShares - activeShares,
        totalViews,
        shareLinks: shareLinks.map(link => ({
          id: link.share_id,
          createdAt: link.created_at,
          expiresAt: link.expires_at,
          isActive: new Date() < link.expires_at &&
                    (!link.max_views || link.current_views < link.max_views),
          hasPassword: !!link.password_hash,
          maxViews: link.max_views,
          currentViews: link.current_views,
          allowDownload: link.allow_download,
        })),
      },

      // Related files
      relatedFiles: {
        // Files created from this file
        outputFiles: file.input_jobs
          .filter(j => j.output_file)
          .map(j => ({
            id: j.output_file!.id,
            name: j.output_file!.original_name,
            size: Number(j.output_file!.file_size),
            createdAt: j.output_file!.created_at,
            operation: j.operation_type,
          })),
        // Files that created this file
        inputFiles: file.output_jobs
          .filter(j => j.input_file)
          .map(j => ({
            id: j.input_file.id,
            name: j.input_file.original_name,
            size: Number(j.input_file.file_size),
            createdAt: j.input_file.created_at,
            operation: j.operation_type,
          })),
      },
    }

    return NextResponse.json({
      success: true,
      data: metadata,
    })
  } catch (error) {
    console.error('File metadata error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to get file metadata' }, { status: 500 })
  }
}

/**
 * PATCH /api/files/[fileId]/metadata
 * Update file metadata (name, expiry, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const user = await requireUser()
    const { fileId } = params
    const body = await req.json()

    // Verify file belongs to user
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        user_id: user.id,
      },
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      )
    }

    // Update allowed fields
    const updateData: any = {}

    if (body.name && typeof body.name === 'string') {
      updateData.original_name = body.name
    }

    if (body.expiresAt && typeof body.expiresAt === 'string') {
      updateData.expires_at = new Date(body.expiresAt)
    }

    // Update file
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedFile.id,
        name: updatedFile.original_name,
        expiresAt: updatedFile.expires_at,
      },
    })
  } catch (error) {
    console.error('File metadata update error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to update file metadata' }, { status: 500 })
  }
}

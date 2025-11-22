import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createVersionSchema = z.object({
  versionLabel: z.string().optional(),
  description: z.string().optional(),
  operationType: z.string().optional(),
  operationParams: z.record(z.any()).optional(),
  jobId: z.string().optional(),
})

/**
 * GET /api/files/[fileId]/versions
 * Get all versions of a file
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const user = await requireUser()
    const { fileId } = params

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

    // Get all versions
    const versions = await prisma.fileVersion.findMany({
      where: { file_id: fileId },
      orderBy: { version_number: 'desc' },
    })

    // Build version tree (parent-child relationships)
    const versionTree = versions.map((version) => ({
      id: version.id,
      versionNumber: version.version_number,
      versionLabel: version.version_label,
      description: version.description,
      fileName: version.file_name,
      fileSize: Number(version.file_size),
      fileType: version.file_type,
      s3Url: version.s3_url,
      thumbnailUrl: version.thumbnail_url,
      operationType: version.operation_type,
      operationParams: version.operation_params,
      jobId: version.job_id,
      checksum: version.checksum,
      isCurrent: version.is_current,
      parentVersionId: version.parent_version_id,
      createdAt: version.created_at,
    }))

    // Calculate version stats
    const totalVersions = versions.length
    const totalSize = versions.reduce((sum, v) => sum + Number(v.file_size), 0)
    const currentVersion = versions.find((v) => v.is_current)

    return NextResponse.json({
      success: true,
      data: {
        versions: versionTree,
        stats: {
          totalVersions,
          totalSize,
          currentVersion: currentVersion
            ? {
                number: currentVersion.version_number,
                createdAt: currentVersion.created_at,
              }
            : null,
        },
      },
    })
  } catch (error) {
    console.error('Get versions error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to get file versions' }, { status: 500 })
  }
}

/**
 * POST /api/files/[fileId]/versions
 * Create a new version of a file
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const user = await requireUser()
    const { fileId } = params
    const body = await req.json()
    const validated = createVersionSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validated.error.errors },
        { status: 400 }
      )
    }

    const { versionLabel, description, operationType, operationParams, jobId } = validated.data

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

    // Get latest version number
    const latestVersion = await prisma.fileVersion.findFirst({
      where: { file_id: fileId },
      orderBy: { version_number: 'desc' },
    })

    const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1

    // Create new version
    const newVersion = await prisma.fileVersion.create({
      data: {
        user_id: user.id,
        file_id: fileId,
        parent_version_id: latestVersion?.id,
        version_number: nextVersionNumber,
        version_label: versionLabel,
        description,
        file_name: file.original_name,
        file_size: file.file_size,
        file_type: file.file_type,
        s3_url: file.s3_url,
        thumbnail_url: file.thumbnail_url,
        operation_type: operationType,
        operation_params: operationParams || null,
        job_id: jobId,
        is_current: true,
      },
    })

    // Mark all other versions as not current
    await prisma.fileVersion.updateMany({
      where: {
        file_id: fileId,
        id: { not: newVersion.id },
      },
      data: { is_current: false },
    })

    return NextResponse.json({
      success: true,
      data: {
        versionId: newVersion.id,
        versionNumber: newVersion.version_number,
        createdAt: newVersion.created_at,
      },
    })
  } catch (error) {
    console.error('Create version error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to create file version' }, { status: 500 })
  }
}

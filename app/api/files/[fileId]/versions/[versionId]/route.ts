import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/files/[fileId]/versions/[versionId]
 * Get a specific version
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string; versionId: string } }
) {
  try {
    const user = await requireUser()
    const { fileId, versionId } = params

    // Verify version exists and user has access
    const version = await prisma.fileVersion.findFirst({
      where: {
        id: versionId,
        file_id: fileId,
        user_id: user.id,
      },
    })

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
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
      },
    })
  } catch (error) {
    console.error('Get version error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to get version' }, { status: 500 })
  }
}

/**
 * POST /api/files/[fileId]/versions/[versionId]/restore
 * Restore a file to a specific version
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { fileId: string; versionId: string } }
) {
  try {
    const user = await requireUser()
    const { fileId, versionId } = params

    // Verify version exists and user has access
    const version = await prisma.fileVersion.findFirst({
      where: {
        id: versionId,
        file_id: fileId,
        user_id: user.id,
      },
    })

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found or access denied' },
        { status: 404 }
      )
    }

    // Update file to match this version
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        original_name: version.file_name,
        file_size: version.file_size,
        file_type: version.file_type,
        s3_url: version.s3_url,
        thumbnail_url: version.thumbnail_url,
      },
    })

    // Mark this version as current
    await prisma.$transaction([
      // Unmark all versions
      prisma.fileVersion.updateMany({
        where: { file_id: fileId },
        data: { is_current: false },
      }),
      // Mark this version as current
      prisma.fileVersion.update({
        where: { id: versionId },
        data: { is_current: true },
      }),
    ])

    // Create a new version entry for the restore action
    const latestVersion = await prisma.fileVersion.findFirst({
      where: { file_id: fileId },
      orderBy: { version_number: 'desc' },
    })

    const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1

    const restoredVersion = await prisma.fileVersion.create({
      data: {
        user_id: user.id,
        file_id: fileId,
        parent_version_id: version.id,
        version_number: nextVersionNumber,
        version_label: `Restored to v${version.version_number}`,
        description: `Restored from version ${version.version_number}`,
        file_name: version.file_name,
        file_size: version.file_size,
        file_type: version.file_type,
        s3_url: version.s3_url,
        thumbnail_url: version.thumbnail_url,
        operation_type: 'version_restore',
        is_current: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `File restored to version ${version.version_number}`,
      data: {
        versionId: restoredVersion.id,
        versionNumber: restoredVersion.version_number,
        restoredFrom: version.version_number,
      },
    })
  } catch (error) {
    console.error('Restore version error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 })
  }
}

/**
 * DELETE /api/files/[fileId]/versions/[versionId]
 * Delete a specific version (cannot delete current version)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { fileId: string; versionId: string } }
) {
  try {
    const user = await requireUser()
    const { fileId, versionId } = params

    // Verify version exists and user has access
    const version = await prisma.fileVersion.findFirst({
      where: {
        id: versionId,
        file_id: fileId,
        user_id: user.id,
      },
    })

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found or access denied' },
        { status: 404 }
      )
    }

    // Cannot delete current version
    if (version.is_current) {
      return NextResponse.json(
        { error: 'Cannot delete the current version' },
        { status: 400 }
      )
    }

    // Delete version
    await prisma.fileVersion.delete({
      where: { id: versionId },
    })

    return NextResponse.json({
      success: true,
      message: `Version ${version.version_number} deleted`,
    })
  } catch (error) {
    console.error('Delete version error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 })
  }
}

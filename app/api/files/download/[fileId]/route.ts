import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { s3Client } from '@/lib/storage/s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * GET /api/files/download/[fileId]
 * Generate presigned download URL for a file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId } = params

    // Verify file belongs to user
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        user_id: session.user.id,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Generate presigned URL (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: file.s3_key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.name)}"`,
    })

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    })

    // Log download
    await prisma.usage_log.create({
      data: {
        user_id: session.user.id,
        operation_type: 'file_download',
        file_size_processed: file.size,
        credits_used: 0, // Downloads don't consume credits
      },
    })

    return NextResponse.json({
      downloadUrl,
      fileName: file.name,
      fileSize: file.size,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }
}

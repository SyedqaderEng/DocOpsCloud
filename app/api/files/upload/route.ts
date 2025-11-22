import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { s3Client } from '@/lib/storage/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { checkUsageLimit, logUsage } from '@/lib/usage/limits'
import { nanoid } from 'nanoid'

/**
 * POST /api/files/upload
 * Upload file to S3 and create database record
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check usage limits
    const usageCheck = await checkUsageLimit(userId)
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Usage limit exceeded',
          reason: usageCheck.reason,
          remaining: usageCheck.remaining,
        },
        { status: 429 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size based on user tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscription_tier: true },
    })

    const tier = user?.subscription_tier || 'FREE'
    const maxFileSize = {
      FREE: 10 * 1024 * 1024, // 10MB
      PRO: 500 * 1024 * 1024, // 500MB
      BUSINESS: 2 * 1024 * 1024 * 1024, // 2GB
    }[tier]

    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          error: 'File too large',
          maxSize: maxFileSize,
          yourSize: file.size,
        },
        { status: 413 }
      )
    }

    // Generate S3 key
    const fileId = nanoid()
    const ext = file.name.split('.').pop()
    const s3Key = `uploads/${userId}/${fileId}.${ext}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        userId,
        originalName: file.name,
      },
    })

    await s3Client.send(uploadCommand)

    // Create database record
    const fileRecord = await prisma.file.create({
      data: {
        id: fileId,
        user_id: userId,
        name: file.name,
        s3_key: s3Key,
        size: BigInt(file.size),
        mime_type: file.type,
      },
    })

    // Log upload
    await logUsage(userId, 'file_upload', file.size)

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        name: fileRecord.name,
        size: Number(fileRecord.size),
        mimeType: fileRecord.mime_type,
        uploadedAt: fileRecord.created_at,
      },
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/files/upload
 * Get user's uploaded files
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const files = await prisma.file.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        size: true,
        mime_type: true,
        created_at: true,
      },
    })

    return NextResponse.json({
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        size: Number(f.size),
        mimeType: f.mime_type,
        uploadedAt: f.created_at,
      })),
    })
  } catch (error) {
    console.error('Get files error:', error)
    return NextResponse.json({ error: 'Failed to get files' }, { status: 500 })
  }
}

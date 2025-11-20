import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { generatePresignedUploadUrl } from '@/lib/storage/s3'
import {
  createFileRecord,
  getFileTypeFromMime,
  validateFileSize,
  validateFileType,
  getAllowedMimeTypes,
} from '@/lib/storage/upload'
import { getSubscriptionPlan } from '@/lib/config/subscriptions'
import { z } from 'zod'

const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser()

    // Parse and validate request body
    const body = await req.json()
    const validated = uploadRequestSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validated.error.errors },
        { status: 400 }
      )
    }

    const { fileName, fileSize, mimeType } = validated.data

    // Get user's subscription plan
    const plan = getSubscriptionPlan(user.subscription_tier)

    // Validate file size against subscription limits
    if (!validateFileSize(fileSize, plan.limits.maxFileSize)) {
      return NextResponse.json(
        {
          error: `File size exceeds your plan limit of ${plan.limits.maxFileSize / 1024 / 1024}MB`,
          upgradeRequired: true,
        },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = getAllowedMimeTypes()
    if (!validateFileType(mimeType, allowedTypes)) {
      return NextResponse.json(
        {
          error: 'File type not supported',
          allowedTypes,
        },
        { status: 400 }
      )
    }

    // Generate pre-signed upload URL
    const uploadConfig = {
      userId: user.id,
      fileName,
      fileType: mimeType,
      fileSize,
    }

    const { uploadUrl, key, expiresIn } = await generatePresignedUploadUrl(uploadConfig)

    // Determine file type
    const fileType = getFileTypeFromMime(mimeType)

    // Create file record in database
    const fileRecord = await createFileRecord({
      userId: user.id,
      originalName: fileName,
      storedName: key,
      fileType,
      fileSize: BigInt(fileSize),
      mimeType,
      s3Url: '', // Will be updated after upload completes
    })

    return NextResponse.json({
      success: true,
      data: {
        fileId: fileRecord.id,
        uploadUrl,
        key,
        expiresIn,
      },
    })
  } catch (error) {
    console.error('Presigned URL generation error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}

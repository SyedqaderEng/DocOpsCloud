import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import bcrypt from 'bcrypt'

const createShareLinkSchema = z.object({
  fileId: z.string().cuid(),
  expiresIn: z.enum(['1hour', '24hours', '7days', '30days', 'never']),
  password: z.string().optional(),
  maxViews: z.number().int().positive().optional(),
  allowDownload: z.boolean().default(true),
})

/**
 * POST /api/share/create
 * Create a shareable link for a file
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()

    const body = await req.json()
    const validated = createShareLinkSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validated.error.errors },
        { status: 400 }
      )
    }

    const { fileId, expiresIn, password, maxViews, allowDownload } = validated.data

    // Verify file exists and belongs to user
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

    // Calculate expiration date
    const expiresAt = getExpirationDate(expiresIn)

    // Hash password if provided
    let passwordHash: string | undefined = undefined
    if (password) {
      passwordHash = await bcrypt.hash(password, 10)
    }

    // Create share link
    const shareLink = await prisma.shareLink.create({
      data: {
        user_id: user.id,
        file_id: fileId,
        password_hash: passwordHash,
        max_views: maxViews,
        allow_download: allowDownload,
        expires_at: expiresAt,
      },
    })

    // Generate share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareLink.share_id}`

    return NextResponse.json({
      success: true,
      data: {
        shareId: shareLink.share_id,
        shareUrl,
        expiresAt: shareLink.expires_at,
        hasPassword: !!password,
        maxViews: shareLink.max_views,
        allowDownload: shareLink.allow_download,
      },
    })
  } catch (error) {
    console.error('Share link creation error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

/**
 * Calculate expiration date based on duration
 */
function getExpirationDate(duration: string): Date {
  const now = new Date()

  switch (duration) {
    case '1hour':
      return new Date(now.getTime() + 60 * 60 * 1000)
    case '24hours':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case '7days':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case '30days':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    case 'never':
      return new Date('2099-12-31') // Far future date
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Default: 7 days
  }
}

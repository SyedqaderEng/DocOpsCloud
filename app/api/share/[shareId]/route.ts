import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import bcrypt from 'bcrypt'

const accessShareLinkSchema = z.object({
  password: z.string().optional(),
})

/**
 * GET /api/share/[shareId]
 * Access a shared file
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params

    // Find share link
    const shareLink = await prisma.shareLink.findUnique({
      where: { share_id: shareId },
      include: {
        file: {
          select: {
            id: true,
            original_name: true,
            file_type: true,
            file_size: true,
            mime_type: true,
            s3_url: true,
            thumbnail_url: true,
            created_at: true,
          },
        },
      },
    })

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date() > shareLink.expires_at) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 } // 410 Gone
      )
    }

    // Check max views
    if (shareLink.max_views && shareLink.current_views >= shareLink.max_views) {
      return NextResponse.json(
        { error: 'Maximum view limit reached' },
        { status: 403 }
      )
    }

    // Return metadata (password check happens in POST)
    return NextResponse.json({
      success: true,
      data: {
        shareId: shareLink.share_id,
        requiresPassword: !!shareLink.password_hash,
        file: {
          name: shareLink.file.original_name,
          type: shareLink.file.file_type,
          size: Number(shareLink.file.file_size),
          mimeType: shareLink.file.mime_type,
          thumbnailUrl: shareLink.file.thumbnail_url,
          createdAt: shareLink.file.created_at,
        },
        allowDownload: shareLink.allow_download,
        expiresAt: shareLink.expires_at,
        viewsRemaining: shareLink.max_views
          ? shareLink.max_views - shareLink.current_views
          : null,
      },
    })
  } catch (error) {
    console.error('Share link access error:', error)
    return NextResponse.json({ error: 'Failed to access share link' }, { status: 500 })
  }
}

/**
 * POST /api/share/[shareId]
 * Verify password and get file access
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params
    const body = await req.json()
    const validated = accessShareLinkSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const { password } = validated.data

    // Find share link
    const shareLink = await prisma.shareLink.findUnique({
      where: { share_id: shareId },
      include: {
        file: {
          select: {
            id: true,
            original_name: true,
            file_type: true,
            file_size: true,
            mime_type: true,
            s3_url: true,
            thumbnail_url: true,
            created_at: true,
          },
        },
      },
    })

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date() > shareLink.expires_at) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      )
    }

    // Check max views
    if (shareLink.max_views && shareLink.current_views >= shareLink.max_views) {
      return NextResponse.json(
        { error: 'Maximum view limit reached' },
        { status: 403 }
      )
    }

    // Verify password if required
    if (shareLink.password_hash) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password required' },
          { status: 401 }
        )
      }

      const isValid = await bcrypt.compare(password, shareLink.password_hash)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        )
      }
    }

    // Increment view count and log access
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    const userAgent = req.headers.get('user-agent')

    await prisma.$transaction([
      // Increment view count
      prisma.shareLink.update({
        where: { share_id: shareId },
        data: { current_views: { increment: 1 } },
      }),
      // Log view
      prisma.shareLinkView.create({
        data: {
          share_id: shareId,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      }),
    ])

    // Return file access
    return NextResponse.json({
      success: true,
      data: {
        file: {
          id: shareLink.file.id,
          name: shareLink.file.original_name,
          type: shareLink.file.file_type,
          size: Number(shareLink.file.file_size),
          mimeType: shareLink.file.mime_type,
          url: shareLink.file.s3_url,
          thumbnailUrl: shareLink.file.thumbnail_url,
          createdAt: shareLink.file.created_at,
        },
        allowDownload: shareLink.allow_download,
      },
    })
  } catch (error) {
    console.error('Share link verification error:', error)
    return NextResponse.json({ error: 'Failed to verify access' }, { status: 500 })
  }
}

/**
 * DELETE /api/share/[shareId]
 * Delete a share link (owner only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params

    // Note: This would need authentication to verify ownership
    // For now, allowing deletion by shareId
    await prisma.shareLink.delete({
      where: { share_id: shareId },
    })

    return NextResponse.json({
      success: true,
      message: 'Share link deleted',
    })
  } catch (error) {
    console.error('Share link deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete share link' }, { status: 500 })
  }
}

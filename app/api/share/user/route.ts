import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/share/user
 * Get all share links created by the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()

    // Get all share links for user
    const shareLinks = await prisma.shareLink.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      include: {
        file: {
          select: {
            id: true,
            original_name: true,
            file_type: true,
            file_size: true,
            thumbnail_url: true,
          },
        },
      },
    })

    // Get view stats for each share link
    const shareLinkData = await Promise.all(
      shareLinks.map(async (link) => {
        // Get total views for this share link
        const views = await prisma.shareLinkView.findMany({
          where: { share_id: link.share_id },
          orderBy: { viewed_at: 'desc' },
          take: 5, // Last 5 views
        })

        const isActive =
          new Date() < link.expires_at &&
          (!link.max_views || link.current_views < link.max_views)

        const isExpiringSoon =
          isActive &&
          new Date(link.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000 // < 24 hours

        return {
          id: link.id,
          shareId: link.share_id,
          shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/${link.share_id}`,
          file: {
            id: link.file.id,
            name: link.file.original_name,
            type: link.file.file_type,
            size: Number(link.file.file_size),
            thumbnailUrl: link.file.thumbnail_url,
          },
          settings: {
            hasPassword: !!link.password_hash,
            maxViews: link.max_views,
            allowDownload: link.allow_download,
          },
          stats: {
            currentViews: link.current_views,
            viewsRemaining: link.max_views
              ? link.max_views - link.current_views
              : null,
            recentViews: views.map((v) => ({
              viewedAt: v.viewed_at,
              ipAddress: v.ip_address,
              downloaded: v.downloaded,
            })),
          },
          status: {
            isActive,
            isExpired: new Date() >= link.expires_at,
            isMaxViewsReached:
              link.max_views !== null && link.current_views >= link.max_views,
            isExpiringSoon,
          },
          createdAt: link.created_at,
          expiresAt: link.expires_at,
        }
      })
    )

    // Calculate summary statistics
    const totalShares = shareLinkData.length
    const activeShares = shareLinkData.filter((s) => s.status.isActive).length
    const expiredShares = shareLinkData.filter((s) => s.status.isExpired).length
    const totalViews = shareLinkData.reduce((sum, s) => sum + s.stats.currentViews, 0)

    return NextResponse.json({
      success: true,
      data: {
        shareLinks: shareLinkData,
        summary: {
          totalShares,
          activeShares,
          expiredShares,
          totalViews,
        },
      },
    })
  } catch (error) {
    console.error('Share link list error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to get share links' }, { status: 500 })
  }
}

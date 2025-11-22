import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * POST /api/share/[shareId]/download
 * Track when a file is downloaded via share link
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params

    // Find the most recent view for this share link from this session
    // In a real app, you'd use session tokens or other identifiers
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')

    // Find recent view from this IP
    const recentView = await prisma.shareLinkView.findFirst({
      where: {
        share_id: shareId,
        ip_address: ipAddress,
        downloaded: false,
      },
      orderBy: {
        viewed_at: 'desc',
      },
    })

    if (recentView) {
      // Mark as downloaded
      await prisma.shareLinkView.update({
        where: { id: recentView.id },
        data: { downloaded: true },
      })
    } else {
      // Create new view record with download flag
      const userAgent = req.headers.get('user-agent')
      await prisma.shareLinkView.create({
        data: {
          share_id: shareId,
          ip_address: ipAddress,
          user_agent: userAgent,
          downloaded: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Download tracked',
    })
  } catch (error) {
    console.error('Download tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track download' },
      { status: 500 }
    )
  }
}

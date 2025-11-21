// GET /api/integrations/connections - List user's active connections
// DELETE /api/integrations/connections - Disconnect all

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getIntegrationById } from '@/lib/integrations/providers'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const connections = await prisma.integrationConnection.findMany({
      where: {
        user_id: session.user.id,
        status: 'ACTIVE',
      },
      orderBy: {
        connected_at: 'desc',
      },
    })

    // Map connections with integration metadata
    const connectionsWithMetadata = connections.map(conn => {
      const integration = getIntegrationById(conn.provider_id)
      return {
        id: conn.id,
        provider: {
          id: conn.provider_id,
          name: integration?.name || conn.provider_id,
          icon: integration?.icon || '🔗',
          category: integration?.category,
        },
        connectedAt: conn.connected_at,
        lastUsedAt: conn.last_used_at,
        status: conn.status,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        connections: connectionsWithMetadata,
        totalCount: connectionsWithMetadata.length,
      },
    })
  } catch (error) {
    console.error('List connections error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list connections' },
      { status: 500 }
    )
  }
}

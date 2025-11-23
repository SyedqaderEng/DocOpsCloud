// GET /api/integrations - List all available integrations
// GET /api/integrations?category=cloud_storage - Filter by category

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllIntegrations, getIntegrationsByCategory } from '@/lib/integrations/providers'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Get all available integrations
    const integrations = category
      ? getIntegrationsByCategory(category)
      : getAllIntegrations()

    // Get user's active connections
    const connections = await prisma.integrationConnection.findMany({
      where: {
        user_id: session.user.id,
        status: 'ACTIVE',
      },
      select: {
        provider_id: true,
        connected_at: true,
        last_used_at: true,
      },
    })

    // Map connections to integrations
    const connectionsMap = new Map(
      connections.map(c => [c.provider_id, c])
    )

    // Add connection status to each integration
    const integrationsWithStatus = integrations.map(integration => ({
      ...integration,
      provider: undefined, // Don't expose provider instance
      isConnected: connectionsMap.has(integration.id),
      connectedAt: connectionsMap.get(integration.id)?.connected_at || null,
      lastUsedAt: connectionsMap.get(integration.id)?.last_used_at || null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        integrations: integrationsWithStatus,
        totalCount: integrationsWithStatus.length,
        connectedCount: connections.length,
      },
    })
  } catch (error) {
    console.error('List integrations error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list integrations' },
      { status: 500 }
    )
  }
}

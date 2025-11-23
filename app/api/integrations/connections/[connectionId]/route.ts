// GET /api/integrations/connections/{id} - Get connection details
// DELETE /api/integrations/connections/{id} - Disconnect integration

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { getIntegrationById } from '@/lib/integrations/providers'

export async function GET(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { connectionId } = params

    const connection = await prisma.integrationConnection.findFirst({
      where: {
        id: connectionId,
        user_id: session.user.id,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      )
    }

    const integration = getIntegrationById(connection.provider_id)

    return NextResponse.json({
      success: true,
      data: {
        id: connection.id,
        provider: {
          id: connection.provider_id,
          name: integration?.name || connection.provider_id,
          icon: integration?.icon || '🔗',
          category: integration?.category,
          features: integration?.features || [],
        },
        connectedAt: connection.connected_at,
        lastUsedAt: connection.last_used_at,
        status: connection.status,
      },
    })
  } catch (error) {
    console.error('Get connection error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get connection' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { connectionId } = params

    // Verify ownership
    const connection = await prisma.integrationConnection.findFirst({
      where: {
        id: connectionId,
        user_id: session.user.id,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      )
    }

    // Delete connection (this also deletes encrypted credentials)
    await prisma.integrationConnection.delete({
      where: {
        id: connectionId,
      },
    })

    // Log disconnection in audit log
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'INTEGRATION_DISCONNECTED',
        resource_type: 'INTEGRATION',
        resource_id: connection.provider_id,
        metadata: {
          provider: connection.provider_id,
          connectionId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Integration disconnected successfully',
    })
  } catch (error) {
    console.error('Delete connection error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect integration' },
      { status: 500 }
    )
  }
}

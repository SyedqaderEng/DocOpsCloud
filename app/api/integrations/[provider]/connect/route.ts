// POST /api/integrations/{provider}/connect - Initiate OAuth connection

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getIntegrationById } from '@/lib/integrations/providers'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { provider } = params

    // Get integration metadata
    const integration = getIntegrationById(provider)
    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
        { status: 404 }
      )
    }

    // Generate unique state for CSRF protection
    const state = `${session.user.id}:${provider}:${Date.now()}:${Math.random().toString(36).substring(7)}`

    // Store state in database for verification
    await prisma.integrationConnection.upsert({
      where: {
        user_id_provider_id: {
          user_id: session.user.id,
          provider_id: provider,
        },
      },
      create: {
        user_id: session.user.id,
        provider_id: provider,
        status: 'PENDING',
        oauth_state: state,
      },
      update: {
        status: 'PENDING',
        oauth_state: state,
      },
    })

    // Generate authorization URL
    const authUrl = integration.provider.generateAuthUrl(state)

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        provider: integration.name,
      },
    })
  } catch (error) {
    console.error('Connect integration error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initiate connection' },
      { status: 500 }
    )
  }
}

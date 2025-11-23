// GET /api/integrations/{provider}/callback - Handle OAuth callback

import { NextRequest, NextResponse } from 'next/server'
import { getIntegrationById } from '@/lib/integrations/providers'
import { prisma } from '@/lib/db/prisma'
import { CredentialEncryption } from '@/lib/integrations/oauth/provider'

const encryption = new CredentialEncryption()

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth error
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=invalid_request`
      )
    }

    const { provider } = params

    // Get integration metadata
    const integration = getIntegrationById(provider)
    if (!integration) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=integration_not_found`
      )
    }

    // Extract user ID from state
    const [userId] = state.split(':')

    // Verify state matches stored state
    const connection = await prisma.integrationConnection.findUnique({
      where: {
        user_id_provider_id: {
          user_id: userId,
          provider_id: provider,
        },
      },
    })

    if (!connection || connection.oauth_state !== state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=invalid_state`
      )
    }

    // Exchange code for tokens
    const tokens = await integration.provider.exchangeCodeForTokens(code)

    // Encrypt credentials
    const encryptedTokens = encryption.encrypt({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      ...(tokens.instance_url && { instance_url: tokens.instance_url }),
    })

    // Store encrypted credentials
    await prisma.integrationConnection.update({
      where: {
        user_id_provider_id: {
          user_id: userId,
          provider_id: provider,
        },
      },
      data: {
        status: 'ACTIVE',
        encrypted_credentials: encryptedTokens,
        connected_at: new Date(),
        oauth_state: null, // Clear state after successful connection
      },
    })

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?success=true&provider=${encodeURIComponent(integration.name)}`
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=connection_failed`
    )
  }
}

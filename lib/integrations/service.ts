// Integration Service - Helper functions for managing integration connections

import { prisma } from '@/lib/prisma'
import { getIntegrationById } from './providers'
import { CredentialEncryption } from './oauth/provider'

const encryption = new CredentialEncryption()

interface DecryptedCredentials {
  access_token: string
  refresh_token?: string
  expires_at?: Date
  instance_url?: string
}

/**
 * Get valid access token for a user's integration connection
 * Automatically refreshes token if expired
 */
export async function getAccessToken(
  userId: string,
  providerId: string
): Promise<{ accessToken: string; instanceUrl?: string }> {
  const connection = await prisma.integrationConnection.findUnique({
    where: {
      user_id_provider_id: {
        user_id: userId,
        provider_id: providerId,
      },
    },
  })

  if (!connection || connection.status !== 'ACTIVE') {
    throw new Error(`No active connection found for provider: ${providerId}`)
  }

  // Decrypt credentials
  const credentials: DecryptedCredentials = encryption.decrypt(
    connection.encrypted_credentials
  )

  const integration = getIntegrationById(providerId)
  if (!integration) {
    throw new Error(`Integration not found: ${providerId}`)
  }

  // Check if token is expired
  if (credentials.expires_at && integration.provider.isTokenExpired(credentials.expires_at)) {
    // Token is expired, refresh it
    if (!credentials.refresh_token) {
      // No refresh token available, mark connection as expired
      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { status: 'EXPIRED' },
      })
      throw new Error('Access token expired and no refresh token available')
    }

    // Refresh the token
    const newTokens = await integration.provider.refreshAccessToken(
      credentials.refresh_token
    )

    // Update stored credentials
    const updatedCredentials = {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || credentials.refresh_token,
      expires_at: newTokens.expires_at,
      ...(credentials.instance_url && { instance_url: credentials.instance_url }),
    }

    const encryptedTokens = encryption.encrypt(updatedCredentials)

    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        encrypted_credentials: encryptedTokens,
        last_used_at: new Date(),
      },
    })

    return {
      accessToken: newTokens.access_token,
      instanceUrl: credentials.instance_url,
    }
  }

  // Token is still valid, update last used timestamp
  await prisma.integrationConnection.update({
    where: { id: connection.id },
    data: { last_used_at: new Date() },
  })

  return {
    accessToken: credentials.access_token,
    instanceUrl: credentials.instance_url,
  }
}

/**
 * Check if user has an active connection for a provider
 */
export async function hasActiveConnection(
  userId: string,
  providerId: string
): Promise<boolean> {
  const connection = await prisma.integrationConnection.findUnique({
    where: {
      user_id_provider_id: {
        user_id: userId,
        provider_id: providerId,
      },
    },
  })

  return connection?.status === 'ACTIVE'
}

/**
 * Get all active connections for a user
 */
export async function getUserConnections(userId: string) {
  const connections = await prisma.integrationConnection.findMany({
    where: {
      user_id: userId,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      provider_id: true,
      connected_at: true,
      last_used_at: true,
    },
  })

  return connections.map(conn => {
    const integration = getIntegrationById(conn.provider_id)
    return {
      id: conn.id,
      providerId: conn.provider_id,
      providerName: integration?.name || conn.provider_id,
      category: integration?.category,
      connectedAt: conn.connected_at,
      lastUsedAt: conn.last_used_at,
    }
  })
}

/**
 * Disconnect an integration
 */
export async function disconnectIntegration(
  userId: string,
  providerId: string
): Promise<void> {
  await prisma.integrationConnection.delete({
    where: {
      user_id_provider_id: {
        user_id: userId,
        provider_id: providerId,
      },
    },
  })

  // Log disconnection
  await prisma.auditLog.create({
    data: {
      user_id: userId,
      action: 'INTEGRATION_DISCONNECTED',
      resource_type: 'INTEGRATION',
      resource_id: providerId,
      metadata: {
        provider: providerId,
        timestamp: new Date().toISOString(),
      },
    },
  })
}

/**
 * Execute an integration action with automatic token management
 */
export async function executeIntegrationAction<T>(
  userId: string,
  providerId: string,
  action: (accessToken: string, instanceUrl?: string) => Promise<T>
): Promise<T> {
  try {
    const { accessToken, instanceUrl } = await getAccessToken(userId, providerId)
    const result = await action(accessToken, instanceUrl)

    // Log successful action
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'INTEGRATION_ACTION',
        resource_type: 'INTEGRATION',
        resource_id: providerId,
        metadata: {
          provider: providerId,
          success: true,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return result
  } catch (error) {
    // Log failed action
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'INTEGRATION_ACTION',
        resource_type: 'INTEGRATION',
        resource_id: providerId,
        metadata: {
          provider: providerId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
    })

    throw error
  }
}

/**
 * Get integration usage statistics
 */
export async function getIntegrationStats(userId: string, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const logs = await prisma.auditLog.findMany({
    where: {
      user_id: userId,
      action: 'INTEGRATION_ACTION',
      created_at: {
        gte: startDate,
      },
    },
    select: {
      resource_id: true,
      metadata: true,
      created_at: true,
    },
  })

  // Group by provider
  const statsByProvider: Record<string, {
    totalCalls: number
    successfulCalls: number
    failedCalls: number
    lastUsed: Date
  }> = {}

  logs.forEach(log => {
    const provider = log.resource_id
    if (!statsByProvider[provider]) {
      statsByProvider[provider] = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        lastUsed: log.created_at,
      }
    }

    statsByProvider[provider].totalCalls++
    const metadata = log.metadata as any
    if (metadata.success) {
      statsByProvider[provider].successfulCalls++
    } else {
      statsByProvider[provider].failedCalls++
    }

    if (log.created_at > statsByProvider[provider].lastUsed) {
      statsByProvider[provider].lastUsed = log.created_at
    }
  })

  return statsByProvider
}

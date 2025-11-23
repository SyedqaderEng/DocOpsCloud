// Key Rotation System

import { prisma } from '@/lib/db/prisma'
import { encryption } from './encryption'

export interface KeyRotationStatus {
  totalRecords: number
  rotatedRecords: number
  failedRecords: number
  progress: number
  startTime: Date
  endTime?: Date
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

export class KeyRotationService {
  private rotationStatus: KeyRotationStatus | null = null

  /**
   * Start key rotation process
   * Rotates all encrypted data to use the new key version
   */
  async startKeyRotation(): Promise<void> {
    if (this.rotationStatus && this.rotationStatus.status === 'IN_PROGRESS') {
      throw new Error('Key rotation already in progress')
    }

    this.rotationStatus = {
      totalRecords: 0,
      rotatedRecords: 0,
      failedRecords: 0,
      progress: 0,
      startTime: new Date(),
      status: 'IN_PROGRESS',
    }

    try {
      // Rotate integration credentials
      await this.rotateIntegrationCredentials()

      // Rotate SSO configurations
      await this.rotateSSOConfigurations()

      // Rotate API keys (if encrypted)
      await this.rotateApiKeys()

      // Rotate any other encrypted data
      // Add more tables as needed

      this.rotationStatus.status = 'COMPLETED'
      this.rotationStatus.endTime = new Date()
    } catch (error) {
      this.rotationStatus.status = 'FAILED'
      this.rotationStatus.endTime = new Date()
      throw error
    }
  }

  /**
   * Get current rotation status
   */
  getRotationStatus(): KeyRotationStatus | null {
    return this.rotationStatus
  }

  /**
   * Rotate integration connection credentials
   */
  private async rotateIntegrationCredentials(): Promise<void> {
    const connections = await prisma.integrationConnection.findMany({
      where: {
        encrypted_credentials: {
          not: null,
        },
      },
    })

    this.rotationStatus!.totalRecords += connections.length

    for (const connection of connections) {
      try {
        if (!connection.encrypted_credentials) continue

        // Re-encrypt with new key
        const reencrypted = encryption.reencrypt(connection.encrypted_credentials)

        await prisma.integrationConnection.update({
          where: { id: connection.id },
          data: {
            encrypted_credentials: reencrypted,
          },
        })

        this.rotationStatus!.rotatedRecords++
      } catch (error) {
        console.error(`Failed to rotate credentials for connection ${connection.id}:`, error)
        this.rotationStatus!.failedRecords++
      }

      this.updateProgress()
    }
  }

  /**
   * Rotate SSO configuration secrets
   */
  private async rotateSSOConfigurations(): Promise<void> {
    const configs = await prisma.sSOConfiguration.findMany({
      where: {
        OR: [
          { certificate: { not: null } },
          { client_secret: { not: null } },
        ],
      },
    })

    this.rotationStatus!.totalRecords += configs.length

    for (const config of configs) {
      try {
        const updates: any = {}

        if (config.certificate) {
          updates.certificate = encryption.reencrypt(config.certificate)
        }

        if (config.client_secret) {
          updates.client_secret = encryption.reencrypt(config.client_secret)
        }

        if (Object.keys(updates).length > 0) {
          await prisma.sSOConfiguration.update({
            where: { id: config.id },
            data: updates,
          })
        }

        this.rotationStatus!.rotatedRecords++
      } catch (error) {
        console.error(`Failed to rotate SSO config ${config.id}:`, error)
        this.rotationStatus!.failedRecords++
      }

      this.updateProgress()
    }
  }

  /**
   * Rotate API keys (if they are encrypted)
   */
  private async rotateApiKeys(): Promise<void> {
    // If API keys are stored in encrypted form, rotate them
    // This is a placeholder - implement based on your API key storage
    const apiKeys = await prisma.apiKey.findMany()

    this.rotationStatus!.totalRecords += apiKeys.length

    for (const apiKey of apiKeys) {
      try {
        // If API key is encrypted, re-encrypt it
        // For now, we'll skip as API keys are typically hashed, not encrypted

        this.rotationStatus!.rotatedRecords++
      } catch (error) {
        console.error(`Failed to rotate API key ${apiKey.id}:`, error)
        this.rotationStatus!.failedRecords++
      }

      this.updateProgress()
    }
  }

  /**
   * Update rotation progress
   */
  private updateProgress(): void {
    if (!this.rotationStatus) return

    const total = this.rotationStatus.totalRecords
    const processed = this.rotationStatus.rotatedRecords + this.rotationStatus.failedRecords

    this.rotationStatus.progress = total > 0 ? (processed / total) * 100 : 0
  }

  /**
   * Schedule automatic key rotation
   * Should be run periodically (e.g., every 90 days)
   */
  async scheduleRotation(intervalDays: number = 90): Promise<void> {
    const lastRotation = this.rotationStatus?.endTime

    if (!lastRotation) {
      // No previous rotation, schedule immediately
      await this.startKeyRotation()
      return
    }

    const daysSinceRotation = Math.floor(
      (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceRotation >= intervalDays) {
      console.log(`Starting scheduled key rotation (${daysSinceRotation} days since last rotation)`)
      await this.startKeyRotation()
    }
  }

  /**
   * Verify all encrypted data can be decrypted
   */
  async verifyEncryption(): Promise<{
    verified: number
    failed: Array<{ table: string; id: string; error: string }>
  }> {
    const failed: Array<{ table: string; id: string; error: string }> = []
    let verified = 0

    // Verify integration credentials
    const connections = await prisma.integrationConnection.findMany({
      where: { encrypted_credentials: { not: null } },
    })

    for (const conn of connections) {
      try {
        if (conn.encrypted_credentials) {
          encryption.decrypt(conn.encrypted_credentials)
          verified++
        }
      } catch (error) {
        failed.push({
          table: 'integration_connections',
          id: conn.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Verify SSO configurations
    const ssoConfigs = await prisma.sSOConfiguration.findMany({
      where: {
        OR: [
          { certificate: { not: null } },
          { client_secret: { not: null } },
        ],
      },
    })

    for (const config of ssoConfigs) {
      try {
        if (config.certificate) {
          encryption.decrypt(config.certificate)
          verified++
        }
        if (config.client_secret) {
          encryption.decrypt(config.client_secret)
          verified++
        }
      } catch (error) {
        failed.push({
          table: 'sso_configurations',
          id: config.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return { verified, failed }
  }
}

export const keyRotation = new KeyRotationService()
